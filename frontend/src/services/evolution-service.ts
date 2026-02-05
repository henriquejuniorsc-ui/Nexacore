/**
 * NexaCore - Evolution API Service v4.0 (v2.3.7 Compatible) (Production Ready)
 * 
 * Integração profissional com Evolution API v2.3.7 para WhatsApp
 * 
 * Features:
 * - Configuração automática de webhooks via Coolify proxy
 * - Retry logic com exponential backoff
 * - Multi-tenant support completo
 * - Logs estruturados para debugging
 * - Tratamento robusto de erros
 * - Suporte a mídia (imagens, documentos, áudio, vídeo)
 * - Verificação de números WhatsApp
 * - Perfil de contatos
 * - Normalização robusta de telefones brasileiros (8, 9, 10, 11, 12, 13 dígitos)
 */

// =============================================================================
// CONFIGURAÇÕES
// =============================================================================

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || "http://localhost:8080";
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || "";
const NEXACORE_WEBHOOK_URL = process.env.NEXACORE_WEBHOOK_URL || "";
const NEXACORE_DOMAIN = process.env.NEXACORE_DOMAIN || extractDomain(NEXACORE_WEBHOOK_URL);

// IP do proxy reverso do Coolify (Traefik) - estável na rede interna
const COOLIFY_PROXY_IP = process.env.COOLIFY_PROXY_IP || "10.0.1.11";

// =============================================================================
// TIPOS
// =============================================================================

export interface WhatsAppConnection {
  connected: boolean;
  status: "connected" | "qrcode" | "connecting" | "disconnected" | "error";
  qrCode?: string;
  phone?: string;
  instanceName?: string;
  message: string;
}

export interface SendMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
  errorCode?: string;
  requiresReconnect?: boolean;
}

interface EvolutionResponse {
  status?: number;
  error?: string;
  message?: string | string[];
  response?: { message?: string | string[][] };
  instance?: { instanceName?: string; state?: string; owner?: string };
  qrcode?: { base64?: string };
  base64?: string;
  hash?: string;
  key?: { id?: string };
  webhook?: { enabled?: boolean; url?: string };
  url?: string;
  enabled?: boolean;
  headers?: Record<string, string>;
  name?: string;
  pushName?: string;
  picture?: string;
  exists?: boolean;
  jid?: string;
  id?: string;
}

interface WebhookConfig {
  enabled: boolean;
  url: string;
  headers?: Record<string, string>;
  webhookByEvents: boolean;
  webhookBase64: boolean;
  events: string[];
}

// =============================================================================
// UTILITÁRIOS
// =============================================================================

/**
 * Extrai domínio de uma URL
 */
function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.host;
  } catch {
    return "";
  }
}

/**
 * Logger estruturado para produção
 */
const log = {
  info: (msg: string, data?: unknown) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [Evolution] INFO: ${msg}`, data ? JSON.stringify(data) : "");
  },
  error: (msg: string, error?: unknown) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [Evolution] ERROR: ${msg}`, error);
  },
  warn: (msg: string, data?: unknown) => {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] [Evolution] WARN: ${msg}`, data ? JSON.stringify(data) : "");
  },
  debug: (msg: string, data?: unknown) => {
    if (process.env.NODE_ENV === "development") {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [Evolution] DEBUG: ${msg}`, data ? JSON.stringify(data) : "");
    }
  },
};

// =============================================================================
// NORMALIZAÇÃO DE TELEFONE (ROBUSTA)
// =============================================================================

/**
 * DDDs válidos do Brasil
 * Usado para validação e detecção de formato
 */
const VALID_BRAZILIAN_DDDS = [
  // São Paulo
  "11", "12", "13", "14", "15", "16", "17", "18", "19",
  // Rio de Janeiro / Espírito Santo
  "21", "22", "24", "27", "28",
  // Minas Gerais
  "31", "32", "33", "34", "35", "37", "38",
  // Paraná / Santa Catarina
  "41", "42", "43", "44", "45", "46", "47", "48", "49",
  // Rio Grande do Sul
  "51", "53", "54", "55",
  // Centro-Oeste
  "61", "62", "63", "64", "65", "66", "67", "68", "69",
  // Nordeste
  "71", "73", "74", "75", "77", "79",
  "81", "82", "83", "84", "85", "86", "87", "88", "89",
  // Norte
  "91", "92", "93", "94", "95", "96", "97", "98", "99",
];

/**
 * Verifica se um DDD é válido no Brasil
 */
function isValidBrazilianDDD(ddd: string): boolean {
  return VALID_BRAZILIAN_DDDS.includes(ddd);
}

