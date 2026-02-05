import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/* ================================================================
   NEXACORE UTILITY LIBRARY v4.0
   
   Helpers for:
   ─ Class merging (cn)
   ─ Formatting (currency, dates, phone)
   ─ Avatar color generation (deterministic hash)
   ─ Relative time ("2 horas atrás")
   ─ Date classification ("Hoje", "Ontem", date)
   ─ Text utilities
   ================================================================ */

// ─── Class merging (Tailwind + clsx) ───
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Formatting ───

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 13) {
    // International format: +55 11 99999-9999
    return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
  }
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

export function formatCompactNumber(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  }
  return value.toString();
}

// ─── Text utilities ───

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length).trimEnd() + "...";
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// ─── Date/Time utilities ───

export function daysUntil(date: Date | string): number {
  const target = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function isToday(date: Date | string): boolean {
  const d = typeof date === "string" ? new Date(date) : date;
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

export function isYesterday(date: Date | string): boolean {
  const d = typeof date === "string" ? new Date(date) : date;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear()
  );
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

/**
 * Relative time in Portuguese — "há 2 minutos", "há 3 horas", etc.
 * Research: Relative timestamps improve perceived freshness of data
 */
export function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  
  // Future dates
  if (diffMs < 0) return "agora";
  
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (seconds < 30) return "agora";
  if (seconds < 60) return "há alguns segundos";
  if (minutes === 1) return "há 1 minuto";
  if (minutes < 60) return `há ${minutes} minutos`;
  if (hours === 1) return "há 1 hora";
  if (hours < 24) return `há ${hours} horas`;
  if (days === 1) return "ontem";
  if (days < 7) return `há ${days} dias`;
  if (weeks === 1) return "há 1 semana";
  if (weeks < 4) return `há ${weeks} semanas`;
  if (months === 1) return "há 1 mês";
  if (months < 12) return `há ${months} meses`;
  
  return formatDate(d);
}

/**
 * Format relative date — "Hoje", "Ontem", or the formatted date
 * Used in message timestamps, activity feeds, etc.
 */
export function formatRelativeDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  
  if (isToday(d)) return "Hoje";
  if (isYesterday(d)) return "Ontem";
  
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  
  // Within this week — show day name
  if (diffDays < 7) {
    return new Intl.DateTimeFormat("pt-BR", { weekday: "long" }).format(d);
  }
  
  // Same year — omit year
  if (d.getFullYear() === now.getFullYear()) {
    return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(d);
  }
  
  return formatDate(d);
}

/**
 * Format date for section headers in chat/activity — "Hoje, 31 de janeiro"
 */
export function formatDateHeader(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const dateStr = new Intl.DateTimeFormat("pt-BR", { 
    day: "numeric", 
    month: "long" 
  }).format(d);

  if (isToday(d)) return `Hoje, ${dateStr}`;
  if (isYesterday(d)) return `Ontem, ${dateStr}`;
  return dateStr;
}

// ─── Avatar color generation ───

/**
 * Generate a consistent avatar color from a name string.
 * Uses a simple hash to ensure the same name always gets the same color.
 * Colors are chosen to be vibrant on dark backgrounds with good contrast.
 */
const AVATAR_COLORS = [
  "#FF006E", // NexaCore pink
  "#FB5607", // NexaCore orange
  "#3B82F6", // Trust blue
  "#10B981", // Success green
  "#8B5CF6", // Purple
  "#06B6D4", // Cyan
  "#F59E0B", // Amber
  "#EC4899", // Pink
  "#14B8A6", // Teal
  "#6366F1", // Indigo
  "#F97316", // Orange
  "#84CC16", // Lime
] as const;

export function getAvatarColor(name: string): string {
  if (!name) return AVATAR_COLORS[0];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    const char = name.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/**
 * Generate a gradient pair for avatar backgrounds
 * Returns two colors that work well together
 */
export function getAvatarGradient(name: string): [string, string] {
  if (!name) return [AVATAR_COLORS[0], AVATAR_COLORS[1]];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    const char = name.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  const idx = Math.abs(hash) % AVATAR_COLORS.length;
  const nextIdx = (idx + 3) % AVATAR_COLORS.length; // Offset by 3 for contrast
  return [AVATAR_COLORS[idx], AVATAR_COLORS[nextIdx]];
}

// ─── Debounce ───

/**
 * Debounce function — Research: 300-500ms optimal for search inputs
 */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  let timer: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// ─── Clipboard ───

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}