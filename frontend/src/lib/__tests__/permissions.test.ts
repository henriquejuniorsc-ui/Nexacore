/**
 * NexaCore - Permissions Tests
 * 
 * Testes unitários para o sistema de permissões RBAC
 * 
 * @see src/lib/permissions.ts
 */

import { describe, it, expect } from 'vitest'
import {
    hasPermission,
    getPermissions,
    canViewAll,
    getMenuItems,
    roleLabels,
    roleDescriptions,
    type Permission,
} from '../permissions'

// ============================================
// hasPermission()
// ============================================

describe('hasPermission', () => {
    // ----------------------------------------
    // OWNER - 43 permissões (TUDO)
    // ----------------------------------------

    describe('OWNER', () => {
        // Dashboard
        it('deve ter dashboard:view', () => {
            expect(hasPermission('OWNER', 'dashboard:view')).toBe(true)
        })

        it('deve ter dashboard:analytics', () => {
            expect(hasPermission('OWNER', 'dashboard:analytics')).toBe(true)
        })

        // Inbox
        it('deve ter inbox:view, view_all, reply, assign, ai_toggle', () => {
            expect(hasPermission('OWNER', 'inbox:view')).toBe(true)
            expect(hasPermission('OWNER', 'inbox:view_all')).toBe(true)
            expect(hasPermission('OWNER', 'inbox:reply')).toBe(true)
            expect(hasPermission('OWNER', 'inbox:assign')).toBe(true)
            expect(hasPermission('OWNER', 'inbox:ai_toggle')).toBe(true)
        })

        // Appointments
        it('deve ter appointments:view, view_all, create, edit, cancel', () => {
            expect(hasPermission('OWNER', 'appointments:view')).toBe(true)
            expect(hasPermission('OWNER', 'appointments:view_all')).toBe(true)
            expect(hasPermission('OWNER', 'appointments:create')).toBe(true)
            expect(hasPermission('OWNER', 'appointments:edit')).toBe(true)
            expect(hasPermission('OWNER', 'appointments:cancel')).toBe(true)
        })

        // Clients
        it('deve ter clients:view, create, edit, delete', () => {
            expect(hasPermission('OWNER', 'clients:view')).toBe(true)
            expect(hasPermission('OWNER', 'clients:create')).toBe(true)
            expect(hasPermission('OWNER', 'clients:edit')).toBe(true)
            expect(hasPermission('OWNER', 'clients:delete')).toBe(true)
        })

        // Services
        it('deve ter services:view, create, edit, delete', () => {
            expect(hasPermission('OWNER', 'services:view')).toBe(true)
            expect(hasPermission('OWNER', 'services:create')).toBe(true)
            expect(hasPermission('OWNER', 'services:edit')).toBe(true)
            expect(hasPermission('OWNER', 'services:delete')).toBe(true)
        })

        // Professionals
        it('deve ter professionals:view, create, edit, delete', () => {
            expect(hasPermission('OWNER', 'professionals:view')).toBe(true)
            expect(hasPermission('OWNER', 'professionals:create')).toBe(true)
            expect(hasPermission('OWNER', 'professionals:edit')).toBe(true)
            expect(hasPermission('OWNER', 'professionals:delete')).toBe(true)
        })

        // Products
        it('deve ter products:view, view_all, create, edit, manage_stock', () => {
            expect(hasPermission('OWNER', 'products:view')).toBe(true)
            expect(hasPermission('OWNER', 'products:view_all')).toBe(true)
            expect(hasPermission('OWNER', 'products:create')).toBe(true)
            expect(hasPermission('OWNER', 'products:edit')).toBe(true)
            expect(hasPermission('OWNER', 'products:manage_stock')).toBe(true)
        })

        // Team
        it('deve ter team:view, invite, edit_roles, remove', () => {
            expect(hasPermission('OWNER', 'team:view')).toBe(true)
            expect(hasPermission('OWNER', 'team:invite')).toBe(true)
            expect(hasPermission('OWNER', 'team:edit_roles')).toBe(true)
            expect(hasPermission('OWNER', 'team:remove')).toBe(true)
        })

        // Settings (inclui billing)
        it('deve ter settings:view, edit, whatsapp, ai, billing', () => {
            expect(hasPermission('OWNER', 'settings:view')).toBe(true)
            expect(hasPermission('OWNER', 'settings:edit')).toBe(true)
            expect(hasPermission('OWNER', 'settings:whatsapp')).toBe(true)
            expect(hasPermission('OWNER', 'settings:ai')).toBe(true)
            expect(hasPermission('OWNER', 'settings:billing')).toBe(true)
        })

        // Payments (inclui manage)
        it('deve ter payments:view, create, manage', () => {
            expect(hasPermission('OWNER', 'payments:view')).toBe(true)
            expect(hasPermission('OWNER', 'payments:create')).toBe(true)
            expect(hasPermission('OWNER', 'payments:manage')).toBe(true)
        })

        // Reports
        it('deve ter reports:view, export', () => {
            expect(hasPermission('OWNER', 'reports:view')).toBe(true)
            expect(hasPermission('OWNER', 'reports:export')).toBe(true)
        })
    })

    // ----------------------------------------
    // ADMIN - 38 permissões (quase tudo, exceto algumas)
    // ----------------------------------------

    describe('ADMIN', () => {
        // Dashboard
        it('deve ter dashboard:view e analytics', () => {
            expect(hasPermission('ADMIN', 'dashboard:view')).toBe(true)
            expect(hasPermission('ADMIN', 'dashboard:analytics')).toBe(true)
        })

        // Inbox
        it('deve ter inbox:view, view_all, reply, assign, ai_toggle', () => {
            expect(hasPermission('ADMIN', 'inbox:view')).toBe(true)
            expect(hasPermission('ADMIN', 'inbox:view_all')).toBe(true)
            expect(hasPermission('ADMIN', 'inbox:reply')).toBe(true)
            expect(hasPermission('ADMIN', 'inbox:assign')).toBe(true)
            expect(hasPermission('ADMIN', 'inbox:ai_toggle')).toBe(true)
        })

        // Appointments
        it('deve ter appointments:view, view_all, create, edit, cancel', () => {
            expect(hasPermission('ADMIN', 'appointments:view')).toBe(true)
            expect(hasPermission('ADMIN', 'appointments:view_all')).toBe(true)
            expect(hasPermission('ADMIN', 'appointments:create')).toBe(true)
            expect(hasPermission('ADMIN', 'appointments:edit')).toBe(true)
            expect(hasPermission('ADMIN', 'appointments:cancel')).toBe(true)
        })

        // Professionals (SEM delete)
        it('deve ter professionals:view, create, edit mas NÃO delete', () => {
            expect(hasPermission('ADMIN', 'professionals:view')).toBe(true)
            expect(hasPermission('ADMIN', 'professionals:create')).toBe(true)
            expect(hasPermission('ADMIN', 'professionals:edit')).toBe(true)
            expect(hasPermission('ADMIN', 'professionals:delete')).toBe(false)
        })

        // Team (SEM edit_roles e remove)
        it('deve ter team:view, invite mas NÃO edit_roles e remove', () => {
            expect(hasPermission('ADMIN', 'team:view')).toBe(true)
            expect(hasPermission('ADMIN', 'team:invite')).toBe(true)
            expect(hasPermission('ADMIN', 'team:edit_roles')).toBe(false)
            expect(hasPermission('ADMIN', 'team:remove')).toBe(false)
        })

        // Settings (SEM billing)
        it('deve ter settings:view, edit, whatsapp, ai mas NÃO billing', () => {
            expect(hasPermission('ADMIN', 'settings:view')).toBe(true)
            expect(hasPermission('ADMIN', 'settings:edit')).toBe(true)
            expect(hasPermission('ADMIN', 'settings:whatsapp')).toBe(true)
            expect(hasPermission('ADMIN', 'settings:ai')).toBe(true)
            expect(hasPermission('ADMIN', 'settings:billing')).toBe(false)
        })

        // Payments (SEM manage)
        it('deve ter payments:view, create mas NÃO manage', () => {
            expect(hasPermission('ADMIN', 'payments:view')).toBe(true)
            expect(hasPermission('ADMIN', 'payments:create')).toBe(true)
            expect(hasPermission('ADMIN', 'payments:manage')).toBe(false)
        })
    })

    // ----------------------------------------
    // RECEPTIONIST - 19 permissões
    // ----------------------------------------

    describe('RECEPTIONIST', () => {
        // Dashboard (SEM analytics)
        it('deve ter dashboard:view mas NÃO analytics', () => {
            expect(hasPermission('RECEPTIONIST', 'dashboard:view')).toBe(true)
            expect(hasPermission('RECEPTIONIST', 'dashboard:analytics')).toBe(false)
        })

        // Inbox (SEM ai_toggle)
        it('deve ter inbox:view, view_all, reply, assign mas NÃO ai_toggle', () => {
            expect(hasPermission('RECEPTIONIST', 'inbox:view')).toBe(true)
            expect(hasPermission('RECEPTIONIST', 'inbox:view_all')).toBe(true)
            expect(hasPermission('RECEPTIONIST', 'inbox:reply')).toBe(true)
            expect(hasPermission('RECEPTIONIST', 'inbox:assign')).toBe(true)
            expect(hasPermission('RECEPTIONIST', 'inbox:ai_toggle')).toBe(false)
        })

        // Clients (SEM delete)
        it('deve ter clients:view, create, edit mas NÃO delete', () => {
            expect(hasPermission('RECEPTIONIST', 'clients:view')).toBe(true)
            expect(hasPermission('RECEPTIONIST', 'clients:create')).toBe(true)
            expect(hasPermission('RECEPTIONIST', 'clients:edit')).toBe(true)
            expect(hasPermission('RECEPTIONIST', 'clients:delete')).toBe(false)
        })

        // Services (apenas view)
        it('deve ter apenas services:view', () => {
            expect(hasPermission('RECEPTIONIST', 'services:view')).toBe(true)
            expect(hasPermission('RECEPTIONIST', 'services:create')).toBe(false)
            expect(hasPermission('RECEPTIONIST', 'services:edit')).toBe(false)
            expect(hasPermission('RECEPTIONIST', 'services:delete')).toBe(false)
        })

        // Team (NENHUMA)
        it('NÃO deve ter nenhuma permissão de team', () => {
            expect(hasPermission('RECEPTIONIST', 'team:view')).toBe(false)
            expect(hasPermission('RECEPTIONIST', 'team:invite')).toBe(false)
            expect(hasPermission('RECEPTIONIST', 'team:edit_roles')).toBe(false)
            expect(hasPermission('RECEPTIONIST', 'team:remove')).toBe(false)
        })

        // Settings (NENHUMA)
        it('NÃO deve ter nenhuma permissão de settings', () => {
            expect(hasPermission('RECEPTIONIST', 'settings:view')).toBe(false)
            expect(hasPermission('RECEPTIONIST', 'settings:billing')).toBe(false)
        })

        // Reports (NENHUMA)
        it('NÃO deve ter nenhuma permissão de reports', () => {
            expect(hasPermission('RECEPTIONIST', 'reports:view')).toBe(false)
            expect(hasPermission('RECEPTIONIST', 'reports:export')).toBe(false)
        })
    })

    // ----------------------------------------
    // PROFESSIONAL - 15 permissões (view_own em vez de view_all)
    // ----------------------------------------

    describe('PROFESSIONAL', () => {
        // Dashboard (SEM analytics)
        it('deve ter dashboard:view mas NÃO analytics', () => {
            expect(hasPermission('PROFESSIONAL', 'dashboard:view')).toBe(true)
            expect(hasPermission('PROFESSIONAL', 'dashboard:analytics')).toBe(false)
        })

        // Inbox (view_own em vez de view_all, SEM assign e ai_toggle)
        it('deve ter inbox:view, view_own, reply mas NÃO view_all, assign, ai_toggle', () => {
            expect(hasPermission('PROFESSIONAL', 'inbox:view')).toBe(true)
            expect(hasPermission('PROFESSIONAL', 'inbox:view_own')).toBe(true)
            expect(hasPermission('PROFESSIONAL', 'inbox:reply')).toBe(true)
            expect(hasPermission('PROFESSIONAL', 'inbox:view_all')).toBe(false)
            expect(hasPermission('PROFESSIONAL', 'inbox:assign')).toBe(false)
            expect(hasPermission('PROFESSIONAL', 'inbox:ai_toggle')).toBe(false)
        })

        // Appointments (view_own, SEM view_all, create, cancel)
        it('deve ter appointments:view, view_own, edit mas NÃO view_all, create, cancel', () => {
            expect(hasPermission('PROFESSIONAL', 'appointments:view')).toBe(true)
            expect(hasPermission('PROFESSIONAL', 'appointments:view_own')).toBe(true)
            expect(hasPermission('PROFESSIONAL', 'appointments:edit')).toBe(true)
            expect(hasPermission('PROFESSIONAL', 'appointments:view_all')).toBe(false)
            expect(hasPermission('PROFESSIONAL', 'appointments:create')).toBe(false)
            expect(hasPermission('PROFESSIONAL', 'appointments:cancel')).toBe(false)
        })

        // Clients (apenas view)
        it('deve ter apenas clients:view', () => {
            expect(hasPermission('PROFESSIONAL', 'clients:view')).toBe(true)
            expect(hasPermission('PROFESSIONAL', 'clients:create')).toBe(false)
            expect(hasPermission('PROFESSIONAL', 'clients:edit')).toBe(false)
            expect(hasPermission('PROFESSIONAL', 'clients:delete')).toBe(false)
        })

        // Products (view_own, create, edit, manage_stock, SEM view_all)
        it('deve ter products:view, view_own, create, edit, manage_stock mas NÃO view_all', () => {
            expect(hasPermission('PROFESSIONAL', 'products:view')).toBe(true)
            expect(hasPermission('PROFESSIONAL', 'products:view_own')).toBe(true)
            expect(hasPermission('PROFESSIONAL', 'products:create')).toBe(true)
            expect(hasPermission('PROFESSIONAL', 'products:edit')).toBe(true)
            expect(hasPermission('PROFESSIONAL', 'products:manage_stock')).toBe(true)
            expect(hasPermission('PROFESSIONAL', 'products:view_all')).toBe(false)
        })

        // Team (NENHUMA)
        it('NÃO deve ter nenhuma permissão de team', () => {
            expect(hasPermission('PROFESSIONAL', 'team:view')).toBe(false)
        })

        // Payments (NENHUMA)
        it('NÃO deve ter nenhuma permissão de payments', () => {
            expect(hasPermission('PROFESSIONAL', 'payments:view')).toBe(false)
            expect(hasPermission('PROFESSIONAL', 'payments:create')).toBe(false)
        })
    })

    // ----------------------------------------
    // Roles inválidos
    // ----------------------------------------

    describe('roles inválidos', () => {
        it('deve retornar false para role inexistente', () => {
            expect(hasPermission('GUEST', 'dashboard:view')).toBe(false)
            expect(hasPermission('USER', 'dashboard:view')).toBe(false)
        })

        it('deve retornar false para role vazio', () => {
            expect(hasPermission('', 'dashboard:view')).toBe(false)
        })

        it('deve retornar false para role lowercase (case-sensitive)', () => {
            expect(hasPermission('owner', 'dashboard:view')).toBe(false)
            expect(hasPermission('admin', 'dashboard:view')).toBe(false)
        })
    })
})

