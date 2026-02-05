import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

// GET - Buscar conversa específica com mensagens
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findFirst({
      where: { clerkUserId: userId },
      select: { tenantId: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const conversation = await prisma.conversation.findFirst({
      where: {
        id: params.id,
        tenantId: user.tenantId,
      },
      include: {
        client: true,
        tags: {
          include: { tag: true },
        },
        assignedTo: {
          select: { id: true, name: true, avatar: true },
        },
        notes: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        activities: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Buscar mensagens
    const messages = await prisma.message.findMany({
      where: { conversationId: params.id },
      orderBy: { createdAt: "asc" },
      take: 100,
    });

    // Marcar como lida (zerar unreadCount)
    if (conversation.unreadCount > 0) {
      await prisma.conversation.update({
        where: { id: params.id },
        data: { unreadCount: 0 },
      });
    }

    return NextResponse.json({
      ...conversation,
      messages,
    });
  } catch (error) {
    console.error("[Inbox API] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// PATCH - Atualizar conversa (status, atribuição, IA)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findFirst({
      where: { clerkUserId: userId },
      select: { id: true, tenantId: true, name: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { status, assignedToId, aiEnabled } = body;

    // Verificar se conversa pertence ao tenant
    const existing = await prisma.conversation.findFirst({
      where: {
        id: params.id,
        tenantId: user.tenantId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Preparar dados de atualização
    const updateData: any = {};
    const activities: any[] = [];

    if (status && status !== existing.status) {
      updateData.status = status;
      activities.push({
        conversationId: params.id,
        type: "STATUS_CHANGED",
        title: `Status alterado para ${status}`,
        performedById: user.id,
      });
    }

    if (assignedToId !== undefined) {
      updateData.assignedToId = assignedToId;
      activities.push({
        conversationId: params.id,
        type: assignedToId ? "ASSIGNED" : "UNASSIGNED",
        title: assignedToId ? "Conversa atribuída" : "Atribuição removida",
        performedById: user.id,
      });
    }

    if (aiEnabled !== undefined && aiEnabled !== existing.aiEnabled) {
      updateData.aiEnabled = aiEnabled;
      activities.push({
        conversationId: params.id,
        type: aiEnabled ? "AI_ENABLED" : "AI_DISABLED",
        title: aiEnabled ? "IA ativada" : "IA desativada (atendimento humano)",
        performedById: user.id,
      });
    }

    // Atualizar conversa e criar atividades
    const [conversation] = await prisma.$transaction([
      prisma.conversation.update({
        where: { id: params.id },
        data: updateData,
        include: {
          client: true,
          tags: { include: { tag: true } },
          assignedTo: { select: { id: true, name: true, avatar: true } },
        },
      }),
      ...(activities.length > 0
        ? [prisma.conversationActivity.createMany({ data: activities })]
        : []),
    ]);

    return NextResponse.json(conversation);
  } catch (error) {
    console.error("[Inbox API] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