/**
 * Normaliza número de telefone brasileiro para formato WhatsApp
 * 
 * Aceita QUALQUER formato:
 * - +55 (42) 99999-0000
 * - 55 42 99999-0000
 * - 42999990000
 * - 999990000
 * - 5542999990000
 * - etc.
 * 
 * Retorna: 5542999990000 (código país + DDD + número)
 * 
 * Regras de telefonia brasileira:
 * - Celulares: 9 dígitos, começam com 9 (ex: 999990000)
 * - Fixos: 8 dígitos, começam com 2-5 (ex: 33334444)
 * - DDD: 2 dígitos (11-99, mas nem todos são válidos)
 * - Código do país: 55
 */
export function normalizePhoneNumber(phone: string): string {
  // Remove tudo que não é dígito
  let digits = phone.replace(/\D/g, "");

  // Log para debug
  log.debug(`Normalizing phone: "${phone}" -> digits: "${digits}" (${digits.length} chars)`);

  // Se vazio, retorna vazio
  if (!digits) {
    log.warn(`Empty phone number after cleanup: "${phone}"`);
    return "";
  }

  // Remove zeros à esquerda (alguns sistemas adicionam 0 antes do DDD)
  while (digits.startsWith("0") && digits.length > 11) {
    digits = digits.slice(1);
  }

  // Se começa com 0 e tem 11 dígitos, pode ser 0 + DDD + 8 dígitos (fixo antigo)
  // ou pode ser DDD + 9 dígitos (celular). Vamos assumir o segundo caso.
  if (digits.startsWith("0") && digits.length === 11) {
    digits = digits.slice(1); // Remove o 0, fica com 10 dígitos
  }

  // Análise por tamanho
  let normalized: string;

  switch (digits.length) {
    case 8:
      // Apenas número fixo (sem DDD) - INVÁLIDO para WhatsApp
      log.warn(`Phone too short (8 digits, no DDD): ${digits}`);
      normalized = digits; // Retorna como está, vai falhar
      break;

    case 9:
      // Apenas número celular (sem DDD) - INVÁLIDO para WhatsApp
      log.warn(`Phone too short (9 digits, no DDD): ${digits}`);
      normalized = digits; // Retorna como está, vai falhar
      break;

    case 10:
      // DDD (2) + fixo (8) - Adiciona código do país
      // Ex: 4233334444 -> 554233334444
      normalized = "55" + digits;
      break;

    case 11:
      // DDD (2) + celular (9) - Adiciona código do país
      // Ex: 42999990000 -> 5542999990000
      normalized = "55" + digits;
      break;

    case 12:
      // Pode ser:
      // a) 55 + DDD + fixo (8) = correto
      // b) Algo errado
      if (digits.startsWith("55")) {
        // Verifica se o DDD é válido
        const possibleDDD = digits.slice(2, 4);
        if (isValidBrazilianDDD(possibleDDD)) {
          normalized = digits; // Já está correto
        } else {
          // DDD inválido, tenta corrigir pegando últimos 11 e adicionando 55
          log.warn(`Invalid DDD in 12-digit number: ${possibleDDD}`);
          normalized = "55" + digits.slice(-11);
        }
      } else {
        // Não começa com 55, pode ser erro - tenta pegar os últimos 10 e adicionar 55
        // (assume que são DDD + fixo com algo extra no início)
        normalized = "55" + digits.slice(-10);
      }
      break;

    case 13:
      // Formato esperado: 55 + DDD (2) + celular (9)
      // Ex: 5542999990000
      if (digits.startsWith("55")) {
        const possibleDDD = digits.slice(2, 4);
        if (isValidBrazilianDDD(possibleDDD)) {
          normalized = digits; // Perfeito!
        } else {
          log.warn(`Invalid DDD in 13-digit number: ${possibleDDD}`);
          normalized = "55" + digits.slice(-11);
        }
      } else {
        // Não começa com 55 - pega últimos 11 e adiciona 55
        normalized = "55" + digits.slice(-11);
      }
      break;

    case 14:
      // Muito longo - pode ter código de país duplicado ou lixo
      // Ex: 555542999990000 (55 duplicado)
      if (digits.startsWith("5555")) {
        // Remove um 55
        normalized = digits.slice(2);
      } else if (digits.startsWith("55")) {
        // Pega os últimos 13 (55 + DDD + celular)
        normalized = digits.slice(-13);
      } else {
        // Pega os últimos 11 e adiciona 55
        normalized = "55" + digits.slice(-11);
      }
      break;

    default:
      if (digits.length > 14) {
        // Muito longo - tenta extrair os últimos 11 dígitos válidos
        log.warn(`Phone too long (${digits.length} digits): ${digits}`);
        const last11 = digits.slice(-11);
        // Verifica se os 2 primeiros são um DDD válido
        if (isValidBrazilianDDD(last11.slice(0, 2))) {
          normalized = "55" + last11;
        } else {
          // Tenta com os últimos 13 (pode já ter 55)
          const last13 = digits.slice(-13);
          if (last13.startsWith("55") && isValidBrazilianDDD(last13.slice(2, 4))) {
            normalized = last13;
          } else {
            normalized = "55" + last11; // Melhor tentativa
          }
        }
      } else {
        // Menos de 8 dígitos - inválido
        log.warn(`Phone too short (${digits.length} digits): ${digits}`);
        normalized = digits;
      }
  }

  log.debug(`Phone normalized: "${phone}" -> "${normalized}"`);
  return normalized;
}

