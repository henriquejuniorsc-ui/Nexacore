import { NextRequest, NextResponse } from "next/server";
import { sendWhatsAppMessageChunked } from "@/services/message-splitter";
import { transcribeWhatsAppAudio, isAudioMessage } from "@/services/audio-transcription";
import { chatWithCustomerAI } from "@/services/ai-service";
import { updateScore, getTemperature, getPurchaseIntent } from "@/services/lead-scoring";
import prisma from "@/lib/prisma";
// Business hours removido - IA funciona 24/7

// =============================================================================
// EVOLUTION API v2.4.0 - WEBHOOK HANDLER (CORRIGIDO)
// 
// Correções v2.4.0:
// - Fix: Duplicação de clientes (LID vs número real)
// - Fix: Merge automático de clientes quando número é resolvido
// - Fix: Uma única conversa por cliente (não duplica)
// - Melhor: Logs mais detalhados para debug
// =============================================================================

// =============================================================================
// DDDs VÁLIDOS DO BRASIL
// =============================================================================

const VALID_BRAZILIAN_DDDS = [
  "11", "12", "13", "14", "15", "16", "17", "18", "19",
  "21", "22", "24", "27", "28",
  "31", "32", "33", "34", "35", "37", "38",
  "41", "42", "43", "44", "45", "46", "47", "48", "49",
  "51", "53", "54", "55",
  "61", "62", "63", "64", "65", "66", "67", "68", "69",
  "71", "73", "74", "75", "77", "79",
  "81", "82", "83", "84", "85", "86", "87", "88", "89",
  "91", "92", "93", "94", "95", "96", "97", "98", "99",
];

function isValidBrazilianDDD(ddd: string): boolean {
  return VALID_BRAZILIAN_DDDS.includes(ddd);
}

// =============================================================================
// NORMALIZAÇÃO DE TELEFONE
// =============================================================================

function normalizePhoneBR(raw: string): string | null {
  if (!raw) return null;

  let digits = raw.replace(/\D/g, "");
  if (!digits) return null;

  // Remove zeros à esquerda
  while (digits.startsWith("0") && digits.length > 11) {
    digits = digits.slice(1);
  }
  if (digits.startsWith("0") && digits.length === 11) {
    digits = digits.slice(1);
  }

  let normalized: string;

  switch (digits.length) {
    case 8:
    case 9:
      return null; // Sem DDD
    case 10:
      if (isValidBrazilianDDD(digits.slice(0, 2))) {
        normalized = "55" + digits;
      } else {
        return null;
      }
      break;
    case 11:
      if (isValidBrazilianDDD(digits.slice(0, 2))) {
        normalized = "55" + digits;
      } else {
        return null;
      }
      break;
    case 12:
      if (digits.startsWith("55") && isValidBrazilianDDD(digits.slice(2, 4))) {
        normalized = digits;
      } else if (isValidBrazilianDDD(digits.slice(0, 2))) {
        normalized = "55" + digits.slice(-10);
      } else {
        return null;
      }
      break;
    case 13:
      if (digits.startsWith("55") && isValidBrazilianDDD(digits.slice(2, 4))) {
        normalized = digits;
      } else {
        const last11 = digits.slice(-11);
        if (isValidBrazilianDDD(last11.slice(0, 2))) {
          normalized = "55" + last11;
        } else {
          return null;
        }
      }
      break;
    case 14:
      if (digits.startsWith("5555")) {
        normalized = digits.slice(2);
      } else if (digits.startsWith("55")) {
        normalized = digits.slice(-13);
      } else {
        const last11 = digits.slice(-11);
        if (isValidBrazilianDDD(last11.slice(0, 2))) {
          normalized = "55" + last11;
        } else {
          return null;
        }
      }
      break;
    default:
      if (digits.length > 14) {
        const last11 = digits.slice(-11);
        if (isValidBrazilianDDD(last11.slice(0, 2))) {
          normalized = "55" + last11;
        } else {
          return null;
        }
      } else {
        return null;
      }
  }

  if ((normalized.length !== 12 && normalized.length !== 13) || !normalized.startsWith("55")) {
    return null;
  }

  return normalized;
}

// =============================================================================
// CACHE DE MAPEAMENTO LID <-> NÚMERO REAL
// =============================================================================

const lidCache = new Map<string, string>();

