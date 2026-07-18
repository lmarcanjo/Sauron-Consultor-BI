/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import {
  Upload,
  Sparkles,
  RefreshCw,
  FolderOpen,
  ArrowRight,
  TrendingUp,
  Coins,
  ChevronDown,
  Building,
  BarChart3,
  GitBranch,
  Search,
  BookOpen,
  Info,
  Calendar,
  AlertTriangle,
  RotateCcw,
  Lock,
  Unlock,
  Shield,
  Clock,
  Database,
  Save,
  Trash2,
  Check,
  Sun,
  Moon,
  Volume2,
  Sliders,
  BrainCircuit,
  Users,
  Award,
  Presentation,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  Network,
  Activity,
  FileSpreadsheet,
  Server
} from "lucide-react";

import { LancamentoFinanceiro, FiltrosDashboard, MetricasConsolidadas, ActiveDataSourceType } from "./types";
import { useDataSourceManager } from "./hooks/useDataSourceManager";
import { activeDatasetStore } from "./core/data/ActiveDatasetStore";
import { enterpriseConsolidationService } from "./core/enterprise-consolidation";
import { getEnterpriseContext } from "./core/enterprise-consolidation/EnterpriseContextStore";
import { ClientFilterManager } from "./services/clientFilterManager";
import { exportToCSV } from "./utils/dataGenerator";
import { parseCSV } from "./utils/csvParser";
import { KpiCard } from "./components/KpiCard";
import { SidebarFilters } from "./components/SidebarFilters";
import { ChartsGrid } from "./components/ChartsGrid";
import { TraceabilityPanel } from "./components/TraceabilityPanel";
import { StreamlitExporter } from "./components/StreamlitExporter";
import { DatabaseConnector } from "./components/DatabaseConnector";
import { DynamicFilterDrawer } from "./components/DynamicFilterDrawer";
import { CentralDadosDrawer } from "./components/CentralDadosDrawer";

// Modular Sector Components
import { ContabilTab } from "./components/ContabilTab";
import { ComercialTab } from "./components/ComercialTab";
import { PosVendasTab } from "./components/PosVendasTab";
import { ItensTab } from "./components/ItensTab";
import { EstoqueTab } from "./components/EstoqueTab";
import { FinanceiroTab } from "./components/FinanceiroTab";
import { ComissoesTab } from "./components/ComissoesTab";
import { PeopleIntelligenceTab } from "./components/PeopleIntelligenceTab";
import { LoginScreen } from "./components/LoginScreen";
import { PerfisConfigTab } from "./components/PerfisConfigTab";
import { LgpdConsent } from "./components/LgpdConsent";
import { auditLog } from "./utils/profileManager";

// Sauron Consulting OS Agent Modules
import { dataSourceManager } from "./services/dataSourceManager";
import { CentralDadosTab } from "./components/CentralDadosTab";
import { WorkbookLibraryTab } from "./components/WorkbookLibraryTab";
import { IntelligentDRETab } from "./components/IntelligentDRETab";
import { ModeloConsultivoTab } from "./components/ModeloConsultivoTab";
import { ConsultorAreaTab } from "./components/ConsultorAreaTab";
import { VendedoresTab } from "./components/VendedoresTab";
import { DiagnosticoObstaculosTab } from "./components/DiagnosticoObstaculosTab";
import { ConsultorIaTab } from "./components/ConsultorIaTab";
import { FechamentoMensalTab } from "./components/FechamentoMensalTab";
import { ApresentacoesTab } from "./components/ApresentacoesTab";
import { ExecutiveStoryTab } from "./components/ExecutiveStoryTab";
import { MeetingModePage } from "./components/MeetingModePage";
import { MeetingPrepTab } from "./components/MeetingPrepTab";
import { VpnGatewayTab } from "./components/VpnGatewayTab";
import { PresentationBuilderPage } from "./components/PresentationBuilderPage";
import { DashboardPage } from "./components/pages/DashboardPage";
import { ReportsPage } from "./components/pages/ReportsPage";
import { ExecutiveWorkspace } from "./components/ExecutiveWorkspace";
import { EnterpriseDigitalTwinTab } from "./components/EnterpriseDigitalTwinTab";
import { EnterpriseCenter } from "./components/EnterpriseCenter";
import { CommandPalette } from "./components/CommandPalette";
import { SDLStudio } from "./components/SDLStudio";
import { ProductQAConsole } from "./components/ProductQAConsole";
import { DataFlowDebugPanel } from "./components/DataFlowDebugPanel";
import {
  GlobalAppErrorBoundary,
  SidebarErrorBoundary,
  MainContentErrorBoundary,
  EnterpriseCenterErrorBoundary,
  DataLibraryErrorBoundary,
  DashboardErrorBoundary,
  PresentationErrorBoundary,
  MeetingErrorBoundary,
  SettingsErrorBoundary
} from "./components/ErrorBoundaries";

import { AppSidebar } from "./components/AppSidebar";
import { GlobalContextBar } from "./components/GlobalContextBar";
import { availableTemplates } from "./utils/industryTemplates";

// Sauron Identity & Collaboration Foundation (v0.6.5)
import { identityEngine } from "./core/identity/IdentityEngine";
import { accessControlEngine } from "./core/identity/AccessControlEngine";
import { digitalTwinEngine } from "./core/identity/digitalTwin/DigitalTwinEngine";
import { PLATFORM_EVENTS, subscribePlatformEvent } from "./core/events/PlatformEvents";
import { runLegacyCompatibilityMigration } from "./core/migrations/LegacyCompatibilityMigration";
import { platformLogger } from "./core/platform/PlatformLogger";

const VALID_TABS = [
  "enterprise_center", "executive_workspace", "digital_twin", "area_consultor", 
  "importacao", "biblioteca_workbooks", "resumo", "comercial", "obstaculos", 
  "consultor_ia", "relatorios", "narrativa_executiva", "apresentacoes", 
  "apresentacoes_templates", "preparacao_reuniao", "modo_reuniao", "reuniao_ata", 
  "reuniao_notes", "plano_executivo", "plano_responsaveis", "comissoes", 
  "historico_executivo", "comparativos_mensais", "fechamento_mensal", "usuarios_twin", 
  "organizacao_twin", "permissoes_twin", "perfis", "auditoria_logs", "admin_security", 
  "qa_console", "sdl_studio", "dre_inteligente", "contabil", "vendedores", 
  "banco_connector", "vpn_gateway", "operacoes_servicos", "itens", "estoque", "financeiro",
  "modelo_consultivo"
];

function resolveSafeActiveTab(requestedTab: string, currentUser: any): string {
  if (!requestedTab || !VALID_TABS.includes(requestedTab)) {
    return "executive_workspace";
  }
  const adminTabs = ["usuarios_twin", "organizacao_twin", "permissoes_twin", "perfis", "auditoria_logs", "admin_security"];
  if (adminTabs.includes(requestedTab) && currentUser?.role !== "SUPER_ADMIN") {
    return "executive_workspace";
  }
  return requestedTab;
}

runLegacyCompatibilityMigration();

