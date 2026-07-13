/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function formatNumberSafe(value: any): string {
  if (value === undefined || value === null || isNaN(Number(value))) {
    return "0";
  }
  return Number(value).toLocaleString("pt-BR");
}

export function formatCurrencySafe(value: any): string {
  if (value === undefined || value === null || isNaN(Number(value))) {
    return "R$ 0,00";
  }
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

export function formatDateSafe(value: any): string {
  if (!value) return "Indisponível";
  try {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      // Retorna apenas a data pt-BR
      return date.toLocaleDateString("pt-BR");
    }
  } catch {}
  return "Indisponível";
}

export function formatDateTimeSafe(value: any): string {
  if (!value) return "Indisponível";
  try {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.toLocaleString("pt-BR");
    }
  } catch {}
  return "Indisponível";
}

export function formatPercentageSafe(value: any, decimals = 1): string {
  if (value === undefined || value === null || isNaN(Number(value))) {
    return "0%";
  }
  const pct = Number(value) * 100;
  return `${pct.toFixed(decimals)}%`;
}

export function formatTextSafe(value: any, fallback = "N/A"): string {
  if (value === undefined || value === null || typeof value === "object") {
    return fallback;
  }
  return String(value).trim() || fallback;
}

export function safeArray<T>(value: any): T[] {
  if (Array.isArray(value)) {
    return value;
  }
  return [];
}

export function safeObject(value: any): any {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value;
  }
  return {};
}

let idCounter = 0;

export function safeId(value: any, prefix = "id"): string {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  if (typeof value === "number") {
    return String(value);
  }
  idCounter++;
  return `${prefix}_${Date.now()}_${idCounter}`;
}

export function safeLabel(value: any, fallback = "Desconhecido"): string {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  return fallback;
}
