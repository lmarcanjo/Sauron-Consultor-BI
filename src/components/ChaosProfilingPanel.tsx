import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  FileSearch,
  Play,
  Save,
  Search,
  Square,
  X,
} from "lucide-react";
import type { ActiveDataset } from "../types/dataSource";
import { activeDatasetStore } from "../core/data/ActiveDatasetStore";
import { getEnterpriseContext } from "../core/enterprise-consolidation/EnterpriseContextStore";
import { identityEngine } from "../core/identity/IdentityEngine";
import {
  chaosProfilingRepository,
  compareChaosSources,
  confirmDatasetView,
  countSelectedPhysicalColumns,
  createDatasetView,
  profileActiveDataset,
  readDatasetViewRows,
  searchPhysicalColumns,
  selectAllPhysicalColumns,
  selectColumnsByType,
  selectColumnsBySuggestion,
  selectVisiblePhysicalColumns,
  generateZcxProposal,
  type ChaosSourceProfile,
  type DatasetView,
  type PhysicalColumnProfile,
  type SuggestionStatus,
  type ZcxProposal,
} from "../core/chaos-data-profiling";
import { ZcxProposalPanel } from "./ZcxProposalPanel";
import { ConsultantDiscoveryPanel } from "./ConsultantDiscoveryPanel";
import { buildSourceDrivenAnalysis } from "../core/chaos-data-profiling";
import { buildConsultantUnderstandingSummary } from "../core/chaos-data-profiling/ConsultantUnderstandingSummary";
import { SourceDrivenInterpretationPanel } from "./SourceDrivenInterpretationPanel";
import { enterpriseDiscoveryEngine } from "../core/enterprise-consolidation/EnterpriseDiscoveryEngine";
import { generateReconciliationProposal } from "../core/enterprise-consolidation/OrganizationalReconciliationEngine";
import { ReconciliationPanel } from "./ReconciliationPanel";

interface ChaosProfilingPanelProps {
  activeDataset?: ActiveDataset | null;
}

interface ProgressState {
  phase: "sampling" | "profiling";
  completed: number;
  total: number;
  message: string;
}

const COLUMN_ROW_HEIGHT = 52;
const COLUMN_VIEWPORT_HEIGHT = 288;

function sourceIdOf(dataset: ActiveDataset | null): string {
  return dataset?.sourceIdentity?.sourceId || dataset?.datasetId || "";
}

function typeLabel(column: PhysicalColumnProfile): string {
  return column.observedTypes.length > 0 ? column.observedTypes.join(", ") : "vazio";
}

