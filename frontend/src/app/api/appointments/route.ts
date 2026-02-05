import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { 
  syncAppointmentToCalendar, 
  getAvailableSlots,
  deleteCalendarEvent 
} from "@/services/google-calendar-service";
import { sendTextMessage } from "@/services/baileys-service";

// =============================================================================
// APPOINTMENTS API - CORRIGIDO
// 
// Correções:
// - Fuso horário correto (America/Sao_Paulo)
// - startTime recebido como string local (YYYY-MM-DDTHH:mm)
// - Conversão correta para UTC no banco
// - Exibição correta no horário local
// =============================================================================

// Schema de validação
const createAppointmentSchema = z.object({
  clientId: z.string(),
  professionalId: z.string(),
  serviceId: z.string(),
  startTime: z.string(), // Formato: "YYYY-MM-DDTHH:mm" (horário LOCAL)
  notes: z.string().optional(),
  sendConfirmation: z.boolean().optional().default(true),
});

// Timezone padrão
const DEFAULT_TIMEZONE = "America/Sao_Paulo";

// Helper para obter tenant do usuário
async function getTenantId(userId: string): Promise<{ tenantId: string | null; timezone: string }> {
  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    include: { tenant: { select: { id: true, timezone: true } } },
  });
  return { 
    tenantId: user?.tenantId || null,
    timezone: user?.tenant?.timezone || DEFAULT_TIMEZONE,
  };
}

// Converte string de horário local para Date UTC
function localTimeToUTC(localTimeStr: string, timezone: string = DEFAULT_TIMEZONE): Date {
  // localTimeStr formato: "2024-01-15T10:00" (horário local)
  // Cria a data no timezone especificado e converte para UTC
  
  // Usar a API Intl para obter o offset do timezone
  const date = new Date(localTimeStr);
  
  // Obter o offset em minutos para o timezone especificado
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  });
  
  // Para calcular corretamente, vamos usar uma abordagem mais direta
  // Criamos a data como se fosse UTC e depois ajustamos
  const [datePart, timePart] = localTimeStr.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = (timePart || "00:00").split(":").map(Number);
  
  // Criar data no timezone local do servidor
  const localDate = new Date(year, month - 1, day, hour, minute, 0, 0);
  
  // Calcular o offset do timezone desejado vs UTC
  // São Paulo = UTC-3, então precisamos adicionar 3 horas
  const offsetHours = getTimezoneOffset(timezone, localDate);
  
  // Ajustar para UTC
  const utcDate = new Date(localDate.getTime() + offsetHours * 60 * 60 * 1000);
  
  return utcDate;
}

// Obtém o offset do timezone em horas (negativo = west of UTC)
function getTimezoneOffset(timezone: string, date: Date): number {
  // Usar Intl para obter o offset real considerando horário de verão
  const options: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    timeZoneName: "shortOffset",
  };
  
  const parts = new Intl.DateTimeFormat("en-US", options).formatToParts(date);
  const tzPart = parts.find(p => p.type === "timeZoneName");
  
  if (tzPart) {
    const match = tzPart.value.match(/GMT([+-])(\d{1,2}):?(\d{2})?/);
    if (match) {
      const sign = match[1] === "+" ? -1 : 1; // Invertido porque queremos o offset para converter PARA UTC
      const hours = parseInt(match[2], 10);
      const minutes = parseInt(match[3] || "0", 10);
      return sign * (hours + minutes / 60);
    }
  }
  
  // Fallback para São Paulo (UTC-3)
  return 3;
}

// Formata data para exibição no horário local
function formatDateTimeBR(date: Date, timezone: string = DEFAULT_TIMEZONE): { date: string; time: string; full: string } {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    weekday: "long",
    day: "numeric",
    month: "long",
  };
  
  const dateStr = date.toLocaleDateString("pt-BR", options);
  
  const timeStr = date.toLocaleTimeString("pt-BR", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
  });
  
  return {
    date: dateStr,
    time: timeStr,
    full: `${dateStr} às ${timeStr}`,
  };
}

