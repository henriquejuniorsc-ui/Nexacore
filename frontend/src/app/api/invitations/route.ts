import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import crypto from "crypto";

// =============================================================================
// API INVITATIONS - CORRIGIDA v2.8.0
// 
// Correções:
// - ✅ CORRIGIDO: professionalId só é enviado quando role === PROFESSIONAL
// - ✅ CORRIGIDO: Para ADMIN/RECEPTIONIST, professionalId é null
// - Permite reconvidar pessoas que tiveram convite CANCELED ou EXPIRED
// - Atualiza convite existente ao invés de criar duplicado
// - Retorna token no GET para poder copiar link depois
// =============================================================================

// GET - Listar convites (inclui token para gerar link!)
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

    if (!hasPermission(user.role, "team:view")) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const invitations = await prisma.invitation.findMany({
      where: { tenantId: user.tenantId },
      include: {
        professional: {
          select: { id: true, name: true, specialty: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // ✅ IMPORTANTE: Incluir token para poder gerar link!
    return NextResponse.json({ 
      invitations: invitations.map(inv => ({
        ...inv,
        inviteUrl: `${process.env.NEXT_PUBLIC_APP_URL}/auth/accept-invite?token=${inv.token}`,
      }))
    });
  } catch (error) {
    console.error("[Invitations API] Error:", error);
    return NextResponse.json({ error: "Erro ao buscar convites" }, { status: 500 });
  }
}

// POST - Criar ou atualizar convite
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      include: { tenant: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    if (!hasPermission(user.role, "team:invite")) {
      return NextResponse.json({ error: "Sem permissão para convidar" }, { status: 403 });
    }

    const body = await request.json();
    const { email, name, role, professionalId } = body;

    if (!email || !name || !role) {
      return NextResponse.json(
        { error: "Email, nome e role são obrigatórios" },
        { status: 400 }
      );
    }

    // Validar role
    if (!["OWNER", "ADMIN", "RECEPTIONIST", "PROFESSIONAL"].includes(role)) {
      return NextResponse.json({ error: "Função inválida" }, { status: 400 });
    }

    // ✅ CORREÇÃO CRÍTICA: professionalId só é válido para role PROFESSIONAL
    // Para ADMIN, RECEPTIONIST e OWNER, deve ser null
    const validProfessionalId = role === "PROFESSIONAL" ? professionalId : null;

    // Se for PROFESSIONAL e não tiver professionalId, validar se existe o profissional
    if (role === "PROFESSIONAL" && validProfessionalId) {
      const professional = await prisma.professional.findFirst({
        where: {
          id: validProfessionalId,
          tenantId: user.tenantId,
        },
      });

      if (!professional) {
        return NextResponse.json(
          { error: "Profissional não encontrado" },
          { status: 404 }
        );
      }
    }

    // Verificar se email já é usuário do tenant
    const existingUser = await prisma.user.findFirst({
      where: {
        tenantId: user.tenantId,
        email,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Este email já é um membro da equipe" },
        { status: 409 }
      );
    }

    // Verificar se já existe convite para este email (qualquer status)
    const existingInvite = await prisma.invitation.findFirst({
      where: {
        tenantId: user.tenantId,
        email,
      },
    });

    // Gerar novo token
    const token = crypto.randomBytes(32).toString("hex");
    
    // Expira em 7 dias
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    let invitation;

    if (existingInvite) {
      // ✅ CORREÇÃO: Atualizar convite existente ao invés de bloquear
      if (existingInvite.status === "PENDING") {
        console.log(`[Invitations] Renovando convite existente para ${email}`);
      } else {
        console.log(`[Invitations] Reativando convite ${existingInvite.status} para ${email}`);
      }
      
      invitation = await prisma.invitation.update({
        where: { id: existingInvite.id },
        data: {
          name,
          role,
          professionalId: validProfessionalId, // ✅ Usa o valor validado (null para não-profissionais)
          token,
          expiresAt,
          status: "PENDING",
          acceptedAt: null,
          invitedBy: user.id,
        },
      });

      console.log(`[Invitations] Convite atualizado para ${email}, role: ${role}, professionalId: ${validProfessionalId}`);
    } else {
      // Criar novo convite
      invitation = await prisma.invitation.create({
        data: {
          tenantId: user.tenantId,
          email,
          name,
          role,
          professionalId: validProfessionalId, // ✅ Usa o valor validado (null para não-profissionais)
          token,
          expiresAt,
          invitedBy: user.id,
        },
      });

      console.log(`[Invitations] Convite criado para ${email}, role: ${role}, professionalId: ${validProfessionalId}`);
    }

    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/accept-invite?token=${token}`;
    console.log(`[Invitations] Link: ${inviteUrl}`);

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        name: invitation.name,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
      },
      inviteUrl,
    }, { status: 201 });
  } catch (error) {
    console.error("[Invitations API] Error creating:", error);
    return NextResponse.json({ error: "Erro ao criar convite" }, { status: 500 });
  }
}

// DELETE - Cancelar convite
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

    if (!hasPermission(user.role, "team:invite")) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const invitationId = searchParams.get("id");

    if (!invitationId) {
      return NextResponse.json({ error: "ID do convite é obrigatório" }, { status: 400 });
    }

    const invitation = await prisma.invitation.findFirst({
      where: {
        id: invitationId,
        tenantId: user.tenantId,
      },
    });

    if (!invitation) {
      return NextResponse.json({ error: "Convite não encontrado" }, { status: 404 });
    }

    await prisma.invitation.update({
      where: { id: invitationId },
      data: { status: "CANCELED" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Invitations API] Error deleting:", error);
    return NextResponse.json({ error: "Erro ao cancelar convite" }, { status: 500 });
  }
}
