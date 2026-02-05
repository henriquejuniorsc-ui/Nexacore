/**
 * NexaCore Audio Transcription Service v1.0
 * 
 * Transcreve áudios do WhatsApp usando OpenAI Whisper API.
 * 
 * Fluxo:
 * 1. Recebe audioMessage do webhook da Evolution API
 * 2. Baixa o áudio via Evolution API (base64 ou mediaUrl)
 * 3. Converte para formato compatível com Whisper
 * 4. Envia para OpenAI Whisper para transcrição
 * 5. Retorna o texto transcrito
 * 
 * Formatos suportados: ogg/opus (padrão WhatsApp), mp3, mp4, m4a, wav, webm
 */

import OpenAI from "openai";

// =============================================================================
// CONFIGURAÇÃO
// =============================================================================

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || "http://localhost:8080";
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || "";

const hasOpenAI = !!process.env.OPENAI_API_KEY;
const openai = hasOpenAI ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

function getInstanceName(tenantId: string): string {
    const cleanId = tenantId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 20);
    return `nexacore_${cleanId}`;
}

// =============================================================================
// TYPES
// =============================================================================

export interface AudioTranscriptionResult {
    success: boolean;
    text: string;
    duration?: number;
    language?: string;
    error?: string;
}

interface EvolutionMediaResponse {
    base64?: string;
    mediaUrl?: string;
    mimeType?: string;
}

// =============================================================================
// DOWNLOAD DO ÁUDIO
// =============================================================================

/**
 * Baixa o áudio de uma mensagem via Evolution API
 * 
 * A Evolution API oferece endpoint para download de mídia a partir do messageId.
 * Para áudio, ela retorna base64 ou uma URL temporária.
 */
