import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { hasPermission, roleLabels } from "@/lib/permissions";

// =============================================================================
// TEAM API - CORRIGIDO
// 
// Correções:
// - Verifica isActive do usuário atual
// - Remoção revoga sessões no Clerk
// - Melhor tratamento de erros
// =============================================================================

// Helper para verificar se usuário está ativo
async function getActiveUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) {
    return { user: null, error: "Usuário não encontrado", status: 404 };
  }

  if (!user.isActive) {
    return { user: null, error: "Sua conta foi desativada. Entre em contato com o administrador.", status: 403 };
  }

  return { user, error: null, status: 200 };
}

// GET - Listar membros da equipe
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { user: currentUser, error, status } = await getActiveUser(userId);
    if (!currentUser) {
      return NextResponse.json({ error }, { status });
    }

    if (!hasPermission(currentUser.role, "team:view")) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    // Buscar membros
    const members = await prisma.user.findMany({
      where: { tenantId: currentUser.tenantId },
      include: {
        professional: {
          select: { id: true, name: true, specialty: true },
        },
      },
      orderBy: [
        { role: "asc" },
        { name: "asc" },
      ],
    });

    // Buscar convites pendentes
    const pendingInvitations = await prisma.invitation.findMany({
      where: {
        tenantId: currentUser.tenantId,
        status: "PENDING",
      },
      include: {
        professional: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      members: members.map(m => ({
        id: m.id,
        name: m.name,
        email: m.email,
        role: m.role,
        roleLabel: roleLabels[m.role],
        avatar: m.avatar,
        phone: m.phone,
        professional: m.professional,
        isActive: m.isActive,
        lastLoginAt: m.lastLoginAt,
        createdAt: m.createdAt,
        isCurrentUser: m.clerkUserId === userId,
      })),
      pendingInvitations: pendingInvitations.map(inv => ({
        id: inv.id,
        email: inv.email,
        name: inv.name,
        role: inv.role,
        roleLabel: roleLabels[inv.role],
        professional: inv.professional,
        expiresAt: inv.expiresAt,
        createdAt: inv.createdAt,
        // ✅ CORREÇÃO: Incluir token e URL para poder copiar depois!
        token: inv.token,
        inviteUrl: `${process.env.NEXT_PUBLIC_APP_URL}/auth/accept-invite?token=${inv.token}`,
      })),
      currentUserRole: currentUser.role,
    });
  } catch (error) {
    console.error("[Team API] Error:", error);
    return NextResponse.json({ error: "Erro ao buscar equipe" }, { status: 500 });
  }
}

// PATCH - Atualizar membro (role, status)
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { user: currentUser, error, status } = await getActiveUser(userId);
    if (!currentUser) {
      return NextResponse.json({ error }, { status });
    }

    if (!hasPermission(currentUser.role, "team:edit_roles")) {
      return NextResponse.json({ error: "Sem permissão para editar" }, { status: 403 });
    }

    const body = await request.json();
    const { memberId, role, isActive } = body;

    if (!memberId) {
      return NextResponse.json({ error: "ID do membro é obrigatório" }, { status: 400 });
    }

    // Verificar se membro pertence ao mesmo tenant
    const member = await prisma.user.findFirst({
      where: {
        id: memberId,
        tenantId: currentUser.tenantId,
      },
    });

    if (!member) {
      return NextResponse.json({ error: "Membro não encontrado" }, { status: 404 });
    }

    // Não pode editar a si mesmo
    if (member.clerkUserId === userId) {
      return NextResponse.json({ error: "Você não pode editar seu próprio perfil" }, { status: 400 });
    }

    // Não pode rebaixar owner (só outro owner pode)
    if (member.role === "OWNER" && currentUser.role !== "OWNER") {
      return NextResponse.json({ error: "Apenas o proprietário pode alterar outro proprietário" }, { status: 403 });
    }

    // Validar role se fornecido
    if (role && !["OWNER", "ADMIN", "RECEPTIONIST", "PROFESSIONAL"].includes(role)) {
      return NextResponse.json({ error: "Função inválida" }, { status: 400 });
    }

    // Atualizar
    const updates: any = {};
    if (role) updates.role = role;
    if (typeof isActive === "boolean") updates.isActive = isActive;

    const updated = await prisma.user.update({
      where: { id: memberId },
      data: updates,
    });

    // Se desativou o usuário, revogar sessões no Clerk
    if (isActive === false && member.clerkUserId) {
      try {
        const clerk = await clerkClient();
        const sessions = await clerk.sessions.getSessionList({ userId: member.clerkUserId });
        
        for (const session of sessions.data) {
          if (session.status === "active") {
            await clerk.sessions.revokeSession(session.id);
            console.log(`[Team API] Revoked session ${session.id} for user ${member.email}`);
          }
        }
      } catch (clerkError) {
        console.error("[Team API] Error revoking Clerk sessions:", clerkError);
        // Não falha a operação, apenas loga o erro
      }
    }

    return NextResponse.json({
      success: true,
      member: {
        id: updated.id,
        name: updated.name,
        role: updated.role,
        isActive: updated.isActive,
      },
    });
  } catch (error) {
    console.error("[Team API] Error updating:", error);
    return NextResponse.json({ error: "Erro ao atualizar membro" }, { status: 500 });
  }
}

// DELETE - Remover membro (desativa e revoga sessões)
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { user: currentUser, error, status } = await getActiveUser(userId);
    if (!currentUser) {
      return NextResponse.json({ error }, { status });
    }

    if (!hasPermission(currentUser.role, "team:remove")) {
      return NextResponse.json({ error: "Sem permissão para remover" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get("id");

    if (!memberId) {
      return NextResponse.json({ error: "ID do membro é obrigatório" }, { status: 400 });
    }

    const member = await prisma.user.findFirst({
      where: {
        id: memberId,
        tenantId: currentUser.tenantId,
      },
    });

    if (!member) {
      return NextResponse.json({ error: "Membro não encontrado" }, { status: 404 });
    }

    if (member.clerkUserId === userId) {
      return NextResponse.json({ error: "Você não pode remover a si mesmo" }, { status: 400 });
    }

    if (member.role === "OWNER") {
      return NextResponse.json({ error: "Não é possível remover o proprietário" }, { status: 400 });
    }

    // 1. Desativar usuário no banco
    await prisma.user.update({
      where: { id: memberId },
      data: { isActive: false },
    });

    // 2. Revogar todas as sessões ativas no Clerk
    if (member.clerkUserId) {
      try {
        const clerk = await clerkClient();
        const sessions = await clerk.sessions.getSessionList({ userId: member.clerkUserId });
        
        let revokedCount = 0;
        for (const session of sessions.data) {
          if (session.status === "active") {
            await clerk.sessions.revokeSession(session.id);
            revokedCount++;
          }
        }
        
        console.log(`[Team API] Removed user ${member.email}: revoked ${revokedCount} sessions`);
      } catch (clerkError) {
        console.error("[Team API] Error revoking Clerk sessions:", clerkError);
        // Não falha a operação, o usuário ainda não conseguirá acessar por causa do isActive=false
      }
    }

    return NextResponse.json({ 
      success: true,
      message: "Membro removido com sucesso. O acesso foi revogado imediatamente.",
    });
  } catch (error) {
    console.error("[Team API] Error deleting:", error);
    return NextResponse.json({ error: "Erro ao remover membro" }, { status: 500 });
  }
}
