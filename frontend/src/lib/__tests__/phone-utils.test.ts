/**
 * NexaCore - Phone Utils Tests
 * 
 * Testes unitários para normalização de telefones brasileiros
 * 
 * @see src/lib/phone-utils.ts
 */

import { describe, it, expect } from 'vitest'
import {
    VALID_BRAZILIAN_DDDS,
    isValidBrazilianDDD,
    normalizePhoneBR,
    formatPhoneForDisplay,
    extractDDD,
    isMobilePhone,
} from '../phone-utils'

// ============================================
// VALID_BRAZILIAN_DDDS
// ============================================

describe('VALID_BRAZILIAN_DDDS', () => {
    it('deve ter 67 DDDs válidos', () => {
        expect(VALID_BRAZILIAN_DDDS).toHaveLength(67)
    })

    it('deve incluir DDDs de São Paulo (11-19)', () => {
        const spDDDs = ['11', '12', '13', '14', '15', '16', '17', '18', '19']
        for (const ddd of spDDDs) {
            expect(VALID_BRAZILIAN_DDDS).toContain(ddd)
        }
    })

    it('deve incluir DDDs do Rio de Janeiro (21, 22, 24)', () => {
        expect(VALID_BRAZILIAN_DDDS).toContain('21')
        expect(VALID_BRAZILIAN_DDDS).toContain('22')
        expect(VALID_BRAZILIAN_DDDS).toContain('24')
    })

    it('NÃO deve incluir DDDs inexistentes', () => {
        const invalidDDDs = ['00', '10', '20', '23', '25', '26', '29', '30', '36', '39', '40', '50', '52', '56', '57', '58', '59', '60', '70', '72', '76', '78', '80', '90']
        for (const ddd of invalidDDDs) {
            expect(VALID_BRAZILIAN_DDDS).not.toContain(ddd)
        }
    })
})

// ============================================
// isValidBrazilianDDD()
// ============================================

describe('isValidBrazilianDDD', () => {
    describe('DDDs válidos', () => {
        it('deve retornar true para DDD 11 (São Paulo capital)', () => {
            expect(isValidBrazilianDDD('11')).toBe(true)
        })

        it('deve retornar true para DDD 21 (Rio de Janeiro)', () => {
            expect(isValidBrazilianDDD('21')).toBe(true)
        })

        it('deve retornar true para DDD 31 (Belo Horizonte)', () => {
            expect(isValidBrazilianDDD('31')).toBe(true)
        })

        it('deve retornar true para DDD 61 (Brasília)', () => {
            expect(isValidBrazilianDDD('61')).toBe(true)
        })

        it('deve retornar true para DDD 71 (Salvador)', () => {
            expect(isValidBrazilianDDD('71')).toBe(true)
        })

        it('deve retornar true para DDD 91 (Belém)', () => {
            expect(isValidBrazilianDDD('91')).toBe(true)
        })

        it('deve retornar true para DDD 99 (Maranhão)', () => {
            expect(isValidBrazilianDDD('99')).toBe(true)
        })
    })

    describe('DDDs inválidos', () => {
        it('deve retornar false para DDD 00', () => {
            expect(isValidBrazilianDDD('00')).toBe(false)
        })

        it('deve retornar false para DDD 10 (não existe)', () => {
            expect(isValidBrazilianDDD('10')).toBe(false)
        })

        it('deve retornar false para DDD 20 (não existe)', () => {
            expect(isValidBrazilianDDD('20')).toBe(false)
        })

        it('deve retornar false para DDD 23 (não existe)', () => {
            expect(isValidBrazilianDDD('23')).toBe(false)
        })

        it('deve retornar false para string vazia', () => {
            expect(isValidBrazilianDDD('')).toBe(false)
        })

        it('deve retornar false para DDD com 1 dígito', () => {
            expect(isValidBrazilianDDD('1')).toBe(false)
        })

        it('deve retornar false para DDD com 3 dígitos', () => {
            expect(isValidBrazilianDDD('011')).toBe(false)
        })
    })
})