// GET - Listar agendamentos
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { tenantId, timezone } = await getTenantId(userId);
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant não encontrado" }, { status: 404 });
    }

    // Query params
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date"); // YYYY-MM-DD
    const professionalId = searchParams.get("professionalId");
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Filtros
    const where: any = { tenantId };

    if (date) {
      // Converter data local para range UTC
      const dayStartLocal = `${date}T00:00`;
      const dayEndLocal = `${date}T23:59`;
      
      const dayStartUTC = localTimeToUTC(dayStartLocal, timezone);
      const dayEndUTC = localTimeToUTC(dayEndLocal, timezone);
      
      where.startTime = { gte: dayStartUTC, lte: dayEndUTC };
    } else if (startDate && endDate) {
      where.startTime = {
        gte: localTimeToUTC(`${startDate}T00:00`, timezone),
        lte: localTimeToUTC(`${endDate}T23:59`, timezone),
      };
    }

    if (professionalId) {
      where.professionalId = professionalId;
    }

    if (status) {
      where.status = status;
    }

    // Buscar agendamentos
    const appointments = await prisma.appointment.findMany({
      where,
      orderBy: { startTime: "asc" },
      include: {
        client: {
          select: { id: true, name: true, phone: true, email: true },
        },
        professional: {
          select: { id: true, name: true, specialty: true },
        },
        service: {
          select: { id: true, name: true, price: true, duration: true },
        },
      },
    });

    // Formatar datas para o timezone correto
    const formattedAppointments = appointments.map(apt => ({
      ...apt,
      startTimeFormatted: formatDateTimeBR(apt.startTime, timezone),
      endTimeFormatted: formatDateTimeBR(apt.endTime, timezone),
    }));

    return NextResponse.json({ appointments: formattedAppointments, timezone });
  } catch (error) {
    console.error("[Appointments API] Error:", error);
    return NextResponse.json({ error: "Erro ao buscar agendamentos" }, { status: 500 });
  }
}

// POST - Criar agendamento
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { tenantId, timezone } = await getTenantId(userId);
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant não encontrado" }, { status: 404 });
    }

    const body = await request.json();

    // Validar dados
    const validation = createAppointmentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Buscar serviço para obter duração
    const service = await prisma.service.findUnique({
      where: { id: data.serviceId },
    });

    if (!service) {
      return NextResponse.json({ error: "Serviço não encontrado" }, { status: 404 });
    }

    // =====================================================
    // CORREÇÃO DE FUSO HORÁRIO
    // O startTime vem como "YYYY-MM-DDTHH:mm" no horário LOCAL
    // Precisamos converter para UTC para salvar no banco
    // =====================================================
    
    let startTime: Date;
    
    // Verificar se já é ISO string (com Z ou offset)
    if (data.startTime.includes("Z") || data.startTime.match(/[+-]\d{2}:\d{2}$/)) {
      // Já é UTC ou tem offset, usar diretamente
      startTime = new Date(data.startTime);
    } else {
      // É horário local sem offset, converter considerando timezone
      startTime = localTimeToUTC(data.startTime, timezone);
    }

    const endTime = new Date(startTime.getTime() + service.duration * 60 * 1000);

    console.log(`[Appointments] Creating: Input=${data.startTime} -> UTC=${startTime.toISOString()} | Timezone=${timezone}`);

    // Verificar conflito de horário
    const conflict = await prisma.appointment.findFirst({
      where: {
        professionalId: data.professionalId,
        status: { notIn: ["CANCELED"] },
        OR: [
          {
            startTime: { lte: startTime },
            endTime: { gt: startTime },
          },
          {
            startTime: { lt: endTime },
            endTime: { gte: endTime },
          },
          {
            startTime: { gte: startTime },
            endTime: { lte: endTime },
          },
        ],
      },
    });

    if (conflict) {
      return NextResponse.json(
        { error: "Já existe um agendamento neste horário" },
        { status: 409 }
      );
    }

    // Criar agendamento
    const appointment = await prisma.appointment.create({
      data: {
        tenantId,
        clientId: data.clientId,
        professionalId: data.professionalId,
        serviceId: data.serviceId,
        startTime,
        endTime,
        duration: service.duration,
        price: service.price,
        notes: data.notes,
        status: "SCHEDULED",
      },
      include: {
        client: true,
        professional: true,
        service: true,
        tenant: true,
      },
    });

    // Sincronizar com Google Calendar
    try {
      await syncAppointmentToCalendar(appointment.id);
    } catch (error) {
      console.error("[Appointments] Error syncing to calendar:", error);
    }

    // Enviar confirmação via WhatsApp
    if (data.sendConfirmation && appointment.client.phone) {
      const formatted = formatDateTimeBR(startTime, timezone);
      
      const message = `✅ *Agendamento Confirmado!*

Olá ${appointment.client.name}! 👋

Seu agendamento foi realizado com sucesso:

📅 *Data:* ${formatted.date}
⏰ *Horário:* ${formatted.time}
💆 *Procedimento:* ${appointment.service.name}
👨‍⚕️ *Profissional:* ${appointment.professional.name}
${appointment.tenant.address ? `📍 *Local:* ${appointment.tenant.address}` : ""}

${appointment.service.price ? `💰 *Valor:* R$ ${appointment.service.price.toFixed(2)}` : ""}

Enviaremos um lembrete 24h antes do seu horário.

Até lá! 💜`;

      try {
        await sendTextMessage(tenantId, appointment.client.phone, message);
      } catch (error) {
        console.error("[Appointments] Error sending WhatsApp:", error);
      }
    }

    return NextResponse.json({ 
      success: true, 
      appointment: {
        ...appointment,
        startTimeFormatted: formatDateTimeBR(appointment.startTime, timezone),
        endTimeFormatted: formatDateTimeBR(appointment.endTime, timezone),
      },
    }, { status: 201 });
  } catch (error) {
    console.error("[Appointments API] Error creating:", error);
    return NextResponse.json({ error: "Erro ao criar agendamento" }, { status: 500 });
  }
}

