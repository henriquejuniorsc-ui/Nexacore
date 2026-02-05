/**
 * NexaCore Message Splitter v1.0
 * 
 * Divide respostas da IA em múltiplas mensagens para parecer mais humano no WhatsApp.
 * 
 * Estratégia:
 * - Divide por parágrafos (quebra dupla de linha)
 * - Agrupa parágrafos curtos (< 200 chars) para não mandar mensagens muito pequenas
 * - Mantém blocos de confirmação juntos (ex: resumo do agendamento)
 * - Delay entre mensagens simula digitação (800-2500ms baseado no tamanho)
 * - Envia indicador de "digitando..." entre cada mensagem
 */

import { sendWhatsAppMessage, SendMessageResult } from "./evolution-service";

// =============================================================================
// CONFIGURAÇÕES
// =============================================================================

/** Tamanho mínimo de um chunk para ser enviado sozinho */
const MIN_CHUNK_SIZE = 40;

/** Tamanho máximo de um chunk antes de forçar split */
const MAX_CHUNK_SIZE = 600;

/** Delay base por caractere (ms) - simula velocidade de digitação */
const DELAY_PER_CHAR_MS = 8;

/** Delay mínimo entre mensagens (ms) */
const MIN_DELAY_MS = 800;

/** Delay máximo entre mensagens (ms) */
const MAX_DELAY_MS = 3000;

/** Número máximo de chunks para evitar spam */
const MAX_CHUNKS = 5;

// =============================================================================
// EVOLUTION API - TYPING INDICATOR
// =============================================================================

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || "http://localhost:8080";
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || "";

function getInstanceName(tenantId: string): string {
    const cleanId = tenantId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 20);
    return `nexacore_${cleanId}`;
}

/**
 * Envia indicador de "digitando..." via Evolution API
 */
