import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/services/evolution-service";

/**
 * CRON JOB - Lembretes de Agendamento
 * 
 * Executa a cada hora (configurar no Coolify/Vercel)
 * Envia lembretes 24h e 2h antes dos agendamentos
 * 
 * Configurar cron: 0 * * * * (a cada hora)
 * URL: /api/cron/appointment-reminders
 */

// Mensagens padrão
const DEFAULT_MESSAGES = {
  reminder24h: `Olá {nome}! 😊

Lembrando que você tem um agendamento amanhã:

📅 {data}
⏰ {hora}
💆 {servico}
👩‍⚕️ {profissional}
📍 {clinica}

Por favor, confirme sua presença respondendo:
✅ SIM - Confirmo
❌ NÃO - Preciso remarcar

Aguardamos você! 💕`,

  reminder2h: `Olá {nome}! ⏰

Seu agendamento é daqui a 2 horas!

⏰ {hora}
💆 {servico}
👩‍⚕️ {profissional}

Estamos te esperando! 😊`,
};

function formatDate(date: Date): string {
  return date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function replaceVariables(
  template: string,
  data: {
    nome: string;
    data: string;
    hora: string;
    servico: string;
    profissional: string;
    clinica: string;
  }
): string {
  return template
    .replace(/{nome}/g, data.nome)
    .replace(/{data}/g, data.data)
    .replace(/{hora}/g, data.hora)
    .replace(/{servico}/g, data.servico)
    .replace(/{profissional}/g, data.profissional)
    .replace(/{clinica}/g, data.clinica);
}

export async function GET(request: NextRequest) {
  try {
    // Verificar token de autenticação (para cron jobs)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    // Em desenvolvimento, permitir sem token
    if (process.env.NODE_ENV === "production" && cronSecret) {
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const now = new Date();
    const results = {
      sent24h: 0,
      sent2h: 0,
      errors: [] as string[],
    };

    console.log(`[Appointment Reminders] Running at ${now.toISOString()}`);

    // ==================== LEMBRETES 24H ====================
    const in24h = new Date(now);
    in24h.setHours(in24h.getHours() + 24);
    
    const in23h = new Date(now);
    in23h.setHours(in23h.getHours() + 23);

    const appointments24h = await prisma.appointment.findMany({
      where: {
        status: { in: ["SCHEDULED", "CONFIRMED"] },
        reminder24hSent: false,
        startTime: {
          gte: in23h,
          lte: in24h,
        },
      },
      include: {
        tenant: true,
        client: true,
        professional: true,
        service: true,
      },
    });

    console.log(`[Appointment Reminders] Found ${appointments24h.length} appointments for 24h reminder`);

    for (const apt of appointments24h) {
      try {
        // Verificar se cliente tem telefone
        if (!apt.client.phone || apt.client.phone.startsWith("lid:")) {
          console.log(`[Appointment Reminders] Skipping ${apt.id} - client has no valid phone`);
          continue;
        }

        // Buscar configurações de lembrete do tenant
        const reminderSettings = apt.tenant.reminderSettings as any || {};
        const is24hEnabled = reminderSettings["24h"] !== false; // Padrão: habilitado

        if (!is24hEnabled) {
          console.log(`[Appointment Reminders] Skipping ${apt.id} - 24h reminder disabled for tenant`);
          continue;
        }

        // Montar mensagem
        const messageTemplate = reminderSettings.message24h || DEFAULT_MESSAGES.reminder24h;
        const message = replaceVariables(messageTemplate, {
          nome: apt.client.name.split(" ")[0],
          data: formatDate(apt.startTime),
          hora: formatTime(apt.startTime),
          servico: apt.service.name,
          profissional: apt.professional.name,
          clinica: apt.tenant.name,
        });

        // Enviar mensagem
        const result = await sendWhatsAppMessage(apt.tenantId, apt.client.phone, message);

        if (result.success) {
          // Marcar como enviado
          await prisma.appointment.update({
            where: { id: apt.id },
            data: {
              reminder24hSent: true,
              reminder24hSentAt: new Date(),
            },
          });

          // Registrar atividade na conversa (se existir)
          const conversation = await prisma.conversation.findUnique({
            where: {
              tenantId_clientId: {
                tenantId: apt.tenantId,
                clientId: apt.clientId,
              },
            },
          });

          if (conversation) {
            await prisma.conversationActivity.create({
              data: {
                conversationId: conversation.id,
                type: "REMINDER_SENT",
                title: "Lembrete enviado",
                description: `Lembrete de 24h enviado para agendamento de ${apt.service.name}`,
                metadata: { appointmentId: apt.id, type: "24h" },
              },
            });
          }

          results.sent24h++;
          console.log(`[Appointment Reminders] Sent 24h reminder for ${apt.id}`);
        } else {
          results.errors.push(`24h: ${apt.id} - ${result.error}`);
          console.error(`[Appointment Reminders] Failed 24h reminder for ${apt.id}:`, result.error);
        }
      } catch (error) {
        results.errors.push(`24h: ${apt.id} - ${error}`);
        console.error(`[Appointment Reminders] Error processing ${apt.id}:`, error);
      }
    }

    // ==================== LEMBRETES 2H ====================
    const in2h = new Date(now);
    in2h.setHours(in2h.getHours() + 2);
    
    const in1h30 = new Date(now);
    in1h30.setMinutes(in1h30.getMinutes() + 90);

    const appointments2h = await prisma.appointment.findMany({
      where: {
        status: { in: ["SCHEDULED", "CONFIRMED"] },
        reminder2hSent: false,
        startTime: {
          gte: in1h30,
          lte: in2h,
        },
      },
      include: {
        tenant: true,
        client: true,
        professional: true,
        service: true,
      },
    });

    console.log(`[Appointment Reminders] Found ${appointments2h.length} appointments for 2h reminder`);

    for (const apt of appointments2h) {
      try {
        if (!apt.client.phone || apt.client.phone.startsWith("lid:")) {
          continue;
        }

        const reminderSettings = apt.tenant.reminderSettings as any || {};
        const is2hEnabled = reminderSettings["2h"] !== false;

        if (!is2hEnabled) {
          continue;
        }

        const messageTemplate = reminderSettings.message2h || DEFAULT_MESSAGES.reminder2h;
        const message = replaceVariables(messageTemplate, {
          nome: apt.client.name.split(" ")[0],
          data: formatDate(apt.startTime),
          hora: formatTime(apt.startTime),
          servico: apt.service.name,
          profissional: apt.professional.name,
          clinica: apt.tenant.name,
        });

        const result = await sendWhatsAppMessage(apt.tenantId, apt.client.phone, message);

        if (result.success) {
          await prisma.appointment.update({
            where: { id: apt.id },
            data: {
              reminder2hSent: true,
              reminder2hSentAt: new Date(),
            },
          });

          const conversation = await prisma.conversation.findUnique({
            where: {
              tenantId_clientId: {
                tenantId: apt.tenantId,
                clientId: apt.clientId,
              },
            },
          });

          if (conversation) {
            await prisma.conversationActivity.create({
              data: {
                conversationId: conversation.id,
                type: "REMINDER_SENT",
                title: "Lembrete enviado",
                description: `Lembrete de 2h enviado para agendamento de ${apt.service.name}`,
                metadata: { appointmentId: apt.id, type: "2h" },
              },
            });
          }

          results.sent2h++;
          console.log(`[Appointment Reminders] Sent 2h reminder for ${apt.id}`);
        } else {
          results.errors.push(`2h: ${apt.id} - ${result.error}`);
        }
      } catch (error) {
        results.errors.push(`2h: ${apt.id} - ${error}`);
      }
    }

    console.log(`[Appointment Reminders] Complete. Sent: ${results.sent24h} (24h), ${results.sent2h} (2h). Errors: ${results.errors.length}`);

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      results,
    });
  } catch (error) {
    console.error("[Appointment Reminders] Fatal error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
