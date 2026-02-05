/**
 * NexaCore - Phone Utils
 * 
 * Funções de normalização e validação de telefones brasileiros
 * Extraído do webhook Evolution para permitir testes unitários
 * 
 * @see src/app/api/webhooks/evolution/[tenantId]/[[...event]]/route.ts
 */

// =============================================================================
// DDDs VÁLIDOS DO BRASIL (67 DDDs)
// =============================================================================

export const VALID_BRAZILIAN_DDDS = [
    // São Paulo (9)
    "11", "12", "13", "14", "15", "16", "17", "18", "19",
    // Rio de Janeiro / Espírito Santo (5)
    "21", "22", "24", "27", "28",
    // Minas Gerais (7)
    "31", "32", "33", "34", "35", "37", "38",
    // Paraná / Santa Catarina (9)
    "41", "42", "43", "44", "45", "46", "47", "48", "49",
    // Rio Grande do Sul (4)
    "51", "53", "54", "55",
    // Centro-Oeste / Norte (9)
    "61", "62", "63", "64", "65", "66", "67", "68", "69",
    // Bahia / Sergipe (6)
    "71", "73", "74", "75", "77", "79",
    // Nordeste (9)
    "81", "82", "83", "84", "85", "86", "87", "88", "89",
    // Norte (9)
    "91", "92", "93", "94", "95", "96", "97", "98", "99",
] as const;

export type BrazilianDDD = typeof VALID_BRAZILIAN_DDDS[number];

/**
 * Verifica se um DDD é válido no Brasil
 */
export function isValidBrazilianDDD(ddd: string): boolean {
    return VALID_BRAZILIAN_DDDS.includes(ddd as BrazilianDDD);
}

// =============================================================================
// NORMALIZAÇÃO DE TELEFONE
// =============================================================================

/**
 * Normaliza número de telefone brasileiro para formato internacional
 * 
 * @param raw - Número em qualquer formato
 * @returns Número normalizado (55DDXXXXXXXXX) ou null se inválido
 * 
 * Formatos aceitos:
 * - 10 dígitos: DDXXXXXXXX (fixo)
 * - 11 dígitos: DDXXXXXXXXX (celular)
 * - 12 dígitos: 55DDXXXXXXXX (já com código país)
 * - 13 dígitos: 55DDXXXXXXXXX (já com código país)
 * - 14+ dígitos: extrai os últimos 11 válidos
 * 
 * @example
 * normalizePhoneBR("11987654321")     // "5511987654321"
 * normalizePhoneBR("(11) 98765-4321") // "5511987654321"
 * normalizePhoneBR("+55 11 98765-4321") // "5511987654321"
 * normalizePhoneBR("987654321")       // null (sem DDD)
 */
export function normalizePhoneBR(raw: string): string | null {
    if (!raw) return null;

    let digits = raw.replace(/\D/g, "");
    if (!digits) return null;

    // Remove zeros à esquerda (exceto quando length <= 11)
    while (digits.startsWith("0") && digits.length > 11) {
        digits = digits.slice(1);
    }
    if (digits.startsWith("0") && digits.length === 11) {
        digits = digits.slice(1);
    }

    let normalized: string;

    switch (digits.length) {
        case 8:
        case 9:
            // Sem DDD - não é possível normalizar
            return null;

        case 10:
            // Formato: DDXXXXXXXX (telefone fixo com DDD)
            if (isValidBrazilianDDD(digits.slice(0, 2))) {
                normalized = "55" + digits;
            } else {
                return null;
            }
            break;

        case 11:
            // Formato: DDXXXXXXXXX (celular com DDD)
            if (isValidBrazilianDDD(digits.slice(0, 2))) {
                normalized = "55" + digits;
            } else {
                return null;
            }
            break;

        case 12:
            // Formato: 55DDXXXXXXXX ou DDDDXXXXXXXX
            if (digits.startsWith("55") && isValidBrazilianDDD(digits.slice(2, 4))) {
                normalized = digits;
            } else if (isValidBrazilianDDD(digits.slice(0, 2))) {
                // Pega os últimos 10 e adiciona 55
                normalized = "55" + digits.slice(-10);
            } else {
                return null;
            }
            break;

        case 13:
            // Formato: 55DDXXXXXXXXX ou prefixo + número
            if (digits.startsWith("55") && isValidBrazilianDDD(digits.slice(2, 4))) {
                normalized = digits;
            } else {
                const last11 = digits.slice(-11);
                if (isValidBrazilianDDD(last11.slice(0, 2))) {
                    normalized = "55" + last11;
                } else {
                    return null;
                }
            }
            break;

        case 14:
            // Casos especiais: 5555... (duplicado) ou outros
            if (digits.startsWith("5555")) {
                // 55 duplicado - remove um
                normalized = digits.slice(2);
            } else if (digits.startsWith("55")) {
                // Pega os últimos 13
                normalized = digits.slice(-13);
            } else {
                const last11 = digits.slice(-11);
                if (isValidBrazilianDDD(last11.slice(0, 2))) {
                    normalized = "55" + last11;
                } else {
                    return null;
                }
            }
            break;

        default:
            // Mais de 14 dígitos - extrai os últimos 11
            if (digits.length > 14) {
                const last11 = digits.slice(-11);
                if (isValidBrazilianDDD(last11.slice(0, 2))) {
                    normalized = "55" + last11;
                } else {
                    return null;
                }
            } else {
                // Menos de 8 dígitos
                return null;
            }
    }

    // Validação final: deve ter 12 ou 13 dígitos e começar com 55
    if ((normalized.length !== 12 && normalized.length !== 13) || !normalized.startsWith("55")) {
        return null;
    }

    return normalized;
}

/**
 * Formata telefone normalizado para exibição
 * 
 * @param phone - Telefone no formato 55DDXXXXXXXXX
 * @returns Formato (DD) XXXXX-XXXX ou (DD) XXXX-XXXX
 */
export function formatPhoneForDisplay(phone: string): string {
    if (!phone) return phone;

    const digits = phone.replace(/\D/g, "");
    const withoutCountry = digits.startsWith("55") ? digits.slice(2) : digits;

    if (withoutCountry.length === 11) {
        // Celular: (XX) XXXXX-XXXX
        return `(${withoutCountry.slice(0, 2)}) ${withoutCountry.slice(2, 7)}-${withoutCountry.slice(7)}`;
    } else if (withoutCountry.length === 10) {
        // Fixo: (XX) XXXX-XXXX
        return `(${withoutCountry.slice(0, 2)}) ${withoutCountry.slice(2, 6)}-${withoutCountry.slice(6)}`;
    }

    return phone;
}

/**
 * Extrai DDD de um número de telefone
 */
export function extractDDD(phone: string): string | null {
    const normalized = normalizePhoneBR(phone);
    if (!normalized) return null;
    return normalized.slice(2, 4);
}

/**
 * Verifica se é celular (13 dígitos com código país)
 */
export function isMobilePhone(phone: string): boolean {
    const normalized = normalizePhoneBR(phone);
    return normalized?.length === 13;
}
