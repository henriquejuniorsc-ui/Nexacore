/**
 * NexaCore - Lead Scoring Service Tests
 * 
 * Testes unitários para o sistema de qualificação de leads
 * 
 * @see src/services/lead-scoring.ts
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
    scoreMessage,
    analyzeSentiment,
    getTemperature,
    getPurchaseIntent,
    suggestTags,
    analyzeConversation,
    updateScore,
    type ScoreResult,
    type LeadAnalysis,
} from '../lead-scoring'

// ============================================
// scoreMessage() - Análise de mensagem individual
// ============================================

describe('scoreMessage', () => {
    describe('Padrões de preço (pricing)', () => {
        it('deve detectar "quanto custa" e retornar 20 pontos', () => {
            const result = scoreMessage('Quanto custa esse procedimento?')

            expect(result).toHaveLength(1)
            expect(result[0]).toMatchObject({
                points: 20,
                category: 'pricing',
            })
        })

        it('deve detectar "qual o preço" com ç', () => {
            const result = scoreMessage('Qual o preço do botox?')

            expect(result[0].category).toBe('pricing')
            expect(result[0].points).toBe(20)
        })

        it('deve detectar "orçamento"', () => {
            const result = scoreMessage('Gostaria de um orçamento')

            expect(result[0].category).toBe('pricing')
        })

        it('deve detectar "formas de pagamento"', () => {
            const result = scoreMessage('Quais formas de pagamento vocês aceitam?')

            expect(result[0].category).toBe('pricing')
        })

        it('deve detectar "parcela" e variações', () => {
            const result = scoreMessage('Posso parcelar em quantas vezes?')

            expect(result[0].category).toBe('pricing')
        })

        it('deve detectar "promoção" com diferentes grafias', () => {
            const result1 = scoreMessage('Tem alguma promoção?')
            const result2 = scoreMessage('Tem alguma promocao?')

            expect(result1[0].category).toBe('pricing')
            expect(result2[0].category).toBe('pricing')
        })
    })

    describe('Padrões de agendamento (demo)', () => {
        it('deve detectar "agendar" e retornar 25 pontos', () => {
            const result = scoreMessage('Quero agendar uma avaliação')

            expect(result).toHaveLength(1)
            expect(result[0]).toMatchObject({
                points: 25,
                category: 'demo',
            })
        })

        it('deve detectar "marcar horário"', () => {
            const result = scoreMessage('Como faço para marcar horário?')

            expect(result[0].category).toBe('demo')
        })

        it('deve detectar "disponibilidade"', () => {
            const result = scoreMessage('Qual a disponibilidade para essa semana?')

            expect(result[0].category).toBe('demo')
        })

        it('deve detectar "interesse em"', () => {
            const result = scoreMessage('Tenho interesse em fazer uma limpeza de pele')

            expect(result[0].category).toBe('demo')
        })
    })

    describe('Padrões de urgência (urgency)', () => {
        it('deve detectar "urgente" e retornar 15 pontos', () => {
            const result = scoreMessage('É urgente, preciso para amanhã!')

            // Pode detectar múltiplos padrões (urgente e amanhã)
            const urgencyResult = result.find(r => r.category === 'urgency')
            expect(urgencyResult).toBeDefined()
            expect(urgencyResult?.points).toBe(15)
        })

        it('deve detectar "hoje"', () => {
            const result = scoreMessage('Conseguem atender hoje?')

            expect(result.some(r => r.category === 'urgency')).toBe(true)
        })

        it('deve detectar "o mais rápido possível"', () => {
            const result = scoreMessage('Preciso o mais rápido possível')

            expect(result[0].category).toBe('urgency')
        })
    })

    describe('Padrões de decisão (decision)', () => {
        it('deve detectar "vou fechar" e retornar 30 pontos', () => {
            const result = scoreMessage('Vou fechar com vocês')

            expect(result[0]).toMatchObject({
                points: 30,
                category: 'decision',
            })
        })

        it('deve detectar "quero contratar"', () => {
            const result = scoreMessage('Quero contratar o pacote completo')

            expect(result[0].category).toBe('decision')
        })

        it('deve detectar "pode confirmar"', () => {
            const result = scoreMessage('Pode confirmar o agendamento para sexta?')

            expect(result[0].category).toBe('decision')
        })

        it('deve detectar "fechado"', () => {
            const result = scoreMessage('Fechado! Vamos fazer')

            expect(result[0].category).toBe('decision')
        })
    })

    describe('Padrões negativos (negative)', () => {
        it('deve detectar "não tenho interesse" e retornar -15 pontos', () => {
            const result = scoreMessage('Não tenho interesse no momento')

            expect(result[0]).toMatchObject({
                points: -15,
                category: 'negative',
            })
        })

        it('deve detectar "muito caro"', () => {
            const result = scoreMessage('Achei muito caro')

            expect(result[0].category).toBe('negative')
            expect(result[0].points).toBe(-15)
        })

        it('deve detectar "vou pensar"', () => {
            const result = scoreMessage('Vou pensar e depois retorno')

            expect(result[0].category).toBe('negative')
        })

        it('deve detectar "cancelar"', () => {
            const result = scoreMessage('Preciso cancelar meu agendamento')

            expect(result[0].category).toBe('negative')
        })
    })

    describe('Padrões de pergunta (question)', () => {
        it('deve detectar "como funciona" e retornar 5 pontos', () => {
            const result = scoreMessage('Como funciona o procedimento?')

            expect(result[0]).toMatchObject({
                points: 5,
                category: 'question',
            })
        })

        it('deve detectar "qual a diferença"', () => {
            const result = scoreMessage('Qual a diferença entre os tratamentos?')

            expect(result[0].category).toBe('question')
        })

        it('deve detectar "dúvida"', () => {
            const result = scoreMessage('Tenho uma dúvida sobre o pós-procedimento')

            expect(result[0].category).toBe('question')
        })
    })

    describe('Engajamento básico', () => {
        it('deve retornar 1 ponto para mensagens genéricas', () => {
            const result = scoreMessage('Ok, entendi')

            expect(result).toHaveLength(1)
            expect(result[0]).toMatchObject({
                points: 1,
                category: 'engagement',
            })
        })

        it('deve retornar 1 ponto para saudações', () => {
            const result = scoreMessage('Olá, boa tarde!')

            expect(result[0].category).toBe('engagement')
        })
    })

    describe('Case insensitivity', () => {
        it('deve funcionar com maiúsculas', () => {
            const result = scoreMessage('QUANTO CUSTA?')

            expect(result[0].category).toBe('pricing')
        })

        it('deve funcionar com mixed case', () => {
            const result = scoreMessage('Quero AGENDAR agora!')

            expect(result[0].category).toBe('demo')
        })
    })
})

// ============================================
// analyzeSentiment() - Análise de sentimento
// ============================================

describe('analyzeSentiment', () => {
    it('deve retornar valor positivo para palavras positivas', () => {
        const sentiment = analyzeSentiment('Obrigado, excelente atendimento!')

        expect(sentiment).toBeGreaterThan(0)
        expect(sentiment).toBeLessThanOrEqual(1)
    })

    it('deve retornar valor negativo para palavras negativas', () => {
        const sentiment = analyzeSentiment('Péssimo atendimento, estou frustrado')

        expect(sentiment).toBeLessThan(0)
        expect(sentiment).toBeGreaterThanOrEqual(-1)
    })

    it('deve retornar valor próximo de 0 para mensagens neutras', () => {
        const sentiment = analyzeSentiment('Ok, entendi a informação')

        expect(sentiment).toBeGreaterThanOrEqual(-0.1)
        expect(sentiment).toBeLessThanOrEqual(0.1)
    })

    it('deve detectar emojis positivos', () => {
        const sentiment = analyzeSentiment('😊 👍 ❤️')

        expect(sentiment).toBeGreaterThan(0)
    })

    it('deve detectar emojis negativos', () => {
        const sentiment = analyzeSentiment('😡 👎')

        expect(sentiment).toBeLessThan(0)
    })

    it('deve normalizar valores entre -1 e 1', () => {
        const veryPositive = analyzeSentiment(
            'Excelente ótimo perfeito maravilhoso adorei amei incrível show top 😊😃👍❤️🎉'
        )
        const veryNegative = analyzeSentiment(
            'Ruim péssimo horrível terrível insatisfeito decepcionado frustrado irritado 😡👎😢'
        )

        expect(veryPositive).toBeLessThanOrEqual(1)
        expect(veryNegative).toBeGreaterThanOrEqual(-1)
    })
})

// ============================================
// getTemperature() - Classificação de temperatura
// ============================================

describe('getTemperature', () => {
    it('deve retornar HOT para score >= 70', () => {
        expect(getTemperature(70)).toBe('HOT')
        expect(getTemperature(85)).toBe('HOT')
        expect(getTemperature(100)).toBe('HOT')
    })

    it('deve retornar WARM para score entre 40 e 69', () => {
        expect(getTemperature(40)).toBe('WARM')
        expect(getTemperature(55)).toBe('WARM')
        expect(getTemperature(69)).toBe('WARM')
    })

    it('deve retornar COLD para score < 40', () => {
        expect(getTemperature(0)).toBe('COLD')
        expect(getTemperature(20)).toBe('COLD')
        expect(getTemperature(39)).toBe('COLD')
    })
})

// ============================================
// getPurchaseIntent() - Intenção de compra
// ============================================

describe('getPurchaseIntent', () => {
    it('deve retornar HIGH para score >= 80', () => {
        expect(getPurchaseIntent(80)).toBe('HIGH')
        expect(getPurchaseIntent(100)).toBe('HIGH')
    })

    it('deve retornar MEDIUM para score entre 50 e 79', () => {
        expect(getPurchaseIntent(50)).toBe('MEDIUM')
        expect(getPurchaseIntent(65)).toBe('MEDIUM')
        expect(getPurchaseIntent(79)).toBe('MEDIUM')
    })

    it('deve retornar LOW para score entre 20 e 49', () => {
        expect(getPurchaseIntent(20)).toBe('LOW')
        expect(getPurchaseIntent(35)).toBe('LOW')
        expect(getPurchaseIntent(49)).toBe('LOW')
    })

    it('deve retornar NONE para score < 20', () => {
        expect(getPurchaseIntent(0)).toBe('NONE')
        expect(getPurchaseIntent(10)).toBe('NONE')
        expect(getPurchaseIntent(19)).toBe('NONE')
    })
})

// ============================================
// suggestTags() - Sugestão de tags
// ============================================

describe('suggestTags', () => {
    it('deve sugerir tag de preço para categoria pricing', () => {
        const reasons: ScoreResult[] = [
            { points: 20, reason: 'Test', category: 'pricing' },
        ]

        const tags = suggestTags(reasons)

        expect(tags).toContain('💰 Interesse em preço')
    })

    it('deve sugerir tag de agendamento para categoria demo', () => {
        const reasons: ScoreResult[] = [
            { points: 25, reason: 'Test', category: 'demo' },
        ]

        const tags = suggestTags(reasons)

        expect(tags).toContain('📅 Quer agendar')
    })

    it('deve sugerir tag de urgência para categoria urgency', () => {
        const reasons: ScoreResult[] = [
            { points: 15, reason: 'Test', category: 'urgency' },
        ]

        const tags = suggestTags(reasons)

        expect(tags).toContain('⚡ Urgente')
    })

    it('deve sugerir tag de decisão para categoria decision', () => {
        const reasons: ScoreResult[] = [
            { points: 30, reason: 'Test', category: 'decision' },
        ]

        const tags = suggestTags(reasons)

        expect(tags).toContain('✅ Pronto para fechar')
    })

    it('deve sugerir tag de objeção para categoria negative', () => {
        const reasons: ScoreResult[] = [
            { points: -15, reason: 'Test', category: 'negative' },
        ]

        const tags = suggestTags(reasons)

        expect(tags).toContain('⚠️ Objeção')
    })

    it('deve remover tags duplicadas', () => {
        const reasons: ScoreResult[] = [
            { points: 20, reason: 'Test 1', category: 'pricing' },
            { points: 20, reason: 'Test 2', category: 'pricing' },
        ]

        const tags = suggestTags(reasons)

        expect(tags.filter(t => t === '💰 Interesse em preço')).toHaveLength(1)
    })

    it('deve retornar array vazio para engagement e question', () => {
        const reasons: ScoreResult[] = [
            { points: 1, reason: 'Test', category: 'engagement' },
            { points: 5, reason: 'Test', category: 'question' },
        ]

        const tags = suggestTags(reasons)

        expect(tags).toHaveLength(0)
    })
})

// ============================================
// analyzeConversation() - Análise completa
// ============================================

describe('analyzeConversation', () => {
    it('deve analisar conversa e retornar LeadAnalysis completo', () => {
        const messages = [
            'Olá, boa tarde!',
            'Quanto custa a limpeza de pele?',
            'Quero agendar para essa semana',
        ]

        const analysis = analyzeConversation(messages)

        expect(analysis).toMatchObject({
            score: expect.any(Number),
            temperature: expect.stringMatching(/^(COLD|WARM|HOT)$/),
            purchaseIntent: expect.stringMatching(/^(NONE|LOW|MEDIUM|HIGH)$/),
            sentiment: expect.any(Number),
            reasons: expect.any(Array),
            suggestedTags: expect.any(Array),
        })
    })

    it('deve classificar conversa de alto interesse como HOT', () => {
        const messages = [
            'Quanto custa o procedimento?', // +20
            'Quero agendar para amanhã', // +25
            'Vou fechar com vocês!', // +30
        ]

        const analysis = analyzeConversation(messages)

        expect(analysis.temperature).toBe('HOT')
        expect(analysis.purchaseIntent).toBe('HIGH')
    })

    it('deve classificar conversa com objeções como COLD', () => {
        const messages = [
            'Olá', // +1
            'Achei muito caro', // -15
            'Vou pensar', // -15
        ]

        const analysis = analyzeConversation(messages)

        expect(analysis.temperature).toBe('COLD')
    })

    it('deve adicionar bônus por engajamento (5+ mensagens)', () => {
        const messages = Array(5).fill('Olá, tenho interesse') // 5 mensagens

        const analysis = analyzeConversation(messages)

        // Base: 5 * 1 (engagement) + 5 (bônus) = 10
        // Mas "interesse" detecta demo (+25), então será maior
        expect(analysis.score).toBeGreaterThanOrEqual(10)
    })

    it('deve adicionar bônus maior por mais engajamento (10+ mensagens)', () => {
        const fewMessages = Array(5).fill('Ok')
        const manyMessages = Array(10).fill('Ok')

        const fewAnalysis = analyzeConversation(fewMessages)
        const manyAnalysis = analyzeConversation(manyMessages)

        // 10 mensagens devem ter score maior que 5
        expect(manyAnalysis.score).toBeGreaterThan(fewAnalysis.score)
    })

    it('deve normalizar score entre 0 e 100', () => {
        const veryNegative = Array(20).fill('Muito caro, não quero')
        const veryPositive = Array(20).fill('Vou fechar agora mesmo!')

        const negAnalysis = analyzeConversation(veryNegative)
        const posAnalysis = analyzeConversation(veryPositive)

        expect(negAnalysis.score).toBeGreaterThanOrEqual(0)
        expect(posAnalysis.score).toBeLessThanOrEqual(100)
    })

    it('deve calcular média de sentimento', () => {
        const positiveMessages = ['Excelente!', 'Adorei!', 'Perfeito!']
        const negativeMessages = ['Péssimo', 'Horrível', 'Terrível']

        const positiveAnalysis = analyzeConversation(positiveMessages)
        const negativeAnalysis = analyzeConversation(negativeMessages)

        expect(positiveAnalysis.sentiment).toBeGreaterThan(0)
        expect(negativeAnalysis.sentiment).toBeLessThan(0)
    })

    it('deve lidar com array vazio', () => {
        const analysis = analyzeConversation([])

        expect(analysis.score).toBe(0)
        expect(analysis.temperature).toBe('COLD')
        expect(analysis.sentiment).toBe(0)
    })
})

// ============================================
// updateScore() - Atualização incremental
// ============================================

describe('updateScore', () => {
    it('deve atualizar score com mensagem do cliente', () => {
        const result = updateScore(50, 'Quanto custa?', true)

        expect(result.newScore).toBe(70) // 50 + 20
        expect(result.reasons).toHaveLength(1)
        expect(result.reasons[0].category).toBe('pricing')
    })

    it('não deve atualizar score com mensagem do atendente', () => {
        const result = updateScore(50, 'Quanto custa?', false)

        expect(result.newScore).toBe(50) // Mantém o mesmo
        expect(result.reasons).toHaveLength(0)
    })

    it('deve respeitar limite máximo de 100', () => {
        const result = updateScore(95, 'Vou fechar!', true) // +30

        expect(result.newScore).toBe(100)
    })

    it('deve respeitar limite mínimo de 0', () => {
        const result = updateScore(5, 'Muito caro, não quero', true) // -15

        expect(result.newScore).toBe(0)
    })

    it('deve acumular pontos de múltiplas categorias', () => {
        // Mensagem com urgência: "Preciso agendar urgente para hoje"
        // demo (+25) + urgency (+15) = +40
        const result = updateScore(30, 'Preciso agendar urgente para hoje', true)

        expect(result.newScore).toBeGreaterThan(30)
        expect(result.reasons.length).toBeGreaterThanOrEqual(1)
    })
})

// ============================================
// Testes de integração (cenários reais)
// ============================================

describe('Cenários reais de conversa', () => {
    it('deve classificar corretamente um lead quente (pronto para comprar)', () => {
        const conversation = [
            'Olá, boa tarde!',
            'Vi o anúncio de vocês no Instagram',
            'Quanto custa o peeling?',
            'Tem disponibilidade para essa semana?',
            'Vou fechar! Pode agendar para sexta às 14h?',
        ]

        const analysis = analyzeConversation(conversation)

        expect(analysis.temperature).toBe('HOT')
        expect(analysis.purchaseIntent).toBe('HIGH')
        expect(analysis.suggestedTags).toContain('💰 Interesse em preço')
        expect(analysis.suggestedTags).toContain('📅 Quer agendar')
        expect(analysis.suggestedTags).toContain('✅ Pronto para fechar')
    })

    it('deve classificar corretamente um lead frio (apenas explorando)', () => {
        const conversation = [
            'Oi',
            'Como funciona?',
            'Ah, entendi',
            'Vou pensar',
        ]

        const analysis = analyzeConversation(conversation)

        expect(analysis.temperature).toBe('COLD')
        expect(analysis.purchaseIntent).toBe('NONE')
    })

    it('deve classificar corretamente um lead morno (interessado mas com objeções)', () => {
        const conversation = [
            'Boa tarde!',
            'Qual o preço do botox?',
            'Achei caro... tem desconto?',
            'Deixa eu pensar e depois retorno',
        ]

        const analysis = analyzeConversation(conversation)

        // Pode ser COLD ou WARM dependendo do score final
        expect(['COLD', 'WARM']).toContain(analysis.temperature)
        expect(analysis.suggestedTags).toContain('⚠️ Objeção')
    })
})