/**
 * Extrai número de telefone para busca no banco de dados
 * 
 * Retorna os dígitos mais significativos para matching:
 * - 11 dígitos para celulares (DDD + 9 dígitos)
 * - 10 dígitos para fixos (DDD + 8 dígitos)
 * 
 * Isso permite buscar independente de como o número foi salvo
 */
export function extractPhoneForSearch(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  // Se tem 13+ dígitos (55 + DDD + celular), retorna últimos 11
  if (digits.length >= 13) {
    return digits.slice(-11);
  }

  // Se tem 12 dígitos (55 + DDD + fixo), retorna últimos 10
  if (digits.length === 12) {
    return digits.slice(-10);
  }

  // Se tem 11 ou 10 dígitos, retorna como está
  if (digits.length >= 10) {
    return digits;
  }

  // Número curto - retorna o que tiver
  return digits;
}

/**
 * Gera variações de um número de telefone para busca fuzzy
 * Útil quando não sabemos exatamente como o número foi salvo
 */
export function generatePhoneSearchVariations(phone: string): string[] {
  const digits = phone.replace(/\D/g, "");
  const variations: Set<string> = new Set();

  // Adiciona o número original (só dígitos)
  variations.add(digits);

  // Se tem 13 dígitos (5542999990000)
  if (digits.length === 13 && digits.startsWith("55")) {
    variations.add(digits.slice(2)); // 42999990000 (11 dígitos)
    variations.add(digits.slice(-9)); // 999990000 (só número)
    variations.add(digits.slice(-11)); // 42999990000
  }

  // Se tem 12 dígitos (554233334444)
  if (digits.length === 12 && digits.startsWith("55")) {
    variations.add(digits.slice(2)); // 4233334444 (10 dígitos)
    variations.add(digits.slice(-8)); // 33334444 (só número)
    variations.add(digits.slice(-10)); // 4233334444
  }

  // Se tem 11 dígitos (42999990000)
  if (digits.length === 11) {
    variations.add("55" + digits); // 5542999990000
    variations.add(digits.slice(-9)); // 999990000
    variations.add(digits.slice(2)); // 999990000
  }

  // Se tem 10 dígitos (4233334444)
  if (digits.length === 10) {
    variations.add("55" + digits); // 554233334444
    variations.add(digits.slice(-8)); // 33334444
    variations.add(digits.slice(2)); // 33334444
  }

  return Array.from(variations);
}

/**
 * Formata número de telefone para exibição
 * Ex: 5542999990000 -> +55 (42) 99999-0000
 */
export function formatPhoneForDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  // Formato completo: 5542999990000 (13 dígitos - celular)
  if (digits.length === 13 && digits.startsWith("55")) {
    const ddd = digits.slice(2, 4);
    const part1 = digits.slice(4, 9);
    const part2 = digits.slice(9);
    return `+55 (${ddd}) ${part1}-${part2}`;
  }

  // Formato completo: 554233334444 (12 dígitos - fixo)
  if (digits.length === 12 && digits.startsWith("55")) {
    const ddd = digits.slice(2, 4);
    const part1 = digits.slice(4, 8);
    const part2 = digits.slice(8);
    return `+55 (${ddd}) ${part1}-${part2}`;
  }

  // Formato sem país: 42999990000 (11 dígitos - celular)
  if (digits.length === 11) {
    const ddd = digits.slice(0, 2);
    const part1 = digits.slice(2, 7);
    const part2 = digits.slice(7);
    return `(${ddd}) ${part1}-${part2}`;
  }

  // Formato sem país: 4233334444 (10 dígitos - fixo)
  if (digits.length === 10) {
    const ddd = digits.slice(0, 2);
    const part1 = digits.slice(2, 6);
    const part2 = digits.slice(6);
    return `(${ddd}) ${part1}-${part2}`;
  }

  // Fallback: retorna como está
  return phone;
}

/**
 * Valida se um número de telefone brasileiro é válido
 */