// ============================================
// normalizePhoneBR()
// ============================================

describe('normalizePhoneBR', () => {
    // ----------------------------------------
    // Inputs inválidos
    // ----------------------------------------

    describe('inputs inválidos', () => {
        it('deve retornar null para string vazia', () => {
            expect(normalizePhoneBR('')).toBeNull()
        })

        it('deve retornar null para null/undefined', () => {
            expect(normalizePhoneBR(null as any)).toBeNull()
            expect(normalizePhoneBR(undefined as any)).toBeNull()
        })

        it('deve retornar null para string sem dígitos', () => {
            expect(normalizePhoneBR('abc')).toBeNull()
            expect(normalizePhoneBR('---')).toBeNull()
            expect(normalizePhoneBR('(  ) -')).toBeNull()
        })

        it('deve retornar null para 8 dígitos (sem DDD)', () => {
            expect(normalizePhoneBR('98765432')).toBeNull()
        })

        it('deve retornar null para 9 dígitos (sem DDD)', () => {
            expect(normalizePhoneBR('987654321')).toBeNull()
        })

        it('deve retornar null para DDD inválido', () => {
            expect(normalizePhoneBR('23987654321')).toBeNull() // DDD 23 não existe
            expect(normalizePhoneBR('00987654321')).toBeNull() // DDD 00 não existe
            expect(normalizePhoneBR('10987654321')).toBeNull() // DDD 10 não existe
        })
    })

    // ----------------------------------------
    // 10 dígitos (telefone fixo com DDD)
    // ----------------------------------------

    describe('10 dígitos (fixo com DDD)', () => {
        it('deve normalizar telefone fixo de SP', () => {
            expect(normalizePhoneBR('1132145678')).toBe('551132145678')
        })

        it('deve normalizar telefone fixo do RJ', () => {
            expect(normalizePhoneBR('2132145678')).toBe('552132145678')
        })

        it('deve normalizar telefone fixo de BH', () => {
            expect(normalizePhoneBR('3132145678')).toBe('553132145678')
        })

        it('deve rejeitar 10 dígitos com DDD inválido', () => {
            expect(normalizePhoneBR('2332145678')).toBeNull()
        })
    })

    // ----------------------------------------
    // 11 dígitos (celular com DDD)
    // ----------------------------------------

    describe('11 dígitos (celular com DDD)', () => {
        it('deve normalizar celular de SP', () => {
            expect(normalizePhoneBR('11987654321')).toBe('5511987654321')
        })

        it('deve normalizar celular do RJ', () => {
            expect(normalizePhoneBR('21987654321')).toBe('5521987654321')
        })

        it('deve normalizar celular de Salvador', () => {
            expect(normalizePhoneBR('71987654321')).toBe('5571987654321')
        })

        it('deve normalizar celular de Brasília', () => {
            expect(normalizePhoneBR('61987654321')).toBe('5561987654321')
        })

        it('deve rejeitar 11 dígitos com DDD inválido', () => {
            expect(normalizePhoneBR('23987654321')).toBeNull()
            expect(normalizePhoneBR('00987654321')).toBeNull()
        })
    })

    // ----------------------------------------
    // 12 dígitos
    // ----------------------------------------

    describe('12 dígitos', () => {
        it('deve aceitar formato 55DDXXXXXXXX (fixo internacional)', () => {
            expect(normalizePhoneBR('551132145678')).toBe('551132145678')
        })

        it('deve aceitar formato 55DDXXXXXXXX com outro DDD', () => {
            expect(normalizePhoneBR('552132145678')).toBe('552132145678')
        })
    })

    // ----------------------------------------
    // 13 dígitos
    // ----------------------------------------

    describe('13 dígitos', () => {
        it('deve aceitar formato 55DDXXXXXXXXX (celular internacional)', () => {
            expect(normalizePhoneBR('5511987654321')).toBe('5511987654321')
        })

        it('deve extrair últimos 11 quando não começa com 55+DDD válido', () => {
            expect(normalizePhoneBR('9911987654321')).toBe('5511987654321')
        })
    })

    // ----------------------------------------
    // 14 dígitos (casos especiais)
    // ----------------------------------------

    describe('14 dígitos', () => {
        it('deve corrigir 55 duplicado (5555DDXXXXXXXX)', () => {
            expect(normalizePhoneBR('55551132145678')).toBe('551132145678')
        })

        it('deve extrair últimos 13 quando começa com 55', () => {
            expect(normalizePhoneBR('55511987654321')).toBe('5511987654321')
        })

        it('deve extrair últimos 11 quando não começa com 55', () => {
            expect(normalizePhoneBR('00011987654321')).toBe('5511987654321')
        })
    })

    // ----------------------------------------
    // Mais de 14 dígitos
    // ----------------------------------------

    describe('mais de 14 dígitos', () => {
        it('deve extrair últimos 11 dígitos com DDD válido', () => {
            expect(normalizePhoneBR('123456711987654321')).toBe('5511987654321')
        })

        it('deve rejeitar se últimos 11 dígitos têm DDD inválido', () => {
            expect(normalizePhoneBR('123456723987654321')).toBeNull()
        })
    })

    // ----------------------------------------
    // Remoção de zeros à esquerda
    // ----------------------------------------

    describe('zeros à esquerda', () => {
        it('deve remover zero à esquerda de 11 dígitos', () => {
            expect(normalizePhoneBR('011987654321')).toBe('5511987654321')
        })

        it('deve remover múltiplos zeros à esquerda', () => {
            expect(normalizePhoneBR('000011987654321')).toBe('5511987654321')
        })
    })

    // ----------------------------------------
    // Formatação com caracteres especiais
    // ----------------------------------------

    describe('caracteres especiais', () => {
        it('deve remover parênteses e espaços', () => {
            expect(normalizePhoneBR('(11) 98765-4321')).toBe('5511987654321')
        })

        it('deve remover hífens', () => {
            expect(normalizePhoneBR('11-98765-4321')).toBe('5511987654321')
        })

        it('deve remover pontos', () => {
            expect(normalizePhoneBR('11.98765.4321')).toBe('5511987654321')
        })

        it('deve remover + do início (formato internacional)', () => {
            expect(normalizePhoneBR('+5511987654321')).toBe('5511987654321')
        })

        it('deve funcionar com formato WhatsApp comum', () => {
            expect(normalizePhoneBR('+55 11 98765-4321')).toBe('5511987654321')
        })

        it('deve funcionar com formato de cartão de visita', () => {
            expect(normalizePhoneBR('Tel: (11) 98765-4321')).toBe('5511987654321')
        })
    })

    // ----------------------------------------
    // Validação final
    // ----------------------------------------

    describe('validação final', () => {
        it('resultado deve ter 12 dígitos (fixo) ou 13 dígitos (celular)', () => {
            // Fixo: 12 dígitos
            const fixo = normalizePhoneBR('1132145678')
            expect(fixo).toBe('551132145678')
            expect(fixo?.length).toBe(12)

            // Celular: 13 dígitos
            const celular = normalizePhoneBR('11987654321')
            expect(celular).toBe('5511987654321')
            expect(celular?.length).toBe(13)
        })

        it('resultado deve sempre começar com 55', () => {
            const phones = [
                '11987654321',
                '21987654321',
                '71987654321',
                '(11) 98765-4321',
                '+55 11 98765-4321',
            ]

            for (const phone of phones) {
                const result = normalizePhoneBR(phone)
                expect(result?.startsWith('55')).toBe(true)
            }
        })
    })

    // ----------------------------------------
    // Cenários reais do WhatsApp
    // ----------------------------------------

    describe('cenários reais do WhatsApp', () => {
        it('deve normalizar número vindo do WhatsApp Web', () => {
            expect(normalizePhoneBR('5511987654321')).toBe('5511987654321')
        })

        it('deve normalizar número copiado de contato', () => {
            expect(normalizePhoneBR('(11) 9 8765-4321')).toBe('5511987654321')
        })

        it('deve normalizar número com código do país duplicado', () => {
            expect(normalizePhoneBR('+55 +55 11 98765-4321')).toBe('5511987654321')
        })
    })
})

