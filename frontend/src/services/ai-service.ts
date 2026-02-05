import OpenAI from "openai";
import prisma from "@/lib/prisma";

/**
 * NexaCore AI Service v4.0
 * 
 * CORREÇÕES v4.0:
 * - ✅ Ano 2026 forçado no prompt (GPT assume 2024)
 * - ✅ Erro de split em businessHours corrigido
 * - ✅ Respostas humanizadas com sugestões de alternativas
 * - ✅ Nomes corretos do schema Prisma
 */

const hasOpenAI = !!process.env.OPENAI_API_KEY;
const openai = hasOpenAI ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

// Ano atual - IMPORTANTE para o GPT não confundir
const CURRENT_YEAR = 2026;

/**
 * Converte datetime string para Date considerando timezone do tenant
 * Ex: "2026-02-04T10:00:00" + "America/Sao_Paulo" = 10:00 BRT (13:00 UTC)
 */
function parseLocalDateTime(dateTimeStr: string, timezone: string = "America/Sao_Paulo"): Date | null {
  if (!dateTimeStr) return null;

  // Extrair componentes da data/hora
  let match = dateTimeStr.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!match) {
    // Tentar formato alternativo com espaço
    match = dateTimeStr.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})/);
    if (!match) return null;
  }

  const year = parseInt(match[1]);
  const month = parseInt(match[2]) - 1; // JavaScript months are 0-indexed
  const day = parseInt(match[3]);
  const hour = parseInt(match[4]);
  const minute = parseInt(match[5]);

  // Abordagem: criar data em UTC e calcular offset do timezone
  // 1. Criar uma data "fake" em UTC com os valores desejados
  const fakeUtc = new Date(Date.UTC(year, month, day, hour, minute, 0, 0));

  // 2. Ver qual seria a hora LOCAL nessa data UTC
  const localStr = fakeUtc.toLocaleString('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  const [localHour, localMinute] = localStr.split(':').map(Number);

  // 3. Calcular diferença em minutos
  const targetMinutes = hour * 60 + minute;
  const currentMinutes = localHour * 60 + localMinute;
  let offsetMinutes = targetMinutes - currentMinutes;

  // 4. Ajustar para mudança de dia (se offset > 12h ou < -12h)
  if (offsetMinutes > 720) offsetMinutes -= 1440;
  if (offsetMinutes < -720) offsetMinutes += 1440;

  // 5. Aplicar offset para obter UTC correto
  const correctUtc = new Date(fakeUtc.getTime() + offsetMinutes * 60 * 1000);

  console.log(`[AI Tool] ⏰ Timezone: ${dateTimeStr} (${timezone}) → UTC: ${correctUtc.toISOString()}`);

  return correctUtc;
}

// ==================== HELPERS ====================

function formatDateBR(date: Date, timezone: string = "America/Sao_Paulo"): string {
  return date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: timezone,
  });
}

function formatTimeBR(date: Date, timezone: string = "America/Sao_Paulo"): string {
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  });
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function getNowInTimezone(timezone: string = "America/Sao_Paulo"): Date {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(now);
  const get = (type: string) => parts.find(p => p.type === type)?.value || "0";

  return new Date(
    parseInt(get("year")),
    parseInt(get("month")) - 1,
    parseInt(get("day")),
    parseInt(get("hour")),
    parseInt(get("minute")),
    parseInt(get("second"))
  );
}

/**
 * Parseia datas - FORÇA ANO 2026 quando não especificado
 */
