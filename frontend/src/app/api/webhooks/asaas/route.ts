import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface AsaasWebhookPayload {
  event: string;
  payment: {
    id: string;
    customer: string;
    value: number;
    netValue: number;
    billingType: string;
    status: string;
    dueDate: string;
    paymentDate?: string;
    invoiceUrl?: string;
    bankSlipUrl?: string;
    pixQrCode?: string;
    pixKey?: string;
    externalReference?: string;
    description?: string;
  };
}

// Map Asaas status to our PaymentStatus
function mapPaymentStatus(asaasStatus: string): string {
  const statusMap: { [key: string]: string } = {
    PENDING: "PENDING",
    RECEIVED: "RECEIVED",
    CONFIRMED: "CONFIRMED",
    OVERDUE: "OVERDUE",
    REFUNDED: "REFUNDED",
    RECEIVED_IN_CASH: "RECEIVED",
    REFUND_REQUESTED: "PENDING",
    CHARGEBACK_REQUESTED: "PENDING",
    CHARGEBACK_DISPUTE: "PENDING",
    AWAITING_CHARGEBACK_REVERSAL: "PENDING",
    DUNNING_REQUESTED: "OVERDUE",
    DUNNING_RECEIVED: "RECEIVED",
    AWAITING_RISK_ANALYSIS: "PENDING",
  };

  return statusMap[asaasStatus] || "PENDING";
}

export async function POST(request: NextRequest) {
  try {
    const payload: AsaasWebhookPayload = await request.json();
    
    console.log(`[Asaas Webhook] Event: ${payload.event}`);

    // Verify webhook token (optional but recommended)
    const webhookToken = request.headers.get("asaas-webhook-token");
    const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN;

    if (expectedToken && webhookToken !== expectedToken) {
      console.error("[Asaas Webhook] Invalid token");
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    // Only process payment events
    if (!payload.event.startsWith("PAYMENT_")) {
      return NextResponse.json({ success: true, message: "Event ignored" });
    }

    const asaasPayment = payload.payment;

    // Find payment by Asaas ID
    let payment = await prisma.payment.findFirst({
      where: { asaasPaymentId: asaasPayment.id },
      include: { client: true, tenant: true },
    });

    // If not found by asaasPaymentId, try externalReference
    if (!payment && asaasPayment.externalReference) {
      payment = await prisma.payment.findUnique({
        where: { id: asaasPayment.externalReference },
        include: { client: true, tenant: true },
      });
    }

    if (!payment) {
      console.log(`[Asaas Webhook] Payment not found: ${asaasPayment.id}`);
      return NextResponse.json({ success: true, message: "Payment not found" });
    }

    // Update payment status
    const newStatus = mapPaymentStatus(asaasPayment.status);
    
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: newStatus as any,
        asaasPaymentId: asaasPayment.id,
        invoiceUrl: asaasPayment.invoiceUrl || payment.invoiceUrl,
        pixQrCode: asaasPayment.pixQrCode || payment.pixQrCode,
        pixCode: asaasPayment.pixKey || payment.pixCode,
        paidAt: asaasPayment.paymentDate 
          ? new Date(asaasPayment.paymentDate) 
          : payment.paidAt,
      },
    });

    console.log(`[Asaas Webhook] Updated payment ${payment.id} to ${newStatus}`);

    // If payment confirmed/received, update related appointment
    if (["CONFIRMED", "RECEIVED"].includes(newStatus) && payment.appointmentId) {
      await prisma.appointment.update({
        where: { id: payment.appointmentId },
        data: { status: "CONFIRMED" },
      });
    }

    // Send confirmation to client via Chatwoot
    if (["CONFIRMED", "RECEIVED"].includes(newStatus)) {
      const tenant = payment.tenant;
      const client = payment.client;

      if (tenant.chatwootUrl && tenant.chatwootApiKey) {
        const message = `✅ Pagamento confirmado!

Olá ${client.name}! Recebemos seu pagamento de R$ ${payment.amount.toFixed(2)}.

Obrigado pela preferência! 💜`;

        // Send via Chatwoot (simplified - you may want to use the same method as reminders)
        try {
          await sendConfirmationMessage(
            tenant.chatwootUrl,
            tenant.chatwootApiKey,
            tenant.chatwootAccountId!,
            client.chatwootContactId!,
            message
          );
        } catch (error) {
          console.error("[Asaas Webhook] Failed to send confirmation:", error);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Payment updated",
      paymentId: payment.id,
      status: newStatus,
    });

  } catch (error) {
    console.error("[Asaas Webhook] Error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

async function sendConfirmationMessage(
  baseUrl: string,
  apiKey: string,
  accountId: string,
  contactId: string,
  message: string
): Promise<void> {
  // Find conversation with contact
  const searchUrl = `${baseUrl}/api/v1/accounts/${accountId}/contacts/${contactId}/conversations`;
  
  const searchResponse = await fetch(searchUrl, {
    headers: { "api_access_token": apiKey },
  });

  if (!searchResponse.ok) {
    throw new Error("Could not find conversations for contact");
  }

  const conversations = await searchResponse.json();
  
  if (!conversations.payload || conversations.payload.length === 0) {
    console.log("[Asaas Webhook] No conversations found for contact");
    return;
  }

  // Get the most recent conversation
  const conversation = conversations.payload[0];
  
  // Send message
  const messageUrl = `${baseUrl}/api/v1/accounts/${accountId}/conversations/${conversation.id}/messages`;
  
  const response = await fetch(messageUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api_access_token": apiKey,
    },
    body: JSON.stringify({
      content: message,
      message_type: "outgoing",
      private: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to send message: ${response.status}`);
  }
}