async function downloadAudioFromEvolution(
    tenantId: string,
    messageId: string,
    remoteJid: string
): Promise<{ buffer: Buffer; mimeType: string } | null> {
    const instanceName = getInstanceName(tenantId);

    try {
        // Tenta o endpoint de media download da Evolution API v2
        const response = await fetch(
            `${EVOLUTION_API_URL}/chat/getBase64FromMediaMessage/${instanceName}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    apikey: EVOLUTION_API_KEY,
                },
                body: JSON.stringify({
                    message: {
                        key: {
                            remoteJid,
                            id: messageId,
                        },
                    },
                }),
            }
        );

        if (!response.ok) {
            console.error(`[AudioTranscription] Evolution API error: ${response.status}`);
            return null;
        }

        const data: EvolutionMediaResponse = await response.json();

        if (data.base64) {
            // Remove data URI prefix se existir
            const base64Clean = data.base64.replace(/^data:[^;]+;base64,/, "");
            const buffer = Buffer.from(base64Clean, "base64");
            const mimeType = data.mimeType || "audio/ogg";

            console.log(`[AudioTranscription] Downloaded audio: ${buffer.length} bytes, ${mimeType}`);
            return { buffer, mimeType };
        }

        if (data.mediaUrl) {
            // Download direto da URL
            const mediaResponse = await fetch(data.mediaUrl);
            if (!mediaResponse.ok) {
                console.error(`[AudioTranscription] Media URL download failed: ${mediaResponse.status}`);
                return null;
            }

            const arrayBuffer = await mediaResponse.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const mimeType = data.mimeType || mediaResponse.headers.get("content-type") || "audio/ogg";

            console.log(`[AudioTranscription] Downloaded from URL: ${buffer.length} bytes, ${mimeType}`);
            return { buffer, mimeType };
        }

        console.error("[AudioTranscription] No base64 or mediaUrl in response");
        return null;
    } catch (error) {
        console.error("[AudioTranscription] Download failed:", error);
        return null;
    }
}

/**
 * Alternativa: extrai áudio de base64 que pode vir diretamente no payload
 */
function extractAudioFromPayload(msg: any): { buffer: Buffer; mimeType: string } | null {
    try {
        const audioMessage = msg.message?.audioMessage;
        if (!audioMessage) return null;

        // Algumas configurações da Evolution API enviam base64 no payload
        const base64 = msg.message?.base64 || audioMessage.base64;
        if (base64) {
            const clean = base64.replace(/^data:[^;]+;base64,/, "");
            const buffer = Buffer.from(clean, "base64");
            const mimeType = audioMessage.mimetype || "audio/ogg";
            console.log(`[AudioTranscription] Extracted from payload: ${buffer.length} bytes`);
            return { buffer, mimeType };
        }

        return null;
    } catch (error) {
        console.error("[AudioTranscription] Payload extraction failed:", error);
        return null;
    }
}

// =============================================================================
// TRANSCRIÇÃO
// =============================================================================

/**
 * Mapeia MIME types do WhatsApp para extensões aceitas pelo Whisper
 */
function getFileExtension(mimeType: string): string {
    const map: Record<string, string> = {
        "audio/ogg": "ogg",
        "audio/ogg; codecs=opus": "ogg",
        "audio/opus": "ogg",
        "audio/mpeg": "mp3",
        "audio/mp3": "mp3",
        "audio/mp4": "mp4",
        "audio/m4a": "m4a",
        "audio/wav": "wav",
        "audio/x-wav": "wav",
        "audio/webm": "webm",
        "audio/amr": "mp3", // AMR needs conversion but let Whisper try
    };

    // Clean up mimetype (remove parameters like ;codecs=opus)
    const baseMime = mimeType.split(";")[0].trim().toLowerCase();
    return map[baseMime] || "ogg";
}

/**
 * Transcreve áudio usando OpenAI Whisper API
 */
async function transcribeWithWhisper(
    buffer: Buffer,
    mimeType: string
): Promise<AudioTranscriptionResult> {
    if (!openai) {
        return {
            success: false,
            text: "",
            error: "OpenAI não configurado (OPENAI_API_KEY ausente)",
        };
    }

    try {
        const extension = getFileExtension(mimeType);
        const fileName = `audio.${extension}`;

        // Cria um File object para a API do OpenAI
        const uint8 = new Uint8Array(buffer);
        const file = new File([uint8], fileName, { type: mimeType });

        console.log(`[AudioTranscription] Sending to Whisper: ${fileName} (${buffer.length} bytes)`);

        const transcription = await openai.audio.transcriptions.create({
            file,
            model: "whisper-1",
            language: "pt", // Prioriza português brasileiro
            response_format: "verbose_json",
        });

        const text = transcription.text?.trim() || "";
        const duration = transcription.duration || undefined;
        const language = transcription.language || "pt";

        if (!text) {
            console.log("[AudioTranscription] ⚠️ Whisper returned empty text");
            return {
                success: false,
                text: "",
                error: "Áudio vazio ou inaudível",
            };
        }

        console.log(`[AudioTranscription] ✅ Transcribed (${duration}s, ${language}): "${text.slice(0, 100)}..."`);

        return {
            success: true,
            text,
            duration,
            language,
        };
    } catch (error) {
        console.error("[AudioTranscription] Whisper API error:", error);
        return {
            success: false,
            text: "",
            error: `Erro na transcrição: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
}

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Transcreve uma mensagem de áudio do WhatsApp
 * 
 * Tenta múltiplas estratégias para obter o áudio:
 * 1. Extrair do payload (se base64 disponível)
 * 2. Baixar via Evolution API (endpoint de mídia)
 * 
 * @param tenantId - ID do tenant
 * @param msg - Payload completo da mensagem do webhook
 * @returns Resultado da transcrição com texto ou erro
 */
export async function transcribeWhatsAppAudio(
    tenantId: string,
    msg: any
): Promise<AudioTranscriptionResult> {
    if (!openai) {
        return {
            success: false,
            text: "",
            error: "OpenAI não configurado",
        };
    }

    const messageId = msg.key?.id;
    const remoteJid = msg.key?.remoteJid || "";
    const audioMessage = msg.message?.audioMessage;

    if (!audioMessage) {
        return {
            success: false,
            text: "",
            error: "Mensagem não contém áudio",
        };
    }

    const audioDuration = audioMessage.seconds || 0;
    const isVoiceNote = audioMessage.ptt === true; // ptt = push-to-talk (voice note)

    console.log(`[AudioTranscription] Processing ${isVoiceNote ? "voice note" : "audio"} (${audioDuration}s) from ${remoteJid}`);

    // Limitar duração para evitar custos altos
    if (audioDuration > 300) { // 5 minutos
        return {
            success: false,
            text: "",
            error: "Áudio muito longo (máx 5 minutos)",
        };
    }

    // Estratégia 1: Extrair do payload
    let audioData = extractAudioFromPayload(msg);

    // Estratégia 2: Baixar via Evolution API
    if (!audioData && messageId) {
        audioData = await downloadAudioFromEvolution(tenantId, messageId, remoteJid);
    }

    if (!audioData) {
        return {
            success: false,
            text: "",
            error: "Não foi possível obter o áudio",
        };
    }

    // Transcrever com Whisper
    return transcribeWithWhisper(audioData.buffer, audioData.mimeType);
}

/**
 * Verifica se uma mensagem contém áudio
 */
export function isAudioMessage(msg: any): boolean {
    return !!(msg.message?.audioMessage);
}

/**
 * Verifica se é um voice note (ptt) ou áudio comum
 */
export function isVoiceNote(msg: any): boolean {
    return msg.message?.audioMessage?.ptt === true;
}