function parseDateFlexible(dateStr: string, timezone: string = "America/Sao_Paulo"): Date | null {
  if (!dateStr) return null;

  const now = getNowInTimezone(timezone);
  const lower = dateStr.toLowerCase().trim();

  // Hoje
  if (lower === "hoje" || lower.includes("hoje")) {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
  }

  // Amanhã
  if (lower === "amanhã" || lower === "amanha" || lower.includes("amanhã") || lower.includes("amanha")) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(12, 0, 0, 0);
    return tomorrow;
  }

  // Dias da semana
  const weekdays: Record<string, number> = {
    "domingo": 0, "dom": 0,
    "segunda": 1, "seg": 1, "segunda-feira": 1,
    "terça": 2, "terca": 2, "ter": 2, "terça-feira": 2,
    "quarta": 3, "qua": 3, "quarta-feira": 3,
    "quinta": 4, "qui": 4, "quinta-feira": 4,
    "sexta": 5, "sex": 5, "sexta-feira": 5,
    "sábado": 6, "sabado": 6, "sab": 6,
  };

  for (const [day, num] of Object.entries(weekdays)) {
    if (lower.includes(day)) {
      const target = new Date(now);
      const currentDay = now.getDay();
      let daysToAdd = num - currentDay;
      if (daysToAdd <= 0) daysToAdd += 7;
      target.setDate(target.getDate() + daysToAdd);
      target.setHours(12, 0, 0, 0);
      return target;
    }
  }

  // Formato ISO: YYYY-MM-DD - verifica se ano está correto
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    let [yearStr, monthStr, dayStr] = dateStr.split("-");
    let year = parseInt(yearStr);

    // CORREÇÃO: Se o ano for 2024 ou 2025, assume 2026
    if (year < CURRENT_YEAR) {
      year = CURRENT_YEAR;
      console.log(`[AI Tool] ⚠️ Ano corrigido de ${yearStr} para ${CURRENT_YEAR}`);
    }

    const date = new Date(year, parseInt(monthStr) - 1, parseInt(dayStr), 12, 0, 0);
    if (!isNaN(date.getTime())) return date;
  }

  // Formato BR: DD/MM/YYYY ou DD/MM/YY ou DD/MM
  const brMatch = dateStr.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/);
  if (brMatch) {
    const day = parseInt(brMatch[1]);
    const month = parseInt(brMatch[2]) - 1;
    let year = CURRENT_YEAR;

    if (brMatch[3]) {
      year = parseInt(brMatch[3]);
      // Se for ano com 2 dígitos (ex: 26), converte para 2026
      if (year < 100) {
        year = 2000 + year;
      }
      // Se o ano for passado, assume ano atual
      if (year < CURRENT_YEAR) {
        year = CURRENT_YEAR;
      }
    }

    const date = new Date(year, month, day, 12, 0, 0);

    // Se a data já passou (mesmo mês/dia mas no passado), assume próximo ano
    if (!brMatch[3] && date < now) {
      date.setFullYear(date.getFullYear() + 1);
    }

    if (!isNaN(date.getTime())) return date;
  }

  return null;
}

// ==================== TYPES ====================

interface ConversationMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface BusinessHoursDay {
  enabled: boolean;
  start?: string;
  end?: string;
}

interface BusinessHours {
  [key: string]: BusinessHoursDay | undefined;
}

// ==================== TOOLS ====================

