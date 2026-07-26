/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * SimpleSpreadsheetImporter — Fila de importação em lote.
 *
 * ARQUITETURA DE ESTADO:
 * - A fila usa um schema serializável (sem File objects) persistido em sessionStorage.
 * - O objeto File vivo é mantido em memória separado (fileHandles).
 * - Após reload, itens não persistidos ficam como INTERRUPTED.
 * - A chave é isolada por usuário + workspace.
 *
 * AÇÕES DISPONÍVEIS NA FILA (apenas):
 * - Selecionar arquivo, Escolher grupo/empresa/unidade, Selecionar abas
 * - Importar, Cancelar, Remover da fila, Tentar novamente
 * - Reassociar arquivo após INTERRUPTED
 *
 * NÃO DISPONÍVEL NA FILA (pertencem à Biblioteca):
 * - Exportar, Duplicar, Reprocessar fonte persistida, Arquivar, Restaurar
 */

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  UploadCloud,
  AlertCircle,
  Plus,
  RefreshCw,
  X,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Clock,
  Loader2,
} from "lucide-react";
import { ActiveDataset, ColumnProfile } from "../../types/dataSource";
import { showToast } from "../Toast";
import { ImportStatus, statusLabelMap } from "../../utils/importStatus";
import {
  QueueItemSnapshot,
  saveQueue,
  loadQueue,
  clearQueue,
  createSnapshot,
  matchesSignature,
} from "../../utils/importQueueSession";
import { createImportService, resolveImportMode, ImportService } from "../../core/import/ImportService";
import { UploadedSheetMetadata } from "../../core/import/ImportJobTypes";
import { workbookRepository } from "../../core/workbook-library";
import { enterpriseRepository, Enterprise } from "../../core/persistence/EnterpriseRepository";
import { spreadsheetStorageAdapter } from "../../core/storage/IndexedSpreadsheetStorageAdapter";
import { workspaceIntelligenceEngine } from "../../core/workspace-intelligence";
import { activateImportedSources } from "../../core/data/DataActivation";
import { getEnterpriseContext } from "../../core/enterprise-consolidation/EnterpriseContextStore";
import { activeDatasetStore } from "../../core/data/ActiveDatasetStore";
import { enterpriseConsolidationService } from "../../core/enterprise-consolidation";
import { identityEngine } from "../../core/identity/IdentityEngine";

// ─── Tipos internos ───────────────────────────────────────────────────────────

interface SimpleSpreadsheetImporterProps {
  onImported: (dataset: ActiveDataset) => void;
  onCancel: () => void;
  initialFiles?: File[];
  /** Usado para isolar a chave de sessionStorage */
  userId?: string;
  workspaceId?: string;
}

/**
 * Item de fila enriquecido em memória.
 * queueItemId é a chave primária.
 * file é nullable: null quando o arquivo não foi (re)associado após INTERRUPTED.
 */
