/**
 * src/core/workbook-library/WorkbookReadinessService.ts
 *
 * Serviço de prontidão de workbooks.
 *
 * Regra: o componente React NUNCA calcula prontidão diretamente.
 * Ele recebe um WorkbookReadinessViewModel pronto deste serviço.
 *
 * Estados visíveis:
 * - INTERRUPTED      → Importação interrompida
 * - STORAGE_FAILURE  → Falha de armazenamento
 * - PENDING_LINK     → Vínculo pendente
 * - PENDING_CONFIG   → Configuração pendente
 * - READY            → Pronto para análise
 * - ACTIVE           → Ativa
 * - READY_MEETING    → Pronto para reunião
 * - ARCHIVED         → Arquivada
 */

import { Workbook, WorkbookVersion } from "./WorkbookLibraryTypes";
import { spreadsheetStorageAdapter } from "../storage/IndexedSpreadsheetStorageAdapter";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type WorkbookReadinessStatus =
  | "INTERRUPTED"
  | "STORAGE_FAILURE"
  | "PENDING_LINK"
  | "PENDING_CONFIG"
  | "READY"
  | "ACTIVE"
  | "READY_MEETING"
  | "ARCHIVED";

export const readinessStatusLabel: Record<WorkbookReadinessStatus, string> = {
  INTERRUPTED: "Importação interrompida",
  STORAGE_FAILURE: "Falha de armazenamento",
  PENDING_LINK: "Vínculo pendente",
  PENDING_CONFIG: "Configuração pendente",
  READY: "Pronto para análise",
  ACTIVE: "Ativa",
  READY_MEETING: "Pronto para reunião",
  ARCHIVED: "Arquivada",
};

export const readinessStatusColor: Record<WorkbookReadinessStatus, string> = {
  INTERRUPTED: "text-amber-500",
  STORAGE_FAILURE: "text-rose-500",
  PENDING_LINK: "text-orange-500",
  PENDING_CONFIG: "text-yellow-500",
  READY: "text-emerald-500",
  ACTIVE: "text-blue-500",
  READY_MEETING: "text-purple-500",
  ARCHIVED: "text-slate-400",
};

export const readinessBadgeClass: Record<WorkbookReadinessStatus, string> = {
  INTERRUPTED: "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800",
  STORAGE_FAILURE: "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950 dark:text-rose-400 dark:border-rose-800",
  PENDING_LINK: "bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-950 dark:text-orange-400 dark:border-orange-800",
  PENDING_CONFIG: "bg-yellow-50 text-yellow-600 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-800",
  READY: "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800",
  ACTIVE: "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800",
  READY_MEETING: "bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-950 dark:text-purple-400 dark:border-purple-800",
  ARCHIVED: "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
};

export interface WorkbookReadinessInput {
  workbook: Workbook;
  version?: WorkbookVersion;
  /** IDs de empresas vinculadas a este workbook */
  linkedEnterpriseIds: string[];
  /** Mappings de colunas configurados */
  hasMappings: boolean;
  /** Pelo menos um módulo habilitado (DRE, KPI, Pessoas, etc.) */
  hasEnabledModules: boolean;
  /** Tem apresentação vinculada */
  hasPresentation: boolean;
  /** Tem erros de storage reportados externamente */
  hasStorageError?: boolean;
  /** Status da fila (se ainda em importação transitória) */
  importStatus?: string;
  /** Dados físicos persistidos com sucesso */
  hasPersistentStorage?: boolean;
  /** Pelo menos uma aba selecionada/validada */
  hasSelectedTabs?: boolean;
}

export interface WorkbookReadinessViewModel {
  workbookId: string;
  workbookName: string;
  status: WorkbookReadinessStatus;
  label: string;
  badgeClass: string;
  /** Lista de ações sugeridas para avançar de estado */
  actions: string[];
  /** Pode ser ativado agora? */
  canActivate: boolean;
}

// ─── Serviço ──────────────────────────────────────────────────────────────────

