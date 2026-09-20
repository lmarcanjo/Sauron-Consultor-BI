/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * CentralDadosTab.tsx — Central de Fontes do Consultor.
 * Totalmente derivado de estados reais, sem mocks, painéis técnicos ou VPNs na interface permanente.
 */

import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  Database, Shield, Network, FileSpreadsheet, Shuffle, Filter, Lock, 
  CheckCircle2, RefreshCw, Plus, Play, Trash2, Server, 
  ChevronRight, ChevronDown, UserCheck, ShieldAlert, FileText, AlertTriangle, 
  Settings2, FolderOpen, Clock, Search, Archive, RotateCcw, Building, Move, Eye, Trash, CheckSquare, X, HelpCircle
} from "lucide-react";
import { LancamentoFinanceiro, FiltrosDashboard } from "../types";
import { DatabaseConnector, DatabaseDataLoadedHandler } from "./DatabaseConnector";
import { SimpleSpreadsheetImporter } from "./spreadsheet/SimpleSpreadsheetImporter";
import { getActiveColumns, getPreviewRows } from "../core/data/activeDatasetView";
import { buildWorkbookOverview, WorkbookOverview } from "../core/data/businessViews";
import { activeDatasetStore } from "../core/data/ActiveDatasetStore";
import { spreadsheetStorageAdapter } from "../core/storage/IndexedSpreadsheetStorageAdapter";
import { getEnterpriseContext, setEnterpriseContext, subscribeEnterpriseContext } from "../core/enterprise-consolidation/EnterpriseContextStore";
import { enterpriseConsolidationService } from "../core/enterprise-consolidation";
import { activateImportedSources } from "../core/data/DataActivation";
import { workbookRepository as libraryWorkbookRepository } from "../core/workbook-library/WorkbookRepository";
import { enterpriseRepository, SourceEnterpriseBinding, BusinessGroup, Company, Unit } from "../core/persistence/EnterpriseRepository";
import { DataSource } from "../core/datasource/DataSource";
import { timelineRepository } from "../core/persistence/TimelineRepository";
import { identityEngine } from "../core/identity/IdentityEngine";
import { workspaceIntelligenceEngine } from "../core/workspace-intelligence/WorkspaceIntelligenceEngine";
import { showToast } from "./Toast";
import { EnterpriseTimeline } from "./EnterpriseTimeline";
import { getDomainDisplayLabel, getDomainDisplayOptions } from "../core/business-domains";
import { repairLegacyLocalState } from "../core/migrations/LegacyLocalStateRepairService";
import { ChaosProfilingPanel } from "./ChaosProfilingPanel";
import { consultantWorkspaceManager } from "../modules/consultant-workspace/ConsultantWorkspaceManager";

interface CentralDadosTabProps {
  dataOrigem: LancamentoFinanceiro[];
  onDataLoaded: DatabaseDataLoadedHandler;
  currentSource: string;
  sharedFiles?: File[] | null;
  camposAusentes: string[];
  filtros?: FiltrosDashboard;
  visibleFilters?: string[];
  fieldMappings?: Record<string, string>;
  initialStep?: number;
  onOpenExecutiveSummary?: () => void;
  onOpenExecutiveDashboard?: () => void;
  onGenerateExecutivePresentation?: () => void;
  onAnalysisCompleted?: (artifact: import("../core/preliminary-analysis/PreliminaryFinancialAnalysisContracts").PreliminaryFinancialAnalysisArtifact) => void | Promise<void>;
}

