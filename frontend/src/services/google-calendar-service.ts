import { google, calendar_v3 } from "googleapis";
import prisma from "@/lib/prisma";

// ==================== TYPES ====================
interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: Date;
  end: Date;
  attendees?: string[];
  location?: string;
}

interface AvailableSlot {
  start: Date;
  end: Date;
}

// ==================== OAUTH CLIENT ====================
function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/google`
  );
}

// ==================== GENERATE AUTH URL ====================
export function generateAuthUrl(tenantId: string, professionalId?: string): string {
  const oauth2Client = getOAuthClient();
  
  // State contém informações para identificar o tenant/professional após callback
  const state = Buffer.from(JSON.stringify({ tenantId, professionalId })).toString("base64");
  
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events",
    ],
    state,
  });
}

// ==================== EXCHANGE CODE FOR TOKENS ====================
export async function exchangeCodeForTokens(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expiry_date: number;
}> {
  const oauth2Client = getOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);
  
  return {
    access_token: tokens.access_token!,
    refresh_token: tokens.refresh_token!,
    expiry_date: tokens.expiry_date!,
  };
}

// ==================== GET CALENDAR CLIENT ====================
async function getCalendarClient(tenantId: string): Promise<calendar_v3.Calendar | null> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
  });

  if (!tenant?.googleCredentials) {
    console.log(`[Calendar] No credentials for tenant ${tenantId}`);
    return null;
  }

  const credentials = tenant.googleCredentials as {
    access_token: string;
    refresh_token: string;
    expiry_date: number;
  };

  const oauth2Client = getOAuthClient();
  oauth2Client.setCredentials(credentials);

  // Refresh token if expired
  if (credentials.expiry_date && Date.now() >= credentials.expiry_date) {
    try {
      const { credentials: newCredentials } = await oauth2Client.refreshAccessToken();
      
      // Update stored credentials
      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          googleCredentials: {
            access_token: newCredentials.access_token,
            refresh_token: newCredentials.refresh_token || credentials.refresh_token,
            expiry_date: newCredentials.expiry_date,
          },
        },
      });

      oauth2Client.setCredentials(newCredentials);
    } catch (error) {
      console.error(`[Calendar] Failed to refresh token for tenant ${tenantId}:`, error);
      return null;
    }
  }

  return google.calendar({ version: "v3", auth: oauth2Client });
}

// ==================== LIST CALENDARS ====================
export async function listCalendars(tenantId: string): Promise<{ id: string; summary: string }[]> {
  const calendar = await getCalendarClient(tenantId);
  if (!calendar) return [];

  try {
    const response = await calendar.calendarList.list();
    return (response.data.items || []).map((cal) => ({
      id: cal.id!,
      summary: cal.summary!,
    }));
  } catch (error) {
    console.error("[Calendar] Error listing calendars:", error);
    return [];
  }
}

// ==================== CREATE EVENT ====================
export async function createCalendarEvent(
  tenantId: string,
  calendarId: string,
  event: CalendarEvent
): Promise<string | null> {
  const calendar = await getCalendarClient(tenantId);
  if (!calendar) return null;

  try {
    const response = await calendar.events.insert({
      calendarId,
      requestBody: {
        summary: event.summary,
        description: event.description,
        start: {
          dateTime: event.start.toISOString(),
          timeZone: "America/Sao_Paulo",
        },
        end: {
          dateTime: event.end.toISOString(),
          timeZone: "America/Sao_Paulo",
        },
        attendees: event.attendees?.map((email) => ({ email })),
        location: event.location,
        reminders: {
          useDefault: false,
          overrides: [
            { method: "email", minutes: 24 * 60 }, // 24 hours
            { method: "popup", minutes: 60 }, // 1 hour
          ],
        },
      },
    });

    console.log(`[Calendar] Created event ${response.data.id} for tenant ${tenantId}`);
    return response.data.id!;
  } catch (error) {
    console.error("[Calendar] Error creating event:", error);
    return null;
  }
}

// ==================== UPDATE EVENT ====================
export async function updateCalendarEvent(
  tenantId: string,
  calendarId: string,
  eventId: string,
  event: Partial<CalendarEvent>
): Promise<boolean> {
  const calendar = await getCalendarClient(tenantId);
  if (!calendar) return false;

  try {
    await calendar.events.patch({
      calendarId,
      eventId,
      requestBody: {
        summary: event.summary,
        description: event.description,
        start: event.start
          ? { dateTime: event.start.toISOString(), timeZone: "America/Sao_Paulo" }
          : undefined,
        end: event.end
          ? { dateTime: event.end.toISOString(), timeZone: "America/Sao_Paulo" }
          : undefined,
      },
    });

    console.log(`[Calendar] Updated event ${eventId}`);
    return true;
  } catch (error) {
    console.error("[Calendar] Error updating event:", error);
    return false;
  }
}

// ==================== DELETE EVENT ====================
export async function deleteCalendarEvent(
  tenantId: string,
  calendarId: string,
  eventId: string
): Promise<boolean> {
  const calendar = await getCalendarClient(tenantId);
  if (!calendar) return false;

  try {
    await calendar.events.delete({
      calendarId,
      eventId,
    });

    console.log(`[Calendar] Deleted event ${eventId}`);
    return true;
  } catch (error) {
    console.error("[Calendar] Error deleting event:", error);
    return false;
  }
}

// ==================== GET BUSY TIMES ====================
export async function getBusyTimes(
  tenantId: string,
  calendarIds: string[],
  startDate: Date,
  endDate: Date
): Promise<{ start: Date; end: Date }[]> {
  const calendar = await getCalendarClient(tenantId);
  if (!calendar) return [];

  try {
    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        timeZone: "America/Sao_Paulo",
        items: calendarIds.map((id) => ({ id })),
      },
    });

    const busyTimes: { start: Date; end: Date }[] = [];

    for (const calendarId of calendarIds) {
      const busy = response.data.calendars?.[calendarId]?.busy || [];
      for (const slot of busy) {
        busyTimes.push({
          start: new Date(slot.start!),
          end: new Date(slot.end!),
        });
      }
    }

    return busyTimes;
  } catch (error) {
    console.error("[Calendar] Error getting busy times:", error);
    return [];
  }
}

// ==================== GET AVAILABLE SLOTS ====================
export async function getAvailableSlots(
  tenantId: string,
  professionalId: string,
  date: Date,
  durationMinutes: number = 60
): Promise<AvailableSlot[]> {
  // Get tenant and professional
  const [tenant, professional] = await Promise.all([
    prisma.tenant.findUnique({ where: { id: tenantId } }),
    prisma.professional.findUnique({ where: { id: professionalId } }),
  ]);

  if (!tenant || !professional) return [];

  // Get business hours for the day
  const dayOfWeek = date.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
  const businessHours = (tenant.businessHours as Record<string, { open: string; close: string; enabled: boolean }>) || {};
  const dayHours = businessHours[dayOfWeek];

  if (!dayHours?.enabled) return [];

  // Parse business hours
  const [openHour, openMin] = dayHours.open.split(":").map(Number);
  const [closeHour, closeMin] = dayHours.close.split(":").map(Number);

  const dayStart = new Date(date);
  dayStart.setHours(openHour, openMin, 0, 0);

  const dayEnd = new Date(date);
  dayEnd.setHours(closeHour, closeMin, 0, 0);

  // Get busy times from Google Calendar
  const calendarIds = professional.googleCalendarId 
    ? [professional.googleCalendarId]
    : (tenant.googleCalendarIds as string[]) || [];

  const busyTimes = await getBusyTimes(tenantId, calendarIds, dayStart, dayEnd);

  // Get existing appointments from database
  const appointments = await prisma.appointment.findMany({
    where: {
      professionalId,
      startTime: { gte: dayStart },
      endTime: { lte: dayEnd },
      status: { notIn: ["CANCELED"] },
    },
  });

  // Merge busy times
  const allBusyTimes = [
    ...busyTimes,
    ...appointments.map((a) => ({ start: a.startTime, end: a.endTime })),
  ].sort((a, b) => a.start.getTime() - b.start.getTime());

  // Generate available slots
  const slots: AvailableSlot[] = [];
  let currentTime = new Date(dayStart);
  const bufferMinutes = professional.bufferTime || 15;
  const slotDuration = durationMinutes + bufferMinutes;

  while (currentTime.getTime() + durationMinutes * 60 * 1000 <= dayEnd.getTime()) {
    const slotEnd = new Date(currentTime.getTime() + durationMinutes * 60 * 1000);

    // Check if slot conflicts with any busy time
    const hasConflict = allBusyTimes.some(
      (busy) =>
        (currentTime >= busy.start && currentTime < busy.end) ||
        (slotEnd > busy.start && slotEnd <= busy.end) ||
        (currentTime <= busy.start && slotEnd >= busy.end)
    );

    if (!hasConflict && currentTime > new Date()) {
      slots.push({
        start: new Date(currentTime),
        end: slotEnd,
      });
    }

    // Move to next slot
    currentTime = new Date(currentTime.getTime() + slotDuration * 60 * 1000);
  }

  return slots;
}

// ==================== SYNC APPOINTMENT TO CALENDAR ====================
export async function syncAppointmentToCalendar(appointmentId: string): Promise<boolean> {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      tenant: true,
      client: true,
      professional: true,
      service: true,
    },
  });

  if (!appointment) return false;

  const calendarId = appointment.professional.googleCalendarId || "primary";

  const eventId = await createCalendarEvent(appointment.tenantId, calendarId, {
    summary: `${appointment.client.name} - ${appointment.service.name}`,
    description: `Cliente: ${appointment.client.name}
Telefone: ${appointment.client.phone}
Serviço: ${appointment.service.name}
Duração: ${appointment.duration} minutos
${appointment.notes ? `\nObservações: ${appointment.notes}` : ""}`,
    start: appointment.startTime,
    end: appointment.endTime,
    location: appointment.tenant.address || undefined,
  });

  if (eventId) {
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { googleEventId: eventId },
    });
    return true;
  }

  return false;
}