async function saveLidMapping(tenantId: string, lid: string, phoneNumber: string): Promise<void> {
  const cacheKey = `${tenantId}:${lid}`;
  lidCache.set(cacheKey, phoneNumber);
  console.log(`[LID Cache] Saved: ${lid} -> ${phoneNumber}`);
}

async function getPhoneFromLid(tenantId: string, lid: string): Promise<string | null> {
  const cacheKey = `${tenantId}:${lid}`;

  // Cache em memória primeiro
  if (lidCache.has(cacheKey)) {
    const phone = lidCache.get(cacheKey)!;
    console.log(`[LID Cache] Hit: ${lid} -> ${phone}`);
    return phone;
  }

  // Busca no banco pelo chatwootContactId
  const client = await prisma.client.findFirst({
    where: {
      tenantId,
      chatwootContactId: lid,
    },
  });

  if (client && !client.phone.startsWith("lid:")) {
    lidCache.set(cacheKey, client.phone);
    console.log(`[LID Cache] DB Hit: ${lid} -> ${client.phone}`);
    return client.phone;
  }

  return null;
}

// =============================================================================
// EXTRAÇÃO DE TELEFONE DO PAYLOAD
// =============================================================================

interface PhoneExtractionResult {
  phone: string | null;
  isLid: boolean;
  lidId: string | null;
  addressingMode: string | null;
}

async function extractPhoneFromPayload(tenantId: string, msg: any): Promise<PhoneExtractionResult> {
  const key = msg.key || {};
  const remoteJid = key.remoteJid || "";
  const addressingMode = key.addressingMode || null;

  // ===========================================
  // CASO 1: Formato @lid (WhatsApp LID)
  // ===========================================
  if (remoteJid.includes("@lid")) {
    console.log(`[Evolution Webhook] 📱 LID detected | Mode: ${addressingMode}`);

    const lidId = remoteJid.replace("@lid", "");

    // PRIORIDADE 1: remoteJidAlt
    if (key.remoteJidAlt && key.remoteJidAlt.includes("@s.whatsapp.net")) {
      const altPhone = key.remoteJidAlt.replace("@s.whatsapp.net", "");
      const normalized = normalizePhoneBR(altPhone);
      if (normalized) {
        console.log(`[Evolution Webhook] ✅ remoteJidAlt resolved: ${normalized}`);
        await saveLidMapping(tenantId, lidId, normalized);
        return { phone: normalized, isLid: true, lidId, addressingMode };
      }
    }

    // PRIORIDADE 2: senderPn
    if (key.senderPn) {
      const senderPhone = key.senderPn.replace("@s.whatsapp.net", "");
      const normalized = normalizePhoneBR(senderPhone);
      if (normalized) {
        console.log(`[Evolution Webhook] ✅ senderPn resolved: ${normalized}`);
        await saveLidMapping(tenantId, lidId, normalized);
        return { phone: normalized, isLid: true, lidId, addressingMode };
      }
    }

    // PRIORIDADE 3: participant
    if (key.participant && key.participant.includes("@s.whatsapp.net")) {
      const participantPhone = key.participant.replace("@s.whatsapp.net", "");
      const normalized = normalizePhoneBR(participantPhone);
      if (normalized) {
        console.log(`[Evolution Webhook] ✅ participant resolved: ${normalized}`);
        await saveLidMapping(tenantId, lidId, normalized);
        return { phone: normalized, isLid: true, lidId, addressingMode };
      }
    }

    // PRIORIDADE 4: Cache local
    const cachedPhone = await getPhoneFromLid(tenantId, lidId);
    if (cachedPhone) {
      console.log(`[Evolution Webhook] ✅ Cache resolved: ${cachedPhone}`);
      return { phone: cachedPhone, isLid: true, lidId, addressingMode };
    }

    // PRIORIDADE 5: Banco de dados (cliente existente)
    const existingClient = await prisma.client.findFirst({
      where: {
        tenantId,
        chatwootContactId: lidId,
        NOT: { phone: { startsWith: "lid:" } },
      },
    });

    if (existingClient) {
      console.log(`[Evolution Webhook] ✅ DB client resolved: ${existingClient.phone}`);
      await saveLidMapping(tenantId, lidId, existingClient.phone);
      return { phone: existingClient.phone, isLid: true, lidId, addressingMode };
    }

    // Não conseguiu resolver
    console.log(`[Evolution Webhook] ⚠️ Could not resolve LID. Key:`, JSON.stringify(key, null, 2));
    return { phone: null, isLid: true, lidId, addressingMode };
  }

  // ===========================================
  // CASO 2: Formato padrão @s.whatsapp.net
  // ===========================================
  if (remoteJid.includes("@s.whatsapp.net")) {
    const phone = remoteJid.replace("@s.whatsapp.net", "");
    const normalized = normalizePhoneBR(phone);
    return { phone: normalized, isLid: false, lidId: null, addressingMode };
  }

  // ===========================================
  // CASO 3: Formato sem sufixo
  // ===========================================
  if (remoteJid && !remoteJid.includes("@")) {
    const normalized = normalizePhoneBR(remoteJid);
    return { phone: normalized, isLid: false, lidId: null, addressingMode };
  }

  return { phone: null, isLid: false, lidId: null, addressingMode };
}

