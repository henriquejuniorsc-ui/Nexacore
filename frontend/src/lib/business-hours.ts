/**
 * NexaCore - Business Hours Utility
 * Verifica se está dentro do horário de atendimento
 */

interface DayConfig {
  enabled: boolean;
  start: string; // "09:00"
  end: string;   // "18:00"
}

interface BusinessHours {
  [key: string]: DayConfig | undefined;
}

const DAYS_MAP: Record<number, string> = {
  0: "sunday",
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
};

const DAYS_PT: Record<string, string> = {
  sunday: "domingo",
  monday: "segunda-feira",
  tuesday: "terça-feira",
  wednesday: "quarta-feira",
  thursday: "quinta-feira",
  friday: "sexta-feira",
  saturday: "sábado",
};

export function isWithinBusinessHours(
  businessHours: BusinessHours | null | undefined,
  timezone: string = "America/Sao_Paulo"
): { isOpen: boolean; message?: string } {
  // Se não tem horário configurado, sempre aberto
  if (!businessHours || typeof businessHours !== 'object') {
    return { isOpen: true };
  }

  try {
    const now = new Date();
    
    // Converter para o timezone do tenant
    const options: Intl.DateTimeFormatOptions = {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      weekday: "long",
    };
    
    const formatter = new Intl.DateTimeFormat("en-US", options);
    const parts = formatter.formatToParts(now);
    
    const hour = parts.find((p) => p.type === "hour")?.value || "00";
    const minute = parts.find((p) => p.type === "minute")?.value || "00";
    const currentTime = `${hour}:${minute}`;
    
    const dayOfWeek = now.toLocaleDateString("en-US", { timeZone: timezone, weekday: "long" }).toLowerCase();
    const dayConfig = businessHours[dayOfWeek];

    // Dia não configurado ou desabilitado
    if (!dayConfig || !dayConfig.enabled) {
      return {
        isOpen: false,
        message: getClosedMessage(businessHours, timezone),
      };
    }

    // Verificar se start e end existem
    const start = dayConfig.start || "09:00";
    const end = dayConfig.end || "18:00";
    
    if (currentTime >= start && currentTime <= end) {
      return { isOpen: true };
    }

    return {
      isOpen: false,
      message: getClosedMessage(businessHours, timezone),
    };
  } catch (error) {
    console.error("Error checking business hours:", error);
    return { isOpen: true }; // Em caso de erro, permite
  }
}

function getClosedMessage(businessHours: BusinessHours, timezone: string): string {
  // Encontrar próximo dia/horário aberto
  const now = new Date();
  const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const currentDayIndex = now.getDay();

  for (let i = 0; i < 7; i++) {
    const checkDayIndex = (currentDayIndex + i) % 7;
    const dayName = daysOfWeek[checkDayIndex];
    const dayConfig = businessHours[dayName];

    if (dayConfig?.enabled && dayConfig.start && dayConfig.end) {
      const dayLabel = i === 0 ? "hoje" : i === 1 ? "amanhã" : getDayLabel(dayName);
      return `Olá! 😊 Nosso horário de atendimento é de ${dayConfig.start} às ${dayConfig.end}. Retornaremos ${dayLabel}. Deixe sua mensagem que responderemos assim que possível!`;
    }
  }

  // Fallback se não encontrar nenhum dia configurado corretamente
  return "Olá! 😊 No momento estamos fora do horário de atendimento. Deixe sua mensagem que responderemos assim que possível!";
}

function getDayLabel(day: string): string {
  const labels: Record<string, string> = {
    sunday: "no domingo",
    monday: "na segunda-feira",
    tuesday: "na terça-feira",
    wednesday: "na quarta-feira",
    thursday: "na quinta-feira",
    friday: "na sexta-feira",
    saturday: "no sábado",
  };
  return labels[day] || "";
}

/**
 * Gera configuração padrão de horário comercial
 */
export function getDefaultBusinessHours(): BusinessHours {
  return {
    sunday: { enabled: false, start: "09:00", end: "18:00" },
    monday: { enabled: true, start: "09:00", end: "18:00" },
    tuesday: { enabled: true, start: "09:00", end: "18:00" },
    wednesday: { enabled: true, start: "09:00", end: "18:00" },
    thursday: { enabled: true, start: "09:00", end: "18:00" },
    friday: { enabled: true, start: "09:00", end: "18:00" },
    saturday: { enabled: true, start: "09:00", end: "12:00" },
  };
}

/**
 * Valida e corrige configuração de business hours
 * Retorna configuração válida ou padrão
 */
export function validateBusinessHours(hours: unknown): BusinessHours {
  if (!hours || typeof hours !== 'object') {
    return getDefaultBusinessHours();
  }

  const validated: BusinessHours = {};
  const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const defaults = getDefaultBusinessHours();

  for (const day of daysOfWeek) {
    const dayConfig = (hours as Record<string, unknown>)[day];
    
    if (dayConfig && typeof dayConfig === 'object') {
      const config = dayConfig as Record<string, unknown>;
      validated[day] = {
        enabled: typeof config.enabled === 'boolean' ? config.enabled : false,
        start: typeof config.start === 'string' && config.start ? config.start : "09:00",
        end: typeof config.end === 'string' && config.end ? config.end : "18:00",
      };
    } else {
      validated[day] = defaults[day];
    }
  }

  return validated;
}