export const CentralDadosTab: React.FC<CentralDadosTabProps> = ({
  dataOrigem,
  onDataLoaded,
  currentSource,
  sharedFiles,
  camposAusentes,
  filtros = { grupos: [], cnpjs: [], marcas: [], meses: [], razoes: [] },
  visibleFilters = [],
  fieldMappings = {},
  initialStep = 0,
  onOpenExecutiveSummary,
  onOpenExecutiveDashboard,
  onGenerateExecutivePresentation,
  onAnalysisCompleted,
}) => {
  // Tabs Selection:
  // 0: Saúde da fonte
  // 1: Fontes persistidas
  // 2: Timeline Empresarial
  const [activeTab, setActiveTab] = useState<number>(initialStep);

  const [displayHistory, setDisplayHistory] = useState(() => {
    if (typeof localStorage !== "undefined") {
      return localStorage.getItem("sauron_display_activity_history") === "true";
    }
    return false;
  });

  useEffect(() => {
    const handlePref = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && typeof detail.displayActivityHistory === "boolean") {
        setDisplayHistory(detail.displayActivityHistory);
      }
    };
    window.addEventListener("sauron:preference-updated", handlePref);
    return () => {
      window.removeEventListener("sauron:preference-updated", handlePref);
    };
  }, []);

  useEffect(() => {
    if (!displayHistory && activeTab === 2) {
      setActiveTab(0);
    }
  }, [displayHistory, activeTab]);

  const steps = useMemo(() => {
    const list = [
      { id: 0, title: "Saúde da fonte", desc: "Métricas e estrutura encontrada", icon: Database },
      { id: 1, title: "Fontes de dados", desc: "Importar, ativar e organizar fontes", icon: FolderOpen }
    ];
    if (displayHistory) {
      list.push({ id: 2, title: "Timeline Empresarial", desc: "Histórico de Eventos Reais", icon: Clock });
    }
    return list;
  }, [displayHistory]);

  const [activeDataset, setActiveDataset] = useState(activeDatasetStore.getActiveDataset());
  const [libraryTick, setLibraryTick] = useState(0);

  useEffect(() => activeDatasetStore.subscribe(() => {
    setActiveDataset(activeDatasetStore.getActiveDataset());
  }), []);

  // Modals / Overlays States
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const directFileInputRef = useRef<HTMLInputElement>(null);
  const [isDbConnectorOpen, setIsDbConnectorOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewWb, setPreviewWb] = useState<any | null>(null);
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [isLinkOpen, setIsLinkOpen] = useState(false);
  const [linkWb, setLinkWb] = useState<any | null>(null);
  const [linkTargetCompanyId, setLinkTargetCompanyId] = useState("");
  const [isMoveBatchOpen, setIsMoveBatchOpen] = useState(false);
  const [batchTargetCompanyId, setBatchTargetCompanyId] = useState("");
  const [localRepairMessage, setLocalRepairMessage] = useState<string | null>(null);

  useEffect(() => {
    const receiveFiles = (event: Event) => {
      const files = (event as CustomEvent<{ files?: File[] }>).detail?.files || [];
      if (files.length === 0) return;
      setPendingFiles(files);
      setIsUploaderOpen(true);
    };
    window.addEventListener("sauron:spreadsheet-files-selected", receiveFiles);
    return () => window.removeEventListener("sauron:spreadsheet-files-selected", receiveFiles);
  }, []);

  // The shared header keeps the selected File objects as props while this
  // route mounts. This closes the handoff race where a one-shot window event
  // could fire before the importer listener was attached.
  useEffect(() => {
    if (!sharedFiles || sharedFiles.length === 0) return;
    setPendingFiles(sharedFiles);
    setIsUploaderOpen(true);
  }, [sharedFiles]);

  // Enterprise / Context structures state
  const [groups, setGroups] = useState<BusinessGroup[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [units, setUnitList] = useState<Unit[]>([]);
  const [sourceBindings, setSourceBindings] = useState<SourceEnterpriseBinding[]>([]);
  const [scopedDataSources, setScopedDataSources] = useState<DataSource[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<any>(null);
  const [activeEngagementId, setActiveEngagementId] = useState<string | undefined>();

  // Subscribe to context updates
  const [contextTick, setContextTick] = useState(0);
  useEffect(() => {
    const unsubscribe = subscribeEnterpriseContext(() => {
      setContextTick(t => t + 1);
    });
    return unsubscribe;
  }, []);

  const activeGroup = useMemo(() => {
    const context = getEnterpriseContext();
    return groups.find(g => g.id === context.groupId);
  }, [groups, contextTick]);

  const activeCompany = useMemo(() => {
    const context = getEnterpriseContext();
    return companies.find(c => c.id === context.companyId);
  }, [companies, contextTick]);

  const activeUnit = useMemo(() => {
    const context = getEnterpriseContext();
    return units.find(u => u.id === context.unitId);
  }, [units, contextTick]);

  // Biblioteca Search & Filter states
  const [searchText, setSearchText] = useState("");
  const [filterGroup, setFilterGroup] = useState("");
  const [filterCompany, setFilterCompany] = useState("");
  const [filterUnit, setFilterUnit] = useState("");
  const [filterSegment, setFilterSegment] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [selectedWbIds, setSelectedWbIds] = useState<string[]>([]);

  // Load context structures
  const loadData = React.useCallback(async () => {
    const activeEngagement = await consultantWorkspaceManager.getActiveProject();
    setActiveEngagementId(activeEngagement?.id);
    const organizationService = consultantWorkspaceManager.organizationService;
    const nextGroups = activeEngagement
      ? await organizationService.listGroupsByEngagement(activeEngagement.id, identityEngine.getCurrentUser())
      : [];
    const nextCompanies: Company[] = [];
    const nextUnits: Unit[] = [];
    for (const group of nextGroups) {
      const groupCompanies = await organizationService.listCompaniesByGroup(group.id, identityEngine.getCurrentUser());
      nextCompanies.push(...groupCompanies);
      for (const company of groupCompanies) {
        nextUnits.push(...await organizationService.listUnitsByCompany(company.id, identityEngine.getCurrentUser()));
      }
    }
    setGroups(nextGroups);
    setCompanies(nextCompanies);
    setUnitList(nextUnits);
    setSourceBindings(await enterpriseRepository.listSourceBindings());
    setScopedDataSources(activeEngagement
      ? await consultantWorkspaceManager.dataSourceService.listDataSourcesByEngagement(activeEngagement.id, identityEngine.getCurrentUser())
      : []);

    const activeWs = identityEngine.getCurrentWorkspace() as any;
    if (activeWs) {
      const allWss = workspaceIntelligenceEngine.getWorkspaceRegistry().workspaces;
      setCurrentWorkspace(allWss[activeWs.id] || activeWs);
    }
  }, []);

  useEffect(() => {
    loadData();
    // Align active tab with initialStep updates if triggered from external components
    setActiveTab(initialStep);
  }, [loadData, initialStep]);

  // Compute visible files list dynamically
  const visibleFilesList = useMemo(() => {
    const libraryFiles = libraryWorkbookRepository.listWorkbooks({ includeArchived: true }).map(workbook => {
      const version = libraryWorkbookRepository.getCurrentVersion(workbook.id);
      const dataset = version?.activeDataset;
      return {
        id: workbook.id,
        name: workbook.name,
        size: 0,
        sheets: dataset?.sheets.map(sheet => typeof sheet === "string" ? sheet : sheet.sheetName) || [],
        date: workbook.importedAt.split("T")[0],
        status: workbook.status === "ARCHIVED" ? "INACTIVE" : "ACTIVE",
        version: version?.label || "v1",
        qualityScore: 100,
        qualityLabel: "Pronto para leitura",
        totalRows: dataset?.rowCount || version?.rowCount || 0,
        totalColumns: dataset?.columnCount || version?.columnCount || 0,
        totalAbas: dataset?.sheets.length || version?.sheetCount || 0,
        approvedByConsultant: true,
        importedBy: "Consultor",
        importedAt: workbook.importedAt,
        sheetsData: [],
      };
    });
    const byId = new Map(libraryFiles.map(file => [file.id, file]));
    const sourceIds = new Set(scopedDataSources.map(source => source.id));
    const scopedWorkbookIds = new Set(
      sourceBindings
        .filter(binding => sourceIds.has(binding.sourceId) || sourceIds.has(binding.datasetId) || sourceIds.has(binding.workbookId))
        .map(binding => binding.workbookId)
    );
    if (!activeEngagementId) return [];
    return Array.from(byId.values()).filter(file => scopedWorkbookIds.has(file.id));
  }, [libraryTick, contextTick, activeEngagementId, scopedDataSources, sourceBindings]);

  const bindingFor = (workbookId: string) => sourceBindings.find(binding => binding.workbookId === workbookId || binding.sourceId === workbookId);
  const linkedCompanyFor = (workbookId: string) => {
    const binding = bindingFor(workbookId);
    return companies.find(company => company.id === binding?.companyId);
  };
  const linkedUnitFor = (workbookId: string) => {
    const binding = bindingFor(workbookId);
    return units.find(unit => unit.id === binding?.unitId);
  };

  // Active files subset based on EnterpriseContext selection
  const activeFiles = useMemo(() => {
    const context = getEnterpriseContext();
    const selectedWbIds = context.workbookIds?.length
      ? context.workbookIds
      : activeDatasetStore.getActiveDataset()?.sourceWorkbookIds || [];
    return visibleFilesList.filter(f => selectedWbIds.includes(f.id));
  }, [contextTick, visibleFilesList]);

  // Visual Audit checks for each workbook
  const auditWorkbook = (f: any) => {
    const warnings: string[] = [];
    if (f.status === "PENDING_MAPPING") warnings.push("Mapeamento pendente");
    
    // Check company link
    const linkedCompany = linkedCompanyFor(f.id);
    if (!linkedCompany) warnings.push("Empresa não vinculada");

    // Check unit link
    const linkedUnit = linkedUnitFor(f.id);
    if (!linkedUnit && linkedCompany && linkedCompany.unitIds?.length > 0) warnings.push("Unidade ausente");

    // Check segment
    const segment = (linkedCompany && (linkedCompany as any).segment) || "neutral";
    if (segment === "neutral" || segment === "unknown") warnings.push("Segmento indefinido");

    // Check domain conflict
    const detected = f.detectedDomain || "neutral";
    if (detected !== "neutral" && segment !== "neutral" && detected !== segment) {
      warnings.push("Domínio conflitante");
    }

    return {
      status: warnings.length === 0 ? "OK" : "WARNING",
      warnings
    };
  };

  // HEALTH AUDITS METRICS
  const healthMetrics = useMemo(() => {
    let validCount = 0;
    let incompleteCount = 0;
    let pendingMappingCount = 0;
    let missingRequiredFieldsCount = 0;
    const allProblems: string[] = [];

    activeFiles.forEach(f => {
      const audit = auditWorkbook(f);
      if (audit.status === "OK") {
        validCount++;
      } else {
        incompleteCount++;
        audit.warnings.forEach(w => {
          if (!allProblems.includes(w)) allProblems.push(w);
          if (w === "Mapeamento pendente") pendingMappingCount++;
          if (w === "Empresa não vinculada" || w === "Unidade ausente") missingRequiredFieldsCount++;
        });
      }
    });

    return {
      validCount,
      incompleteCount,
      pendingMappingCount,
      missingRequiredFieldsCount,
      problems: allProblems
    };
  }, [activeFiles, companies, units]);

  // ASSISTENT OPERATIONAL TASKS
  const assistantTasks = useMemo(() => {
    const tasks: any[] = [];
    const context = getEnterpriseContext();
    const currentSegment = currentWorkspace?.manualDomain || currentWorkspace?.detectedDomain || "neutral";

    if (groups.length === 0) {
      tasks.push({
        id: "group",
        problem: "Nenhum Grupo empresarial cadastrado",
        impact: "Impossibilita análises consolidadas de grupo empresarial.",
        solution: "Cadastre o grupo proprietário no painel corporativo.",
        actionLabel: "Abrir Empresas e Grupos",
        actionTab: "enterprise_center"
      });
    }

    if (companies.length === 0) {
      tasks.push({
        id: "company",
        problem: "Nenhuma Empresa cadastrada no sistema",
        impact: "Os dados não podem ser divididos por marcas ou estabelecimentos.",
        solution: "Cadastre as empresas e grupos reais em Empresas e Grupos.",
        actionLabel: "Abrir Empresas e Grupos",
        actionTab: "enterprise_center"
      });
    }

    if (visibleFilesList.length === 0) {
      tasks.push({
        id: "spreadsheets",
        problem: "Nenhuma planilha importada no projeto",
        impact: "Os relatórios operacionais e DRE estão vazios.",
        solution: "Importe uma planilha de lançamentos contábeis reais (.csv, .xlsx).",
        actionLabel: "Importar Nova Fonte",
        triggerAction: () => setIsUploaderOpen(true)
      });
    }

    if (activeFiles.length === 0 && visibleFilesList.length > 0) {
      tasks.push({
        id: "active_sources",
        problem: "Nenhuma fonte de dados selecionada como ativa",
        impact: "O DRE e painéis não mostram resultados por falta de seleção.",
        solution: "Abra Fontes persistidas e ative as fontes desejadas para a análise.",
        actionLabel: "Ir para Fontes",
        actionTabIdx: 1
      });
    }

    if (activeFiles.some(f => f.status === "PENDING_MAPPING")) {
      tasks.push({
        id: "mapping",
        problem: "Existem colunas pendentes de mapeamento de campos",
        impact: "Receitas, custos e despesas não são somados adequadamente no DRE.",
        solution: "Abra Análise da fonte e confirme as informações encontradas.",
        actionLabel: "Ajustar Mapeamentos",
        actionTabIdx: 0
      });
    }

    if (currentSegment === "neutral" || currentSegment === "unknown") {
      tasks.push({
        id: "segment",
        problem: "Segmento de atuação indefinido (Neutro/Geral)",
        impact: "Regras de EBITDA e fórmulas financeiras operam com termos genéricos.",
        solution: "O segmento é opcional e pode ser definido em Empresas e Grupos.",
        actionLabel: "Definir Segmento",
        actionTab: "enterprise_center"
      });
    }

    return tasks;
  }, [groups, companies, visibleFilesList, activeFiles, currentWorkspace]);

  // BIBLIOTECA LIST FILTERING
  const filteredLibrary = useMemo(() => {
    return visibleFilesList.filter(f => {
      // 1. Text search
      if (searchText && !f.name.toLowerCase().includes(searchText.toLowerCase())) return false;
      
      // Lookups for filters
      const linkedCompany = linkedCompanyFor(f.id);
      const linkedGroup = linkedCompany ? groups.find(g => g.id === linkedCompany.parentId) : null;
      const linkedUnit = linkedUnitFor(f.id);
      const segment = (linkedCompany && (linkedCompany as any).segment) || "neutral";

      // 2. Filters matches
      if (filterGroup && (!linkedGroup || linkedGroup.id !== filterGroup)) return false;
      if (filterCompany && (!linkedCompany || linkedCompany.id !== filterCompany)) return false;
      if (filterUnit && (!linkedUnit || linkedUnit.id !== filterUnit)) return false;
      if (filterSegment && segment !== filterSegment) return false;
      if (filterStatus && f.status !== filterStatus) return false;

      return true;
    });
  }, [visibleFilesList, searchText, filterGroup, filterCompany, filterUnit, filterSegment, filterStatus, companies, groups, units, sourceBindings]);

  // SINGLE WORKBOOK ACTIONS
  const handleOpenWorkbook = async (wbId: string) => {
    const context = getEnterpriseContext();
    const binding = bindingFor(wbId);
    const bindingScope = binding?.scopeType || (binding?.unitId ? "UNIT" : binding?.companyId ? "COMPANY" : "GROUP");
    const sourceContext = binding
      ? {
          ...context,
          workspaceId: binding.workspaceId || context.workspaceId,
          groupId: binding.groupId,
          companyId: binding.companyId,
          unitId: binding.unitId,
          scope: bindingScope as "GROUP" | "COMPANY" | "UNIT",
        }
      : context;
    try {
      await activateImportedSources({
        workbookIds: [wbId],
        datasetIds: [wbId],
        enterpriseContext: {
          ...sourceContext,
          workbookIds: [wbId],
          datasetIds: [wbId]
        }
      });
      const name = visibleFilesList.find(f => f.id === wbId)?.name || wbId;
      await timelineRepository.log("ACTIVATE", "Planilha ativada como fonte única", name);
      showToast("success", "Fonte carregada e ativada.");
      setLibraryTick(value => value + 1);
    } catch (e: any) {
      showToast("error", `Erro ao ativar fonte: ${e.message}`);
    }
  };

  const handleDuplicateWorkbook = async (wbId: string) => {
    const list = libraryWorkbookRepository.listWorkbooks({ includeArchived: true });
    const wb = list.find(w => w.id === wbId);
    if (!wb) return;
    const ver = libraryWorkbookRepository.getCurrentVersion(wbId);
    if (!ver) return;

    try {
      libraryWorkbookRepository.createWorkbook({
        id: `wb_${Date.now()}`,
        projectId: wb.projectId,
        name: `Cópia de ${wb.name}`,
        sourceName: wb.sourceName,
        currentVersion: {
          id: `ver_${Date.now()}`,
          activeDataset: ver.activeDataset,
          sourceName: ver.sourceName,
          importedAt: ver.importedAt,
          rowCount: ver.rowCount,
          columnCount: ver.columnCount,
          sheetCount: ver.sheetCount,
          formulaCount: ver.formulaCount,
          rawStorageRef: ver.rawStorageRef,
          label: ver.label
        }
      });
      await timelineRepository.log("IMPORT", "Workbook duplicado", `Cópia de ${wb.name}`);
      showToast("success", "Cópia criada com sucesso.");
      setLibraryTick(value => value + 1);
    } catch (err: any) {
      showToast("error", `Erro ao duplicar: ${err.message}`);
    }
  };

  const handleArchiveWorkbook = async (wbId: string) => {
    libraryWorkbookRepository.archiveWorkbook(wbId);
    const name = visibleFilesList.find(f => f.id === wbId)?.name || wbId;
    await timelineRepository.log("ARCHIVE", "Workbook arquivado", name);
    showToast("info", "Workbook arquivado com sucesso.");
    setLibraryTick(value => value + 1);
  };

  const handleRestoreWorkbook = async (wbId: string) => {
    libraryWorkbookRepository.restoreWorkbook(wbId);
    const name = visibleFilesList.find(f => f.id === wbId)?.name || wbId;
    await timelineRepository.log("RESTORE", "Workbook restaurado", name);
    showToast("success", "Workbook restaurado com sucesso.");
    setLibraryTick(value => value + 1);
  };

  const handleDeleteWorkbook = async (wbId: string) => {
    if (!window.confirm("Deseja realmente excluir este workbook da biblioteca permanentemente?")) return;
    
    // Status DELETED
    const workbook = libraryWorkbookRepository.getWorkbook(wbId);
    if (!workbook) {
      showToast("warning", "Esta fonte não está mais disponível. Atualize a biblioteca para continuar.");
      return;
    }
    libraryWorkbookRepository.setWorkbookStatus(workbook.id, "DELETED");
    await enterpriseRepository.removeSourceBinding(wbId);
    const version = libraryWorkbookRepository.getCurrentVersion(workbook.id);
    const storageId = version?.activeDataset?.datasetId || wbId;
    await spreadsheetStorageAdapter.deleteRows(storageId);
    await spreadsheetStorageAdapter.deleteMetadata(storageId);

    try {
      await enterpriseConsolidationService.refreshActiveDatasetForContext(getEnterpriseContext());
      const name = visibleFilesList.find(f => f.id === wbId)?.name || wbId;
      await timelineRepository.log("DELETE", "Workbook excluído", name);
      showToast("success", "Workbook excluído permanentemente.");
      setSelectedWbIds(selectedWbIds.filter(id => id !== wbId));
      setLibraryTick(value => value + 1);
    } catch(err: any) {
      showToast("error", err.message);
    }
  };

  const handlePreviewWorkbook = async (wb: any) => {
    setPreviewWb(wb);
    setIsPreviewOpen(true);
    try {
      const sheetName = wb.sheets && wb.sheets.length > 0 ? wb.sheets[0] : "";
      const rows = await spreadsheetStorageAdapter.getPreviewPaged(wb.id, sheetName, 30);
      setPreviewRows(rows);
    } catch {
      setPreviewRows([]);
    }
  };

  const handleLinkWorkbook = async () => {
    if (!linkWb || !linkTargetCompanyId) return;
    const targetComp = companies.find(c => c.id === linkTargetCompanyId);
    if (!targetComp) return;

    try {
      const workbook = libraryWorkbookRepository.getWorkbook(linkWb.id);
      const version = workbook ? libraryWorkbookRepository.getCurrentVersion(workbook.id) : null;
      await enterpriseRepository.bindSource({
        sourceId: version?.activeDataset?.datasetId || linkWb.id,
        workbookId: linkWb.id,
        datasetId: version?.activeDataset?.datasetId || linkWb.id,
        groupId: targetComp.parentId,
        companyId: targetComp.id,
      });
      await enterpriseConsolidationService.refreshActiveDatasetForContext(getEnterpriseContext());

      await timelineRepository.log("LINK", "Vínculo de Workbook alterado", `${linkWb.name} -> ${targetComp.name}`);
      showToast("success", "Planilha vinculada à empresa com sucesso.");
      setIsLinkOpen(false);
      setLinkWb(null);
      loadData();
      setLibraryTick(value => value + 1);
    } catch {
      showToast("error", "Erro ao alterar o vínculo.");
    }
  };

  // BATCH ACTIONS (F16.3)
  const handleBatchDelete = async () => {
    if (selectedWbIds.length === 0) return;
    if (!window.confirm(`Excluir permanentemente os ${selectedWbIds.length} workbooks selecionados do sistema?`)) return;

    for (const id of selectedWbIds) {
      const workbook = libraryWorkbookRepository.getWorkbook(id);
      if (!workbook) continue;
      const version = libraryWorkbookRepository.getCurrentVersion(id);
      const storageId = version?.activeDataset?.datasetId || id;
      await spreadsheetStorageAdapter.deleteRows(storageId);
      await spreadsheetStorageAdapter.deleteMetadata(storageId);
      const binding = await enterpriseRepository.getSourceBinding(id);
      if (binding) await enterpriseRepository.removeSourceBinding(binding.sourceId);
      libraryWorkbookRepository.deleteWorkbook(id);
    }

    const context = getEnterpriseContext();
    try {
      await enterpriseConsolidationService.refreshActiveDatasetForContext(context);
      await timelineRepository.log("DELETE", `${selectedWbIds.length} workbooks excluídos em lote`, `${selectedWbIds.length} registros purgados`);
      showToast("success", "Exclusão em lote concluída.");
      setSelectedWbIds([]);
      setLibraryTick(value => value + 1);
    } catch(err: any) {
      showToast("error", err.message);
    }
  };

  const handleBatchArchive = async () => {
    if (selectedWbIds.length === 0) return;
    if (!window.confirm(`Arquivar as ${selectedWbIds.length} planilhas selecionadas?`)) return;

    for (const id of selectedWbIds) {
      libraryWorkbookRepository.archiveWorkbook(id);
    }

    await enterpriseConsolidationService.refreshActiveDatasetForContext(getEnterpriseContext());
    await timelineRepository.log("ARCHIVE", `${selectedWbIds.length} workbooks arquivados em lote`, `${selectedWbIds.length} itens inativados`);
    showToast("info", "Planilhas arquivadas com sucesso.");
    setSelectedWbIds([]);
    setLibraryTick(value => value + 1);
  };

  const handleBatchActivate = async (activate: boolean) => {
    if (selectedWbIds.length === 0) return;
    const actionStr = activate ? "ativar" : "desativar";
    if (!window.confirm(`Deseja realmente ${actionStr} as ${selectedWbIds.length} planilhas selecionadas?`)) return;

    try {
      selectedWbIds.forEach(id => {
        if (activate) libraryWorkbookRepository.restoreWorkbook(id);
        else libraryWorkbookRepository.archiveWorkbook(id);
      });
      await enterpriseConsolidationService.refreshActiveDatasetForContext(getEnterpriseContext());
      const logAction = activate ? "ATIVADAS" : "DESATIVADAS";
      await timelineRepository.log("ACTIVATE", `${selectedWbIds.length} planilhas ${logAction.toLowerCase()} em lote`, `${selectedWbIds.length} fontes alteradas`);
      showToast("success", `Planilhas ${activate ? "ativadas" : "desativadas"} com sucesso.`);
      setSelectedWbIds([]);
      setLibraryTick(value => value + 1);
    } catch(err: any) {
      showToast("error", err.message);
    }
  };

  const handleBatchMove = async () => {
    if (!batchTargetCompanyId || selectedWbIds.length === 0) return;
    const targetComp = companies.find(c => c.id === batchTargetCompanyId);
    if (!targetComp) return;

    if (!window.confirm(`Mover as ${selectedWbIds.length} planilhas selecionadas para a empresa "${targetComp.name}"?`)) return;

    try {
      for (const wbId of selectedWbIds) {
        const workbook = libraryWorkbookRepository.getWorkbook(wbId);
        const version = workbook ? libraryWorkbookRepository.getCurrentVersion(workbook.id) : null;
        await enterpriseRepository.bindSource({
          sourceId: version?.activeDataset?.datasetId || wbId,
          workbookId: wbId,
          datasetId: version?.activeDataset?.datasetId || wbId,
          groupId: targetComp.parentId,
          companyId: targetComp.id,
        });
      }

      await enterpriseConsolidationService.refreshActiveDatasetForContext(getEnterpriseContext());

      await timelineRepository.log("LINK", `${selectedWbIds.length} planilhas vinculadas em lote`, `Destino: ${targetComp.name}`);
      showToast("success", "Planilhas movidas e vinculadas com sucesso.");
      setIsMoveBatchOpen(false);
      setSelectedWbIds([]);
      loadData();
      setLibraryTick(value => value + 1);
    } catch {
      showToast("error", "Erro ao mover as planilhas.");
    }
  };

  const handleActivateAllWorkspaceSources = async (activate: boolean) => {
    const targetIds = visibleFilesList.map(f => f.id);
    if (targetIds.length === 0) return;
    const actionStr = activate ? "ativar" : "desativar";
    if (!window.confirm(`Deseja realmente ${actionStr} todas as planilhas do workspace?`)) return;

    try {
      targetIds.forEach(id => {
        if (activate) libraryWorkbookRepository.restoreWorkbook(id);
        else libraryWorkbookRepository.archiveWorkbook(id);
      });
      await enterpriseConsolidationService.refreshActiveDatasetForContext(getEnterpriseContext());
      await timelineRepository.log("ACTIVATE", `Todas as planilhas foram ${activate ? "ativadas" : "desativadas"}`, `${targetIds.length} planilhas`);
      showToast("success", `Todas as planilhas foram ${activate ? "ativadas" : "desativadas"}.`);
      setLibraryTick(value => value + 1);
    } catch(err: any) {
      showToast("error", err.message);
    }
  };

  // Resolved dynamic values for Operational Center
  const activePeriodStr = activeDataset?.importedAt ? new Date(activeDataset.importedAt).toLocaleDateString("pt-BR") : "N/A";
  const numColumns = activeDataset?.columnCount || 0;
  const confirmedSegmentLabel = getDomainDisplayLabel(currentWorkspace?.manualDomain);

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100 text-left font-sans text-xs max-w-full overflow-x-hidden">
      
      {/* Tab selection header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm shrink-0">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {steps.map(s => {
              const Icon = s.icon;
              const isActive = activeTab === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveTab(s.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer text-xs font-black uppercase tracking-wider ${
                    isActive 
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" 
                      : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-450 dark:text-slate-400"
                  }`}
                >
                  <Icon size={14} />
                  <span>{s.title}</span>
                </button>
              );
            })}
          </div>
          
          {/* Main quick actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsUploaderOpen(true)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase rounded-xl transition-all shadow-sm shadow-blue-500/10 cursor-pointer flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>Importar Planilha</span>
            </button>
            <input
              ref={directFileInputRef}
              data-testid="btn-drawer-import"
              aria-label="Selecionar arquivo para importar"
              type="file"
              multiple
              accept=".xlsx,.xls,.csv"
              className="absolute h-px w-px opacity-0"
              onChange={(event) => {
                const files = Array.from(event.target.files || []);
                event.target.value = "";
                if (files.length === 0) return;
                setPendingFiles(files);
                setIsUploaderOpen(true);
              }}
            />
            <button
              onClick={() => setIsDbConnectorOpen(true)}
              className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-black uppercase rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
            >
              <Server size={14} className="text-blue-500" />
              <span>Conectar Banco (ERP)</span>
            </button>
            <button
              onClick={async () => {
                const report = await repairLegacyLocalState();
                const repaired = report.repairedKeys.length;
                const unresolved = report.unresolvedKeys.length;
                setLocalRepairMessage(`${repaired} referência(s) verificadas; ${unresolved} item(ns) precisam de revisão. Nenhuma planilha foi apagada.`);
              }}
              className="px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-black uppercase rounded-xl transition-all border border-slate-200 dark:border-slate-700"
            >
              <span>Verificar dados locais</span>
            </button>
          </div>
        </div>
        {localRepairMessage && <p className="mt-3 text-xs font-bold text-emerald-700 dark:text-emerald-300" role="status">{localRepairMessage}</p>}
      </div>

      <ChaosProfilingPanel
        activeDataset={activeDataset}
        onOpenExecutiveSummary={onOpenExecutiveSummary}
        onOpenExecutiveDashboard={onOpenExecutiveDashboard}
        onGenerateExecutivePresentation={onGenerateExecutivePresentation}
        onAnalysisCompleted={onAnalysisCompleted}
      />



      {/* TABS CONTENT RENDERING */}
      <div className="w-full">
        
        {/* ABA 0: CENTRO OPERACIONAL */}
        {activeTab === 0 && (
          <div className="space-y-6">
            
            {/* Grid metrics blocks */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Contexto Ativo Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-900 pb-2">
                    <Building size={16} className="text-blue-500" />
                    <span className="font-black text-slate-800 dark:text-white uppercase tracking-wider text-[10px]">Contexto Ativo</span>
                  </div>
                  <div className="space-y-2 text-[11.5px]">
                    <div className="flex justify-between border-b border-slate-50 dark:border-slate-900/50 pb-1.5">
                      <span className="text-slate-400 font-semibold">Grupo:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">{activeGroup?.name || "Nenhum/Geral"}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-50 dark:border-slate-900/50 pb-1.5">
                      <span className="text-slate-400 font-semibold">Empresa:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">{activeCompany?.name || "Nenhuma/Geral"}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-50 dark:border-slate-900/50 pb-1.5">
                      <span className="text-slate-400 font-semibold">Unidade:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">{activeUnit?.name || "Nenhuma/Geral"}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-50 dark:border-slate-900/50 pb-1.5">
                      <span className="text-slate-400 font-semibold">Projeto:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">{currentWorkspace?.name || "Nenhum"}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-50 dark:border-slate-900/50 pb-1.5">
                      <span className="text-slate-400 font-semibold">Área de atuação:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">{confirmedSegmentLabel}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-50 dark:border-slate-900/50 pb-1.5">
                      <span className="text-slate-400 font-semibold">Período Fiscal:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">
                        {getEnterpriseContext().period ? `${getEnterpriseContext().period?.start} a ${getEnterpriseContext().period?.end}` : "Todos"}
                      </span>
                    </div>
                    <div className="flex justify-between pb-0.5">
                      <span className="text-slate-400 font-semibold">Última Atualização:</span>
                      <span className="font-mono text-slate-500 dark:text-slate-400">{activePeriodStr}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fontes Ativas Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-900 pb-2">
                    <Database size={16} className="text-blue-500" />
                    <span className="font-black text-slate-800 dark:text-white uppercase tracking-wider text-[10px]">Fontes Ativas da Análise</span>
                  </div>
                  <div className="space-y-2 text-[11.5px]">
                    <div className="flex justify-between border-b border-slate-50 dark:border-slate-900/50 pb-1.5">
                      <span className="text-slate-400 font-semibold">Quantidade de Fontes:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">{activeFiles.length} planilhas</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-50 dark:border-slate-900/50 pb-1.5">
                      <span className="text-slate-400 font-semibold">Total de Registros (Linhas):</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">{(activeDataset?.rowCount || 0).toLocaleString("pt-BR")} registros</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-50 dark:border-slate-900/50 pb-1.5">
                      <span className="text-slate-400 font-semibold">Total de Colunas:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">{numColumns} colunas</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-50 dark:border-slate-900/50 pb-1.5">
                      <span className="text-slate-400 font-semibold">Planilhas Físicas:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">{activeFiles.length} xls / csv</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-50 dark:border-slate-900/50 pb-1.5">
                      <span className="text-slate-400 font-semibold">Bancos de Dados Integrados:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">
                        {currentSource === "Banco de Dados Interno" ? 1 : 0} ativos
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-slate-50 dark:border-slate-900/50 pb-1.5">
                      <span className="text-slate-400 font-semibold">APIs Externas:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">0 ativas</span>
                    </div>
                    <div className="flex justify-between pb-0.5">
                      <span className="text-slate-400 font-semibold">Cargas ERP Mapeadas:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">{activeDataset ? 1 : 0} mapeamento</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Saúde dos Dados Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-900 pb-2">
                    <ShieldAlert size={16} className="text-blue-500" />
                    <span className="font-black text-slate-800 dark:text-white uppercase tracking-wider text-[10px]">Saúde e Auditoria dos Dados</span>
                  </div>
                  <div className="space-y-2 text-[11.5px]">
                    <div className="flex justify-between border-b border-slate-50 dark:border-slate-900/50 pb-1.5">
                      <span className="text-slate-400 font-semibold">Fontes Válidas (Auditadas):</span>
                      <span className="font-bold text-emerald-500 font-mono">
                        {healthMetrics.validCount} de {activeFiles.length} OK
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-slate-50 dark:border-slate-900/50 pb-1.5">
                      <span className="text-slate-400 font-semibold">Fontes Incompletas/Arquivadas:</span>
                      <span className={`font-bold ${healthMetrics.incompleteCount > 0 ? "text-amber-500" : "text-slate-450"}`}>
                        {healthMetrics.incompleteCount} itens
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-slate-50 dark:border-slate-900/50 pb-1.5">
                      <span className="text-slate-400 font-semibold">Mapeamentos Pendentes:</span>
                      <span className={`font-bold ${healthMetrics.pendingMappingCount > 0 ? "text-rose-500" : "text-slate-450"}`}>
                        {healthMetrics.pendingMappingCount} colunas
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-slate-50 dark:border-slate-900/50 pb-1.5">
                      <span className="text-slate-400 font-semibold">Campos personalizados:</span>
                      <span className={`font-bold ${camposAusentes.length > 0 ? "text-rose-500" : "text-slate-450"}`}>
                        {camposAusentes.length > 0 ? `${camposAusentes.join(", ")}` : "0 campos personalizados"}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 pt-1">
                      <span className="text-slate-400 font-semibold block">Problemas Encontrados:</span>
                      {healthMetrics.problems.length === 0 ? (
                        <p className="text-[10px] text-emerald-500 font-bold">✓ Nenhuma inconsistência lógica identificada nas fontes ativas.</p>
                      ) : (
                        <div className="flex flex-wrap gap-1 max-h-[60px] overflow-y-auto pr-1">
                          {healthMetrics.problems.map((prob, i) => (
                            <span key={i} className="px-1.5 py-0.5 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded font-mono text-[9px] font-bold">
                              {prob}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* ASSISTENTE DO CONSULTOR PANEL (F16.9) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-900 pb-3">
                <HelpCircle size={18} className="text-blue-500" />
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">
                    O que falta para iniciar a consultoria?
                  </h3>
                  <p className="text-[11px] text-slate-455 font-semibold mt-0.5">
                    Análise heurística de pré-requisitos para reuniões e relatórios estruturados
                  </p>
                </div>
              </div>

              {assistantTasks.length === 0 ? (
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3">
                  <CheckCircle2 size={24} className="text-emerald-500 shrink-0" />
                  <div>
                    <h4 className="font-extrabold text-emerald-600 dark:text-emerald-455 text-xs">Parabéns! Tudo pronto para iniciar!</h4>
                    <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Todos os cadastros, planilhas, mapeamentos e DRE estão devidamente parametrizados e prontos para apresentação.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl overflow-hidden bg-slate-50/20 dark:bg-slate-950/20">
                  {assistantTasks.map(t => (
                    <div key={t.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
                      <div className="space-y-1 min-w-0 flex-1">
                        <p className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                          <AlertTriangle size={13} className="text-amber-500 shrink-0" />
                          {t.problem}
                        </p>
                        <p className="text-[10.5px] text-slate-450 font-semibold pl-5">
                          <strong className="text-slate-500 dark:text-slate-350">Impacto:</strong> {t.impact}
                        </p>
                        <p className="text-[10.5px] text-slate-450 font-semibold pl-5">
                          <strong className="text-slate-500 dark:text-slate-350">Solução:</strong> {t.solution}
                        </p>
                      </div>
                      
                      <div className="shrink-0 flex items-center pl-5 md:pl-0">
                        {t.actionTab ? (
                          <button
                            onClick={() => {
                              // Triggers app state update via custom event to modify sidebar page tab
                              window.dispatchEvent(new CustomEvent("sauron:set-page", { detail: t.actionTab }));
                            }}
                            className="px-3.5 py-1.5 bg-blue-600/10 hover:bg-blue-600 text-blue-600 dark:text-blue-400 hover:text-white border border-blue-500/10 rounded-lg font-black uppercase text-[10px] tracking-wider transition-all cursor-pointer shadow-3xs"
                          >
                            {t.actionLabel}
                          </button>
                        ) : t.actionTabIdx !== undefined ? (
                          <button
                            onClick={() => setActiveTab(t.actionTabIdx)}
                            className="px-3.5 py-1.5 bg-blue-600/10 hover:bg-blue-600 text-blue-600 dark:text-blue-400 hover:text-white border border-blue-500/10 rounded-lg font-black uppercase text-[10px] tracking-wider transition-all cursor-pointer shadow-3xs"
                          >
                            {t.actionLabel}
                          </button>
                        ) : (
                          <button
                            onClick={t.triggerAction}
                            className="px-3.5 py-1.5 bg-blue-600/10 hover:bg-blue-600 text-blue-600 dark:text-blue-400 hover:text-white border border-blue-500/10 rounded-lg font-black uppercase text-[10px] tracking-wider transition-all cursor-pointer shadow-3xs"
                          >
                            {t.actionLabel}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions Console */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 text-left">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block border-b border-slate-100 dark:border-slate-900 pb-2">Ações rápidas</span>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => handleActivateAllWorkspaceSources(true)}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase rounded-lg shadow-sm shadow-emerald-500/10 transition-colors cursor-pointer text-[10px]"
                >
                  Ativar Todas as Fontes
                </button>
                <button
                  onClick={() => handleActivateAllWorkspaceSources(false)}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-black uppercase rounded-lg shadow-sm shadow-rose-500/10 transition-colors cursor-pointer text-[10px]"
                >
                  Desativar Todas as Fontes
                </button>
                <button
                  onClick={() => {
                    setLibraryTick(value => value + 1);
                    showToast("success", "Status de dados atualizados.");
                  }}
                  className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-black uppercase rounded-lg border border-slate-250 dark:border-slate-700 transition-colors cursor-pointer text-[10px]"
                >
                  Recarregar Fontes
                </button>
              </div>
            </div>

          </div>
        )}

        {/* ABA 1: BIBLIOTECA ENTERPRISE (F16.2) */}
        {activeTab === 1 && (
          <div className="space-y-6">
            
            {/* Filter and Search controls */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 text-left">
              
              <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <FolderOpen size={16} className="text-blue-500" />
                  Fontes persistidas do projeto
                </h3>
                
                {/* Search field */}
                <div className="relative w-full lg:w-72">
                  <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 pl-9 pr-3 py-2 rounded-xl text-slate-800 dark:text-slate-100 font-semibold focus:outline-none"
                    placeholder="Buscar planilhas por nome..."
                  />
                </div>
              </div>

              {/* Filters row */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
                
                {/* Group */}
                <div className="space-y-1">
                  <label htmlFor="source-filter-group" className="text-[9px] font-bold text-slate-450 block uppercase">Grupo</label>
                  <select 
                    id="source-filter-group"
                    value={filterGroup} 
                    onChange={e => setFilterGroup(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 px-2 py-1.5 rounded-lg text-slate-700 dark:text-slate-350 focus:outline-none text-[11px]"
                  >
                    <option value="">-- Todos os Grupos --</option>
                    {groups.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>

                {/* Company */}
                <div className="space-y-1">
                  <label htmlFor="source-filter-company" className="text-[9px] font-bold text-slate-450 block uppercase">Empresa</label>
                  <select 
                    id="source-filter-company"
                    value={filterCompany} 
                    onChange={e => setFilterCompany(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 px-2 py-1.5 rounded-lg text-slate-700 dark:text-slate-350 focus:outline-none text-[11px]"
                  >
                    <option value="">-- Todas as Empresas --</option>
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Unit */}
                <div className="space-y-1">
                  <label htmlFor="source-filter-unit" className="text-[9px] font-bold text-slate-455 block uppercase">Unidade</label>
                  <select 
                    id="source-filter-unit"
                    value={filterUnit} 
                    onChange={e => setFilterUnit(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 px-2 py-1.5 rounded-lg text-slate-700 dark:text-slate-350 focus:outline-none text-[11px]"
                  >
                    <option value="">-- Todas as Unidades --</option>
                    {units.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>

                {/* Segment */}
                <div className="space-y-1">
                  <label htmlFor="source-filter-segment" className="text-[9px] font-bold text-slate-455 block uppercase">Segmento</label>
                  <select 
                    id="source-filter-segment"
                    value={filterSegment} 
                    onChange={e => setFilterSegment(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 px-2 py-1.5 rounded-lg text-slate-700 dark:text-slate-350 focus:outline-none text-[11px]"
                  >
                    <option value="">-- Todos os Segmentos --</option>
                    {getDomainDisplayOptions().map(option => (
                      <option key={option.id} value={option.id}>{option.label}</option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div className="space-y-1 col-span-2 md:col-span-1">
                  <label htmlFor="source-filter-status" className="text-[9px] font-bold text-slate-455 block uppercase">Status</label>
                  <select 
                    id="source-filter-status"
                    value={filterStatus} 
                    onChange={e => setFilterStatus(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 px-2 py-1.5 rounded-lg text-slate-700 dark:text-slate-350 focus:outline-none text-[11px]"
                  >
                    <option value="">-- Todos os Status --</option>
                    <option value="ACTIVE">Em Produção / Ativa</option>
                    <option value="INACTIVE">Arquivado</option>
                    <option value="PENDING_MAPPING">Mapeamento Pendente</option>
                    <option value="PENDING_VALIDATION">Leitura Pendente</option>
                  </select>
                </div>

              </div>

            </div>

            {/* BATCH OPERATIONS CONTROLS (F16.3) */}
            {selectedWbIds.length > 0 && (
              <div className="bg-blue-600/10 border border-blue-500/30 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in text-left">
                <div className="flex items-center gap-2">
                  <CheckSquare size={16} className="text-blue-500 shrink-0" />
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    Ações em lote ({selectedWbIds.length} planilhas marcadas)
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleBatchActivate(true)}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-black uppercase cursor-pointer"
                  >
                    Ativar
                  </button>
                  <button
                    onClick={() => handleBatchActivate(false)}
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-black uppercase cursor-pointer"
                  >
                    Desativar
                  </button>
                  <button
                    onClick={handleBatchArchive}
                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-[10px] font-black uppercase cursor-pointer"
                  >
                    Arquivar
                  </button>
                  <button
                    onClick={handleBatchDelete}
                    className="px-2.5 py-1 bg-rose-700 hover:bg-rose-650 text-white rounded text-[10px] font-black uppercase cursor-pointer"
                  >
                    Excluir
                  </button>
                  <button
                    onClick={() => setIsMoveBatchOpen(true)}
                    className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-750 rounded text-[10px] font-black uppercase cursor-pointer"
                  >
                    Alterar Empresa (Mover)
                  </button>
                  <button
                    onClick={() => setSelectedWbIds([])}
                    className="px-2.5 py-1 bg-slate-200 dark:bg-slate-900 hover:bg-slate-350 text-slate-600 dark:text-slate-400 rounded text-[10px] font-black uppercase cursor-pointer"
                  >
                    Limpar
                  </button>
                </div>
              </div>
            )}

            {/* Document list database */}
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-x-auto shadow-sm">
              <table className="w-full text-[11px] font-sans border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-850 text-slate-450 uppercase text-[9px] font-black tracking-wider">
                    <th className="p-3 w-8">
                      <input
                        type="checkbox"
                        aria-label="Selecionar todas as fontes"
                        checked={filteredLibrary.length > 0 && selectedWbIds.length === filteredLibrary.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedWbIds(filteredLibrary.map(f => f.id));
                          } else {
                            setSelectedWbIds([]);
                          }
                        }}
                        className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-800 text-blue-600 cursor-pointer"
                      />
                    </th>
                    <th className="p-3">Auditoria</th>
                    <th className="p-3">Nome</th>
                    <th className="p-3">Vínculo Empresa</th>
                    <th className="p-3">Grupo</th>
                    <th className="p-3 text-right">Registros</th>
                    <th className="p-3 text-right">Colunas</th>
                    <th className="p-3 text-right">Abas</th>
                    <th className="p-3">Segmento</th>
                    <th className="p-3">Importação</th>
                    <th className="p-3 text-center">Ativa</th>
                    <th className="p-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
                  {filteredLibrary.map((f) => {
                    const audit = auditWorkbook(f);
                    const linkedCompany = linkedCompanyFor(f.id);
                    const linkedGroup = linkedCompany ? groups.find(g => g.id === linkedCompany.parentId) : null;
                    const segment = (linkedCompany && (linkedCompany as any).segment) || "neutral";
                    
                    const isSelected = selectedWbIds.includes(f.id);
                    const isActive = getEnterpriseContext().workbookIds?.includes(f.id)
                      || activeDataset?.sourceWorkbookIds?.includes(f.id)
                      || activeDataset?.sourceDatasetIds?.includes(f.id);

                    return (
                      <tr 
                        key={f.id}
                        className={`hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors ${
                          isSelected ? "bg-blue-600/5 dark:bg-blue-600/5" : ""
                        }`}
                      >
                        {/* Checkbox cell */}
                        <td className="p-3">
                            <input
                              type="checkbox"
                              aria-label={`Selecionar fonte ${f.name}`}
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedWbIds([...selectedWbIds, f.id]);
                              } else {
                                setSelectedWbIds(selectedWbIds.filter(id => id !== f.id));
                              }
                            }}
                            className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-800 text-blue-600 cursor-pointer"
                          />
                        </td>

                        {/* Audit cell */}
                        <td className="p-3">
                          {audit.status === "OK" ? (
                            <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 rounded font-black text-[9px] uppercase">
                              ✔ OK
                            </span>
                          ) : (
                            <div className="flex flex-wrap gap-1 max-w-[120px]">
                              {audit.warnings.map((w, idx) => (
                                <span 
                                  key={idx} 
                                  className="px-1.5 py-0.5 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded text-[8px] font-black uppercase whitespace-nowrap"
                                  title={w}
                                >
                                  ⚠ {w.split(" ")[0]}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>

                        {/* Name */}
                        <td className="p-3 font-bold text-slate-800 dark:text-slate-100 max-w-[160px] truncate">
                          {f.name}
                        </td>

                        {/* Company Link */}
                        <td className="p-3 text-slate-505 dark:text-slate-400 font-semibold">
                          {linkedCompany ? linkedCompany.name : "—"}
                        </td>

                        {/* Group */}
                        <td className="p-3 text-slate-505 dark:text-slate-400">
                          {linkedGroup ? linkedGroup.name : "—"}
                        </td>

                        {/* Rows */}
                        <td className="p-3 text-right font-mono text-slate-600 dark:text-slate-450 font-bold">
                          {f.totalRows.toLocaleString("pt-BR")}
                        </td>

                        {/* Columns */}
                        <td className="p-3 text-right font-mono text-slate-500 dark:text-slate-450">
                          {f.totalColumns}
                        </td>

                        {/* Sheets */}
                        <td className="p-3 text-right font-mono text-slate-500 dark:text-slate-450">
                          {f.totalAbas}
                        </td>

                        {/* Segment */}
                        <td className="p-3">
                          <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded font-bold uppercase text-[9px]">
                            {getDomainDisplayLabel(segment)}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="p-3 font-mono text-slate-400 text-[10px]">
                          {f.date}
                        </td>

                        {/* Active checkbox indicator */}
                        <td className="p-3 text-center">
                          <span className={`w-3.5 h-3.5 rounded-full inline-block ${
                            isActive ? "bg-emerald-500 border-4 border-emerald-100 dark:border-emerald-950 animate-pulse" : "bg-slate-200 dark:bg-slate-800"
                          }`} />
                        </td>

                        {/* Actions options menu */}
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            
                            {/* Open */}
                            <button
                              onClick={() => handleOpenWorkbook(f.id)}
                              className="p-1 hover:bg-blue-600/10 text-blue-500 rounded cursor-pointer"
                              title="Abrir como fonte única"
                            >
                              <Play size={12} />
                            </button>

                            {/* View */}
                            <button
                              onClick={() => handlePreviewWorkbook(f)}
                              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded cursor-pointer"
                              title="Visualizar pág. de preview"
                            >
                              <Eye size={12} />
                            </button>

                            {/* Edit link */}
                            <button
                              onClick={() => { setLinkWb(f); setLinkTargetCompanyId(linkedCompany?.id || ""); setIsLinkOpen(true); }}
                              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded cursor-pointer"
                              title="Vincular Empresa"
                            >
                              <Move size={12} />
                            </button>

                            {/* Duplicate */}
                            <button
                              onClick={() => handleDuplicateWorkbook(f.id)}
                              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded cursor-pointer"
                              title="Duplicar workbook"
                            >
                              <CheckSquare size={12} />
                            </button>

                            {/* Archive */}
                            {f.status !== "INACTIVE" ? (
                              <button
                                onClick={() => handleArchiveWorkbook(f.id)}
                                className="p-1 hover:bg-amber-600/10 text-amber-500 rounded cursor-pointer"
                                title="Arquivar"
                              >
                                <Archive size={12} />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleRestoreWorkbook(f.id)}
                                className="p-1 hover:bg-emerald-600/10 text-emerald-500 rounded cursor-pointer"
                                title="Restaurar"
                              >
                                <RotateCcw size={12} />
                              </button>
                            )}

                            {/* Delete */}
                            <button
                              onClick={() => handleDeleteWorkbook(f.id)}
                              className="p-1 hover:bg-rose-500/10 text-rose-500 rounded cursor-pointer"
                              title="Excluir da biblioteca"
                            >
                              <Trash2 size={12} />
                            </button>

                          </div>
                        </td>

                      </tr>
                    );
                  })}
                  {filteredLibrary.length === 0 && (
                    <tr>
                      <td colSpan={12} className="p-8 text-center text-slate-600 dark:text-slate-300 italic font-semibold">
                        Nenhuma fonte correspondente aos filtros foi encontrada.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* ABA 2: TIMELINE EMPRESARIAL */}
        {activeTab === 2 && (
          <div className="max-w-2xl mx-auto space-y-4">
            <EnterpriseTimeline />
          </div>
        )}

      </div>

      {/* MODALS REGISTRY (UX ENTERPRISE COMPLIANT) */}
      
      {/* Link/Move Modal */}
      {isLinkOpen && linkWb && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs font-sans">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-96 text-left space-y-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <Move size={16} className="text-blue-500" /> Associar Planilha a Empresa
            </h3>
            <p className="text-xs text-slate-400">Selecione a empresa proprietária dos dados do arquivo:</p>
            <div className="space-y-1">
              <select
                value={linkTargetCompanyId}
                onChange={e => setLinkTargetCompanyId(e.target.value)}
                className="w-full bg-slate-950 text-xs px-3 py-2 rounded-lg border border-slate-800 text-white focus:outline-hidden"
              >
                <option value="" disabled>-- Selecione uma empresa --</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => { setIsLinkOpen(false); setLinkWb(null); }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-350 rounded-lg text-xs font-black uppercase transition-all cursor-pointer"
              >
                Voltar
              </button>
              <button
                onClick={handleLinkWorkbook}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-black uppercase transition-all cursor-pointer"
              >
                Vincular
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Move Modal */}
      {isMoveBatchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs font-sans">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-96 text-left space-y-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <Move size={16} className="text-blue-500" /> Alterar Vínculo de Empresa em Lote
            </h3>
            <p className="text-xs text-slate-400">Selecione a empresa de destino para os {selectedWbIds.length} itens marcados:</p>
            <div className="space-y-1">
              <select
                value={batchTargetCompanyId}
                onChange={e => setBatchTargetCompanyId(e.target.value)}
                className="w-full bg-slate-950 text-xs px-3 py-2 rounded-lg border border-slate-800 text-white focus:outline-hidden"
              >
                <option value="" disabled>-- Selecione uma empresa --</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => { setIsMoveBatchOpen(false); setBatchTargetCompanyId(""); }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-350 rounded-lg text-xs font-black uppercase transition-all cursor-pointer"
              >
                Voltar
              </button>
              <button
                onClick={handleBatchMove}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-black uppercase transition-all cursor-pointer"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Visualizar Preview Modal */}
      {isPreviewOpen && previewWb && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs font-sans">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-[800px] text-left space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <FileSpreadsheet size={16} className="text-blue-500" /> Preview de Linhas: {previewWb.name}
              </h3>
              <button onClick={() => { setIsPreviewOpen(false); setPreviewWb(null); }} className="text-slate-400 hover:text-white font-extrabold text-xs">Fechar</button>
            </div>
            
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-950/40 p-4 border border-slate-800 rounded-xl">
                <div>
                  <span className="text-[9px] font-black uppercase text-slate-505 tracking-wider">Quantidade total</span>
                  <p className="font-extrabold text-white text-base mt-0.5">{previewWb.totalRows.toLocaleString("pt-BR")} linhas</p>
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase text-slate-505 tracking-wider">Colunas Identificadas</span>
                  <p className="font-extrabold text-white text-base mt-0.5">{previewWb.totalColumns} colunas</p>
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase text-slate-505 tracking-wider">Número de Abas</span>
                  <p className="font-extrabold text-white text-base mt-0.5">{previewWb.totalAbas} abas</p>
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase text-slate-505 tracking-wider">Score Qualidade</span>
                  <p className="font-extrabold text-emerald-500 text-base mt-0.5">{previewWb.qualityScore}%</p>
                </div>
              </div>

              {/* Data Table */}
              <div className="border border-slate-800 rounded-xl overflow-x-auto bg-slate-950/40 max-h-[300px]">
                <table className="w-full text-[10px] font-mono border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-950 border-b border-slate-850 text-slate-500 uppercase text-[8px] font-black">
                      {previewRows.length > 0 && Object.keys(previewRows[0]).filter(k => k !== "id").map(key => (
                        <th key={key} className="p-2 border-r border-slate-850">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((r, i) => (
                      <tr key={i} className="border-b border-slate-900 hover:bg-slate-900/50">
                        {Object.keys(r).filter(k => k !== "id").map((key, idx) => (
                          <td key={idx} className="p-2 border-r border-slate-900 text-slate-350 truncate max-w-[120px]">{String(r[key])}</td>
                        ))}
                      </tr>
                    ))}
                    {previewRows.length === 0 && (
                      <tr>
                        <td className="p-8 text-center text-slate-500 italic">Preview indisponível ou sem registros armazenados.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => { setIsPreviewOpen(false); setPreviewWb(null); }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-350 rounded-lg text-xs font-black uppercase transition-all cursor-pointer"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SimpleSpreadsheetImporter Modal */}
      {isUploaderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs font-sans">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-[700px] text-left space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <FileSpreadsheet size={16} className="text-blue-500" /> Importar Planilha de Lançamentos
              </h3>
              <button onClick={() => setIsUploaderOpen(false)} className="text-slate-400 hover:text-white font-extrabold text-xs">Fechar</button>
            </div>
            <SimpleSpreadsheetImporter
              initialFiles={pendingFiles}
              engagementId={activeEngagementId}
              onImported={async (dataset) => {
                setIsUploaderOpen(false);
                setPendingFiles([]);
                setLibraryTick(value => value + 1);
                await loadData();
                await timelineRepository.log("IMPORT", "Planilha importada com sucesso", dataset.sourceName);
                showToast("success", "Planilha importada com sucesso.");
              }}
              onCancel={() => {
                setIsUploaderOpen(false);
                setPendingFiles([]);
              }}
            />
          </div>
        </div>
      )}

      {/* DatabaseConnector Modal */}
      {isDbConnectorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs font-sans">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-[800px] text-left space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <Server size={16} className="text-blue-500" /> Conectar ao Banco de Dados (ERP)
              </h3>
              <button onClick={() => setIsDbConnectorOpen(false)} className="text-slate-400 hover:text-white font-extrabold text-xs">Fechar</button>
            </div>
            <div className="border border-slate-800 rounded-xl p-2 bg-slate-950/40">
              <DatabaseConnector 
                onDataLoaded={async (data, name, selection) => {
                  const sourceId = await onDataLoaded(data, name, selection);
                  setIsDbConnectorOpen(false);
                  timelineRepository.log("LINK", "Banco de dados integrado", name);
                  showToast("success", `Banco conectado: ${name}`);
                  return sourceId;
                }} 
                currentSource={currentSource} 
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
export default CentralDadosTab;