// =============================================================================
// BUSCA/CRIAÇÃO DE CLIENTE - CORRIGIDO PARA EVITAR DUPLICATAS
// =============================================================================

async function findOrCreateClient(
  tenantId: string,
  phone: string | null,
  lidId: string | null,
  pushName: string | null
): Promise<{ client: any; phoneToUse: string | null }> {

  // ===========================================
  // CASO 1: Temos o número real
  // ===========================================
  if (phone) {
    // Primeiro, busca por telefone
    let client = await prisma.client.findFirst({
      where: { tenantId, phone },
    });

    if (client) {
      // Se encontrou, atualiza nome e LID se necessário
      const updates: any = {};
      if (pushName && client.name.startsWith("Cliente ")) updates.name = pushName;
      if (lidId && !client.chatwootContactId) updates.chatwootContactId = lidId;

      if (Object.keys(updates).length > 0) {
        client = await prisma.client.update({ where: { id: client.id }, data: updates });
      }

      console.log(`[Client] Found by phone: ${client.id}`);
      return { client, phoneToUse: phone };
    }

    // Se não encontrou por telefone, verifica se existe cliente LID para fazer merge
    if (lidId) {
      const lidClient = await prisma.client.findFirst({
        where: { tenantId, chatwootContactId: lidId },
      });

      if (lidClient) {
        // MERGE: Atualiza o cliente LID com o número real
        console.log(`[Client] 🔄 MERGE: Updating LID client ${lidClient.id} with phone ${phone}`);

        client = await prisma.client.update({
          where: { id: lidClient.id },
          data: {
            phone,
            name: pushName || (lidClient.name.startsWith("Cliente ") ? `Cliente ${phone.slice(-4)}` : lidClient.name),
            notes: lidClient.notes?.replace(
              "⚠️ Cliente WhatsApp sem número identificado.",
              `✅ Número identificado: ${phone}`
            ) || `✅ Número identificado: ${phone}`,
          },
        });

        return { client, phoneToUse: phone };
      }
    }

    // Tentar variações do número
    const variations = [phone.slice(2), phone.slice(-11), phone.slice(-10), phone.slice(-9)];
    for (const variation of variations) {
      if (variation.length < 8) continue;

      client = await prisma.client.findFirst({
        where: { tenantId, phone: { contains: variation } },
      });

      if (client) {
        // Atualiza para o formato correto
        client = await prisma.client.update({
          where: { id: client.id },
          data: {
            phone,
            ...(lidId && !client.chatwootContactId ? { chatwootContactId: lidId } : {}),
          },
        });
        console.log(`[Client] Found by variation and updated: ${client.id}`);
        return { client, phoneToUse: phone };
      }
    }

    // Criar novo cliente
    try {
      client = await prisma.client.create({
        data: {
          tenantId,
          phone,
          name: pushName || `Cliente ${phone.slice(-4)}`,
          chatwootContactId: lidId || undefined,
        },
      });
      console.log(`[Client] Created new client: ${client.id} | Phone: ${phone}`);
      return { client, phoneToUse: phone };
    } catch (e: any) {
      if (e.code === "P2002") {
        // Race condition - cliente foi criado por outra request
        client = await prisma.client.findFirst({ where: { tenantId, phone } });
        if (client) {
          console.log(`[Client] Found after race condition: ${client.id}`);
          return { client, phoneToUse: phone };
        }
      }
      throw e;
    }
  }

  // ===========================================
  // CASO 2: Só temos LID (sem número real)
  // ===========================================
  if (lidId) {
    let client = await prisma.client.findFirst({
      where: { tenantId, chatwootContactId: lidId },
    });

    if (client) {
      // Se o cliente tem número real, retorna ele
      if (!client.phone.startsWith("lid:")) {
        console.log(`[Client] Found LID client with real phone: ${client.phone}`);
        return { client, phoneToUse: client.phone };
      }

      // Se só tem LID, atualiza nome se necessário
      if (pushName && client.name.startsWith("Cliente ")) {
        client = await prisma.client.update({
          where: { id: client.id },
          data: { name: pushName },
        });
      }

      console.log(`[Client] Found LID-only client: ${client.id}`);
      return { client, phoneToUse: null };
    }

    // Criar cliente temporário com LID
    client = await prisma.client.create({
      data: {
        tenantId,
        phone: `lid:${lidId}`,
        name: pushName || `Cliente ${lidId.slice(-4)}`,
        chatwootContactId: lidId,
        notes: "⚠️ Cliente WhatsApp sem número identificado. Será atualizado automaticamente quando o número for resolvido.",
      },
    });
    console.log(`[Client] Created LID-only client: ${client.id}`);
    return { client, phoneToUse: null };
  }

  // ===========================================
  // CASO 3: Sem identificador válido
  // ===========================================
  return { client: null, phoneToUse: null };
}

