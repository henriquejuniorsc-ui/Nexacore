import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { chatWithCustomerAI } from "@/services/ai-service";

interface ChatwootWebhookPayload {
  event: string;
  id: number;
  account: {
    id: number;
    name: string;
  };
  conversation: {
    id: number;
    status: string;
    messages_count: number;
    additional_attributes?: {
      browser?: object;
    };
  };
  message?: {
    id: number;
    content: string;
    message_type: string;
    content_type: string;
    private: boolean;
    sender?: {
      id: number;
      name: string;
      phone_number?: string;
      type: string;
    };
  };
  sender?: {
    id: number;
    name: string;
    phone_number?: string;
  };
}

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const payload: ChatwootWebhookPayload = await request.json();

    console.log(`[Chatwoot Webhook] Event: ${payload.event} for tenant: ${slug}`);

    // Find tenant by slug
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
    });

    if (!tenant) {
      console.error(`Tenant not found: ${slug}`);
      return NextResponse.json(
        { error: "Tenant não encontrado" },
        { status: 404 }
      );
    }

    // Only process incoming messages
    if (payload.event !== "message_created") {
      return NextResponse.json({ success: true, message: "Event ignored" });
    }

    // Ignore outgoing messages and private messages
    if (
      !payload.message ||
      payload.message.message_type !== "incoming" ||
      payload.message.private
    ) {
      return NextResponse.json({ success: true, message: "Message ignored" });
    }

    const message = payload.message;
    const senderPhone = message.sender?.phone_number || payload.sender?.phone_number;
    const senderName = message.sender?.name || payload.sender?.name || "Cliente";
    const content = message.content;

    if (!senderPhone || !content) {
      return NextResponse.json({ success: true, message: "Invalid message" });
    }

    // Check if AI is enabled for this tenant
    if (!tenant.aiEnabled) {
      console.log(`AI disabled for tenant: ${tenant.name}`);
      return NextResponse.json({ success: true, message: "AI disabled" });
    }

    // Find or create client
    let client = await prisma.client.findUnique({
      where: {
        tenantId_phone: {
          tenantId: tenant.id,
          phone: senderPhone,
        },
      },
    });

    if (!client) {
      client = await prisma.client.create({
        data: {
          tenantId: tenant.id,
          phone: senderPhone,
          name: senderName,
          chatwootContactId: String(message.sender?.id || payload.sender?.id),
        },
      });
    }

    // Get conversation history for context
    const recentMessages = await prisma.message.findMany({
      where: {
        tenantId: tenant.id,
        clientId: client.id,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const conversationHistory = recentMessages
      .reverse()
      .map((m) => ({
        role: m.role === "HUMAN" ? "user" : "assistant",
        content: m.content,
      }));

    // Save incoming message
    await prisma.message.create({
      data: {
        tenantId: tenant.id,
        clientId: client.id,
        content,
        role: "HUMAN",
        chatwootMessageId: String(message.id),
        chatwootConversationId: String(payload.conversation.id),
      },
    });

    // Generate AI response
    const aiResponse = await chatWithCustomerAI(
      tenant.id,
      senderPhone,
      senderName,
      content,
      conversationHistory as any
    );

    // Save AI response
    await prisma.message.create({
      data: {
        tenantId: tenant.id,
        clientId: client.id,
        content: aiResponse,
        role: "ASSISTANT",
        chatwootConversationId: String(payload.conversation.id),
      },
    });

    // Send response to Chatwoot
    if (tenant.chatwootUrl && tenant.chatwootApiKey) {
      await sendChatwootMessage(
        tenant.chatwootUrl,
        tenant.chatwootApiKey,
        tenant.chatwootAccountId!,
        String(payload.conversation.id),
        aiResponse
      );
    }

    return NextResponse.json({
      success: true,
      message: "Message processed",
    });

  } catch (error) {
    console.error("Chatwoot Webhook Error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

async function sendChatwootMessage(
  baseUrl: string,
  apiKey: string,
  accountId: string,
  conversationId: string,
  content: string
): Promise<void> {
  const url = `${baseUrl}/api/v1/accounts/${accountId}/conversations/${conversationId}/messages`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api_access_token": apiKey,
    },
    body: JSON.stringify({
      content,
      message_type: "outgoing",
      private: false,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Failed to send Chatwoot message:", error);
    throw new Error(`Chatwoot API error: ${response.status}`);
  }
}
