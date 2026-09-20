export function sanitizeExportPart(value: string, fallback = "ASTERION"): string {
  const normalized = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\\/:*?"<>|]+/g, " ")
    .replace(/[^a-zA-Z0-9._ -]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\.+|\.+$/g, "");
  return (normalized || fallback).slice(0, 70);
}

export function buildExportFileName(clientName: string, kind: "Resumo_Executivo" | "Apresentacao_Executiva", date = new Date()): string {
  const client = sanitizeExportPart(clientName, "Cliente").replace(/ /g, "_");
  const day = date.toISOString().slice(0, 10);
  return `ASTERION_${client}_${kind}_${day}`;
}