// ============================================
// getPermissions()
// ============================================

describe('getPermissions', () => {
    it('OWNER deve ter 43 permissões', () => {
        expect(getPermissions('OWNER')).toHaveLength(43)
    })

    it('ADMIN deve ter 38 permissões', () => {
        expect(getPermissions('ADMIN')).toHaveLength(38)
    })

    it('RECEPTIONIST deve ter 19 permissões', () => {
        expect(getPermissions('RECEPTIONIST')).toHaveLength(19)
    })

    it('PROFESSIONAL deve ter 15 permissões', () => {
        expect(getPermissions('PROFESSIONAL')).toHaveLength(15)
    })

    it('deve retornar array vazio para role inválido', () => {
        expect(getPermissions('INVALID')).toEqual([])
        expect(getPermissions('')).toEqual([])
    })

    it('deve retornar array sem duplicatas', () => {
        const roles = ['OWNER', 'ADMIN', 'RECEPTIONIST', 'PROFESSIONAL']

        for (const role of roles) {
            const permissions = getPermissions(role)
            const uniquePermissions = Array.from(new Set(permissions))
            expect(permissions).toHaveLength(uniquePermissions.length)
        }
    })
})

// ============================================
// canViewAll()
// ============================================

describe('canViewAll', () => {
    describe('inbox', () => {
        it('OWNER pode ver todos no inbox', () => {
            expect(canViewAll('OWNER', 'inbox')).toBe(true)
        })

        it('ADMIN pode ver todos no inbox', () => {
            expect(canViewAll('ADMIN', 'inbox')).toBe(true)
        })

        it('RECEPTIONIST pode ver todos no inbox', () => {
            expect(canViewAll('RECEPTIONIST', 'inbox')).toBe(true)
        })

        it('PROFESSIONAL NÃO pode ver todos no inbox', () => {
            expect(canViewAll('PROFESSIONAL', 'inbox')).toBe(false)
        })
    })

    describe('appointments', () => {
        it('OWNER pode ver todos os appointments', () => {
            expect(canViewAll('OWNER', 'appointments')).toBe(true)
        })

        it('PROFESSIONAL NÃO pode ver todos os appointments', () => {
            expect(canViewAll('PROFESSIONAL', 'appointments')).toBe(false)
        })
    })

    describe('products', () => {
        it('OWNER pode ver todos os products', () => {
            expect(canViewAll('OWNER', 'products')).toBe(true)
        })

        it('PROFESSIONAL NÃO pode ver todos os products', () => {
            expect(canViewAll('PROFESSIONAL', 'products')).toBe(false)
        })
    })

    it('deve retornar false para role inválido', () => {
        expect(canViewAll('INVALID', 'inbox')).toBe(false)
    })
})

