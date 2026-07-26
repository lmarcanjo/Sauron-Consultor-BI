import type { ChaosValueType } from "./ChaosDataTypes";

export function safeString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return "[object]";
    }
  }
  return String(value).trim();
}

export function normalizeComparableValue(value: unknown): string {
  return safeString(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function safeNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const text = value.trim().replace(/R\$/gi, "").replace(/\s/g, "");
  if (!text) return null;
  const cleaned = text.replace(/[^\d,.-]/g, "");
  if (!cleaned || cleaned === "-" || cleaned === "." || cleaned === ",") return null;
  let normalized = cleaned;
  if (cleaned.includes(",") && cleaned.includes(".")) {
    normalized = cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")
      ? cleaned.replace(/\./g, "").replace(",", ".")
      : cleaned.replace(/,/g, "");
  } else if (cleaned.includes(",")) {
    normalized = /^-?\d{1,3}(,\d{3})+$/.test(cleaned) ? cleaned.replace(/,/g, "") : cleaned.replace(",", ".");
  } else if (/^-?\d{1,3}(\.\d{3})+$/.test(cleaned)) {
    normalized = cleaned.replace(/\./g, "");
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function safeDate(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return new Date(value.getTime());
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (!text || /^-?\d+(?:[.,]\d+)?$/.test(text)) return null;
  const br = text.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/);
  if (br) {
    const year = Number(br[3].length === 2 ? `20${br[3]}` : br[3]);
    const parsed = new Date(year, Number(br[2]) - 1, Number(br[1]));
    return parsed.getFullYear() === year && parsed.getMonth() === Number(br[2]) - 1 && parsed.getDate() === Number(br[1]) ? parsed : null;
  }
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function classifyValue(value: unknown): ChaosValueType {
  if (value === null || value === undefined || safeString(value) === "") return "empty";
  if (value instanceof Date) return "date";
  if (typeof value === "number") return Number.isFinite(value) ? "number" : "unknown";
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "object") return "object";
  if (typeof value === "string") {
    if (safeDate(value)) return "date";
    if (safeNumber(value) !== null && /^[-+]?\s*(?:R\$)?\s*[\d.,]+%?$/.test(value.trim())) return "number";
    return "text";
  }
  return "unknown";
}

export function stableValue(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (value && typeof value === "object") {
    try {
      return JSON.stringify(value, Object.keys(value as Record<string, unknown>).sort());
    } catch {
      return safeString(value);
    }
  }
  return safeString(value);
}

export function samplePattern(value: unknown): string {
  return safeString(value)
    .replace(/[A-Za-zÀ-ÿ]/g, "A")
    .replace(/\d/g, "9")
    .replace(/\s+/g, " ");
}
