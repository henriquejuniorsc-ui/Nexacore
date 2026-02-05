import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { Prisma } from '@prisma/client';
import { z } from "zod";

// Schema de validação
const createProfessionalSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional().nullable(),
  specialty: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  bufferTime: z.number().optional().default(15),
  workingHours: z.record(z.any()).optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

// Helper para obter tenant do usuário
async function getTenantId(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
  });
  return user?.tenantId || null;
}

// GET - Listar profissionais
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

    // Datas para estatísticas
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const professionals = await prisma.professional.findMany({
      where,
      include: {
        services: {
          include: {
            service: { select: { name: true } },
          },
        },
        appointments: {
          where: {
            startTime: { gte: startOfMonth },
            status: { notIn: ["CANCELED"] },
          },
          include: {
            payment: {
              where: { status: { in: ["RECEIVED", "CONFIRMED"] } },
              select: { amount: true },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      professionals: professionals.map((pro) => ({
        id: pro.id,
        name: pro.name,
        email: pro.email,
        phone: pro.phone,
        specialty: pro.specialty,
        bio: pro.bio,
        bufferTime: pro.bufferTime,
        workingHours: pro.workingHours,
        googleCalendarConnected: !!pro.googleCalendarId,
        isActive: pro.isActive,
        services: pro.services.map((s) => s.service.name),
        appointmentsThisMonth: pro.appointments.length,
        revenueThisMonth: pro.appointments.reduce(
          (sum, apt) => sum + (apt.payment?.amount || 0),
          0
        ),
      })),
    });
  } catch (error) {
    console.error("[Professionals API] Error:", error);
    return NextResponse.json({ error: "Erro ao buscar profissionais" }, { status: 500 });
  }
}

// POST - Criar profissional
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
    const validation = createProfessionalSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Verificar limite do plano
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        subscription: true,
        professionals: { where: { isActive: true } },
      },
    });

    if (tenant?.subscription) {
      const limits: Record<string, number> = {
        STARTER: 1,
        PRO: 5,
        BUSINESS: 15,
      };
      const maxProfessionals = limits[tenant.subscription.plan] || 1;

      if (tenant.professionals.length >= maxProfessionals) {
        return NextResponse.json(
          {
            error: `Limite de profissionais atingido (${maxProfessionals}). Faça upgrade do plano.`,
          },
          { status: 403 }
        );
      }
    }

    // Verificar se email já existe
    const existing = await prisma.professional.findFirst({
      where: { tenantId, email: data.email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Já existe um profissional com este email" },
        { status: 409 }
      );
    }

    // Criar profissional
    const professional = await prisma.professional.create({
      data: {
        tenantId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        specialty: data.specialty,
        bio: data.bio,
        bufferTime: data.bufferTime,
        workingHours: data.workingHours ?? Prisma.DbNull,
        isActive: data.isActive,
      },
    });

    return NextResponse.json({ success: true, professional }, { status: 201 });
  } catch (error) {
    console.error("[Professionals API] Error creating:", error);
    return NextResponse.json({ error: "Erro ao criar profissional" }, { status: 500 });
  }
}

// PATCH - Atualizar profissional
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
    const { id, serviceIds, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    // Verificar se pertence ao tenant
    const existing = await prisma.professional.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Profissional não encontrado" }, { status: 404 });
    }

    // Atualizar profissional
    const professional = await prisma.professional.update({
      where: { id },
      data: updateData,
    });

    // Atualizar serviços se fornecidos
    if (serviceIds && Array.isArray(serviceIds)) {
      // Remover vínculos antigos
      await prisma.professionalService.deleteMany({
        where: { professionalId: id },
      });

      // Criar novos vínculos
      await prisma.professionalService.createMany({
        data: serviceIds.map((serviceId: string) => ({
          professionalId: id,
          serviceId,
        })),
      });
    }

    return NextResponse.json({ success: true, professional });
  } catch (error) {
    console.error("[Professionals API] Error updating:", error);
    return NextResponse.json({ error: "Erro ao atualizar profissional" }, { status: 500 });
  }
}

// DELETE - Desativar profissional (soft delete)
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
    const existing = await prisma.professional.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Profissional não encontrado" }, { status: 404 });
    }

    // Soft delete
    await prisma.professional.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Professionals API] Error deleting:", error);
    return NextResponse.json({ error: "Erro ao deletar profissional" }, { status: 500 });
  }
}
