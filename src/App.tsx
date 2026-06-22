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
  Sliders
} from "lucide-react";

import { LancamentoFinanceiro, FiltrosDashboard, MetricasConsolidadas } from "./types";
import { gerarDadosSimulados, exportToCSV } from "./utils/dataGenerator";
import { parseCSV } from "./utils/csvParser";
import { KpiCard } from "./components/KpiCard";
import { SidebarFilters } from "./components/SidebarFilters";
import { ChartsGrid } from "./components/ChartsGrid";
import { TraceabilityPanel } from "./components/TraceabilityPanel";
import { StreamlitExporter } from "./components/StreamlitExporter";
import { DatabaseConnector } from "./components/DatabaseConnector";

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

export default function App() {
  // --- STATE ---
  const [activeTab, setActiveTab] = useState<"resumo" | "contabil" | "comercial" | "posvendas" | "pecas" | "estoque" | "financeiro" | "comissoes" | "perfis">("resumo");
  const [selectedContaContabil, setSelectedContaContabil] = useState<string>("");
  const [selectedDepartamento, setSelectedDepartamento] = useState<string>("");
  const [selectedConta, setSelectedConta] = useState<string>("");

  const [dataOrigem, setDataOrigem] = useState<LancamentoFinanceiro[]>([]);
  const [dataLiveBackup, setDataLiveBackup] = useState<LancamentoFinanceiro[]>([]);
  const [nomeFonte, setNomeFonte] = useState<string>("Dados Simulados de Concessionárias de Voo");
  const [camposAusentes, setCamposAusentes] = useState<string[]>([]);

  // Toggle state between Companies: real vs fictional
  const [visualizacaoEmpresas, setVisualizacaoEmpresas] = useState<"ficticias" | "reais">("ficticias");
  const [dataOrigemFicticio, setDataOrigemFicticio] = useState<LancamentoFinanceiro[]>([]);
  const [dataOrigemReal, setDataOrigemReal] = useState<LancamentoFinanceiro[]>([]);

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
          setDataOrigemReal(syncData.data);
          setDataOrigem(syncData.data);
          setDataLiveBackup(syncData.data);
          setVisualizacaoEmpresas("reais");
          setNomeFonte(syncData.sourceName);
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
        setDataOrigemReal(resData.data);
        setDataOrigem(resData.data);
        setDataLiveBackup(resData.data);
        setVisualizacaoEmpresas("reais");
        setNomeFonte(resData.sourceName);
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
          setDataOrigem(dataLiveBackup);
          setNomeFonte("Dados Simulados de Concessionárias de Voo");
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
      setDataOrigem(dataLiveBackup);
      setNomeFonte("Sincronização Ao Vivo do Banco de Dados");
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
          setDataOrigem(consolidated);
          setNomeFonte("Histórico Consolidado (Toda a Linha Temporal)");
          setSyncStatus(`Sucesso! Consolidado faturamento de ${reportHistory.length} uploads históricos combinados.`);
        } else {
          setSyncStatus("Nenhum snapshot no histórico. Salve ou importe para habilitar consolidado.");
          setDataOrigem(dataLiveBackup);
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
          setDataOrigem(rData.snapshot.data);
          setNomeFonte(`Snapshot Histórico: ${rData.snapshot.sourceName} (${new Date(rData.snapshot.timestamp).toLocaleString()})`);
          setSyncStatus(`Exibindo dados históricos de: ${rData.snapshot.sourceName}`);
        }
      } catch (err) {
        console.error("Erro snapshot:", err);
      }
    }
  };



  // --- INITIALIZATION ---
  useEffect(() => {
    const simulated = gerarDadosSimulados();
    setDataOrigemFicticio(simulated);
    setDataOrigem(simulated);
    setDataLiveBackup(simulated);

    const realDefault: LancamentoFinanceiro[] = [
      { Grupo: "Sauron Holdings S/A", CNPJ: "10.222.333/0001-44", Marca: "Sauron Cloud", Empresa: "Sauron Cloud & Tech", Filial: "Matriz São Paulo", Mês: "Janeiro", Razão: "Serviços em Nuvem", Categoria: "Custo de Ocupação", Receita: 420000, Custo: 180000, Despesa: 40000, Lucro: 200000, Margem: 47.6, Departamento: "Tecnologia", ContaContabil: "3.1.04.10000.25 - Suporte e Licenças", Orcamento: 400000 },
      { Grupo: "Sauron Holdings S/A", CNPJ: "10.222.333/0001-44", Marca: "Sauron Cloud", Empresa: "Sauron Cloud & Tech", Filial: "Matriz São Paulo", Mês: "Fevereiro", Razão: "Serviços em Nuvem", Categoria: "Custo de Ocupação", Receita: 450000, Custo: 195000, Despesa: 41000, Lucro: 214000, Margem: 47.5, Departamento: "Tecnologia", ContaContabil: "3.1.04.10000.25 - Suporte e Licenças", Orcamento: 420000 },
      { Grupo: "Sauron Holdings S/A", CNPJ: "10.222.333/0001-44", Marca: "Sauron Cloud", Empresa: "Sauron Cloud & Tech", Filial: "Matriz São Paulo", Mês: "Março", Razão: "Serviços em Nuvem", Categoria: "Custo de Ocupação", Receita: 480000, Custo: 210000, Despesa: 43000, Lucro: 227000, Margem: 47.2, Departamento: "Tecnologia", ContaContabil: "3.1.04.10000.25 - Suporte e Licenças", Orcamento: 450000 },
      { Grupo: "Marcanjo Varejo Holdings", CNPJ: "20.444.555/0002-11", Marca: "Premium Retail", Empresa: "Marcanjo Varejo S/A", Filial: "Matriz Rio de Janeiro", Mês: "Janeiro", Razão: "Logística Terceirizada", Categoria: "Propaganda e Marketing", Receita: 750000, Custo: 450000, Despesa: 120000, Lucro: 180000, Margem: 24.0, Departamento: "Vendas Novos", ContaContabil: "3.0.0.1 - Venda de Veículos", Orcamento: 720000 },
      { Grupo: "Marcanjo Varejo Holdings", CNPJ: "20.444.555/0002-11", Marca: "Premium Retail", Empresa: "Marcanjo Varejo S/A", Filial: "Matriz Rio de Janeiro", Mês: "Fevereiro", Razão: "Logística Terceirizada", Categoria: "Propaganda e Marketing", Receita: 780000, Custo: 470000, Despesa: 122000, Lucro: 188000, Margem: 24.1, Departamento: "Vendas Novos", ContaContabil: "3.0.0.1 - Venda de Veículos", Orcamento: 750500 },
      { Grupo: "Marcanjo Varejo Holdings", CNPJ: "20.444.555/0002-11", Marca: "Premium Retail", Empresa: "Marcanjo Varejo S/A", Filial: "Matriz Rio de Janeiro", Mês: "Março", Razão: "Logística Terceirizada", Categoria: "Propaganda e Marketing", Receita: 820000, Custo: 495000, Despesa: 125000, Lucro: 200000, Margem: 24.3, Departamento: "Vendas Novos", ContaContabil: "3.0.0.1 - Venda de Veículos", Orcamento: 800000 }
    ];
    setDataOrigemReal(realDefault);
    
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

  // Set default filters whenever original data changes
  useEffect(() => {
    if (dataOrigem.length > 0) {
      const uniqueGrupos = Array.from(new Set(dataOrigem.map(d => d.Grupo))).sort();
      const uniqueCnpjs = Array.from(new Set(dataOrigem.map(d => d.CNPJ))).sort();
      const uniqueMarcas = Array.from(new Set(dataOrigem.map(d => d.Marca))).sort();
      const uniqueMeses = Array.from(new Set(dataOrigem.map(d => d.Mês)));
      const uniqueRazoes = Array.from(new Set(dataOrigem.map(d => d.Razão))).sort();

      setFiltros({
        grupos: uniqueGrupos,
        cnpjs: uniqueCnpjs,
        marcas: uniqueMarcas,
        meses: uniqueMeses,
        razoes: uniqueRazoes
      });
    }
  }, [dataOrigem]);

  // Unique elements for Sidebar choice indicators
  const availableFilters = useMemo<FiltrosDashboard>(() => {
    if (dataOrigem.length === 0) {
      return { grupos: [], cnpjs: [], marcas: [], meses: [], razoes: [] };
    }
    return {
      grupos: Array.from(new Set(dataOrigem.map(d => d.Grupo))).sort(),
      cnpjs: Array.from(new Set(dataOrigem.map(d => d.CNPJ))).sort(),
      marcas: Array.from(new Set(dataOrigem.map(d => d.Marca))).sort(),
      meses: Array.from(new Set(dataOrigem.map(d => d.Mês))),
      razoes: Array.from(new Set(dataOrigem.map(d => d.Razão))).sort()
    };
  }, [dataOrigem]);

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
      const matchGrupo = filtros.grupos.includes(item.Grupo);
      const matchCnpj = filtros.cnpjs.includes(item.CNPJ);
      const matchMarca = filtros.marcas.includes(item.Marca);
      const matchMes = filtros.meses.includes(item.Mês);
      const matchRazao = filtros.razoes.includes(item.Razão);
      return matchGrupo && matchCnpj && matchMarca && matchMes && matchRazao;
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

  // Run initial report on first mount
  useEffect(() => {
    if (metrics.receitaTotal > 0 && Math.abs(metrics.receitaTotal) > 1000 && !aiAnalysis && !aiLoading) {
      handleTriggerAnalysis();
    }
  }, [metrics, aiAnalysis]);

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
    setDataOrigemReal(data);
    setDataOrigem(data);
    setDataLiveBackup(data);
    setVisualizacaoEmpresas("reais");
    setNomeFonte(sourceName);
    setCamposAusentes([]);
    if (isVpn !== undefined) {
      setIsVpnSimulated(isVpn);
    }
    runDbValidationCheck(data);
  };

  const handleVisualizacaoChange = (choice: "ficticias" | "reais") => {
    setVisualizacaoEmpresas(choice);
    const activeData = choice === "ficticias" ? dataOrigemFicticio : dataOrigemReal;
    setDataOrigem(activeData);
    setDataLiveBackup(activeData);
    setNomeFonte(choice === "ficticias" ? "Ambiente de Teste (Empresas Fictícias)" : "Dados de Produção (Empresas Reais)");
    runDbValidationCheck(activeData);
  };

  // --- EXPORT & FILE UPLOAD ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const { data, missingFields } = parseCSV(text);
        if (data.length > 0) {
          setDataOrigem(data);
          setDataLiveBackup(data);
          setNomeFonte(file.name);
          setCamposAusentes(missingFields);
          setAiAnalysis(""); // Clear stale analysis to trigger a fresh context
        } else {
          alert("Nenhuma linha válida pôde ser estruturada do arquivo CSV.");
        }
      }
    };
    reader.readAsText(file, "utf-8");
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
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-100 font-sans flex flex-col antialiased transition-colors duration-150">
      {/* HEADER SECTION - High Density Style */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-3 px-4 md:px-6 shrink-0 shadow-sm z-20 sticky top-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-2 py-0.5 rounded font-mono font-bold tracking-wider uppercase">Sauron</span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Dashboard Consultivo</span>
              <span className="text-slate-300 dark:text-slate-700">/</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-sm md:text-base font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                <Building className="text-blue-600 dark:text-blue-400 shrink-0" size={16} />
                <span>Visão Consolidada Corporativa</span>
              </h1>
              
              {/* Role Indicator Pill */}
              {currentUser?.role === "consultor" ? (
                <span className="flex items-center gap-1 text-[10px] bg-amber-50 dark:bg-amber-950/40 border border-amber-200/50 text-amber-700 dark:text-amber-400 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide">
                  <Shield size={10} className="stroke-[2.5]" /> Configuração (Consultor)
                </span>
              ) : currentUser?.role === "diretor" ? (
                <span className="flex items-center gap-1 text-[10px] bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/50 text-indigo-700 dark:text-indigo-400 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide">
                  <BarChart3 size={10} /> Direção Regional (Executivo)
                </span>
              ) : currentUser?.role === "gerente" ? (
                <span className="flex items-center gap-1 text-[10px] bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/50 text-emerald-700 dark:text-emerald-400 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide">
                  <Sliders size={10} /> Controladoria (Gerente)
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] bg-slate-100 dark:bg-slate-800 border border-slate-200/50 text-slate-700 dark:text-slate-355 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide">
                  <BookOpen size={10} /> Leitura Segura (Analista)
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-2 items-center w-full sm:w-auto justify-end">
            {(currentUser?.role === "consultor" || currentUser?.role === "diretor") && (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".csv"
                  className="hidden"
                />
                <button
                  onClick={triggerFileSelect}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-900 text-slate-705 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-805 rounded text-[10px] uppercase tracking-wide font-extrabold cursor-pointer h-8"
                >
                  <Upload size={11} className="text-slate-500" />
                  <span>Importar CSV</span>
                </button>
              </>
            )}

            {/* Toggle Empresas Reais vs Fictícias */}
            <div className="flex bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded p-0.5 select-none shrink-0 h-8 items-center mr-1">
              <button
                type="button"
                onClick={() => handleVisualizacaoChange("ficticias")}
                className={`flex items-center gap-1 px-2.5 py-1 font-bold text-[10px] uppercase rounded transition-all cursor-pointer h-7 ${
                  visualizacaoEmpresas === "ficticias"
                    ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/50 dark:border-slate-705/50 font-extrabold"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
                title="Visualizar marcas fictícias geradas pelo sistema (Toyota, Chevrolet, etc.)"
              >
                <Info size={11} className="mr-0.5 shrink-0 text-slate-500" />
                <span>Empresas Fictícias</span>
              </button>
              <button
                type="button"
                onClick={() => handleVisualizacaoChange("reais")}
                className={`flex items-center gap-1 px-2.5 py-1 font-bold text-[10px] uppercase rounded transition-all cursor-pointer h-7 ${
                  visualizacaoEmpresas === "reais"
                    ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/50 dark:border-slate-705/50 font-extrabold"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
                title="Visualizar faturamento e dados reais importados de fontes de produção"
              >
                <Database size={11} className="mr-0.5 shrink-0 text-slate-500" />
                <span>Empresas Reais</span>
              </button>
            </div>

            {/* Live Database Synchronizer Actions */}
            <button
              onClick={handleSyncDatabaseData}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 text-white transition-all rounded text-[10px] uppercase tracking-wide font-extrabold cursor-pointer shadow-sm"
              title="Atualiza imediatamente as informações conectando ao banco de dados configurado"
            >
              <RefreshCw size={12} className={`${isSyncing ? "animate-spin" : ""}`} />
              <span>Sincronizar Banco</span>
            </button>

            <button
              onClick={handleTriggerAnalysis}
              disabled={aiLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-all rounded text-[10px] uppercase tracking-wide font-extrabold cursor-pointer shadow-sm"
            >
              {aiLoading ? (
                <RefreshCw size={12} className="animate-spin" />
              ) : (
                <Sparkles size={12} />
              )}
              <span>Reanalisar com IA</span>
            </button>

            {/* Dark Mode Theme Selector */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-[10px] uppercase font-extrabold tracking-wide"
              title={darkMode ? "Ativar Modo Claro" : "Ativar Modo Escuro"}
            >
              {darkMode ? (
                <>
                  <Sun size={12} className="text-amber-500" />
                  <span>Modo Claro</span>
                </>
              ) : (
                <>
                  <Moon size={12} className="text-indigo-500" />
                  <span>Modo Escuro</span>
                </>
              )}
            </button>

            {/* User session controls */}
            {currentUser && (
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-1 rounded-md text-left">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black leading-tight text-slate-800 dark:text-slate-100 uppercase truncate max-w-[120px]" title={currentUser.name}>
                    {currentUser.name}
                  </span>
                  <span className={`text-[7px] font-black uppercase px-1 rounded font-mono w-fit ${
                    currentUser.role === "consultor" ? "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300" :
                    currentUser.role === "diretor" ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300" :
                    currentUser.role === "gerente" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300" :
                    "bg-slate-250 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  }`}>
                    {currentUser.role}
                  </span>
                </div>
                <button
                  onClick={() => {
                    auditLog("ENCERRAMENTO_SESSÃO", `Usuário encerrou o período operacional regulamentar no portal de acessos.`, currentUser.name);
                    localStorage.removeItem("sauron_user");
                    setCurrentUser(null);
                  }}
                  className="px-1.5 py-1 text-[8px] uppercase font-black text-rose-600 dark:text-rose-450 hover:bg-rose-50 dark:hover:bg-rose-950/45 rounded-md transition cursor-pointer"
                  title="Sair da sessão"
                >
                  <Lock size={10} className="inline mr-0.5" />
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* WORKSPACE AREA - High Density Compact Spacing */}
      <main className="max-w-7xl w-full mx-auto p-4 md:p-5 flex-1 flex flex-col lg:flex-row gap-5">
        {/* SIDEBAR FILTERS (SPAN 4 COLS) */}
        <section className="w-full lg:w-64 shrink-0 lg:sticky lg:top-[68px] h-fit">
          <SidebarFilters
            available={availableFilters}
            selected={filtros}
            onChange={setFiltros}
            onReset={handleResetFilters}
          />
        </section>

        {/* ANALYTICS CONTAINER (SPAN 8 COLS) */}
        <section className="flex-1 space-y-4 overflow-hidden">

          {/* PAGES SELECTOR TABS BAR */}
          <div className="flex flex-wrap gap-1 bg-slate-100/90 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            {[
              { id: "resumo", label: "Dashboard Geral", icon: BarChart3 },
              { id: "contabil", label: "Análise Contábil", icon: BookOpen },
              { id: "comercial", label: "Setor Comercial", icon: Coins },
              { id: "posvendas", label: "Pós-Vendas (Oficina)", icon: Sliders },
              { id: "pecas", label: "Setor Peças", icon: GitBranch },
              { id: "estoque", label: "Controle de Estoque", icon: FolderOpen },
              { id: "financeiro", label: "Contas a Receber", icon: Database },
              { id: "comissoes", label: "Remuneração & Comissões", icon: Sparkles },
              ...(currentUser?.role === "consultor" ? [{ id: "perfis", label: "Ajuste de Perfis", icon: Shield }] : [])
            ].map((p) => {
              const Icon = p.icon;
              const isActive = activeTab === p.id;
              return (
                <button
                  key={p.id}
                  id={`tab-btn-${p.id}`}
                  onClick={() => setActiveTab(p.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 md:py-2 text-[10px] uppercase tracking-wider font-extrabold rounded-lg border transition-all cursor-pointer ${
                    isActive
                      ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                      : "bg-white dark:bg-slate-900 border-slate-200/50 dark:border-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  <Icon size={11} className={isActive ? "text-white" : "text-blue-500"} />
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>

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
          {activeTab === "contabil" && (
            <ContabilTab
              dataOrigem={dataOrigem}
              filteredData={filteredData}
              formatCurrency={formatCurrencyValue}
              margemLimite={margemLimite}
            />
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

          {activeTab === "resumo" && (
            <div className="space-y-4 animate-fade-in text-slate-800 dark:text-slate-150">
              {/* OLD GOVERNANCE COMPONENT BODY EMBEDDED UNDER RESUMO TAB */}
            </div>
          )}

          {activeTab === "resumo" && (
            <div className="space-y-4 animate-fade-in text-slate-800 dark:text-slate-150">
              <div className="hidden">
              {/* Left col: Segments and Adjustments */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide block">1. Segmento de Negócio do Cliente:</label>
                  <select
                    value={segmentoCliente}
                    onChange={(e) => setSegmentoCliente(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white px-3 py-1.5 rounded focus:outline-none focus:border-blue-500 font-sans cursor-pointer"
                  >
                    <option value="Concessionária Popular">Concessionária de Automóveis Popular</option>
                    <option value="Concessionária Premium Elite">Concessionária Premium e Blindados</option>
                    <option value="Distribuidora de Máquinas Agrícolas">Distribuição de Maquinário Agrícola (Tratores/Peças)</option>
                    <option value="Grupo Multimarcas Automotivas">Holding Multimarcas de Varejo de Veículos</option>
                    <option value="Revenda Geral de Acessórios">Revenda e Auto-Center Especializado</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide block">2. Diretriz Personalizada (Gerente):</label>
                  <textarea
                    value={observacaoGerente}
                    onChange={(e) => setObservacaoGerente(e.target.value)}
                    placeholder="Instruções estratégicas adicionais enviadas para enriquecer a inteligência artificial..."
                    rows={2}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white px-3 py-1.5 rounded resize-none focus:outline-none focus:border-blue-500 font-sans"
                  />
                </div>

                {/* Simulated database adjustment off-memory */}
                <div className="bg-amber-50/40 dark:bg-amber-950/10 border border-amber-200/50 dark:border-amber-900/30 p-2.5 rounded-lg space-y-2">
                  <p className="text-[9px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest flex items-center gap-1">
                    <span>⚠️ Simulador de Balanço (Modificação Segura sem interferência no Banco)</span>
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 block">Desvio Faturamento (R$):</span>
                      <input
                        type="number"
                        step="10000"
                        value={faturamentoOffset}
                        onChange={(e) => setFaturamentoOffset(Number(e.target.value))}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white px-2 py-1 rounded"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 block">Desvio Despesas (R$):</span>
                      <input
                        type="number"
                        step="500"
                        value={despesaOffset}
                        onChange={(e) => setDespesaOffset(Number(e.target.value))}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white px-2 py-1 rounded"
                      />
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-[9px] text-amber-800 dark:text-amber-500 pt-1">
                    <span>O faturamento e a despesa bruta do painel serão incrementados temporariamente em tempo real!</span>
                    <button
                      onClick={() => {
                        setFaturamentoOffset(0);
                        setDespesaOffset(0);
                        persistSystemDbSettings({ faturamentoOffset: 0, despesaOffset: 0 });
                      }}
                      className="px-1.5 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded font-bold uppercase transition"
                    >
                      Resetar Desvios
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 pt-1">
                  <input
                    type="checkbox"
                    id="ttsSwitch"
                    checked={narrarFeedback}
                    onChange={(e) => {
                      setNarrarFeedback(e.target.checked);
                      persistSystemDbSettings({ narrarFeedback: e.target.checked });
                    }}
                    className="w-3.5 h-3.5 accent-blue-600 rounded cursor-pointer"
                  />
                  <label htmlFor="ttsSwitch" className="text-[11px] font-bold text-slate-600 dark:text-slate-300 cursor-pointer select-none flex items-center gap-1">
                    <Volume2 size={13} className="text-blue-500 shrink-0" />
                    <span>Apresentar Relatório de IA Narrado por Voz por Padrão</span>
                  </label>
                </div>
              </div>

              {/* Right col: Real-time dynamic commissions setup */}
              <div className="bg-slate-50 dark:bg-slate-850/50 p-3 rounded-xl border border-slate-150 dark:border-slate-800 flex flex-col justify-between space-y-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">Cálculo e Controle de Comissionamento</span>
                    <span className="text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono font-bold px-1.5 py-0.5 rounded">Fórmula Ativa</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 block">Fórmula de Cálculo:</span>
                    <select
                      value={comissaoFormula}
                      onChange={(e) => setComissaoFormula(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white px-2 py-1.5 rounded focus:outline-none focus:border-blue-500 font-sans cursor-pointer"
                    >
                      <option value="simplificado">Geral Simplificado (Rate Único das Vendas)</option>
                      <option value="acessorios_vendas">Concessionária Custom (Diferenciação Veículos 3.0.0.1 vs Acessórios 3.0.1.1)</option>
                      <option value="maquinas_agricolas">Maquinário Agrícola (Diferenciação Veículos 3.0.0.1 vs Autopeças 3.0.1.1 vs Oficina 3.0.3.1)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    <div className="space-y-0.5">
                      <span className="text-[8px] font-black text-slate-500 dark:text-slate-400 block uppercase">Taxa Geral (%):</span>
                      <input
                        type="number"
                        step="0.1"
                        value={comissaoGeral}
                        onChange={(e) => setComissaoGeral(Number(e.target.value))}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-800 dark:text-white px-1.5 py-0.5 rounded font-mono"
                      />
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[8px] font-black text-slate-500 dark:text-slate-400 block uppercase" title="Código 3.0.0.1">Taxa Veículo (%):</span>
                      <input
                        type="number"
                        step="0.1"
                        value={comissaoVeiculos}
                        onChange={(e) => setComissaoVeiculos(Number(e.target.value))}
                        disabled={comissaoFormula === "simplificado"}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-800 dark:text-white px-1.5 py-0.5 rounded font-mono disabled:opacity-50"
                      />
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[8px] font-black text-slate-500 dark:text-slate-400 block uppercase" title="Código 3.0.1.1">Taxa Acessórios (%):</span>
                      <input
                        type="number"
                        step="0.1"
                        value={comissaoAcessorios}
                        onChange={(e) => setComissaoAcessorios(Number(e.target.value))}
                        disabled={comissaoFormula === "simplificado"}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-800 dark:text-white px-1.5 py-0.5 rounded font-mono disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-lg flex justify-between items-center">
                  <div>
                    <span className="text-[8px] font-black uppercase text-slate-400 block">Comissões Devidas Consolidadas (Vendas do Período):</span>
                    <span className="text-sm font-black text-blue-600 dark:text-blue-400 font-mono">
                      {formatCurrencyValue(calculatedCommissions.total)}
                    </span>
                  </div>
                  <span className="text-[9px] bg-sky-50 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 px-2 py-0.5 rounded font-bold">
                    {filteredData.length} registros auditados
                  </span>
                </div>

                {/* Micro Itemized CNPJ Breakdown list inside right box */}
                <div className="space-y-1">
                  <span className="text-[8px] font-black uppercase text-slate-400 block tracking-wider">Detalhamento por Unidade (Comissões e Margem Segura):</span>
                  <div className="max-h-[75px] overflow-y-auto space-y-1 pr-1">
                    {calculatedCommissions.detailsByCnpj.slice(0, 4).map((c) => (
                      <div key={c.cnpj} className="flex justify-between items-center text-[9px] bg-white dark:bg-slate-900 px-2 py-1 rounded border border-slate-100 dark:border-slate-800">
                        <span className="font-extrabold text-slate-700 dark:text-slate-350 truncate max-w-[130px]">{c.empresa}</span>
                        <div className="space-x-1.5 font-mono">
                          <span className="text-slate-450">Faut.: R$ {Math.round(c.receita / 1000)}k</span>
                          <span className="font-extrabold text-blue-600 dark:text-blue-400">Comissão: R$ {c.comissao.toLocaleString("pt-BR")}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          {/* HISTORIES CONTROL & DYNAMIC COMPARATOR HUB */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-3.5 hover:shadow-md transition-shadow duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 rounded">
                  <FolderOpen size={15} className="stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-white">Seletor Contábil e Comparativo</h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">Escolha a base do relatório (Live, snapshot do mês/dia ou histórico de encerramentos) e realize comparações táticas</p>
                </div>
              </div>

              {/* Manual Snapshots only for admin or testing backups */}
              <div className="flex gap-1.5">
                <button
                  onClick={handleSaveSnapshotManual}
                  disabled={isSavingSnapshot}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 dark:bg-slate-700 text-white hover:bg-slate-900 dark:hover:bg-slate-600 transition-colors rounded text-[10px] uppercase tracking-wide font-extrabold cursor-pointer"
                  title="Salvar uma foto (snapshot) do relatório ativo no momento para comparações futuras"
                >
                  <Save size={11} className={`${isSavingSnapshot ? "animate-pulse" : ""}`} />
                  <span>Gravar Snapshot</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Target rule selector choice */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide block">Origem de Dados no Painel:</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={historyOption}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      if (val === "snapshot_unico" && reportHistory.length > 0) {
                        handleHistoryOptionChange(val, reportHistory[0].id);
                      } else {
                        handleHistoryOptionChange(val);
                      }
                    }}
                    className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-white px-3 py-1.5 rounded focus:outline-none focus:border-sky-500 font-sans cursor-pointer shrink-0"
                  >
                    <option value="atual">Visualização do Mês/Dia Atual (Filtros Ativos)</option>
                    <option value="historico_consolidado">Compilação Histórica Combinada (Todos os Snapshots)</option>
                    {reportHistory.length > 0 && <option value="snapshot_unico">Visualizar Snapshot Anterior Específico</option>}
                  </select>

                  {historyOption === "snapshot_unico" && reportHistory.length > 0 && (
                    <select
                      value={selectedSnapshotDataId}
                      onChange={(e) => handleHistoryOptionChange("snapshot_unico", e.target.value)}
                      className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-white px-3 py-1.5 rounded focus:outline-none focus:border-sky-500 font-sans cursor-pointer shrink-0"
                    >
                      {reportHistory.map((snap: any) => (
                        <option key={snap.id} value={snap.id}>
                          {snap.sourceName} ({new Date(snap.timestamp).toLocaleString("pt-BR")})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Baseline comparison choice */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide block">Comparar KPIs Contra Baseline:</label>
                <div className="flex gap-2">
                  <select
                    value={selectedComparisonSnapshotId}
                    onChange={(e) => setSelectedComparisonSnapshotId(e.target.value)}
                    className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-white px-3 py-1.5 rounded focus:outline-none focus:border-sky-500 font-sans cursor-pointer shrink-0"
                  >
                    <option value="">Nenhum baseline de comparação (Ver apenas valores nominal)</option>
                    {reportHistory.map((snap: any) => (
                      <option key={snap.id} value={snap.id}>
                        {snap.sourceName} | {formatCurrencyValue(snap.metrics.receitaTotal)} | {snap.metrics.margemMedia.toFixed(1)}% Margem ({new Date(snap.timestamp).toLocaleDateString()})
                      </option>
                    ))}
                  </select>

                  {/* Clean comparison action */}
                  {selectedComparisonSnapshotId && (
                    <button
                      onClick={() => setSelectedComparisonSnapshotId("")}
                      className="px-2 py-1.5 text-xs font-bold text-rose-600 hover:text-rose-800 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded"
                      title="Fechar comparação"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* List of Report History and snaps saved on server */}
            {reportHistory.length > 0 && (
              <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Relatórios Salvos do Servidor para Auditoria Relativa ({reportHistory.length})</p>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {reportHistory.map((snap: any) => (
                    <div
                      key={snap.id}
                      onClick={() => setSelectedComparisonSnapshotId(snap.id)}
                      className={`text-[10px] px-2.5 py-1 rounded-md border flex items-center gap-1.5 cursor-pointer transition-all ${
                        selectedComparisonSnapshotId === snap.id
                          ? "bg-sky-50 dark:bg-sky-950/20 border-sky-300 dark:border-sky-900/50 text-sky-700 dark:text-sky-300 shadow-xs"
                          : "bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-655 dark:text-slate-300"
                      }`}
                    >
                      <Clock size={10} className="text-slate-400" />
                      <span className="font-semibold truncate max-w-[120px]">{snap.sourceName}</span>
                      <span className="font-mono text-[9px] text-slate-400 dark:text-slate-500 border-l border-slate-200 dark:border-slate-750 pl-1">{snap.metrics.margemMedia.toFixed(0)}% mrg</span>
                      <button
                        onClick={(e) => handleDeleteSnapshot(snap.id, e)}
                        className="text-slate-400 hover:text-rose-600 font-bold p-0.5 rounded"
                        title="Deletar permanentemente"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* MONITOR DE MARGEM OPERACIONAL - CONTROL BAR */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 font-sans hover:shadow-md transition-shadow duration-150">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded">
                <AlertTriangle size={15} className="stroke-[2.5]" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-white">Monitor de Margem Operacional</h4>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">Destaque visual automático para eficiência abaixo da meta definida</p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              {/* Slider & Label */}
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 px-2.5 py-1 rounded-md">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Alerta de Margem:</span>
                <input
                  type="range"
                  min="0"
                  max="40"
                  step="0.5"
                  value={margemLimite}
                  onChange={(e) => setMargemLimite(Number(e.target.value))}
                  className="w-20 sm:w-28 h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-600"
                />
                <span className="text-[11px] font-mono font-extrabold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/60 rounded px-1.5 py-0.5">
                  &lt; {margemLimite.toFixed(1)}%
                </span>
              </div>

              {/* Presets */}
              <div className="flex gap-1">
                {[5, 10, 15, 20].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setMargemLimite(preset)}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded border transition-all ${
                      margemLimite === preset
                        ? "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 shadow-sm"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-750 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-amber-400 cursor-pointer"
                    }`}
                  >
                    {preset}%
                  </button>
                ))}
              </div>

              {/* Status Indicator */}
              {itensAbaixoDoLimite > 0 ? (
                <div className="text-[10px] font-extrabold text-white bg-red-600 px-2 py-1 rounded-md flex items-center gap-1 animate-pulse">
                  <span>{itensAbaixoDoLimite} {itensAbaixoDoLimite === 1 ? 'alerta' : 'alertas'}</span>
                </div>
              ) : (
                <div className="text-[10px] font-extrabold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 px-2 py-1 rounded-md">
                  Conforme
                </div>
              )}
            </div>
          </div>

          {/* KPI TELEMETRY SEGMENT */}
          <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <KpiCard
              title="Faturamento Bruto"
              value={formatCurrencyValue(metrics.receitaTotal)}
              subtitle="Receitas comerciais brutas"
              icon={Coins}
              comparison={comparisonGains ? comparisonGains.receita : null}
            />
            <KpiCard
              title="Custo Operacional"
              value={formatCurrencyValue(metrics.custoTotal)}
              subtitle="Custo de faturamento (CMV)"
              type="negative"
              icon={Building}
            />
            <KpiCard
              title="Gastos &amp; Despesas"
              value={formatCurrencyValue(metrics.despesaTotal)}
              subtitle="Operacional e centros fixos"
              type="negative"
              icon={GitBranch}
              comparison={comparisonGains ? comparisonGains.despesa : null}
            />
            <KpiCard
              title="Resultado Líquido"
              value={formatCurrencyValue(metrics.lucroTotal)}
              subtitle="Margens reais de lucro"
              type={metrics.lucroTotal >= 0 ? "positive" : "negative"}
              icon={TrendingUp}
              comparison={comparisonGains ? comparisonGains.lucro : null}
            />
            <KpiCard
              title="Retorno Líquido"
              value={`${metrics.margemMedia.toFixed(2)}%`}
              subtitle={metrics.margemMedia < margemLimite ? "Margem crítica atingida" : "Margem saudável do grupo"}
              isAlert={metrics.margemMedia < margemLimite}
              type={metrics.margemMedia >= margemLimite ? "positive" : "negative"}
              icon={BarChart3}
              comparison={comparisonGains ? comparisonGains.margem : null}
            />
          </section>

          {/* DYNAMIC METRIC CHARTS GRID */}
          <section>
            <ChartsGrid metrics={metrics} />
          </section>

          {/* AI CONSULTING INSIGHTS */}
          <section className="bg-slate-900 border border-slate-950 rounded-xl shadow-md overflow-hidden flex flex-col">
            <div className="p-3 bg-slate-950 text-white flex justify-between items-center border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shrink-0"></div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-blue-400">
                    <span>Análise Consultiva Agent OS</span>
                  </h3>
                  <p className="text-[9px] text-slate-400 mt-0.5">Diagnósticos e diretrizes geradas dinamicamente com base nas visões filtradas</p>
                </div>
              </div>
              
              {aiSource && (
                <span className="text-[9px] font-mono font-bold bg-slate-900 border border-slate-800 text-blue-300 rounded px-2 py-0.5 shrink-0">
                  {aiSource}
                </span>
              )}
            </div>

            <div className="p-4 relative min-h-[160px] bg-slate-900 text-slate-300">
              {aiLoading ? (
                <div className="absolute inset-0 bg-slate-900/95 flex flex-col justify-center items-center p-4 gap-2 z-10 rounded-b-xl border-t border-slate-850/40">
                  <div className="relative">
                    <div className="w-9 h-9 border-3 border-slate-800 border-t-blue-500 rounded-full animate-spin"></div>
                    <Sparkles className="absolute inset-0 m-auto text-blue-400 animate-pulse" size={13} />
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] font-bold text-white animate-pulse">Agente BI está estruturando auditoria financeira...</p>
                    <p className="text-[9px] text-slate-400 mt-0.5 italic max-w-md">Analisando rubricas de despesas, taxas operacionais de marcas e gerando recomendações consultivas em tempo real.</p>
                  </div>
                </div>
              ) : null}

              {aiError && (
                <div className="mb-3 p-2.5 bg-rose-950/40 text-rose-300 text-[11px] rounded border border-rose-900/50 flex items-start gap-1.5">
                  <AlertTriangle size={13} className="shrink-0 mt-0.5 text-rose-400" />
                  <p>{aiError}</p>
                </div>
              )}

              {aiAnalysis ? (
                <div className="prose prose-invert max-w-none text-[11px] leading-relaxed font-sans space-y-3">
                  {/* Styled markdown content rendering */}
                  <div className="markdown-body text-slate-200">
                    <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                  <Sparkles size={20} className="text-slate-600 mb-1.5" />
                  <p className="text-[11px] text-center font-medium">Nenhum relatório consultivo ativo. Clique em "Reanalisar com IA" para mobilizar o agente.</p>
                </div>
              )}
            </div>
          </section>

          {/* CENTRAL DE EXPORTACAO - TAB DATA LIST (Requirement 9) */}
          <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 space-y-3 hover:shadow-md transition-all duration-150">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">Central de Agrupamento & Exportação</h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium">Gere demonstrativos táticos em múltiplos agrupamentos operacionais</p>
              </div>
              <div className="flex flex-wrap gap-1.5 items-center w-full sm:w-auto justify-end">
                <select
                  value={reportLevel}
                  onChange={(e) => setReportLevel(e.target.value as any)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-200 px-2 py-1 rounded focus:outline-none focus:border-blue-500 font-sans cursor-pointer shrink-0"
                >
                  <option value="completo">Relatório Completo do Grupo</option>
                  <option value="cnpj">Relatório Individual por CNPJ</option>
                  <option value="marca">Relatório Individual por Marca</option>
                </select>

                <button
                  onClick={handleDownloadReport}
                  className="px-2.5 py-1 bg-slate-800 dark:bg-slate-700 text-slate-100 dark:text-white hover:bg-slate-900 dark:hover:bg-slate-600 transition-colors text-[10px] uppercase tracking-wide font-extrabold rounded cursor-pointer shrink-0"
                >
                  Exportar CSV
                </button>
              </div>
            </div>

            {/* DEMONSTRATIVO TABLE */}
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg max-h-64 custom-scrollbar">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider sticky top-0 z-10 text-[9px] font-sans">
                    {reportLevel === "cnpj" && (
                      <th className="py-2 px-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-905" onClick={() => toggleSort("CNPJ")}>
                        CNPJ
                      </th>
                    )}
                    {reportLevel === "marca" && (
                      <th className="py-2 px-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-905" onClick={() => toggleSort("Marca")}>
                        Marca
                      </th>
                    )}
                    {reportLevel === "completo" && (
                      <th className="py-2 px-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-905" onClick={() => toggleSort("Grupo")}>
                        Grupo
                      </th>
                    )}
                    <th className="py-2 px-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-905" onClick={() => toggleSort("Empresa")}>
                      Empresa
                    </th>
                    <th className="py-2 px-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-905" onClick={() => toggleSort("Mês")}>
                      Competência
                    </th>
                    <th className="py-2 px-3.5 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-905" onClick={() => toggleSort("Receita")}>
                      Receita Bruta
                    </th>
                    <th className="py-2 px-3.5 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-905" onClick={() => toggleSort("Custo")}>
                      Custo (CMV)
                    </th>
                    <th className="py-2 px-3.5 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-950" onClick={() => toggleSort("Despesa")}>
                      Gastos/Despesas
                    </th>
                    <th className="py-2 px-3.5 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-950" onClick={() => toggleSort("Lucro")}>
                      Retorno Líquido
                    </th>
                    <th className="py-2 px-3.5 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-950" onClick={() => toggleSort("Margem")}>
                      Eficiência
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 dark:divide-slate-800 bg-white dark:bg-slate-900 font-sans text-slate-600 dark:text-slate-300">
                  {sortedReportData.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-6 text-center text-slate-400 dark:text-slate-500 italic text-[11px]">
                        Nenhum registro ativo sob as seleções dos filtros corporativos.
                      </td>
                    </tr>
                  ) : (
                    sortedReportData.map((row: any, idx: number) => {
                      const isPositive = row.Lucro >= 0;
                      const isRowAlert = row.Margem < margemLimite;
                      return (
                        <tr 
                          key={idx} 
                          className={`text-[11px] h-8 transition-colors ${
                            isRowAlert 
                              ? "bg-red-50/60 dark:bg-red-950/20 hover:bg-red-100/75 dark:hover:bg-red-900/30 border-l-2 border-l-red-500 text-red-950 dark:text-red-200" 
                              : "hover:bg-slate-50/50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-350"
                          }`}
                        >
                          {reportLevel === "cnpj" && (
                            <td className={`py-1 px-3.5 font-mono font-bold ${isRowAlert ? "text-red-900 dark:text-red-300" : "text-slate-700 dark:text-slate-300"}`}>
                              {row.CNPJ}
                            </td>
                          )}
                          {reportLevel === "marca" && (
                            <td className={`py-1 px-3.5 font-bold ${isRowAlert ? "text-red-900 dark:text-red-300" : "text-slate-800 dark:text-slate-200"}`}>
                              {row.Marca}
                            </td>
                          )}
                          {reportLevel === "completo" && (
                            <td className={`py-1 px-3.5 font-medium ${isRowAlert ? "text-slate-800 dark:text-red-350" : "text-slate-500 dark:text-slate-400"}`}>
                              {row.Grupo}
                            </td>
                          )}
                          <td className="py-1 px-3.5 truncate max-w-[130px] font-sans" title={row.Empresa}>{row.Empresa}</td>
                          <td className="py-1 px-3.5 text-slate-500 dark:text-slate-400 font-medium">{row.Mês}</td>
                          <td className="py-1 px-3.5 text-right font-mono text-slate-705 dark:text-slate-300 font-medium">{formatCurrencyValue(row.Receita)}</td>
                          <td className="py-1 px-3.5 text-right font-mono text-slate-405 dark:text-slate-450">{formatCurrencyValue(row.Custo)}</td>
                          <td className="py-1 px-3.5 text-right font-mono text-slate-405 dark:text-slate-450">{formatCurrencyValue(row.Despesa)}</td>
                          <td className={`py-1 px-3.5 text-right font-mono font-bold ${isPositive && !isRowAlert ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400"}`}>
                            {formatCurrencyValue(row.Lucro)}
                          </td>
                          <td className={`py-1 px-3.5 text-right font-mono font-bold ${isPositive && !isRowAlert ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400"}`}>
                            <div className="flex items-center justify-end gap-1">
                              {isRowAlert && <AlertTriangle size={11} className="text-red-500 animate-pulse shrink-0" />}
                              <span>{row.Margem.toFixed(1)}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* PYTHON CORE EXPORTER / EXECUTABLE EXCISE SEGMENT */}
          {currentUser?.role === "consultor" && (
            <section>
              <StreamlitExporter />
            </section>
          )}

          {/* TRACEABILITY AND INTEGRITY AUDITOR */}
          <section>
            <TraceabilityPanel
              totalImported={dataOrigem.length}
              totalFiltered={filteredData.length}
              missingFields={camposAusentes}
              sourceName={nomeFonte}
            />
          </section>

            </div>
          )}

        </section>
      </main>

      {/* FOOTER AREA - Compact High Density */}
      <footer className="bg-slate-900 border-t border-slate-950 text-slate-500 py-4 text-center text-[10px] shrink-0 font-sans leading-normal">
        <p className="font-semibold text-slate-400">Sauron &copy; 2026</p>
        <p className="text-slate-600 mt-0.5">Ambiente corporativo de alta confiabilidade operacional e rastreabilidade financeira auditada.</p>
      </footer>
      <LgpdConsent />
    </div>
  );
}