export default function App() {
  // --- STATE ---
  const [activeTab, setActiveTabState] = useState<string>(() => {
    const saved = localStorage.getItem("sauron_active_tab") || "enterprise_center";
    return resolveSafeActiveTab(saved, identityEngine.getCurrentUser());
  });

  const setActiveTab = useCallback((tab: string) => {
    const safeTab = resolveSafeActiveTab(tab, identityEngine.getCurrentUser());
    localStorage.setItem("sauron_active_tab", safeTab);
    setActiveTabState(safeTab);
  }, []);

  const [activeIndustryTemplateId, setActiveIndustryTemplateId] = useState<string>(() => {
    if (typeof localStorage !== "undefined") {
      try {
        const savedRegistry = localStorage.getItem("sauron_workspace_registry");
        if (savedRegistry) {
          const reg = JSON.parse(savedRegistry);
          const wsId = reg.currentWorkspaceId;
          if (wsId && reg.workspaces[wsId]) {
            const ws = reg.workspaces[wsId];
            return ws.manualDomain || ws.businessDomain || "neutral";
          }
        }
      } catch {}
    }
    return "neutral";
  });
  const [selectedContaContabil, setSelectedContaContabil] = useState<string>("");
  const [selectedDepartamento, setSelectedDepartamento] = useState<string>("");
  const [selectedConta, setSelectedConta] = useState<string>("");

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingSharedFiles, setPendingSharedFiles] = useState<File[] | null>(null);

  const {
    activeDataSource,
    activeRecords,
    activeSourceLabel,
    activeFiles,
    approvedByConsultant,
    activeDataset,
    getNormalizedView,
    getAvailableFilters,
    setActiveSource,
    approveSource,
    rejectSource,
    refreshDataSource
  } = useDataSourceManager();

  const [historicalData, setHistoricalData] = useState<LancamentoFinanceiro[] | null>(null);
  const dataOrigem = historicalData || activeRecords;
  const nomeFonte = activeSourceLabel;
  const dataOrigemReal = activeDataset ? activeRecords : [];

  useEffect(() => {
    if (activeRecords && activeRecords.length > 0) {
      platformLogger.info(`[Sauron Instrumentation] DRE_REFRESHED - O dashboard DRE / BI recebeu os dados reais: ${activeRecords.length} linhas.`);
    }
  }, [activeRecords]);

  useEffect(() => {
    const handleGoHome = () => setActiveTab("enterprise_center");
    window.addEventListener("sauron:navigate-home", handleGoHome);
    return () => window.removeEventListener("sauron:navigate-home", handleGoHome);
  }, [setActiveTab]);

  useEffect(() => {
    const handleDomainChange = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) {
        setActiveIndustryTemplateId(detail);
      }
    };
    return subscribePlatformEvent(PLATFORM_EVENTS.DOMAIN_CONTEXT_CHANGED, handleDomainChange);
  }, []);

  const [camposAusentes, setCamposAusentes] = useState<string[]>([]);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState<boolean>(false);
  const [isCentralDadosOpen, setIsCentralDadosOpen] = useState<boolean>(false);
  const [visibleFilters, setVisibleFilters] = useState<string[]>(["grupos", "cnpjs", "marcas", "meses", "razoes"]);
  const derivedSpreadsheetMetadata = activeDataset
    ? {
        fileName: activeDataset.sourceName,
        sheetNames: activeDataset.sheets.map(sheet => typeof sheet === "string" ? sheet : sheet.sheetName),
        rowCount: activeDataset.rowCount,
        colCount: activeDataset.columnCount,
        importedAt: activeDataset.importedAt
      }
    : null;

  const [fieldMappings, setFieldMappings] = useState<Record<string, string>>({
    Grupo: "Grupo",
    CNPJ: "CNPJ",
    Marca: "Marca",
    Empresa: "Empresa",
    Receita: "Receita",
    Custo: "Custo",
    Despesa: "Despesa",
    Mês: "Mês",
    Razão: "Razão",
    Categoria: "Categoria"
  });

  // Persistent Custom Configurations (Internal Corporate Dashboard Database)
  const [segmentoCliente, setSegmentoCliente] = useState<string>("Cliente Geral");
  const [observacaoGerente, setObservacaoGerente] = useState<string>("Insira observações comerciais relevantes para o atendimento do cliente.");
  const [comissaoGeral, setComissaoGeral] = useState<number>(1.5);
  const [comissaoItens, setComissaoItens] = useState<number>(1.2);
  const [comissaoAcessorios, setComissaoAcessorios] = useState<number>(5.0);
  const [comissaoFormula, setComissaoFormula] = useState<string>("acessorios_vendas"); 
  const [narrarFeedback, setNarrarFeedback] = useState<boolean>(false);
  const [faturamentoOffset, setFaturamentoOffset] = useState<number>(0);
  const [despesaOffset, setDespesaOffset] = useState<number>(0);
  const [isVpnSimulated, setIsVpnSimulated] = useState<boolean>(false);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("sauron-theme") === "dark";
  });

  // DB Extra integrity checker
  const [dbValidationMsg, setDbValidationMsg] = useState<string>("Nenhum teste de integridade rodou ainda. Sincronize com o banco de dados.");

  // SAURON OS SIMULATED IDENTITY SYSTEM (v0.6.5)
  const [simContextKey, setSimContextKey] = useState<number>(0);
  const activeSimUser = useMemo(() => {
    return identityEngine.getCurrentUser();
  }, [simContextKey]);

  const activeSimOrg = useMemo(() => {
    return identityEngine.getCurrentOrganization();
  }, [simContextKey]);

  const getLegacyMappedRole = (role: string): "consultor" | "diretor" | "gerente" | "analista" => {
    if (["Super Admin", "Consultant Admin", "Consultant"].includes(role)) return "consultor";
    if (["Client Director", "Controller"].includes(role)) return "diretor";
    if (["Client Manager"].includes(role)) return "gerente";
    return "analista";
  };

  // SECURITY ROLE SYSTEM - INTEGRATED PROFILE LOGIN SESSIONS
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    email: string;
    role: "consultor" | "diretor" | "gerente" | "analista";
  } | null>(() => {
    const user = identityEngine.getCurrentUser();
    if (!user) {
      return null;
    }
    return {
      name: user.profile.fullName,
      email: user.profile.email,
      role: getLegacyMappedRole(user.role)
    };
  });

  useEffect(() => {
    if (activeSimUser) {
      setCurrentUser({
        name: activeSimUser.profile.fullName,
        email: activeSimUser.profile.email,
        role: getLegacyMappedRole(activeSimUser.role)
      });
    }
  }, [activeSimUser]);

  useEffect(() => {
    const handleOpenCentralDados = () => setIsCentralDadosOpen(true);
    const handleOpenFilters = () => setIsFilterDrawerOpen(true);

    window.addEventListener("sauron:open-central-dados", handleOpenCentralDados);
    window.addEventListener("sauron:open-filters", handleOpenFilters);

    return () => {
      window.removeEventListener("sauron:open-central-dados", handleOpenCentralDados);
      window.removeEventListener("sauron:open-filters", handleOpenFilters);
    };
  }, []);

  useEffect(() => {
    // 1. Subscribe to official ActiveDatasetStore events
    const unsubscribe = activeDatasetStore.subscribe((event) => {
      platformLogger.info(`[App] Received ActiveDatasetStore event: ${event.type}`, event.payload);
      
      platformLogger.info(`[Sauron Instrumentation] APP_DATASET_EVENT_RECEIVED - datasetId: ${event.payload.datasetId || "null"}, sourceName: ${event.payload.sourceName || "null"}, rowCount: ${event.payload.rowCount || 0}, columnCount: ${event.payload.columnCount || 0}, sourceType: ${event.payload.sourceType || "null"}`);

      if (event.type === "DATASET_ACTIVATED" || event.type === "DATASET_REHYDRATED") {
        if (event.payload.datasetId) {
          setActiveSource("SPREADSHEET_DATA");
          setHistoricalData(null);
          refreshDataSource();
        }
      } else if (event.type === "DATASET_REMOVED") {
        setActiveSource("SPREADSHEET_DATA");
        setHistoricalData(null);
        refreshDataSource();
      }
    });

    // 2. Rehydrate on reload
    activeDatasetStore.rehydrateFromStorage().then((dataset) => {
      if (dataset) {
        platformLogger.info(`[App] Rehydrated active dataset on mount: ${dataset.sourceName}`);
        setActiveSource("SPREADSHEET_DATA");
        refreshDataSource();
        void enterpriseConsolidationService.refreshActiveDatasetForContext(getEnterpriseContext());
      }
    });

    return () => {
      unsubscribe();
    };
  }, [setActiveSource, refreshDataSource]);

  useEffect(() => {
    if (activeDataset) {
      platformLogger.info(`[Sauron Instrumentation] APP_ACTIVE_DATASET_UPDATED - datasetId: ${activeDataset.datasetId}, sourceName: ${activeDataset.sourceName}, rowCount: ${activeDataset.rowCount}, columnCount: ${activeDataset.columnCount}, sourceType: ${activeDataset.sourceType}`);
    } else {
      platformLogger.info(`[Sauron Instrumentation] APP_ACTIVE_DATASET_UPDATED - datasetId: null, sourceName: null, rowCount: 0, columnCount: 0, sourceType: null`);
    }
  }, [activeDataset]);

  // COMPARATIVE RAPORTS SNAPSHOT CONTROL
  const [reportHistory, setReportHistory] = useState<any[]>([]);
  const [selectedComparisonSnapshotId, setSelectedComparisonSnapshotId] = useState<string>("");
  const [selectedSnapshotDataId, setSelectedSnapshotDataId] = useState<string>("");
  const [historyOption, setHistoryOption] = useState<"atual" | "historico_consolidado" | "snapshot_unico">("atual");

  // System Database load/save networks
  const loadSystemDb = async () => {
    try {
      const res = await fetch("/api/system/db");
      const resData = await res.json();
      if (res.ok && resData.success && resData.db) {
        const d = resData.db;
        if (d.segmentoCliente) setSegmentoCliente(d.segmentoCliente);
        if (d.observacaoGerente) setObservacaoGerente(d.observacaoGerente);
        if (d.comissoesConfig) {
          if (d.comissoesConfig.formula) setComissaoFormula(d.comissoesConfig.formula);
          if (d.comissoesConfig.taxaGeral !== undefined) setComissaoGeral(d.comissoesConfig.taxaGeral);
          if (d.comissoesConfig.taxaItens !== undefined) setComissaoItens(d.comissoesConfig.taxaItens);
          if (d.comissoesConfig.taxaAcessorios !== undefined) setComissaoAcessorios(d.comissoesConfig.taxaAcessorios);
        }
        if (d.narrarFeedback !== undefined) setNarrarFeedback(d.narrarFeedback);
        if (d.faturamentoOffset !== undefined) setFaturamentoOffset(d.faturamentoOffset);
        if (d.despesaOffset !== undefined) setDespesaOffset(d.despesaOffset);
      }
    } catch {
      setDbValidationMsg("Banco próprio indisponível. O sistema seguirá em modo local até a configuração ser concluída.");
    }
  };

  const persistSystemDbSettings = async (overrides = {}) => {
    try {
      const payload = {
        segmentoCliente,
        observacaoGerente,
        comissoesConfig: {
          formula: comissaoFormula,
          taxaGeral: comissaoGeral,
          taxaItens: comissaoItens,
          taxaAcessorios: comissaoAcessorios
        },
        narrarFeedback,
        faturamentoOffset,
        despesaOffset,
        ...overrides
      };
      await fetch("/api/system/db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      platformLogger.error("Não foi possível guardar as preferências do sistema.", e);
    }
  };

  // Sync operations feedback loaders
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<string>("");
  const [isSavingSnapshot, setIsSavingSnapshot] = useState<boolean>(false);
  
  // Active selected filters
  const [filtros, setFiltros] = useState<FiltrosDashboard>({
    grupos: [],
    cnpjs: [],
    marcas: [],
    meses: [],
    razoes: []
  });

  // Track the actual original headers/keys of the current records source to clean and scope filter lists (Requirement 7)
  const [actualKeys, setActualKeys] = useState<string[]>(["Grupo", "CNPJ", "Marca", "Empresa", "Mês", "Razão", "Categoria", "Vendedor"]);

  // Table pagination and sorting
  const [sortField, setSortField] = useState<keyof LancamentoFinanceiro>("Receita");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [reportLevel, setReportLevel] = useState<"completo" | "cnpj" | "marca">("completo");
  const [margemLimite, setMargemLimite] = useState<number>(10);

  // AI Consulting section states
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [aiSource, setAiSource] = useState<string>("");
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string>("");


  // --- ACTIONS & NETWORKING ---
  const loadReportHistoryMetadata = async () => {
    try {
      const res = await fetch("/api/reports/history");
      const resData = await res.json();
      if (res.ok && resData.success) {
        setReportHistory(resData.history || []);
      }
    } catch (e) {
      // Local mode has no required remote history service. Keep the current
      // source usable without presenting an infrastructure error to users.
      setReportHistory([]);
    }
  };

  const checkServerConfigAndSyncOnMount = async () => {
    try {
      const response = await fetch("/api/db/config");
      const resData = await response.json();
      if (response.ok && resData.success && resData.config) {
        setSyncStatus("Tentando sincronização do Banco de Dados configurado automaticamente...");
        const syncRes = await fetch("/api/db/sync", { method: "POST" });
        const syncData = await syncRes.json();
        if (syncRes.ok && syncData.success) {
          dataSourceManager.syncDatabaseRecords(syncData.data, syncData.sourceName);
          setSyncStatus("");
          loadReportHistoryMetadata();
        } else {
          setSyncStatus("Nenhum banco configurado na nuvem. Nenhuma fonte de dados ativa.");
        }
      }
    } catch {
      setSyncStatus("Nenhum banco configurado na nuvem. Nenhuma fonte de dados ativa.");
    }
  };

  // Run dynamic DB Synchronization - USER refresh button action
  const handleSyncDatabaseData = async () => {
    setIsSyncing(true);
    setSyncStatus("");
    try {
      const res = await fetch("/api/db/sync", { method: "POST" });
      const resData = await res.json();
      if (res.ok && resData.success) {
        dataSourceManager.syncDatabaseRecords(resData.data, resData.sourceName);
        setCamposAusentes([]);
        setSyncStatus(`Sucesso! Banco de dados atualizado. Importados ${resData.count} registros.`);
        await loadReportHistoryMetadata();
        setAiAnalysis(""); // Trigger clean context AI consult
        setHistoryOption("atual");
      } else {
        setSyncStatus(`Alerta: ${resData.error || "A conexão do banco precisa ser configurada por nós no Modo Administrativo antes de sincronizar."}`);
      }
    } catch (err) {
      setSyncStatus("Erro de rede: Não foi possível alcançar o servidor de banco de dados.");
    } finally {
      setIsSyncing(false);
    }
  };

  // Save manual snapshot of currently active data
  const handleSaveSnapshotManual = async () => {
    setIsSavingSnapshot(true);
    try {
      const descName = prompt("Insira uma etiqueta descritiva para este relatório histórico (ex: Fechamento Trimestral Q1):", `Análise ${new Date().toLocaleDateString()}`);
      if (descName === null) return;

      const res = await fetch("/api/reports/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: dataOrigem,
          sourceName: descName || `Relatório Manual ${new Date().toLocaleDateString()}`
        })
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        alert("Snapshot contábil do relatório congelado e arquivado com sucesso!");
        await loadReportHistoryMetadata();
      } else {
        alert(`Erro ao salvar snapshot: ${resData.error}`);
      }
    } catch (err) {
      alert("Erro ao falar com o servidor para arquivar o snapshot.");
    } finally {
      setIsSavingSnapshot(false);
    }
  };

  // Delete snapshot
  const handleDeleteSnapshot = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Tem certeza que deseja apagar este snapshot histórico do servidor?")) return;
    try {
      const res = await fetch(`/api/reports/history/${id}`, { method: "DELETE" });
      if (res.ok) {
        await loadReportHistoryMetadata();
        if (selectedComparisonSnapshotId === id) setSelectedComparisonSnapshotId("");
        if (selectedSnapshotDataId === id) {
          setSelectedSnapshotDataId("");
          setHistoryOption("atual");
          setHistoricalData(null);
        }
      }
    } catch (err) {
      platformLogger.error("Não foi possível excluir o registro histórico.", err);
    }
  };

  // Toggle history selection rules (Consolidation vs Single vs Active Live)
  const handleHistoryOptionChange = async (option: "atual" | "historico_consolidado" | "snapshot_unico", snapshotId?: string) => {
    setHistoryOption(option);
    setAiAnalysis("");

    if (option === "atual") {
      setHistoricalData(null);
      setSyncStatus("Dados em tempo real ativados.");
    } else if (option === "historico_consolidado") {
      setSyncStatus("Consolidando todos os snapshots salvos no histórico contábil...");
      try {
        const consolidated: LancamentoFinanceiro[] = [];
        for (const meta of reportHistory) {
          const r = await fetch(`/api/reports/history/${meta.id}`);
          const rData = await r.json();
          if (r.ok && rData.success && rData.snapshot?.data) {
            consolidated.push(...rData.snapshot.data);
          }
        }
        if (consolidated.length > 0) {
          setHistoricalData(consolidated);
          setSyncStatus(`Sucesso! Consolidado faturamento de ${reportHistory.length} uploads históricos combinados.`);
        } else {
          setSyncStatus("Nenhum snapshot no histórico. Salve ou importe para habilitar consolidado.");
          setHistoricalData(null);
          setHistoryOption("atual");
        }
      } catch (err) {
        platformLogger.error("Não foi possível consolidar o histórico de análises.", err);
        setSyncStatus("Erro de rede ao consolidar relatórios.");
      }
    } else if (option === "snapshot_unico" && snapshotId) {
      setSelectedSnapshotDataId(snapshotId);
      setSyncStatus(`Carregando snap id: ${snapshotId}`);
      try {
        const r = await fetch(`/api/reports/history/${snapshotId}`);
        const rData = await r.json();
        if (r.ok && rData.success && rData.snapshot) {
          setHistoricalData(rData.snapshot.data);
          setSyncStatus(`Exibindo dados históricos de: ${rData.snapshot.sourceName}`);
        }
      } catch (err) {
        platformLogger.error("Não foi possível abrir o registro histórico.", err);
      }
    }
  };



  // --- INITIALIZATION ---
  useEffect(() => {
    // Load metadata, system database configs and check for cloud database sync
    loadReportHistoryMetadata();
    checkServerConfigAndSyncOnMount();
    loadSystemDb();
  }, []);

  // Handle document dark class theme pairing
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("sauron-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("sauron-theme", "light");
    }
  }, [darkMode]);

  // Set default filters whenever original data changes - automatically detecting standard & custom columns (Requirement 7)
  const availableColumnProfiles = getAvailableFilters();
  const availableColumnProfilesString = JSON.stringify(availableColumnProfiles);

  useEffect(() => {
    if (dataOrigem.length > 0) {
      const nextFilters: FiltrosDashboard = {};
      
      // If we are using ActiveDataset (spreadsheet), populate dynamically based on availableColumnProfiles
      if (activeDataset && availableColumnProfiles.length > 0) {
        availableColumnProfiles.forEach(profile => {
          const uniqueValues = Array.from(new Set(dataOrigem.map(d => d[profile.name] !== undefined && d[profile.name] !== null ? String(d[profile.name]) : "").filter(v => v !== ""))).sort();
          nextFilters[profile.name] = uniqueValues;
        });
      } else {
        const uniqueGrupos = Array.from(new Set(dataOrigem.map(d => d.Grupo))).sort();
        const uniqueCnpjs = Array.from(new Set(dataOrigem.map(d => d.CNPJ))).sort();
        const uniqueMarcas = Array.from(new Set(dataOrigem.map(d => d.Marca))).sort();
        const uniqueMeses = Array.from(new Set(dataOrigem.map(d => d.Mês)));
        const uniqueRazoes = Array.from(new Set(dataOrigem.map(d => d.Razão))).sort();

        const hasKey = (key: string) => {
          return actualKeys.some(k => k.toLowerCase() === key.toLowerCase());
        };

        if (hasKey("Grupo")) nextFilters.grupos = uniqueGrupos;
        if (hasKey("CNPJ")) nextFilters.cnpjs = uniqueCnpjs;
        if (hasKey("Marca")) nextFilters.marcas = uniqueMarcas;
        if (hasKey("Mês")) nextFilters.meses = uniqueMeses;
        if (hasKey("Razão")) nextFilters.razoes = uniqueRazoes;

        // Detect any custom extra columns dynamically
        const extraFilters: Record<string, string[]> = {};
        const standardKeys = ["id", "Grupo", "CNPJ", "Marca", "Empresa", "Filial", "Mês", "Razão", "Categoria", "Receita", "Custo", "Despesa", "Lucro", "Margem", "Vendedor"];
        
        dataOrigem.forEach(item => {
          Object.keys(item).forEach(key => {
            if (!standardKeys.includes(key) && !key.startsWith("c_") && typeof item[key] === "string" && item[key].trim() !== "") {
              if (!extraFilters[key]) {
                extraFilters[key] = [];
              }
            }
          });
        });

        Object.keys(extraFilters).forEach(key => {
          if (hasKey(key)) {
            const uniqueValues = Array.from(new Set(dataOrigem.map(d => d[key] !== undefined && d[key] !== null ? String(d[key]) : "").filter(v => v !== ""))).sort();
            nextFilters[key] = uniqueValues;
          }
        });
      }

      // Only update if filters actually changed to avoid infinite loop
      setFiltros(prev => {
        if (JSON.stringify(prev) === JSON.stringify(nextFilters)) return prev;
        return nextFilters;
      });
    }
  }, [dataOrigem, actualKeys, activeDataset, availableColumnProfilesString]);

  // Unique elements for Sidebar choice indicators with standard contextual filtering (Requirement 7)
  const availableFilters = useMemo<FiltrosDashboard>(() => {
    if (dataOrigem.length === 0) {
      return { grupos: [], cnpjs: [], marcas: [], meses: [], razoes: [] };
    }

    if (activeDataset && availableColumnProfiles.length > 0) {
      const filtersDict: FiltrosDashboard = {};
      availableColumnProfiles.forEach(profile => {
        // We could implement cascading filters here too if needed, but for now simple extraction
        filtersDict[profile.name] = Array.from(new Set(dataOrigem.map(d => d[profile.name] !== undefined && d[profile.name] !== null ? String(d[profile.name]) : "").filter(v => v !== ""))).sort();
      });
      return filtersDict;
    }

    const activeConfigs = ClientFilterManager.getActiveFilters();
    const hasConfig = (colName: string) => activeConfigs.some(c => c.column.toLowerCase() === colName.toLowerCase());

    // 1. Grupos
    const grupos = hasConfig("Grupo")
      ? Array.from(new Set(dataOrigem.map(d => d.Grupo))).sort()
      : [];

    // 2. CNPJs
    const selectedGrps = filtros.grupos || [];
    const isGrpFiltered = selectedGrps.length > 0 && selectedGrps.length < grupos.length;
    const recordsForCnpj = isGrpFiltered 
      ? dataOrigem.filter(d => selectedGrps.includes(d.Grupo))
      : dataOrigem;
    const cnpjs = hasConfig("CNPJ")
      ? Array.from(new Set(recordsForCnpj.map(d => d.CNPJ))).sort()
      : [];

    // 3. Marcas
    const selectedCnpjs = filtros.cnpjs || [];
    const isCnpjFiltered = selectedCnpjs.length > 0 && selectedCnpjs.length < cnpjs.length;
    const recordsForMarca = dataOrigem.filter(d => {
      const matchGrp = !isGrpFiltered || selectedGrps.includes(d.Grupo);
      const matchCnpj = !isCnpjFiltered || selectedCnpjs.includes(d.CNPJ);
      return matchGrp && matchCnpj;
    });
    const marcas = hasConfig("Marca")
      ? Array.from(new Set(recordsForMarca.map(d => d.Marca))).sort()
      : [];

    // 4. Meses and razoes likewise adapt contextually
    const selectedMarcas = filtros.marcas || [];
    const isMarcaFiltered = selectedMarcas.length > 0 && selectedMarcas.length < marcas.length;
    
    const recordsOthers = dataOrigem.filter(d => {
      const matchGrp = !isGrpFiltered || selectedGrps.includes(d.Grupo);
      const matchCnpj = !isCnpjFiltered || selectedCnpjs.includes(d.CNPJ);
      const matchMarca = !isMarcaFiltered || selectedMarcas.includes(d.Marca);
      return matchGrp && matchCnpj && matchMarca;
    });

    const meses = hasConfig("Mês")
      ? Array.from(new Set(recordsOthers.map(d => d.Mês)))
      : [];
    const razoes = hasConfig("Razão")
      ? Array.from(new Set(recordsOthers.map(d => d.Razão))).sort()
      : [];

    // Extract dynamic keys values (Requirement 7)
    const dynamicFiltersValues: Record<string, string[]> = {};
    for (const config of activeConfigs) {
      const col = config.column;
      if (["Grupo", "CNPJ", "Marca", "Empresa", "Mês", "Razão"].includes(col)) {
        continue;
      }
      
      const values = Array.from(new Set(dataOrigem.map(d => {
        let val = d[col];
        if (val === undefined) {
          const capitalized = col.charAt(0).toUpperCase() + col.slice(1);
          val = d[capitalized] !== undefined ? d[capitalized] : d[Object.keys(d).find(k => k.toLowerCase() === col.toLowerCase()) || ""];
        }
        return val !== undefined && val !== null ? String(val) : "";
      }).filter(v => v !== "" && v !== "undefined"))).sort();
      
      dynamicFiltersValues[col] = values;
    }

    return { grupos, cnpjs, marcas, meses, razoes, ...dynamicFiltersValues };
  }, [dataOrigem, filtros]);

  // --- COMPARISON DRIFTS MATH ---
  const selectedComparisonSnapshot = useMemo(() => {
    if (!selectedComparisonSnapshotId) return null;
    return reportHistory.find(s => s.id === selectedComparisonSnapshotId) || null;
  }, [selectedComparisonSnapshotId, reportHistory]);

  const comparisonGains = useMemo(() => {
    if (!selectedComparisonSnapshot) return null;
    const past = selectedComparisonSnapshot.metrics;
    
    // Calculating current metrics
    const currentReceita = dataOrigem.reduce((acc, curr) => acc + curr.Receita, 0);
    const currentLucro = dataOrigem.reduce((acc, curr) => acc + curr.Lucro, 0);
    const currentDespesa = dataOrigem.reduce((acc, curr) => acc + curr.Despesa, 0);
    const currentMargem = currentReceita > 0 ? (currentLucro / currentReceita) * 100 : 0;

    const diffReceita = currentReceita - past.receitaTotal;
    const pctReceita = past.receitaTotal > 0 ? (diffReceita / past.receitaTotal) * 100 : 0;

    const diffLucro = currentLucro - past.lucroTotal;
    const pctLucro = past.lucroTotal > 0 ? (diffLucro / past.lucroTotal) * 100 : 0;

    const diffDespesa = currentDespesa - past.despesaTotal;
    const pctDespesa = past.despesaTotal > 0 ? (diffDespesa / past.despesaTotal) * 100 : 0;

    const diffMargem = currentMargem - past.margemMedia;

    return {
      receita: { 
        val: `${diffReceita >= 0 ? "+" : ""}${((diffReceita / (past.receitaTotal || 1)) * 100).toFixed(1)}%`, 
        isPositive: diffReceita >= 0 
      },
      lucro: { 
        val: `${diffLucro >= 0 ? "+" : ""}${((diffLucro / (past.lucroTotal || 1)) * 100).toFixed(1)}%`, 
        isPositive: diffLucro >= 0 
      },
      despesa: { 
        val: `${diffDespesa >= 0 ? "+" : ""}${((diffDespesa / (past.despesaTotal || 1)) * 100).toFixed(1)}%`, 
        isPositive: diffDespesa <= 0 // despesa menor é positivo
      },
      margem: { 
        val: `${diffMargem >= 0 ? "+" : ""}${diffMargem.toFixed(1)}% de margem`, 
        isPositive: diffMargem >= 0 
      }
    };
  }, [selectedComparisonSnapshot, dataOrigem]);

  // --- DATA FLOW & FILTERING ---
  const filteredData = useMemo(() => {
    return dataOrigem.filter((item) => {
      // Access Control Scope Filtering (v0.6.5) - Filter based on active role and workspace allowed companies
      const allowedCompanies = accessControlEngine.getVisibleCompaniesForUser(activeSimUser, identityEngine.getCurrentWorkspace());
      if (allowedCompanies && allowedCompanies.length > 0) {
        const matchCompanyScope = allowedCompanies.some(
          c => item.Empresa && (item.Empresa === c || String(item.Empresa).includes(c) || c.includes(String(item.Empresa)))
        );
        if (!matchCompanyScope) {
          return false;
        }
      }

      // 1. Static filters (with fallback for empty list to prevent blocking)
      const matchGrupo = !filtros.grupos || filtros.grupos.length === 0 || filtros.grupos.includes(item.Grupo);
      const matchCnpj = !filtros.cnpjs || filtros.cnpjs.length === 0 || filtros.cnpjs.includes(item.CNPJ);
      const matchMarca = !filtros.marcas || filtros.marcas.length === 0 || filtros.marcas.includes(item.Marca);
      const matchMes = !filtros.meses || filtros.meses.length === 0 || filtros.meses.includes(item.Mês);
      const matchRazao = !filtros.razoes || filtros.razoes.length === 0 || filtros.razoes.includes(item.Razão);
      
      if (!(matchGrupo && matchCnpj && matchMarca && matchMes && matchRazao)) {
        return false;
      }

      // 2. Extra dynamic / Custom filters (added from arbitrary spreadsheet columns)
      for (const key of Object.keys(filtros)) {
        if (["grupos", "cnpjs", "marcas", "meses", "razoes"].includes(key)) continue;

        const filterValues = filtros[key];
        if (!filterValues || filterValues.length === 0) continue;

        // Extract value with case robust lookup
        let itemValue = item[key];
        if (itemValue === undefined) {
          const capitalized = key.charAt(0).toUpperCase() + key.slice(1);
          if (item[capitalized] !== undefined) {
            itemValue = item[capitalized];
          } else {
            const foundKey = Object.keys(item).find(k => k.toLowerCase() === key.toLowerCase());
            if (foundKey) {
              itemValue = item[foundKey];
            }
          }
        }

        if (itemValue !== undefined && itemValue !== null) {
          const itemValueStr = String(itemValue);
          if (!filterValues.includes(itemValueStr)) {
            return false;
          }
        }
      }

      return true;
    });
  }, [dataOrigem, filtros, activeSimUser, simContextKey]);

  // Compute aggregated KPI telemetry & distributions for chart rendering
  const metrics = useMemo<MetricasConsolidadas>(() => {
    if (filteredData.length === 0) {
      return {
        receitaTotal: 0,
        custoTotal: 0,
        despesaTotal: 0,
        lucroTotal: 0,
        margemMedia: 0,
        porMarca: [],
        porCnpj: [],
        porRazao: [],
        porMes: []
      };
    }

    const receitaTotalRaw = filteredData.reduce((acc, curr) => acc + curr.Receita, 0);
    const custoTotal = filteredData.reduce((acc, curr) => acc + curr.Custo, 0);
    const despesaTotalRaw = filteredData.reduce((acc, curr) => acc + curr.Despesa, 0);

    // Apply manual adjustment offsets securely in memory
    const receitaTotal = receitaTotalRaw + faturamentoOffset;
    const despesaTotal = despesaTotalRaw + despesaOffset;
    const lucroTotal = receitaTotal - custoTotal - despesaTotal;
    const margemMedia = receitaTotal > 0 ? (lucroTotal / receitaTotal) * 100 : 0;

    // Dist por Marca (Receita, Lucro)
    const marcasMap: Record<string, { receita: number; lucro: number }> = {};
    filteredData.forEach((d) => {
      if (!marcasMap[d.Marca]) marcasMap[d.Marca] = { receita: 0, lucro: 0 };
      marcasMap[d.Marca].receita += d.Receita;
      marcasMap[d.Marca].lucro += d.Lucro;
    });
    const porMarca = Object.keys(marcasMap).map((m) => {
      const rec = marcasMap[m].receita;
      const luc = marcasMap[m].lucro;
      return {
        marca: m,
        receita: Math.round(rec * 100) / 100,
        lucro: Math.round(luc * 100) / 100,
        margem: rec > 0 ? (luc / rec) * 100 : 0
      };
    }).sort((a, b) => b.receita - a.receita);

    // Dist por CNPJ (Lucro)
    const cnpjsMap: Record<string, { empresa: string; receita: number; lucro: number }> = {};
    filteredData.forEach((d) => {
      if (!cnpjsMap[d.CNPJ]) cnpjsMap[d.CNPJ] = { empresa: d.Empresa, receita: 0, lucro: 0 };
      cnpjsMap[d.CNPJ].receita += d.Receita;
      cnpjsMap[d.CNPJ].lucro += d.Lucro;
    });
    const porCnpj = Object.keys(cnpjsMap).map((c) => {
      const rec = cnpjsMap[c].receita;
      const luc = cnpjsMap[c].lucro;
      return {
        cnpj: c,
        empresa: cnpjsMap[c].empresa,
        receita: Math.round(rec * 100) / 100,
        lucro: Math.round(luc * 100) / 100,
        margem: rec > 0 ? (luc / rec) * 100 : 0
      };
    }).sort((a, b) => b.lucro - a.lucro);

    // Dist por Razão (Despesa) - Foco principal solicitado
    const razoesMap: Record<string, number> = {};
    filteredData.forEach((d) => {
      if (!razoesMap[d.Razão]) razoesMap[d.Razão] = 0;
      razoesMap[d.Razão] += d.Despesa;
    });
    const porRazao = Object.keys(razoesMap).map((r) => {
      const desp = razoesMap[r];
      return {
        razao: r,
        despesa: Math.round(desp * 100) / 100,
        participacao: despesaTotal > 0 ? (desp / despesaTotal) * 100 : 0
      };
    }).sort((a, b) => b.despesa - a.despesa);

    // Dist por Mês (Evolução)
    const mesesOrdem: Record<string, number> = {
      "Janeiro": 1, "Fevereiro": 2, "Março": 3, "Abril": 4, "Maio": 5, "Junho": 6,
      "Julho": 7, "Agosto": 8, "Setembro": 9, "Outubro": 10, "Novembro": 11, "Dezembro": 12
    };
    const mesesMap: Record<string, { lucro: number; receita: number }> = {};
    filteredData.forEach((d) => {
      if (!mesesMap[d.Mês]) mesesMap[d.Mês] = { lucro: 0, receita: 0 };
      mesesMap[d.Mês].lucro += d.Lucro;
      mesesMap[d.Mês].receita += d.Receita;
    });
    const porMes = Object.keys(mesesMap).map((m) => {
      return {
        mes: m,
        lucro: Math.round(mesesMap[m].lucro * 100) / 100,
        receita: Math.round(mesesMap[m].receita * 100) / 100,
        ordem: mesesOrdem[m] || 99
      };
    }).sort((a, b) => a.ordem - b.ordem);

    return {
      receitaTotal,
      custoTotal,
      despesaTotal,
      lucroTotal,
      margemMedia,
      porMarca,
      porCnpj,
      porRazao,
      porMes
    };
  }, [filteredData, faturamentoOffset, despesaOffset]);

  // --- REAL-TIME COMMISSION CALCULATOR ENGINE ---
  const calculatedCommissions = useMemo(() => {
    let totalComissoes = 0;
    const detailsByCnpj: Record<string, { empresa: string; comissao: number; receitaBase: number }> = {};
    const detailsByAccount: Record<string, { comissao: number; receitaBase: number }> = {};

    filteredData.forEach((row) => {
      let comissaoParaLinha = 0;
      const razao = row.Razão || "";

      if (comissaoFormula === "acessorios_vendas") {
        // Custom commission rule for differentiated sales categories:
        // Vehicles, accessories, and general items follow separate rate buckets.
        if (razao.includes("3.0.0.1")) {
          comissaoParaLinha = row.Receita * (comissaoItens / 100);
        } else if (razao.includes("3.0.1.1")) {
          comissaoParaLinha = row.Receita * (comissaoAcessorios / 100);
        } else {
          comissaoParaLinha = row.Receita * (comissaoGeral / 100);
        }
      } else if (comissaoFormula === "maquinas_agricolas") {
        // Regra de máquinas agrícolas:
        // 0.8% para grandes faturamentos (3.0.0.1)
        // 4.0% para itens/categorias adicionais (3.0.1.1)
        // 2.0% para serviços de oficina (3.0.3.1)
        // 1.0% para outros
        if (razao.includes("3.0.0.1")) {
          comissaoParaLinha = row.Receita * 0.008;
        } else if (razao.includes("3.0.1.1")) {
          comissaoParaLinha = row.Receita * 0.040;
        } else if (razao.includes("3.0.3.1")) {
          comissaoParaLinha = row.Receita * 0.020;
        } else {
          comissaoParaLinha = row.Receita * 0.010;
        }
      } else {
        // Fórmula simples flat rate geral
        comissaoParaLinha = row.Receita * (comissaoGeral / 100);
      }

      totalComissoes += comissaoParaLinha;

      // Grouping por CNPJ
      if (!detailsByCnpj[row.CNPJ]) {
        detailsByCnpj[row.CNPJ] = { empresa: row.Empresa, comissao: 0, receitaBase: 0 };
      }
      detailsByCnpj[row.CNPJ].comissao += comissaoParaLinha;
      detailsByCnpj[row.CNPJ].receitaBase += row.Receita;

      // Grouping por rubrica Reason/Conta
      if (!detailsByAccount[razao]) {
        detailsByAccount[razao] = { comissao: 0, receitaBase: 0 };
      }
      detailsByAccount[razao].comissao += comissaoParaLinha;
      detailsByAccount[razao].receitaBase += row.Receita;
    });

    return {
      total: Math.round(totalComissoes * 100) / 100,
      detailsByCnpj: Object.keys(detailsByCnpj).map((cnpj) => ({
        cnpj,
        empresa: detailsByCnpj[cnpj].empresa,
        comissao: Math.round(detailsByCnpj[cnpj].comissao * 100) / 100,
        receita: Math.round(detailsByCnpj[cnpj].receitaBase * 100) / 100,
      })),
      detailsByAccount: Object.keys(detailsByAccount).map((acc) => ({
        razao: acc,
        comissao: Math.round(detailsByAccount[acc].comissao * 100) / 100,
        receita: Math.round(detailsByAccount[acc].receitaBase * 100) / 100,
      })),
    };
  }, [filteredData, comissaoFormula, comissaoItens, comissaoAcessorios, comissaoGeral]);

  // Trigger dynamic Consulting Analysis from Backend (Gemini or Advanced Fallback)
  const handleTriggerAnalysis = async () => {
    try {
      setAiLoading(true);
      setAiError("");
      const analysisEndpoint = String(((import.meta as any).env || {}).VITE_ANALYSIS_ENDPOINT || "").trim();
      if (!analysisEndpoint) {
        setAiError("Análise inteligente pendente: conecte um serviço de análise para gerar diagnóstico automático.");
        return;
      }

      const response = await fetch(analysisEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metrics: {
            receitaTotal: metrics.receitaTotal,
            custoTotal: metrics.custoTotal,
            despesaTotal: metrics.despesaTotal,
            lucroTotal: metrics.lucroTotal,
            margemMedia: metrics.margemMedia,
            porMarca: metrics.porMarca,
            porCnpj: metrics.porCnpj,
            porRazao: metrics.porRazao
          },
          selectedFilters: {
            grupos: filtros.grupos,
            marcas: filtros.marcas,
            cnpjs: filtros.cnpjs,
            meses: filtros.meses
          },
          segmentoCliente,
          observacaoGerente
        })
      });

      const resData = await response.json();
      if (resData.error) {
        throw new Error(resData.error);
      }
      setAiAnalysis(resData.analysis);
      setAiSource(resData.source);
    } catch (err: any) {
      setAiError("Não foi possível gerar a análise inteligente agora. Os dados reais continuam disponíveis nos módulos.");
    } finally {
      setAiLoading(false);
    }
  };

  // --- AUDIO SYNTHESIS NARRATION ---
  useEffect(() => {
    if (narrarFeedback && aiAnalysis && !aiLoading) {
      window.speechSynthesis?.cancel(); // Cancel any current narration queue
      
      // Clean syntactic markdown tags for fluent speaking stream
      const spokenText = aiAnalysis
        .replace(/[#*`_\-]/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      const utterance = new SpeechSynthesisUtterance(spokenText);
      utterance.lang = "pt-BR";
      utterance.rate = 1.05;
      window.speechSynthesis?.speak(utterance);
    } else {
      window.speechSynthesis?.cancel(); // Mute/stop when deactivated
    }
  }, [aiAnalysis, narrarFeedback, aiLoading]);

  // Run initial report on first mount - safely guarded against infinite retry loops on failure
  const analyzedMetricsRef = useRef<string>("");
  useEffect(() => {
    const metricsKey = `${metrics.receitaTotal}-${metrics.lucroTotal}-${metrics.porMarca?.length || 0}`;
    if (
      metrics.receitaTotal > 0 && 
      Math.abs(metrics.receitaTotal) > 1000 && 
      !aiAnalysis && 
      !aiLoading && 
      analyzedMetricsRef.current !== metricsKey
    ) {
      analyzedMetricsRef.current = metricsKey;
      handleTriggerAnalysis();
    }
  }, [metrics, aiAnalysis, aiLoading]);

  // Reset filtering state
  const handleResetFilters = () => {
    setFiltros({
      grupos: [...availableFilters.grupos],
      cnpjs: [...availableFilters.cnpjs],
      marcas: [...availableFilters.marcas],
      meses: [...availableFilters.meses],
      razoes: [...availableFilters.razoes]
    });
  };

  const runDbValidationCheck = (data: LancamentoFinanceiro[]) => {
    if (!data || data.length === 0) {
      setDbValidationMsg("ALERTA: O banco de dados retornou 0 registros válidos. Verifique as credenciais ou as tabelas do seu mapeamento.");
      return;
    }

    const hasEmptyFields = data.some(row => !row.Grupo || !row.CNPJ || !row.Empresa || !row.Mês);
    const totalReceita = data.reduce((acc, curr) => acc + (curr.Receita || 0), 0);
    const uniqueGroups = Array.from(new Set(data.filter(d => d.Grupo).map(d => d.Grupo)));

    let status = `✓ CONEXÃO INTEGRA: ${data.length} registros financeiros extraídos e mapeados com absoluto sucesso. `;
    status += `Volume consolidado de ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalReceita)}. `;
    status += `Grupo(s) ativo(s): [${uniqueGroups.join(", ")}]. `;

    if (hasEmptyFields) {
      status += "⚠️ ALERTA: Detectamos linhas com campos ou strings vazias no preenchimento do seu banco de dados original.";
    } else {
      status += "✓ 100% dos registros possuem dados íntegros de mapeamento e foram perfeitamente agregados no painel visual.";
    }

    setDbValidationMsg(status);
  };

  const handleDatabaseDataLoaded = (data: LancamentoFinanceiro[], sourceName: string, isVpn?: boolean) => {
    // F6 double ingestion protection
    const currentActiveDataset = activeDatasetStore.getActiveDataset();
    if (currentActiveDataset && currentActiveDataset.datasetId && currentActiveDataset.rawStorageRef) {
      if (sourceName.toLowerCase().includes(".xls") || sourceName.toLowerCase().includes(".csv") || sourceName.toLowerCase().includes("planilha") || sourceName.toLowerCase().includes("combinada")) {
        platformLogger.warn("A fonte ativa já está pronta; a nova leitura duplicada foi evitada.", currentActiveDataset.datasetId);
        return;
      }
    }

    setCamposAusentes([]);

    const keys = new Set<string>();
    if (data && data.length > 0) {
      data.forEach(row => {
        Object.keys(row).forEach(k => {
          if (k !== "id") {
            keys.add(k);
          }
        });
      });
    }
    setActualKeys(Array.from(keys));

    // DatabaseConnector is a database source. Spreadsheet files are persisted
    // exclusively by ImportService and never converted into virtual files here.
    dataSourceManager.syncDatabaseRecords(data, sourceName);

    if (isVpn !== undefined) {
      setIsVpnSimulated(isVpn);
    }
    runDbValidationCheck(data);
  };

  const triggerFileSelect = () => {
    setIsCentralDadosOpen(false);
    setActiveTab("importacao");
    fileInputRef.current?.click();
  };

  const handleSharedFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (files.length === 0) return;
    setPendingSharedFiles(files);
  };

  useEffect(() => {
    if (activeTab !== "importacao" || !pendingSharedFiles) return;

    // A rota já está montada neste ponto, então o listener da importação não
    // é perdido durante a troca de tela iniciada pelo seletor global.
    const timer = window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent("sauron:spreadsheet-files-selected", { detail: { files: pendingSharedFiles } }));
      setPendingSharedFiles(null);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [activeTab, pendingSharedFiles]);

  // Group levels configuration inside Table Exporter section (Requirement 9)
  const reportData = useMemo(() => {
    if (reportLevel === "completo") {
      const gps: Record<string, any> = {};
      filteredData.forEach(d => {
        const key = `${d.Grupo}_${d.Empresa}_${d.Mês}`;
        if (!gps[key]) {
          gps[key] = {
            Grupo: d.Grupo,
            Empresa: d.Empresa,
            Mês: d.Mês,
            Receita: 0,
            Custo: 0,
            Despesa: 0,
            Lucro: 0
          };
        }
        gps[key].Receita += d.Receita;
        gps[key].Custo += d.Custo;
        gps[key].Despesa += d.Despesa;
        gps[key].Lucro += d.Lucro;
      });
      return Object.values(gps).map((item: any) => ({
        ...item,
        Receita: Math.round(item.Receita * 100) / 100,
        Custo: Math.round(item.Custo * 100) / 100,
        Despesa: Math.round(item.Despesa * 100) / 100,
        Lucro: Math.round(item.Lucro * 100) / 100,
        Margem: item.Receita > 0 ? Math.round((item.Lucro / item.Receita) * 10000) / 100 : 0
      }));
    } else if (reportLevel === "cnpj") {
      const gps: Record<string, any> = {};
      filteredData.forEach(d => {
        const key = `${d.CNPJ}_${d.Mês}`;
        if (!gps[key]) {
          gps[key] = {
            CNPJ: d.CNPJ,
            Empresa: d.Empresa,
            Mês: d.Mês,
            Receita: 0,
            Custo: 0,
            Despesa: 0,
            Lucro: 0
          };
        }
        gps[key].Receita += d.Receita;
        gps[key].Custo += d.Custo;
        gps[key].Despesa += d.Despesa;
        gps[key].Lucro += d.Lucro;
      });
      return Object.values(gps).map((item: any) => ({
        ...item,
        Receita: Math.round(item.Receita * 100) / 100,
        Custo: Math.round(item.Custo * 100) / 100,
        Despesa: Math.round(item.Despesa * 100) / 100,
        Lucro: Math.round(item.Lucro * 100) / 100,
        Margem: item.Receita > 0 ? Math.round((item.Lucro / item.Receita) * 10000) / 100 : 0
      }));
    } else {
      const gps: Record<string, any> = {};
      filteredData.forEach(d => {
        const key = `${d.Marca}_${d.Mês}`;
        if (!gps[key]) {
          gps[key] = {
            Marca: d.Marca,
            Empresa: d.Empresa,
            Mês: d.Mês,
            Receita: 0,
            Custo: 0,
            Despesa: 0,
            Lucro: 0
          };
        }
        gps[key].Receita += d.Receita;
        gps[key].Custo += d.Custo;
        gps[key].Despesa += d.Despesa;
        gps[key].Lucro += d.Lucro;
      });
      return Object.values(gps).map((item: any) => ({
        ...item,
        Receita: Math.round(item.Receita * 100) / 100,
        Custo: Math.round(item.Custo * 100) / 100,
        Despesa: Math.round(item.Despesa * 100) / 100,
        Lucro: Math.round(item.Lucro * 100) / 100,
        Margem: item.Receita > 0 ? Math.round((item.Lucro / item.Receita) * 10000) / 100 : 0
      }));
    }
  }, [filteredData, reportLevel]);

  // Sorted report lines
  const sortedReportData = useMemo(() => {
    return [...reportData].sort((a: any, b: any) => {
      let valA = a[sortField];
      let valB = b[sortField];
      
      if (valA === undefined) valA = 0;
      if (valB === undefined) valB = 0;

      if (typeof valA === "string") {
        return sortOrder === "asc"
          ? (valA as string).localeCompare(valB as string)
          : (valB as string).localeCompare(valA as string);
      }
      return sortOrder === "asc"
        ? (valA as number) - (valB as number)
        : (valB as number) - (valA as number);
    });
  }, [reportData, sortField, sortOrder]);

  const itensAbaixoDoLimite = useMemo(() => {
    return sortedReportData.filter((row: any) => row.Margem < margemLimite).length;
  }, [sortedReportData, margemLimite]);

  const toggleSort = (field: any) => {
    if (sortField === field) {
      setSortOrder(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const handleDownloadReport = () => {
    const csvContent = exportToCSV(sortedReportData);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `relatorio_agrupado_${reportLevel}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper formatting values
  const formatCurrencyValue = (val: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
  };

  if (!currentUser) {
    return (
      <LoginScreen
        onLogin={(user) => {
          setCurrentUser(user);
          localStorage.setItem("sauron_user", JSON.stringify(user));
        }}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />
    );
  }

  return (
    <div className="bg-white dark:bg-slate-950 min-h-screen text-black dark:text-slate-100 font-sans flex antialiased transition-colors duration-150 overflow-x-hidden">
              <AppSidebar
        activePage={activeTab} 
        setActivePage={setActiveTab} 
        activeIndustryTemplateId={activeIndustryTemplateId}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
        isDesktopCollapsed={isDesktopSidebarCollapsed}
        setIsDesktopCollapsed={setIsDesktopSidebarCollapsed}
                userRole={activeSimUser?.role}
                hasActiveDataset={!!activeDataset}
      />

      {/* Main Content wrapper */}
      <div className={`flex flex-col flex-1 min-h-screen w-full transition-all duration-300 relative ${isDesktopSidebarCollapsed ? "lg:pl-16" : "lg:pl-64"}`}>
        
        {/* HEADER SECTION - High Density Style */}
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-3 px-4 md:px-6 shrink-0 shadow-sm z-20 sticky top-0">
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full xl:w-auto">
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => setIsMobileSidebarOpen(true)}
                  className="lg:hidden p-1.5 -ml-1 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors mr-1"
                  title="Abrir Menu"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
                </button>
                <span className="text-[10px] bg-sauron-navy text-white px-2 py-0.5 rounded font-mono font-bold tracking-wider uppercase">Sauron OS</span>
                <span className="text-[11px] hidden sm:inline text-slate-500 font-medium tracking-wide">Enterprise Consulting Operating System</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-sm md:text-base font-extrabold text-sauron-navy tracking-tight flex items-center gap-1.5">
                  <Building className="text-sauron-blue shrink-0" size={16} />
                  <span className="truncate">Visão Consolidada Corporativa</span>
                </h1>
                
                {/* Role Indicator Pill */}
                {currentUser?.role === "consultor" ? (
                  <span className="flex items-center gap-1 text-[10px] bg-sauron-gray border border-slate-200 text-sauron-dark px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide shrink-0">
                    <Shield size={10} className="stroke-[2.5]" /> Configuração
                  </span>
                ) : currentUser?.role === "diretor" ? (
                  <span className="flex items-center gap-1 text-[10px] bg-sauron-blue/10 border border-sauron-blue/20 text-sauron-dark px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide shrink-0">
                    <BarChart3 size={10} /> Direção
                  </span>
                ) : currentUser?.role === "gerente" ? (
                  <span className="flex items-center gap-1 text-[10px] bg-sauron-green-light border border-sauron-green-cane text-sauron-dark px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide shrink-0">
                    <Sliders size={10} /> Controladoria
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide shrink-0">
                    <BookOpen size={10} /> Leitura
                  </span>
                )}

                {/* Data Reality Status Pill */}
                {!activeDataset && (!activeRecords || activeRecords.length === 0) ? (
                  <span className="flex items-center gap-1 text-[10px] bg-slate-100 border border-slate-200 text-slate-600 px-2 flex-shrink-0 py-0.5 rounded shadow-sm font-bold tracking-wide">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                    SEM FONTE ATIVA
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] bg-sauron-green-light border border-sauron-green-cane text-sauron-navy px-2 flex-shrink-0 py-0.5 rounded shadow-sm font-bold tracking-wide truncate max-w-[150px]">
                    <div className="w-1.5 h-1.5 rounded-full bg-sauron-green-cane shrink-0" />
                    DADOS REAIS
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-2 items-center w-full lg:w-auto overflow-x-auto hide-scrollbar pb-1">
              <input
                type="file"
                multiple
                ref={fileInputRef}
                onChange={handleSharedFileSelection}
                accept=".csv, .xlsx, .xls"
                className="hidden"
                aria-hidden="true"
              />

              {/* Discrete Central de Dados button */}
              <button
                onClick={() => setIsCentralDadosOpen(true)}
                data-testid="btn-open-data-center"
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] uppercase tracking-wide font-black cursor-pointer h-8 shrink-0 shadow-xs"
                title="Configurações de banco de dados, planilhas, VPN, segmentos e APIs"
              >
                <Database size={11} className="text-blue-500 shrink-0" />
                <span>Fontes e Importações</span>
              </button>

              {/* Discrete Filtros Ativos button */}
              <button
                onClick={() => setIsFilterDrawerOpen(true)}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] uppercase tracking-wide font-black cursor-pointer h-8 shrink-0 shadow-xs"
                title="Abrir painel lateral de filtragem dinâmica"
              >
                <Sliders size={11} className="text-indigo-500 shrink-0" />
                <span>Filtros ativos ({Object.keys(filtros).reduce((acc,k)=>filtros[k as keyof FiltrosDashboard]?acc+1:acc,0)})</span>
              </button>

              {/* Dark Mode Theme Selector */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="flex items-center justify-center gap-1 px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-[10px] uppercase font-extrabold tracking-wide h-8 shrink-0 shadow-xs"
                title={darkMode ? "Ativar Modo Claro" : "Ativar Modo Escuro"}
              >
                {darkMode ? (
                   <Sun size={12} className="text-amber-500" />
                ) : (
                   <Moon size={12} className="text-indigo-500" />
                )}
              </button>

              {/* User session controls */}
              {currentUser && (
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-1 rounded-md text-left shrink-0 h-8">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black leading-tight text-slate-800 dark:text-slate-100 uppercase truncate max-w-[80px]" title={currentUser.name}>
                      {currentUser.name}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      auditLog("ENCERRAMENTO_SESSÃO", `Usuário encerrou o período operacional regulamentar no portal de acessos.`, currentUser.name);
                      localStorage.removeItem("sauron_user");
                      setCurrentUser(null);
                    }}
                    className="px-1.5 py-1 text-[8px] uppercase font-black text-rose-700 dark:text-rose-450 hover:bg-rose-50 dark:hover:bg-rose-950/45 rounded-md transition cursor-pointer flex items-center justify-center"
                    title="Sair da sessão"
                    aria-label="Sair da sessão"
                  >
                    <Lock size={10} className="sm:mr-0.5" aria-hidden="true" />
                    <span className="hidden sm:inline ml-0.5">Sair</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* WORKSPACE MAIN AREA SCROLLABLE */}
        <main className="flex-1 w-full p-4 md:p-6 flex flex-col gap-5 bg-slate-50 dark:bg-slate-950">
          {/* CONTEXT BAR (v0.6.8 - Consulting OS Cognitive Anchor) */}
          <GlobalContextBar />

          {/* Header/Breadcrumb local da página */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm shrink-0">
            <div>
              <h2 className="text-xl font-black text-slate-800 dark:text-white capitalize">
                {activeTab.replace(/_/g, " ")}
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Visão corporativa de painéis interativos.</p>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsFilterDrawerOpen(true)}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase rounded-lg shadow-sm cursor-pointer transition-colors"
                id="open-filter-drawer-btn"
                title="Habilitar, ocultar e buscar filtros por qualquer coluna"
              >
                <Sliders size={14} className="animate-pulse" /> Gerenciar Filtros
              </button>
              <button 
                onClick={() => setIsFilterDrawerOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer transition-colors"
              >
                <Sliders size={14} /> Filtros Ativos ({Object.keys(filtros).reduce((acc,k)=>filtros[k as keyof FiltrosDashboard]?acc+1:acc,0)})
              </button>
            </div>
          </div>

          {/* DataStatusStrip compacto (Sprint Ω+1.2 — Interface Minimalista) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs text-xs mb-1">
            <div className="flex flex-wrap items-center gap-2">
              <button 
                onClick={() => setIsCentralDadosOpen(true)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold uppercase tracking-wide cursor-pointer transition text-[10px] ${
                  activeDataset
                    ? "bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-300"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${activeDataset ? "bg-emerald-500" : "bg-slate-400"}`} />
                {activeDataset ? "Dados Reais Conectados" : "Nenhuma fonte de dados ativa"}
              </button>
              
              <span className="text-slate-350 dark:text-slate-700 select-none">•</span>
              <span className="text-slate-500 font-semibold font-mono text-[10px]">
                Filtros Ativos ({Object.keys(filtros).reduce((acc,k)=>filtros[k as keyof FiltrosDashboard]?acc+1:acc,0)}) • Fonte: {activeDataset ? `Planilha (${activeDataset.sourceName})` : "Nenhuma fonte de dados ativa."}
              </span>
            </div>

            <button 
              onClick={() => setIsCentralDadosOpen(true)}
              className="text-[10px] font-black uppercase tracking-wider text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition shrink-0 cursor-pointer flex items-center gap-1"
            >
              <Database size={12} />
              <span>Fontes e Importações →</span>
            </button>
          </div>

          <div className="flex-1 flex flex-col gap-5">
            {/* ANALYTICS CONTAINER */}
            <section className="flex-1 space-y-4 overflow-x-hidden">

              {syncStatus && (
                <div className="bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-900 text-sky-850 dark:text-sky-350 px-4 py-2 text-xs rounded-xl flex items-center justify-between gap-2 shadow-sm animate-fade-in">
                  <div className="flex items-center gap-2">
                    <Database size={14} className="text-sky-600 animate-pulse shrink-0" />
                    <span className="font-semibold">{syncStatus}</span>
                  </div>
                  <button onClick={() => setSyncStatus("")} className="text-sky-400 hover:text-sky-600 text-xs font-bold font-mono px-1">✕</button>
                </div>
              )}

           {/* TAB ENTRANCE: ACTIVE PAGE CONDITIONAL RENDERING */}
          {!activeDataset && dataOrigemReal.length === 0 && !["enterprise_center", "vpn_gateway", "central_dados", "importacao", "banco_connector", "perfis", "organizacao_twin", "usuarios_twin", "permissoes_twin", "admin_invites", "admin_shares", "auditoria_logs", "admin_security", "area_consultor", "plano_executivo", "plano_responsaveis", "plano_prazos", "plano_followup", "plano_pendencias", "digital_twin", "sdl_studio", "narrativa_executiva"].includes(activeTab) ? (
            <div id="real-data-empty-state" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center max-w-xl mx-auto my-12 space-y-6 shadow-md animate-fade-in flex flex-col items-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-500 border border-blue-100 dark:border-blue-900">
                <Database size={26} className="text-blue-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-slate-850 dark:text-slate-100 uppercase tracking-tight">Nenhuma fonte de dados ativa.</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  Comece cadastrando o contexto do cliente e depois importe uma planilha para visualizar dados reais nos módulos.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row justify-center gap-3 w-full pt-2">
                <button
                  onClick={() => setActiveTab("importacao")}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] uppercase font-black tracking-wider rounded-xl shadow-sm transition-all cursor-pointer inline-flex items-center justify-center gap-1.5"
                >
                  <FileSpreadsheet size={14} />
                  <span>Importar planilha</span>
                </button>
                <button
                  onClick={() => setActiveTab("enterprise_center")}
                  className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-750 dark:text-slate-200 text-[11px] uppercase font-black tracking-wider rounded-xl border border-slate-200 dark:border-slate-750 transition-all cursor-pointer inline-flex items-center justify-center gap-1.5"
                >
                  <Building size={14} />
                  <span>Empresas e grupos</span>
                </button>
                <button
                  onClick={() => setActiveTab("banco_connector")}
                  className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-750 dark:text-slate-200 text-[11px] uppercase font-black tracking-wider rounded-xl border border-slate-200 dark:border-slate-750 transition-all cursor-pointer inline-flex items-center justify-center gap-1.5"
                >
                  <Server size={14} />
                  <span>Conectar banco de dados</span>
                </button>
              </div>
            </div>
          ) : !activeDataset && !dataSourceManager.isApproved() && !["enterprise_center", "importacao", "vpn_gateway", "central_dados", "perfis", "organizacao_twin", "usuarios_twin", "permissoes_twin", "admin_invites", "admin_shares", "auditoria_logs", "admin_security", "area_consultor", "plano_executivo", "plano_responsaveis", "plano_prazos", "plano_followup", "plano_pendencias", "digital_twin", "sdl_studio", "narrativa_executiva"].includes(activeTab) ? (
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 max-w-xl mx-auto my-12 text-center shadow-md space-y-6 animate-fadeIn">
              <div className="mx-auto w-16 h-16 bg-amber-50 dark:bg-amber-950/30 text-amber-500 rounded-full flex items-center justify-center border border-amber-200 dark:border-amber-900">
                <ShieldAlert size={32} className="animate-pulse text-amber-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-850 dark:text-slate-100 uppercase tracking-tight">Base Real Pendente de Homologação</h3>
                <p className="text-slate-550 dark:text-slate-400 text-xs leading-relaxed">
                  As conexões de banco de dados ou planilhas importadas para a empresa <strong>{nomeFonte}</strong> foram carregadas com sucesso no Sauron OS, mas permanecem no estado de <strong>Pendente de Homologação</strong>.
                </p>
                <p className="text-slate-450 dark:text-slate-550 text-[11px] leading-relaxed">
                  Para habilitar com segurança a DRE inteligente, gráficos contábeis, filtros dinâmicos e apresentações formais para reuniões corporativas, é necessário homologar explicitamente a integridade desses dados.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <button
                  onClick={() => {
                    dataSourceManager.setApproved(true);
                    alert("Base de dados homologada com sucesso! Todos os relatórios gerenciais e apresentações foram desbloqueados.");
                  }}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] uppercase tracking-wide rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 size={14} />
                  Homologar e Liberar Relatórios
                </button>
                <button
                  onClick={() => setActiveTab("importacao")}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-[11px] uppercase tracking-wide rounded-xl border border-slate-205 dark:border-slate-805 transition-all cursor-pointer"
                >
                    Revisar fonte
                </button>
              </div>
            </div>
          ) : (
            <>
              <MainContentErrorBoundary>
              {activeTab === "qa_console" && (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.search.includes("qa=true"))) && (
                <ProductQAConsole setActivePage={setActiveTab} />
              )}

              {activeTab === "sdl_studio" && (
                <SDLStudio onExit={() => setActiveTab("executive_workspace")} />
              )}

              {activeTab === "enterprise_center" && (
                <EnterpriseCenterErrorBoundary>
                  <EnterpriseCenter onSelectTab={setActiveTab} />
                </EnterpriseCenterErrorBoundary>
              )}

              {activeTab === "dre_inteligente" && (
                <DashboardErrorBoundary>
                  <IntelligentDRETab
                    filteredData={filteredData}
                    formatCurrency={formatCurrencyValue}
                    activeIndustryTemplateId={activeIndustryTemplateId}
                    activeDataset={activeDataset}
                  />
                </DashboardErrorBoundary>
              )}

              {activeTab === "contabil" && (
                <DashboardErrorBoundary>
                  <ContabilTab
                    dataOrigem={dataOrigem}
                    filteredData={filteredData}
                    formatCurrency={formatCurrencyValue}
                    margemLimite={margemLimite}
                  />
                </DashboardErrorBoundary>
              )}

              {activeTab === "vendedores" && (
                <DashboardErrorBoundary>
                  <VendedoresTab
                    dataOrigem={filteredData}
                    formatCurrency={formatCurrencyValue}
                  />
                </DashboardErrorBoundary>
              )}

          {activeTab === "biblioteca_workbooks" && (
            <DataLibraryErrorBoundary>
              <WorkbookLibraryTab />
            </DataLibraryErrorBoundary>
          )}
          {["importacao", "banco_connector", "etl_pipeline", "validacao_dados", "apis_feed", "sincronizacao", "fonte_ativa", "vpn_gateway"].includes(activeTab) && (
            <DataLibraryErrorBoundary>
              <CentralDadosTab
                dataOrigem={dataOrigem}
                onDataLoaded={handleDatabaseDataLoaded}
                currentSource={nomeFonte}
                camposAusentes={camposAusentes}
                filtros={filtros}
                visibleFilters={visibleFilters}
                fieldMappings={fieldMappings}
                initialStep={
                  activeTab === "importacao" ? 0 :
                  activeTab === "banco_connector" ? 2 :
                  activeTab === "vpn_gateway" ? 1 : 0
                }
              />
            </DataLibraryErrorBoundary>
          )}
          {["apresentacoes", "narrativa_executiva", "story_builder", "apresentacoes_templates"].includes(activeTab) && (
            <PresentationErrorBoundary>
              <PresentationBuilderPage 
                dataOrigem={dataOrigem}
                filteredData={filteredData}
                metrics={metrics}
                formatCurrency={formatCurrencyValue}
              />
            </PresentationErrorBoundary>
          )}
          {activeTab === "fechamento_mensal" && (
            <DashboardErrorBoundary>
              <FechamentoMensalTab
                metrics={metrics}
                filtros={filtros}
                formatCurrency={formatCurrencyValue}
              />
            </DashboardErrorBoundary>
          )}
          {activeTab === "preparacao_reuniao" && (
            <MeetingErrorBoundary>
              <MeetingPrepTab onSelectTab={setActiveTab} />
            </MeetingErrorBoundary>
          )}
          {["modo_reuniao", "reuniao_ata", "reuniao_decisoes", "reuniao_perguntas", "reuniao_notas"].includes(activeTab) && (
            <MeetingErrorBoundary>
              <MeetingModePage onExit={() => setActiveTab("apresentacoes")} />
            </MeetingErrorBoundary>
          )}

          {activeTab === "comercial" && (
            <DashboardErrorBoundary>
              <ComercialTab
                metrics={metrics}
                formatCurrency={formatCurrencyValue}
                activeDataset={activeDataset}
              />
            </DashboardErrorBoundary>
          )}

          {activeTab === "posvendas" && (
            <DashboardErrorBoundary>
              <PosVendasTab
                metrics={metrics}
                formatCurrency={formatCurrencyValue}
              />
            </DashboardErrorBoundary>
          )}

          {activeTab === "itens" && (
            <DashboardErrorBoundary>
              <ItensTab
                metrics={metrics}
                formatCurrency={formatCurrencyValue}
              />
            </DashboardErrorBoundary>
          )}

          {activeTab === "estoque" && (
            <DashboardErrorBoundary>
              <EstoqueTab
                metrics={metrics}
                formatCurrency={formatCurrencyValue}
              />
            </DashboardErrorBoundary>
          )}

          {activeTab === "financeiro" && (
            <DashboardErrorBoundary>
              <FinanceiroTab
                metrics={metrics}
                formatCurrency={formatCurrencyValue}
                activeDataset={activeDataset}
              />
            </DashboardErrorBoundary>
          )}

          {activeTab === "comissoes" && (
            <SettingsErrorBoundary>
              <PeopleIntelligenceTab
                dataOrigem={filteredData}
                peopleView={getNormalizedView('PeopleView')}
                activeDataset={activeDataset}
                metrics={metrics}
                formatCurrency={formatCurrencyValue}
                calculatedCommissions={{
                  regraAtiva: "Fórmula Ativa",
                  totalGeralComissao: calculatedCommissions.total,
                  detailsByCnpj: calculatedCommissions.detailsByCnpj,
                  detalhePorConta: calculatedCommissions.detailsByAccount
                }}
                segmentoCliente={segmentoCliente}
                setSegmentoCliente={setSegmentoCliente}
                observacaoGerente={observacaoGerente}
                setObservacaoGerente={setObservacaoGerente}
                faturamentoOffset={faturamentoOffset}
                setFaturamentoOffset={setFaturamentoOffset}
                despesaOffset={despesaOffset}
                setDespesaOffset={setDespesaOffset}
                narrarFeedback={narrarFeedback}
                setNarrarFeedback={setNarrarFeedback}
                comissaoFormula={comissaoFormula}
                setComissaoFormula={setComissaoFormula}
                percentualComissaoBase={comissaoGeral}
                setPercentualComissaoBase={setComissaoGeral}
                taxaComissaoAcessorios={comissaoAcessorios}
                setTaxaComissaoAcessorios={setComissaoAcessorios}
                taxaComissaoItens={comissaoItens}
                setTaxaComissaoItens={setComissaoItens}
                triggerSystemBackup={async () => {
                  await persistSystemDbSettings();
                  alert("Configurações contábeis e parametrização de comissões gravadas com total sucesso no Banco Próprio do Sistema!");
                }}
                userRole={currentUser?.role}
              />
            </SettingsErrorBoundary>
          )}

          {["perfis", "organizacao_twin", "usuarios_twin", "permissoes_twin", "admin_invites", "admin_shares", "auditoria_logs", "admin_security"].includes(activeTab) && (
            <SettingsErrorBoundary>
              <PerfisConfigTab />
            </SettingsErrorBoundary>
          )}

          {activeTab === "digital_twin" && (
            <EnterpriseCenterErrorBoundary>
              <EnterpriseDigitalTwinTab />
            </EnterpriseCenterErrorBoundary>
          )}

          {activeTab === "vpn_gateway" && (
            <VpnGatewayTab />
          )}

          {activeTab === "modelo_consultivo" && (
            <ModeloConsultivoTab
              dataOrigem={dataOrigem}
              formatCurrency={formatCurrencyValue}
            />
          )}

          {["area_consultor", "plano_executivo", "plano_responsaveis", "plano_prazos", "plano_followup", "plano_pendencias"].includes(activeTab) && (
            <ConsultorAreaTab
              dataOrigem={dataOrigem}
            />
          )}

          {activeTab === "obstaculos" && (
            <DiagnosticoObstaculosTab
              dataOrigem={dataOrigem}
              formatCurrency={formatCurrencyValue}
            />
          )}

          {["consultor_ia", "consultor_ia_decision"].includes(activeTab) && (
            <ConsultorIaTab
              metrics={metrics}
              filtros={filtros}
              formatCurrency={formatCurrencyValue}
            />
          )}

          {activeTab === "narrativa_executiva" && (
            <ExecutiveStoryTab />
          )}

          {activeTab === "executive_workspace" && !activeDataset && (
            <ExecutiveWorkspace
              filteredData={filteredData}
              activeFiles={activeFiles}
              onSelectTab={setActiveTab}
              formatCurrency={formatCurrencyValue}
              onDataLoaded={handleDatabaseDataLoaded}
            />
          )}

          {(["resumo", "resultados_consolidados", "comparativos_mensais"].includes(activeTab) || (activeDataset && activeTab === "executive_workspace")) && (
            <DashboardPage filteredData={filteredData} formatCurrency={formatCurrencyValue} activeDataset={activeDataset} />
          )}

          {["relatorios", "historico_executivo"].includes(activeTab) && (
            <ReportsPage setActivePage={setActiveTab} />
          )}
              </MainContentErrorBoundary>
            </>
          )}

            </section>
          </div>
        </main>
        
        {/* FOOTER AREA - Compact High Density */}
        <footer className="bg-slate-900 border-t border-slate-950 text-slate-500 py-4 text-center text-[10px] shrink-0 font-sans leading-normal mt-auto">
          <p className="font-semibold text-slate-400">Sauron &copy; 2026</p>
          <p className="text-slate-400 mt-0.5">Ambiente corporativo de alta confiabilidade operacional e rastreabilidade financeira auditada.</p>
        </footer>
      </div>

      <DynamicFilterDrawer
        key={activeDataSource}
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        dataOrigem={dataOrigem}
        filtros={filtros}
        onChangeFiltros={setFiltros}
        visibleFilters={visibleFilters}
        onChangeVisibleFilters={setVisibleFilters}
        actualKeys={actualKeys}
      />

      <CentralDadosDrawer
        isOpen={isCentralDadosOpen}
        onClose={() => setIsCentralDadosOpen(false)}
        activeIndustryTemplateId={activeIndustryTemplateId}
        onChangeIndustryTemplateId={setActiveIndustryTemplateId}
        availableTemplates={availableTemplates}
        onTriggerFileSelect={triggerFileSelect}
        nomeFonte={nomeFonte}
        isSyncing={isSyncing}
        onSyncDatabase={handleSyncDatabaseData}
        isVpnSimulated={isVpnSimulated}
        spreadsheetMetadata={derivedSpreadsheetMetadata}
        currentUser={currentUser}
        dbValidationMsg={dbValidationMsg}
        onDatabaseDataLoaded={handleDatabaseDataLoaded}
      />

      <CommandPalette onSelectTab={setActiveTab} />

      <LgpdConsent />
      
      {typeof window !== "undefined" && window.location.search.includes("qa=true") && (
        <DataFlowDebugPanel />
      )}
    </div>
  );
}
