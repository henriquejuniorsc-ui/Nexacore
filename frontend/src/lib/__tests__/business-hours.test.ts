/**
 * NexaCore - Business Hours Tests
 * 
 * Testes unitários para o sistema de horário de atendimento
 * 
 * @see src/lib/business-hours.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
    isWithinBusinessHours,
    getDefaultBusinessHours,
    validateBusinessHours,
} from '../business-hours'

// ============================================
// getDefaultBusinessHours()
// ============================================

describe('getDefaultBusinessHours', () => {
    it('deve retornar objeto com 7 dias da semana', () => {
        const defaults = getDefaultBusinessHours()

        expect(defaults).toHaveProperty('sunday')
        expect(defaults).toHaveProperty('monday')
        expect(defaults).toHaveProperty('tuesday')
        expect(defaults).toHaveProperty('wednesday')
        expect(defaults).toHaveProperty('thursday')
        expect(defaults).toHaveProperty('friday')
        expect(defaults).toHaveProperty('saturday')
        expect(Object.keys(defaults)).toHaveLength(7)
    })

    it('deve ter domingo desabilitado', () => {
        const defaults = getDefaultBusinessHours()

        expect(defaults.sunday).toEqual({
            enabled: false,
            start: '09:00',
            end: '18:00',
        })
    })

    it('deve ter segunda a sexta habilitados das 09:00 às 18:00', () => {
        const defaults = getDefaultBusinessHours()
        const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']

        for (const day of weekdays) {
            expect(defaults[day]).toEqual({
                enabled: true,
                start: '09:00',
                end: '18:00',
            })
        }
    })

    it('deve ter sábado habilitado das 09:00 às 12:00', () => {
        const defaults = getDefaultBusinessHours()

        expect(defaults.saturday).toEqual({
            enabled: true,
            start: '09:00',
            end: '12:00',
        })
    })

    it('deve retornar novo objeto a cada chamada (imutabilidade)', () => {
        const defaults1 = getDefaultBusinessHours()
        const defaults2 = getDefaultBusinessHours()

        expect(defaults1).not.toBe(defaults2)
        expect(defaults1).toEqual(defaults2)
    })
})

// ============================================
// validateBusinessHours()
// ============================================

describe('validateBusinessHours', () => {
    it('deve retornar padrão para null', () => {
        const result = validateBusinessHours(null)
        expect(result).toEqual(getDefaultBusinessHours())
    })

    it('deve retornar padrão para undefined', () => {
        const result = validateBusinessHours(undefined)
        expect(result).toEqual(getDefaultBusinessHours())
    })

    it('deve retornar padrão para string', () => {
        const result = validateBusinessHours('invalid')
        expect(result).toEqual(getDefaultBusinessHours())
    })

    it('deve retornar padrão para número', () => {
        const result = validateBusinessHours(123)
        expect(result).toEqual(getDefaultBusinessHours())
    })

    it('deve retornar padrão para array vazio', () => {
        const result = validateBusinessHours([])
        expect(result).toEqual(getDefaultBusinessHours())
    })

    it('deve validar configuração parcial e preencher com padrões', () => {
        const partial = {
            monday: { enabled: true, start: '08:00', end: '17:00' },
        }

        const result = validateBusinessHours(partial)

        // Monday personalizado
        expect(result.monday).toEqual({ enabled: true, start: '08:00', end: '17:00' })
        // Outros dias vêm do padrão
        expect(result.tuesday).toEqual(getDefaultBusinessHours().tuesday)
        expect(result.sunday).toEqual(getDefaultBusinessHours().sunday)
    })

    it('deve usar enabled: false quando enabled não é boolean', () => {
        const invalid = {
            monday: { enabled: 'yes' as unknown as boolean, start: '09:00', end: '18:00' },
        }

        const result = validateBusinessHours(invalid)
        expect(result.monday?.enabled).toBe(false)
    })

    it('deve usar enabled: false quando enabled é número', () => {
        const invalid = {
            monday: { enabled: 1 as unknown as boolean, start: '09:00', end: '18:00' },
        }

        const result = validateBusinessHours(invalid)
        expect(result.monday?.enabled).toBe(false)
    })

    it('deve usar start: "09:00" quando start não é string', () => {
        const invalid = {
            monday: { enabled: true, start: 9 as unknown as string, end: '18:00' },
        }

        const result = validateBusinessHours(invalid)
        expect(result.monday?.start).toBe('09:00')
    })

    it('deve usar start: "09:00" quando start é string vazia', () => {
        const invalid = {
            monday: { enabled: true, start: '', end: '18:00' },
        }

        const result = validateBusinessHours(invalid)
        expect(result.monday?.start).toBe('09:00')
    })

    it('deve usar end: "18:00" quando end não é string', () => {
        const invalid = {
            monday: { enabled: true, start: '09:00', end: null as unknown as string },
        }

        const result = validateBusinessHours(invalid)
        expect(result.monday?.end).toBe('18:00')
    })

    it('deve usar end: "18:00" quando end é string vazia', () => {
        const invalid = {
            monday: { enabled: true, start: '09:00', end: '' },
        }

        const result = validateBusinessHours(invalid)
        expect(result.monday?.end).toBe('18:00')
    })

    it('deve aceitar horários personalizados válidos', () => {
        const custom = {
            monday: { enabled: true, start: '06:00', end: '22:00' },
            tuesday: { enabled: false, start: '10:00', end: '16:00' },
            wednesday: { enabled: true, start: '00:00', end: '23:59' },
        }

        const result = validateBusinessHours(custom)

        expect(result.monday).toEqual({ enabled: true, start: '06:00', end: '22:00' })
        expect(result.tuesday).toEqual({ enabled: false, start: '10:00', end: '16:00' })
        expect(result.wednesday).toEqual({ enabled: true, start: '00:00', end: '23:59' })
    })
})

// ============================================
// isWithinBusinessHours()
// ============================================

describe('isWithinBusinessHours', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    // ----------------------------------------
    // Casos sem configuração (sempre aberto)
    // ----------------------------------------

    describe('sem configuração (sempre aberto)', () => {
        it('deve retornar isOpen: true para null', () => {
            const result = isWithinBusinessHours(null)

            expect(result.isOpen).toBe(true)
            expect(result.message).toBeUndefined()
        })

        it('deve retornar isOpen: true para undefined', () => {
            const result = isWithinBusinessHours(undefined)

            expect(result.isOpen).toBe(true)
            expect(result.message).toBeUndefined()
        })

        it('deve retornar isOpen: true quando businessHours é string', () => {
            const result = isWithinBusinessHours('invalid' as any)

            expect(result.isOpen).toBe(true)
        })

        it('deve retornar isOpen: true quando businessHours é número', () => {
            const result = isWithinBusinessHours(123 as any)

            expect(result.isOpen).toBe(true)
        })
    })

    // ----------------------------------------
    // Dentro do horário
    // ----------------------------------------

    describe('dentro do horário', () => {
        it('deve retornar isOpen: true no meio do expediente', () => {
            // Quarta-feira, 14:00 (dentro do horário 09:00-18:00)
            vi.setSystemTime(new Date('2024-01-10T17:00:00Z')) // 14:00 BRT

            const businessHours = {
                wednesday: { enabled: true, start: '09:00', end: '18:00' },
            }

            const result = isWithinBusinessHours(businessHours, 'America/Sao_Paulo')

            expect(result.isOpen).toBe(true)
            expect(result.message).toBeUndefined()
        })

        it('deve retornar isOpen: true exatamente no horário de abertura', () => {
            // Segunda-feira, 09:00 BRT
            vi.setSystemTime(new Date('2024-01-08T12:00:00Z'))

            const businessHours = {
                monday: { enabled: true, start: '09:00', end: '18:00' },
            }

            const result = isWithinBusinessHours(businessHours, 'America/Sao_Paulo')

            expect(result.isOpen).toBe(true)
        })

        it('deve retornar isOpen: true exatamente no horário de fechamento', () => {
            // Segunda-feira, 18:00 BRT
            vi.setSystemTime(new Date('2024-01-08T21:00:00Z'))

            const businessHours = {
                monday: { enabled: true, start: '09:00', end: '18:00' },
            }

            const result = isWithinBusinessHours(businessHours, 'America/Sao_Paulo')

            expect(result.isOpen).toBe(true)
        })
    })

    // ----------------------------------------
    // Fora do horário
    // ----------------------------------------

    describe('fora do horário', () => {
        it('deve retornar isOpen: false antes do expediente', () => {
            // Segunda-feira, 08:00 BRT (antes das 09:00)
            vi.setSystemTime(new Date('2024-01-08T11:00:00Z'))

            const businessHours = {
                monday: { enabled: true, start: '09:00', end: '18:00' },
            }

            const result = isWithinBusinessHours(businessHours, 'America/Sao_Paulo')

            expect(result.isOpen).toBe(false)
            expect(result.message).toBeDefined()
        })

        it('deve retornar isOpen: false após o expediente', () => {
            // Segunda-feira, 19:00 BRT (após 18:00)
            vi.setSystemTime(new Date('2024-01-08T22:00:00Z'))

            const businessHours = {
                monday: { enabled: true, start: '09:00', end: '18:00' },
            }

            const result = isWithinBusinessHours(businessHours, 'America/Sao_Paulo')

            expect(result.isOpen).toBe(false)
            expect(result.message).toBeDefined()
        })

        it('deve retornar isOpen: false em dia desabilitado', () => {
            // Domingo, 14:00 BRT
            vi.setSystemTime(new Date('2024-01-07T17:00:00Z'))

            const businessHours = {
                sunday: { enabled: false, start: '09:00', end: '18:00' },
                monday: { enabled: true, start: '09:00', end: '18:00' },
            }

            const result = isWithinBusinessHours(businessHours, 'America/Sao_Paulo')

            expect(result.isOpen).toBe(false)
            expect(result.message).toBeDefined()
        })

        it('deve retornar isOpen: false em dia não configurado', () => {
            // Terça-feira, 14:00 BRT (terça não definida)
            vi.setSystemTime(new Date('2024-01-09T17:00:00Z'))

            const businessHours = {
                monday: { enabled: true, start: '09:00', end: '18:00' },
                // tuesday não definido
            }

            const result = isWithinBusinessHours(businessHours, 'America/Sao_Paulo')

            expect(result.isOpen).toBe(false)
        })
    })

    // ----------------------------------------
    // Mensagens de fechado
    // ----------------------------------------

    describe('mensagens de fechado', () => {
        it('deve incluir horário na mensagem', () => {
            vi.setSystemTime(new Date('2024-01-08T11:00:00Z')) // Segunda, 08:00 BRT

            const businessHours = {
                monday: { enabled: true, start: '09:00', end: '18:00' },
            }

            const result = isWithinBusinessHours(businessHours, 'America/Sao_Paulo')

            expect(result.message).toContain('09:00')
            expect(result.message).toContain('18:00')
        })

        it('deve incluir emoji na mensagem', () => {
            vi.setSystemTime(new Date('2024-01-07T17:00:00Z')) // Domingo

            const businessHours = getDefaultBusinessHours()
            const result = isWithinBusinessHours(businessHours, 'America/Sao_Paulo')

            expect(result.message).toContain('😊')
        })

        it('deve retornar mensagem de fallback quando nenhum dia está configurado', () => {
            vi.setSystemTime(new Date('2024-01-08T17:00:00Z'))

            // Todos os dias desabilitados
            const businessHours = {
                monday: { enabled: false, start: '09:00', end: '18:00' },
                tuesday: { enabled: false, start: '09:00', end: '18:00' },
                wednesday: { enabled: false, start: '09:00', end: '18:00' },
                thursday: { enabled: false, start: '09:00', end: '18:00' },
                friday: { enabled: false, start: '09:00', end: '18:00' },
                saturday: { enabled: false, start: '09:00', end: '18:00' },
                sunday: { enabled: false, start: '09:00', end: '18:00' },
            }

            const result = isWithinBusinessHours(businessHours, 'America/Sao_Paulo')

            expect(result.isOpen).toBe(false)
            expect(result.message).toContain('fora do horário')
        })
    })

    // ----------------------------------------
    // Timezone
    // ----------------------------------------

    describe('timezone', () => {
        it('deve usar America/Sao_Paulo como padrão', () => {
            // 14:00 UTC = 11:00 BRT (America/Sao_Paulo)
            vi.setSystemTime(new Date('2024-01-08T14:00:00Z'))

            const businessHours = {
                monday: { enabled: true, start: '09:00', end: '18:00' },
            }

            const result = isWithinBusinessHours(businessHours)

            // 11:00 BRT está dentro de 09:00-18:00
            expect(result.isOpen).toBe(true)
        })

        it('deve funcionar com timezone America/New_York', () => {
            // 19:00 UTC = 14:00 EST (America/New_York)
            vi.setSystemTime(new Date('2024-01-08T19:00:00Z'))

            const businessHours = {
                monday: { enabled: true, start: '09:00', end: '18:00' },
            }

            const result = isWithinBusinessHours(businessHours, 'America/New_York')

            // 14:00 EST está dentro de 09:00-18:00
            expect(result.isOpen).toBe(true)
        })

        it('deve retornar isOpen: true para timezone inválido (fallback seguro)', () => {
            vi.setSystemTime(new Date('2024-01-08T14:00:00Z'))

            const businessHours = {
                monday: { enabled: true, start: '09:00', end: '18:00' },
            }

            // Timezone inválido causa erro, retorna isOpen: true como fallback
            const result = isWithinBusinessHours(businessHours, 'Invalid/Timezone')

            expect(result.isOpen).toBe(true)
        })
    })

    // ----------------------------------------
    // Casos de borda
    // ----------------------------------------

    describe('casos de borda', () => {
        it('deve funcionar à meia-noite', () => {
            vi.setSystemTime(new Date('2024-01-08T03:00:00Z')) // 00:00 BRT

            const businessHours = {
                monday: { enabled: true, start: '00:00', end: '23:59' },
            }

            const result = isWithinBusinessHours(businessHours, 'America/Sao_Paulo')

            expect(result.isOpen).toBe(true)
        })

        it('deve funcionar às 23:59', () => {
            vi.setSystemTime(new Date('2024-01-09T02:59:00Z')) // 23:59 BRT (segunda)

            const businessHours = {
                monday: { enabled: true, start: '00:00', end: '23:59' },
            }

            const result = isWithinBusinessHours(businessHours, 'America/Sao_Paulo')

            expect(result.isOpen).toBe(true)
        })
    })

    // ----------------------------------------
    // Cenários reais
    // ----------------------------------------

    describe('cenários reais', () => {
        it('clínica médica: seg-sex 08:00-18:00, sáb 08:00-12:00', () => {
            const clinica = {
                sunday: { enabled: false, start: '08:00', end: '18:00' },
                monday: { enabled: true, start: '08:00', end: '18:00' },
                tuesday: { enabled: true, start: '08:00', end: '18:00' },
                wednesday: { enabled: true, start: '08:00', end: '18:00' },
                thursday: { enabled: true, start: '08:00', end: '18:00' },
                friday: { enabled: true, start: '08:00', end: '18:00' },
                saturday: { enabled: true, start: '08:00', end: '12:00' },
            }

            // Segunda 10:00 - aberto
            vi.setSystemTime(new Date('2024-01-08T13:00:00Z'))
            expect(isWithinBusinessHours(clinica, 'America/Sao_Paulo').isOpen).toBe(true)

            // Sábado 11:00 - aberto
            vi.setSystemTime(new Date('2024-01-13T14:00:00Z'))
            expect(isWithinBusinessHours(clinica, 'America/Sao_Paulo').isOpen).toBe(true)

            // Sábado 14:00 - fechado
            vi.setSystemTime(new Date('2024-01-13T17:00:00Z'))
            expect(isWithinBusinessHours(clinica, 'America/Sao_Paulo').isOpen).toBe(false)

            // Domingo 10:00 - fechado
            vi.setSystemTime(new Date('2024-01-14T13:00:00Z'))
            expect(isWithinBusinessHours(clinica, 'America/Sao_Paulo').isOpen).toBe(false)
        })
    })
})

// ============================================
// Integração
// ============================================

describe('Integração: validateBusinessHours + isWithinBusinessHours', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('deve funcionar com configuração validada de dados inválidos', () => {
        vi.setSystemTime(new Date('2024-01-08T17:00:00Z')) // Segunda 14:00 BRT

        const invalidData = {
            monday: { enabled: 'true', start: null, end: undefined },
            tuesday: 'invalid',
        }

        const validated = validateBusinessHours(invalidData)
        const result = isWithinBusinessHours(validated, 'America/Sao_Paulo')

        // monday.enabled será false (não é boolean), então está fechado
        expect(result.isOpen).toBe(false)
    })

    it('deve funcionar com configuração padrão', () => {
        vi.setSystemTime(new Date('2024-01-08T17:00:00Z')) // Segunda 14:00 BRT

        const defaults = getDefaultBusinessHours()
        const result = isWithinBusinessHours(defaults, 'America/Sao_Paulo')

        expect(result.isOpen).toBe(true)
    })
})
