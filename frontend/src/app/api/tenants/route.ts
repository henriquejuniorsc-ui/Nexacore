import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

// Schema de validação do onboarding
const onboardingSchema = z.object({
  clinicName: z.string().min(2),
  slug: z.string().min(2),
  phone: z.string().min(10),
  email: z.string().email().or(z.literal("")),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  businessHours: z.record(z.object({
    enabled: z.boolean(),
    open: z.string(),
    close: z.string(),
  })),
  professionals: z.array(z.object({
    name: z.string(),
    specialty: z.string().optional(),
    email: z.string().email().or(z.literal("")),
  })),
  services: z.array(z.object({
    name: z.string(),
    duration: z.number(),
    price: z.number(),
  })),
});

// GET - Obter dados do tenant do usuário
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    // Se não autenticado, retornar needsOnboarding sem erro
    // Isso evita loop infinito quando sessão ainda está sendo estabelecida
    if (!userId) {
      console.log("[Tenants API] No userId - returning needsOnboarding");
      return NextResponse.json({
        needsOnboarding: true,
        tenant: null,
        reason: "not_authenticated",
      });
    }

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      include: {
        tenant: {
          include: {
            subscription: true,
            professionals: { where: { isActive: true } },
            services: { where: { isActive: true } },
            _count: {
              select: {
                clients: true,
                appointments: true,
              },
            },
          },
        },
      },
    });

    // Usuário não existe no banco - precisa de onboarding
    // IMPORTANTE: Não retornar erro, apenas indicar que precisa de onboarding
    if (!user?.tenant) {
      console.log(`[Tenants API] User ${userId} not found or no tenant - needs onboarding`);
      return NextResponse.json({
        needsOnboarding: true,
        tenant: null,
        reason: "user_not_provisioned",
      });
    }

    return NextResponse.json({
      needsOnboarding: false,
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        slug: user.tenant.slug,
        phone: user.tenant.phone,
        email: user.tenant.email,
        address: user.tenant.address,
        city: user.tenant.city,
        state: user.tenant.state,
        businessHours: user.tenant.businessHours,
        aiEnabled: user.tenant.aiEnabled,
        subscription: user.tenant.subscription,
        stats: {
          professionals: user.tenant.professionals.length,
          services: user.tenant.services.length,
          clients: user.tenant._count.clients,
          appointments: user.tenant._count.appointments,
        },
      },
    });
  } catch (error) {
    console.error("[Tenants API] Error:", error);
    // Em caso de erro, retornar needsOnboarding para evitar loop
    return NextResponse.json({
      needsOnboarding: true,
      tenant: null,
      reason: "error",
    });
  }
}

// POST - Criar tenant (onboarding)
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    const clerkUser = await currentUser();

    if (!userId || !clerkUser) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Verificar se já tem tenant
    const existingUser = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Usuário já possui uma clínica cadastrada" },
        { status: 409 }
      );
    }

    const body = await request.json();

    // Validar dados
    const validation = onboardingSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Verificar se slug já existe
    const existingSlug = await prisma.tenant.findUnique({
      where: { slug: data.slug },
    });

    if (existingSlug) {
      return NextResponse.json(
        { error: "Este slug já está em uso. Escolha outro." },
        { status: 409 }
      );
    }

    // Criar tudo em uma transação
    const result = await prisma.$transaction(async (tx) => {
      // 1. Criar tenant
      const tenant = await tx.tenant.create({
        data: {
          name: data.clinicName,
          slug: data.slug,
          phone: data.phone.replace(/\D/g, ""),
          email: data.email,
          address: data.address,
          city: data.city,
          state: data.state,
          businessHours: data.businessHours,
          aiEnabled: true,
        },
      });

      // 2. Criar subscription (trial de 14 dias)
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 14);

      await tx.subscription.create({
        data: {
          tenantId: tenant.id,
          plan: "STARTER",
          status: "TRIALING",
          trialEndsAt: trialEnd,
        },
      });

      // 3. Criar usuário
      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          clerkUserId: userId,
          email: clerkUser.emailAddresses[0]?.emailAddress || data.email,
          name: clerkUser.fullName || data.clinicName,
          role: "OWNER",
        },
      });

      // 4. Criar profissionais
      const professionals = await Promise.all(
        data.professionals.map((pro) =>
          tx.professional.create({
            data: {
              tenantId: tenant.id,
              name: pro.name,
              email: pro.email,
              specialty: pro.specialty,
            },
          })
        )
      );

      // 5. Criar tipos de procedimento padrão
      const defaultProcedureTypes = [
        { name: "Botox", reminderDays: 120 },
        { name: "Preenchimento Labial", reminderDays: 180 },
        { name: "Preenchimento Facial", reminderDays: 365 },
        { name: "Limpeza de Pele", reminderDays: 30 },
        { name: "Harmonização Facial", reminderDays: 365 },
        { name: "Skinbooster", reminderDays: 90 },
        { name: "Peeling Químico", reminderDays: 30 },
        { name: "Bioestimulador de Colágeno", reminderDays: 365 },
      ];

      const procedureTypes = await Promise.all(
        defaultProcedureTypes.map((pt) =>
          tx.procedureType.create({
            data: {
              tenantId: tenant.id,
              name: pt.name,
              reminderDays: pt.reminderDays,
            },
          })
        )
      );

      // 6. Criar serviços
      const services = await Promise.all(
        data.services.map(async (svc) => {
          // Tentar encontrar procedureType correspondente
          const matchingPT = procedureTypes.find(
            (pt) => pt.name.toLowerCase().includes(svc.name.toLowerCase()) ||
              svc.name.toLowerCase().includes(pt.name.toLowerCase())
          );

          return tx.service.create({
            data: {
              tenantId: tenant.id,
              name: svc.name,
              duration: svc.duration,
              price: svc.price,
              procedureTypeId: matchingPT?.id,
            },
          });
        })
      );

      // 7. Vincular profissionais aos serviços
      for (const professional of professionals) {
        for (const service of services) {
          await tx.professionalService.create({
            data: {
              professionalId: professional.id,
              serviceId: service.id,
            },
          });
        }
      }

      return { tenant, user, professionals, services };
    });

    return NextResponse.json({
      success: true,
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        slug: result.tenant.slug,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("[Tenants API] Error creating:", error);
    return NextResponse.json({ error: "Erro ao criar clínica" }, { status: 500 });
  }
}

// PATCH - Atualizar tenant
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

    // Verificar se é owner
    if (user.role !== "OWNER" && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const body = await request.json();

    const tenant = await prisma.tenant.update({
      where: { id: user.tenantId },
      data: {
        name: body.name,
        phone: body.phone?.replace(/\D/g, ""),
        email: body.email,
        address: body.address,
        city: body.city,
        state: body.state,
        zipCode: body.zipCode,
        businessHours: body.businessHours,
        aiEnabled: body.aiEnabled,
        systemPrompt: body.systemPrompt,
      },
    });

    return NextResponse.json({ success: true, tenant });
  } catch (error) {
    console.error("[Tenants API] Error updating:", error);
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  }
}