// ============================================
// formatPhoneForDisplay()
// ============================================

describe('formatPhoneForDisplay', () => {
    it('deve formatar celular com DDD', () => {
        expect(formatPhoneForDisplay('5511987654321')).toBe('(11) 98765-4321')
    })

    it('deve formatar fixo com DDD', () => {
        expect(formatPhoneForDisplay('551132145678')).toBe('(11) 3214-5678')
    })

    it('deve funcionar sem código do país', () => {
        expect(formatPhoneForDisplay('11987654321')).toBe('(11) 98765-4321')
    })

    it('deve retornar input se não conseguir formatar', () => {
        expect(formatPhoneForDisplay('invalid')).toBe('invalid')
        expect(formatPhoneForDisplay('')).toBe('')
    })
})

// ============================================
// extractDDD()
// ============================================

describe('extractDDD', () => {
    it('deve extrair DDD de número normalizado', () => {
        expect(extractDDD('5511987654321')).toBe('11')
        expect(extractDDD('5521987654321')).toBe('21')
        expect(extractDDD('5571987654321')).toBe('71')
    })

    it('deve extrair DDD de número não normalizado', () => {
        expect(extractDDD('(11) 98765-4321')).toBe('11')
        expect(extractDDD('+55 21 98765-4321')).toBe('21')
    })

    it('deve retornar null para número inválido', () => {
        expect(extractDDD('invalid')).toBeNull()
        expect(extractDDD('')).toBeNull()
        expect(extractDDD('12345')).toBeNull()
    })
})

