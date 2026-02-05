import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";

// GET - Listar movimentações de um produto
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
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json({ error: "productId é obrigatório" }, { status: 400 });
    }

    // Verificar se produto pertence ao tenant
    const product = await prisma.product.findFirst({
      where: { id: productId, tenantId: user.tenantId },
    });

    if (!product) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
    }

    // Se for profissional, verificar se é dono do produto
    if (user.role === "PROFESSIONAL" && product.professionalId !== user.professionalId) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const movements = await prisma.stockMovement.findMany({
      where: { productId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ movements });
  } catch (error) {
    console.error("[Stock API] Error:", error);
    return NextResponse.json({ error: "Erro ao buscar movimentações" }, { status: 500 });
  }
}

// POST - Registrar movimentação
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

    if (!hasPermission(user.role, "products:manage_stock")) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const body = await request.json();
    const { productId, type, quantity, reason, unitCost } = body;

    if (!productId || !type || !quantity) {
      return NextResponse.json(
        { error: "productId, type e quantity são obrigatórios" },
        { status: 400 }
      );
    }

    if (!["IN", "OUT", "SALE", "LOSS", "ADJUST", "RETURN"].includes(type)) {
      return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
    }

    // Verificar produto
    const product = await prisma.product.findFirst({
      where: { id: productId, tenantId: user.tenantId },
    });

    if (!product) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
    }

    // Se for profissional, verificar se é dono
    if (user.role === "PROFESSIONAL" && product.professionalId !== user.professionalId) {
      return NextResponse.json({ error: "Sem permissão para este produto" }, { status: 403 });
    }

    // Calcular nova quantidade
    const isAdding = ["IN", "RETURN"].includes(type);
    const quantityChange = isAdding ? quantity : -quantity;
    const newQuantity = product.quantity + quantityChange;

    if (newQuantity < 0) {
      return NextResponse.json(
        { error: `Estoque insuficiente. Disponível: ${product.quantity}` },
        { status: 400 }
      );
    }

    // Criar movimentação e atualizar produto em transação
    const result = await prisma.$transaction(async (tx) => {
      const movement = await tx.stockMovement.create({
        data: {
          tenantId: user.tenantId,
          productId,
          type,
          quantity,
          reason,
          userId: user.id,
          unitCost: unitCost || product.costPrice,
          totalCost: (unitCost || product.costPrice) * quantity,
        },
      });

      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: { quantity: newQuantity },
      });

      return { movement, product: updatedProduct };
    });

    return NextResponse.json({
      success: true,
      movement: result.movement,
      newQuantity: result.product.quantity,
    }, { status: 201 });
  } catch (error) {
    console.error("[Stock API] Error creating:", error);
    return NextResponse.json({ error: "Erro ao registrar movimentação" }, { status: 500 });
  }
}