export class WorkbookReadinessService {
  /**
   * Avalia o estado de prontidão de um workbook.
   * NUNCA é chamado diretamente pelo componente React.
   * O componente recebe o ViewModel pronto.
   */
  async evaluate(input: WorkbookReadinessInput): Promise<WorkbookReadinessViewModel> {
    const {
      workbook,
      linkedEnterpriseIds,
      hasMappings,
      hasEnabledModules,
      hasPresentation,
      hasPersistentStorage = true,
      hasSelectedTabs = true,
    } = input;

    let status: WorkbookReadinessStatus;
    const actions: string[] = [];

    // 1. Arquivado
    if (workbook.status === "ARCHIVED" || workbook.status === "DELETED") {
      return this.buildViewModel(workbook, "ARCHIVED", []);
    }

    // 2. Importação interrompida
    if (input.importStatus === "INTERRUPTED") {
      return this.buildViewModel(workbook, "INTERRUPTED", [
        "Selecione o arquivo novamente para continuar a importação.",
      ]);
    }

    // 3. Verificar storage físico
    let hasMeta = false;
    let rowCount = 0;
    let hasRows = false;

    try {
      hasMeta = await spreadsheetStorageAdapter.hasMetadata(workbook.id);
      rowCount = await spreadsheetStorageAdapter.getRowCount(workbook.id);
      const activeSheet = input.version?.activeDataset?.activeSheet ?? "Dados";
      hasRows = await spreadsheetStorageAdapter.hasRows(workbook.id, activeSheet);
    } catch (e) {
      // Falha ao acessar storage
    }

    const storageReady = hasPersistentStorage || (hasMeta && rowCount > 0 && hasRows);

    if (input.hasStorageError || !storageReady) {
      return this.buildViewModel(workbook, "STORAGE_FAILURE", [
        "Reprocesse a fonte para corrigir a falha de armazenamento.",
      ]);
    }

    if (!hasSelectedTabs) {
      actions.push("Selecione pelo menos uma aba válida antes de ativar a fonte.");
      return this.buildViewModel(workbook, "PENDING_CONFIG", actions);
    }

    // 4. Vínculo empresarial
    if (linkedEnterpriseIds.length === 0) {
      actions.push("Vincule esta fonte a uma empresa ou grupo.");
      return this.buildViewModel(workbook, "PENDING_LINK", actions);
    }

    // 5. Configuração semântica é opcional para ativar a fonte. A análise de
    // módulos pode continuar pendente sem impedir o acesso aos dados físicos.

    // 6. Pronto para reunião
    if (hasMappings && hasEnabledModules && hasPresentation) {
      return this.buildViewModel(workbook, "READY_MEETING", []);
    }

    // 7. Ativa
    if (workbook.status === "ACTIVE" || (hasMeta && rowCount > 0 && hasRows)) {
      return this.buildViewModel(workbook, "ACTIVE", []);
    }

    // 8. Pronto para análise
    return this.buildViewModel(workbook, "READY", [
      "Ative esta fonte para incluí-la no Dashboard consolidado.",
    ]);
  }

  private buildViewModel(
    workbook: Workbook,
    status: WorkbookReadinessStatus,
    actions: string[]
  ): WorkbookReadinessViewModel {
    const canActivate =
      (status === "READY" || status === "READY_MEETING" || status === "ACTIVE") &&
      actions.length === 0;

    return {
      workbookId: workbook.id,
      workbookName: workbook.name ?? workbook.sourceName,
      status,
      label: readinessStatusLabel[status],
      badgeClass: readinessBadgeClass[status],
      actions,
      canActivate,
    };
  }

  /**
   * Avalia múltiplos workbooks em lote.
   * Retorna um Map<workbookId, WorkbookReadinessViewModel>.
   */
  async evaluateBatch(
    inputs: WorkbookReadinessInput[]
  ): Promise<Map<string, WorkbookReadinessViewModel>> {
    const results = new Map<string, WorkbookReadinessViewModel>();
    await Promise.all(
      inputs.map(async (input) => {
        const vm = await this.evaluate(input);
        results.set(vm.workbookId, vm);
      })
    );
    return results;
  }
}

export const workbookReadinessService = new WorkbookReadinessService();
