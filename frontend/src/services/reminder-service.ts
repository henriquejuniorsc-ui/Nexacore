import prisma from "@/lib/prisma";

interface ReminderResult {
  success: boolean;
  clientId: string;
  clientName: string;
  procedureType: string;
  message: string;
}

// ==================== GENERATE REMINDER MESSAGE ====================
function generateReminderMessage(
  clientName: string,
  procedureName: string,
  daysSince: number,
  customMessage?: string | null
): string {
  if (customMessage) {
    return customMessage
      .replace("{nome}", clientName)
      .replace("{dias}", String(daysSince))
      .replace("{procedimento}", procedureName);
  }

  // Default messages based on procedure type
  const defaultMessages: { [key: string]: string } = {
    botox: `Olá ${clientName}! 💆‍♀️

Já se passaram ${daysSince} dias desde seu último procedimento de Botox. Para manter os resultados ideais, geralmente recomendamos uma nova aplicação a cada 4-6 meses.

Gostaria de agendar seu retorno? Temos horários disponíveis essa semana! 📅`,

    preenchimento: `Oi ${clientName}! ✨

Faz ${daysSince} dias desde seu último preenchimento. Dependendo da área tratada, pode ser um bom momento para avaliar um retoque.

Quer que eu verifique os horários disponíveis para você? 😊`,

    limpeza: `Olá ${clientName}! 🧖‍♀️

Já pensou em fazer sua limpeza de pele? A última foi há ${daysSince} dias, e os especialistas recomendam fazer mensalmente para manter a pele saudável.

Posso te ajudar a agendar? 💕`,
  };

  const key = procedureName.toLowerCase().includes("botox") 
    ? "botox" 
    : procedureName.toLowerCase().includes("preenchimento")
    ? "preenchimento"
    : "limpeza";

  return defaultMessages[key] || `Olá ${clientName}! Já faz ${daysSince} dias desde seu último ${procedureName}. Gostaria de agendar um retorno? 📅`;
}

