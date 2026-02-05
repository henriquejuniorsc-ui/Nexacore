/**
 * NexaCore - InboxBadge Component Tests
 * 
 * Testes para o componente de badge de notificações do inbox
 * 
 * @see src/components/inbox/InboxBadge.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { InboxBadge } from '../InboxBadge'

// Mock do hook useInboxNotifications
vi.mock('@/hooks/useInboxNotifications', () => ({
    useInboxNotifications: vi.fn(),
}))

// Import mockado para manipular retornos
import { useInboxNotifications } from '@/hooks/useInboxNotifications'

// Helper para criar mock stats válido
const createMockStats = (totalUnread: number) => ({
    totalUnread,
    conversations: [],
})

describe('InboxBadge', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('não deve renderizar quando totalUnread é 0', () => {
        vi.mocked(useInboxNotifications).mockReturnValue({
            stats: createMockStats(0),
            loading: false,
            error: null,
            refetch: vi.fn(),
            requestNotificationPermission: vi.fn(),
        })

        const { container } = render(<InboxBadge />)

        expect(container.firstChild).toBeNull()
    })

    it('deve renderizar quando há mensagens não lidas', () => {
        vi.mocked(useInboxNotifications).mockReturnValue({
            stats: createMockStats(5),
            loading: false,
            error: null,
            refetch: vi.fn(),
            requestNotificationPermission: vi.fn(),
        })

        render(<InboxBadge />)

        expect(screen.getByText('5')).toBeInTheDocument()
    })

    it('deve mostrar "99+" quando há mais de 99 notificações', () => {
        vi.mocked(useInboxNotifications).mockReturnValue({
            stats: createMockStats(150),
            loading: false,
            error: null,
            refetch: vi.fn(),
            requestNotificationPermission: vi.fn(),
        })

        render(<InboxBadge />)

        expect(screen.getByText('99+')).toBeInTheDocument()
    })

    it('deve mostrar exatamente 99 quando há 99 notificações', () => {
        vi.mocked(useInboxNotifications).mockReturnValue({
            stats: createMockStats(99),
            loading: false,
            error: null,
            refetch: vi.fn(),
            requestNotificationPermission: vi.fn(),
        })

        render(<InboxBadge />)

        expect(screen.getByText('99')).toBeInTheDocument()
    })

    it('deve ter classes de estilo corretas', () => {
        vi.mocked(useInboxNotifications).mockReturnValue({
            stats: createMockStats(1),
            loading: false,
            error: null,
            refetch: vi.fn(),
            requestNotificationPermission: vi.fn(),
        })

        render(<InboxBadge />)

        const badge = screen.getByText('1')

        expect(badge).toHaveClass('bg-brand-pink')
        expect(badge).toHaveClass('text-white')
        expect(badge).toHaveClass('rounded-full')
        expect(badge).toHaveClass('animate-pulse')
    })

    it('deve chamar useInboxNotifications com pollInterval correto', () => {
        vi.mocked(useInboxNotifications).mockReturnValue({
            stats: createMockStats(0),
            loading: false,
            error: null,
            refetch: vi.fn(),
            requestNotificationPermission: vi.fn(),
        })

        render(<InboxBadge />)

        expect(useInboxNotifications).toHaveBeenCalledWith({ pollInterval: 10000 })
    })
})
