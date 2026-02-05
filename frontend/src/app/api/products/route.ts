import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { hasPermission, canViewAll } from "@/lib/permissions";

// GET - Listar produtos
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      include: { professional: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    if (!hasPermission(user.role, "products:view")) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const professionalId = searchParams.get("professionalId");
    const lowStock = searchParams.get("lowStock") === "true";

    // Montar filtro
    const where: any = { tenantId: user.tenantId };

    // Se não pode ver todos, filtrar por profissional
    if (!canViewAll(user.role, "products")) {
      if (user.professionalId) {
        where.professionalId = user.professionalId;
      } else {
        return NextResponse.json({ products: [] });
      }
    } else if (professionalId) {
      where.professionalId = professionalId;
    }

    // Filtro de estoque baixo
    if (lowStock) {
      where.quantity = { lte: prisma.product.fields.minQuantity };
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        professional: {
          select: { id: true, name: true },
        },
        _count: {
          select: { stockMovements: true },
        },
      },
      orderBy: [
        { category: "asc" },
        { name: "asc" },
      ],
    });

    // Calcular alertas de estoque baixo
    const lowStockCount = products.filter(p => p.quantity <= p.minQuantity).length;

    return NextResponse.json({
      products: products.map(p => ({
        ...p,
        isLowStock: p.quantity <= p.minQuantity,
        movementsCount: p._count.stockMovements,
      })),
      stats: {
        total: products.length,
        lowStock: lowStockCount,
        totalValue: products.reduce((sum, p) => sum + (p.costPrice * p.quantity), 0),
      },
    });
  } catch (error) {
    console.error("[Products API] Error:", error);
    return NextResponse.json({ error: "Erro ao buscar produtos" }, { status: 500 });
  }
}

// POST - Criar produto
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

    if (!hasPermission(user.role, "products:create")) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      description,
      sku,
      barcode,
      costPrice,
      salePrice,
      quantity,
      minQuantity,
      unit,
      category,
      brand,
      professionalId,
    } = body;

    if (!name) {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
    }

    // Se for profissional, só pode criar para si mesmo
    let finalProfessionalId = professionalId;
    if (user.role === "PROFESSIONAL" && user.professionalId) {
      finalProfessionalId = user.professionalId;
    }

    const product = await prisma.product.create({
      data: {
        tenantId: user.tenantId,
        professionalId: finalProfessionalId,
        name,
        description,
        sku,
        barcode,
        costPrice: costPrice || 0,
        salePrice: salePrice || 0,
        quantity: quantity || 0,
        minQuantity: minQuantity || 5,
        unit: unit || "un",
        category,
        brand,
      },
    });

    // Se tem quantidade inicial, registrar entrada
    if (quantity && quantity > 0) {
      await prisma.stockMovement.create({
        data: {
          tenantId: user.tenantId,
          productId: product.id,
          type: "IN",
          quantity,
          reason: "Estoque inicial",
          userId: user.id,
          unitCost: costPrice,
          totalCost: costPrice * quantity,
        },
      });
    }

    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "SKU já existe" }, { status: 409 });
    }
    console.error("[Products API] Error creating:", error);
    return NextResponse.json({ error: "Erro ao criar produto" }, { status: 500 });
  }
}

// PATCH - Atualizar produto
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

    if (!hasPermission(user.role, "products:edit")) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    // Verificar se produto pertence ao tenant
    const product = await prisma.product.findFirst({
      where: { id, tenantId: user.tenantId },
    });

    if (!product) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
    }

    // Se for profissional, só pode editar próprios produtos
    if (user.role === "PROFESSIONAL" && product.professionalId !== user.professionalId) {
      return NextResponse.json({ error: "Sem permissão para este produto" }, { status: 403 });
    }

    const updated = await prisma.product.update({
      where: { id },
      data: updates,
    });

    return NextResponse.json({ success: true, product: updated });
  } catch (error) {
    console.error("[Products API] Error updating:", error);
    return NextResponse.json({ error: "Erro ao atualizar produto" }, { status: 500 });
  }
}

// DELETE - Desativar produto
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

    if (!hasPermission(user.role, "products:edit")) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    const product = await prisma.product.findFirst({
      where: { id, tenantId: user.tenantId },
    });

    if (!product) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
    }

    if (user.role === "PROFESSIONAL" && product.professionalId !== user.professionalId) {
      return NextResponse.json({ error: "Sem permissão para este produto" }, { status: 403 });
    }

    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Products API] Error deleting:", error);
    return NextResponse.json({ error: "Erro ao excluir produto" }, { status: 500 });
  }
}
