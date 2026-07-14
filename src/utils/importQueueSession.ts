/**
 * src/utils/importQueueSession.ts
 *
 * Utilitário de persistência da fila de importação em sessionStorage.
 *
 * REGRAS:
 * - Objetos File NÃO podem ser serializados → persistir apenas metadados.
 * - A chave é isolada por usuário e workspace.
 * - Nova sessão do navegador limpa a fila transitória automaticamente
 *   (sessionStorage não sobrevive ao fechar a aba/janela).
 * - Workbooks já persistidos são recuperados pelo workbookId/importJobId.
 * - Arquivos não persistidos ficam como INTERRUPTED.
 */

import { ImportStatus } from "./importStatus";

// ─── Schema serializável de item de fila ──────────────────────────────────────

export interface QueueItemSnapshot {
  /** ID único do item na fila */
  queueItemId: string;
  /** Metadados do arquivo (não o objeto File em si) */
  fileName: string;
  size: number;
  type: string;
  lastModified: number;
  /** Vínculos empresariais escolhidos */
  selectedGroupId: string;
  selectedCompanyId: string;
  selectedUnitId: string;
  /** Abas selecionadas (array serializável, não Set) */
  selectedSheets: string[];
  /** Status e progresso */
  status: ImportStatus;
  progress: number;
  message?: string;
  error?: string;
  /** Flags de recuperação pós-reload */
  needsReassociation?: boolean;
  /** Preenchido após a importação ser concluída */
  workbookId?: string;
  importJobId?: string;
  /** Timestamp de criação do item */
  createdAt: string;
}

// ─── "Assinatura" de arquivo para reassociação ────────────────────────────────

export interface FileSignature {
  fileName: string;
  size: number;
  lastModified: number;
}

export function matchesSignature(snapshot: QueueItemSnapshot, file: File): boolean {
  return (
    snapshot.fileName === file.name &&
    snapshot.size === file.size &&
    snapshot.lastModified === file.lastModified
  );
}

// ─── Chave isolada por usuário/workspace ─────────────────────────────────────

export function buildQueueKey(userId: string, workspaceId: string): string {
  return `sauron_import_queue:${userId}:${workspaceId}`;
}

// ─── Persistência ─────────────────────────────────────────────────────────────

export function saveQueue(
  userId: string,
  workspaceId: string,
  items: QueueItemSnapshot[]
): void {
  try {
    const key = buildQueueKey(userId, workspaceId);
    sessionStorage.setItem(key, JSON.stringify(items));
  } catch (e) {
    // sessionStorage pode estar cheio ou bloqueado em modo privado
    console.warn("[ImportQueue] Falha ao salvar fila na sessionStorage:", e);
  }
}

export function loadQueue(
  userId: string,
  workspaceId: string
): QueueItemSnapshot[] {
  try {
    const key = buildQueueKey(userId, workspaceId);
    const raw = sessionStorage.getItem(key);
    if (!raw) return [];
    const parsed: QueueItemSnapshot[] = JSON.parse(raw);
    return applyInterruptedRecovery(parsed);
  } catch (e) {
    console.warn("[ImportQueue] Falha ao carregar fila da sessionStorage:", e);
    return [];
  }
}

export function clearQueue(userId: string, workspaceId: string): void {
  try {
    const key = buildQueueKey(userId, workspaceId);
    sessionStorage.removeItem(key);
  } catch (e) {
    console.warn("[ImportQueue] Falha ao limpar fila:", e);
  }
}

// ─── Recuperação pós-reload ───────────────────────────────────────────────────

/**
 * Após um reload:
 * - Itens com workbookId → já persistidos, mantém status READY/ACTIVE
 * - Itens sem workbookId em status transitório → INTERRUPTED
 * - Itens FAILED/CANCELLED/INTERRUPTED → mantidos como estão
 */
function applyInterruptedRecovery(items: QueueItemSnapshot[]): QueueItemSnapshot[] {
  const transitoryStatuses: ImportStatus[] = [
    ImportStatus.PENDING,
    ImportStatus.READING,
    ImportStatus.VALIDATING,
    ImportStatus.PERSISTING,
  ];

  return items.map((item) => {
    const isTransitory = transitoryStatuses.includes(item.status);
    const isNotPersisted = !item.workbookId;

    if (isTransitory && isNotPersisted) {
      return {
        ...item,
        status: ImportStatus.INTERRUPTED,
        progress: 0,
        message:
          "A importação foi interrompida. Selecione novamente o arquivo para continuar.",
        error: undefined,
        needsReassociation: true,
      };
    }

    // Se estava PERSISTING mas workbookId existe → recovery → READY
    if (item.status === ImportStatus.PERSISTING && item.workbookId) {
      return {
        ...item,
        status: ImportStatus.READY,
        progress: 100,
        message: "Recuperado após interrupção.",
        needsReassociation: false,
      };
    }

    return item;
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function createSnapshot(params: {
  queueItemId: string;
  file: File;
  selectedGroupId?: string;
  selectedCompanyId?: string;
  selectedUnitId?: string;
}): QueueItemSnapshot {
  return {
    queueItemId: params.queueItemId,
    fileName: params.file.name,
    size: params.file.size,
    type: params.file.type,
    lastModified: params.file.lastModified,
    selectedGroupId: params.selectedGroupId ?? "",
    selectedCompanyId: params.selectedCompanyId ?? "",
    selectedUnitId: params.selectedUnitId ?? "",
    selectedSheets: [],
    status: ImportStatus.PENDING,
    progress: 0,
    createdAt: new Date().toISOString(),
  };
}