const tools: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "get_available_services",
      description: "Lista todos os serviços disponíveis com preços e duração",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_professionals_for_service",
      description: "Lista profissionais que realizam um serviço específico",
      parameters: {
        type: "object",
        properties: {
          serviceId: { type: "string", description: "ID do serviço" },
        },
        required: ["serviceId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_available_slots",
      description: `IMPORTANTE: Busca horários DISPONÍVEIS para uma data. 
SEMPRE use esta função antes de agendar!
O ano atual é ${CURRENT_YEAR}, então '05/02' significa 05/02/${CURRENT_YEAR}.
Aceita: 'amanhã', 'segunda', '05/02', '${CURRENT_YEAR}-02-05'`,
      parameters: {
        type: "object",
        properties: {
          professionalId: { type: "string", description: "ID do profissional (opcional)" },
          serviceId: { type: "string", description: "ID do serviço (opcional)" },
          date: { type: "string", description: `Data. IMPORTANTE: Use ano ${CURRENT_YEAR}. Ex: ${CURRENT_YEAR}-02-05` },
        },
        required: ["date"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_appointment",
      description: "Cria agendamento APÓS confirmação explícita do cliente (sim, confirmo, ok)",
      parameters: {
        type: "object",
        properties: {
          clientPhone: { type: "string" },
          clientName: { type: "string" },
          serviceId: { type: "string" },
          professionalId: { type: "string" },
          dateTime: { type: "string", description: `Data/hora ISO. Ex: ${CURRENT_YEAR}-02-05T14:00:00` },
        },
        required: ["clientPhone", "clientName", "serviceId", "professionalId", "dateTime"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_client_appointments",
      description: "Lista agendamentos futuros do cliente",
      parameters: {
        type: "object",
        properties: {
          clientPhone: { type: "string" },
        },
        required: ["clientPhone"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "cancel_appointment",
      description: "Cancela um agendamento",
      parameters: {
        type: "object",
        properties: {
          appointmentId: { type: "string" },
        },
        required: ["appointmentId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_upsell_suggestion",
      description: "Busca oferta especial após confirmar agendamento",
      parameters: {
        type: "object",
        properties: {
          serviceId: { type: "string" },
          clientPhone: { type: "string" },
        },
        required: ["serviceId", "clientPhone"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "record_upsell_response",
      description: "Registra resposta do cliente à oferta",
      parameters: {
        type: "object",
        properties: {
          suggestionId: { type: "string" },
          accepted: { type: "boolean" },
        },
        required: ["suggestionId", "accepted"],
      },
    },
  },
];

// ==================== TOOL IMPLEMENTATIONS ====================

async function executeToolCall(
  tenantId: string,
  toolName: string,
  args: any,
  timezone: string = "America/Sao_Paulo"
): Promise<string> {
  console.log(`[AI Tool] ▶️ ${toolName}`, JSON.stringify(args));

  try {
    switch (toolName) {
      case "get_available_services": {
        const services = await prisma.service.findMany({
          where: { tenantId, isActive: true },
          include: {
            professionals: {
              include: { professional: { select: { id: true, name: true } } },
            },
          },
        });

        if (services.length === 0) {
          console.log(`[AI Tool] ⚠️ Nenhum serviço cadastrado`);
          return JSON.stringify({
            error: "Nenhum serviço cadastrado",
            services: []
          });
        }

        console.log(`[AI Tool] ✅ ${services.length} serviços encontrados`);
        return JSON.stringify({
          services: services.map(s => ({
            id: s.id,
            name: s.name,
            description: s.description,
            duration: `${s.duration} minutos`,
            price: formatCurrency(s.price),
            professionals: s.professionals.map(ps => ({
              id: ps.professional.id,
              name: ps.professional.name,
            })),
          })),
        });
      }

      case "get_professionals_for_service": {
        if (!args.serviceId) {
          return JSON.stringify({ error: "serviceId é obrigatório" });
        }

        const service = await prisma.service.findFirst({
          where: { tenantId, id: args.serviceId, isActive: true },
          include: {
            professionals: {
              include: {
                professional: {
                  select: { id: true, name: true, specialty: true, isActive: true },
                },
              },
            },
          },
        });

        if (!service) {
          return JSON.stringify({ error: "Serviço não encontrado" });
        }

        const activePros = service.professionals
          .filter(ps => ps.professional.isActive)
          .map(ps => ({
            id: ps.professional.id,
            name: ps.professional.name,
            specialty: ps.professional.specialty,
          }));

        console.log(`[AI Tool] ✅ ${activePros.length} profissionais para ${service.name}`);
        return JSON.stringify({
          service: service.name,
          professionals: activePros,
        });
      }

      case "get_available_slots": {
        if (!args.date) {
          return JSON.stringify({ error: "Data é obrigatória" });
        }

        const parsedDate = parseDateFlexible(args.date, timezone);
        if (!parsedDate) {
          console.log(`[AI Tool] ⚠️ Data inválida: ${args.date}`);
          return JSON.stringify({
            error: `Data inválida: ${args.date}`,
            hint: `Use formato: amanhã, segunda, 05/02, ou ${CURRENT_YEAR}-02-05`
          });
        }

        const now = getNowInTimezone(timezone);
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const requestedDate = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());

        // Verificar data no passado
        if (requestedDate < today) {
          console.log(`[AI Tool] ⚠️ Data no passado: ${args.date}`);

          // Sugerir próximas datas disponíveis
          const nextDays = [];
          for (let i = 1; i <= 5; i++) {
            const nextDay = new Date(today);
            nextDay.setDate(nextDay.getDate() + i);
            nextDays.push(formatDateBR(nextDay, timezone));
          }

          return JSON.stringify({
            error: "Esta data já passou",
            dataSolicitada: formatDateBR(requestedDate, timezone),
            hoje: formatDateBR(today, timezone),
            sugestao: `Que tal uma dessas datas? ${nextDays.slice(0, 3).join(", ")}`,
            proximasDatas: nextDays,
          });
        }

        // Buscar configurações do tenant
        const tenant = await prisma.tenant.findUnique({
          where: { id: tenantId },
          select: { businessHours: true, timezone: true },
        });

        // Horários padrão
        let startHour = 8;
        let endHour = 18;

        const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
        const dayOfWeekEn = dayNames[requestedDate.getDay()];
        const dayOfWeekPt = formatDateBR(requestedDate, timezone).split(",")[0] || "dia";

        const businessHours = tenant?.businessHours as BusinessHours | null;

        if (businessHours && businessHours[dayOfWeekEn]) {
          const dayConfig = businessHours[dayOfWeekEn];

          if (dayConfig && !dayConfig.enabled) {
            console.log(`[AI Tool] ⚠️ Fechado em ${dayOfWeekPt}`);

            // Encontrar próximo dia aberto
            const proximoDiaAberto = [];
            for (let i = 1; i <= 7; i++) {
              const nextDay = new Date(requestedDate);
              nextDay.setDate(nextDay.getDate() + i);
              const nextDayName = dayNames[nextDay.getDay()];
              const nextConfig = businessHours[nextDayName];

              if (!nextConfig || nextConfig.enabled !== false) {
                proximoDiaAberto.push(formatDateBR(nextDay, timezone));
                if (proximoDiaAberto.length >= 3) break;
              }
            }

            return JSON.stringify({
              date: formatDateBR(requestedDate, timezone),
              closed: true,
              message: `Infelizmente não funcionamos ${dayOfWeekPt}`,
              sugestao: proximoDiaAberto.length > 0
                ? `Posso sugerir: ${proximoDiaAberto.join(" ou ")}?`
                : "Por favor, escolha outro dia",
              proximosDiasAbertos: proximoDiaAberto,
              availableSlots: [],
            });
          }

          // CORREÇÃO: Verificar se start e end existem antes de usar split
          if (dayConfig && dayConfig.enabled && dayConfig.start && dayConfig.end) {
            const startParts = dayConfig.start.split(":");
            const endParts = dayConfig.end.split(":");
            if (startParts.length >= 1) startHour = parseInt(startParts[0]) || 8;
            if (endParts.length >= 1) endHour = parseInt(endParts[0]) || 18;
          }
        }

        // Buscar agendamentos existentes
        const dateStart = new Date(requestedDate);
        dateStart.setHours(0, 0, 0, 0);
        const dateEnd = new Date(requestedDate);
        dateEnd.setHours(23, 59, 59, 999);

        const whereClause: any = {
          tenantId,
          startTime: { gte: dateStart, lte: dateEnd },
          status: { notIn: ["CANCELED"] },
        };

        if (args.professionalId) {
          whereClause.professionalId = args.professionalId;
        }

        const existingAppointments = await prisma.appointment.findMany({
          where: whereClause,
          select: { startTime: true, endTime: true },
        });

        // Gerar slots
        const slots: string[] = [];
        const busyTimes = existingAppointments.map(a => ({
          start: a.startTime.getTime(),
          end: a.endTime.getTime(),
        }));

        for (let hour = startHour; hour < endHour; hour++) {
          for (let minute = 0; minute < 60; minute += 30) {
            const slotTime = new Date(requestedDate);
            slotTime.setHours(hour, minute, 0, 0);

            // Se é hoje, pular horários passados
            if (requestedDate.toDateString() === today.toDateString()) {
              if (slotTime <= now) continue;
            }

            const slotMs = slotTime.getTime();
            const isBusy = busyTimes.some(bt => slotMs >= bt.start && slotMs < bt.end);

            if (!isBusy) {
              slots.push(formatTimeBR(slotTime, timezone));
            }
          }
        }

        console.log(`[AI Tool] ✅ ${slots.length} horários em ${formatDateBR(requestedDate, timezone)}`);

        // Preparar resposta humanizada
        const dateISO = `${requestedDate.getFullYear()}-${String(requestedDate.getMonth() + 1).padStart(2, '0')}-${String(requestedDate.getDate()).padStart(2, '0')}`;

        if (slots.length === 0) {
          // Buscar próximos dias com disponibilidade
          const diasComVaga = [];
          for (let i = 1; i <= 7; i++) {
            const nextDay = new Date(requestedDate);
            nextDay.setDate(nextDay.getDate() + i);
            diasComVaga.push(formatDateBR(nextDay, timezone));
            if (diasComVaga.length >= 3) break;
          }

          return JSON.stringify({
            date: formatDateBR(requestedDate, timezone),
            dateISO,
            availableSlots: [],
            totalAvailable: 0,
            message: "Que pena! Não temos horários disponíveis neste dia",
            sugestao: `Posso verificar disponibilidade em: ${diasComVaga.join(", ")}?`,
            outrosDias: diasComVaga,
          });
        }

        return JSON.stringify({
          date: formatDateBR(requestedDate, timezone),
          dateISO,
          horarioFuncionamento: `${startHour}:00 às ${endHour}:00`,
          availableSlots: slots.slice(0, 12),
          totalAvailable: slots.length,
          message: `Temos ${slots.length} horários disponíveis! 😊`,
        });
      }

      case "create_appointment": {
        if (!args.clientPhone || !args.clientName || !args.serviceId || !args.professionalId || !args.dateTime) {
          return JSON.stringify({ error: "Dados incompletos para agendamento" });
        }

        // Buscar ou criar cliente
        let client = await prisma.client.findFirst({
          where: { tenantId, phone: { contains: args.clientPhone.slice(-8) } },
        });

        if (!client) {
          client = await prisma.client.create({
            data: {
              tenantId,
              phone: args.clientPhone,
              name: args.clientName,
            },
          });
          console.log(`[AI Tool] 👤 Novo cliente: ${client.id}`);
        }

        // Buscar serviço
        const service = await prisma.service.findFirst({
          where: { tenantId, id: args.serviceId, isActive: true },
        });

        if (!service) {
          return JSON.stringify({ error: "Serviço não encontrado" });
        }

        // Buscar profissional
        const professional = await prisma.professional.findFirst({
          where: { tenantId, id: args.professionalId, isActive: true },
        });

        if (!professional) {
          return JSON.stringify({ error: "Profissional não encontrado" });
        }

        // Parsear data/hora COM TIMEZONE CORRETO
        const startTime = parseLocalDateTime(args.dateTime, timezone);
        if (!startTime) {
          return JSON.stringify({ error: `Data/hora inválida: ${args.dateTime}` });
        }

        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + service.duration);

        // Verificar conflito
        const conflict = await prisma.appointment.findFirst({
          where: {
            tenantId,
            professionalId: args.professionalId,
            status: { notIn: ["CANCELED"] },
            OR: [
              { startTime: { gte: startTime, lt: endTime } },
              { endTime: { gt: startTime, lte: endTime } },
              { AND: [{ startTime: { lte: startTime } }, { endTime: { gte: endTime } }] },
            ],
          },
        });

        if (conflict) {
          console.log(`[AI Tool] ⚠️ Conflito de horário`);
          return JSON.stringify({
            error: "Este horário não está mais disponível",
            sugestao: "Use get_available_slots para ver horários livres",
          });
        }

        // Criar agendamento
        const appointment = await prisma.appointment.create({
          data: {
            tenantId,
            clientId: client.id,
            professionalId: args.professionalId,
            serviceId: args.serviceId,
            startTime,
            endTime,
            duration: service.duration,
            price: service.price,
            status: "SCHEDULED",
            source: "AI",
          },
        });

        // Registrar atividade
        const conversation = await prisma.conversation.findUnique({
          where: { tenantId_clientId: { tenantId, clientId: client.id } },
        });

        if (conversation) {
          await prisma.conversationActivity.create({
            data: {
              conversationId: conversation.id,
              type: "APPOINTMENT_CREATED",
              title: "✅ Agendamento criado pela IA",
              description: `${service.name} com ${professional.name}`,
              metadata: { appointmentId: appointment.id },
            },
          });
        }

        console.log(`[AI Tool] ✅ Agendamento criado: ${appointment.id}`);

        return JSON.stringify({
          success: true,
          message: "Agendamento confirmado com sucesso! 🎉",
          appointment: {
            id: appointment.id,
            service: service.name,
            professional: professional.name,
            date: formatDateBR(startTime, timezone),
            time: formatTimeBR(startTime, timezone),
            duration: `${service.duration} minutos`,
            price: formatCurrency(service.price),
          },
        });
      }

      case "get_client_appointments": {
        if (!args.clientPhone) {
          return JSON.stringify({ error: "clientPhone é obrigatório" });
        }

        const client = await prisma.client.findFirst({
          where: { tenantId, phone: { contains: args.clientPhone.slice(-8) } },
        });

        if (!client) {
          return JSON.stringify({
            appointments: [],
            message: "Você ainda não tem agendamentos conosco",
          });
        }

        const appointments = await prisma.appointment.findMany({
          where: {
            tenantId,
            clientId: client.id,
            startTime: { gte: new Date() },
            status: { notIn: ["CANCELED", "NO_SHOW"] },
          },
          include: {
            service: { select: { name: true } },
            professional: { select: { name: true } },
          },
          orderBy: { startTime: "asc" },
          take: 5,
        });

        console.log(`[AI Tool] ✅ ${appointments.length} agendamentos`);

        return JSON.stringify({
          appointments: appointments.map(a => ({
            id: a.id,
            service: a.service.name,
            professional: a.professional.name,
            date: formatDateBR(a.startTime, timezone),
            time: formatTimeBR(a.startTime, timezone),
            status: a.status === "SCHEDULED" ? "Agendado" : a.status,
          })),
        });
      }

      case "cancel_appointment": {
        if (!args.appointmentId) {
          return JSON.stringify({ error: "appointmentId é obrigatório" });
        }

        const appointment = await prisma.appointment.findFirst({
          where: { tenantId, id: args.appointmentId },
          include: { service: true, professional: true },
        });

        if (!appointment) {
          return JSON.stringify({ error: "Agendamento não encontrado" });
        }

        if (appointment.status === "CANCELED") {
          return JSON.stringify({ error: "Agendamento já cancelado" });
        }

        await prisma.appointment.update({
          where: { id: args.appointmentId },
          data: { status: "CANCELED" },
        });

        console.log(`[AI Tool] ✅ Cancelado: ${args.appointmentId}`);

        return JSON.stringify({
          success: true,
          message: "Agendamento cancelado",
          appointment: {
            service: appointment.service.name,
            date: formatDateBR(appointment.startTime, timezone),
            time: formatTimeBR(appointment.startTime, timezone),
          },
        });
      }

      case "get_upsell_suggestion": {
        if (!args.serviceId || !args.clientPhone) {
          return JSON.stringify({ suggestion: null });
        }

        const upsellClient = await prisma.client.findFirst({
          where: { tenantId, phone: { contains: args.clientPhone.slice(-8) } },
        });

        if (!upsellClient) {
          return JSON.stringify({ suggestion: null });
        }

        const upsellRule = await prisma.upsellRule.findFirst({
          where: {
            tenantId,
            triggerServiceId: args.serviceId,
            isActive: true,
          },
          include: {
            suggestService: true,
          },
        });

        if (!upsellRule) {
          return JSON.stringify({ suggestion: null });
        }

        const recentSuggestion = await prisma.upsellSuggestion.findFirst({
          where: {
            tenantId,
            ruleId: upsellRule.id,
            clientId: upsellClient.id,
            createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          },
        });

        if (recentSuggestion) {
          return JSON.stringify({ suggestion: null });
        }

        const suggestion = await prisma.upsellSuggestion.create({
          data: {
            tenantId,
            ruleId: upsellRule.id,
            clientId: upsellClient.id,
            status: "SUGGESTED",
          },
        });

        const discountPercent = upsellRule.discountPercent || 0;
        const discountedPrice = upsellRule.suggestService.price * (1 - discountPercent / 100);

        console.log(`[AI Tool] ✅ Upsell: ${upsellRule.suggestService.name}`);

        return JSON.stringify({
          suggestion: {
            id: suggestion.id,
            service: upsellRule.suggestService.name,
            description: upsellRule.suggestService.description,
            originalPrice: formatCurrency(upsellRule.suggestService.price),
            discountPercent,
            discountedPrice: formatCurrency(discountedPrice),
            message: upsellRule.customMessage || upsellRule.description,
          },
        });
      }

      case "record_upsell_response": {
        if (!args.suggestionId) {
          return JSON.stringify({ error: "suggestionId obrigatório" });
        }

        await prisma.upsellSuggestion.update({
          where: { id: args.suggestionId },
          data: {
            status: args.accepted ? "ACCEPTED" : "REJECTED",
          },
        });

        console.log(`[AI Tool] ✅ Upsell: ${args.accepted ? "aceito" : "recusado"}`);
        return JSON.stringify({ success: true });
      }

      default:
        return JSON.stringify({ error: `Função desconhecida: ${toolName}` });
    }
  } catch (error) {
    console.error(`[AI Tool] ❌ Erro em ${toolName}:`, error);
    return JSON.stringify({ error: String(error) });
  }
}

// ==================== CUSTOMER AI CHAT (WhatsApp) ====================

export async function chatWithCustomerAI(
  tenantId: string,
  clientPhone: string,
  clientName: string,
  message: string,
  conversationHistory: ConversationMessage[] = []
): Promise<string> {
  if (!openai) {
    return `Olá! 😊 No momento não consigo processar mensagens automaticamente. Por favor, aguarde nosso atendimento.`;
  }

  console.log(`[AI] 📩 Mensagem de ${clientName} (${clientPhone}): "${message.slice(0, 100)}..."`);

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      services: { where: { isActive: true } },
      professionals: { where: { isActive: true } },
    },
  });

  if (!tenant) {
    throw new Error("Tenant não encontrado");
  }

  const timezone = tenant.timezone || "America/Sao_Paulo";
  const now = getNowInTimezone(timezone);

  // Data formatada com ANO para deixar claro
  const currentDateFull = now.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: timezone,
  });
  const currentTime = formatTimeBR(now, timezone);

  // Informações da clínica
  const clinicInfo = [
    tenant.description ? `📝 ${tenant.description}` : null,
    tenant.address ? `📍 ${tenant.address}${tenant.city ? `, ${tenant.city}` : ""}` : null,
    tenant.phone ? `📞 ${tenant.phone}` : null,
  ].filter(Boolean).join("\n");

  // Serviços
  const servicesInfo = tenant.services.length > 0
    ? tenant.services.map(s =>
      `• ${s.name}: ${formatCurrency(s.price)} (${s.duration}min) [ID: ${s.id}]`
    ).join("\n")
    : "⚠️ Nenhum serviço cadastrado";

  // Profissionais
  const professionalsInfo = tenant.professionals.length > 0
    ? tenant.professionals.map(p =>
      `• ${p.name}${p.specialty ? ` (${p.specialty})` : ""} [ID: ${p.id}]`
    ).join("\n")
    : "⚠️ Nenhum profissional cadastrado";

  const customPrompt = tenant.systemPrompt?.trim() || "";

  const systemPrompt = `Você é a secretária virtual da "${tenant.name}".
Atenda os clientes via WhatsApp de forma simpática, profissional e EFICIENTE.

🏥 CLÍNICA: ${tenant.name}
${clinicInfo}

⚠️ ATENÇÃO - ANO ATUAL: ${CURRENT_YEAR}
📅 HOJE É: ${currentDateFull}, ${currentTime}
Quando o cliente falar "05/02" ou "dia 5", significa 05/02/${CURRENT_YEAR}!
SEMPRE use o ano ${CURRENT_YEAR} nas datas!

💆 SERVIÇOS:
${servicesInfo}

👩‍⚕️ PROFISSIONAIS:
${professionalsInfo}

👤 CLIENTE: ${clientName} (${clientPhone})

${customPrompt ? `\n📋 INSTRUÇÕES DA CLÍNICA:\n${customPrompt}\n` : ""}

🎯 COMO AGENDAR:
1. Pergunte qual serviço deseja
2. Pergunte qual profissional prefere (ou sugira)
3. Pergunte qual data/horário
4. USE get_available_slots para ver horários REAIS
5. Mostre opções e pergunte qual prefere
6. CONFIRME tudo antes de criar
7. Só crie após cliente confirmar (sim, ok, confirmo)

💡 DICAS IMPORTANTES:
- Se não tem horário no dia, SUGIRA outros dias!
- Seja simpática e use emojis moderadamente
- Mensagens curtas (é WhatsApp!)
- Se dia fechado, sugira próximo dia aberto
- NUNCA invente horários - sempre consulte get_available_slots

📝 FORMATO DE CONFIRMAÇÃO:
"Posso confirmar? 😊
📅 [Data completa]
⏰ [Horário]
💆 [Serviço]  
👩‍⚕️ [Profissional]
💰 [Valor]

Confirma?"`;

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...conversationHistory.map((m) => ({
      role: m.role as "user" | "assistant" | "system",
      content: m.content,
    })),
    { role: "user", content: message },
  ];

  try {
    let response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      tools,
      tool_choice: "auto",
      temperature: 0.7,
      max_tokens: 800,
    });

    let assistantMessage = response.choices[0].message;

    let iterations = 0;
    while (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0 && iterations < 5) {
      iterations++;

      const toolResults: OpenAI.Chat.ChatCompletionMessageParam[] = [];

      for (const toolCall of assistantMessage.tool_calls) {
        console.log(`[AI] 🔧 Tool #${iterations}: ${toolCall.function.name}`);

        const result = await executeToolCall(
          tenantId,
          toolCall.function.name,
          JSON.parse(toolCall.function.arguments),
          timezone
        );

        toolResults.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: result,
        });
      }

      messages.push(assistantMessage as OpenAI.Chat.ChatCompletionMessageParam);
      messages.push(...toolResults);

      response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        tools,
        tool_choice: "auto",
        temperature: 0.7,
        max_tokens: 800,
      });

      assistantMessage = response.choices[0].message;
    }

    const finalResponse = assistantMessage.content || "Desculpe, pode repetir?";
    console.log(`[AI] ✅ Resposta (${iterations} tools)`);

    return finalResponse;
  } catch (error) {
    console.error("[AI] ❌ Erro:", error);
    return "Desculpe, tive um problema técnico. Tente novamente em instantes! 🙏";
  }
}

