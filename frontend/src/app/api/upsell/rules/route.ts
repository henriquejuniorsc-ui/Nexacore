import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

// GET - Listar regras de upsell
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
    const isActive = searchParams.get("isActive");

    const rules = await prisma.upsellRule.findMany({
      where: {
        tenantId: user.tenantId,
        ...(isActive !== null ? { isActive: isActive === "true" } : {}),
      },
      include: {
        triggerService: {
          select: { id: true, name: true, price: true, duration: true },
        },
        suggestService: {
          select: { id: true, name: true, price: true, duration: true },
        },
        _count: {
          select: {
            suggestions: true,
          },
        },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    });

    // Buscar estatísticas de conversão para cada regra
    const rulesWithStats = await Promise.all(
      rules.map(async (rule) => {
        const stats = await prisma.upsellSuggestion.groupBy({
          by: ["status"],
          where: { ruleId: rule.id },
          _count: true,
        });

        const suggested = stats.reduce((sum, s) => sum + s._count, 0);
        const converted = stats.find((s) => s.status === "CONVERTED")?._count || 0;
        const accepted = stats.find((s) => s.status === "ACCEPTED")?._count || 0;
        const rejected = stats.find((s) => s.status === "REJECTED")?._count || 0;

        return {
          ...rule,
          stats: {
            totalSuggested: suggested,
            converted,
            accepted,
            rejected,
            conversionRate: suggested > 0 ? Math.round((converted / suggested) * 100) : 0,
          },
        };
      })
    );

    return NextResponse.json({ rules: rulesWithStats });
  } catch (error) {
    console.error("Upsell Rules GET Error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar regras de upsell" },
      { status: 500 }
    );
  }
}

// POST - Criar nova regra de upsell
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user || !["OWNER", "ADMIN"].includes(user.role)) {
      return NextResponse.json(
        { error: "Sem permissão para criar regras" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      triggerServiceId,
      suggestServiceId,
      discountPercent,
      discountFixed,
      priority,
      suggestTiming,
      minDaysSinceLastService,
      maxTimesOffered,
      customMessage,
    } = body;

    // Validar campos obrigatórios
    if (!name || !triggerServiceId || !suggestServiceId) {
      return NextResponse.json(
        { error: "Nome, serviço gatilho e serviço sugerido são obrigatórios" },
        { status: 400 }
      );
    }

    // Verificar se os serviços existem
    const [triggerService, suggestService] = await Promise.all([
      prisma.service.findFirst({
        where: { id: triggerServiceId, tenantId: user.tenantId },
      }),
      prisma.service.findFirst({
        where: { id: suggestServiceId, tenantId: user.tenantId },
      }),
    ]);

    if (!triggerService || !suggestService) {
      return NextResponse.json(
        { error: "Serviço não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se já existe regra igual
    const existingRule = await prisma.upsellRule.findUnique({
      where: {
        tenantId_triggerServiceId_suggestServiceId: {
          tenantId: user.tenantId,
          triggerServiceId,
          suggestServiceId,
        },
      },
    });

    if (existingRule) {
      return NextResponse.json(
        { error: "Já existe uma regra para essa combinação de serviços" },
        { status: 409 }
      );
    }

    const rule = await prisma.upsellRule.create({
      data: {
        tenantId: user.tenantId,
        name,
        description,
        triggerServiceId,
        suggestServiceId,
        discountPercent: discountPercent || 0,
        discountFixed: discountFixed || 0,
        priority: priority || 0,
        suggestTiming: suggestTiming || "AFTER_BOOKING",
        minDaysSinceLastService,
        maxTimesOffered: maxTimesOffered || 3,
        customMessage,
      },
      include: {
        triggerService: {
          select: { id: true, name: true, price: true },
        },
        suggestService: {
          select: { id: true, name: true, price: true },
        },
      },
    });

    return NextResponse.json({ rule }, { status: 201 });
  } catch (error) {
    console.error("Upsell Rules POST Error:", error);
    return NextResponse.json(
      { error: "Erro ao criar regra de upsell" },
      { status: 500 }
    );
  }
}

// PATCH - Atualizar regra de upsell
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user || !["OWNER", "ADMIN"].includes(user.role)) {
      return NextResponse.json(
        { error: "Sem permissão para editar regras" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    // Verificar se regra pertence ao tenant
    const existingRule = await prisma.upsellRule.findFirst({
      where: { id, tenantId: user.tenantId },
    });

    if (!existingRule) {
      return NextResponse.json(
        { error: "Regra não encontrada" },
        { status: 404 }
      );
    }

    const rule = await prisma.upsellRule.update({
      where: { id },
      data: updateData,
      include: {
        triggerService: {
          select: { id: true, name: true, price: true },
        },
        suggestService: {
          select: { id: true, name: true, price: true },
        },
      },
    });

    return NextResponse.json({ rule });
  } catch (error) {
    console.error("Upsell Rules PATCH Error:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar regra de upsell" },
      { status: 500 }
    );
  }
}

// DELETE - Excluir regra de upsell
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user || !["OWNER", "ADMIN"].includes(user.role)) {
      return NextResponse.json(
        { error: "Sem permissão para excluir regras" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    // Verificar se regra pertence ao tenant
    const existingRule = await prisma.upsellRule.findFirst({
      where: { id, tenantId: user.tenantId },
    });

    if (!existingRule) {
      return NextResponse.json(
        { error: "Regra não encontrada" },
        { status: 404 }
      );
    }

    await prisma.upsellRule.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Upsell Rules DELETE Error:", error);
    return NextResponse.json(
      { error: "Erro ao excluir regra de upsell" },
      { status: 500 }
    );
  }
}