export function isValidBrazilianPhone(phone: string): { valid: boolean; reason?: string } {
  const digits = phone.replace(/\D/g, "");

  if (digits.length < 10) {
    return { valid: false, reason: "Número muito curto (mínimo 10 dígitos com DDD)" };
  }

  if (digits.length > 13) {
    return { valid: false, reason: "Número muito longo (máximo 13 dígitos)" };
  }

  // Extrai DDD
  let ddd: string;
  if (digits.startsWith("55") && digits.length >= 12) {
    ddd = digits.slice(2, 4);
  } else if (digits.length >= 10) {
    ddd = digits.slice(0, 2);
  } else {
    return { valid: false, reason: "Não foi possível identificar o DDD" };
  }

  if (!isValidBrazilianDDD(ddd)) {
    return { valid: false, reason: `DDD inválido: ${ddd}` };
  }

  // Extrai número local
  let localNumber: string;
  if (digits.startsWith("55")) {
    localNumber = digits.slice(4);
  } else {
    localNumber = digits.slice(2);
  }

  // Celular deve ter 9 dígitos e começar com 9
  if (localNumber.length === 9) {
    if (!localNumber.startsWith("9")) {
      return { valid: false, reason: "Celular deve começar com 9" };
    }
    return { valid: true };
  }

  // Fixo deve ter 8 dígitos e começar com 2-5
  if (localNumber.length === 8) {
    const firstDigit = parseInt(localNumber[0]);
    if (firstDigit < 2 || firstDigit > 5) {
      return { valid: false, reason: "Telefone fixo deve começar com 2, 3, 4 ou 5" };
    }
    return { valid: true };
  }

  return { valid: false, reason: "Número local deve ter 8 (fixo) ou 9 (celular) dígitos" };
}

/**
 * Gera nome da instância baseado no tenantId
 */
function getInstanceName(tenantId: string): string {
  const cleanId = tenantId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 20);
  return `nexacore_${cleanId}`;
}

// =============================================================================
// API CLIENT
// =============================================================================

/**
 * Fetch com retry e exponential backoff
 */
async function evolutionFetch(
  endpoint: string,
  options: RequestInit = {},
  retries: number = 3,
  timeoutMs: number = 30000
): Promise<EvolutionResponse> {
  const url = `${EVOLUTION_API_URL}${endpoint}`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      log.debug(`${options.method || "GET"} ${endpoint} (attempt ${attempt}/${retries})`);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          apikey: EVOLUTION_API_KEY,
          ...options.headers,
        },
      });

      clearTimeout(timeout);
      const text = await response.text();

      // Log response (truncado para produção)
      if (process.env.NODE_ENV === "development") {
        log.debug(`Response (${response.status}):`, text.slice(0, 500));
      } else {
        log.debug(`Response: ${response.status}`);
      }

      try {
        const json = JSON.parse(text);
        if (!response.ok) {
          json.status = response.status;
        }
        return json;
      } catch {
        return { status: response.status, message: text };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      if (errorMessage.includes("aborted")) {
        log.warn(`Request timeout on attempt ${attempt}/${retries}`);
      } else {
        log.error(`Attempt ${attempt}/${retries} failed: ${errorMessage}`);
      }

      if (attempt === retries) {
        throw error;
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, attempt - 1) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error("Max retries exceeded");
}

// =============================================================================
// WEBHOOK CONFIGURATION
// =============================================================================

/**
 * Configura webhook para receber mensagens do WhatsApp
 * 
 * Prioridade:
 * 1. NEXACORE_WEBHOOK_URL (URL pública - sempre funciona)
 * 2. COOLIFY_PROXY_IP + NEXACORE_DOMAIN (fallback para rede interna)
 */
async function configureWebhook(instanceName: string, tenantId: string): Promise<boolean> {
  let webhookUrl: string;
  let webhookHeaders: Record<string, string> | undefined;

  // PRIORIZAR URL PÚBLICA - mais confiável
  if (NEXACORE_WEBHOOK_URL) {
    webhookUrl = `${NEXACORE_WEBHOOK_URL}/api/webhooks/evolution/${tenantId}`;
    log.info(`Configuring webhook via public URL: ${webhookUrl}`);
  } else if (COOLIFY_PROXY_IP && NEXACORE_DOMAIN) {
    // Fallback para proxy interno do Coolify (apenas se não tiver URL pública)
    webhookUrl = `http://${COOLIFY_PROXY_IP}/api/webhooks/evolution/${tenantId}`;
    webhookHeaders = { Host: NEXACORE_DOMAIN };
    log.info(`Configuring webhook via Coolify proxy: ${webhookUrl} (Host: ${NEXACORE_DOMAIN})`);
  } else {
    log.warn("No webhook URL configured. Set NEXACORE_WEBHOOK_URL or COOLIFY_PROXY_IP + NEXACORE_DOMAIN");
    return false;
  }

  try {
    const webhookConfig: { webhook: WebhookConfig } = {
      webhook: {
        enabled: true,
        url: webhookUrl,
        webhookByEvents: false,
        webhookBase64: false,
        events: [
          "QRCODE_UPDATED",
          "MESSAGES_UPSERT",
          "MESSAGES_UPDATE",
          "CONNECTION_UPDATE",
          "SEND_MESSAGE",
        ],
      },
    };

    if (webhookHeaders) {
      webhookConfig.webhook.headers = webhookHeaders;
    }

    const result = await evolutionFetch(`/webhook/set/${instanceName}`, {
      method: "POST",
      body: JSON.stringify(webhookConfig),
    });

    if (result?.id || result?.enabled || result?.url) {
      log.info("Webhook configured successfully", {
        id: result.id,
        url: result.url,
        headers: result.headers,
      });
      return true;
    }

    log.warn("Webhook configuration response unexpected:", result);
    return false;
  } catch (error) {
    log.error("Failed to configure webhook", error);
    return false;
  }
}

