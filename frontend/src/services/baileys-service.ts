/**
 * Serviço de integração com Baileys API (WhatsApp)
 * Compatível com ghcr.io/fazer-ai/baileys-api
 * 
 * Documentação: https://github.com/fazer-ai/baileys-api
 */

import prisma from "@/lib/prisma";

// ==================== TYPES ====================
interface BaileysSession {
  id: string;
  status: "open" | "close" | "connecting" | "connected" | "qr" | "disconnected";
  qr?: string;
  qrCode?: string;
  phone?: string;
}

interface SendMessagePayload {
  sessionId: string;
  jid: string;
  type: "text" | "image" | "video" | "audio" | "document";
  message: string;
  options?: {
    caption?: string;
    filename?: string;
  };
}

interface MessageResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface WebhookPayload {
  event: string;
  sessionId: string;
  data: any;
}

// ==================== CONFIG ====================
const BAILEYS_API_URL = process.env.BAILEYS_API_URL || "http://localhost:3025";
const BAILEYS_API_KEY = process.env.BAILEYS_API_KEY || "";

// ==================== HELPERS ====================
async function baileysRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BAILEYS_API_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": BAILEYS_API_KEY,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Baileys API error: ${response.status} - ${error}`);
  }

  return response.json();
}

function formatPhoneToJid(phone: string): string {
  // Remove tudo que não é número
  let cleaned = phone.replace(/\D/g, "");
  
  // Adiciona código do país se não tiver
  if (cleaned.length === 11) {
    cleaned = "55" + cleaned;
  } else if (cleaned.length === 10) {
    cleaned = "55" + cleaned;
  }
  
  // Formato esperado: 5511999999999@s.whatsapp.net
  return `${cleaned}@s.whatsapp.net`;
}

function extractPhoneFromJid(jid: string): string {
  return jid.replace("@s.whatsapp.net", "").replace("@c.us", "");
}

// ==================== SESSION MANAGEMENT ====================

/**
 * Cria uma nova sessão do WhatsApp para o tenant
 * Endpoint: POST /sessions
 */