// ============================================
// getMenuItems()
// ============================================

describe('getMenuItems', () => {
    it('OWNER deve ter 11 itens de menu', () => {
        const items = getMenuItems('OWNER')

        expect(items).toHaveLength(11)
        expect(items).toContain('dashboard')
        expect(items).toContain('inbox')
        expect(items).toContain('appointments')
        expect(items).toContain('clients')
        expect(items).toContain('services')
        expect(items).toContain('professionals')
        expect(items).toContain('products')
        expect(items).toContain('payments')
        expect(items).toContain('team')
        expect(items).toContain('settings')
        expect(items).toContain('ai-assistant')
    })

    it('ADMIN deve ter os mesmos 11 itens de menu que OWNER', () => {
        expect(getMenuItems('ADMIN')).toEqual(getMenuItems('OWNER'))
    })

    it('RECEPTIONIST deve ter 6 itens de menu', () => {
        const items = getMenuItems('RECEPTIONIST')

        expect(items).toHaveLength(6)
        expect(items).toContain('dashboard')
        expect(items).toContain('inbox')
        expect(items).toContain('appointments')
        expect(items).toContain('clients')
        expect(items).toContain('products')
        expect(items).toContain('payments')
    })

    it('PROFESSIONAL deve ter 5 itens de menu', () => {
        const items = getMenuItems('PROFESSIONAL')

        expect(items).toHaveLength(5)
        expect(items).toContain('dashboard')
        expect(items).toContain('inbox')
        expect(items).toContain('appointments')
        expect(items).toContain('clients')
        expect(items).toContain('products')
    })

    it('deve retornar array vazio para role inválido', () => {
        expect(getMenuItems('INVALID')).toEqual([])
    })
})

