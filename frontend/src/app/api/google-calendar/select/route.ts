import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

// POST - Selecionar/desselecionar calendário
export async function POST(request: NextRequest) {
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

    const { calendarId, selected } = await request.json();

    if (!calendarId) {
      return NextResponse.json(
        { error: "calendarId é obrigatório" },
        { status: 400 }
      );
    }

    // Obter calendários selecionados atuais
    let selectedCalendars = (user.tenant.googleCalendarIds as string[]) || [];

    if (selected) {
      // Adicionar se não existir
      if (!selectedCalendars.includes(calendarId)) {
        selectedCalendars.push(calendarId);
      }
    } else {
      // Remover
      selectedCalendars = selectedCalendars.filter((id) => id !== calendarId);
    }

    // Atualizar no banco
    await prisma.tenant.update({
      where: { id: user.tenantId },
      data: {
        googleCalendarIds: selectedCalendars,
      },
    });

    return NextResponse.json({
      success: true,
      selectedCalendars,
    });
  } catch (error) {
    console.error("[Google Calendar Select] Error:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar calendários" },
      { status: 500 }
    );
  }
}
