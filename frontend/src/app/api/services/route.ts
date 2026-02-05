import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

// Schema de validação
const createServiceSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z.string().optional().nullable(),
  duration: z.number().min(15, "Duração mínima de 15 minutos"),
  price: z.number().min(0, "Preço não pode ser negativo"),
  category: z.string().optional().nullable(),
  procedureTypeId: z.string().optional().nullable(),
  reminderDays: z.number().optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

// Helper para obter tenant do usuário
async function getTenantId(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
  });
  return user?.tenantId || null;
}

// GET - Listar serviços
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const tenantId = await getTenantId(userId);
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant não encontrado" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("includeInactive") === "true";

    const where: any = { tenantId };
    if (!includeInactive) {
      where.isActive = true;
    }

    const services = await prisma.service.findMany({
      where,
      include: {
        procedureType: {
          select: { name: true, reminderDays: true },
        },
        _count: {
          select: { appointments: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      services: services.map((service) => ({
        id: service.id,
        name: service.name,
        description: service.description,
        duration: service.duration,
        price: service.price,
        category: service.category,
        procedureType: service.procedureType?.name,
        reminderDays: service.procedureType?.reminderDays,
        isActive: service.isActive,
        appointmentsCount: service._count.appointments,
      })),
    });
  } catch (error) {
    console.error("[Services API] Error:", error);
    return NextResponse.json({ error: "Erro ao buscar serviços" }, { status: 500 });
  }
}

// POST - Criar serviço
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const tenantId = await getTenantId(userId);
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant não encontrado" }, { status: 404 });
    }

    const body = await request.json();

    // Validar dados
    const validation = createServiceSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Se tiver reminderDays, criar/buscar procedureType
    let procedureTypeId = data.procedureTypeId;
    if (data.reminderDays && !procedureTypeId) {
      const procedureType = await prisma.procedureType.upsert({
        where: {
          tenantId_name: {
            tenantId,
            name: data.name,
          },
        },
        update: {
          reminderDays: data.reminderDays,
        },
        create: {
          tenantId,
          name: data.name,
          reminderDays: data.reminderDays,
        },
      });
      procedureTypeId = procedureType.id;
    }

    // Criar serviço
    const service = await prisma.service.create({
      data: {
        tenantId,
        name: data.name,
        description: data.description,
        duration: data.duration,
        price: data.price,
        category: data.category,
        procedureTypeId,
        isActive: data.isActive,
      },
    });

    return NextResponse.json({ success: true, service }, { status: 201 });
  } catch (error) {
    console.error("[Services API] Error creating:", error);
    return NextResponse.json({ error: "Erro ao criar serviço" }, { status: 500 });
  }
}

// PATCH - Atualizar serviço
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const tenantId = await getTenantId(userId);
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant não encontrado" }, { status: 404 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    // Verificar se pertence ao tenant
    const existing = await prisma.service.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Serviço não encontrado" }, { status: 404 });
    }

    const service = await prisma.service.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, service });
  } catch (error) {
    console.error("[Services API] Error updating:", error);
    return NextResponse.json({ error: "Erro ao atualizar serviço" }, { status: 500 });
  }
}

// DELETE - Desativar serviço (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const tenantId = await getTenantId(userId);
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant não encontrado" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    // Verificar se pertence ao tenant
    const existing = await prisma.service.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Serviço não encontrado" }, { status: 404 });
    }

    // Soft delete
    await prisma.service.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Services API] Error deleting:", error);
    return NextResponse.json({ error: "Erro ao deletar serviço" }, { status: 500 });
  }
}