// ============================================
// roleLabels
// ============================================

describe('roleLabels', () => {
    it('deve ter labels para todos os 4 roles', () => {
        expect(Object.keys(roleLabels)).toHaveLength(4)
    })

    it('deve ter labels em português', () => {
        expect(roleLabels.OWNER).toBe('Proprietário')
        expect(roleLabels.ADMIN).toBe('Administrador')
        expect(roleLabels.RECEPTIONIST).toBe('Recepcionista')
        expect(roleLabels.PROFESSIONAL).toBe('Profissional')
    })
})

// ============================================
// roleDescriptions
// ============================================

describe('roleDescriptions', () => {
    it('deve ter descrições para todos os 4 roles', () => {
        expect(Object.keys(roleDescriptions)).toHaveLength(4)
    })

    it('OWNER deve mencionar acesso total e cobrança', () => {
        expect(roleDescriptions.OWNER).toContain('total')
        expect(roleDescriptions.OWNER).toContain('cobrança')
    })

    it('ADMIN deve mencionar exceto cobrança', () => {
        expect(roleDescriptions.ADMIN).toContain('exceto')
        expect(roleDescriptions.ADMIN).toContain('cobrança')
    })

    it('RECEPTIONIST deve mencionar inbox e agendamentos', () => {
        expect(roleDescriptions.RECEPTIONIST).toContain('inbox')
        expect(roleDescriptions.RECEPTIONIST).toContain('agendamentos')
    })

    it('PROFESSIONAL deve mencionar própria', () => {
        expect(roleDescriptions.PROFESSIONAL).toContain('própria')
    })
})

