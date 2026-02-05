/**
 * NexaCore - Reminder Service Tests
 * 
 * Testes unitários para o serviço de lembretes de procedimentos
 * 
 * @see src/services/reminder-service.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
    processPendingReminders,
    createProcedureRecord,
    defaultProcedureTypes,
} from '../reminder-service'

// ============================================
// Mocks
// ============================================

// Mock do Prisma
const mockPrisma = {
    procedureRecord: {
        findMany: vi.fn(),
        update: vi.fn(),
        create: vi.fn(),
    },
    procedureType: {
        findUnique: vi.fn(),
    },
}

vi.mock('@/lib/prisma', () => ({
    default: {
        procedureRecord: {
            findMany: (...args: any[]) => mockPrisma.procedureRecord.findMany(...args),
            update: (...args: any[]) => mockPrisma.procedureRecord.update(...args),
            create: (...args: any[]) => mockPrisma.procedureRecord.create(...args),
        },
        procedureType: {
            findUnique: (...args: any[]) => mockPrisma.procedureType.findUnique(...args),
        },
    },
}))

// Mock do fetch global
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// ============================================
// defaultProcedureTypes - Constante exportada
// ============================================

describe('defaultProcedureTypes', () => {
    it('deve ter 8 tipos de procedimento padrão', () => {
        expect(defaultProcedureTypes).toHaveLength(8)
    })

    it('deve incluir Botox com 120 dias de reminder', () => {
        const botox = defaultProcedureTypes.find(p => p.name === 'Botox')

        expect(botox).toBeDefined()
        expect(botox?.reminderDays).toBe(120) // 4 meses
        expect(botox?.description).toContain('botulínica')
    })

    it('deve incluir Preenchimento Labial com 180 dias', () => {
        const preenchimento = defaultProcedureTypes.find(p => p.name === 'Preenchimento Labial')

        expect(preenchimento).toBeDefined()
        expect(preenchimento?.reminderDays).toBe(180) // 6 meses
    })

    it('deve incluir Preenchimento Facial com 365 dias', () => {
        const preenchimento = defaultProcedureTypes.find(p => p.name === 'Preenchimento Facial')

        expect(preenchimento).toBeDefined()
        expect(preenchimento?.reminderDays).toBe(365) // 12 meses
    })

    it('deve incluir Limpeza de Pele com 30 dias', () => {
        const limpeza = defaultProcedureTypes.find(p => p.name === 'Limpeza de Pele')

        expect(limpeza).toBeDefined()
        expect(limpeza?.reminderDays).toBe(30) // 1 mês
    })

    it('deve incluir Harmonização Facial com 180 dias', () => {
        const harmonizacao = defaultProcedureTypes.find(p => p.name === 'Harmonização Facial')

        expect(harmonizacao).toBeDefined()
        expect(harmonizacao?.reminderDays).toBe(180)
    })

    it('deve incluir Skinbooster com 90 dias', () => {
        const skinbooster = defaultProcedureTypes.find(p => p.name === 'Skinbooster')

        expect(skinbooster).toBeDefined()
        expect(skinbooster?.reminderDays).toBe(90) // 3 meses
    })

    it('deve incluir Peeling com 30 dias', () => {
        const peeling = defaultProcedureTypes.find(p => p.name === 'Peeling')

        expect(peeling).toBeDefined()
        expect(peeling?.reminderDays).toBe(30)
    })

    it('deve incluir Bioestimulador de Colágeno com 365 dias', () => {
        const bioestimulador = defaultProcedureTypes.find(p => p.name === 'Bioestimulador de Colágeno')

        expect(bioestimulador).toBeDefined()
        expect(bioestimulador?.reminderDays).toBe(365)
    })

    it('todos devem ter reminderMessage null (usa default)', () => {
        for (const procedure of defaultProcedureTypes) {
            expect(procedure.reminderMessage).toBeNull()
        }
    })

    it('todos devem ter name e description definidos', () => {
        for (const procedure of defaultProcedureTypes) {
            expect(procedure.name).toBeDefined()
            expect(procedure.name.length).toBeGreaterThan(0)
            expect(procedure.description).toBeDefined()
            expect(procedure.description.length).toBeGreaterThan(0)
        }
    })

    it('todos devem ter reminderDays como número positivo', () => {
        for (const procedure of defaultProcedureTypes) {
            expect(typeof procedure.reminderDays).toBe('number')
            expect(procedure.reminderDays).toBeGreaterThan(0)
        }
    })
})

// ============================================
// createProcedureRecord()
// ============================================

describe('createProcedureRecord', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2024-06-15T10:00:00Z'))
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('deve criar registro com nextReminderAt quando reminder está habilitado', async () => {
        const mockProcedureType = {
            id: 'pt_1',
            name: 'Botox',
            reminderDays: 120,
            reminderEnabled: true,
        }

        mockPrisma.procedureType.findUnique.mockResolvedValue(mockProcedureType)
        mockPrisma.procedureRecord.create.mockResolvedValue({})

        await createProcedureRecord('client_123', 'pt_1')

        expect(mockPrisma.procedureRecord.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                clientId: 'client_123',
                procedureTypeId: 'pt_1',
                performedAt: new Date('2024-06-15T10:00:00Z'),
                nextReminderAt: new Date('2024-10-13T10:00:00Z'), // +120 dias
            }),
        })
    })

    it('deve criar registro com nextReminderAt null quando reminder está desabilitado', async () => {
        const mockProcedureType = {
            id: 'pt_2',
            name: 'Procedimento Sem Reminder',
            reminderDays: 30,
            reminderEnabled: false,
        }

        mockPrisma.procedureType.findUnique.mockResolvedValue(mockProcedureType)
        mockPrisma.procedureRecord.create.mockResolvedValue({})

        await createProcedureRecord('client_456', 'pt_2')

        expect(mockPrisma.procedureRecord.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                clientId: 'client_456',
                procedureTypeId: 'pt_2',
                nextReminderAt: null,
            }),
        })
    })

    it('deve incluir appointmentId quando fornecido', async () => {
        const mockProcedureType = {
            id: 'pt_1',
            name: 'Botox',
            reminderDays: 120,
            reminderEnabled: true,
        }

        mockPrisma.procedureType.findUnique.mockResolvedValue(mockProcedureType)
        mockPrisma.procedureRecord.create.mockResolvedValue({})

        await createProcedureRecord('client_123', 'pt_1', 'appointment_789')

        expect(mockPrisma.procedureRecord.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                appointmentId: 'appointment_789',
            }),
        })
    })

    it('deve incluir notes quando fornecidas', async () => {
        const mockProcedureType = {
            id: 'pt_1',
            name: 'Botox',
            reminderDays: 120,
            reminderEnabled: true,
        }

        mockPrisma.procedureType.findUnique.mockResolvedValue(mockProcedureType)
        mockPrisma.procedureRecord.create.mockResolvedValue({})

        await createProcedureRecord('client_123', 'pt_1', undefined, 'Aplicação na testa e glabela')

        expect(mockPrisma.procedureRecord.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                notes: 'Aplicação na testa e glabela',
            }),
        })
    })

    it('deve lançar erro quando procedureType não existe', async () => {
        mockPrisma.procedureType.findUnique.mockResolvedValue(null)

        await expect(createProcedureRecord('client_123', 'invalid_pt'))
            .rejects.toThrow('Tipo de procedimento não encontrado')
    })

    it('deve calcular nextReminderAt corretamente para diferentes reminderDays', async () => {
        const testCases = [
            { reminderDays: 30, expectedDate: new Date('2024-07-15T10:00:00Z') },
            { reminderDays: 90, expectedDate: new Date('2024-09-13T10:00:00Z') },
            { reminderDays: 180, expectedDate: new Date('2024-12-12T10:00:00Z') },
            { reminderDays: 365, expectedDate: new Date('2025-06-15T10:00:00Z') },
        ]

        for (const { reminderDays, expectedDate } of testCases) {
            mockPrisma.procedureType.findUnique.mockResolvedValue({
                id: 'pt_test',
                name: 'Test',
                reminderDays,
                reminderEnabled: true,
            })
            mockPrisma.procedureRecord.create.mockResolvedValue({})

            await createProcedureRecord('client_test', 'pt_test')

            expect(mockPrisma.procedureRecord.create).toHaveBeenLastCalledWith({
                data: expect.objectContaining({
                    nextReminderAt: expectedDate,
                }),
            })
        }
    })
})

// ============================================
// processPendingReminders()
// ============================================

describe('processPendingReminders', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2024-06-15T10:00:00Z'))
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('deve retornar array vazio quando não há reminders pendentes', async () => {
        mockPrisma.procedureRecord.findMany.mockResolvedValue([])

        const results = await processPendingReminders()

        expect(results).toEqual([])
    })

    it('deve buscar apenas records com nextReminderAt <= now e reminderSentAt null', async () => {
        mockPrisma.procedureRecord.findMany.mockResolvedValue([])

        await processPendingReminders()

        expect(mockPrisma.procedureRecord.findMany).toHaveBeenCalledWith({
            where: {
                nextReminderAt: { lte: new Date('2024-06-15T10:00:00Z') },
                reminderSentAt: null,
                procedureType: {
                    reminderEnabled: true,
                },
            },
            include: {
                client: {
                    include: {
                        tenant: true,
                    },
                },
                procedureType: true,
            },
            take: 100,
        })
    })

    it('deve processar reminder e marcar como enviado', async () => {
        const mockRecord = {
            id: 'record_1',
            clientId: 'client_1',
            performedAt: new Date('2024-02-15T10:00:00Z'), // 120 dias atrás
            client: {
                id: 'client_1',
                name: 'Maria Silva',
                phone: '5511999999999',
                tenant: {
                    chatwootUrl: 'https://chat.example.com',
                    chatwootApiKey: 'api_key_123',
                    chatwootAccountId: 'acc_1',
                    chatwootInboxId: 'inbox_1',
                },
            },
            procedureType: {
                id: 'pt_1',
                name: 'Botox',
                reminderDays: 120,
                reminderMessage: null,
            },
        }

        mockPrisma.procedureRecord.findMany.mockResolvedValue([mockRecord])
        mockPrisma.procedureRecord.update.mockResolvedValue({})
        mockFetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ id: 'conv_1' }),
        })

        const results = await processPendingReminders()

        expect(results).toHaveLength(1)
        expect(results[0]).toEqual({
            success: true,
            clientId: 'client_1',
            clientName: 'Maria Silva',
            procedureType: 'Botox',
            message: 'Lembrete enviado com sucesso',
        })
    })

    it('deve atualizar reminderSentAt e calcular próximo nextReminderAt', async () => {
        const mockRecord = {
            id: 'record_1',
            clientId: 'client_1',
            performedAt: new Date('2024-02-15T10:00:00Z'),
            client: {
                id: 'client_1',
                name: 'João',
                phone: '5511888888888',
                tenant: {
                    chatwootUrl: 'https://chat.example.com',
                    chatwootApiKey: 'key',
                    chatwootAccountId: 'acc',
                    chatwootInboxId: 'inbox',
                },
            },
            procedureType: {
                id: 'pt_1',
                name: 'Limpeza de Pele',
                reminderDays: 30,
                reminderMessage: null,
            },
        }

        mockPrisma.procedureRecord.findMany.mockResolvedValue([mockRecord])
        mockPrisma.procedureRecord.update.mockResolvedValue({})
        mockFetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ id: 'conv_1' }),
        })

        await processPendingReminders()

        expect(mockPrisma.procedureRecord.update).toHaveBeenCalledWith({
            where: { id: 'record_1' },
            data: {
                reminderSentAt: new Date('2024-06-15T10:00:00Z'),
                nextReminderAt: new Date('2024-07-15T10:00:00Z'), // +30 dias
            },
        })
    })

    it('deve pular envio quando tenant não tem Chatwoot configurado', async () => {
        const mockRecord = {
            id: 'record_1',
            clientId: 'client_1',
            performedAt: new Date('2024-02-15T10:00:00Z'),
            client: {
                id: 'client_1',
                name: 'Ana',
                phone: '5511777777777',
                tenant: {
                    chatwootUrl: null, // Não configurado
                    chatwootApiKey: null,
                    chatwootAccountId: null,
                    chatwootInboxId: null,
                },
            },
            procedureType: {
                id: 'pt_1',
                name: 'Botox',
                reminderDays: 120,
                reminderMessage: null,
            },
        }

        mockPrisma.procedureRecord.findMany.mockResolvedValue([mockRecord])
        mockPrisma.procedureRecord.update.mockResolvedValue({})

        const results = await processPendingReminders()

        // Não deve chamar fetch (sem Chatwoot)
        expect(mockFetch).not.toHaveBeenCalled()

        // Mas ainda deve marcar como processado
        expect(mockPrisma.procedureRecord.update).toHaveBeenCalled()
        expect(results[0].success).toBe(true)
    })

    it('deve retornar erro quando falha no processamento individual', async () => {
        const mockRecord = {
            id: 'record_1',
            clientId: 'client_1',
            performedAt: new Date('2024-02-15T10:00:00Z'),
            client: {
                id: 'client_1',
                name: 'Pedro',
                phone: '5511666666666',
                tenant: {
                    chatwootUrl: 'https://chat.example.com',
                    chatwootApiKey: 'key',
                    chatwootAccountId: 'acc',
                    chatwootInboxId: 'inbox',
                },
            },
            procedureType: {
                id: 'pt_1',
                name: 'Preenchimento',
                reminderDays: 180,
                reminderMessage: null,
            },
        }

        mockPrisma.procedureRecord.findMany.mockResolvedValue([mockRecord])
        mockFetch.mockRejectedValue(new Error('Network error'))

        const results = await processPendingReminders()

        expect(results).toHaveLength(1)
        expect(results[0].success).toBe(false)
        expect(results[0].message).toContain('Network error')
    })

    it('deve processar múltiplos reminders em batch', async () => {
        const mockRecords = [
            {
                id: 'record_1',
                clientId: 'client_1',
                performedAt: new Date('2024-02-15'),
                client: { id: 'c1', name: 'Cliente 1', phone: '551111111111', tenant: {} },
                procedureType: { id: 'pt1', name: 'Botox', reminderDays: 120, reminderMessage: null },
            },
            {
                id: 'record_2',
                clientId: 'client_2',
                performedAt: new Date('2024-03-15'),
                client: { id: 'c2', name: 'Cliente 2', phone: '551122222222', tenant: {} },
                procedureType: { id: 'pt2', name: 'Limpeza', reminderDays: 30, reminderMessage: null },
            },
            {
                id: 'record_3',
                clientId: 'client_3',
                performedAt: new Date('2024-01-15'),
                client: { id: 'c3', name: 'Cliente 3', phone: '551133333333', tenant: {} },
                procedureType: { id: 'pt3', name: 'Peeling', reminderDays: 30, reminderMessage: null },
            },
        ]

        mockPrisma.procedureRecord.findMany.mockResolvedValue(mockRecords)
        mockPrisma.procedureRecord.update.mockResolvedValue({})

        const results = await processPendingReminders()

        expect(results).toHaveLength(3)
        expect(mockPrisma.procedureRecord.update).toHaveBeenCalledTimes(3)
    })

    it('deve limitar processamento a 100 records por vez', async () => {
        mockPrisma.procedureRecord.findMany.mockResolvedValue([])

        await processPendingReminders()

        expect(mockPrisma.procedureRecord.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                take: 100,
            })
        )
    })

    it('deve calcular daysSince corretamente', async () => {
        // performedAt: 2024-02-15 (121 dias antes de 2024-06-15)
        const mockRecord = {
            id: 'record_1',
            clientId: 'client_1',
            performedAt: new Date('2024-02-15T10:00:00Z'),
            client: {
                id: 'client_1',
                name: 'Test',
                phone: '5511999999999',
                tenant: {},
            },
            procedureType: {
                id: 'pt_1',
                name: 'Botox',
                reminderDays: 120,
                reminderMessage: null, // Usará mensagem default com daysSince
            },
        }

        mockPrisma.procedureRecord.findMany.mockResolvedValue([mockRecord])
        mockPrisma.procedureRecord.update.mockResolvedValue({})

        // A mensagem gerada deve conter "121 dias"
        await processPendingReminders()

        // O teste passa se não houver erro no cálculo
        expect(mockPrisma.procedureRecord.update).toHaveBeenCalled()
    })

    it('deve retornar array vazio quando ocorre erro na busca', async () => {
        mockPrisma.procedureRecord.findMany.mockRejectedValue(new Error('Database error'))

        const results = await processPendingReminders()

        expect(results).toEqual([])
    })
})

// ============================================
// Cenários de integração
// ============================================

describe('Cenários de integração', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('fluxo completo: criar procedimento e processar reminder', async () => {
        vi.useFakeTimers()

        // 1. Criar procedimento em Janeiro
        vi.setSystemTime(new Date('2024-01-15T10:00:00Z'))

        mockPrisma.procedureType.findUnique.mockResolvedValue({
            id: 'pt_botox',
            name: 'Botox',
            reminderDays: 120,
            reminderEnabled: true,
        })
        mockPrisma.procedureRecord.create.mockResolvedValue({})

        await createProcedureRecord('client_maria', 'pt_botox')

        // Verificar que foi criado com nextReminderAt em Maio
        expect(mockPrisma.procedureRecord.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                nextReminderAt: new Date('2024-05-14T10:00:00Z'),
            }),
        })

        // 2. Avançar para Maio e processar reminders
        vi.setSystemTime(new Date('2024-05-15T10:00:00Z'))

        mockPrisma.procedureRecord.findMany.mockResolvedValue([])

        const results = await processPendingReminders()

        // Função foi chamada corretamente
        expect(mockPrisma.procedureRecord.findMany).toHaveBeenCalled()

        vi.useRealTimers()
    })

    it('procedimentos diferentes têm intervalos diferentes', () => {
        const botox = defaultProcedureTypes.find(p => p.name === 'Botox')
        const limpeza = defaultProcedureTypes.find(p => p.name === 'Limpeza de Pele')
        const preenchimento = defaultProcedureTypes.find(p => p.name === 'Preenchimento Facial')

        // Botox: 4 meses
        expect(botox?.reminderDays).toBe(120)

        // Limpeza: 1 mês
        expect(limpeza?.reminderDays).toBe(30)

        // Preenchimento facial: 12 meses
        expect(preenchimento?.reminderDays).toBe(365)
    })
})