// ==================== MANAGER AI CHAT ====================

const managerTools: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "get_appointments_today",
      description: "Agendamentos de hoje",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_revenue",
      description: "Faturamento de um período",
      parameters: {
        type: "object",
        properties: {
          startDate: { type: "string" },
          endDate: { type: "string" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_clients_without_return",
      description: "Clientes que não retornam há X dias",
      parameters: {
        type: "object",
        properties: {
          days: { type: "number" },
        },
        required: ["days"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_top_services",
      description: "Serviços mais procurados",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "number" },
        },
        required: [],
      },
    },
  },
];

async function executeManagerToolCall(
  tenantId: string,
  toolName: string,
  args: any,
  timezone: string = "America/Sao_Paulo"
): Promise<string> {
  try {
    switch (toolName) {
      case "get_appointments_today": {
        const now = getNowInTimezone(timezone);
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const appointments = await prisma.appointment.findMany({
          where: {
            tenantId,
            startTime: { gte: today, lt: tomorrow },
          },
          include: {
            client: { select: { name: true } },
            professional: { select: { name: true } },
            service: { select: { name: true } },
          },
          orderBy: { startTime: "asc" },
        });

        return JSON.stringify({
          count: appointments.length,
          appointments: appointments.map((a) => ({
            time: formatTimeBR(a.startTime, timezone),
            client: a.client.name,
            service: a.service.name,
            professional: a.professional.name,
            status: a.status,
          })),
        });
      }

      case "get_revenue": {
        const where: any = { tenantId, status: "RECEIVED" };
        if (args.startDate) where.createdAt = { gte: new Date(args.startDate) };
        if (args.endDate) where.createdAt = { ...where.createdAt, lte: new Date(args.endDate) };

        const result = await prisma.payment.aggregate({
          where,
          _sum: { amount: true },
        });

        return JSON.stringify({
          total: result._sum.amount || 0,
          formatted: formatCurrency(result._sum.amount || 0),
        });
      }

      case "get_clients_without_return": {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - args.days);

        const clients = await prisma.client.findMany({
          where: {
            tenantId,
            appointments: {
              some: { status: "COMPLETED" },
            },
          },
          include: {
            appointments: {
              where: { status: "COMPLETED" },
              orderBy: { startTime: "desc" },
              take: 1,
              include: { service: true },
            },
          },
        });

        const filtered = clients.filter((c) => {
          const lastApt = c.appointments[0];
          return lastApt && lastApt.startTime < cutoffDate;
        });

        return JSON.stringify({
          count: filtered.length,
          clients: filtered.slice(0, 10).map((c) => ({
            name: c.name,
            phone: c.phone,
            lastService: c.appointments[0]?.service?.name,
            lastVisit: formatDateBR(c.appointments[0]?.startTime, timezone),
          })),
        });
      }

      case "get_top_services": {
        const services = await prisma.appointment.groupBy({
          by: ["serviceId"],
          where: { tenantId, status: "COMPLETED" },
          _count: true,
          orderBy: { _count: { serviceId: "desc" } },
          take: args.limit || 5,
        });

        const serviceDetails = await prisma.service.findMany({
          where: { id: { in: services.map((s) => s.serviceId) } },
        });

        return JSON.stringify(
          services.map((s) => ({
            name: serviceDetails.find((sd) => sd.id === s.serviceId)?.name,
            count: s._count,
          }))
        );
      }

      default:
        return JSON.stringify({ error: "Função não implementada" });
    }
  } catch (error) {
    return JSON.stringify({ error: String(error) });
  }
}

