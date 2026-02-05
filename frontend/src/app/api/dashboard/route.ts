import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

// GET - Obter dados do dashboard
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

    if (!user || !user.tenant) {
      // Usuário não completou onboarding
      return NextResponse.json({
        stats: {
          todayAppointments: 0,
          appointmentsChange: 0,
          newClients: 0,
          clientsChange: 0,
          monthRevenue: 0,
          revenueChange: 0,
          conversionRate: 0,
          totalClients: 0,
        },
        todayAppointments: [],
        pendingReminders: [],
        recentConversations: [],
        tenant: {
          name: "Sua Clínica",
          aiEnabled: false,
        },
        needsOnboarding: true,
      });
    }

    const tenantId = user.tenantId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    // Buscar dados em paralelo
    const [
      todayAppointments,
      monthAppointments,
      lastMonthAppointments,
      monthClients,
      lastMonthClients,
      monthRevenue,
      lastMonthRevenue,
      pendingReminders,
      recentMessages,
      totalClients,
    ] = await Promise.all([
      // Agendamentos de hoje
      prisma.appointment.findMany({
        where: {
          tenantId,
          startTime: { gte: today, lt: tomorrow },
          status: { notIn: ["CANCELED"] },
        },
        include: {
          client: { select: { name: true, phone: true } },
          service: { select: { name: true } },
          professional: { select: { name: true } },
        },
        orderBy: { startTime: "asc" },
      }),

      // Agendamentos do mês
      prisma.appointment.count({
        where: {
          tenantId,
          startTime: { gte: startOfMonth },
          status: { notIn: ["CANCELED"] },
        },
      }),

      // Agendamentos do mês passado
      prisma.appointment.count({
        where: {
          tenantId,
          startTime: { gte: startOfLastMonth, lte: endOfLastMonth },
          status: { notIn: ["CANCELED"] },
        },
      }),

      // Novos clientes do mês
      prisma.client.count({
        where: {
          tenantId,
          createdAt: { gte: startOfMonth },
        },
      }),

      // Clientes do mês passado
      prisma.client.count({
        where: {
          tenantId,
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
      }),

      // Faturamento do mês
      prisma.payment.aggregate({
        where: {
          tenantId,
          status: { in: ["RECEIVED", "CONFIRMED"] },
          paidAt: { gte: startOfMonth },
        },
        _sum: { amount: true },
      }),

      // Faturamento do mês passado
      prisma.payment.aggregate({
        where: {
          tenantId,
          status: { in: ["RECEIVED", "CONFIRMED"] },
          paidAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
        _sum: { amount: true },
      }),

      // Lembretes pendentes
      prisma.procedureRecord.findMany({
        where: {
          client: { tenantId },
          procedureType: { reminderEnabled: true },
          reminderSentAt: null,
          nextReminderAt: { lte: new Date() },
        },
        include: {
          client: { select: { name: true, phone: true } },
          procedureType: { select: { name: true } },
        },
        take: 5,
        orderBy: { nextReminderAt: "asc" },
      }),

      // Conversas recentes
      prisma.message.findMany({
        where: {
          tenantId,
          role: "HUMAN",
        },
        include: {
          client: { select: { name: true, phone: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
        distinct: ["clientId"],
      }),

      // Total de clientes
      prisma.client.count({
        where: { tenantId },
      }),
    ]);

    // Calcular variações
    const appointmentsChange = lastMonthAppointments > 0
      ? Math.round(((monthAppointments - lastMonthAppointments) / lastMonthAppointments) * 100)
      : 0;

    const clientsChange = lastMonthClients > 0
      ? Math.round(((monthClients - lastMonthClients) / lastMonthClients) * 100)
      : 0;

    const currentRevenue = monthRevenue._sum.amount || 0;
    const previousRevenue = lastMonthRevenue._sum.amount || 0;
    const revenueChange = previousRevenue > 0
      ? Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 100)
      : 0;

    // Taxa de conversão (agendamentos confirmados / total de leads do mês)
    const confirmedAppointments = await prisma.appointment.count({
      where: {
        tenantId,
        startTime: { gte: startOfMonth },
        status: "CONFIRMED",
      },
    });
    const conversionRate = monthAppointments > 0
      ? Math.round((confirmedAppointments / monthAppointments) * 100)
      : 0;

    return NextResponse.json({
      stats: {
        todayAppointments: todayAppointments.length,
        appointmentsChange,
        newClients: monthClients,
        clientsChange,
        monthRevenue: currentRevenue,
        revenueChange,
        conversionRate,
        totalClients,
      },
      todayAppointments: todayAppointments.map((apt) => ({
        id: apt.id,
        time: apt.startTime.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        client: apt.client.name,
        service: apt.service.name,
        professional: apt.professional.name,
        status: apt.status,
      })),
      pendingReminders: pendingReminders.map((rem) => ({
        id: rem.id,
        client: rem.client.name,
        phone: rem.client.phone,
        procedure: rem.procedureType.name,
        performedAt: rem.performedAt,
        nextReminderAt: rem.nextReminderAt,
      })),
      recentConversations: recentMessages.map((msg) => ({
        id: msg.id,
        client: msg.client.name,
        phone: msg.client.phone,
        lastMessage: msg.content.substring(0, 50) + (msg.content.length > 50 ? "..." : ""),
        time: msg.createdAt,
      })),
      tenant: {
        name: user.tenant.name,
        aiEnabled: user.tenant.aiEnabled,
      },
    });
  } catch (error) {
    console.error("[Dashboard API] Error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar dados do dashboard" },
      { status: 500 }
    );
  }
}
