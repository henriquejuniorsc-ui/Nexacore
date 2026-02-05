import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// =============================================================================
// AUTH HELPER - CORRIGIDO v2.7.0
// 
// IMPORTANTE: Este helper diferencia 3 estados:
// 1. Não autenticado (Clerk) → 401
// 2. Autenticado mas não provisionado → needsOnboarding: true (NÃO É ERRO!)
// 3. Autenticado e provisionado → user completo
// 
// Isso evita o loop infinito quando usuário está logado no Clerk
// mas ainda não completou o onboarding.
// =============================================================================

interface AuthResult {
  user: any | null;
  clerkUserId: string | null;
  error: string | null;
  status: number;
  needsOnboarding?: boolean;
  isInactive?: boolean;
}

/**
 * Verifica se o usuário atual está autenticado E ativo no sistema
 * Use esta função no início de cada API protegida
 * 
 * IMPORTANTE: Não trata "usuário não provisionado" como erro de auth!
 * Isso causaria loop infinito.
 */
export async function getAuthenticatedUser(): Promise<AuthResult> {
  try {
    const { userId } = await auth();
    
    // 1. Não autenticado no Clerk
    if (!userId) {
      return {
        user: null,
        clerkUserId: null,
        error: "Não autorizado",
        status: 401,
      };
    }

    // 2. Buscar usuário no banco
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            aiEnabled: true,
            timezone: true,
          },
        },
      },
    });

    // 3. Autenticado no Clerk, mas não provisionado no banco
    // ISSO NÃO É ERRO DE AUTH! É estado de onboarding.
    if (!user) {
      return {
        user: null,
        clerkUserId: userId,
        error: null, // ✅ NÃO É ERRO!
        status: 200, // ✅ NÃO É 401/404!
        needsOnboarding: true,
      };
    }

    // 4. Usuário desativado
    if (!user.isActive) {
      return {
        user: null,
        clerkUserId: userId,
        error: "Sua conta foi desativada. Entre em contato com o administrador.",
        status: 403,
        isInactive: true,
      };
    }

    // 5. Tudo OK
    return {
      user,
      clerkUserId: userId,
      error: null,
      status: 200,
    };
  } catch (error) {
    console.error("[Auth Helper] Error:", error);
    return {
      user: null,
      clerkUserId: null,
      error: "Erro de autenticação",
      status: 500,
    };
  }
}

/**
 * Versão que EXIGE usuário provisionado
 * Use apenas em rotas que realmente precisam do usuário completo
 */
export async function requireProvisionedUser(): Promise<AuthResult> {
  const result = await getAuthenticatedUser();
  
  // Se precisa onboarding, retorna erro específico
  if (result.needsOnboarding) {
    return {
      ...result,
      error: "Complete seu cadastro primeiro",
      status: 403,
    };
  }
  
  return result;
}

/**
 * Helper para retornar erro de autenticação
 */
export function authError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

/**
 * Verifica se usuário tem permissão específica
 */
export function checkPermission(
  userRole: string,
  permission: string,
  permissions: Record<string, string[]>
): boolean {
  const rolePermissions = permissions[userRole];
  if (!rolePermissions) return false;
  return rolePermissions.includes(permission);
}
