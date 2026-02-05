import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { roleLabels } from "@/lib/permissions";

// =============================================================================
// API ACCEPT INVITATION - CORRIGIDA v2.7.0
// 
// Correções:
// - GET é público (para verificar convite antes de login)
// - POST atualiza role quando usuário já existe
// - Reativa usuários desativados com novo role
// - Trata caso de usuário que já fez onboarding em outro tenant
// - Logs detalhados para debug
// =============================================================================

// GET - Verificar convite pelo token (PÚBLICO - não precisa estar logado)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    console.log(`[Accept Invite GET] Verificando token: ${token?.slice(0, 10)}...`);

    if (!token) {
      return NextResponse.json({ error: "Token é obrigatório" }, { status: 400 });
    }

    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        tenant: {
          select: { id: true, name: true, logo: true },
        },
        professional: {
          select: { id: true, name: true, specialty: true },
        },
      },
    });

    if (!invitation) {
      console.log(`[Accept Invite GET] Convite não encontrado`);
      return NextResponse.json({ error: "Convite não encontrado" }, { status: 404 });
    }

    // Verificar status do convite
    if (invitation.status === "ACCEPTED") {
      return NextResponse.json(
        { 
          error: "Este convite já foi aceito. Faça login para acessar.",
          code: "ACCEPTED",
        },
        { status: 400 }
      );
    }

    if (invitation.status === "CANCELED") {
      return NextResponse.json(
        { 
          error: "Este convite foi cancelado. Solicite um novo convite.",
          code: "CANCELED",
        },
        { status: 400 }
      );
    }

    if (invitation.status === "EXPIRED" || new Date() > invitation.expiresAt) {
      // Marcar como expirado se ainda não estava
      if (invitation.status !== "EXPIRED") {
        await prisma.invitation.update({
          where: { id: invitation.id },
          data: { status: "EXPIRED" },
        });
      }
      return NextResponse.json(
        { 
          error: "Este convite expirou. Solicite um novo convite.",
          code: "EXPIRED",
        },
        { status: 400 }
      );
    }

    console.log(`[Accept Invite GET] Convite válido para ${invitation.email}, role: ${invitation.role}`);

    return NextResponse.json({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        name: invitation.name,
        role: invitation.role,
        roleLabel: roleLabels[invitation.role] || invitation.role,
        tenant: invitation.tenant,
        professional: invitation.professional,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (error) {
    console.error("[Accept Invite GET] Error:", error);
    return NextResponse.json({ error: "Erro ao verificar convite" }, { status: 500 });
  }
}

// POST - Aceitar convite (criar ou atualizar usuário)
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    let userId: string | null = null;
    let clerkUser: any = null;

    try {
      const authResult = await auth();
      userId = authResult.userId;
      clerkUser = await currentUser();
    } catch (clerkError) {
      console.error("[Accept Invite POST] Clerk error:", clerkError);
      return NextResponse.json(
        { 
          error: "Erro de autenticação. Faça logout, limpe os cookies e tente novamente.",
          code: "CLERK_ERROR",
        },
        { status: 401 }
      );
    }

    if (!userId || !clerkUser) {
      return NextResponse.json(
        { 
          error: "Faça login para aceitar o convite",
          code: "NOT_AUTHENTICATED",
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { token } = body;

    console.log(`[Accept Invite POST] User: ${userId}, Token: ${token?.slice(0, 10)}...`);

    if (!token) {
      return NextResponse.json({ error: "Token é obrigatório" }, { status: 400 });
    }

    // Buscar convite
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        tenant: true,
        professional: true,
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Convite não encontrado", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Validar status
    if (invitation.status === "ACCEPTED") {
      return NextResponse.json(
        { error: "Este convite já foi aceito", code: "ACCEPTED" },
        { status: 400 }
      );
    }

    if (invitation.status === "CANCELED") {
      return NextResponse.json(
        { error: "Este convite foi cancelado", code: "CANCELED" },
        { status: 400 }
      );
    }

    if (new Date() > invitation.expiresAt) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED" },
      });
      return NextResponse.json(
        { error: "Este convite expirou", code: "EXPIRED" },
        { status: 400 }
      );
    }

    // Verificar se email do Clerk bate com o do convite
    const clerkEmail = clerkUser.emailAddresses[0]?.emailAddress;
    console.log(`[Accept Invite POST] Clerk email: ${clerkEmail}, Invitation email: ${invitation.email}`);

    if (clerkEmail?.toLowerCase() !== invitation.email.toLowerCase()) {
      return NextResponse.json(
        { 
          error: `Este convite foi enviado para ${invitation.email}. Você está logado como ${clerkEmail}. Faça logout e entre com o email correto.`,
          code: "EMAIL_MISMATCH",
          expectedEmail: invitation.email,
          actualEmail: clerkEmail,
        },
        { status: 400 }
      );
    }

    // Verificar se usuário já existe
    const existingUserByClerk = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    });

    const existingUserByEmail = await prisma.user.findFirst({
      where: {
        tenantId: invitation.tenantId,
        email: invitation.email,
      },
    });

    console.log(`[Accept Invite POST] Existing by Clerk: ${existingUserByClerk?.id || 'none'}, by Email: ${existingUserByEmail?.id || 'none'}`);

    // Cenário 1: Usuário já existe com este clerkUserId em OUTRO tenant
    if (existingUserByClerk && existingUserByClerk.tenantId !== invitation.tenantId) {
      console.log(`[Accept Invite POST] User belongs to different tenant: ${existingUserByClerk.tenantId}`);
      return NextResponse.json(
        { 
          error: "Você já está vinculado a outra clínica. Entre em contato com o suporte para migrar sua conta.",
          code: "WRONG_TENANT",
        },
        { status: 400 }
      );
    }

    // Cenário 2: Usuário já existe no mesmo tenant (por clerkId ou email)
    const existingUser = existingUserByClerk || existingUserByEmail;
    
    if (existingUser && existingUser.tenantId === invitation.tenantId) {
      console.log(`[Accept Invite POST] User already exists in tenant, updating role from ${existingUser.role} to ${invitation.role}`);
      
      // ✅ CORREÇÃO PRINCIPAL: Atualizar role e reativar usuário!
      const updatedUser = await prisma.$transaction(async (tx) => {
        // Atualizar usuário com novo role e reativar
        const user = await tx.user.update({
          where: { id: existingUser.id },
          data: {
            role: invitation.role,
            isActive: true,
            professionalId: invitation.professionalId,
            // Atualizar clerkUserId se não tiver (caso seja por email)
            clerkUserId: existingUser.clerkUserId || userId,
          },
        });

        // Marcar convite como aceito
        await tx.invitation.update({
          where: { id: invitation.id },
          data: { status: "ACCEPTED", acceptedAt: new Date() },
        });

        return user;
      });

      console.log(`[Accept Invite POST] User updated: ${updatedUser.email}, role: ${updatedUser.role}`);

      return NextResponse.json({
        success: true,
        message: `Bem-vindo de volta à ${invitation.tenant.name}!`,
        redirect: "/dashboard",
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          role: updatedUser.role,
          roleLabel: roleLabels[updatedUser.role] || updatedUser.role,
        },
      });
    }

    // Cenário 3: Usuário novo - criar
    console.log(`[Accept Invite POST] Creating new user with role: ${invitation.role}`);

    const result = await prisma.$transaction(async (tx) => {
      // Criar usuário
      const user = await tx.user.create({
        data: {
          tenantId: invitation.tenantId,
          clerkUserId: userId,
          email: invitation.email,
          name: invitation.name,
          role: invitation.role,
          professionalId: invitation.professionalId,
          isActive: true,
        },
      });

      // Marcar convite como aceito
      await tx.invitation.update({
        where: { id: invitation.id },
        data: { status: "ACCEPTED", acceptedAt: new Date() },
      });

      return { user };
    });

    console.log(`[Accept Invite POST] User created: ${result.user.email}, role: ${result.user.role}`);

    return NextResponse.json({
      success: true,
      message: `Bem-vindo à ${invitation.tenant.name}!`,
      redirect: "/dashboard",
      user: {
        id: result.user.id,
        name: result.user.name,
        role: result.user.role,
        roleLabel: roleLabels[result.user.role] || result.user.role,
      },
    });
  } catch (error: any) {
    console.error("[Accept Invite POST] Error:", error);
    
    // Verificar se é erro de unique constraint
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Este email já está cadastrado no sistema", code: "DUPLICATE" },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: "Erro ao aceitar convite" }, { status: 500 });
  }
}