// =============================================================================
// BUSCA/CRIAÇÃO DE CONVERSA - CORRIGIDO PARA EVITAR DUPLICATAS
// =============================================================================

async function findOrCreateConversation(
  tenantId: string,
  clientId: string,
  canReply: boolean,
  aiEnabled: boolean
): Promise<any> {
  // Buscar conversa existente para este cliente (única por cliente)
  let conversation = await prisma.conversation.findUnique({
    where: {
      tenantId_clientId: {
        tenantId,
        clientId,
      },
    },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        tenantId,
        clientId,
        status: canReply ? "OPEN" : "PENDING",
        channel: "WHATSAPP",
        aiEnabled: aiEnabled && canReply,
      },
    });
    console.log(`[Conversation] Created: ${conversation.id} | Client: ${clientId} | CanReply: ${canReply}`);

    await prisma.conversationActivity.create({
      data: {
        conversationId: conversation.id,
        type: "CONVERSATION_STARTED",
        title: "Conversa iniciada",
        description: canReply
          ? `Nova conversa via WhatsApp`
          : `⚠️ Aguardando resolução de número`,
      },
    });
  } else {
    // Se a conversa existia mas estava fechada, reabrir
    if (conversation.status === "CLOSED") {
      conversation = await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          status: "OPEN",
          aiEnabled: aiEnabled && canReply,
        },
      });
      console.log(`[Conversation] Reopened: ${conversation.id}`);
    }

    // Atualizar aiEnabled se necessário
    if (canReply && !conversation.aiEnabled && aiEnabled) {
      conversation = await prisma.conversation.update({
        where: { id: conversation.id },
        data: { aiEnabled: true },
      });
    }
  }

  return conversation;
}