export async function chatWithManagerAI(
  tenantId: string,
  message: string,
  conversationHistory: ConversationMessage[] = []
): Promise<string> {
  if (!openai) {
    return "IA não configurada.";
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
  });

  if (!tenant) {
    throw new Error("Tenant não encontrado");
  }

  const timezone = tenant.timezone || "America/Sao_Paulo";

  const systemPrompt = `Você é o assistente de gestão da "${tenant.name}".
Ajude com análises e relatórios. Seja direto e use números.`;

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...conversationHistory.map((m) => ({
      role: m.role as "user" | "assistant" | "system",
      content: m.content,
    })),
    { role: "user", content: message },
  ];

  let response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    tools: managerTools,
    tool_choice: "auto",
    temperature: 0.7,
    max_tokens: 1000,
  });

  let assistantMessage = response.choices[0].message;

  while (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
    const toolResults: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    for (const toolCall of assistantMessage.tool_calls) {
      const result = await executeManagerToolCall(
        tenantId,
        toolCall.function.name,
        JSON.parse(toolCall.function.arguments),
        timezone
      );

      toolResults.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: result,
      });
    }

    messages.push(assistantMessage as OpenAI.Chat.ChatCompletionMessageParam);
    messages.push(...toolResults);

    response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      tools: managerTools,
      tool_choice: "auto",
      temperature: 0.7,
      max_tokens: 1000,
    });

    assistantMessage = response.choices[0].message;
  }

  return assistantMessage.content || "Não consegui processar.";
}
