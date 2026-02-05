import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

// GET - Buscar analytics de upsell
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30"; // dias
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Buscar todas as sugestões do período
    const suggestions = await prisma.upsellSuggestion.findMany({
      where: {
        tenantId: user.tenantId,
        createdAt: { gte: startDate },
      },
      include: {
        rule: {
          select: {
            name: true,
            suggestService: { select: { name: true, price: true } },
          },
        },
      },
    });

    // Calcular métricas gerais
    const totalSuggested = suggestions.length;
    const converted = suggestions.filter((s) => s.status === "CONVERTED");
    const accepted = suggestions.filter((s) => s.status === "ACCEPTED");
    const rejected = suggestions.filter((s) => s.status === "REJECTED");
    const pending = suggestions.filter((s) => s.status === "SUGGESTED");

    const conversionRate = totalSuggested > 0 
      ? Math.round((converted.length / totalSuggested) * 100) 
      : 0;

    const totalRevenue = converted.reduce((sum, s) => sum + (s.finalPrice || 0), 0);
    const totalDiscount = converted.reduce((sum, s) => sum + (s.discountAmount || 0), 0);
    const averageTicket = converted.length > 0 
      ? totalRevenue / converted.length 
      : 0;

    // Métricas por regra
    const ruleStats = await prisma.upsellRule.findMany({
      where: { tenantId: user.tenantId },
      include: {
        triggerService: { select: { name: true } },
        suggestService: { select: { name: true, price: true } },
        suggestions: {
          where: { createdAt: { gte: startDate } },
          select: { status: true, finalPrice: true, discountAmount: true },
        },
      },
    });

    const ruleAnalytics = ruleStats.map((rule) => {
      const ruleSuggestions = rule.suggestions;
      const ruleConverted = ruleSuggestions.filter((s) => s.status === "CONVERTED");
      const ruleRevenue = ruleConverted.reduce((sum, s) => sum + (s.finalPrice || 0), 0);

      return {
        id: rule.id,
        name: rule.name,
        triggerService: rule.triggerService.name,
        suggestService: rule.suggestService.name,
        suggested: ruleSuggestions.length,
        converted: ruleConverted.length,
        conversionRate: ruleSuggestions.length > 0 
          ? Math.round((ruleConverted.length / ruleSuggestions.length) * 100) 
          : 0,
        revenue: ruleRevenue,
        isActive: rule.isActive,
      };
    });

    // Gráfico de conversões por dia
    const dailyData: Record<string, { suggested: number; converted: number; revenue: number }> = {};
    
    suggestions.forEach((s) => {
      const dateKey = s.createdAt.toISOString().split("T")[0];
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = { suggested: 0, converted: 0, revenue: 0 };
      }
      dailyData[dateKey].suggested++;
      if (s.status === "CONVERTED") {
        dailyData[dateKey].converted++;
        dailyData[dateKey].revenue += s.finalPrice || 0;
      }
    });

    const chartData = Object.entries(dailyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date,
        ...data,
      }));

    // Top clientes que aceitaram upsell
    const topClients = await prisma.upsellSuggestion.groupBy({
      by: ["clientId"],
      where: {
        tenantId: user.tenantId,
        status: "CONVERTED",
        createdAt: { gte: startDate },
      },
      _count: true,
      _sum: { finalPrice: true },
      orderBy: { _sum: { finalPrice: "desc" } },
      take: 5,
    });

    const clientDetails = await prisma.client.findMany({
      where: { id: { in: topClients.map((c) => c.clientId) } },
      select: { id: true, name: true, phone: true },
    });

    const topClientsWithDetails = topClients.map((c) => ({
      client: clientDetails.find((cd) => cd.id === c.clientId),
      conversions: c._count,
      totalSpent: c._sum.finalPrice || 0,
    }));

    return NextResponse.json({
      period: parseInt(period),
      summary: {
        totalSuggested,
        converted: converted.length,
        accepted: accepted.length,
        rejected: rejected.length,
        pending: pending.length,
        conversionRate,
        totalRevenue,
        totalDiscount,
        averageTicket,
      },
      ruleAnalytics,
      chartData,
      topClients: topClientsWithDetails,
    });
  } catch (error) {
    console.error("Upsell Analytics GET Error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar analytics de upsell" },
      { status: 500 }
    );
  }
}
