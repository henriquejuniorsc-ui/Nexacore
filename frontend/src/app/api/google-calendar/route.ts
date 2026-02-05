import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { Prisma } from '@prisma/client';
import { generateAuthUrl, listCalendars } from "@/services/google-calendar-service";

// GET - Verificar status da conexão
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      include: { tenant: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    // Verificar se tem credenciais salvas
    const hasCredentials = !!user.tenant.googleCredentials;

    if (!hasCredentials) {
      return NextResponse.json({ connected: false });
    }

    // Tentar listar calendários para verificar se token é válido
    const calendars = await listCalendars(user.tenantId);

    if (calendars.length === 0) {
      // Token pode ter expirado ou sido revogado
      return NextResponse.json({ 
        connected: false,
        error: "Token expirado ou inválido"
      });
    }

    // Obter calendários selecionados
    const selectedCalendars = (user.tenant.googleCalendarIds as string[]) || [];

    return NextResponse.json({
      connected: true,
      calendars,
      selectedCalendars,
    });
  } catch (error) {
    console.error("[Google Calendar API] Error:", error);
    return NextResponse.json(
      { error: "Erro ao verificar status" },
      { status: 500 }
    );
  }
}

// DELETE - Desconectar Google Calendar
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    // Remover credenciais
    await prisma.tenant.update({
      where: { id: user.tenantId },
      data: {
        googleCredentials: Prisma.JsonNull,
        googleCalendarIds: [],
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Google Calendar API] Error disconnecting:", error);
    return NextResponse.json(
      { error: "Erro ao desconectar" },
      { status: 500 }
    );
  }
}