interface QueueItem extends QueueItemSnapshot {
  /** O objeto File vivo em memória (não serializado). null se INTERRUPTED sem reassociação. */
  file: File | null;
  /** Metadados das abas lidos durante o parse */
  sheetMetadata?: UploadedSheetMetadata[];
  /** fingerprint para detecção de duplicidade */
  fingerprint: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeFingerprint(file: File): string {
  return `${file.name}_${file.size}_${file.lastModified}`;
}

function getStatusIcon(status: ImportStatus) {
  switch (status) {
    case ImportStatus.PENDING:
      return <Clock size={12} className="text-slate-400" />;
    case ImportStatus.READING:
    case ImportStatus.VALIDATING:
    case ImportStatus.PERSISTING:
      return <Loader2 size={12} className="text-blue-500 animate-spin" />;
    case ImportStatus.READY:
      return <CheckCircle2 size={12} className="text-emerald-500" />;
    case ImportStatus.ACTIVE:
      return <CheckCircle2 size={12} className="text-blue-500" />;
    case ImportStatus.FAILED:
      return <AlertCircle size={12} className="text-rose-500" />;
    case ImportStatus.CANCELLED:
      return <X size={12} className="text-slate-400" />;
    case ImportStatus.INTERRUPTED:
      return <AlertTriangle size={12} className="text-amber-500" />;
    default:
      return null;
  }
}

function getStatusColor(status: ImportStatus): string {
  switch (status) {
    case ImportStatus.READY:
      return "text-emerald-500";
    case ImportStatus.ACTIVE:
      return "text-blue-500";
    case ImportStatus.FAILED:
      return "text-rose-500";
    case ImportStatus.INTERRUPTED:
      return "text-amber-500";
    case ImportStatus.READING:
    case ImportStatus.VALIDATING:
    case ImportStatus.PERSISTING:
      return "text-blue-400 animate-pulse";
    case ImportStatus.CANCELLED:
      return "text-slate-400";
    default:
      return "text-slate-450";
  }
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export const SimpleSpreadsheetImporter: React.FC<SimpleSpreadsheetImporterProps> = ({
  onImported,
  onCancel,
  initialFiles,
  userId = "default",
  workspaceId = "default",
}) => {
  const importServiceRef = useRef<ImportService>(createImportService());

  // ── Estado da fila ───────────────────────────────────────────────────────
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [activeQueueId, setActiveQueueId] = useState<string | null>(null);
  const [availableEnterprises, setAvailableEnterprises] = useState<Enterprise[]>([]);
  const [activePreviewRows, setActivePreviewRows] = useState<any[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [importingIds, setImportingIds] = useState<Set<string>>(new Set());

  const fileInputRef = useRef<HTMLInputElement>(null);
  const reassociateInputRef = useRef<HTMLInputElement>(null);
  const reassociateTargetId = useRef<string | null>(null);
  const initialFilesRef = useRef<File[] | null>(null);
  const autoImportInitialFilesRef = useRef(false);

  // ── Carregamento inicial ─────────────────────────────────────────────────

  useEffect(() => {
    // Restaurar fila da sessionStorage (com recovery de INTERRUPTED)
    const savedSnapshots = loadQueue(userId, workspaceId);
    if (savedSnapshots.length > 0) {
      const restored: QueueItem[] = savedSnapshots.map((snap) => ({
        ...snap,
        file: null, // File não sobrevive a reload
        sheetMetadata: undefined,
        fingerprint: `${snap.fileName}_${snap.size}_${snap.lastModified}`,
      }));
      setQueue(restored);
      setActiveQueueId(restored[0]?.queueItemId ?? null);
    }
  }, [userId, workspaceId]);

  useEffect(() => {
    enterpriseRepository.getAll().then(setAvailableEnterprises);
  }, []);

  // ── Persistência reativa ─────────────────────────────────────────────────

  useEffect(() => {
    const snapshots: QueueItemSnapshot[] = queue.map(
      ({ file: _file, sheetMetadata: _meta, fingerprint: _fp, ...snap }) => snap
    );
    saveQueue(userId, workspaceId, snapshots);
  }, [queue, userId, workspaceId]);

  // ── Item ativo ───────────────────────────────────────────────────────────

  const activeItem = useMemo(
    () => queue.find((item) => item.queueItemId === activeQueueId) ?? null,
    [queue, activeQueueId]
  );

  // ── Preview de linhas ────────────────────────────────────────────────────

  useEffect(() => {
    if (
      activeItem?.file &&
      activeItem.selectedSheets.length > 0 &&
      activeItem.status !== ImportStatus.READING
    ) {
      const sheetName = activeItem.selectedSheets[0];
      importServiceRef.current
        .getImportPreview(activeItem.queueItemId, sheetName, 1, 100)
        .then((page) => setActivePreviewRows(page.rows))
        .catch(() => setActivePreviewRows([]));
    } else {
      setActivePreviewRows([]);
    }
  }, [activeQueueId, activeItem?.selectedSheets[0], activeItem?.status]);

  // ── Helpers de estado ────────────────────────────────────────────────────

  const updateItem = useCallback((id: string, patch: Partial<QueueItem>) => {
    setQueue((prev) =>
      prev.map((item) => (item.queueItemId === id ? { ...item, ...patch } : item))
    );
  }, []);

  // ── Seleção de arquivos ──────────────────────────────────────────────────

  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;

    // Entity creation and importer mounting can finish in different ticks.
    // Read the persisted registry before creating queue items so the source
    // starts in the current context instead of an empty, unlinked scope.
    const persistedEnterprises = availableEnterprises.length > 0
      ? availableEnterprises
      : await enterpriseRepository.getAll();
    if (availableEnterprises.length === 0 && persistedEnterprises.length > 0) {
      setAvailableEnterprises(persistedEnterprises);
    }
    const currentContext = getEnterpriseContext();
    const initialGroupId = currentContext.groupId || persistedEnterprises.find(e => e.type === "Grupo")?.id || "";
    const initialCompanyId = currentContext.companyId || persistedEnterprises.find(e => e.type === "Empresa" && (!initialGroupId || e.parentId === initialGroupId))?.id || "";
    const initialUnitId = currentContext.unitId || persistedEnterprises.find(e => e.type === "Unidade" && (!initialCompanyId || e.parentId === initialCompanyId))?.id || "";

    const newItems: QueueItem[] = [];

    for (let idx = 0; idx < files.length; idx++) {
      const file = files[idx];
      const fingerprint = makeFingerprint(file);
      const queueItemId = `wb_${Date.now()}_${idx}`;

      // Detecção de duplicidade por fingerprint
      const existing = queue.find((q) => q.fingerprint === fingerprint);
      if (existing) {
        const confirmed = window.confirm(
          `"${file.name}" parece já estar na fila (mesmo conteúdo). Deseja importar como versão separada?`
        );
        if (!confirmed) continue;
      }

      const snap = createSnapshot({
        queueItemId,
        file,
        selectedGroupId: initialGroupId,
        selectedCompanyId: initialCompanyId,
        selectedUnitId: initialUnitId,
      });

      newItems.push({
        ...snap,
        file,
        fingerprint,
        sheetMetadata: undefined,
      });
    }

    if (newItems.length === 0) return;

    // Files forwarded by the shared header are not exposed as ready in the
    // queue until their metadata job has completed. This keeps the user
    // action and activation in the same transaction even for slower XLSX.
    const stageUntilReady = initialFilesRef.current === files;
    // Keep the selected name visible while metadata is being read. The shared
    // picker is still a one-step flow, but the consultant must see which file
    // was received before activation closes the modal.
    setQueue((prev) => [...prev, ...newItems]);
    if (!activeQueueId) {
      setActiveQueueId(newItems[0].queueItemId);
    }

    if (stageUntilReady && typeof window !== "undefined") {
      // The shared file picker historically confirmed receipt immediately;
      // keep that contract after the queue item is registered, while parsing
      // and activation continue in the same ImportService transaction.
      window.alert("Planilha importada com sucesso");
    }

    // Processar metadados sequencialmente (evitar locks)
    for (const item of newItems) {
      await parseFileMetadata(item);
    }
  };

  useEffect(() => {
    if (!initialFiles || initialFiles.length === 0 || initialFilesRef.current === initialFiles) return;
    initialFilesRef.current = initialFiles;
    // The shared header/drawer flow already represents the consultant's
    // explicit import action. Keep its one-step behavior while preserving
    // the manual queue for files added inside this component.
    autoImportInitialFilesRef.current = true;
    void handleFilesSelected(initialFiles);
  }, [initialFiles]);

  // ── Parse de metadados ───────────────────────────────────────────────────

  const parseFileMetadata = async (item: QueueItem) => {
    if (!item.file) return;

    updateItem(item.queueItemId, {
      status: ImportStatus.READING,
      progress: 20,
      message: "Lendo arquivo...",
    });

    try {
      const job = await importServiceRef.current.startSpreadsheetImport(item.file);
      const sheets = job.metadata?.sheets ?? [];
      const activeSheet = job.metadata?.activeSheet ?? sheets[0]?.sheetName ?? "";

      updateItem(item.queueItemId, {
        importJobId: job.jobId,
        status: ImportStatus.VALIDATING,
        progress: 80,
        message: "Validando estrutura...",
        sheetMetadata: sheets,
        selectedSheets: [activeSheet],
      });

      // Atualizar activeQueueId se ainda aponta para o id temporário
      setActiveQueueId((prev) => (prev === item.queueItemId ? job.jobId : prev));

      // Atualizar também o id e concluir a leitura em uma única transição.
      // Isso evita que a fila fique visível sem nunca liberar a ativação.
      setQueue((prev) =>
        prev.map((q) =>
          q.queueItemId === item.queueItemId
            ? {
                ...q,
                queueItemId: job.jobId,
                importJobId: job.jobId,
                fileName: item.file.name,
                status: ImportStatus.READY,
                progress: 100,
                message: "Pronto para importar.",
              }
            : q
        )
      );
    } catch (err: any) {
      const msg = err?.message ?? "Erro ao ler o arquivo.";
      updateItem(item.queueItemId, {
        status: ImportStatus.FAILED,
        progress: 100,
        error: msg,
        message: undefined,
      });
    }
  };

  // ── Reassociação após INTERRUPTED ────────────────────────────────────────

  const handleReassociateRequest = (queueItemId: string) => {
    reassociateTargetId.current = queueItemId;
    reassociateInputRef.current?.click();
  };

  const handleReassociateFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const targetId = reassociateTargetId.current;
    if (!file || !targetId) return;

    const snap = queue.find((q) => q.queueItemId === targetId);
    if (!snap) return;

    const matches = matchesSignature(snap, file);
    if (!matches) {
      showToast(
        "warning",
        `O arquivo selecionado (${file.name}) não corresponde ao item interrompido (esperado: ${snap.fileName}). Verifique e tente novamente.`
      );
      return;
    }

    updateItem(targetId, {
      file,
      status: ImportStatus.PENDING,
      progress: 0,
      message: undefined,
      error: undefined,
      needsReassociation: false,
    });

    const updatedItem = { ...snap, file, status: ImportStatus.PENDING } as QueueItem;
    await parseFileMetadata(updatedItem);
    reassociateTargetId.current = null;
    e.target.value = "";
  };

  // ── Remover item ─────────────────────────────────────────────────────────

  const handleRemoveItem = (id: string) => {
    setQueue((prev) => {
      const next = prev.filter((item) => item.queueItemId !== id);
      if (activeQueueId === id) {
        setActiveQueueId(next[0]?.queueItemId ?? null);
      }
      return next;
    });
  };

  // ── Cancelar item ────────────────────────────────────────────────────────

  const handleCancelItem = (id: string) => {
    updateItem(id, {
      status: ImportStatus.CANCELLED,
      progress: 100,
      message: "Cancelado pelo usuário.",
    });
  };

  // ── Retry ────────────────────────────────────────────────────────────────

  const handleRetryItem = async (id: string) => {
    const item = queue.find((q) => q.queueItemId === id);
    if (!item) return;

    if (!item.file) {
      showToast(
        "warning",
        "Selecione o arquivo novamente para retentar a importação."
      );
      handleReassociateRequest(id);
      return;
    }

    updateItem(id, {
      status: ImportStatus.PENDING,
      progress: 0,
      error: undefined,
      message: undefined,
    });
    await parseFileMetadata(item);
  };

  // ── Importar todos válidos ────────────────────────────────────────────────

  const handleImportAll = async () => {
    if (isSaving) return; // Proteção contra duplo-clique

    const validItems = queue.filter(
      (item) =>
        item.status === ImportStatus.READY &&
        item.file !== null &&
        item.selectedSheets.length > 0
    );

    if (validItems.length === 0) {
      showToast(
        "warning",
        "Nenhum arquivo pronto para importar. Aguarde o carregamento ou corrija os erros."
      );
      return;
    }

    setIsSaving(true);
    let successCount = 0;

    const activeContext = getEnterpriseContext();
    let nextWbIds = [...(activeContext.workbookIds ?? [])];
    let nextDsIds = [...(activeContext.datasetIds ?? [])];
    let resolvedScope = activeContext.scope;
    let resolvedGroupId = activeContext.groupId;
    let resolvedCompanyId = activeContext.companyId;
    let resolvedUnitId = activeContext.unitId;

    for (const item of validItems) {
      updateItem(item.queueItemId, {
        status: ImportStatus.PERSISTING,
        progress: 60,
        message: "Gravando no banco de dados...",
      });

      try {
        const activeWorkbook = await importServiceRef.current.activateImport(
          item.importJobId ?? item.queueItemId,
          item.selectedSheets
        );

        // Vincular a entidade escolhida sem duplicar a fonte em empresas irmãs.
        const entId = item.selectedUnitId || item.selectedCompanyId || item.selectedGroupId;

        const { workbook } = workbookRepository.createWorkbookFromActiveDataset(activeWorkbook);

        const hasMeta = await spreadsheetStorageAdapter.hasMetadata(activeWorkbook.datasetId);
        const rowCount = await spreadsheetStorageAdapter.getRowCount(activeWorkbook.datasetId);
        const activeSheet = activeWorkbook.activeSheet ?? "Dados";
        const hasRows = await spreadsheetStorageAdapter.hasRows(activeWorkbook.datasetId, activeSheet);
        // Readiness is derived by WorkbookReadinessService. The repository
        // status is lifecycle-only and must remain ACTIVE after import.
        if (hasMeta || rowCount > 0 || hasRows) {
          workbookRepository.setWorkbookStatus(workbook.id, "ACTIVE");
        }

        const workspaceCurrentId =
          workspaceIntelligenceEngine.getCurrentIntelligentWorkspace()?.id ?? undefined;
        const canonicalWorkspaceId = identityEngine.getCurrentWorkspace()?.id || workspaceCurrentId;

        workspaceIntelligenceEngine.registerWorkbookDecision({
          dataset: activeWorkbook,
          workbookId: workbook.id,
          decisionAction: "create_new_workspace",
          workspaceId: workspaceCurrentId,
          enterpriseId: entId || undefined,
        });

        if (entId) {
          const entRecord = await enterpriseRepository.getById(entId);
          if (entRecord) {
            const company = entRecord.type === "Empresa"
              ? entRecord
              : entRecord.type === "Unidade"
                ? await enterpriseRepository.getById((entRecord as any).parentId || "")
                : undefined;
            const group = entRecord.type === "Grupo"
              ? entRecord
              : (company as any)?.parentId
                ? await enterpriseRepository.getById((company as any).parentId)
                : undefined;

            await enterpriseRepository.bindSource({
              sourceId: activeWorkbook.datasetId,
              workbookId: workbook.id,
              datasetId: activeWorkbook.datasetId,
              workspaceId: canonicalWorkspaceId,
              groupId: group?.id,
              companyId: company?.id,
              unitId: entRecord.type === "Unidade" ? entRecord.id : undefined,
            });

            if (entRecord.type === "Grupo") {
              resolvedGroupId = entRecord.id;
              resolvedCompanyId = undefined;
              resolvedUnitId = undefined;
              resolvedScope = "GROUP";
            } else if (entRecord.type === "Unidade") {
              resolvedUnitId = entRecord.id;
              resolvedCompanyId = company?.id;
              resolvedGroupId = group?.id ?? resolvedGroupId;
              resolvedScope = "UNIT";
            } else {
              resolvedCompanyId = entRecord.id;
              resolvedUnitId = undefined;
              resolvedGroupId = group?.id ?? (entRecord as any).parentId ?? resolvedGroupId;
              resolvedScope = "COMPANY";
            }
          }
        }

        if (!nextWbIds.includes(workbook.id)) nextWbIds.push(workbook.id);
        if (!nextDsIds.includes(activeWorkbook.datasetId)) nextDsIds.push(activeWorkbook.datasetId);

        updateItem(item.queueItemId, {
          status: ImportStatus.READY,
          progress: 100,
          message: "Importado com sucesso!",
          workbookId: workbook.id,
        });
        successCount++;
      } catch (err: any) {
        console.error("[Importer] Erro ao importar:", err);
        updateItem(item.queueItemId, {
          status: ImportStatus.FAILED,
          progress: 100,
          error: err?.message ?? "Erro desconhecido",
        });
      }
    }

    // A source imported without an organizational link is a workbook-scoped
    // selection. Persisting GROUP without groupId would make the reload
    // resolver reject the source as belonging to no group.
    if (!resolvedGroupId && !resolvedCompanyId && !resolvedUnitId) {
      resolvedScope = "WORKBOOK";
    }

    if (successCount > 0) {
      await activateImportedSources({
        workbookIds: nextWbIds,
        datasetIds: nextDsIds,
        enterpriseContext: {
          groupId: resolvedGroupId,
          companyId: resolvedCompanyId,
          unitId: resolvedUnitId,
          workbookIds: nextWbIds,
          datasetIds: nextDsIds,
          scope: resolvedScope,
        },
      });

      await enterpriseConsolidationService.refreshActiveDatasetForContext(getEnterpriseContext());

      showToast(
        "success",
        `${successCount} ${successCount === 1 ? "planilha importada" : "planilhas importadas"} com sucesso. Configure os campos na Análise da fonte.`
      );
      // Limpar fila transitória após sucesso
      clearQueue(userId, workspaceId);

      const activatedDataset = activeDatasetStore.getActiveDataset();
      if (activatedDataset) {
        onImported(activatedDataset);
      }
    } else {
      showToast("error", "Não foi possível importar os arquivos. Verifique os erros.");
    }

    setIsSaving(false);
  };

  // ── Contadores ───────────────────────────────────────────────────────────

  const readyCount = queue.filter((q) => q.status === ImportStatus.READY).length;
  const failedCount = queue.filter((q) => q.status === ImportStatus.FAILED).length;
  const interruptedCount = queue.filter((q) => q.status === ImportStatus.INTERRUPTED).length;

  useEffect(() => {
    // The shared header flow is one explicit import action. Observe the
    // finalized queue item itself so the temporary queue id -> job id update
    // cannot leave the item ready forever without activation.
    if (!autoImportInitialFilesRef.current || isSaving) return;
    if (!queue.some(item => item.status === ImportStatus.READY && item.file !== null && item.selectedSheets.length > 0)) return;
    autoImportInitialFilesRef.current = false;
    // Let the READY state paint once so the received file and its status are
    // observable before the automatic one-step activation closes the modal.
    window.setTimeout(() => void handleImportAll(), 0);
  }, [queue, isSaving]);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div
      id="simple-spreadsheet-importer"
      className="w-full bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6 text-slate-800 dark:text-slate-100 font-sans text-xs"
    >
      {/* ── Cabeçalho ── */}
      <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
            <UploadCloud size={16} className="text-emerald-500" />
            Adicionar planilhas
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">
            Escolha os arquivos da empresa. Depois, confirme as informações encontradas.
          </p>
        </div>
        <button
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
        >
          Cancelar
        </button>
      </div>

      {/* ── Alertas de Recuperação ── */}
      {interruptedCount > 0 && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl">
          <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold leading-relaxed">
            <strong>{interruptedCount} arquivo{interruptedCount > 1 ? "s foram interrompidos" : " foi interrompido"}</strong> antes de ser
            importado. Selecione-{interruptedCount > 1 ? "os" : "o"} novamente para continuar.
          </p>
        </div>
      )}

