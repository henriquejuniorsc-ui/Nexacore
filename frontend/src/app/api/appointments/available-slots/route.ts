import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

// =============================================================================
// AVAILABLE SLOTS API - CORRIGIDO
// 
// Correções:
// - Gera slots no timezone correto (America/Sao_Paulo)
// - Retorna horários no formato local
// - Considera horário de verão automaticamente
// =============================================================================

const DEFAULT_TIMEZONE = "America/Sao_Paulo";

// Cria uma data no timezone específico
function createDateInTimezone(
  year: number,
  month: number, // 0-indexed
  day: number,
  hour: number,
  minute: number,
  timezone: string
): Date {
  // Criar string ISO sem timezone
  const localString = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;
  
  // Criar date temporária para calcular o offset
  const tempDate = new Date(localString);
  
  // Obter o offset do timezone para esta data específica
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    timeZoneName: "shortOffset",
  });
  const parts = formatter.formatToParts(tempDate);
  const tzPart = parts.find(p => p.type === "timeZoneName");
  
  let offsetHours = 3; // Default São Paulo (UTC-3)
  if (tzPart) {
    const match = tzPart.value.match(/GMT([+-])(\d{1,2}):?(\d{2})?/);
    if (match) {
      const sign = match[1] === "+" ? -1 : 1;
      const hours = parseInt(match[2], 10);
      const minutes = parseInt(match[3] || "0", 10);
      offsetHours = sign * (hours + minutes / 60);
    }
  }
  
  // Criar a data ajustando para UTC
  const utcDate = new Date(tempDate.getTime() + offsetHours * 60 * 60 * 1000);
  
  return utcDate;
}

// Formata hora no timezone específico
function formatTimeInTimezone(date: Date, timezone: string): string {
  return date.toLocaleTimeString("pt-BR", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Obtém hora e minuto no timezone específico
function getHourMinuteInTimezone(date: Date, timezone: string): { hour: number; minute: number } {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  });
  
  const parts = formatter.formatToParts(date);
  const hourPart = parts.find(p => p.type === "hour");
  const minutePart = parts.find(p => p.type === "minute");
  
  return {
    hour: parseInt(hourPart?.value || "0", 10),
    minute: parseInt(minutePart?.value || "0", 10),
  };
}