/**
 * Verifica configuração atual do webhook
 */
async function getWebhookConfig(instanceName: string): Promise<EvolutionResponse | null> {
  try {
    const result = await evolutionFetch(`/webhook/find/${instanceName}`, {}, 1);
    return result;
  } catch {
    return null;
  }
}

// =============================================================================
// INSTANCE MANAGEMENT
// =============================================================================

/**
 * Configura settings da instância para comportamento ideal
 */
async function configureSettings(instanceName: string): Promise<boolean> {
  try {
    await evolutionFetch(`/settings/set/${instanceName}`, {
      method: "POST",
      body: JSON.stringify({
        rejectCall: false,
        groupsIgnore: false,
        alwaysOnline: true,
        readMessages: false,
        readStatus: false,
        syncFullHistory: false,
      }),
    });
    log.info("Instance settings configured successfully");
    return true;
  } catch (error) {
    log.error("Failed to configure settings", error);
    return false;
  }
}

/**
 * Cria nova instância com todas as configurações
 */
async function createInstance(tenantId: string): Promise<EvolutionResponse> {
  const instanceName = getInstanceName(tenantId);
  log.info(`Creating new Evolution API instance: ${instanceName}`);

  const createResult = await evolutionFetch("/instance/create", {
    method: "POST",
    body: JSON.stringify({
      instanceName,
      qrcode: true,
      integration: "WHATSAPP-BAILEYS",
    }),
  });

  await new Promise((resolve) => setTimeout(resolve, 2000));

  await Promise.all([
    configureWebhook(instanceName, tenantId),
    configureSettings(instanceName),
  ]);

  return createResult;
}

// =============================================================================
// PUBLIC API - CONNECTION
// =============================================================================

/**
 * Conecta WhatsApp - Cria instância se não existir e retorna QR Code
 */
