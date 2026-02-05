import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

// GET - Listar sugestões de upsell
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
    const status = searchParams.get("status");
    const clientId = searchParams.get("clientId");
    const ruleId = searchParams.get("ruleId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const page = parseInt(searchParams.get("page") || "1");

    const where: any = { tenantId: user.tenantId };
    if (status) where.status = status;
    if (clientId) where.clientId = clientId;
    if (ruleId) where.ruleId = ruleId;

    const [suggestions, total] = await Promise.all([
      prisma.upsellSuggestion.findMany({
        where,
        include: {
          rule: {
            select: { name: true, discountPercent: true, discountFixed: true },
          },
          client: {
            select: { id: true, name: true, phone: true },
          },
          triggerAppointment: {
            select: {
              id: true,
              startTime: true,
              service: { select: { name: true } },
            },
          },
          resultAppointment: {
            select: {
              id: true,
              startTime: true,
              service: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.upsellSuggestion.count({ where }),
    ]);

    return NextResponse.json({
      suggestions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Upsell Suggestions GET Error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar sugestões de upsell" },
      { status: 500 }
    );
  }
}

// POST - Criar sugestão de upsell (chamado pela IA ou sistema)
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const {
      ruleId,
      clientId,
      triggerAppointmentId,
      originalPrice,
      discountAmount,
      finalPrice,
      channel,
    } = body;

    if (!ruleId || !clientId) {
      return NextResponse.json(
        { error: "ruleId e clientId são obrigatórios" },
        { status: 400 }
      );
    }

    // Verificar se a regra existe e pertence ao tenant
    const rule = await prisma.upsellRule.findFirst({
      where: { id: ruleId, tenantId: user.tenantId },
      include: { suggestService: true },
    });

    if (!rule) {
      return NextResponse.json({ error: "Regra não encontrada" }, { status: 404 });
    }

    // Verificar se já não sugerimos muitas vezes para esse cliente
    if (rule.maxTimesOffered) {
      const previousSuggestions = await prisma.upsellSuggestion.count({
        where: {
          ruleId,
          clientId,
          status: { notIn: ["CONVERTED"] }, // Ignorar se já converteu
        },
      });

      if (previousSuggestions >= rule.maxTimesOffered) {
        return NextResponse.json(
          { error: "Limite de sugestões atingido para este cliente" },
          { status: 429 }
        );
      }
    }

    // Calcular preços se não fornecidos
    const calculatedOriginalPrice = originalPrice || rule.suggestService.price;
    const calculatedDiscount =
      discountAmount ||
      (rule.discountPercent
        ? (calculatedOriginalPrice * rule.discountPercent) / 100
        : rule.discountFixed || 0);
    const calculatedFinalPrice =
      finalPrice || calculatedOriginalPrice - calculatedDiscount;

    const suggestion = await prisma.upsellSuggestion.create({
      data: {
        tenantId: user.tenantId,
        ruleId,
        clientId,
        triggerAppointmentId,
        originalPrice: calculatedOriginalPrice,
        discountAmount: calculatedDiscount,
        finalPrice: calculatedFinalPrice,
        channel: channel || "WHATSAPP",
        status: "SUGGESTED",
      },
      include: {
        rule: {
          select: { name: true, suggestService: { select: { name: true, price: true } } },
        },
        client: {
          select: { name: true, phone: true },
        },
      },
    });

    return NextResponse.json({ suggestion }, { status: 201 });
  } catch (error) {
    console.error("Upsell Suggestions POST Error:", error);
    return NextResponse.json(
      { error: "Erro ao criar sugestão de upsell" },
      { status: 500 }
    );
  }
}

// PATCH - Atualizar status de sugestão (aceitar, rejeitar, converter)
export async function PATCH(request: NextRequest) {
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

    const body = await request.json();
    const { id, status, clientResponse, resultAppointmentId } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: "ID e status são obrigatórios" },
        { status: 400 }
      );
    }

    // Verificar se sugestão pertence ao tenant
    const existingSuggestion = await prisma.upsellSuggestion.findFirst({
      where: { id, tenantId: user.tenantId },
    });

    if (!existingSuggestion) {
      return NextResponse.json(
        { error: "Sugestão não encontrada" },
        { status: 404 }
      );
    }

    // Preparar dados de atualização baseado no novo status
    const updateData: any = { status };

    switch (status) {
      case "VIEWED":
        updateData.viewedAt = new Date();
        break;
      case "ACCEPTED":
        updateData.respondedAt = new Date();
        break;
      case "REJECTED":
        updateData.rejectedAt = new Date();
        updateData.respondedAt = new Date();
        break;
      case "CONVERTED":
        updateData.convertedAt = new Date();
        if (resultAppointmentId) {
          updateData.resultAppointmentId = resultAppointmentId;
        }
        break;
    }

    if (clientResponse) {
      updateData.clientResponse = clientResponse;
    }

    const suggestion = await prisma.upsellSuggestion.update({
      where: { id },
      data: updateData,
      include: {
        rule: {
          select: { name: true },
        },
        client: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json({ suggestion });
  } catch (error) {
    console.error("Upsell Suggestions PATCH Error:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar sugestão de upsell" },
      { status: 500 }
    );
  }
}
