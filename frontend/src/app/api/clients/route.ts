import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

// Schema de validação
const createClientSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  phone: z.string().min(10, "Telefone inválido"),
  email: z.string().email("Email inválido").optional().nullable(),
  cpf: z.string().optional().nullable(),
  birthDate: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zipCode: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  allowsMarketing: z.boolean().optional().default(true),
});

// Helper para obter tenant do usuário
async function getTenantId(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
  });
  return user?.tenantId || null;
}

// GET - Listar clientes
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

    // Query params
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Filtros
    const where: any = {
      tenantId,
      AND: [],
    };

    if (search) {
      where.AND.push({
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { phone: { contains: search } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      });
    }

    if (status === "active") {
      where.isActive = true;
    } else if (status === "inactive") {
      where.isActive = false;
    }

    // Buscar clientes com contagem total
    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { appointments: true, payments: true },
          },
          appointments: {
            orderBy: { startTime: "desc" },
            take: 1,
            select: { startTime: true },
          },
          payments: {
            where: { status: "RECEIVED" },
            select: { amount: true },
          },
        },
      }),
      prisma.client.count({ where }),
    ]);

    // Formatar resposta
    const formattedClients = clients.map((client) => ({
      id: client.id,
      name: client.name,
      phone: client.phone,
      email: client.email,
      cpf: client.cpf,
      birthDate: client.birthDate,
      isActive: client.isActive,
      createdAt: client.createdAt,
      lastVisit: client.appointments[0]?.startTime || null,
      totalAppointments: client._count.appointments,
      totalSpent: client.payments.reduce((sum, p) => sum + p.amount, 0),
    }));

    return NextResponse.json({
      clients: formattedClients,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[Clients API] Error:", error);
    return NextResponse.json({ error: "Erro ao buscar clientes" }, { status: 500 });
  }
}

// POST - Criar cliente
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
    const validation = createClientSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Verificar se já existe cliente com mesmo telefone
    const existingClient = await prisma.client.findFirst({
      where: {
        tenantId,
        phone: data.phone.replace(/\D/g, ""),
      },
    });

    if (existingClient) {
      return NextResponse.json(
        { error: "Já existe um cliente com este telefone" },
        { status: 409 }
      );
    }

    // Criar cliente
    const client = await prisma.client.create({
      data: {
        tenantId,
        name: data.name,
        phone: data.phone.replace(/\D/g, ""),
        email: data.email,
        cpf: data.cpf,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        notes: data.notes,
        allowsMarketing: data.allowsMarketing,
      },
    });

    return NextResponse.json({ success: true, client }, { status: 201 });
  } catch (error) {
    console.error("[Clients API] Error creating:", error);
    return NextResponse.json({ error: "Erro ao criar cliente" }, { status: 500 });
  }
}
