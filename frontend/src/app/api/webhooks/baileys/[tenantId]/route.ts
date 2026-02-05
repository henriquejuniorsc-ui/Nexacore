import { NextRequest, NextResponse } from "next/server";
import { handleBaileysWebhook, sendTextMessage } from "@/services/baileys-service";
import { chatWithCustomerAI } from "@/services/ai-service";
import prisma from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  try {
    const { tenantId } = params;
    const payload = await request.json();

    console.log(`[Baileys Webhook] Received for tenant: ${tenantId}`, payload.event);

    // Verificar se o tenant existe
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      console.error(`[Baileys Webhook] Tenant not found: ${tenantId}`);
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Processar o webhook
    const result = await handleBaileysWebhook(tenantId, payload);

    if (!result.shouldReply || !result.replyTo || !result.message) {
      return NextResponse.json({ success: true, action: "ignored" });
    }

    // Buscar cliente para contexto
    const client = await prisma.client.findFirst({
      where: {
        tenantId,
        phone: { contains: result.replyTo.slice(-11) },
      },
    });

    if (!client) {
      return NextResponse.json({ success: true, action: "client_not_found" });
    }

    // Buscar histórico de conversas para contexto
    const recentMessages = await prisma.message.findMany({
      where: {
        tenantId,
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

    // Gerar resposta com IA
    const aiResponse = await chatWithCustomerAI(
      tenantId,
      result.replyTo,
      client.name,
      result.message,
      conversationHistory as any
    );

    // Enviar resposta
    const sendResult = await sendTextMessage(tenantId, result.replyTo, aiResponse);

    if (sendResult.success) {
      // Salvar resposta no banco
      await prisma.message.create({
        data: {
          tenantId,
          clientId: client.id,
          content: aiResponse,
          role: "ASSISTANT",
          metadata: { messageId: sendResult.messageId },
        },
      });
    }

    return NextResponse.json({
      success: true,
      action: "replied",
      messageId: sendResult.messageId,
    });

  } catch (error) {
    console.error("[Baileys Webhook] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Baileys também pode enviar GET para verificação
export async function GET(request: NextRequest) {
  return NextResponse.json({ status: "ok", service: "nexacore-baileys-webhook" });
}
