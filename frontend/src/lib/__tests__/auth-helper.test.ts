/**
 * NexaCore - Auth Helper Tests
 * 
 * Testes unitários para funções de autenticação e autorização
 * 
 * @see src/lib/auth-helper.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextResponse } from 'next/server'
import {
    getAuthenticatedUser,
    requireProvisionedUser,
    authError,
    checkPermission,
} from '../auth-helper'

// ============================================
// Mocks
// ============================================

// Mock do Clerk
const mockAuth = vi.fn()
vi.mock('@clerk/nextjs/server', () => ({
    auth: () => mockAuth(),
}))

// Mock do Prisma
const mockPrismaUser = {
    findUnique: vi.fn(),
}

vi.mock('@/lib/prisma', () => ({
    default: {
        user: {
            findUnique: (...args: any[]) => mockPrismaUser.findUnique(...args),
        },
    },
}))

// ============================================
// checkPermission() - Função pura, sem mocks
// ============================================

describe('checkPermission', () => {
    const mockPermissions = {
        OWNER: ['dashboard:view', 'settings:billing', 'team:remove', 'all:access'],
        ADMIN: ['dashboard:view', 'settings:view', 'team:view'],
        RECEPTIONIST: ['dashboard:view', 'inbox:view', 'appointments:view'],
        PROFESSIONAL: ['dashboard:view', 'inbox:view_own'],
    }

    describe('permissões válidas', () => {
        it('deve retornar true quando role tem a permissão', () => {
            expect(checkPermission('OWNER', 'dashboard:view', mockPermissions)).toBe(true)
            expect(checkPermission('OWNER', 'settings:billing', mockPermissions)).toBe(true)
            expect(checkPermission('OWNER', 'team:remove', mockPermissions)).toBe(true)
        })

        it('deve funcionar para todos os roles com suas permissões', () => {
            expect(checkPermission('ADMIN', 'dashboard:view', mockPermissions)).toBe(true)
            expect(checkPermission('ADMIN', 'settings:view', mockPermissions)).toBe(true)
            expect(checkPermission('RECEPTIONIST', 'inbox:view', mockPermissions)).toBe(true)
            expect(checkPermission('PROFESSIONAL', 'inbox:view_own', mockPermissions)).toBe(true)
        })
    })

    describe('permissões negadas', () => {
        it('deve retornar false quando role NÃO tem a permissão', () => {
            expect(checkPermission('ADMIN', 'settings:billing', mockPermissions)).toBe(false)
            expect(checkPermission('RECEPTIONIST', 'team:remove', mockPermissions)).toBe(false)
            expect(checkPermission('PROFESSIONAL', 'settings:billing', mockPermissions)).toBe(false)
        })

        it('deve retornar false para permissão que não existe em nenhum role', () => {
            expect(checkPermission('OWNER', 'invalid:permission', mockPermissions)).toBe(false)
            expect(checkPermission('ADMIN', 'fake:access', mockPermissions)).toBe(false)
        })
    })

    describe('roles inválidos', () => {
        it('deve retornar false para role inexistente', () => {
            expect(checkPermission('GUEST', 'dashboard:view', mockPermissions)).toBe(false)
            expect(checkPermission('SUPERADMIN', 'all:access', mockPermissions)).toBe(false)
        })

        it('deve retornar false para role vazio', () => {
            expect(checkPermission('', 'dashboard:view', mockPermissions)).toBe(false)
        })

        it('deve retornar false para role undefined/null tratado como string', () => {
            expect(checkPermission('undefined', 'dashboard:view', mockPermissions)).toBe(false)
            expect(checkPermission('null', 'dashboard:view', mockPermissions)).toBe(false)
        })
    })

    describe('objeto de permissões vazio', () => {
        it('deve retornar false quando permissions está vazio', () => {
            expect(checkPermission('OWNER', 'dashboard:view', {})).toBe(false)
        })

        it('deve retornar false quando role existe mas array está vazio', () => {
            const emptyPerms = { OWNER: [] as string[] }
            expect(checkPermission('OWNER', 'dashboard:view', emptyPerms)).toBe(false)
        })
    })

    describe('case sensitivity', () => {
        it('deve ser case-sensitive para roles', () => {
            expect(checkPermission('owner', 'dashboard:view', mockPermissions)).toBe(false)
            expect(checkPermission('Owner', 'dashboard:view', mockPermissions)).toBe(false)
            expect(checkPermission('OWNER', 'dashboard:view', mockPermissions)).toBe(true)
        })

        it('deve ser case-sensitive para permissões', () => {
            expect(checkPermission('OWNER', 'Dashboard:View', mockPermissions)).toBe(false)
            expect(checkPermission('OWNER', 'DASHBOARD:VIEW', mockPermissions)).toBe(false)
            expect(checkPermission('OWNER', 'dashboard:view', mockPermissions)).toBe(true)
        })
    })
})

// ============================================
// authError()
// ============================================

describe('authError', () => {
    it('deve retornar NextResponse com erro e status', () => {
        const response = authError('Não autorizado', 401)

        expect(response).toBeInstanceOf(NextResponse)
    })

    it('deve retornar status 401 para não autorizado', () => {
        const response = authError('Não autorizado', 401)

        expect(response.status).toBe(401)
    })

    it('deve retornar status 403 para proibido', () => {
        const response = authError('Acesso negado', 403)

        expect(response.status).toBe(403)
    })

    it('deve retornar status 500 para erro interno', () => {
        const response = authError('Erro interno', 500)

        expect(response.status).toBe(500)
    })

    it('deve incluir mensagem de erro no JSON', async () => {
        const response = authError('Mensagem customizada', 400)
        const json = await response.json()

        expect(json).toEqual({ error: 'Mensagem customizada' })
    })

    it('deve funcionar com mensagens em português', async () => {
        const response = authError('Sua conta foi desativada', 403)
        const json = await response.json()

        expect(json.error).toBe('Sua conta foi desativada')
    })
})

// ============================================
// getAuthenticatedUser()
// ============================================

describe('getAuthenticatedUser', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('usuário não autenticado no Clerk', () => {
        it('deve retornar erro 401 quando userId é null', async () => {
            mockAuth.mockResolvedValue({ userId: null })

            const result = await getAuthenticatedUser()

            expect(result).toEqual({
                user: null,
                clerkUserId: null,
                error: 'Não autorizado',
                status: 401,
            })
        })

        it('deve retornar erro 401 quando userId é undefined', async () => {
            mockAuth.mockResolvedValue({ userId: undefined })

            const result = await getAuthenticatedUser()

            expect(result.status).toBe(401)
            expect(result.error).toBe('Não autorizado')
        })
    })

    describe('usuário autenticado mas não provisionado', () => {
        it('deve retornar needsOnboarding: true quando usuário não existe no banco', async () => {
            mockAuth.mockResolvedValue({ userId: 'clerk_user_123' })
            mockPrismaUser.findUnique.mockResolvedValue(null)

            const result = await getAuthenticatedUser()

            expect(result).toEqual({
                user: null,
                clerkUserId: 'clerk_user_123',
                error: null, // NÃO É ERRO!
                status: 200, // NÃO É 401!
                needsOnboarding: true,
            })
        })

        it('NÃO deve retornar erro quando precisa de onboarding', async () => {
            mockAuth.mockResolvedValue({ userId: 'new_user_456' })
            mockPrismaUser.findUnique.mockResolvedValue(null)

            const result = await getAuthenticatedUser()

            expect(result.error).toBeNull()
            expect(result.status).toBe(200)
            expect(result.needsOnboarding).toBe(true)
        })
    })

    describe('usuário desativado', () => {
        it('deve retornar erro 403 e isInactive: true quando usuário está inativo', async () => {
            mockAuth.mockResolvedValue({ userId: 'clerk_user_inactive' })
            mockPrismaUser.findUnique.mockResolvedValue({
                id: 'user_1',
                clerkUserId: 'clerk_user_inactive',
                isActive: false,
                tenant: { id: 'tenant_1', name: 'Test Tenant' },
            })

            const result = await getAuthenticatedUser()

            expect(result.status).toBe(403)
            expect(result.isInactive).toBe(true)
            expect(result.error).toContain('desativada')
            expect(result.user).toBeNull()
        })
    })

    describe('usuário autenticado e ativo', () => {
        const mockUser = {
            id: 'user_123',
            clerkUserId: 'clerk_abc',
            email: 'user@test.com',
            name: 'Test User',
            role: 'OWNER',
            isActive: true,
            tenant: {
                id: 'tenant_1',
                name: 'Test Clinic',
                aiEnabled: true,
                timezone: 'America/Sao_Paulo',
            },
        }

        it('deve retornar usuário completo quando autenticado e ativo', async () => {
            mockAuth.mockResolvedValue({ userId: 'clerk_abc' })
            mockPrismaUser.findUnique.mockResolvedValue(mockUser)

            const result = await getAuthenticatedUser()

            expect(result.status).toBe(200)
            expect(result.error).toBeNull()
            expect(result.user).toEqual(mockUser)
            expect(result.clerkUserId).toBe('clerk_abc')
        })

        it('deve incluir dados do tenant', async () => {
            mockAuth.mockResolvedValue({ userId: 'clerk_abc' })
            mockPrismaUser.findUnique.mockResolvedValue(mockUser)

            const result = await getAuthenticatedUser()

            expect(result.user.tenant).toBeDefined()
            expect(result.user.tenant.name).toBe('Test Clinic')
            expect(result.user.tenant.aiEnabled).toBe(true)
        })

        it('NÃO deve ter needsOnboarding quando usuário existe', async () => {
            mockAuth.mockResolvedValue({ userId: 'clerk_abc' })
            mockPrismaUser.findUnique.mockResolvedValue(mockUser)

            const result = await getAuthenticatedUser()

            expect(result.needsOnboarding).toBeUndefined()
        })

        it('NÃO deve ter isInactive quando usuário está ativo', async () => {
            mockAuth.mockResolvedValue({ userId: 'clerk_abc' })
            mockPrismaUser.findUnique.mockResolvedValue(mockUser)

            const result = await getAuthenticatedUser()

            expect(result.isInactive).toBeUndefined()
        })
    })

    describe('tratamento de erros', () => {
        it('deve retornar erro 500 quando auth() lança exceção', async () => {
            mockAuth.mockRejectedValue(new Error('Clerk API error'))

            const result = await getAuthenticatedUser()

            expect(result.status).toBe(500)
            expect(result.error).toBe('Erro de autenticação')
            expect(result.user).toBeNull()
        })

        it('deve retornar erro 500 quando prisma lança exceção', async () => {
            mockAuth.mockResolvedValue({ userId: 'clerk_123' })
            mockPrismaUser.findUnique.mockRejectedValue(new Error('Database error'))

            const result = await getAuthenticatedUser()

            expect(result.status).toBe(500)
            expect(result.error).toBe('Erro de autenticação')
        })
    })

    describe('chamadas ao Prisma', () => {
        it('deve buscar usuário com include do tenant', async () => {
            mockAuth.mockResolvedValue({ userId: 'clerk_xyz' })
            mockPrismaUser.findUnique.mockResolvedValue(null)

            await getAuthenticatedUser()

            expect(mockPrismaUser.findUnique).toHaveBeenCalledWith({
                where: { clerkUserId: 'clerk_xyz' },
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
            })
        })

        it('NÃO deve chamar prisma se não autenticado no Clerk', async () => {
            mockAuth.mockResolvedValue({ userId: null })

            await getAuthenticatedUser()

            expect(mockPrismaUser.findUnique).not.toHaveBeenCalled()
        })
    })
})

// ============================================
// requireProvisionedUser()
// ============================================

describe('requireProvisionedUser', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('deve retornar erro 403 quando precisa de onboarding', async () => {
        mockAuth.mockResolvedValue({ userId: 'new_user' })
        mockPrismaUser.findUnique.mockResolvedValue(null)

        const result = await requireProvisionedUser()

        expect(result.status).toBe(403)
        expect(result.error).toBe('Complete seu cadastro primeiro')
        expect(result.needsOnboarding).toBe(true)
    })

    it('deve retornar usuário quando provisionado', async () => {
        const mockUser = {
            id: 'user_1',
            clerkUserId: 'clerk_1',
            isActive: true,
            tenant: { id: 't1', name: 'Test' },
        }
        mockAuth.mockResolvedValue({ userId: 'clerk_1' })
        mockPrismaUser.findUnique.mockResolvedValue(mockUser)

        const result = await requireProvisionedUser()

        expect(result.status).toBe(200)
        expect(result.error).toBeNull()
        expect(result.user).toEqual(mockUser)
    })

    it('deve propagar erro 401 quando não autenticado', async () => {
        mockAuth.mockResolvedValue({ userId: null })

        const result = await requireProvisionedUser()

        expect(result.status).toBe(401)
        expect(result.error).toBe('Não autorizado')
    })

    it('deve propagar erro 403 quando usuário inativo', async () => {
        mockAuth.mockResolvedValue({ userId: 'clerk_inactive' })
        mockPrismaUser.findUnique.mockResolvedValue({
            id: 'user_1',
            isActive: false,
            tenant: {},
        })

        const result = await requireProvisionedUser()

        expect(result.status).toBe(403)
        expect(result.isInactive).toBe(true)
    })
})

// ============================================
// Cenários de integração
// ============================================

describe('Cenários de integração', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('fluxo completo: usuário novo fazendo primeiro acesso', async () => {
        // 1. Usuário faz login no Clerk (sucesso)
        mockAuth.mockResolvedValue({ userId: 'clerk_new_user' })
        // 2. Usuário não existe no banco ainda
        mockPrismaUser.findUnique.mockResolvedValue(null)

        // 3. getAuthenticatedUser deve indicar onboarding
        const authResult = await getAuthenticatedUser()
        expect(authResult.needsOnboarding).toBe(true)
        expect(authResult.status).toBe(200) // NÃO é erro!

        // 4. requireProvisionedUser deve bloquear acesso
        const provisionedResult = await requireProvisionedUser()
        expect(provisionedResult.status).toBe(403)
        expect(provisionedResult.error).toContain('cadastro')
    })

    it('fluxo completo: usuário ativo acessando sistema', async () => {
        const activeUser = {
            id: 'user_active',
            clerkUserId: 'clerk_active',
            name: 'Maria',
            role: 'ADMIN',
            isActive: true,
            tenant: { id: 't1', name: 'Clínica Maria', aiEnabled: true, timezone: 'America/Sao_Paulo' },
        }

        mockAuth.mockResolvedValue({ userId: 'clerk_active' })
        mockPrismaUser.findUnique.mockResolvedValue(activeUser)

        // Ambas funções devem retornar sucesso
        const authResult = await getAuthenticatedUser()
        expect(authResult.status).toBe(200)
        expect(authResult.user.name).toBe('Maria')

        const provisionedResult = await requireProvisionedUser()
        expect(provisionedResult.status).toBe(200)
        expect(provisionedResult.user.role).toBe('ADMIN')
    })

    it('verificação de permissão após autenticação', () => {
        const ownerUser = { id: 'u1', role: 'OWNER', isActive: true, tenant: {} }
        const adminUser = { id: 'u2', role: 'ADMIN', isActive: true, tenant: {} }

        const permissions = {
            OWNER: ['settings:billing', 'team:remove'],
            ADMIN: ['settings:view'],
        }

        // Owner pode acessar billing
        expect(checkPermission(ownerUser.role, 'settings:billing', permissions)).toBe(true)

        // Admin NÃO pode acessar billing
        expect(checkPermission(adminUser.role, 'settings:billing', permissions)).toBe(false)
    })
})