// ==================== PROCESS PENDING REMINDERS ====================
export async function processPendingReminders(): Promise<ReminderResult[]> {
  const results: ReminderResult[] = [];
  
  try {
    const now = new Date();

    // Find all procedure records that need reminders
    const pendingReminders = await prisma.procedureRecord.findMany({
      where: {
        nextReminderAt: { lte: now },
        reminderSentAt: null,
        procedureType: {
          reminderEnabled: true,
        },
      },
      include: {
        client: {
          include: {
            tenant: true,
          },
        },
        procedureType: true,
      },
      take: 100, // Process in batches
    });

    console.log(`[Reminders] Found ${pendingReminders.length} pending reminders`);

    for (const record of pendingReminders) {
      try {
        const { client, procedureType } = record;
        const tenant = client.tenant;

        // Calculate days since procedure
        const daysSince = Math.floor(
          (now.getTime() - record.performedAt.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Generate reminder message
        const message = generateReminderMessage(
          client.name,
          procedureType.name,
          daysSince,
          procedureType.reminderMessage
        );

        // Send via Chatwoot if configured
        if (tenant.chatwootUrl && tenant.chatwootApiKey && tenant.chatwootInboxId) {
          await sendReminderViaChatwoot(
            tenant.chatwootUrl,
            tenant.chatwootApiKey,
            tenant.chatwootAccountId!,
            tenant.chatwootInboxId,
            client.phone,
            client.name,
            message
          );
        }

        // Mark reminder as sent
        await prisma.procedureRecord.update({
          where: { id: record.id },
          data: {
            reminderSentAt: now,
            // Schedule next reminder for same interval
            nextReminderAt: new Date(
              now.getTime() + procedureType.reminderDays * 24 * 60 * 60 * 1000
            ),
          },
        });

        results.push({
          success: true,
          clientId: client.id,
          clientName: client.name,
          procedureType: procedureType.name,
          message: "Lembrete enviado com sucesso",
        });

        console.log(`[Reminders] Sent reminder to ${client.name} for ${procedureType.name}`);

      } catch (error) {
        console.error(`[Reminders] Error processing reminder ${record.id}:`, error);
        results.push({
          success: false,
          clientId: record.clientId,
          clientName: record.client.name,
          procedureType: record.procedureType.name,
          message: `Erro: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      }
    }

  } catch (error) {
    console.error("[Reminders] Error in processPendingReminders:", error);
  }

  return results;
}

// ==================== SEND REMINDER VIA CHATWOOT ====================
async function sendReminderViaChatwoot(
  baseUrl: string,
  apiKey: string,
  accountId: string,
  inboxId: string,
  phone: string,
  clientName: string,
  message: string
): Promise<void> {
  // First, create or find conversation
  const conversationUrl = `${baseUrl}/api/v1/accounts/${accountId}/conversations`;
  
  // Create a new conversation (Chatwoot will use existing if phone matches)
  const createConversationResponse = await fetch(conversationUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api_access_token": apiKey,
    },
    body: JSON.stringify({
      source_id: phone,
      inbox_id: inboxId,
      contact: {
        name: clientName,
        phone_number: phone,
      },
    }),
  });

  if (!createConversationResponse.ok) {
    // Try to find existing conversation
    const searchUrl = `${baseUrl}/api/v1/accounts/${accountId}/contacts/search?q=${encodeURIComponent(phone)}`;
    const searchResponse = await fetch(searchUrl, {
      headers: { "api_access_token": apiKey },
    });
    
    if (!searchResponse.ok) {
      throw new Error("Could not find or create conversation");
    }
  }

  const conversationData = await createConversationResponse.json();
  const conversationId = conversationData.id;

  // Send message
  const messageUrl = `${baseUrl}/api/v1/accounts/${accountId}/conversations/${conversationId}/messages`;
  
  const messageResponse = await fetch(messageUrl, {
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

  if (!messageResponse.ok) {
    const error = await messageResponse.text();
    throw new Error(`Failed to send message: ${error}`);
  }
}

// ==================== CREATE PROCEDURE RECORD ====================
export async function createProcedureRecord(
  clientId: string,
  procedureTypeId: string,
  appointmentId?: string,
  notes?: string
): Promise<void> {
  const procedureType = await prisma.procedureType.findUnique({
    where: { id: procedureTypeId },
  });

  if (!procedureType) {
    throw new Error("Tipo de procedimento não encontrado");
  }

  const now = new Date();
  const nextReminderAt = new Date(
    now.getTime() + procedureType.reminderDays * 24 * 60 * 60 * 1000
  );

  await prisma.procedureRecord.create({
    data: {
      clientId,
      procedureTypeId,
      appointmentId,
      performedAt: now,
      notes,
      nextReminderAt: procedureType.reminderEnabled ? nextReminderAt : null,
    },
  });
}

// ==================== DEFAULT PROCEDURE TYPES ====================
export const defaultProcedureTypes = [
  {
    name: "Botox",
    description: "Aplicação de toxina botulínica",
    reminderDays: 120, // 4 meses
    reminderMessage: null, // Usa default
  },
  {
    name: "Preenchimento Labial",
    description: "Preenchimento com ácido hialurônico nos lábios",
    reminderDays: 180, // 6 meses
    reminderMessage: null,
  },
  {
    name: "Preenchimento Facial",
    description: "Preenchimento com ácido hialurônico facial",
    reminderDays: 365, // 12 meses
    reminderMessage: null,
  },
  {
    name: "Limpeza de Pele",
    description: "Limpeza profunda da pele",
    reminderDays: 30, // 1 mês
    reminderMessage: null,
  },
  {
    name: "Harmonização Facial",
    description: "Conjunto de procedimentos de harmonização",
    reminderDays: 180, // 6 meses
    reminderMessage: null,
  },
  {
    name: "Skinbooster",
    description: "Hidratação profunda da pele",
    reminderDays: 90, // 3 meses
    reminderMessage: null,
  },
  {
    name: "Peeling",
    description: "Peeling químico ou físico",
    reminderDays: 30, // 1 mês
    reminderMessage: null,
  },
  {
    name: "Bioestimulador de Colágeno",
    description: "Aplicação de bioestimuladores",
    reminderDays: 365, // 12 meses
    reminderMessage: null,
  },
];