function confidenceLabel(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function actorId(): string {
  return identityEngine.getCurrentUser()?.id || "";
}

function actorName(): string {
  return identityEngine.getCurrentUser()?.profile.fullName || "";
}

export const ChaosProfilingPanel: React.FC<ChaosProfilingPanelProps> = ({ activeDataset: activeDatasetProp }) => {
  const [activeDataset, setActiveDataset] = useState<ActiveDataset | null>(activeDatasetProp || activeDatasetStore.getActiveDataset());
  const [profile, setProfile] = useState<ChaosSourceProfile | null>(null);
  const [draftView, setDraftView] = useState<DatasetView | null>(null);
  const [confirmedView, setConfirmedView] = useState<DatasetView | null>(null);
  const [zcxProposalState, setZcxProposalState] = useState<ZcxProposal | null>(null);
  const [viewRows, setViewRows] = useState<Record<string, unknown>[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isProfiling, setIsProfiling] = useState(false);
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [message, setMessage] = useState("");
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState("");
  const [columnSearch, setColumnSearch] = useState("");
  const [columnType, setColumnType] = useState("all");
  const [columnScrollTop, setColumnScrollTop] = useState(0);
  const [labelDrafts, setLabelDrafts] = useState<Record<string, string>>({});
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setActiveDataset(activeDatasetProp || activeDatasetStore.getActiveDataset());
  }, [activeDatasetProp]);

  useEffect(() => activeDatasetStore.subscribe(event => {
    if (event.type === "DATASET_ACTIVATED" || event.type === "DATASET_REHYDRATED" || event.type === "DATASET_REMOVED") {
      setActiveDataset(activeDatasetStore.getActiveDataset());
    }
  }), []);

  useEffect(() => {
    const sourceId = sourceIdOf(activeDataset);
    setProfile(null);
    setDraftView(null);
    setConfirmedView(null);
    setViewRows([]);
    setSelectedColumns([]);
    setSelectedBlockId("");
    setMessage("");
    if (!sourceId) return;
    let mounted = true;
    Promise.all([
      chaosProfilingRepository.getProfile(sourceId),
      chaosProfilingRepository.getLatestDraft(sourceId),
      chaosProfilingRepository.getConfirmedView(sourceId),
      chaosProfilingRepository.getLatestProposal(sourceId),
    ]).then(([savedProfile, savedDraft, savedConfirmed, savedProposal]) => {
      if (!mounted) return;
      setProfile(savedProfile);
      setDraftView(savedDraft);
      setConfirmedView(savedConfirmed);
      setZcxProposalState(savedProposal);
      if (savedProfile) {
        setIsOpen(true);
        setSelectedColumns(savedDraft?.selectedColumns || selectVisiblePhysicalColumns(savedProfile));
      }
      if (savedConfirmed && activeDataset) readDatasetViewRows(activeDataset, savedConfirmed).then(rows => mounted && setViewRows(rows));
    });
    return () => { mounted = false; };
  }, [activeDataset?.datasetId, activeDataset?.sourceIdentity?.sourceId]);

  const selectedBlock = profile?.detectedBlocks.find(block => block.blockId === selectedBlockId) || null;
  const availableColumns = useMemo(() => {
    if (!profile) return [];
    const bySearch = searchPhysicalColumns(profile, columnSearch, selectedBlock?.containerId);
    if (columnType === "all") return bySearch;
    return bySearch.filter(column => column.observedTypes.includes(columnType as PhysicalColumnProfile["observedTypes"][number]));
  }, [profile, columnSearch, columnType, selectedBlock?.containerId]);
  const visibleStart = Math.max(0, Math.floor(columnScrollTop / COLUMN_ROW_HEIGHT) - 3);
  const visibleEnd = Math.min(availableColumns.length, visibleStart + Math.ceil(COLUMN_VIEWPORT_HEIGHT / COLUMN_ROW_HEIGHT) + 6);
  const virtualColumns = availableColumns.slice(visibleStart, visibleEnd);
  const selectedCount = profile ? countSelectedPhysicalColumns(profile, selectedColumns, selectedBlock?.containerId) : 0;
  const totalKnownRows = profile?.physicalContainers.reduce((sum, container) => sum + (container.rowCount || 0), 0) || activeDataset?.rowCount || 0;
  const totalColumns = profile?.physicalColumns.length || activeDataset?.columnCount || 0;
  const progressPercent = progress && progress.total > 0
    ? Math.min(100, Math.round(((progress.completed / progress.total) * 50) + (progress.phase === "profiling" ? 50 : 0)))
    : 0;

  const updateProfile = (next: ChaosSourceProfile | null) => {
    if (next) setProfile(next);
  };

  const runProfiling = async () => {
    if (!activeDataset || isProfiling) return;
    const controller = new AbortController();
    abortRef.current = controller;
    setIsProfiling(true);
    setIsOpen(true);
    setMessage("");
    setProgress({ phase: "sampling", completed: 0, total: Math.max(activeDataset.sheets.length, 1), message: "Preparando amostra limitada..." });
    try {
      const context = getEnterpriseContext();
      const result = await profileActiveDataset(activeDataset, {
        groupId: context.groupId || activeDataset.sourceIdentity?.groupId || "",
        companyId: context.companyId || activeDataset.sourceIdentity?.companyId,
        sourceId: sourceIdOf(activeDataset),
      }, {
        maxRowsPerContainer: 500,
        signal: controller.signal,
        onProgress: setProgress,
      });
      const previousProfiles = await chaosProfilingRepository.listProfiles(result.sourceId);
      const duplicateMatch = previousProfiles
        .map(previous => compareChaosSources(previous, result))
        .find(comparison => comparison.relation === "EXACT_COPY" || comparison.relation === "POSSIBLE_NEW_VERSION");
      await chaosProfilingRepository.saveProfile(result);
      const zcxProposal = generateZcxProposal(result);
      await chaosProfilingRepository.saveProposal(zcxProposal);
      setZcxProposalState(zcxProposal);
      setProfile(result);
      setDraftView(null);
      setConfirmedView(null);
      setSelectedColumns([]);
      setSelectedBlockId("");
      setProgress({ phase: "profiling", completed: 1, total: 1, message: "Análise e proposta ZCX salvas." });
      setMessage(duplicateMatch
        ? "Estrutura analisada. Encontramos uma fonte estruturalmente semelhante; revise antes de salvar outra visão."
        : "Estrutura analisada sem alterar a fonte. Proposta inicial ZCX pronta.");
    } catch (error) {
      if ((error as Error)?.message?.toLowerCase().includes("cancelado")) {
        setMessage("Análise cancelada. Nenhuma alteração foi feita na fonte.");
      } else {
        setMessage(error instanceof Error ? error.message : "Não foi possível analisar a estrutura.");
      }
      setProgress(null);
    } finally {
      abortRef.current = null;
      setIsProfiling(false);
    }
  };

  const cancelProfiling = () => abortRef.current?.abort();

  const chooseAll = () => {
    if (!profile) return;
    setSelectedColumns(selectAllPhysicalColumns(profile, selectedBlock?.containerId));
  };

  const chooseVisible = () => {
    if (!profile) return;
    setSelectedColumns(selectVisiblePhysicalColumns(profile, selectedBlock?.containerId));
  };

  const chooseType = () => {
    if (!profile || columnType === "all") return;
    setSelectedColumns(selectColumnsByType(profile, columnType as PhysicalColumnProfile["observedTypes"][number], selectedBlock?.containerId));
  };

  const chooseBlock = (blockId: string) => {
    setSelectedBlockId(blockId);
    const block = profile?.detectedBlocks.find(item => item.blockId === blockId);
    if (block && profile) setSelectedColumns(selectColumnsBySuggestion(profile, "metric", block.containerId).length > 0 ? block.proposedColumns : selectAllPhysicalColumns(profile, block.containerId));
  };

  const toggleColumn = (column: string) => {
    setSelectedColumns(current => current.includes(column) ? current.filter(item => item !== column) : [...current, column]);
  };

  const saveDraft = async (columnsOverride?: string[]) => {
    if (!profile) return;
    const columnsToSave = columnsOverride || selectedColumns;
    if (columnsToSave.length === 0) return;
    const containerId = selectedBlock?.containerId || profile.physicalContainers[0]?.id || "";
    const selectedProfiles = profile.physicalColumns.filter(column => columnsToSave.includes(column.physicalName));
    const view = createDatasetView({
      profile,
      containerIds: [containerId],
      blockIds: selectedBlock ? [selectedBlock.blockId] : [],
      selectedColumns: columnsToSave,
      selectedRowsRule: selectedBlock ? `Linhas DATA do bloco ${selectedBlock.startRow}-${selectedBlock.endRow}` : "Linhas selecionadas pelo consultor",
      rowSelection: selectedBlock ? {
        containerId,
        startRow: selectedBlock.startRow,
        endRow: selectedBlock.endRow,
        rowIndexes: selectedBlock.dataRows,
      } : undefined,
      inferredTypes: Object.fromEntries(selectedProfiles.map(column => [column.physicalName, column.observedTypes[0] || "unknown"])),
      now: new Date().toISOString(),
    });
    await chaosProfilingRepository.saveView(view);
    setDraftView(view);
    setConfirmedView(null);
    setMessage("Rascunho salvo. Revise e confirme conscientemente para liberar a tabela estruturada.");
  };

  const confirmDraft = async () => {
    if (!draftView) return;
    const user = actorId();
    if (!user) {
      setMessage("É necessário estar em uma sessão de consultor para confirmar a visão.");
      return;
    }
    const confirmed = confirmDatasetView(draftView, user);
    await chaosProfilingRepository.saveView(confirmed);
    setConfirmedView(confirmed);
    if (activeDataset) setViewRows(await readDatasetViewRows(activeDataset, confirmed));
    setMessage(`Visão confirmada por ${actorName() || "a sessão atual"}. A tabela usa somente as colunas escolhidas.`);
  };

  const updateBlock = async (blockId: string, status: SuggestionStatus) => {
    if (!profile) return;
    const updated = await chaosProfilingRepository.updateBlockStatus(profile.profileId, blockId, status, actorId());
    updateProfile(updated);
  };

  const updateSuggestion = async (suggestionId: string, status: SuggestionStatus) => {
    if (!profile) return;
    const updated = await chaosProfilingRepository.updateSuggestionStatus(profile.profileId, suggestionId, status, actorId(), labelDrafts[suggestionId]);
    updateProfile(updated);
  };

  if (!activeDataset) return null;

  return (
    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-4" data-testid="chaos-profiling-panel">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-300"><FileSearch size={18} /></div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Análise da fonte</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Compreenda e confirme os campos encontrados antes de realizar análises.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isProfiling ? (
            <button type="button" onClick={cancelProfiling} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-rose-200 text-rose-700 dark:text-rose-300 text-xs font-bold" data-testid="chaos-cancel">
              <Square size={13} /> Cancelar
            </button>
          ) : (
            <button type="button" onClick={runProfiling} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black" data-testid="chaos-analyze">
              <Play size={13} /> Analisar estrutura
            </button>
          )}
          {profile && <button type="button" onClick={() => setIsOpen(open => !open)} className="p-2 rounded-lg border border-slate-200 dark:border-slate-700" aria-label="Abrir resultados da análise">
            <ChevronDown size={15} className={isOpen ? "rotate-180" : ""} />
          </button>}
        </div>
      </div>

      {isProfiling && progress && (
        <div className="space-y-2" role="status" data-testid="chaos-progress">
          <div className="flex justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300"><span>{progress.message}</span><span>{progressPercent}%</span></div>
          <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden"><div className="h-full bg-indigo-500 transition-all" style={{ width: `${progressPercent}%` }} /></div>
          <p className="text-[10px] text-slate-400">Amostra limitada; a origem permanece intacta.</p>
        </div>
      )}
      {message && <p className="text-xs font-semibold text-slate-600 dark:text-slate-300" role="status">{message}</p>}

      {profile && (
        <ConsultantDiscoveryPanel
          summary={buildConsultantUnderstandingSummary(
            profile,
            buildSourceDrivenAnalysis(profile),
            zcxProposalState || undefined
          )}
          enterpriseModel={enterpriseDiscoveryEngine.discoverOrganization(
            profile,
            buildSourceDrivenAnalysis(profile)
          )}
          onAcceptSuggestedStructure={() => {
            const highConfNames = zcxProposalState?.fieldProposals
              .filter(f => f.autoSelected)
              .map(f => f.physicalName) || [];
            const targetCols = highConfNames.length > 0 ? highConfNames : selectVisiblePhysicalColumns(profile);
            setSelectedColumns(targetCols);
            saveDraft(targetCols);
          }}
          onReviewInterpretations={() => setIsOpen(true)}
          onKeepOriginalNames={() => {
            const allCols = selectAllPhysicalColumns(profile);
            setSelectedColumns(allCols);
            saveDraft(allCols);
          }}
          onConfirmSourceUnderstanding={async () => {
            if (profile) {
              const allCols = selectAllPhysicalColumns(profile);
              setSelectedColumns(allCols);
              await saveDraft(allCols);
              if (draftView) {
                await confirmDatasetView(draftView);
                setMessage("Fonte confirmada para análises.");
              }
            }
          }}
          onGoToAnalysis={() => {
            const allCols = selectAllPhysicalColumns(profile);
            setSelectedColumns(allCols);
            saveDraft(allCols);
          }}
        />
      )}

      {profile && (
        <ReconciliationPanel
          proposal={generateReconciliationProposal(
            profile,
            enterpriseDiscoveryEngine.discoverOrganization(profile),
            {
              groupId: activeDataset?.context?.groupId || null,
              companyId: activeDataset?.context?.companyId || null,
              unitId: activeDataset?.context?.unitId || null,
            }
          )}
          onConfirmReconciliation={(creations, assoc) => {
            setMessage("Reconciliação organizacional aprovada com sucesso.");
          }}
          onKeepUnreconciled={() => {
            setMessage("Mantido empresa independente sem vínculo.");
          }}
        />
      )}

      {zcxProposalState && (
        <ZcxProposalPanel
          proposal={zcxProposalState}
          onAcceptSuggested={() => {
            if (profile) {
              const highConfNames = zcxProposalState.fieldProposals
                .filter(f => f.autoSelected)
                .map(f => f.physicalName);
              const targetCols = highConfNames.length > 0 ? highConfNames : selectVisiblePhysicalColumns(profile);
              setSelectedColumns(targetCols);
              saveDraft(targetCols);
            }
          }}
          onReviewQuestions={() => setIsOpen(true)}
          onKeepOriginalNames={() => {
            if (profile) {
              const allCols = selectAllPhysicalColumns(profile);
              setSelectedColumns(allCols);
              saveDraft(allCols);
            }
          }}
          onOpenAdvancedConfig={() => setIsOpen(true)}
        />
      )}

      {profile && isOpen && (
        <div className="space-y-5 border-t border-slate-100 dark:border-slate-800 pt-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
            {[
              ["Fonte", profile.sourceName],
              ["Linhas conhecidas", totalKnownRows.toLocaleString("pt-BR")],
              ["Linhas amostradas", profile.sampledRecords.toLocaleString("pt-BR")],
              ["Colunas encontradas", totalColumns.toLocaleString("pt-BR")],
              ["Blocos sugeridos", profile.detectedBlocks.length.toLocaleString("pt-BR")],
            ].map(([label, value]) => <div key={label} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800"><span className="block text-[10px] uppercase font-bold text-slate-400">{label}</span><strong className="block mt-1 text-slate-800 dark:text-slate-100 truncate">{value}</strong></div>)}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between"><h4 className="text-xs font-black uppercase tracking-wide text-slate-700 dark:text-slate-200">Blocos encontrados</h4><span className="text-[10px] text-slate-400">Ações ficam registradas</span></div>
            {profile.detectedBlocks.length === 0 && <p className="text-xs text-slate-500">Nenhum bloco foi sugerido nesta amostra.</p>}
            {profile.detectedBlocks.map(block => (
              <div key={block.blockId} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2"><div><p className="text-xs font-black text-slate-800 dark:text-white">{block.titleSuggestion || "Bloco sem título"}</p><p className="text-[10px] text-slate-500">Linhas {block.startRow}–{block.endRow} · {block.dataRows.length} dados · confiança {confidenceLabel(block.confidence)}</p><p className="text-[10px] text-slate-500">Cabeçalho: {block.headerRows.length > 0 ? block.headerRows.join(", ") : "não identificado"}</p></div><span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-300">{block.status}</span></div>
                <p className="text-[10px] text-slate-500">{block.evidence.join(" ")}</p>
                <div className="flex flex-wrap gap-2"><button type="button" onClick={() => chooseBlock(block.blockId)} className="px-2.5 py-1.5 rounded border border-indigo-200 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold">Usar este bloco</button><button type="button" onClick={() => updateBlock(block.blockId, "CONFIRMED")} className="px-2.5 py-1.5 rounded border border-emerald-200 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold"><Check size={12} className="inline mr-1" />Confirmar</button><button type="button" onClick={() => { chooseBlock(block.blockId); updateBlock(block.blockId, "EDITED"); }} className="px-2.5 py-1.5 rounded border border-slate-200 text-slate-600 dark:text-slate-300 text-[10px] font-bold">Editar seleção</button><button type="button" onClick={() => updateBlock(block.blockId, "IGNORED")} className="px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-800 text-slate-500 text-[10px] font-bold"><X size={12} className="inline mr-1" />Ignorar</button></div>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2"><h4 className="text-xs font-black uppercase tracking-wide text-slate-700 dark:text-slate-200">Colunas encontradas</h4><span className="text-[10px] text-slate-400">{selectedCount} selecionada(s) de {availableColumns.length} visíveis</span></div>
            <div className="flex flex-wrap gap-2"><button type="button" onClick={chooseAll} className="px-2.5 py-1.5 rounded border border-indigo-200 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold">Selecionar todas</button><button type="button" onClick={() => setSelectedColumns([])} className="px-2.5 py-1.5 rounded border border-slate-200 text-slate-600 dark:text-slate-300 text-[10px] font-bold">Limpar seleção</button><button type="button" onClick={chooseVisible} className="px-2.5 py-1.5 rounded border border-slate-200 text-slate-600 dark:text-slate-300 text-[10px] font-bold">Selecionar visíveis</button><button type="button" onClick={chooseType} disabled={columnType === "all"} className="px-2.5 py-1.5 rounded border border-slate-200 text-slate-600 dark:text-slate-300 text-[10px] font-bold disabled:opacity-40">Selecionar por tipo</button></div>
            <div className="flex flex-col md:flex-row gap-2"><label className="relative flex-1"><Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" /><input value={columnSearch} onChange={event => setColumnSearch(event.target.value)} placeholder="Buscar coluna" className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs" /></label><select value={columnType} onChange={event => setColumnType(event.target.value)} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"><option value="all">Todos os tipos</option><option value="text">Texto</option><option value="number">Número</option><option value="date">Data</option><option value="boolean">Booleano</option><option value="object">Objeto</option></select></div>
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-auto" style={{ height: COLUMN_VIEWPORT_HEIGHT }} onScroll={event => setColumnScrollTop(event.currentTarget.scrollTop)} data-testid="chaos-column-selector">
              <div style={{ height: availableColumns.length * COLUMN_ROW_HEIGHT, position: "relative" }}>
                <div style={{ transform: `translateY(${visibleStart * COLUMN_ROW_HEIGHT}px)` }}>
                  {virtualColumns.map(column => <label key={`${column.containerId}:${column.physicalName}`} className="flex items-center gap-3 px-3 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950" style={{ height: COLUMN_ROW_HEIGHT }}><input type="checkbox" checked={selectedColumns.includes(column.physicalName)} onChange={() => toggleColumn(column.physicalName)} /><span className="font-mono text-xs text-slate-800 dark:text-slate-100 flex-1 truncate" title={column.physicalName}>{column.physicalName}</span><span className="text-[10px] text-slate-500">{typeLabel(column)}</span>{column.examples.length > 0 && <span className="max-w-28 truncate text-[10px] text-slate-400" title={column.examples.join(" · ")}>Ex: {String(column.examples[0])}</span>}<span className="text-[10px] text-slate-400">{Math.round((1 - column.emptyPercentage) * 100)}%</span></label>)}
                </div>
              </div>
            </div>
            {selectedBlock && <p className="text-[10px] text-indigo-600 dark:text-indigo-300">Bloco selecionado: linhas {selectedBlock.startRow}–{selectedBlock.endRow}. A escolha será registrada na view.</p>}
          </div>

          <div className="space-y-3"><div className="flex items-center justify-between"><h4 className="text-xs font-black uppercase tracking-wide text-slate-700 dark:text-slate-200">Sugestões de significado</h4><span className="text-[10px] text-slate-400">O nome original é preservado</span></div>{profile.semanticSuggestions.slice(0, 120).map(suggestion => <div key={suggestion.id} className="flex flex-col md:flex-row md:items-center gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800"><div className="flex-1"><p className="font-mono text-xs text-slate-800 dark:text-slate-100">{suggestion.physicalColumns.join(", ")}</p><p className="text-[10px] text-slate-500">Sugestão de interpretação: {suggestion.suggestedRole} · confiança {confidenceLabel(suggestion.confidence)}</p>{suggestion.warnings.map(warning => <p key={warning} className="text-[10px] text-amber-700 dark:text-amber-300"><AlertTriangle size={11} className="inline mr-1" />{warning}</p>)}</div><input value={labelDrafts[suggestion.id] ?? suggestion.suggestedLabel} onChange={event => setLabelDrafts(current => ({ ...current, [suggestion.id]: event.target.value }))} aria-label={`Nome de exibição de ${suggestion.physicalColumns[0]}`} className="px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs md:w-36" /><button type="button" onClick={() => updateSuggestion(suggestion.id, "CONFIRMED")} className="px-2 py-1.5 rounded border border-emerald-200 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">Aceitar</button><button type="button" onClick={() => updateSuggestion(suggestion.id, "REJECTED")} className="px-2 py-1.5 rounded border border-rose-200 text-rose-700 dark:text-rose-300 text-[10px] font-bold">Rejeitar</button><button type="button" onClick={() => updateSuggestion(suggestion.id, "IGNORED")} className="px-2 py-1.5 rounded border border-slate-200 text-slate-600 dark:text-slate-300 text-[10px] font-bold">Sem significado</button></div>)}</div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-lg border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/20"><div><p className="text-xs font-black text-indigo-900 dark:text-indigo-200">Confirmar visão da fonte</p><p className="text-[10px] text-indigo-700 dark:text-indigo-300 mt-1">Salve uma revisão preliminar e confirme para liberar a estrutura de análises.</p></div><button type="button" onClick={saveDraft} disabled={selectedColumns.length === 0} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-black disabled:opacity-40"><Save size={13} />Salvar revisão</button></div>

          {draftView && draftView.status === "DRAFT" && <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/60 dark:bg-amber-950/20 dark:border-amber-900/50 flex flex-col md:flex-row md:items-center justify-between gap-3"><div><p className="text-xs font-black text-amber-900 dark:text-amber-200">Revisão aguardando confirmação</p><p className="text-[10px] text-amber-800 dark:text-amber-300">{draftView.selectedColumns.length} campos selecionados · confirme para utilizar esta visão.</p></div><button type="button" onClick={confirmDraft} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-black"><Check size={13} />Confirmar visão</button></div>}

          {confirmedView && <div className="space-y-3 p-3 rounded-lg border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-900/50"><div><p className="text-xs font-black text-emerald-900 dark:text-emerald-200">Estrutura confirmada</p><p className="text-[10px] text-emerald-800 dark:text-emerald-300">{confirmedView.selectedColumns.length} campos selecionados · pronta para análises.</p></div><div className="overflow-auto border border-emerald-200/70 dark:border-emerald-900/60 rounded-lg max-h-72"><table className="min-w-full text-[10px] text-left"><thead><tr className="bg-emerald-100/60 dark:bg-emerald-950/50">{confirmedView.selectedColumns.map(column => <th key={column} className="px-2 py-2 font-mono whitespace-nowrap">{confirmedView.consultantLabels[column] || column}</th>)}</tr></thead><tbody>{viewRows.map((row, index) => <tr key={`${confirmedView.datasetViewId}:${index}`} className="border-t border-emerald-200/50 dark:border-emerald-900/50">{confirmedView.selectedColumns.map(column => <td key={`${confirmedView.datasetViewId}:${index}:${column}`} className="px-2 py-1.5 font-mono whitespace-nowrap">{String(row[column] ?? "")}</td>)}</tr>)}{viewRows.length === 0 && <tr><td colSpan={Math.max(1, confirmedView.selectedColumns.length)} className="px-3 py-6 text-center">Nenhuma linha disponível na página selecionada.</td></tr>}</tbody></table></div><p className="text-[10px] text-emerald-800 dark:text-emerald-300">Esta tabela utiliza a estrutura confirmada. A planilha original permanece intacta.</p></div>}

          {profile.qualityFindings.length > 0 && <div className="space-y-2"><h4 className="text-xs font-black uppercase tracking-wide text-slate-700 dark:text-slate-200">Achados de qualidade</h4><div className="grid md:grid-cols-2 gap-2">{profile.qualityFindings.slice(0, 12).map(finding => <div key={finding.id} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800"><p className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-200">{finding.code} · {finding.severity}</p><p className="text-[10px] text-slate-500 mt-1">{finding.message}</p></div>)}</div></div>}
        </div>
      )}
    </section>
  );
};

export default ChaosProfilingPanel;