// ============================================
// isMobilePhone()
// ============================================

describe('isMobilePhone', () => {
    it('deve retornar true para celular (13 dígitos)', () => {
        expect(isMobilePhone('5511987654321')).toBe(true)
        expect(isMobilePhone('11987654321')).toBe(true)
        expect(isMobilePhone('(11) 98765-4321')).toBe(true)
    })

    it('deve retornar false para fixo (12 dígitos)', () => {
        expect(isMobilePhone('551132145678')).toBe(false)
        expect(isMobilePhone('1132145678')).toBe(false)
        expect(isMobilePhone('(11) 3214-5678')).toBe(false)
    })

    it('deve retornar false para número inválido', () => {
        expect(isMobilePhone('invalid')).toBe(false)
        expect(isMobilePhone('')).toBe(false)
    })
})

// ============================================
// Integração
// ============================================

describe('Integração: fluxo completo', () => {
    it('deve normalizar, extrair DDD e identificar tipo', () => {
        const raw = '(11) 98765-4321'

        const normalized = normalizePhoneBR(raw)
        expect(normalized).toBe('5511987654321')

        const ddd = extractDDD(raw)
        expect(ddd).toBe('11')

        const isMobile = isMobilePhone(raw)
        expect(isMobile).toBe(true)

        const formatted = formatPhoneForDisplay(normalized!)
        expect(formatted).toBe('(11) 98765-4321')
    })

    it('deve identificar telefone fixo corretamente', () => {
        const raw = '(11) 3214-5678'

        const normalized = normalizePhoneBR(raw)
        expect(normalized).toBe('551132145678')

        const isMobile = isMobilePhone(raw)
        expect(isMobile).toBe(false)

        const formatted = formatPhoneForDisplay(normalized!)
        expect(formatted).toBe('(11) 3214-5678')
    })

    it('deve processar número do WhatsApp', () => {
        const whatsappNumber = '5521999887766'

        const normalized = normalizePhoneBR(whatsappNumber)
        expect(normalized).toBe('5521999887766')

        const ddd = extractDDD(whatsappNumber)
        expect(ddd).toBe('21')

        expect(isMobilePhone(whatsappNumber)).toBe(true)
    })
})