async function sendTypingIndicator(tenantId: string, phone: string): Promise<void> {
    const instanceName = getInstanceName(tenantId);
    const number = phone.replace(/\D/g, "");

    try {
        await fetch(`${EVOLUTION_API_URL}/chat/sendPresence/${instanceName}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                apikey: EVOLUTION_API_KEY,
            },
            body: JSON.stringify({
                number,
                delay: 1200,
                presence: "composing",
            }),
        });
    } catch (error) {
        // Silently fail - typing indicator is not critical
        console.log(`[MessageSplitter] Typing indicator failed (non-critical): ${error}`);
    }
}

// =============================================================================
// SPLITTER LOGIC
// =============================================================================

/**
 * Padrões que indicam que o conteúdo deve ficar junto (não dividir)
 */
const KEEP_TOGETHER_PATTERNS = [
    // Bloco de confirmação de agendamento
    /📅[\s\S]*?\n[\s\S]*?⏰[\s\S]*?\n[\s\S]*?💆[\s\S]*?\n[\s\S]*?👩‍⚕️[\s\S]*?\n[\s\S]*?💰/,
    // Lista numerada curta
    /^[1-3]\..+\n[1-3]\..+/m,
    // Bloco com emojis de lista
    /^[•📌✅❌🔹].+\n[•📌✅❌🔹].+/m,
];

/**
 * Detecta se uma mensagem contém um bloco que deve ficar junto
 */
function containsKeepTogetherBlock(text: string): boolean {
    return KEEP_TOGETHER_PATTERNS.some(pattern => pattern.test(text));
}

/**
 * Divide texto em chunks inteligentes
 */
export function splitMessage(text: string): string[] {
    // Limpa whitespace extra
    const cleaned = text.trim();

    // Se a mensagem é curta o suficiente, não divide
    if (cleaned.length <= MAX_CHUNK_SIZE) {
        return [cleaned];
    }

    // Se contém bloco que deve ficar junto e é razoável em tamanho
    if (containsKeepTogetherBlock(cleaned) && cleaned.length <= MAX_CHUNK_SIZE * 1.5) {
        return [cleaned];
    }

    // Divide por parágrafos (dupla quebra de linha)
    const paragraphs = cleaned.split(/\n\n+/).map(p => p.trim()).filter(Boolean);

    // Se só tem 1 parágrafo grande, divide por sentenças/quebras simples
    if (paragraphs.length === 1) {
        return splitLongParagraph(paragraphs[0]);
    }

    // Agrupa parágrafos em chunks
    const chunks: string[] = [];
    let currentChunk = "";

    for (const paragraph of paragraphs) {
        // Se o parágrafo sozinho é maior que MAX_CHUNK_SIZE, divide ele
        if (paragraph.length > MAX_CHUNK_SIZE) {
            // Salva o chunk atual antes
            if (currentChunk.trim()) {
                chunks.push(currentChunk.trim());
                currentChunk = "";
            }
            // Divide o parágrafo grande
            chunks.push(...splitLongParagraph(paragraph));
            continue;
        }

        // Se adicionar este parágrafo excederia o limite
        if (currentChunk.length + paragraph.length + 2 > MAX_CHUNK_SIZE) {
            // Salva o chunk atual
            if (currentChunk.trim()) {
                chunks.push(currentChunk.trim());
            }
            currentChunk = paragraph;
        } else {
            // Agrupa no chunk atual
            currentChunk = currentChunk ? `${currentChunk}\n\n${paragraph}` : paragraph;
        }
    }

    // Não esquecer o último chunk
    if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
    }

    // Se ficou com muitos chunks, merge os menores
    return mergeSmallChunks(chunks);
}

/**
 * Divide um parágrafo longo em partes menores
 */
function splitLongParagraph(text: string): string[] {
    // Tenta dividir por quebra de linha simples primeiro
    const lines = text.split(/\n/).map(l => l.trim()).filter(Boolean);

    if (lines.length > 1) {
        const chunks: string[] = [];
        let current = "";

        for (const line of lines) {
            if (current.length + line.length + 1 > MAX_CHUNK_SIZE) {
                if (current.trim()) chunks.push(current.trim());
                current = line;
            } else {
                current = current ? `${current}\n${line}` : line;
            }
        }
        if (current.trim()) chunks.push(current.trim());
        return chunks;
    }

    // Se é um texto corrido, divide por pontuação
    const sentences = text.match(/[^.!?]+[.!?]+\s*/g) || [text];
    const chunks: string[] = [];
    let current = "";

    for (const sentence of sentences) {
        if (current.length + sentence.length > MAX_CHUNK_SIZE) {
            if (current.trim()) chunks.push(current.trim());
            current = sentence;
        } else {
            current += sentence;
        }
    }
    if (current.trim()) chunks.push(current.trim());

    return chunks;
}

/**
 * Merge chunks muito pequenos com o vizinho
 */
function mergeSmallChunks(chunks: string[]): string[] {
    if (chunks.length <= 1) return chunks;

    const result: string[] = [];
    let current = chunks[0];

    for (let i = 1; i < chunks.length; i++) {
        const next = chunks[i];

        // Se o chunk atual é muito pequeno E cabe junto com o próximo
        if (current.length < MIN_CHUNK_SIZE && current.length + next.length + 2 <= MAX_CHUNK_SIZE) {
            current = `${current}\n\n${next}`;
        }
        // Se o próximo é muito pequeno E cabe junto com o atual
        else if (next.length < MIN_CHUNK_SIZE && current.length + next.length + 2 <= MAX_CHUNK_SIZE) {
            current = `${current}\n\n${next}`;
        }
        else {
            result.push(current);
            current = next;
        }
    }
    result.push(current);

    // Limita ao máximo de chunks
    if (result.length > MAX_CHUNKS) {
        // Merge os últimos chunks juntos
        const limited = result.slice(0, MAX_CHUNKS - 1);
        limited.push(result.slice(MAX_CHUNKS - 1).join("\n\n"));
        return limited;
    }

    return result;
}

/**
 * Calcula delay entre mensagens baseado no tamanho do próximo chunk
 * Simula tempo de digitação humano
 */
function calculateDelay(chunkLength: number): number {
    const delay = chunkLength * DELAY_PER_CHAR_MS;
    return Math.min(Math.max(delay, MIN_DELAY_MS), MAX_DELAY_MS);
}

// =============================================================================
// PUBLIC API
// =============================================================================

export interface ChunkedSendResult {
    success: boolean;
    messageIds: string[];
    chunks: string[];
    errors: string[];
}

/**
 * Divide uma mensagem da IA em chunks e envia sequencialmente com delays
 * 
 * Retorna os chunks enviados para que possam ser salvos individualmente no banco
 */
export async function sendWhatsAppMessageChunked(
    tenantId: string,
    phone: string,
    fullMessage: string
): Promise<ChunkedSendResult> {
    const chunks = splitMessage(fullMessage);
    const messageIds: string[] = [];
    const errors: string[] = [];

    console.log(`[MessageSplitter] Sending ${chunks.length} chunk(s) to ${phone}`);

    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];

        // Envia typing indicator antes de cada mensagem (exceto a primeira)
        if (i > 0) {
            await sendTypingIndicator(tenantId, phone);

            // Delay baseado no tamanho do chunk
            const delay = calculateDelay(chunk.length);
            console.log(`[MessageSplitter] Waiting ${delay}ms before chunk ${i + 1}/${chunks.length}`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }

        // Envia o chunk
        const result: SendMessageResult = await sendWhatsAppMessage(tenantId, phone, chunk);

        if (result.success && result.messageId) {
            messageIds.push(result.messageId);
        } else {
            errors.push(result.error || `Failed to send chunk ${i + 1}`);
            console.error(`[MessageSplitter] ❌ Chunk ${i + 1} failed: ${result.error}`);

            // Se a primeira mensagem falhar, para tudo
            if (i === 0) {
                return { success: false, messageIds, chunks, errors };
            }
            // Para chunks subsequentes, continua tentando
        }
    }

    const success = messageIds.length > 0;
    console.log(`[MessageSplitter] ${success ? "✅" : "❌"} Sent ${messageIds.length}/${chunks.length} chunks`);

    return { success, messageIds, chunks, errors };
}