export async function connectWhatsApp(tenantId: string): Promise<WhatsAppConnection> {
  const instanceName = getInstanceName(tenantId);

  try {
    log.info(`Connecting WhatsApp for tenant: ${tenantId} (instance: ${instanceName})`);

    const stateResult = await evolutionFetch(`/instance/connectionState/${instanceName}`);

    if (stateResult?.instance?.state === "open") {
      await configureWebhook(instanceName, tenantId);

      return {
        connected: true,
        status: "connected",
        phone: stateResult.instance.owner,
        instanceName,
        message: "WhatsApp conectado!",
      };
    }

    if (stateResult?.instance?.state === "close") {
      log.info("Instance closed, recreating...");

      await evolutionFetch(`/instance/delete/${instanceName}`, { method: "DELETE" });
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const createResult = await createInstance(tenantId);

      if (createResult?.qrcode?.base64) {
        return {
          connected: false,
          status: "qrcode",
          qrCode: createResult.qrcode.base64,
          instanceName,
          message: "Escaneie o QR Code com seu WhatsApp",
        };
      }

      await new Promise((resolve) => setTimeout(resolve, 1500));
      const qrResult = await evolutionFetch(`/instance/connect/${instanceName}`);

      if (qrResult?.base64) {
        return {
          connected: false,
          status: "qrcode",
          qrCode: qrResult.base64,
          instanceName,
          message: "Escaneie o QR Code com seu WhatsApp",
        };
      }
    }

    if (stateResult?.status === 404 || !stateResult?.instance) {
      log.info("Instance not found, creating new...");

      const createResult = await createInstance(tenantId);

      if (createResult?.qrcode?.base64) {
        return {
          connected: false,
          status: "qrcode",
          qrCode: createResult.qrcode.base64,
          instanceName,
          message: "Escaneie o QR Code com seu WhatsApp",
        };
      }

      await new Promise((resolve) => setTimeout(resolve, 1500));
      const qrResult = await evolutionFetch(`/instance/connect/${instanceName}`);

      if (qrResult?.base64) {
        return {
          connected: false,
          status: "qrcode",
          qrCode: qrResult.base64,
          instanceName,
          message: "Escaneie o QR Code com seu WhatsApp",
        };
      }
    }

    log.info("Instance in intermediate state, fetching QR...");
    await configureWebhook(instanceName, tenantId);

    const qrResult = await evolutionFetch(`/instance/connect/${instanceName}`);

    if (qrResult?.base64) {
      return {
        connected: false,
        status: "qrcode",
        qrCode: qrResult.base64,
        instanceName,
        message: "Escaneie o QR Code com seu WhatsApp",
      };
    }

    return {
      connected: false,
      status: "connecting",
      instanceName,
      message: "Gerando QR Code...",
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    log.error("Connect error:", error);

    return {
      connected: false,
      status: "error",
      instanceName,
      message: `Erro ao conectar: ${errorMessage}`,
    };
  }
}

/**
 * Verifica status atual da conexão WhatsApp
 */
export async function getWhatsAppStatus(tenantId: string): Promise<WhatsAppConnection> {
  const instanceName = getInstanceName(tenantId);

  try {
    const result = await evolutionFetch(`/instance/connectionState/${instanceName}`, {}, 1);

    if (result?.status === 404 || result?.error || !result?.instance) {
      return {
        connected: false,
        status: "disconnected",
        instanceName,
        message: "WhatsApp não conectado",
      };
    }

    const state = result.instance?.state;

    if (state === "open") {
      return {
        connected: true,
        status: "connected",
        phone: result.instance.owner,
        instanceName,
        message: "WhatsApp conectado!",
      };
    }

    if (state === "connecting") {
      const qrResult = await evolutionFetch(`/instance/connect/${instanceName}`, {}, 1);

      if (qrResult?.base64) {
        return {
          connected: false,
          status: "qrcode",
          qrCode: qrResult.base64,
          instanceName,
          message: "Escaneie o QR Code",
        };
      }

      return {
        connected: false,
        status: "connecting",
        instanceName,
        message: "Conectando...",
      };
    }

    return {
      connected: false,
      status: state === "close" ? "disconnected" : "connecting",
      instanceName,
      message: state === "close" ? "WhatsApp desconectado" : "Conectando...",
    };
  } catch (error: unknown) {
    log.error("Status check error:", error);

    return {
      connected: false,
      status: "disconnected",
      instanceName,
      message: "Erro ao verificar status",
    };
  }
}

/**
 * Desconecta WhatsApp (logout)
 */
export async function disconnectWhatsApp(tenantId: string): Promise<boolean> {
  const instanceName = getInstanceName(tenantId);

  try {
    log.info(`Disconnecting WhatsApp for tenant: ${tenantId}`);
    await evolutionFetch(`/instance/logout/${instanceName}`, { method: "DELETE" });
    return true;
  } catch (error) {
    log.error("Disconnect error:", error);
    return false;
  }
}

/**
 * Remove instância completamente
 */
export async function deleteWhatsAppInstance(tenantId: string): Promise<boolean> {
  const instanceName = getInstanceName(tenantId);

  try {
    log.info(`Deleting WhatsApp instance for tenant: ${tenantId}`);
    await evolutionFetch(`/instance/delete/${instanceName}`, { method: "DELETE" });
    return true;
  } catch (error) {
    log.error("Delete error:", error);
    return false;
  }
}

// =============================================================================
// PUBLIC API - MESSAGING
// =============================================================================

/**
 * Detecta tipo de erro e se requer reconexão
 */
function analyzeError(result: EvolutionResponse): { error: string; errorCode: string; requiresReconnect: boolean } {
  const responseMessage = result?.response?.message;
  let errorMsg = "";

  // Extrai mensagem de erro de diferentes formatos
  if (Array.isArray(result?.message)) {
    errorMsg = result.message.join(", ");
  } else if (typeof result?.message === "string") {
    errorMsg = result.message;
  } else if (typeof responseMessage === "string") {
    errorMsg = responseMessage;
  } else if (Array.isArray(responseMessage)) {
    // Evolution às vezes retorna array de arrays
    errorMsg = responseMessage.flat().join(", ");
  } else if (result?.error) {
    errorMsg = result.error;
  }

  // Normaliza para lowercase para comparação
  const errorLower = errorMsg.toLowerCase();

  // Erros que requerem reconexão
  const reconnectErrors = [
    "connection closed",
    "connection lost",
    "not connected",
    "disconnected",
    "session closed",
    "logged out",
    "requires reconnection",
    "instance not found",
    "qr code",
  ];

  const requiresReconnect = reconnectErrors.some(e => errorLower.includes(e));

  // Códigos de erro
  let errorCode = "UNKNOWN_ERROR";
  if (errorLower.includes("connection")) {
    errorCode = "CONNECTION_ERROR";
  } else if (errorLower.includes("not found")) {
    errorCode = "NOT_FOUND";
  } else if (errorLower.includes("invalid")) {
    errorCode = "INVALID_REQUEST";
  } else if (errorLower.includes("timeout")) {
    errorCode = "TIMEOUT";
  } else if (result?.status === 500) {
    errorCode = "SERVER_ERROR";
  } else if (result?.status === 401 || result?.status === 403) {
    errorCode = "AUTH_ERROR";
  }

  return {
    error: errorMsg || "Falha ao enviar mensagem",
    errorCode,
    requiresReconnect,
  };
}

/**
 * Envia mensagem de texto
 */
export async function sendWhatsAppMessage(
  tenantId: string,
  phone: string,
  message: string
): Promise<SendMessageResult> {
  const instanceName = getInstanceName(tenantId);
  const number = normalizePhoneNumber(phone);

  // Validação básica
  if (!number || number.length < 10) {
    log.error(`Invalid phone number: "${phone}" -> "${number}"`);
    return {
      success: false,
      error: `Número de telefone inválido: ${phone}`,
      errorCode: "INVALID_PHONE",
    };
  }

  try {
    log.info(`Sending text message to ${number} (original: ${phone})`);

    const result = await evolutionFetch(`/message/sendText/${instanceName}`, {
      method: "POST",
      body: JSON.stringify({ number, text: message }),
    });

    if (result?.key?.id) {
      log.info(`Message sent successfully: ${result.key.id}`);
      return { success: true, messageId: result.key.id };
    }

    // Analisa o erro
    const errorAnalysis = analyzeError(result);
    log.warn(`Send message failed: ${errorAnalysis.error}`, result);

    return {
      success: false,
      error: errorAnalysis.error,
      errorCode: errorAnalysis.errorCode,
      requiresReconnect: errorAnalysis.requiresReconnect,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro ao enviar";
    log.error("Send message error:", error);

    return {
      success: false,
      error: errorMessage,
      errorCode: "EXCEPTION",
      requiresReconnect: errorMessage.toLowerCase().includes("connection"),
    };
  }
}

/**
 * Envia mensagem usando remoteJid diretamente
 * Necessário para responder a mensagens @lid (WhatsApp Business)
 */
export async function sendWhatsAppMessageByJid(
  tenantId: string,
  remoteJid: string,
  message: string
): Promise<SendMessageResult> {
  const instanceName = getInstanceName(tenantId);

  // Validação básica
  if (!remoteJid || (!remoteJid.includes("@s.whatsapp.net") && !remoteJid.includes("@lid"))) {
    log.error(`Invalid remoteJid: "${remoteJid}"`);
    return {
      success: false,
      error: `RemoteJid inválido: ${remoteJid}`,
      errorCode: "INVALID_JID",
    };
  }

  try {
    log.info(`Sending text message to JID ${remoteJid}`);

    const result = await evolutionFetch(`/message/sendText/${instanceName}`, {
      method: "POST",
      body: JSON.stringify({
        number: remoteJid, // Evolution API aceita o JID completo
        text: message
      }),
    });

    if (result?.key?.id) {
      log.info(`Message sent successfully to JID: ${result.key.id}`);
      return { success: true, messageId: result.key.id };
    }

    // Analisa o erro
    const errorAnalysis = analyzeError(result);
    log.warn(`Send message to JID failed: ${errorAnalysis.error}`, result);

    return {
      success: false,
      error: errorAnalysis.error,
      errorCode: errorAnalysis.errorCode,
      requiresReconnect: errorAnalysis.requiresReconnect,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro ao enviar";
    log.error("Send message by JID error:", error);

    return {
      success: false,
      error: errorMessage,
      errorCode: "EXCEPTION",
      requiresReconnect: errorMessage.toLowerCase().includes("connection"),
    };
  }
}

/**
 * Envia mensagem com verificação prévia de conexão
 * Recomendado para envios importantes
 */
export async function sendWhatsAppMessageSafe(
  tenantId: string,
  phone: string,
  message: string
): Promise<SendMessageResult> {
  // Verifica status primeiro
  const status = await getWhatsAppStatus(tenantId);

  if (!status.connected) {
    log.warn(`WhatsApp not connected for tenant ${tenantId}, status: ${status.status}`);
    return {
      success: false,
      error: `WhatsApp não está conectado (status: ${status.status}). Reconecte nas configurações.`,
      errorCode: "NOT_CONNECTED",
      requiresReconnect: true,
    };
  }

  return sendWhatsAppMessage(tenantId, phone, message);
}

/**
 * Envia mensagem com mídia (imagem, documento, áudio, vídeo)
 */
export async function sendWhatsAppMedia(
  tenantId: string,
  phone: string,
  mediaUrl: string,
  caption?: string,
  mediaType: "image" | "document" | "audio" | "video" = "image"
): Promise<SendMessageResult> {
  const instanceName = getInstanceName(tenantId);
  const number = normalizePhoneNumber(phone);

  if (!number || number.length < 10) {
    return {
      success: false,
      error: `Número de telefone inválido: ${phone}`,
      errorCode: "INVALID_PHONE",
    };
  }

  try {
    log.info(`Sending ${mediaType} to ${number}`);

    const result = await evolutionFetch(`/message/sendMedia/${instanceName}`, {
      method: "POST",
      body: JSON.stringify({
        number,
        mediatype: mediaType,
        media: mediaUrl,
        caption: caption || "",
      }),
    });

    if (result?.key?.id) {
      log.info(`Media sent successfully: ${result.key.id}`);
      return { success: true, messageId: result.key.id };
    }

    const errorAnalysis = analyzeError(result);
    return {
      success: false,
      error: errorAnalysis.error,
      errorCode: errorAnalysis.errorCode,
      requiresReconnect: errorAnalysis.requiresReconnect,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro ao enviar";
    log.error("Send media error:", error);
    return { success: false, error: errorMessage, errorCode: "EXCEPTION" };
  }
}

/**
 * Envia localização
 */
export async function sendWhatsAppLocation(
  tenantId: string,
  phone: string,
  latitude: number,
  longitude: number,
  name?: string,
  address?: string
): Promise<SendMessageResult> {
  const instanceName = getInstanceName(tenantId);
  const number = normalizePhoneNumber(phone);

  if (!number || number.length < 10) {
    return {
      success: false,
      error: `Número de telefone inválido: ${phone}`,
      errorCode: "INVALID_PHONE",
    };
  }

  try {
    log.info(`Sending location to ${number}`);

    const result = await evolutionFetch(`/message/sendLocation/${instanceName}`, {
      method: "POST",
      body: JSON.stringify({
        number,
        latitude,
        longitude,
        name: name || "",
        address: address || "",
      }),
    });

    if (result?.key?.id) {
      return { success: true, messageId: result.key.id };
    }

    const errorAnalysis = analyzeError(result);
    return {
      success: false,
      error: errorAnalysis.error,
      errorCode: errorAnalysis.errorCode,
      requiresReconnect: errorAnalysis.requiresReconnect,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro ao enviar";
    log.error("Send location error:", error);
    return { success: false, error: errorMessage, errorCode: "EXCEPTION" };
  }
}

// =============================================================================
// PUBLIC API - UTILITIES
// =============================================================================

/**
 * Verifica se número tem WhatsApp
 */
export async function checkWhatsAppNumber(
  tenantId: string,
  phone: string
): Promise<{ exists: boolean; jid?: string; formattedNumber?: string }> {
  const instanceName = getInstanceName(tenantId);
  const number = normalizePhoneNumber(phone);

  try {
    const result = await evolutionFetch(`/chat/whatsappNumbers/${instanceName}`, {
      method: "POST",
      body: JSON.stringify({ numbers: [number] }),
    });

    if (Array.isArray(result) && result.length > 0) {
      const firstResult = result[0] as EvolutionResponse;
      return {
        exists: firstResult.exists || false,
        jid: firstResult.jid,
        formattedNumber: number,
      };
    }

    return { exists: false, formattedNumber: number };
  } catch (error) {
    log.error("Check number error:", error);
    return { exists: false, formattedNumber: number };
  }
}

/**
 * Obtém informações do perfil de um contato
 */
export async function getContactProfile(
  tenantId: string,
  phone: string
): Promise<{ name?: string; picture?: string }> {
  const instanceName = getInstanceName(tenantId);
  const number = normalizePhoneNumber(phone);

  try {
    const result = await evolutionFetch(`/chat/fetchProfile/${instanceName}`, {
      method: "POST",
      body: JSON.stringify({ number }),
    });

    return {
      name: result?.name || result?.pushName,
      picture: result?.picture,
    };
  } catch {
    return {};
  }
}

/**
 * Marca mensagens como lidas
 */
export async function markAsRead(
  tenantId: string,
  remoteJid: string,
  messageId: string
): Promise<boolean> {
  const instanceName = getInstanceName(tenantId);

  try {
    await evolutionFetch(`/chat/markMessageAsRead/${instanceName}`, {
      method: "POST",
      body: JSON.stringify({
        readMessages: [{ remoteJid, id: messageId }],
      }),
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Obtém foto de perfil
 */
export async function getProfilePicture(
  tenantId: string,
  phone: string
): Promise<string | null> {
  const instanceName = getInstanceName(tenantId);
  const number = normalizePhoneNumber(phone);

  try {
    const result = await evolutionFetch(`/chat/fetchProfilePictureUrl/${instanceName}`, {
      method: "POST",
      body: JSON.stringify({ number }),
    });

    return result?.picture || null;
  } catch {
    return null;
  }
}

// =============================================================================
// ADMIN UTILITIES
// =============================================================================

/**
 * Lista todas as instâncias (admin)
 */
export async function listAllInstances(): Promise<EvolutionResponse[]> {
  try {
    const result = await evolutionFetch("/instance/fetchInstances");
    return Array.isArray(result) ? result : [];
  } catch {
    return [];
  }
}

/**
 * Reconfigura webhook de uma instância existente (admin/manutenção)
 */
export async function reconfigureWebhook(tenantId: string): Promise<boolean> {
  const instanceName = getInstanceName(tenantId);
  return configureWebhook(instanceName, tenantId);
}

/**
 * Obtém configuração atual do webhook (debug)
 */
export async function getWebhookStatus(tenantId: string): Promise<EvolutionResponse | null> {
  const instanceName = getInstanceName(tenantId);
  return getWebhookConfig(instanceName);
}