// ============================================
// Cenários de uso real
// ============================================

describe('Cenários de uso real', () => {
    it('apenas OWNER pode acessar billing', () => {
        expect(hasPermission('OWNER', 'settings:billing')).toBe(true)
        expect(hasPermission('ADMIN', 'settings:billing')).toBe(false)
        expect(hasPermission('RECEPTIONIST', 'settings:billing')).toBe(false)
        expect(hasPermission('PROFESSIONAL', 'settings:billing')).toBe(false)
    })

    it('apenas OWNER pode remover membros da equipe', () => {
        expect(hasPermission('OWNER', 'team:remove')).toBe(true)
        expect(hasPermission('ADMIN', 'team:remove')).toBe(false)
        expect(hasPermission('RECEPTIONIST', 'team:remove')).toBe(false)
        expect(hasPermission('PROFESSIONAL', 'team:remove')).toBe(false)
    })

    it('PROFESSIONAL tem view_own enquanto outros têm view_all', () => {
        // PROFESSIONAL usa view_own
        expect(hasPermission('PROFESSIONAL', 'inbox:view_own')).toBe(true)
        expect(hasPermission('PROFESSIONAL', 'inbox:view_all')).toBe(false)

        // Outros usam view_all
        expect(hasPermission('OWNER', 'inbox:view_all')).toBe(true)
        expect(hasPermission('ADMIN', 'inbox:view_all')).toBe(true)
        expect(hasPermission('RECEPTIONIST', 'inbox:view_all')).toBe(true)
    })

    it('todos os roles têm as permissões básicas de view', () => {
        const basicViewPermissions: Permission[] = [
            'dashboard:view',
            'inbox:view',
            'appointments:view',
            'clients:view',
            'services:view',
            'professionals:view',
            'products:view',
        ]

        const roles = ['OWNER', 'ADMIN', 'RECEPTIONIST', 'PROFESSIONAL']

        for (const role of roles) {
            for (const permission of basicViewPermissions) {
                expect(hasPermission(role, permission)).toBe(true)
            }
        }
    })
})
