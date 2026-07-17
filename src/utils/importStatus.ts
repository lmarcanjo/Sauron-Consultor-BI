// src/utils/importStatus.ts
/**
 * Status interno da fila de importação.
 * Internamente em inglês (enum), exibido em Português na UI via statusLabelMap.
 */
export enum ImportStatus {
  PENDING = "PENDING",
  READING = "READING",
  VALIDATING = "VALIDATING",
  PERSISTING = "PERSISTING",
  READY = "READY",
  ACTIVE = "ACTIVE",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
  INTERRUPTED = "INTERRUPTED",
}

/**
 * Mapeamento de status para rótulos visíveis em Português.
 * NUNCA exibir os enums em inglês na interface.
 */
export const statusLabelMap: Record<ImportStatus, string> = {
  [ImportStatus.PENDING]: "Aguardando arquivo",
  [ImportStatus.READING]: "Lendo a planilha",
  [ImportStatus.VALIDATING]: "Conferindo dados",
  [ImportStatus.PERSISTING]: "Preparando análise",
  [ImportStatus.READY]: "Pronto para configurar",
  [ImportStatus.ACTIVE]: "Pronto para análise",
  [ImportStatus.FAILED]: "Não foi possível importar",
  [ImportStatus.CANCELLED]: "Cancelada",
  [ImportStatus.INTERRUPTED]: "Importação interrompida",
};

/**
 * Retorna o rótulo PT para qualquer valor de status (enum ou string legada).
 */
export function getStatusLabel(status: string): string {
  return statusLabelMap[status as ImportStatus] ?? status;
}