// PATCH - Atualizar status do agendamento
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { tenantId, timezone } = await getTenantId(userId);
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant não encontrado" }, { status: 404 });
    }

    const body = await request.json();
    const { appointmentId, status, notes } = body;

    if (!appointmentId) {
      return NextResponse.json({ error: "ID do agendamento é obrigatório" }, { status: 400 });
    }

    // Verificar se o agendamento pertence ao tenant
    const existing = await prisma.appointment.findFirst({
      where: { id: appointmentId, tenantId },
      include: { client: true, service: true, tenant: true, professional: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 });
    }

    // Atualizar agendamento
    const appointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: status || undefined,
        notes: notes !== undefined ? notes : undefined,
      },
    });

    // Formatar data para notificações
    const formatted = formatDateTimeBR(existing.startTime, timezone);

    // Se cancelado, remover do Google Calendar
    if (status === "CANCELED" && existing.googleEventId) {
      try {
        const calendarId = existing.professional?.googleCalendarId || "primary";
        await deleteCalendarEvent(tenantId, calendarId, existing.googleEventId);
      } catch (error) {
        console.error("[Appointments] Error deleting calendar event:", error);
      }

      // Notificar cliente do cancelamento
      if (existing.client.phone) {
        const message = `❌ *Agendamento Cancelado*

Olá ${existing.client.name},

Seu agendamento de ${existing.service.name} para ${formatted.date} às ${formatted.time} foi cancelado.

Se desejar reagendar, entre em contato conosco ou acesse nosso sistema de agendamento.

${existing.tenant.name}`;

        try {
          await sendTextMessage(tenantId, existing.client.phone, message);
        } catch (error) {
          console.error("[Appointments] Error sending cancellation:", error);
        }
      }
    }

    // Se confirmado, notificar cliente
    if (status === "CONFIRMED" && existing.client.phone) {
      const message = `✅ *Agendamento Confirmado!*

${existing.client.name}, seu agendamento está confirmado:

📅 ${formatted.date}
⏰ ${formatted.time}
💆 ${existing.service.name}

Estamos te esperando! 💜`;

      try {
        await sendTextMessage(tenantId, existing.client.phone, message);
      } catch (error) {
        console.error("[Appointments] Error sending confirmation:", error);
      }
    }

    return NextResponse.json({ success: true, appointment });
  } catch (error) {
    console.error("[Appointments API] Error updating:", error);
    return NextResponse.json({ error: "Erro ao atualizar agendamento" }, { status: 500 });
  }
}

// DELETE - Cancelar agendamento
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const appointmentId = searchParams.get("id");

  if (!appointmentId) {
    return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
  }

  // Reutiliza o PATCH com status CANCELED
  const fakeRequest = new NextRequest(request.url, {
    method: "PATCH",
    body: JSON.stringify({ appointmentId, status: "CANCELED" }),
  });

  return PATCH(fakeRequest);
}
