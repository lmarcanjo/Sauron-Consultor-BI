/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from "react";
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
  ShieldAlert
} from "lucide-react";

import { LancamentoFinanceiro, FiltrosDashboard, MetricasConsolidadas, ActiveDataSourceType } from "./types";
import { useDataSourceManager } from "./hooks/useDataSourceManager";
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

// Modular Sector Components
import { ContabilTab } from "./components/ContabilTab";
import { ComercialTab } from "./components/ComercialTab";
import { PosVendasTab } from "./components/PosVendasTab";
import { PecasTab } from "./components/PecasTab";
import { EstoqueTab } from "./components/EstoqueTab";
import { FinanceiroTab } from "./components/FinanceiroTab";
import { ComissoesTab } from "./components/ComissoesTab";
import { LoginScreen } from "./components/LoginScreen";
import { PerfisConfigTab } from "./components/PerfisConfigTab";
import { LgpdConsent } from "./components/LgpdConsent";
import { auditLog } from "./utils/profileManager";

// Sauron Consulting OS Agent Modules
import { dataSourceManager } from "./services/dataSourceManager";
import { CentralDadosTab } from "./components/CentralDadosTab";
import { IntelligentDRETab } from "./components/IntelligentDRETab";
import { ModeloConsultivoTab } from "./components/ModeloConsultivoTab";
import { ConsultorAreaTab } from "./components/ConsultorAreaTab";
import { VendedoresTab } from "./components/VendedoresTab";
import { DiagnosticoObstaculosTab } from "./components/DiagnosticoObstaculosTab";
import { ConsultorIaTab } from "./components/ConsultorIaTab";
import { FechamentoMensalTab } from "./components/FechamentoMensalTab";
import { ApresentacoesTab } from "./components/ApresentacoesTab";
import { MeetingModePage } from "./components/MeetingModePage";
import { VpnGatewayTab } from "./components/VpnGatewayTab";
import { PresentationBuilderPage } from "./components/PresentationBuilderPage";
import { DashboardPage } from "./components/pages/DashboardPage";
import { ReportsPage } from "./components/pages/ReportsPage";

import { AppSidebar } from "./components/AppSidebar";
import { availableTemplates } from "./utils/industryTemplates";

