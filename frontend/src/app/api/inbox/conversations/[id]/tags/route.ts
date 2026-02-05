import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

// POST - Adicionar tag à conversa
export async function POST(
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
      select: { id: true, tenantId: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { tagId } = body;

    // Verificar se conversa pertence ao tenant
    const conversation = await prisma.conversation.findFirst({
      where: { id: params.id, tenantId: user.tenantId },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Adicionar tag
    const conversationTag = await prisma.conversationTag.create({
      data: {
        conversationId: params.id,
        tagId,
        assignedById: user.id,
      },
      include: { tag: true },
    });

    // Criar atividade
    await prisma.conversationActivity.create({
      data: {
        conversationId: params.id,
        type: "TAG_ADDED",
        title: `Etiqueta "${conversationTag.tag.name}" adicionada`,
        performedById: user.id,
      },
    });

    return NextResponse.json(conversationTag);
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Tag already added" }, { status: 400 });
    }
    console.error("[Conversation Tags] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