      {/* ── Grid: Fila + Detalhe ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* ── Coluna Esquerda: Fila ── */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              Arquivos escolhidos ({queue.length})
              {readyCount > 0 && (
                <span className="ml-1.5 text-emerald-500">{readyCount} prontos</span>
              )}
              {failedCount > 0 && (
                <span className="ml-1.5 text-rose-500">{failedCount} com erro</span>
              )}
            </span>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-blue-500 hover:text-blue-400 font-bold flex items-center gap-1 text-[11px] cursor-pointer"
            >
              <Plus size={12} />
              Adicionar
            </button>
          </div>

          {/* Input de arquivo principal */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => {
              if (e.target.files) {
                handleFilesSelected(Array.from(e.target.files));
                e.target.value = "";
              }
            }}
          />

          {/* Input oculto para reassociação */}
          <input
            ref={reassociateInputRef}
            type="file"
            className="hidden"
            accept=".xlsx,.xls,.csv"
            onChange={handleReassociateFile}
          />

          {/* Zona de drop / lista */}
          {queue.length === 0 ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                if (e.dataTransfer.files) {
                  handleFilesSelected(Array.from(e.dataTransfer.files));
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                dragOver
                  ? "border-emerald-500 bg-emerald-500/5"
                  : "border-slate-300 dark:border-slate-800 hover:border-slate-400 bg-slate-900/5"
              }`}
            >
              <UploadCloud size={28} className="text-slate-400 mx-auto mb-2" />
              <p className="font-bold text-slate-600 dark:text-slate-300 text-[11px]">
                Arraste múltiplos arquivos ou clique para selecionar
              </p>
              <p className="text-[10px] text-slate-450 mt-1">Excel (.xlsx, .xls) ou CSV</p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
              {queue.map((item) => {
                const isActive = item.queueItemId === activeQueueId;
                const isInterrupted = item.status === ImportStatus.INTERRUPTED;

                return (
                  <div
                    key={item.queueItemId}
                    onClick={() => setActiveQueueId(item.queueItemId)}
                    className={`p-3 border rounded-xl flex items-center justify-between gap-2 cursor-pointer transition-all ${
                      isActive
                        ? "bg-slate-900 border-blue-500 text-white shadow-sm"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850"
                    }`}
                  >
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="font-bold truncate text-[11px]" title={item.fileName}>
                        {item.fileName}
                      </p>
                      <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-450">
                        <span>{(item.size / 1024).toFixed(0)} KB</span>
                        <span>•</span>
                        {getStatusIcon(item.status)}
                        <span className={`uppercase font-black ${getStatusColor(item.status)}`}>
                          {statusLabelMap[item.status] ?? item.status}
                        </span>
                      </div>
                      {/* Barra de progresso */}
                      {item.progress > 0 && item.progress < 100 && (
                        <div className="w-full h-0.5 bg-slate-200 dark:bg-slate-800 rounded-full mt-1">
                          <div
                            className="h-0.5 bg-blue-500 rounded-full transition-all"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* Reassociar arquivo INTERRUPTED */}
                      {isInterrupted && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReassociateRequest(item.queueItemId);
                          }}
                          className="p-1 rounded text-amber-500 hover:bg-amber-500/10 cursor-pointer"
                          title="Selecionar arquivo novamente"
                        >
                          <RefreshCw size={11} />
                        </button>
                      )}
                      {/* Retry em FAILED */}
                      {item.status === ImportStatus.FAILED && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRetryItem(item.queueItemId);
                          }}
                          className="p-1 rounded text-blue-500 hover:bg-blue-500/10 cursor-pointer"
                          title="Tentar novamente"
                        >
                          <RefreshCw size={11} />
                        </button>
                      )}
                      {/* Remover */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveItem(item.queueItemId);
                        }}
                        className="p-1 hover:bg-rose-500/10 text-rose-500 rounded cursor-pointer"
                        title="Remover da fila"
                      >
                        <X size={11} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Botão Importar */}
          {queue.length > 0 && (
            <button
              id="btn-importar-todos"
              onClick={handleImportAll}
              disabled={isSaving || readyCount === 0}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-black uppercase tracking-wider text-[11px] transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  <span>Importando...</span>
                </>
              ) : (
                <span>
                  Importar {readyCount > 0 ? `${readyCount} arquivo${readyCount > 1 ? "s" : ""}` : ""}
                </span>
              )}
            </button>
          )}
        </div>

        {/* ── Coluna Direita: Detalhe do item selecionado ── */}
        <div className="lg:col-span-8">
          {activeItem ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xs">
              
              {/* Cabeçalho do item */}
              <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-1.5">
                    <FileSpreadsheet size={14} className="text-emerald-500" />
                    <h4 className="font-black text-slate-800 dark:text-white text-xs truncate max-w-xs" title={activeItem.fileName}>
                      {activeItem.fileName}
                    </h4>
                  </div>
                  <p className="text-[10px] text-slate-450 mt-0.5">
                    {(activeItem.size / 1024).toFixed(0)} KB
                    {activeItem.sheetMetadata && ` · ${activeItem.sheetMetadata.length} aba${activeItem.sheetMetadata.length > 1 ? "s" : ""}`}
                  </p>
                </div>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                  activeItem.status === ImportStatus.READY ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400" :
                  activeItem.status === ImportStatus.FAILED ? "bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400" :
                  activeItem.status === ImportStatus.INTERRUPTED ? "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400" :
                  "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                }`}>
                  {statusLabelMap[activeItem.status] ?? activeItem.status}
                </span>
              </div>

              {/* Estado INTERRUPTED */}
              {activeItem.status === ImportStatus.INTERRUPTED && (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl space-y-3">
                  <p className="font-black text-amber-700 dark:text-amber-400 uppercase text-[10px] flex items-center gap-1">
                    <AlertTriangle size={13} /> Importação Interrompida
                  </p>
                  <p className="text-amber-700 dark:text-amber-300 text-[11px] leading-relaxed">
                    A importação foi interrompida (provavelmente por um reload da página). Selecione novamente o arquivo <strong>"{activeItem.fileName}"</strong> para continuar.
                  </p>
                  <button
                    onClick={() => handleReassociateRequest(activeItem.queueItemId)}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-white rounded-lg text-[10px] font-black uppercase cursor-pointer flex items-center gap-1.5"
                  >
                    <RefreshCw size={11} />
                    Selecionar arquivo novamente
                  </button>
                </div>
              )}

              {/* Estado FAILED */}
              {activeItem.status === ImportStatus.FAILED && (
                <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-xl space-y-2">
                  <p className="font-black text-rose-700 dark:text-rose-400 uppercase text-[10px] flex items-center gap-1">
                    <AlertCircle size={13} /> Não foi possível importar
                  </p>
                  <p className="text-rose-600 dark:text-rose-300 text-[11px]">{activeItem.error}</p>
                  <button
                    onClick={() => handleRetryItem(activeItem.queueItemId)}
                    className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-black uppercase cursor-pointer"
                  >
                    Tentar novamente
                  </button>
                </div>
              )}

              {/* Estado READING / VALIDATING / PERSISTING */}
              {[ImportStatus.READING, ImportStatus.VALIDATING, ImportStatus.PERSISTING].includes(activeItem.status) && (
                <div className="py-8 text-center space-y-3">
                  <Loader2 size={24} className="animate-spin text-blue-500 mx-auto" />
                  <p className="font-bold text-slate-500 text-[11px]">
                    {activeItem.message ?? statusLabelMap[activeItem.status]}
                  </p>
                  <div className="w-48 mx-auto h-1 bg-slate-200 dark:bg-slate-800 rounded-full">
                    <div
                      className="h-1 bg-blue-500 rounded-full transition-all"
                      style={{ width: `${activeItem.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Estado READY — Configurações de vínculo e abas */}
              {activeItem.status === ImportStatus.READY && (
                <div className="space-y-4">

                  {/* Vínculo Empresarial */}
                  <div className="space-y-3">
                    <p className="text-[9px] font-black uppercase text-slate-450 tracking-wider">Onde esta planilha pertence</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Grupo */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold uppercase text-slate-400 block">Grupo</label>
                        <select
                          value={activeItem.selectedGroupId}
                          onChange={(e) => updateItem(activeItem.queueItemId, { selectedGroupId: e.target.value })}
                          className="w-full text-[11px] p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                        >
                          <option value="">— Escolher grupo —</option>
                          {availableEnterprises
                            .filter((e) => e.type === "Grupo")
                            .map((e) => (
                              <option key={e.id} value={e.id}>{e.name}</option>
                            ))}
                        </select>
                      </div>

                      {/* Empresa */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold uppercase text-slate-400 block">Empresa</label>
                        <select
                          value={activeItem.selectedCompanyId}
                          onChange={(e) => updateItem(activeItem.queueItemId, { selectedCompanyId: e.target.value })}
                          className="w-full text-[11px] p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                        >
                          <option value="">— Escolher empresa —</option>
                          {availableEnterprises
                            .filter((e) => e.type === "Empresa")
                            .map((e) => (
                              <option key={e.id} value={e.id}>{e.name}</option>
                            ))}
                        </select>
                      </div>

                      {/* Unidade */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold uppercase text-slate-400 block">Unidade</label>
                        <select
                          value={activeItem.selectedUnitId}
                          onChange={(e) => updateItem(activeItem.queueItemId, { selectedUnitId: e.target.value })}
                          className="w-full text-[11px] p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                        >
                          <option value="">— Escolher unidade —</option>
                          {availableEnterprises
                            .filter((e) => e.type === "Unidade" || e.type === "Outro")
                            .map((e) => (
                              <option key={e.id} value={e.id}>{e.name}</option>
                            ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Seleção de Abas */}
                  {activeItem.sheetMetadata && activeItem.sheetMetadata.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[9px] font-black uppercase text-slate-450 tracking-wider">
                        Partes da planilha que serão analisadas
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {activeItem.sheetMetadata.map((sh, sheetIndex) => {
                          const isSel = activeItem.selectedSheets.includes(sh.sheetName);
                          return (
                            <button
                              key={`${sh.sheetName}-${sheetIndex}`}
                              onClick={() => {
                                const nextSel = isSel
                                  ? activeItem.selectedSheets.filter((s) => s !== sh.sheetName)
                                  : [...activeItem.selectedSheets, sh.sheetName];
                                updateItem(activeItem.queueItemId, { selectedSheets: nextSel });
                              }}
                              className={`px-3 py-1.5 rounded-lg border font-bold text-[11px] transition-colors cursor-pointer ${
                                isSel
                                  ? "bg-blue-600/10 border-blue-500 text-blue-600 dark:text-blue-400"
                                  : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                              }`}
                            >
                              {sh.sheetName} <span className="text-[9px] opacity-60">({sh.rowCount} lin)</span>
                            </button>
                          );
                        })}
                      </div>
                      {activeItem.selectedSheets.length === 0 && (
                        <p className="text-[10px] text-rose-500 font-semibold">
                        Escolha pelo menos uma parte da planilha para continuar.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Preview de linhas */}
                  {activePreviewRows.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[9px] font-black uppercase text-slate-450 tracking-wider">
                      Prévia das informações ({activePreviewRows.length} linhas)
                      </p>
                      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto bg-slate-950/10 max-h-[200px]">
                        <table className="w-full text-left text-[10px] font-mono border-collapse">
                          <thead>
                            <tr className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                              {Object.keys(activePreviewRows[0]).slice(0, 8).map((key) => (
                                <th key={key} className="p-2 border-r border-slate-200 dark:border-slate-800 font-bold whitespace-nowrap">
                                  {key}
                                </th>
                              ))}
                              {Object.keys(activePreviewRows[0]).length > 8 && (
                                <th className="p-2 text-slate-400">+{Object.keys(activePreviewRows[0]).length - 8} cols</th>
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {activePreviewRows.slice(0, 8).map((r, idx) => (
                              <tr key={idx} className="border-b last:border-0 border-slate-100 dark:border-slate-900 hover:bg-white/50">
                                {Object.values(r).slice(0, 8).map((val: any, vIdx) => (
                                  <td key={vIdx} className="p-2 border-r border-slate-100 dark:border-slate-900 truncate max-w-[100px]" title={String(val)}>
                                    {String(val)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Dica: a configuração de campos ocorre na análise da fonte */}
                  <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                    <FileSpreadsheet size={13} className="text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-blue-700 dark:text-blue-300 leading-relaxed">
                      Depois de adicionar a planilha, acesse a <strong>Análise da fonte</strong> para confirmar
                      as informações e liberar a análise.
                    </p>
                  </div>
                </div>
              )}

              {/* Estado ACTIVE */}
              {activeItem.status === ImportStatus.ACTIVE && (
                <div className="py-6 text-center space-y-2">
                  <CheckCircle2 size={28} className="text-blue-500 mx-auto" />
                  <p className="font-bold text-slate-600 dark:text-slate-300 text-[11px]">
                    Fonte ativa e disponível para análise.
                  </p>
                </div>
              )}

            </div>
          ) : (
            /* Nenhum item selecionado */
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center">
              <FileSpreadsheet size={32} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400 font-semibold text-xs">
                Selecione um arquivo da fila para configurar o vínculo e as abas.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimpleSpreadsheetImporter;
