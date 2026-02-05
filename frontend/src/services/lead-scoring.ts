/**
 * NexaCore - Lead Scoring Service
 * 
 * Sistema de qualificação automática de leads baseado em:
 * - Análise de palavras-chave (intenção de compra)
 * - Engajamento (quantidade de mensagens, tempo de resposta)
 * - Sentimento da conversa
 * - Urgência detectada
 * 
 * Classificação:
 * - HOT (70-100 pontos): Lead muito interessado, pronto para converter
 * - WARM (40-69 pontos): Lead com interesse moderado
 * - COLD (0-39 pontos): Lead frio, apenas explorando
 */

export interface ScoreResult {
  points: number;
  reason: string;
  category: 'pricing' | 'demo' | 'urgency' | 'decision' | 'negative' | 'engagement' | 'question';
}

export interface LeadAnalysis {
  score: number;
  temperature: 'COLD' | 'WARM' | 'HOT';
  purchaseIntent: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
  sentiment: number; // -1.0 a 1.0
  reasons: ScoreResult[];
  suggestedTags: string[];
}

// Padrões de alta intenção de compra
const PRICING_PATTERNS = [
  /quanto custa/i,
  /qual o pre[çc]o/i,
  /valor do/i,
  /pre[çc]o do/i,
  /tabela de pre[çc]os/i,
  /or[çc]amento/i,
  /investimento/i,
  /quanto fica/i,
  /qual o valor/i,
  /formas de pagamento/i,
  /parcela/i,
  /desconto/i,
  /promo[çc][aã]o/i,
];

const DEMO_PATTERNS = [
  /agendar/i,
  /marcar/i,
  /hor[aá]rio/i,
  /disponibilidade/i,
  /quando posso/i,
  /como fa[çc]o para/i,
  /quero fazer/i,
  /gostaria de fazer/i,
  /interesse em/i,
  /quero conhecer/i,
  /demonstra[çc][aã]o/i,
];

const URGENCY_PATTERNS = [
  /urgente/i,
  /hoje/i,
  /agora/i,
  /o mais r[aá]pido/i,
  /imediato/i,
  /ainda essa semana/i,
  /amanh[aã]/i,
  /preciso logo/i,
  /n[aã]o pode esperar/i,
];

const DECISION_PATTERNS = [
  /vou fechar/i,
  /quero contratar/i,
  /vamos fazer/i,
  /pode confirmar/i,
  /minha decis[aã]o/i,
  /j[aá] decidi/i,
  /fechado/i,
  /combinado/i,
  /pode agendar/i,
  /confirma para mim/i,
];

const NEGATIVE_PATTERNS = [
  /n[aã]o tenho interesse/i,
  /muito caro/i,
  /n[aã]o quero/i,
  /cancelar/i,
  /desistir/i,
  /outro momento/i,
  /vou pensar/i,
  /depois/i,
  /sem condi[çc][oõ]es/i,
  /n[aã]o posso/i,
];

const QUESTION_PATTERNS = [
  /como funciona/i,
  /o que [eé]/i,
  /qual a diferen[çc]a/i,
  /pode me explicar/i,
  /d[uú]vida/i,
  /informa[çc][oõ]es/i,
  /saber mais/i,
  /me fala sobre/i,
];

/**
 * Analisa uma mensagem individual e retorna pontuação
 */
export function scoreMessage(content: string): ScoreResult[] {
  const results: ScoreResult[] = [];
  const lower = content.toLowerCase();

  // Verifica padrões de preço (alta intenção)
  for (const pattern of PRICING_PATTERNS) {
    if (pattern.test(lower)) {
      results.push({ points: 20, reason: 'Perguntou sobre preço/valor', category: 'pricing' });
      break;
    }
  }

  // Verifica padrões de agendamento/demo
  for (const pattern of DEMO_PATTERNS) {
    if (pattern.test(lower)) {
      results.push({ points: 25, reason: 'Interesse em agendar/fazer procedimento', category: 'demo' });
      break;
    }
  }

  // Verifica urgência
  for (const pattern of URGENCY_PATTERNS) {
    if (pattern.test(lower)) {
      results.push({ points: 15, reason: 'Urgência detectada', category: 'urgency' });
      break;
    }
  }

  // Verifica decisão de compra
  for (const pattern of DECISION_PATTERNS) {
    if (pattern.test(lower)) {
      results.push({ points: 30, reason: 'Decisão de compra/fechamento', category: 'decision' });
      break;
    }
  }

  // Verifica padrões negativos
  for (const pattern of NEGATIVE_PATTERNS) {
    if (pattern.test(lower)) {
      results.push({ points: -15, reason: 'Objeção ou desinteresse', category: 'negative' });
      break;
    }
  }

  // Verifica perguntas (interesse moderado)
  for (const pattern of QUESTION_PATTERNS) {
    if (pattern.test(lower)) {
      results.push({ points: 5, reason: 'Pergunta sobre serviços', category: 'question' });
      break;
    }
  }

  // Engajamento básico (se não detectou nada específico)
  if (results.length === 0) {
    results.push({ points: 1, reason: 'Engajamento na conversa', category: 'engagement' });
  }

  return results;
}

/**
 * Analisa sentimento básico da mensagem
 * Retorna valor entre -1.0 (muito negativo) e 1.0 (muito positivo)
 */
export function analyzeSentiment(content: string): number {
  const lower = content.toLowerCase();
  let score = 0;

  // Palavras positivas
  const positiveWords = [
    'obrigado', 'obrigada', 'excelente', 'ótimo', 'perfeito', 'maravilhoso',
    'adorei', 'amei', 'incrível', 'show', 'top', 'bom', 'boa', 'gostei',
    'satisfeito', 'feliz', 'contente', '😊', '😃', '👍', '❤️', '🎉'
  ];

  // Palavras negativas
  const negativeWords = [
    'ruim', 'péssimo', 'horrível', 'terrível', 'insatisfeito', 'decepcionado',
    'frustrado', 'irritado', 'raiva', 'absurdo', 'vergonha', 'lamentável',
    'nunca mais', 'pior', '😡', '��', '👎', '😢'
  ];

  for (const word of positiveWords) {
    if (lower.includes(word)) score += 0.15;
  }

  for (const word of negativeWords) {
    if (lower.includes(word)) score -= 0.2;
  }

  // Normaliza entre -1 e 1
  return Math.max(-1, Math.min(1, score));
}

/**
 * Determina a temperatura do lead baseado no score
 */
export function getTemperature(score: number): 'COLD' | 'WARM' | 'HOT' {
  if (score >= 70) return 'HOT';
  if (score >= 40) return 'WARM';
  return 'COLD';
}

/**
 * Determina a intenção de compra baseado no score
 */
export function getPurchaseIntent(score: number): 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' {
  if (score >= 80) return 'HIGH';
  if (score >= 50) return 'MEDIUM';
  if (score >= 20) return 'LOW';
  return 'NONE';
}

/**
 * Sugere tags baseado na análise
 */
export function suggestTags(reasons: ScoreResult[]): string[] {
  const tags: string[] = [];

  for (const reason of reasons) {
    switch (reason.category) {
      case 'pricing':
        tags.push('💰 Interesse em preço');
        break;
      case 'demo':
        tags.push('📅 Quer agendar');
        break;
      case 'urgency':
        tags.push('⚡ Urgente');
        break;
      case 'decision':
        tags.push('✅ Pronto para fechar');
        break;
      case 'negative':
        tags.push('⚠️ Objeção');
        break;
    }
  }

  return Array.from(new Set(tags)); // Remove duplicatas
}

/**
 * Analisa uma conversa completa (array de mensagens do cliente)
 */
export function analyzeConversation(messages: string[]): LeadAnalysis {
  let totalScore = 0;
  let totalSentiment = 0;
  const allReasons: ScoreResult[] = [];

  for (const message of messages) {
    const messageScores = scoreMessage(message);
    const messageSentiment = analyzeSentiment(message);

    for (const score of messageScores) {
      totalScore += score.points;
      allReasons.push(score);
    }

    totalSentiment += messageSentiment;
  }

  // Média do sentimento
  const avgSentiment = messages.length > 0 ? totalSentiment / messages.length : 0;

  // Bônus por quantidade de mensagens (engajamento)
  if (messages.length >= 5) totalScore += 5;
  if (messages.length >= 10) totalScore += 10;
  if (messages.length >= 20) totalScore += 15;

  // Normaliza score entre 0 e 100
  const normalizedScore = Math.max(0, Math.min(100, totalScore));

  return {
    score: normalizedScore,
    temperature: getTemperature(normalizedScore),
    purchaseIntent: getPurchaseIntent(normalizedScore),
    sentiment: Number(avgSentiment.toFixed(2)),
    reasons: allReasons,
    suggestedTags: suggestTags(allReasons),
  };
}

/**
 * Atualiza score incremental com nova mensagem
 */
export function updateScore(
  currentScore: number,
  newMessage: string,
  isFromClient: boolean
): { newScore: number; reasons: ScoreResult[] } {
  // Apenas mensagens do cliente afetam o score
  if (!isFromClient) {
    return { newScore: currentScore, reasons: [] };
  }

  const messageScores = scoreMessage(newMessage);
  let deltaScore = 0;

  for (const score of messageScores) {
    deltaScore += score.points;
  }

  const newScore = Math.max(0, Math.min(100, currentScore + deltaScore));

  return { newScore, reasons: messageScores };
}