// GET - Buscar horários disponíveis
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      include: {
        tenant: {
          select: { 
            id: true, 
            timezone: true,
            businessHours: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    const tenantId = user.tenantId;
    const timezone = user.tenant?.timezone || DEFAULT_TIMEZONE;
    const businessHours = user.tenant?.businessHours as Record<string, { open: string; close: string; enabled: boolean }> || {};

    // Query params
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date"); // YYYY-MM-DD
    const professionalId = searchParams.get("professionalId");
    const serviceId = searchParams.get("serviceId");

    if (!date) {
      return NextResponse.json({ error: "Data é obrigatória" }, { status: 400 });
    }

    // Parse da data
    const [year, month, day] = date.split("-").map(Number);
    
    // Obter dia da semana no timezone correto
    const tempDate = new Date(year, month - 1, day, 12, 0, 0); // Meio-dia para evitar problemas
    const dayOfWeek = tempDate.toLocaleDateString("en-US", { 
      weekday: "long",
      timeZone: timezone,
    }).toLowerCase();

    // Verificar horário de funcionamento
    const dayHours = businessHours[dayOfWeek];
    if (!dayHours?.enabled) {
      return NextResponse.json({
        date,
        professionalId,
        slots: [],
        message: "Estabelecimento fechado neste dia",
      });
    }

    // Parse dos horários de funcionamento
    const [openHour, openMin] = dayHours.open.split(":").map(Number);
    const [closeHour, closeMin] = dayHours.close.split(":").map(Number);

    // Se tiver serviceId, pegar duração do serviço
    let duration = 60;
    if (serviceId) {
      const service = await prisma.service.findUnique({
        where: { id: serviceId },
      });
      if (service) {
        duration = service.duration;
      }
    }

    // Buscar professional para buffer time
    let bufferTime = 15;
    if (professionalId) {
      const professional = await prisma.professional.findUnique({
        where: { id: professionalId },
      });
      if (professional?.bufferTime) {
        bufferTime = professional.bufferTime;
      }
    }

    // Criar datas de início e fim do dia no timezone correto
    const dayStartUTC = createDateInTimezone(year, month - 1, day, openHour, openMin, timezone);
    const dayEndUTC = createDateInTimezone(year, month - 1, day, closeHour, closeMin, timezone);

    console.log(`[Available Slots] Date: ${date} | Timezone: ${timezone}`);
    console.log(`[Available Slots] Business hours: ${dayHours.open} - ${dayHours.close}`);
    console.log(`[Available Slots] UTC range: ${dayStartUTC.toISOString()} - ${dayEndUTC.toISOString()}`);

    // Buscar agendamentos existentes
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        tenantId,
        ...(professionalId ? { professionalId } : {}),
        startTime: { gte: dayStartUTC },
        endTime: { lte: new Date(dayEndUTC.getTime() + 24 * 60 * 60 * 1000) }, // Margem de segurança
        status: { notIn: ["CANCELED"] },
      },
      select: { startTime: true, endTime: true, professionalId: true },
    });

    // Converter para timestamps para comparação fácil
    const busyTimes = existingAppointments.map(a => ({
      start: a.startTime.getTime(),
      end: a.endTime.getTime(),
      professionalId: a.professionalId,
    }));

    // Gerar slots disponíveis
    const slots: Array<{
      start: string;
      end: string;
      formatted: string;
      available: boolean;
    }> = [];

    const slotDuration = duration + bufferTime;
    let currentTime = new Date(dayStartUTC);
    const now = new Date();

    while (currentTime.getTime() + duration * 60 * 1000 <= dayEndUTC.getTime()) {
      const slotEnd = new Date(currentTime.getTime() + duration * 60 * 1000);
      const slotMs = currentTime.getTime();
      const slotEndMs = slotEnd.getTime();

      // Verificar se está livre
      const isBusy = busyTimes.some(bt => {
        // Se temos professionalId específico, verificar só para ele
        if (professionalId && bt.professionalId !== professionalId) {
          return false;
        }
        
        // Verificar sobreposição
        return (slotMs >= bt.start && slotMs < bt.end) ||
               (slotEndMs > bt.start && slotEndMs <= bt.end) ||
               (slotMs <= bt.start && slotEndMs >= bt.end);
      });

      // Verificar se não é no passado
      const isInFuture = currentTime > now;

      if (!isBusy && isInFuture) {
        slots.push({
          start: currentTime.toISOString(),
          end: slotEnd.toISOString(),
          formatted: formatTimeInTimezone(currentTime, timezone),
          available: true,
        });
      }

      // Avançar para próximo slot
      currentTime = new Date(currentTime.getTime() + slotDuration * 60 * 1000);
    }

    // Se tiver professionalId específico
    if (professionalId) {
      return NextResponse.json({
        date,
        professionalId,
        timezone,
        businessHours: dayHours,
        slots,
        totalAvailable: slots.length,
      });
    }

    // Se não tiver professionalId, buscar para todos os profissionais
    const professionals = await prisma.professional.findMany({
      where: { tenantId, isActive: true },
    });

    const allSlots: {
      professionalId: string;
      professionalName: string;
      slots: typeof slots;
    }[] = [];

    for (const professional of professionals) {
      // Buscar agendamentos específicos do profissional
      const profBusyTimes = busyTimes.filter(bt => bt.professionalId === professional.id);
      const profBufferTime = professional.bufferTime || 15;
      const profSlotDuration = duration + profBufferTime;

      const profSlots: typeof slots = [];
      let currentSlotTime = new Date(dayStartUTC);

      while (currentSlotTime.getTime() + duration * 60 * 1000 <= dayEndUTC.getTime()) {
        const slotEnd = new Date(currentSlotTime.getTime() + duration * 60 * 1000);
        const slotMs = currentSlotTime.getTime();
        const slotEndMs = slotEnd.getTime();

        const isBusy = profBusyTimes.some(bt =>
          (slotMs >= bt.start && slotMs < bt.end) ||
          (slotEndMs > bt.start && slotEndMs <= bt.end) ||
          (slotMs <= bt.start && slotEndMs >= bt.end)
        );

        const isInFuture = currentSlotTime > now;

        if (!isBusy && isInFuture) {
          profSlots.push({
            start: currentSlotTime.toISOString(),
            end: slotEnd.toISOString(),
            formatted: formatTimeInTimezone(currentSlotTime, timezone),
            available: true,
          });
        }

        currentSlotTime = new Date(currentSlotTime.getTime() + profSlotDuration * 60 * 1000);
      }

      allSlots.push({
        professionalId: professional.id,
        professionalName: professional.name,
        slots: profSlots,
      });
    }

    return NextResponse.json({
      date,
      timezone,
      businessHours: dayHours,
      professionals: allSlots,
    });
  } catch (error) {
    console.error("[Available Slots API] Error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar horários disponíveis" },
      { status: 500 }
    );
  }
}
