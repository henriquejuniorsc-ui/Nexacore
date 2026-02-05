/**
 * NexaCore - Utils Tests
 * 
 * Testes unitários para funções utilitárias
 * 
 * @see src/lib/utils.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
    cn,
    formatCurrency,
    formatDate,
    formatDateTime,
    formatPhone,
    slugify,
    getInitials,
    truncate,
    generateId,
    daysUntil,
    isToday,
    getGreeting,
} from '../utils'

// ============================================
// cn() - Class Name Utility (Tailwind Merge)
// ============================================

describe('cn', () => {
    it('deve combinar classes simples', () => {
        const result = cn('foo', 'bar')
        expect(result).toBe('foo bar')
    })

    it('deve lidar com valores condicionais', () => {
        const isActive = true
        const result = cn('base', isActive && 'active')
        expect(result).toBe('base active')
    })

    it('deve ignorar valores falsy', () => {
        const result = cn('base', false, null, undefined, 'valid')
        expect(result).toBe('base valid')
    })

    it('deve fazer merge de classes Tailwind conflitantes', () => {
        // twMerge deve resolver conflitos, ex: p-2 + p-4 = p-4
        const result = cn('p-2', 'p-4')
        expect(result).toBe('p-4')
    })

    it('deve lidar com arrays de classes', () => {
        const result = cn(['foo', 'bar'], 'baz')
        expect(result).toBe('foo bar baz')
    })

    it('deve lidar com objetos de classes', () => {
        const result = cn({ foo: true, bar: false, baz: true })
        expect(result).toBe('foo baz')
    })
})

// ============================================
// formatCurrency() - Formatação de moeda BRL
// ============================================

describe('formatCurrency', () => {
    it('deve formatar valor positivo em BRL', () => {
        const result = formatCurrency(1234.56)
        expect(result).toMatch(/R\$\s*1\.234,56/)
    })

    it('deve formatar valor inteiro', () => {
        const result = formatCurrency(100)
        expect(result).toMatch(/R\$\s*100,00/)
    })

    it('deve formatar zero', () => {
        const result = formatCurrency(0)
        expect(result).toMatch(/R\$\s*0,00/)
    })

    it('deve formatar valores negativos', () => {
        const result = formatCurrency(-50.5)
        expect(result).toContain('50,50')
    })

    it('deve formatar valores grandes', () => {
        const result = formatCurrency(1000000)
        expect(result).toMatch(/R\$\s*1\.000\.000,00/)
    })

    it('deve arredondar corretamente', () => {
        const result = formatCurrency(10.999)
        expect(result).toMatch(/R\$\s*11,00/)
    })
})

// ============================================
// formatDate() - Formatação de data
// ============================================

describe('formatDate', () => {
    it('deve formatar Date object', () => {
        const date = new Date(2024, 0, 15) // Janeiro é mês 0
        const result = formatDate(date)
        expect(result).toBe('15/01/2024')
    })

    it('deve formatar string ISO', () => {
        const result = formatDate('2024-06-20T10:30:00Z')
        expect(result).toMatch(/\d{2}\/\d{2}\/2024/)
    })

    it('deve lidar com diferentes anos', () => {
        const result = formatDate(new Date(2030, 11, 25))
        expect(result).toBe('25/12/2030')
    })
})

// ============================================
// formatDateTime() - Formatação de data e hora
// ============================================

describe('formatDateTime', () => {
    it('deve formatar data e hora', () => {
        const date = new Date(2024, 0, 15, 14, 30)
        const result = formatDateTime(date)
        expect(result).toMatch(/15\/01\/2024/)
        expect(result).toMatch(/14:30/)
    })

    it('deve formatar string ISO com hora', () => {
        const result = formatDateTime('2024-06-20T10:30:00')
        expect(result).toMatch(/\d{2}\/\d{2}\/2024/)
        expect(result).toMatch(/\d{2}:\d{2}/)
    })
})

// ============================================
// formatPhone() - Formatação de telefone BR
// ============================================

describe('formatPhone', () => {
    it('deve formatar celular (11 dígitos)', () => {
        const result = formatPhone('11987654321')
        expect(result).toBe('(11) 98765-4321')
    })

    it('deve formatar fixo (10 dígitos)', () => {
        const result = formatPhone('1132145678')
        expect(result).toBe('(11) 3214-5678')
    })

    it('deve limpar caracteres não numéricos', () => {
        const result = formatPhone('(11) 98765-4321')
        expect(result).toBe('(11) 98765-4321')
    })

    it('deve retornar original se formato inválido', () => {
        const result = formatPhone('123')
        expect(result).toBe('123')
    })

    it('deve lidar com número internacional', () => {
        const result = formatPhone('+5511987654321')
        // 14 dígitos - retorna original
        expect(result).toBe('+5511987654321')
    })
})

// ============================================
// slugify() - Geração de slugs
// ============================================

describe('slugify', () => {
    it('deve converter para minúsculas', () => {
        expect(slugify('HELLO WORLD')).toBe('hello-world')
    })

    it('deve remover acentos', () => {
        expect(slugify('São Paulo')).toBe('sao-paulo')
        expect(slugify('Limpeza de Pélé')).toBe('limpeza-de-pele')
    })

    it('deve substituir espaços por hífens', () => {
        expect(slugify('hello world')).toBe('hello-world')
    })

    it('deve remover caracteres especiais', () => {
        expect(slugify('hello@world!')).toBe('hello-world')
    })

    it('deve remover hífens duplicados', () => {
        expect(slugify('hello   world')).toBe('hello-world')
    })

    it('deve remover hífens no início e fim', () => {
        expect(slugify(' hello ')).toBe('hello')
        expect(slugify('--hello--')).toBe('hello')
    })

    it('deve lidar com texto em português', () => {
        expect(slugify('Limpeza de Pele Profunda')).toBe('limpeza-de-pele-profunda')
        expect(slugify('Botox + Preenchimento')).toBe('botox-preenchimento')
    })
})

// ============================================
// getInitials() - Iniciais do nome
// ============================================

describe('getInitials', () => {
    it('deve retornar duas iniciais para nome completo', () => {
        expect(getInitials('Maria Silva')).toBe('MS')
    })

    it('deve retornar uma inicial para nome simples', () => {
        expect(getInitials('Maria')).toBe('M')
    })

    it('deve limitar a duas iniciais', () => {
        expect(getInitials('Maria Silva Santos')).toBe('MS')
    })

    it('deve converter para maiúsculas', () => {
        expect(getInitials('joão pedro')).toBe('JP')
    })
})

// ============================================
// truncate() - Truncar texto
// ============================================

describe('truncate', () => {
    it('deve truncar texto longo', () => {
        expect(truncate('Hello World', 5)).toBe('Hello...')
    })

    it('não deve truncar texto curto', () => {
        expect(truncate('Hi', 10)).toBe('Hi')
    })

    it('deve lidar com texto exato no limite', () => {
        expect(truncate('Hello', 5)).toBe('Hello')
    })

    it('deve lidar com texto vazio', () => {
        expect(truncate('', 5)).toBe('')
    })
})

// ============================================
// generateId() - Geração de ID
// ============================================

describe('generateId', () => {
    it('deve gerar string não vazia', () => {
        const id = generateId()
        expect(id).toBeTruthy()
        expect(typeof id).toBe('string')
    })

    it('deve gerar IDs únicos', () => {
        const ids = new Set()
        for (let i = 0; i < 100; i++) {
            ids.add(generateId())
        }
        expect(ids.size).toBe(100)
    })

    it('deve ter aproximadamente 7 caracteres', () => {
        const id = generateId()
        expect(id.length).toBe(7)
    })

    it('deve conter apenas caracteres alfanuméricos', () => {
        const id = generateId()
        expect(id).toMatch(/^[a-z0-9]+$/)
    })
})

// ============================================
// daysUntil() - Dias até uma data
// ============================================

describe('daysUntil', () => {
    beforeEach(() => {
        // Mock da data atual para testes consistentes
        vi.useFakeTimers()
        vi.setSystemTime(new Date(2024, 5, 15)) // 15 de Junho de 2024
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('deve calcular dias até data futura', () => {
        const futureDate = new Date(2024, 5, 20) // 20 de Junho
        expect(daysUntil(futureDate)).toBe(5)
    })

    it('deve retornar 0 para hoje', () => {
        const today = new Date(2024, 5, 15)
        expect(daysUntil(today)).toBe(0)
    })

    it('deve retornar negativo para data passada', () => {
        const pastDate = new Date(2024, 5, 10) // 10 de Junho
        expect(daysUntil(pastDate)).toBe(-5)
    })

    it('deve aceitar string ISO', () => {
        const result = daysUntil('2024-06-20')
        expect(result).toBeGreaterThanOrEqual(4) // Pode variar por timezone
    })
})

// ============================================
// isToday() - Verificar se é hoje
// ============================================

describe('isToday', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date(2024, 5, 15, 12, 0, 0)) // 15 de Junho 2024, meio-dia
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('deve retornar true para hoje', () => {
        const today = new Date(2024, 5, 15)
        expect(isToday(today)).toBe(true)
    })

    it('deve retornar true para hoje em horário diferente', () => {
        const todayMorning = new Date(2024, 5, 15, 8, 0, 0)
        const todayNight = new Date(2024, 5, 15, 23, 59, 59)

        expect(isToday(todayMorning)).toBe(true)
        expect(isToday(todayNight)).toBe(true)
    })

    it('deve retornar false para ontem', () => {
        const yesterday = new Date(2024, 5, 14)
        expect(isToday(yesterday)).toBe(false)
    })

    it('deve retornar false para amanhã', () => {
        const tomorrow = new Date(2024, 5, 16)
        expect(isToday(tomorrow)).toBe(false)
    })

    it('deve aceitar string ISO', () => {
        expect(isToday('2024-06-15T10:00:00')).toBe(true)
        expect(isToday('2024-06-14')).toBe(false)
    })
})

// ============================================
// getGreeting() - Saudação baseada na hora
// ============================================

describe('getGreeting', () => {
    afterEach(() => {
        vi.useRealTimers()
    })

    it('deve retornar "Bom dia" pela manhã', () => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date(2024, 5, 15, 8, 0, 0)) // 8:00

        expect(getGreeting()).toBe('Bom dia')
    })

    it('deve retornar "Boa tarde" à tarde', () => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date(2024, 5, 15, 14, 0, 0)) // 14:00

        expect(getGreeting()).toBe('Boa tarde')
    })

    it('deve retornar "Boa noite" à noite', () => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date(2024, 5, 15, 20, 0, 0)) // 20:00

        expect(getGreeting()).toBe('Boa noite')
    })

    it('deve retornar "Bom dia" às 11:59', () => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date(2024, 5, 15, 11, 59, 0))

        expect(getGreeting()).toBe('Bom dia')
    })

    it('deve retornar "Boa tarde" às 12:00', () => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date(2024, 5, 15, 12, 0, 0))

        expect(getGreeting()).toBe('Boa tarde')
    })

    it('deve retornar "Boa tarde" às 17:59', () => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date(2024, 5, 15, 17, 59, 0))

        expect(getGreeting()).toBe('Boa tarde')
    })

    it('deve retornar "Boa noite" às 18:00', () => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date(2024, 5, 15, 18, 0, 0))

        expect(getGreeting()).toBe('Boa noite')
    })
})