// =============================================================================
// WEBHOOK HANDLER
// =============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: { tenantId: string; event?: string[] } }
) {
  const startTime = Date.now();

  try {
    const tenantId = params.tenantId;
    const eventPath = params.event?.join("/") || "";
    const body = await request.json();

    const eventName = body.event || eventPath.replace("-", ".") || "unknown";
    console.log(`[Evolution Webhook] Event: ${eventName} | Tenant: ${tenantId}`);

    // ===========================================
    // MESSAGES.UPSERT - Nova mensagem recebida
    // ===========================================
    if (eventName === "messages.upsert" || eventPath === "messages-upsert") {
      const msg = body.data;

      if (!msg) return NextResponse.json({ success: true, ignored: "no-data" });
      if (msg.key?.fromMe) return NextResponse.json({ success: true, ignored: "fromMe" });

      const remoteJid = msg.key?.remoteJid || "";

      // Ignora grupos e broadcasts
      if (remoteJid.includes("@g.us") || remoteJid.includes("@broadcast")) {
        return NextResponse.json({ success: true, ignored: "group-or-broadcast" });
      }

      // Extrair telefone
      const { phone, isLid, lidId, addressingMode } = await extractPhoneFromPayload(tenantId, msg);
      const pushName = msg.pushName || null;

      // Extrair texto da mensagem
      let text =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        msg.message?.imageMessage?.caption ||
        msg.message?.videoMessage?.caption ||
        msg.message?.documentMessage?.caption ||
        "";

      // 🎤 FEATURE: Transcrição de áudio
      let isTranscribedAudio = false;
      if (!text && isAudioMessage(msg)) {
        console.log(`[Evolution Webhook] 🎤 Audio message detected, transcribing...`);

        const transcription = await transcribeWhatsAppAudio(tenantId, msg);

        if (transcription.success && transcription.text) {
          text = transcription.text;
          isTranscribedAudio = true;
          console.log(`[Evolution Webhook] 🎤 Transcribed (${transcription.duration}s): "${text.slice(0, 100)}..."`);
        } else {
          console.log(`[Evolution Webhook] 🎤 Transcription failed: ${transcription.error}`);
          // Salva a mensagem sem texto mas com metadado de áudio
          text = "";
        }
      }

      console.log(`[Evolution Webhook] Phone: ${phone} | LID: ${isLid ? lidId : "N/A"} | Mode: ${addressingMode} | Name: ${pushName}${isTranscribedAudio ? " | 🎤 Audio" : ""}`);

      if (!text) {
        // Se é áudio que não conseguimos transcrever, salva com marcador
        if (isAudioMessage(msg)) {
          // Buscar tenant e cliente para salvar a mensagem mesmo sem texto
          const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
          if (tenant && phone) {
            const { client } = await findOrCreateClient(tenantId, phone, lidId, pushName);
            if (client) {
              const conversation = await findOrCreateConversation(tenantId, client.id, true, tenant.aiEnabled);
              await prisma.message.create({
                data: {
                  tenantId,
                  clientId: client.id,
                  conversationId: conversation.id,
                  content: "🎤 [Áudio não transcrito]",
                  role: "HUMAN",
                  metadata: {
                    messageId: msg.key?.id,
                    remoteJid,
                    isAudio: true,
                    audioSeconds: msg.message?.audioMessage?.seconds || 0,
                    transcriptionError: "failed",
                  },
                },
              });
              await prisma.conversation.update({
                where: { id: conversation.id },
                data: {
                  messageCount: { increment: 1 },
                  unreadCount: { increment: 1 },
                  lastMessageAt: new Date(),
                  lastMessagePreview: "🎤 Áudio",
                },
              });
            }
          }
          return NextResponse.json({ success: true, event: "audio-not-transcribed" });
        }
        return NextResponse.json({ success: true, ignored: "no-text" });
      }

      // Buscar tenant
      const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
      if (!tenant) return NextResponse.json({ success: false, error: "tenant-not-found" });

      // Buscar ou criar cliente (com lógica de merge)
      const { client, phoneToUse } = await findOrCreateClient(tenantId, phone, lidId, pushName);

      if (!client) {
        console.log("[Evolution Webhook] Ignored: could not identify client");
        return NextResponse.json({ success: true, ignored: "no-client" });
      }

      // Processar mensagem
      await processIncomingMessage(tenant, client, text, msg, phoneToUse, remoteJid, startTime, isTranscribedAudio);

      return NextResponse.json({ success: true, event: eventName });
    }

    // Outros eventos (connection.update, messages.update, etc)
    return NextResponse.json({ success: true, event: eventName });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Evolution Webhook] Error after ${duration}ms:`, error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 200 });
  }
}

// =============================================================================
// PROCESSAMENTO DE MENSAGEM
// =============================================================================

async function processIncomingMessage(
  tenant: any,
  client: any,
  text: string,
  msg: any,
  phoneToSend: string | null,
  remoteJid: string,
  startTime: number,
  isTranscribedAudio: boolean = false
) {
  const tenantId = tenant.id;
  const canReply = phoneToSend !== null && !phoneToSend.startsWith("lid:");

  // IA funciona 24/7 - sem verificação de horário comercial

  // Buscar ou criar conversa (única por cliente)
  const conversation = await findOrCreateConversation(
    tenantId,
    client.id,
    canReply,
    tenant.aiEnabled
  );

  // Lead Scoring
  const { newScore, reasons } = updateScore(conversation.score, text, true);
  const newTemperature = getTemperature(newScore);
  const newPurchaseIntent = getPurchaseIntent(newScore);

  // Salvar mensagem recebida (com metadados de áudio se aplicável)
  const messageMetadata: any = {
    messageId: msg.key?.id,
    remoteJid,
    remoteJidAlt: msg.key?.remoteJidAlt,
    addressingMode: msg.key?.addressingMode,
    pushName: msg.pushName,
    timestamp: msg.messageTimestamp,
    canReply,
  };

  if (isTranscribedAudio) {
    messageMetadata.isAudio = true;
    messageMetadata.audioTranscribed = true;
    messageMetadata.audioSeconds = msg.message?.audioMessage?.seconds || 0;
    messageMetadata.isVoiceNote = msg.message?.audioMessage?.ptt === true;
  }

  // Conteúdo salvo: se foi áudio transcrito, marca com emoji
  const savedContent = isTranscribedAudio ? `🎤 ${text}` : text;

  await prisma.message.create({
    data: {
      tenantId,
      clientId: client.id,
      conversationId: conversation.id,
      content: savedContent,
      role: "HUMAN",
      metadata: messageMetadata,
    },
  });

  // Atualizar conversa
  await prisma.conversation.update({
    where: { id: conversation.id },
    data: {
      messageCount: { increment: 1 },
      unreadCount: { increment: 1 },
      lastMessageAt: new Date(),
      lastMessagePreview: isTranscribedAudio ? `🎤 ${text.slice(0, 80)}` : text.slice(0, 100),
      status: conversation.status === "CLOSED" ? "OPEN" : conversation.status,
      score: newScore,
      temperature: newTemperature,
      purchaseIntent: newPurchaseIntent,
    },
  });

  // Se não pode responder, apenas salva
  if (!canReply) {
    console.log(`[Evolution Webhook] ⚠️ Message saved. Cannot auto-reply (number not resolved)`);
    return;
  }

  // Verificar se IA está habilitada
  if (!conversation.aiEnabled || !tenant.aiEnabled) {
    console.log("[Evolution Webhook] AI disabled");
    return;
  }

  // Buscar histórico
  const history = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const conversationHistory = history
    .reverse()
    .slice(0, -1)
    .map((m) => ({
      role: m.role === "HUMAN" ? ("user" as const) : ("assistant" as const),
      content: m.content,
    }));

  // Gerar resposta com IA
  // Para áudio transcrito, adiciona contexto para a IA saber que veio de áudio
  const aiInput = isTranscribedAudio
    ? `[Áudio transcrito do cliente]: ${text}`
    : text;

  console.log(`[Evolution Webhook] Generating AI response for ${phoneToSend}...`);

  const aiResponse = await chatWithCustomerAI(
    tenantId,
    phoneToSend,
    client.name,
    aiInput,
    conversationHistory
  );

  // 💬 FEATURE: Enviar resposta dividida em chunks (mais humano)
  const sendResult = await sendWhatsAppMessageChunked(tenantId, phoneToSend, aiResponse);

  if (sendResult.success) {
    // Salvar cada chunk como uma mensagem separada no banco
    for (let i = 0; i < sendResult.chunks.length; i++) {
      const chunk = sendResult.chunks[i];
      const messageId = sendResult.messageIds[i] || null;

      await prisma.message.create({
        data: {
          tenantId,
          clientId: client.id,
          conversationId: conversation.id,
          content: chunk,
          role: "ASSISTANT",
          metadata: {
            messageId,
            senderType: "AI",
            chunkIndex: i,
            totalChunks: sendResult.chunks.length,
          },
        },
      });
    }

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        messageCount: { increment: sendResult.chunks.length },
        lastMessageAt: new Date(),
        lastMessagePreview: sendResult.chunks[sendResult.chunks.length - 1].slice(0, 100),
      },
    });

    const duration = Date.now() - startTime;
    console.log(`[Evolution Webhook] ✅ AI replied to ${phoneToSend} (${sendResult.chunks.length} msgs, ${duration}ms)`);
  } else {
    console.log(`[Evolution Webhook] ❌ Failed: ${sendResult.errors.join(", ")}`);
  }
}

// =============================================================================
// GET - Health Check
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantId: string; event?: string[] } }
) {
  return NextResponse.json({
    status: "active",
    tenantId: params.tenantId,
    event: params.event,
    version: "2.4.0-fixed",
    fixes: [
      "No more duplicate clients",
      "Automatic LID to phone merge",
      "Single conversation per client",
      "Better error handling"
    ],
    timestamp: new Date().toISOString(),
  });
}