export default function App() {
  // --- STATE ---
  const [activeTab, setActiveTab] = useState<string>("resumo");
  const [activeIndustryTemplateId, setActiveIndustryTemplateId] = useState<string>("automotive");
  const [selectedContaContabil, setSelectedContaContabil] = useState<string>("");
  const [selectedDepartamento, setSelectedDepartamento] = useState<string>("");
  const [selectedConta, setSelectedConta] = useState<string>("");

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState<boolean>(false);

  const {
    activeDataSource,
    activeRecords,
    activeSourceLabel,
    activeFiles,
    approvedByConsultant,
    setActiveSource,
    approveSource,
    rejectSource,
    refreshDataSource
  } = useDataSourceManager();

  const [historicalData, setHistoricalData] = useState<LancamentoFinanceiro[] | null>(null);
  const dataOrigem = historicalData || activeRecords;
  const nomeFonte = activeSourceLabel;
  const visualizacaoEmpresas = activeDataSource === "DEMO_DATA" ? "ficticias" : "reais";
  const dataOrigemReal = activeDataSource !== "DEMO_DATA" ? activeRecords : [];
  const dataOrigemFicticio = activeDataSource === "DEMO_DATA" ? activeRecords : [];

  const [camposAusentes, setCamposAusentes] = useState<string[]>([]);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState<boolean>(false);
  const [visibleFilters, setVisibleFilters] = useState<string[]>(["grupos", "cnpjs", "marcas", "meses", "razoes"]);
  const [spreadsheetMetadata, setSpreadsheetMetadata] = useState<{
    fileName: string;
    sheetNames: string[];
    rowCount: number;
    colCount: number;
    importedAt: string;
  } | null>(null);
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
  const [segmentoCliente, setSegmentoCliente] = useState<string>("Concessionária Popular");
  const [observacaoGerente, setObservacaoGerente] = useState<string>("Focar em estratégias de aumento de ticket médio e corte de despesas de concessionárias.");
  const [comissaoGeral, setComissaoGeral] = useState<number>(1.5);
  const [comissaoVeiculos, setComissaoVeiculos] = useState<number>(1.2);
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

  // SECURITY ROLE SYSTEM - INTEGRATED PROFILE LOGIN SESSIONS
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    email: string;
    role: "consultor" | "diretor" | "gerente" | "analista";
  } | null>(() => {
    const saved = localStorage.getItem("sauron_user");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

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
          if (d.comissoesConfig.taxaVeiculos !== undefined) setComissaoVeiculos(d.comissoesConfig.taxaVeiculos);
          if (d.comissoesConfig.taxaAcessorios !== undefined) setComissaoAcessorios(d.comissoesConfig.taxaAcessorios);
        }
        if (d.narrarFeedback !== undefined) setNarrarFeedback(d.narrarFeedback);
        if (d.faturamentoOffset !== undefined) setFaturamentoOffset(d.faturamentoOffset);
        if (d.despesaOffset !== undefined) setDespesaOffset(d.despesaOffset);
      }
    } catch (e) {
      console.warn("Offline ou sem responder banco próprio.");
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
          taxaVeiculos: comissaoVeiculos,
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
      console.error("Erro ao persistir configuração no banco próprio do sistema:", e);
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- ACTIONS & NETWORKING ---
  const loadReportHistoryMetadata = async () => {
    try {
      const res = await fetch("/api/reports/history");
      const resData = await res.json();
      if (res.ok && resData.success) {
        setReportHistory(resData.history || []);
      }
    } catch (e) {
      console.error("Erro ao carregar histórico contábil:", e);
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
          setSyncStatus("Nenhum banco configurado na nuvem. Exibindo demonstração segura.");
        }
      }
    } catch (e) {
      console.warn("Sem banco de dados pronto para autossincronização.");
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
      console.error(err);
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
        console.error("Erro ao consolidar:", err);
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
        console.error("Erro snapshot:", err);
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
  useEffect(() => {
    if (dataOrigem.length > 0) {
      const uniqueGrupos = Array.from(new Set(dataOrigem.map(d => d.Grupo))).sort();
      const uniqueCnpjs = Array.from(new Set(dataOrigem.map(d => d.CNPJ))).sort();
      const uniqueMarcas = Array.from(new Set(dataOrigem.map(d => d.Marca))).sort();
      const uniqueMeses = Array.from(new Set(dataOrigem.map(d => d.Mês)));
      const uniqueRazoes = Array.from(new Set(dataOrigem.map(d => d.Razão))).sort();

      const hasKey = (key: string) => {
        if (activeDataSource === "DEMO_DATA") return true;
        return actualKeys.some(k => k.toLowerCase() === key.toLowerCase());
      };

      const nextFilters: FiltrosDashboard = {};
      if (hasKey("Grupo")) nextFilters.grupos = uniqueGrupos;
      if (hasKey("CNPJ")) nextFilters.cnpjs = uniqueCnpjs;
      if (hasKey("Marca")) nextFilters.marcas = uniqueMarcas;
      if (hasKey("Mês")) nextFilters.meses = uniqueMeses;
      if (hasKey("Razão")) nextFilters.razoes = uniqueRazoes;

      // Detect any custom extra columns dynamically (e.g. from uploaded spreadsheets or created custom filters)
      const extraFilters: Record<string, string[]> = {};
      const standardKeys = ["id", "Grupo", "CNPJ", "Marca", "Empresa", "Filial", "Mês", "Razão", "Categoria", "Receita", "Custo", "Despesa", "Lucro", "Margem", "Vendedor"];
      
      // Examine rows to find non-standard string properties that are viable filter keys
      dataOrigem.forEach(item => {
        Object.keys(item).forEach(key => {
          if (!standardKeys.includes(key) && !key.startsWith("c_") && typeof item[key] === "string" && item[key].trim() !== "") {
            if (!extraFilters[key]) {
              extraFilters[key] = [];
            }
          }
        });
      });

      // Populate unique values for each detected custom key if present in actual keys/headers
      Object.keys(extraFilters).forEach(key => {
        if (hasKey(key)) {
          const uniqueValues = Array.from(new Set(dataOrigem.map(d => d[key] !== undefined && d[key] !== null ? String(d[key]) : "").filter(v => v !== ""))).sort();
          nextFilters[key] = uniqueValues;
        }
      });

      setFiltros(nextFilters);
    }
  }, [dataOrigem, actualKeys, activeDataSource]);

  // Unique elements for Sidebar choice indicators with standard contextual filtering (Requirement 7)
  const availableFilters = useMemo<FiltrosDashboard>(() => {
    if (dataOrigem.length === 0) {
      return { grupos: [], cnpjs: [], marcas: [], meses: [], razoes: [] };
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
  }, [dataOrigem, filtros]);

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
        // Regra de comissionamento customizada para Concessionária:
        // comissaoVeiculos (normalmente 1.2%) para Vendas de veículos (3.0.0.1)
        // comissaoAcessorios (normalmente 5.0%) para Venda de acessórios (3.0.1.1)
        // comissaoGeral (normalmente 1.5%) para o restante!
        if (razao.includes("3.0.0.1")) {
          comissaoParaLinha = row.Receita * (comissaoVeiculos / 100);
        } else if (razao.includes("3.0.1.1")) {
          comissaoParaLinha = row.Receita * (comissaoAcessorios / 100);
        } else {
          comissaoParaLinha = row.Receita * (comissaoGeral / 100);
        }
      } else if (comissaoFormula === "maquinas_agricolas") {
        // Regra de máquinas agrícolas:
        // 0.8% para veículos/grandes faturamentos (3.0.0.1)
        // 4.0% para peças (3.0.1.1)
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
  }, [filteredData, comissaoFormula, comissaoVeiculos, comissaoAcessorios, comissaoGeral]);

  // Trigger dynamic Consulting Analysis from Backend (Gemini or Advanced Fallback)
  const handleTriggerAnalysis = async () => {
    try {
      setAiLoading(true);
      setAiError("");
      const response = await fetch("/api/analyze", {
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
      console.error(err);
      setAiError("Ops, houve um contratempo ao gerar o diagnóstico inteligente. Mas nosso motor analítico tático offline foi engatilhado em redundância.");
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

    const isSpreadsheet = sourceName.toLowerCase().includes(".xls") || sourceName.toLowerCase().includes(".csv") || sourceName.toLowerCase().includes("planilha") || sourceName.toLowerCase().includes("combinada");
    
    if (isSpreadsheet) {
      const fileId = `up_file_${Date.now()}`;
      const virtualFile = {
        id: fileId,
        fileName: sourceName,
        importedAt: new Date().toISOString(),
        importedBy: "Lennon Marcanjo",
        status: "ACTIVE" as const,
        sheets: [
          {
            id: `sheet_${Date.now()}`,
            fileId: fileId,
            sheetName: "Planilha Importada",
            rows: data,
            columns: Array.from(keys).map(k => ({ name: k, type: "any", hasEmptyValues: false }))
          }
        ],
        totalRows: data.length,
        totalColumns: keys.size
      };
      dataSourceManager.addSpreadsheetFile(virtualFile, "REPLACE");
    } else {
      dataSourceManager.syncDatabaseRecords(data, sourceName);
    }

    if (isVpn !== undefined) {
      setIsVpnSimulated(isVpn);
    }
    runDbValidationCheck(data);
  };

  const handleVisualizacaoChange = (choice: "ficticias" | "reais") => {
    if (choice === "ficticias" && activeDataSource !== "DEMO_DATA") {
      alert("Acesso Bloqueado: Não é permitido alternar para dados do Modo Demonstração enquanto houver uma fonte de dados real ativa.");
      return;
    }
    if (choice === "ficticias") {
      dataSourceManager.setActiveSource("DEMO_DATA");
    } else {
      dataSourceManager.setActiveSource("SPREADSHEET_DATA");
    }
  };

  // --- EXPORT & FILE UPLOAD ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      // Lazy load XLSX only when needed to keep bundle sizes smaller
      const XLSX = await import("xlsx");
      
      let allData: LancamentoFinanceiro[] = [];
      const fileNames: string[] = [];
      const sheetNames: string[] = [];
      let totalColCount = 0;
      const originalSheetKeysSet = new Set<string>();
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        fileNames.push(file.name);
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        
        workbook.SheetNames.forEach((sheetName) => {
          sheetNames.push(sheetName);
          const worksheet = workbook.Sheets[sheetName];
          const rawJson = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

          if (rawJson.length > 0) {
            const keys = new Set<string>();
            rawJson.forEach((row: any) => {
              Object.keys(row).forEach((k) => {
                keys.add(k);
                if (k !== "id") {
                  originalSheetKeysSet.add(k);
                }
              });
            });
            totalColCount = Math.max(totalColCount, keys.size);

            rawJson.forEach((row: any, idx: number) => {
              const getNum = (v: any) => {
                if (v === undefined || v === null || v === "") return 0;
                if (typeof v === "number") return v;
                const sanit = String(v).replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, "");
                const parsed = parseFloat(sanit);
                return isNaN(parsed) ? 0 : parsed;
              };

              const cleanRow: any = {
                id: `up_row_${Date.now()}_${idx}_${crypto.randomUUID().substring(0, 8)}`,
                Grupo: row["Grupo"] || row["Grupo Economico"] || row["Grupo Econômico"] || "Geral",
                CNPJ: row["CNPJ"] || row["Cnpj"] || "00.000.000/0001-00",
                Marca: row["Marca"] || row["Bandeira"] || "N/D",
                Empresa: row["Empresa"] || row["Razão Social"] || row["Razao Social"] || "Empresa Geral",
                Mês: row["Mês"] || row["Mes"] || row["Competência"] || row["Competencia"] || "N/D",
                Razão: row["Razão"] || row["Razao"] || "Outros",
                Categoria: row["Categoria"] || row["Classificação"] || row["Classificacao"] || "Sem Categoria",
                Receita: row["Receita"] !== undefined ? getNum(row["Receita"]) : getNum(row["Valor"] || 0),
                Custo: row["Custo"] !== undefined ? getNum(row["Custo"]) : 0,
                Despesa: row["Despesa"] !== undefined ? getNum(row["Despesa"]) : 0,
                Lucro: row["Lucro"] !== undefined ? getNum(row["Lucro"]) : 0,
                Margem: row["Margem"] !== undefined ? getNum(row["Margem"]) : 0,
                Vendedor: row["Vendedor"] || row["Consultor"] || "Padrão",
                
                // Spreadsheet Workspace traceability fields
                arquivo: file.name,
                aba: sheetName,
                linha: idx + 2, // Excel row usually starts at 1, but header is row 1, so data is idx + 2
                coluna: Object.keys(row).length,
                dataImportacao: new Date().toISOString(),
                usuario: "Lennon Marcanjo",
                
                ...row
              };
              allData.push(cleanRow);
            });
          }
        });
      }
      
      if (allData.length > 0) {
        const fileId = `up_file_${Date.now()}`;
        const virtualFile = {
          id: fileId,
          fileName: fileNames.join(", "),
          importedAt: new Date().toISOString(),
          importedBy: "Lennon Marcanjo",
          status: "ACTIVE" as const,
          sheets: [
            {
              id: `sheet_${Date.now()}`,
              fileId: fileId,
              sheetName: "Dados Importados",
              rows: allData,
              columns: Array.from(originalSheetKeysSet).map((k) => ({
                name: k,
                type: "any",
                hasEmptyValues: allData.some((row) => row[k] === undefined || row[k] === null || row[k] === ""),
              })),
            },
          ],
          totalRows: allData.length,
          totalColumns: totalColCount || 10,
        };

        dataSourceManager.addSpreadsheetFile(virtualFile, "REPLACE");
        setCamposAusentes([]);
        setSpreadsheetMetadata({
          fileName: fileNames.join(", "),
          sheetNames: sheetNames,
          rowCount: allData.length,
          colCount: totalColCount || 10,
          importedAt: new Date().toLocaleTimeString("pt-BR") + " " + new Date().toLocaleDateString("pt-BR")
        });

        const customKeys = new Set<string>();
        allData.forEach(row => {
          Object.keys(row).forEach(k => {
            if (k !== "id") {
              customKeys.add(k);
            }
          });
        });

        const defaultVisible: string[] = [];
        if (customKeys.has("Grupo")) defaultVisible.push("grupos");
        if (customKeys.has("CNPJ")) defaultVisible.push("cnpjs");
        if (customKeys.has("Marca")) defaultVisible.push("marcas");
        if (customKeys.has("Mês")) defaultVisible.push("meses");
        if (customKeys.has("Razão")) defaultVisible.push("razoes");

        customKeys.forEach(k => {
          if (!["id", "Grupo", "CNPJ", "Marca", "Mês", "Razão", "Receita", "Custo", "Despesa", "Lucro", "Margem", "Orcamento"].includes(k)) {
            defaultVisible.push(k.toLowerCase());
          }
        });

        setVisibleFilters(defaultVisible);
        setActualKeys(Array.from(originalSheetKeysSet));
        setAiAnalysis("");
        setActiveTab("importacao");
        alert(`Planilha importada com sucesso: ${allData.length} registros consolidados.`);
      } else {
        alert("Nenhuma aba de planilha pôde ser estruturada com registros legíveis.");
      }
    } catch (err: any) {
      console.error(err);
      alert("Erro crítico ao ler o arquivo da planilha: " + err.message);
    }
    
    // Clear input so same file can be uploaded again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

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
                <span className="text-[10px] bg-sauron-navy text-white px-2 py-0.5 rounded font-mono font-bold tracking-wider uppercase">Sauron</span>
                <span className="text-[11px] hidden sm:inline text-slate-500 font-medium tracking-wide">Consultor BI Agent OS</span>
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
                {nomeFonte === "Banco de Dados Interno" || nomeFonte?.includes("Simulados") ? (
                  <span className="flex items-center gap-1 text-[10px] bg-amber-100 border border-amber-300 text-amber-800 px-2 flex-shrink-0 py-0.5 rounded shadow-sm font-bold tracking-wide">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    MOCK DATA
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
              {/* Segment Selector Dropdown */}
              <select
                value={activeIndustryTemplateId}
                onChange={(e) => setActiveIndustryTemplateId(e.target.value)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded text-[11px] font-bold px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 h-8 uppercase tracking-wide shrink-0"
              >
                {availableTemplates.map(template => (
                  <option key={template.id} value={template.id}>
                    SEGMENTO: {template.name}
                  </option>
                ))}
              </select>

              {(currentUser?.role === "consultor" || currentUser?.role === "diretor") && (
                <>
                  <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".csv, .xlsx, .xls"
                    className="hidden"
                  />
                  <button
                    onClick={triggerFileSelect}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-900 text-slate-705 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-805 rounded text-[10px] uppercase tracking-wide font-extrabold cursor-pointer h-8 shrink-0"
                  >
                    <Upload size={11} className="text-slate-500 shrink-0" />
                    <span className="hidden sm:inline">Importar Planilhas</span>
                  </button>
                </>
              )}

              {/* Toggle Empresas Reais vs Fictícias */}
              {activeDataSource === "DEMO_DATA" ? (
                <div className="flex bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded p-0.5 select-none shrink-0 items-center">
                  <button
                    type="button"
                    onClick={() => handleVisualizacaoChange("ficticias")}
                    className={`flex items-center justify-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1 font-bold text-[10px] uppercase rounded transition-all cursor-pointer h-7 ${
                      visualizacaoEmpresas === "ficticias"
                        ? "bg-amber-500 text-white shadow-md font-black"
                        : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    }`}
                    title="Modo Demonstração: Marcas e dados fictícios gerados pelo Sauron"
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${visualizacaoEmpresas === "ficticias" ? "bg-white animate-pulse" : "bg-amber-500"}`} />
                    <span className="hidden md:inline">Modo Demonstração</span>
                    <span className="md:hidden">Mock</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVisualizacaoChange("reais")}
                    className={`flex items-center justify-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1 font-bold text-[10px] uppercase rounded transition-all cursor-pointer h-7 ${
                      visualizacaoEmpresas === "reais"
                        ? "bg-emerald-600 text-white shadow-md font-black"
                        : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    }`}
                    title="Modo Dados Reais: Registros reais vindos de conexões ativas ou planilhas importadas"
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${visualizacaoEmpresas === "reais" ? "bg-white animate-ping" : "bg-emerald-500"}`} />
                    <span className="hidden md:inline">Dados Reais</span>
                    <span className="md:hidden">Reais</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-slate-900 border border-blue-200 dark:border-slate-800 rounded text-[10px] text-blue-700 dark:text-blue-400 font-extrabold uppercase select-none shrink-0 h-8">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                  </span>
                  <span>
                    {activeDataSource === "SPREADSHEET_DATA" ? "Planilha Ativa (Real)" : activeDataSource === "DATABASE_DATA" ? "Banco Ativo (Real)" : "Cenário Consultor"}
                  </span>
                </div>
              )}

              {/* Live Database Synchronizer Actions */}
              <button
                onClick={handleSyncDatabaseData}
                disabled={isSyncing}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 text-white transition-all rounded text-[10px] uppercase tracking-wide font-extrabold cursor-pointer h-8 shrink-0 shadow-sm"
                title="Atualiza imediatamente as informações conectando ao banco de dados configurado"
              >
                <RefreshCw size={12} className={`${isSyncing ? "animate-spin" : ""}`} />
                <span className="hidden md:inline">Sincronizar Banco</span>
              </button>

              <button
                onClick={handleTriggerAnalysis}
                disabled={aiLoading}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-all rounded text-[10px] uppercase tracking-wide font-extrabold cursor-pointer h-8 shrink-0 shadow-sm"
              >
                {aiLoading ? (
                  <RefreshCw size={12} className="animate-spin" />
                ) : (
                  <Sparkles size={12} />
                )}
                <span className="hidden sm:inline">Reanalisar com IA</span>
              </button>

              {/* Dark Mode Theme Selector */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="flex items-center justify-center gap-1 px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-[10px] uppercase font-extrabold tracking-wide h-8 shrink-0"
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
                    className="px-1.5 py-1 text-[8px] uppercase font-black text-rose-600 dark:text-rose-450 hover:bg-rose-50 dark:hover:bg-rose-950/45 rounded-md transition cursor-pointer flex items-center justify-center"
                    title="Sair da sessão"
                  >
                    <Lock size={10} className="sm:mr-0.5" />
                    <span className="hidden sm:inline">Sair</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* WORKSPACE MAIN AREA SCROLLABLE */}
        <main className="flex-1 w-full p-4 md:p-6 flex flex-col gap-5 bg-slate-50 dark:bg-slate-950">
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
                onClick={() => document.getElementById("filter-drawer")?.classList.toggle("translate-x-full")}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer transition-colors"
              >
                <Sliders size={14} /> Filtros Ativos ({Object.keys(filtros).reduce((acc,k)=>filtros[k as keyof FiltrosDashboard]?acc+1:acc,0)})
              </button>
            </div>
          </div>

          {/* Global DataSource Banner Indicator (Requirement #1 & #8) */}
          {activeDataSource === "SPREADSHEET_DATA" ? (
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 p-3 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs animate-fade-in text-xs font-sans">
              <div className="flex items-start gap-2.5">
                <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 rounded-lg">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <p className="font-bold text-emerald-850 dark:text-emerald-300">Fonte ativa: Planilha importada ({spreadsheetMetadata?.fileName || "Arquivo Geral"})</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Modo seguro: utilizando exclusivamente registros reais da planilha carregada. {spreadsheetMetadata ? `Abas: ${spreadsheetMetadata.sheetNames.join(", ")} | Linhas: ${spreadsheetMetadata.rowCount} | Colunas: ${spreadsheetMetadata.colCount} | Importado em: ${spreadsheetMetadata.importedAt}` : ""}
                  </p>
                </div>
              </div>
              <span className="bg-emerald-200/50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 px-2 py-0.5 rounded font-mono font-black text-[9px] uppercase tracking-wider shrink-0">
                PROD SPREADSHEET ACTIVE
              </span>
            </div>
          ) : activeDataSource === "DATABASE_DATA" ? (
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/60 p-3 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs animate-fade-in text-xs font-sans">
              <div className="flex items-start gap-2.5">
                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 rounded-lg">
                  <Database size={16} />
                </div>
                <div>
                  <p className="font-bold text-blue-850 dark:text-blue-300">Fonte ativa: Banco de dados relacional conectado ({nomeFonte})</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Sincronização em tempo real habilitada por pooling criptografado com absoluto isolamento e auditoria ativa.
                  </p>
                </div>
              </div>
              <span className="bg-blue-200/50 dark:bg-blue-950 text-blue-800 dark:text-blue-400 px-2 py-0.5 rounded font-mono font-black text-[9px] uppercase tracking-wider shrink-0">
                LIVE DB ACTIVE
              </span>
            </div>
          ) : (
            <div className="bg-amber-50 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-900/40 p-3 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs animate-fade-in text-xs font-sans">
              <div className="flex items-start gap-2.5">
                <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-lg animate-pulse">
                  <AlertTriangle size={16} />
                </div>
                <div>
                  <p className="font-bold text-amber-850 dark:text-amber-300">Modo Demonstração — dados fictícios ativos</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Os dados exibidos neste modo são simulações industriais puras projetadas para testes conceituais e demonstrações de QA sem dados sensíveis.
                  </p>
                </div>
              </div>
              <span className="bg-amber-200/50 dark:bg-amber-950 text-amber-800 dark:text-amber-400 px-2 py-0.5 rounded font-mono font-black text-[9px] uppercase tracking-wider shrink-0">
                DEMO MODE ACTIVE
              </span>
            </div>
          )}
          
          <div className="flex-1 flex flex-col xl:flex-row gap-5">
            {/* Filter Drawer (Hidden by default on mobile, right side) */}
            <section 
              id="filter-drawer" 
              className="fixed xl:static top-0 right-0 h-screen xl:h-auto w-80 xl:w-72 bg-white dark:bg-slate-900 xl:bg-transparent shadow-2xl xl:shadow-none border-l xl:border-l-0 border-slate-200 dark:border-slate-800 p-4 xl:p-0 z-50 xl:z-0 translate-x-full xl:translate-x-0 transition-transform overflow-y-auto"
            >
              <div className="flex justify-between items-center xl:hidden mb-4 border-b border-slate-200 dark:border-slate-800 pb-2">
                <h3 className="text-sm font-black uppercase text-slate-800 dark:text-white flex items-center gap-2">
                  <Sliders size={14} /> Filtros de Contexto
                </h3>
                <button 
                  onClick={() => document.getElementById("filter-drawer")?.classList.add("translate-x-full")}
                  className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500"
                >
                  ✕
                </button>
              </div>
              <SidebarFilters
                key={activeDataSource}
                available={availableFilters}
                selected={filtros}
                onChange={setFiltros}
                onReset={handleResetFilters}
                activeDataSource={activeDataSource}
                actualKeys={actualKeys}
              />
            </section>

            {/* ANALYTICS CONTAINER */}
            <section className="flex-1 space-y-4 overflow-x-hidden">

          {/* DYNAMIC DB NOTIFICATIONS & SYNC BAR */}
          {syncStatus && (
            <div className="bg-sky-50 border border-sky-200 text-sky-850 px-4 py-2 text-xs rounded-xl flex items-center justify-between gap-2 shadow-sm animate-fade-in">
              <div className="flex items-center gap-2">
                <Database size={14} className="text-sky-600 animate-pulse shrink-0" />
                <span className="font-semibold">{syncStatus}</span>
              </div>
              <button onClick={() => setSyncStatus("")} className="text-sky-400 hover:text-sky-600 text-xs font-bold font-mono px-1">✕</button>
            </div>
          )}

          {/* AUTOMATED DB INTEGRITY VALIDATION INDICATOR */}
          <div className="bg-emerald-50/90 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-350 px-4 py-2.5 rounded-xl text-xs flex flex-col md:flex-row md:items-center justify-between gap-2 shadow-sm">
            <div className="flex items-start md:items-center gap-2">
              <Check size={15} className="text-emerald-600 dark:text-emerald-400 mt-0.5 md:mt-0 shrink-0 stroke-[3]" />
              <div>
                <p className="font-extrabold text-emerald-800 dark:text-emerald-400">Validação Corporativa do Banco de Dados</p>
                <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">{dbValidationMsg}</p>
              </div>
            </div>
            {isVpnSimulated ? (
              <span className="text-[9px] bg-indigo-100 dark:bg-indigo-950/80 text-indigo-850 dark:text-indigo-400 px-2 py-0.5 rounded font-bold font-mono uppercase tracking-wide shrink-0">
                Tunneling VPN Ativado
              </span>
            ) : (
              <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded font-mono shrink-0">
                Sem Túnel VPN Externo
              </span>
            )}
          </div>

          {/* ADMIN CONSOLE / CONNECTOR VIEW */}
          {currentUser?.role === "consultor" ? (
            <div className="bg-rose-50/20 dark:bg-rose-950/10 border border-rose-200/60 dark:border-rose-900/40 rounded-xl p-0.5 shadow-sm">
              <div className="bg-rose-100/50 dark:bg-rose-950/30 text-[10px] px-3 py-1 font-bold text-rose-800 dark:text-rose-450 uppercase tracking-wide flex items-center gap-1 rounded-t-lg">
                <Shield size={11} className="text-rose-700 dark:text-rose-400 shrink-0" />
                <span>Console de Configuração Master (Restrito ao Consultor)</span>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-b-xl">
                <DatabaseConnector onDataLoaded={handleDatabaseDataLoaded} currentSource={nomeFonte} />
              </div>
            </div>
          ) : (
            <div className="bg-sky-50/30 dark:bg-sky-950/15 border border-sky-100/60 dark:border-sky-900/30 p-3 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <Clock size={15} className="text-sky-500" />
                <div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-350">Aplicação em Modo do Usuário Operacional</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-450 font-medium">As conexões seguras do banco de dados relacional e as fontes de dados soterram sob governança e criptografia ativa.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB ENTRANCE: ACTIVE PAGE CONDITIONAL RENDERING */}
          {visualizacaoEmpresas === "reais" && dataOrigemReal.length === 0 && !["vpn_gateway", "central_dados", "importacao", "perfis"].includes(activeTab) ? (
            <div id="real-data-empty-state" className="bg-amber-50/70 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-900 rounded-xl p-8 text-center space-y-4 shadow-sm animate-fade-in mt-2 flex flex-col items-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400">
                <Database size={22} className="animate-spin" style={{ animationDuration: '3s' }} />
              </div>
              <div className="space-y-1 max-w-lg">
                <h3 className="text-sm font-black text-amber-800 dark:text-amber-300 uppercase tracking-wider">Modo Dados Reais</h3>
                <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed font-semibold">
                  Nenhum dado produtivo real foi conectado ainda. Para habilitar visualizações e relatórios do seu banco, conecte seu servidor relacional através do Console Master ou importe planilhas estruturadas.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2.5 pt-2">
                <button
                  onClick={() => setActiveTab("importacao")}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] uppercase font-extrabold tracking-wider rounded-lg shadow-sm transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Database size={11} />
                  <span>Configurar Central de Dados</span>
                </button>
                <button
                  onClick={() => handleVisualizacaoChange("ficticias")}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-705 text-slate-700 dark:text-slate-300 text-[10px] uppercase font-extrabold tracking-wider rounded-lg transition-all cursor-pointer"
                >
                  Usar Modo Demonstração (Mock)
                </button>
              </div>
            </div>
          ) : activeDataSource !== "DEMO_DATA" && !dataSourceManager.isApproved() && !["importacao", "vpn_gateway", "central_dados", "perfis"].includes(activeTab) ? (
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
                  Configurar Central de Dados
                </button>
              </div>
            </div>
          ) : (
            <>
              {activeTab === "dre_inteligente" && (
            <IntelligentDRETab
              filteredData={filteredData}
              formatCurrency={formatCurrencyValue}
              activeIndustryTemplateId={activeIndustryTemplateId}
            />
          )}

          {activeTab === "contabil" && (
            <ContabilTab
              dataOrigem={dataOrigem}
              filteredData={filteredData}
              formatCurrency={formatCurrencyValue}
              margemLimite={margemLimite}
            />
          )}

          {activeTab === "vendedores" && (
            <VendedoresTab
              dataOrigem={filteredData}
              formatCurrency={formatCurrencyValue}
            />
          )}

          {activeTab === "importacao" && (
             <CentralDadosTab
              dataOrigem={dataOrigem}
              onDataLoaded={handleDatabaseDataLoaded}
              currentSource={nomeFonte}
              camposAusentes={camposAusentes}
              filtros={filtros}
              visibleFilters={visibleFilters}
              fieldMappings={fieldMappings}
            />
          )}
          {activeTab === "apresentacoes" && (
            <PresentationBuilderPage 
              dataOrigem={dataOrigem}
              filteredData={filteredData}
              metrics={metrics}
              formatCurrency={formatCurrencyValue}
            />
          )}
          {activeTab === "fechamento_mensal" && (
            <FechamentoMensalTab
              metrics={metrics}
              filtros={filtros}
              formatCurrency={formatCurrencyValue}
            />
          )}
          {activeTab === "modo_reuniao" && (
            <MeetingModePage onExit={() => setActiveTab("apresentacoes")} />
          )}

          {activeTab === "comercial" && (
            <ComercialTab
              metrics={metrics}
              formatCurrency={formatCurrencyValue}
            />
          )}

          {activeTab === "posvendas" && (
            <PosVendasTab
              metrics={metrics}
              formatCurrency={formatCurrencyValue}
            />
          )}

          {activeTab === "pecas" && (
            <PecasTab
              metrics={metrics}
              formatCurrency={formatCurrencyValue}
            />
          )}

          {activeTab === "estoque" && (
            <EstoqueTab
              metrics={metrics}
              formatCurrency={formatCurrencyValue}
            />
          )}

          {activeTab === "financeiro" && (
            <FinanceiroTab
              metrics={metrics}
              formatCurrency={formatCurrencyValue}
            />
          )}

          {activeTab === "comissoes" && (
            <ComissoesTab
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
              taxaComissaoPecas={comissaoVeiculos}
              setTaxaComissaoPecas={setComissaoVeiculos}
              triggerSystemBackup={async () => {
                await persistSystemDbSettings();
                alert("Configurações contábeis e parametrização de comissões gravadas com total sucesso no Banco Próprio do Sistema!");
              }}
              userRole={currentUser?.role}
            />
          )}

          {activeTab === "perfis" && currentUser?.role === "consultor" && (
            <PerfisConfigTab />
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

          {activeTab === "area_consultor" && (
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

          {activeTab === "consultor_ia" && (
            <ConsultorIaTab
              metrics={metrics}
              filtros={filtros}
              formatCurrency={formatCurrencyValue}
            />
          )}

          {activeTab === "resumo" && (
            <DashboardPage filteredData={filteredData} formatCurrency={formatCurrencyValue} />
          )}

          {activeTab === "relatorios" && (
            <ReportsPage setActivePage={setActiveTab} />
          )}
            </>
          )}

            </section>
          </div>
        </main>
        
        {/* FOOTER AREA - Compact High Density */}
        <footer className="bg-slate-900 border-t border-slate-950 text-slate-500 py-4 text-center text-[10px] shrink-0 font-sans leading-normal mt-auto">
          <p className="font-semibold text-slate-400">Sauron &copy; 2026</p>
          <p className="text-slate-600 mt-0.5">Ambiente corporativo de alta confiabilidade operacional e rastreabilidade financeira auditada.</p>
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
        activeDataSource={activeDataSource}
        actualKeys={actualKeys}
      />

      <LgpdConsent />
    </div>
  );
}