export async function createSession(tenantId: string): Promise<BaileysSession> {
  const sessionId = `nexacore_${tenantId}`;
  
  try {
    const result = await baileysRequest<any>("/sessions", {
      method: "POST",
      body: JSON.stringify({
        sessionId,
        webhook: {
          url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/baileys/${tenantId}`,
          events: ["messages.upsert", "connection.update"],
        },
      }),
    });

    // Salvar sessionId no tenant
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        chatwootInboxId: sessionId,
      },
    });

    return {
      id: sessionId,
      status: result.status || "connecting",
      qr: result.qr,
      qrCode: result.qr || result.qrCode,
    };
  } catch (error) {
    console.error(`[Baileys] Error creating session:`, error);
    throw error;
  }
}

/**
 * Obtém o status de uma sessão
 * Endpoint: GET /sessions/:sessionId
 */
export async function getSessionStatus(tenantId: string): Promise<BaileysSession | null> {
  const sessionId = `nexacore_${tenantId}`;
  
  try {
    const result = await baileysRequest<any>(`/sessions/${sessionId}`);
    return {
      id: sessionId,
      status: result.status,
      phone: result.phone,
      qr: result.qr,
      qrCode: result.qr || result.qrCode,
    };
  } catch (error: any) {
    if (error.message?.includes("404")) {
      return null;
    }
    console.error(`[Baileys] Error getting session status:`, error);
    return null;
  }
}

/**
 * Obtém o QR Code para conectar o WhatsApp
 * Endpoint: GET /sessions/:sessionId/qr
 */
export async function getQRCode(tenantId: string): Promise<string | null> {
  const sessionId = `nexacore_${tenantId}`;
  
  try {
    const result = await baileysRequest<any>(`/sessions/${sessionId}/qr`);
    return result.qr || result.qrcode || null;
  } catch (error) {
    console.error(`[Baileys] Error getting QR code:`, error);
    return null;
  }
}

/**
 * Desconecta uma sessão
 * Endpoint: DELETE /sessions/:sessionId
 */
export async function disconnectSession(tenantId: string): Promise<boolean> {
  const sessionId = `nexacore_${tenantId}`;
  
  try {
    await baileysRequest(`/sessions/${sessionId}`, {
      method: "DELETE",
    });
    return true;
  } catch (error) {
    console.error(`[Baileys] Error disconnecting session:`, error);
    return false;
  }
}

// ==================== MESSAGING ====================

/**
 * Envia uma mensagem de texto
 * Endpoint: POST /sessions/:sessionId/messages/send
 */
export async function sendTextMessage(
  tenantId: string,
  to: string,
  text: string
): Promise<MessageResponse> {
  const sessionId = `nexacore_${tenantId}`;
  const jid = formatPhoneToJid(to);

  try {
    const result = await baileysRequest<any>(`/sessions/${sessionId}/messages/send`, {
      method: "POST",
      body: JSON.stringify({
        jid,
        type: "text",
        message: text,
      }),
    });

    // Salvar mensagem no banco
    const client = await prisma.client.findFirst({
      where: { 
        tenantId, 
        phone: { contains: to.replace(/\D/g, "").slice(-11) },
      },
    });

    if (client) {
      await prisma.message.create({
        data: {
          tenantId,
          clientId: client.id,
          content: text,
          role: "ASSISTANT",
          metadata: { messageId: result.messageId || result.key?.id },
        },
      });
    }

    return { 
      success: true, 
      messageId: result.messageId || result.key?.id 
    };
  } catch (error) {
    console.error(`[Baileys] Error sending message:`, error);
    return { success: false, error: String(error) };
  }
}

/**
 * Envia uma mensagem com mídia
 * Endpoint: POST /sessions/:sessionId/messages/send
 */
export async function sendMediaMessage(
  tenantId: string,
  to: string,
  mediaUrl: string,
  mediaType: "image" | "video" | "audio" | "document",
  caption?: string,
  filename?: string
): Promise<MessageResponse> {
  const sessionId = `nexacore_${tenantId}`;
  const jid = formatPhoneToJid(to);

  try {
    const result = await baileysRequest<any>(`/sessions/${sessionId}/messages/send`, {
      method: "POST",
      body: JSON.stringify({
        jid,
        type: mediaType,
        message: mediaUrl,
        options: {
          caption,
          filename,
        },
      }),
    });

    return { 
      success: true, 
      messageId: result.messageId || result.key?.id 
    };
  } catch (error) {
    console.error(`[Baileys] Error sending media:`, error);
    return { success: false, error: String(error) };
  }
}

/**
 * Envia mensagem com botões (fallback para texto se não suportado)
 */
export async function sendButtonMessage(
  tenantId: string,
  to: string,
  text: string,
  buttons: { id: string; text: string }[]
): Promise<MessageResponse> {
  // Baileys não suporta mais botões oficialmente
  // Fallback para texto formatado
  const fallbackText = `${text}\n\n${buttons.map((b, i) => `*${i + 1}.* ${b.text}`).join("\n")}\n\n_Responda com o número da opção desejada_`;
  return sendTextMessage(tenantId, to, fallbackText);
}

// ==================== CONTACT MANAGEMENT ====================

/**
 * Verifica se um número está no WhatsApp
 * Endpoint: POST /sessions/:sessionId/contacts/check
 */
export async function checkNumberExists(
  tenantId: string,
  phone: string
): Promise<boolean> {
  const sessionId = `nexacore_${tenantId}`;
  const jid = formatPhoneToJid(phone);

  try {
    const result = await baileysRequest<any>(`/sessions/${sessionId}/contacts/check`, {
      method: "POST",
      body: JSON.stringify({ jid }),
    });
    return result.exists || result.isRegistered || false;
  } catch (error) {
    console.error(`[Baileys] Error checking number:`, error);
    return false;
  }
}

/**
 * Obtém informações do contato
 */
export async function getContactInfo(
  tenantId: string,
  phone: string
): Promise<{ name?: string; picture?: string } | null> {
  const sessionId = `nexacore_${tenantId}`;
  const jid = formatPhoneToJid(phone);

  try {
    const result = await baileysRequest<any>(`/sessions/${sessionId}/contacts/${encodeURIComponent(jid)}`);
    return {
      name: result.name || result.pushName || result.notify,
      picture: result.imgUrl || result.profilePicUrl,
    };
  } catch (error) {
    console.error(`[Baileys] Error getting contact info:`, error);
    return null;
  }
}

// ==================== WEBHOOK HANDLER ====================

/**
 * Processa webhook recebido do Baileys
 * Eventos: messages.upsert, connection.update
 */
export async function handleBaileysWebhook(
  tenantId: string,
  payload: any
): Promise<{ shouldReply: boolean; replyTo?: string; message?: string; clientId?: string }> {
  console.log(`[Baileys Webhook] Event: ${payload.event} for tenant: ${tenantId}`);

  // Evento de conexão
  if (payload.event === "connection.update") {
    const { connection, qr } = payload.data || {};
    
    if (connection === "open") {
      await prisma.tenant.update({
        where: { id: tenantId },
        data: { aiEnabled: true },
      });
      console.log(`[Baileys] Session connected for tenant: ${tenantId}`);
    } else if (connection === "close") {
      console.log(`[Baileys] Session disconnected for tenant: ${tenantId}`);
    }
    
    return { shouldReply: false };
  }

  // Evento de mensagem
  if (payload.event === "messages.upsert") {
    const messages = payload.data?.messages || [];
    
    for (const msg of messages) {
      // Ignorar mensagens enviadas por mim
      if (msg.key?.fromMe) continue;
      
      // Extrair informações
      const remoteJid = msg.key?.remoteJid;
      if (!remoteJid || remoteJid.includes("@g.us")) continue; // Ignorar grupos
      
      const fromPhone = extractPhoneFromJid(remoteJid);
      const messageText = msg.message?.conversation || 
                          msg.message?.extendedTextMessage?.text || 
                          msg.message?.imageMessage?.caption ||
                          "";

      if (!fromPhone || !messageText) continue;

      // Verificar se tenant tem IA habilitada
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
      });

      if (!tenant?.aiEnabled) {
        console.log(`[Baileys] AI disabled for tenant: ${tenantId}`);
        return { shouldReply: false };
      }

      // Buscar ou criar cliente
      let client = await prisma.client.findFirst({
        where: {
          tenantId,
          phone: { contains: fromPhone.slice(-11) },
        },
      });

      if (!client) {
        const pushName = msg.pushName || `Cliente ${fromPhone.slice(-4)}`;
        
        client = await prisma.client.create({
          data: {
            tenantId,
            phone: fromPhone.slice(-11),
            name: pushName,
          },
        });
        console.log(`[Baileys] Created new client: ${client.name}`);
      }

      // Salvar mensagem recebida
      await prisma.message.create({
        data: {
          tenantId,
          clientId: client.id,
          content: messageText,
          role: "HUMAN",
          metadata: {
            messageId: msg.key?.id,
            timestamp: msg.messageTimestamp,
          },
        },
      });

      return {
        shouldReply: true,
        replyTo: fromPhone,
        message: messageText,
        clientId: client.id,
      };
    }
  }

  return { shouldReply: false };
}

// ==================== BULK MESSAGING ====================

/**
 * Envia mensagem em massa (com delay para evitar bloqueio)
 */
export async function sendBulkMessages(
  tenantId: string,
  messages: { phone: string; text: string }[],
  delayMs: number = 5000
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const msg of messages) {
    try {
      const result = await sendTextMessage(tenantId, msg.phone, msg.text);
      if (result.success) {
        sent++;
      } else {
        failed++;
      }
    } catch (error) {
      failed++;
    }

    // Delay entre mensagens (mínimo 3s para evitar bloqueio)
    await new Promise((resolve) => setTimeout(resolve, Math.max(delayMs, 3000)));
  }

  return { sent, failed };
}
