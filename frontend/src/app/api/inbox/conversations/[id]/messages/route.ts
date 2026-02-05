import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/services/evolution-service";

// =============================================================================
// POST - Enviar mensagem manual (atendimento humano)
// =============================================================================
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
      select: { id: true, tenantId: true, name: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    // Buscar conversa
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: params.id,
        tenantId: user.tenantId,
      },
      include: {
        client: true,
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Verificar se é cliente @lid sem número real
    const isLidClient = conversation.client.phone.startsWith("lid:");
    let phoneToSend = conversation.client.phone;

    if (isLidClient) {
      // Tentar buscar número real nas mensagens anteriores (remoteJidAlt)
      const msgWithPhone = await prisma.message.findFirst({
        where: {
          conversationId: conversation.id,
          role: "HUMAN",
          NOT: {
            metadata: {
              path: ["canReply"],
              equals: false,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const metadata = msgWithPhone?.metadata as Record<string, unknown> | null;

      // Verificar se temos remoteJidAlt com número real
      if (metadata?.remoteJidAlt) {
        const altJid = metadata.remoteJidAlt as string;
        if (altJid.includes("@s.whatsapp.net")) {
          phoneToSend = altJid.replace("@s.whatsapp.net", "");
          console.log(`[Inbox] Resolved LID to phone via remoteJidAlt: ${phoneToSend}`);
        }
      }

      // Se ainda é LID, não podemos enviar
      if (phoneToSend.startsWith("lid:")) {
        return NextResponse.json({
          error: "Não é possível enviar mensagem para este cliente. O número de telefone ainda não foi identificado. Aguarde o cliente enviar uma nova mensagem ou responda manualmente pelo WhatsApp Business App."
        }, { status: 400 });
      }
    }

    // Enviar mensagem via WhatsApp
    const result = await sendWhatsAppMessage(
      user.tenantId,
      phoneToSend,
      content
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Se conseguimos enviar e era cliente LID, atualizar o telefone
    if (isLidClient && phoneToSend !== conversation.client.phone) {
      await prisma.client.update({
        where: { id: conversation.client.id },
        data: {
          phone: phoneToSend,
          notes: conversation.client.notes?.replace(
            "⚠️ Cliente WhatsApp sem número identificado. Aguardando próxima mensagem para identificar número real.",
            `✅ Número identificado: ${phoneToSend}`
          ),
        },
      });
      console.log(`[Inbox] Updated LID client phone: ${phoneToSend}`);
    }

    // Salvar mensagem no banco
    const message = await prisma.message.create({
      data: {
        tenantId: user.tenantId,
        clientId: conversation.clientId,
        conversationId: conversation.id,
        content,
        role: "ASSISTANT",
        metadata: {
          messageId: result.messageId,
          sentBy: user.id,
          sentByName: user.name,
          senderType: "HUMAN",
        },
      },
    });

    // Atualizar conversa
    await prisma.conversation.update({
      where: { id: params.id },
      data: {
        messageCount: { increment: 1 },
        lastMessageAt: new Date(),
        lastMessagePreview: content.slice(0, 100),
        status: "OPEN", // Reabrir se estava pendente
      },
    });

    // Criar atividade
    await prisma.conversationActivity.create({
      data: {
        conversationId: params.id,
        type: "MESSAGE_SENT",
        title: "Mensagem enviada manualmente",
        description: `${user.name} enviou uma mensagem`,
        performedById: user.id,
      },
    });

    // Retornar no formato esperado pelo frontend
    return NextResponse.json({
      message: {
        id: message.id,
        content: message.content,
        direction: "OUTBOUND",
        senderType: "HUMAN",
        status: "SENT",
        createdAt: message.createdAt.toISOString(),
      }
    });
  } catch (error) {
    console.error("[Message API] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// =============================================================================
// GET - Listar mensagens da conversa
// =============================================================================
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

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const limit = parseInt(searchParams.get("limit") || "50");

    const messages = await prisma.message.findMany({
      where: {
        conversationId: params.id,
        tenant: { id: user.tenantId },
      },
      take: limit + 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: "desc" },
    });

    const hasMore = messages.length > limit;
    const data = hasMore ? messages.slice(0, -1) : messages;

    // Transformar para o formato esperado pelo frontend
    const formattedMessages = data.reverse().map((msg) => {
      // Determinar direction baseado no role
      const direction = msg.role === "HUMAN" ? "INBOUND" : "OUTBOUND";

      // Determinar senderType
      let senderType: "CLIENT" | "AI" | "HUMAN" = "CLIENT";
      if (msg.role === "ASSISTANT") {
        const metadata = msg.metadata as Record<string, unknown> | null;
        if (metadata?.senderType === "HUMAN" || metadata?.sentBy) {
          senderType = "HUMAN";
        } else {
          senderType = "AI";
        }
      }

      // Determinar status
      let status = "SENT";
      const metadata = msg.metadata as Record<string, unknown> | null;
      if (metadata?.status) {
        status = metadata.status as string;
      } else if (metadata?.messageId) {
        status = "DELIVERED";
      }

      return {
        id: msg.id,
        content: msg.content,
        direction,
        senderType,
        status,
        createdAt: msg.createdAt.toISOString(),
      };
    });

    return NextResponse.json({
      messages: formattedMessages,
      nextCursor: hasMore ? data[0]?.id : null,
      hasMore,
    });
  } catch (error) {
    console.error("[Message API] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
