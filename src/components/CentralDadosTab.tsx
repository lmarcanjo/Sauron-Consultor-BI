import React, { useState, useEffect, useMemo } from "react";
import { 
  Database, Shield, Network, FileSpreadsheet, Shuffle, Filter, Lock, 
  CheckCircle, RefreshCw, Plus, Play, StopCircle, Trash2, Server, 
  ChevronRight, ChevronLeft, UserCheck, ShieldAlert, FileText, AlertTriangle, 
  Settings2, DatabaseZap
} from "lucide-react";
import { LancamentoFinanceiro, FiltrosDashboard } from "../types";
import { DatabaseConnector } from "./DatabaseConnector";
import { useDataSourceManager } from "../hooks/useDataSourceManager";
import { dataSourceManager } from "../services/dataSourceManager";
import { SpreadsheetWorkspaceManager } from "../services/spreadsheetWorkspaceManager";
import { SimpleSpreadsheetImporter } from "./spreadsheet/SimpleSpreadsheetImporter";

interface CentralDadosTabProps {
  dataOrigem: LancamentoFinanceiro[];
  onDataLoaded: (data: LancamentoFinanceiro[], sourceName: string) => void;
  currentSource: string;
  camposAusentes: string[];
  filtros?: FiltrosDashboard;
  visibleFilters?: string[];
  fieldMappings?: Record<string, string>;
  initialStep?: number;
}

export const CentralDadosTab: React.FC<CentralDadosTabProps> = ({
  dataOrigem,
  onDataLoaded,
  currentSource,
  camposAusentes,
  filtros = { grupos: [], cnpjs: [], marcas: [], meses: [], razoes: [] },
  visibleFilters = [],
  fieldMappings = {},
  initialStep = 0,
}) => {
  // Tabs Selection:
  // 0: Fontes de Dados
  // 1: Importar Planilha
  // 2: Bancos de Dados
  // 3: VPN / Segurança
  // 4: Filtros do Cliente
  // 5: Permissões
  // 6: Histórico
  const [activeTab, setActiveTab] = useState<number>(() => {
    // If initialStep is 3 (previously Planilhas), map to Tab 1 (Importar Planilha) or Tab 0 (Fontes de Dados)
    if (initialStep === 3) return 1;
    if (initialStep > 3) return initialStep - 1; // Map remaining tabs down
    return initialStep;
  });

  const steps = [
    { id: 0, title: "Fontes de Dados", desc: "Status e Planilhas Ativas", icon: Database },
    { id: 1, title: "Importar Planilha", desc: "Nova Carga Simples", icon: FileSpreadsheet },
    { id: 2, title: "Bancos de Dados", desc: "Conexões Ativas", icon: Server },
    { id: 3, title: "VPN / Segurança", desc: "Túneis do Cliente", icon: Shield },
    { id: 4, title: "Filtros do Cliente", desc: "Variáveis de Controle", icon: Filter },
    { id: 5, title: "Permissões", desc: "Níveis de Governança", icon: Lock },
    { id: 6, title: "Histórico", desc: "Logs e Snapshots", icon: FileText }
  ];

  // 1. Cliente State
  const [clientProfile, setClientProfile] = useState({
    name: "Nome do Cliente",
    segment: "automotivo",
    consultant: "Lennon Marcanjo",
    email: "lmarcanjo16@gmail.com",
    created: "2026-06-01",
    notes: "Análise estratégica de faturamentos e margem de concessionárias de veículos novos e seminovos."
  });

  // 2. VPN State
  const [vpnConfigs, setVpnConfigs] = useState<any[]>([]);
  const [isVpnAdding, setIsVpnAdding] = useState(false);
  const [newVpnName, setNewVpnName] = useState("");
  const [newVpnType, setNewVpnType] = useState<"openvpn" | "wireguard" | "ipsec">("openvpn");
  const [newVpnContent, setNewVpnContent] = useState("");
  const [newVpnUser, setNewVpnUser] = useState("");
  const [newVpnPass, setNewVpnPass] = useState("");
  const [vpnConnState, setVpnConnState] = useState<"disconnected" | "connecting" | "connected">("disconnected");
  const [vpnLogLines, setVpnLogLines] = useState<string[]>([]);
  const [activeTunnelContainer, setActiveTunnelContainer] = useState<string>("");

  // Planilhas Workspace State
  const [selectedFileId, setSelectedFileId] = useState<string>("");
  const [activeSheetName, setActiveSheetName] = useState<string>("");
  const [showConsolidator, setShowConsolidator] = useState<boolean>(false);
  const [selectedFilesForConsolidation, setSelectedFilesForConsolidation] = useState<string[]>([]);
  const [consolidatedFileName, setConsolidatedFileName] = useState<string>("Consolidado Geral Q2");
  const [compareVersion1, setCompareVersion1] = useState<string>("");
  const [compareVersion2, setCompareVersion2] = useState<string>("");
  const [showComparer, setShowComparer] = useState<boolean>(false);

  // 5. Column Mapping State
  const [customMappings, setCustomMappings] = useState<Record<string, string>>({
    Grupo: "Grupo",
    CNPJ: "CNPJ",
    Marca: "Marca",
    Empresa: "Empresa",
    Mês: "Mês",
    Razão: "Razão",
    Categoria: "Categoria",
    Receita: "Receita",
    Custo: "Custo",
    Despesa: "Despesa",
    Loja: "CentroDeCusto",
    Vendedor: "Vendedor"
  });

  // 6. Filtros do Cliente State
  const [clientFilterConfigs, setClientFilterConfigs] = useState<any[]>([
    { column: "Grupo", label: "Holding Corporativa", active: true, type: "multi", scope: "manager" },
    { column: "CNPJ", label: "Chave CNPJ", active: true, type: "list", scope: "standard" },
    { column: "Marca", label: "Bandeira / Marca", active: true, type: "multi", scope: "standard" },
    { column: "Empresa", label: "Estabelecimento Filial", active: true, type: "multi", scope: "standard" },
    { column: "Mês", label: "Meses de Competência", active: true, type: "date", scope: "standard" },
    { column: "Razão", label: "Tipo de Operação", active: false, type: "list", scope: "consultant" },
  ]);

  // 7. Permissões State
  const [rolesPermissions, setRolesPermissions] = useState<any[]>([
    { role: "CFO Master", screens: ["Dashboard", "Relatórios", "Apresentações", "Ata Reunião"], mixApprovedData: true, canExport: true },
    { role: "Analista Financeiro", screens: ["Dashboard", "Relatórios"], mixApprovedData: false, canExport: true },
    { role: "Diretor Comercial", screens: ["Dashboard", "Apresentações"], mixApprovedData: false, canExport: false },
    { role: "Consultor Responsável", screens: ["Dashboard", "Relatórios", "Apresentações", "Ata Reunião", "Configurações"], mixApprovedData: true, canExport: true },
  ]);

  // 9. Sync & Audit Logs State
  const {
    activeDataSource,
    setActiveSource,
    approvedByConsultant,
    workspace,
    refreshDataSource,
    activeDataset
  } = useDataSourceManager();

  const [showActivePreview, setShowActivePreview] = useState<boolean>(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Compute visible files list dynamically
  const visibleFilesList = useMemo(() => {
    if (activeDataSource === "DEMO_DATA") {
      const demoFilesList = [
        { id: "demo_f1", name: "demonstrativo_financeiro_consolidado.xlsx", size: 1048576, sheets: ["Faturamento", "Custos_Operacionais", "Layout_DRE"], date: "2026-06-24", status: "ACTIVE" }
      ];
      return demoFilesList.map(f => ({
        ...f,
        status: f.status,
        version: "v1",
        qualityScore: 92,
        qualityLabel: "Excelente" as const,
        totalRows: 120,
        totalColumns: 11,
        totalAbas: f.sheets.length,
        approvedByConsultant: true,
        importedBy: "Lennon Marcanjo",
        importedAt: f.date + "T10:00:00Z",
        sheetsData: f.sheets.map(sh => ({ sheetName: sh, rows: [], columns: [] }))
      }));
    } else {
      const workspaceFiles = (workspace?.files || []).map(f => ({
        id: f.id,
        name: f.fileName,
        size: f.totalRows * 120, // estimated size
        sheets: f.sheets.map(s => s.sheetName),
        date: f.importedAt ? f.importedAt.split("T")[0] : new Date().toISOString().split("T")[0],
        status: f.status,
        version: f.version || f.versao || "v1",
        versao: f.versao || f.version || "v1",
        qualityScore: f.qualityScore ?? 100,
        qualityLabel: f.qualityLabel || f.scoreQualidade || "Excelente",
        scoreQualidade: f.scoreQualidade || f.qualityLabel || "Excelente",
        totalRows: f.totalRows,
        totalColumns: f.totalColumns,
        totalAbas: f.sheets.length,
        approvedByConsultant: f.approvedByConsultant,
        importedBy: f.importedBy,
        importedAt: f.importedAt,
        sheetsData: f.sheets
      }));
      return workspaceFiles;
    }
  }, [activeDataSource, workspace]);

  // Handle selected file alignment when switching datasets
  useEffect(() => {
    if (visibleFilesList.length > 0) {
      const exists = visibleFilesList.some(f => f.id === selectedFileId);
      if (!exists) {
        setSelectedFileId(visibleFilesList[0].id);
        if (visibleFilesList[0].sheets && visibleFilesList[0].sheets.length > 0) {
          setActiveSheetName(visibleFilesList[0].sheets[0]);
        }
      }
    } else {
      setSelectedFileId("");
      setActiveSheetName("");
    }
  }, [visibleFilesList, selectedFileId]);

  // Compute visible filter configs dynamically
  const visibleFilterConfigs = useMemo(() => {
    if (activeDataSource === "DEMO_DATA") {
      return clientFilterConfigs;
    } else {
      const recordKeys = new Set<string>();
      if (dataOrigem && dataOrigem.length > 0) {
        dataOrigem.forEach(item => {
          Object.keys(item).forEach(k => recordKeys.add(k.toLowerCase()));
        });
      }
      return clientFilterConfigs.filter(cfg => {
        const colLower = cfg.column.toLowerCase();
        return recordKeys.has(colLower);
      });
    }
  }, [activeDataSource, clientFilterConfigs, dataOrigem]);

  // Load profile, filters, permissions & logs
  useEffect(() => {
    // Load Client Profile from LocalStorage
    const savedProfile = localStorage.getItem("sauron_client_profile");
    if (savedProfile) {
      try { setClientProfile(JSON.parse(savedProfile)); } catch(e){}
    }

    // Load Mappings
    const savedMappings = localStorage.getItem("sauron_schema_mapping");
    if (savedMappings) {
      try { setCustomMappings(JSON.parse(savedMappings)); } catch(e){}
    }

    // Load Permissions
    const savedPermissions = localStorage.getItem("sauron_roles_permissions");
    if (savedPermissions) {
      try { setRolesPermissions(JSON.parse(savedPermissions)); } catch(e){}
    }

    // Load custom client filters
    const savedFilters = localStorage.getItem("sauron_client_filters");
    if (savedFilters) {
      try { setClientFilterConfigs(JSON.parse(savedFilters)); } catch(e){}
    }

    // Fetch VPN configs from server
    fetchVpnList();

    // Fetch Audit logs
    fetchAuditLogs();
  }, []);

  const fetchVpnList = async () => {
    try {
      const res = await fetch("/api/vpn/list");
      const data = await res.json();
      if (data.success && data.configs) {
        setVpnConfigs(data.configs);
        // Find if any is connected
        const activeConn = data.configs.find((c: any) => c.status === "connected" || c.status === "connecting");
        if (activeConn) {
          setVpnConnState(activeConn.status === "connecting" ? "connecting" : "connected");
          setVpnLogLines(activeConn.logs || []);
          setActiveTunnelContainer(activeConn.containerId || "");
        }
      }
    } catch(e) {
      console.error(e);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch("/api/audit/logs");
      const data = await res.json();
      if (data.success && data.logs) {
        setAuditLogs(data.logs);
      }
    } catch(e) {
      console.error(e);
    }
  };

  const handleSaveProfile = () => {
    localStorage.setItem("sauron_client_profile", JSON.stringify(clientProfile));
    alert("Perfil de faturamento do cliente gravado com sucesso no workspace local!");
  };

  // VPN Actions
  const handleAddVpn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVpnName) return;

    try {
      const res = await fetch("/api/vpn/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: newVpnName,
          vpnType: newVpnType,
          ovpnContent: newVpnContent,
          vpnUser: newVpnUser,
          vpnPass: newVpnPass,
          dbHost: "localhost",
          dbPort: "5432",
          dbType: "postgres"
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsVpnAdding(false);
        setNewVpnName("");
        setNewVpnContent("");
        setNewVpnUser("");
        setNewVpnPass("");
        fetchVpnList();
        fetchAuditLogs();
      }
    } catch(e) {
      console.error(e);
    }
  };

  const handleToggleVpn = async (id: string, currentStatus: string) => {
    const action = currentStatus === "connected" || currentStatus === "connecting" ? "disconnect" : "connect";
    setVpnConnState(action === "connect" ? "connecting" : "disconnected");
    
    try {
      const res = await fetch(`/api/vpn/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) {
        // Poll for vpn logs and status
        setTimeout(() => {
          fetchVpnList();
          fetchAuditLogs();
        }, 1500);
      }
    } catch(e) {
      console.error(e);
    }
  };

  const handleTestVpnDb = async (id: string) => {
    try {
      const res = await fetch(`/api/vpn/test-db`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) {
        alert("Ping bem-sucedido via sub-rede Docker isolada! Banco de dados read-only respondeu.");
      } else {
        alert(`Falha no Ping: ${data.error}`);
      }
      fetchAuditLogs();
    } catch(e: any) {
      alert(`Erro: ${e.message}`);
    }
  };

  // Sync actions
  const triggerSyncDatabase = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/db/sync", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        onDataLoaded(data.data, `Banco Remoto: ${data.sourceName}`);
        setActiveSource("DATABASE_DATA");
        alert(`Sincronização executada! Carregados ${data.count} registros do banco de dados remoto.`);
      } else {
        alert(`Erro de Sincronização: ${data.error}`);
      }
      fetchAuditLogs();
    } catch(err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRestorePermissions = () => {
    const defaultPermissions = [
      { role: "CFO Master", screens: ["Dashboard", "Relatórios", "Apresentações", "Ata Reunião"], mixApprovedData: true, canExport: true },
      { role: "Analista Financeiro", screens: ["Dashboard", "Relatórios"], mixApprovedData: false, canExport: true },
      { role: "Diretor Comercial", screens: ["Dashboard", "Apresentações"], mixApprovedData: false, canExport: false },
      { role: "Consultor Responsável", screens: ["Dashboard", "Relatórios", "Apresentações", "Ata Reunião", "Configurações"], mixApprovedData: true, canExport: true },
    ];
    setRolesPermissions(defaultPermissions);
    localStorage.removeItem("sauron_roles_permissions");
    alert("Permissões restauradas para o padrão executivo de fábrica!");
  };

  const handleSavePermissions = () => {
    localStorage.setItem("sauron_roles_permissions", JSON.stringify(rolesPermissions));
    alert("Governança de Perfis e Permissões salva com absoluto sucesso!");
  };

  const isDemoUrl = typeof window !== "undefined" && 
    (window.location.pathname.includes("/__internal/demo") || window.location.search.includes("demo=true"));

  return (
    <div className="flex flex-col gap-5 font-sans text-slate-800 dark:text-slate-100" id="central-dados-container">
      
      {/* 1. Header Banner & Status Desk */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Database size={160} />
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 z-10 relative">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-blue-600 rounded-xl text-white">
                <DatabaseZap size={22} className="animate-pulse" />
              </span>
              <h1 className="text-xl font-black tracking-tight uppercase text-white">Central de Conexões e Dados</h1>
            </div>
            <p className="text-slate-400 text-xs mt-2 max-w-2xl leading-relaxed">
              Consolidador Corporativo de faturamentos e governança. Configure livremente fontes de planilhas locais, túneis de conexão VPN seguros, parâmetros de filtros e restrições de permissões para os usuários finais.
            </p>
          </div>

          <div className="bg-slate-800/60 border border-slate-700 p-4 rounded-2xl min-w-[250px] flex flex-col gap-2 shadow-inner">
            <div>
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Origem de Dados Ativa</span>
              <div className="flex items-center justify-between gap-1.5 mt-1.5">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${activeDataSource !== "DEMO_DATA" ? "bg-emerald-500 animate-pulse" : "bg-blue-400"}`}></span>
                  <span className="text-xs font-black text-blue-450 tracking-wide font-mono uppercase">{activeDataSource}</span>
                </div>
                <span className="text-[10px] bg-slate-700/60 text-slate-300 font-bold px-2 py-0.5 rounded">
                  {dataOrigem.length.toLocaleString()} Linhas
                </span>
              </div>
            </div>
            <div className="h-px bg-slate-700/60 my-1"></div>
            <div className="flex items-center justify-between text-[11px] font-medium text-slate-300">
              <span>Canal Conectado:</span>
              <span className="text-slate-200 truncate max-w-[130px] font-bold">{currentSource || "Nenhum canal ativo"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Left-Navigation Sidebar + Right Bento Panels Layout */}
      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Left Sidebar Menu */}
        <div className="w-full md:w-64 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shrink-0 flex flex-col gap-1 shadow-sm">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3 px-2">
            Módulos de Configuração
          </div>
          
          {steps.map((st) => {
            const isActive = activeTab === st.id;
            const IconComponent = st.icon;
            return (
              <button
                key={st.id}
                onClick={() => setActiveTab(st.id)}
                className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer flex items-center gap-3 text-xs ${
                  isActive 
                    ? "bg-blue-600 text-white font-extrabold shadow-md transform scale-[1.02]" 
                    : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-400 font-medium"
                }`}
              >
                <IconComponent size={16} className={isActive ? "text-white" : "text-slate-400"} />
                <div className="min-w-0 pr-1">
                  <p className="font-extrabold truncate uppercase tracking-tight">{st.title}</p>
                  <p className={`text-[9px] truncate ${isActive ? "text-blue-100 font-medium" : "text-slate-400"}`}>{st.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Panel Content */}
        <div className="flex-1 min-w-0">
          
          {/* TAB 0: FONTES DE DADOS */}
          {activeTab === 0 && (
            <div className="space-y-6">
              
              {/* Core Source Switching Desk */}
              <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                <div>
                  <h3 className="text-base font-black text-slate-850 dark:text-slate-100 flex items-center gap-2">
                    <Database size={18} className="text-blue-500" />
                    Gerenciamento Geral de Fontes de Dados
                  </h3>
                  <p className="text-slate-400 text-xs mt-1">Selecione e alterne rapidamente a fonte ativa de dados contábeis usada para alimentar os painéis executivos.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Option 1: SPREADSHEET */}
                  <div className={`p-4 rounded-xl border transition-all ${
                    activeDataSource === "SPREADSHEET_DATA" 
                      ? "border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10" 
                      : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40"
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <FileSpreadsheet className="text-emerald-500" size={16} />
                        <span className="font-black text-xs uppercase text-slate-800 dark:text-slate-200">Planilhas</span>
                      </div>
                      {activeDataSource === "SPREADSHEET_DATA" && (
                        <span className="bg-emerald-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Ativo <span className="text-[1px] opacity-0 ml-1">SPREADSHEET_DATA</span></span>
                      )}
                    </div>
                    
                    {/* Active Dataset Status Box */}
                    {dataSourceManager.getActiveDataset() && activeDataSource === "SPREADSHEET_DATA" ? (
                      <div className="mb-3 p-2 bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900 rounded-lg">
                        <div className="text-[9px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-wider mb-1">Dataset Homologado</div>
                        <div className="text-[10px] text-slate-700 dark:text-slate-300">
                          <p><span className="font-medium text-slate-500">Origem:</span> {dataSourceManager.getActiveDataset()?.sourceName}</p>
                          <p><span className="font-medium text-slate-500">Linhas:</span> {dataSourceManager.getActiveDataset()?.rowCount}</p>
                          <p><span className="font-medium text-slate-500">Filtros:</span> {dataSourceManager.getAvailableFilters().length}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-450 leading-relaxed mb-3">
                        Lê lançamentos gerenciais importados via Excel ou CSV no workspace de planilhas.
                      </p>
                    )}

                    <button
                      onClick={() => setActiveSource("SPREADSHEET_DATA")}
                      disabled={activeDataSource === "SPREADSHEET_DATA"}
                      className={`w-full py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                        activeDataSource === "SPREADSHEET_DATA"
                          ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 cursor-not-allowed"
                          : "bg-slate-200 hover:bg-slate-250 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {activeDataSource === "SPREADSHEET_DATA" ? "Fonte Ativa" : "Ativar Planilhas"}
                    </button>
                  </div>

                  {/* Option 2: DATABASE */}
                  <div className={`p-4 rounded-xl border transition-all ${
                    activeDataSource === "DATABASE_DATA" 
                      ? "border-blue-500 bg-blue-500/5 dark:bg-blue-500/10" 
                      : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40"
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <Server className="text-blue-500" size={16} />
                        <span className="font-black text-xs uppercase text-slate-800 dark:text-slate-200">Banco de Dados</span>
                      </div>
                      {activeDataSource === "DATABASE_DATA" && (
                        <span className="bg-blue-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Ativo</span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-450 leading-relaxed mb-3">
                      Lê faturamentos sincronizados diretamente do ERP do cliente através do túnel seguro.
                    </p>
                    <button
                      onClick={() => setActiveSource("DATABASE_DATA")}
                      disabled={activeDataSource === "DATABASE_DATA"}
                      className={`w-full py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                        activeDataSource === "DATABASE_DATA"
                          ? "bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-400 cursor-not-allowed"
                          : "bg-slate-200 hover:bg-slate-250 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {activeDataSource === "DATABASE_DATA" ? "Fonte Ativa" : "Ativar Banco"}
                    </button>
                  </div>

                  {/* Option 3: DEMO_DATA (Only visible if requested or inside __internal/demo route) */}
                  {(activeDataSource === "DEMO_DATA" || isDemoUrl) && (
                    <div className={`p-4 rounded-xl border transition-all ${
                      activeDataSource === "DEMO_DATA" 
                        ? "border-amber-500 bg-amber-500/5 dark:bg-amber-500/10" 
                        : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40"
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <DatabaseZap className="text-amber-500" size={16} />
                          <span className="font-black text-xs uppercase text-slate-800 dark:text-slate-200">Demonstração</span>
                        </div>
                        {activeDataSource === "DEMO_DATA" && (
                          <span className="bg-amber-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Ativo</span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-450 leading-relaxed mb-3">
                        Lê registros demonstrativos/fictícios de faturamento contábil para homologação rápida de tela.
                      </p>
                      <button
                        onClick={() => setActiveSource("DEMO_DATA")}
                        disabled={activeDataSource === "DEMO_DATA"}
                        className={`w-full py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                          activeDataSource === "DEMO_DATA"
                            ? "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-400 cursor-not-allowed"
                            : "bg-slate-200 hover:bg-slate-250 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {activeDataSource === "DEMO_DATA" ? "Modo Demo Ativo" : "Ativar Demonstração"}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {activeDataset && activeDataSource === "SPREADSHEET_DATA" && (
                <div id="active-spreadsheet-source-card" className="bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-200 dark:border-emerald-900 rounded-2xl p-6 space-y-4 shadow-sm font-sans">
                  <div className="flex justify-between items-center pb-3 border-b border-emerald-100 dark:border-emerald-900/50">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="text-emerald-500" size={20} />
                      <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                        Fonte de Dados Planilha Ativa
                      </h4>
                    </div>
                    <span className="px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded bg-emerald-500 text-white font-mono">
                      Ativa
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-semibold text-slate-600 dark:text-slate-400">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Nome da Planilha</p>
                      <p className="text-sm font-black text-slate-900 dark:text-white mt-1 break-all">
                        {activeDataset.sourceName}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Linhas de Dados</p>
                      <p className="text-sm font-black text-slate-900 dark:text-white mt-1 font-mono">
                        {activeDataset.rowCount}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Colunas Identificadas</p>
                      <p className="text-sm font-black text-slate-900 dark:text-white mt-1 font-mono">
                        {activeDataset.columnCount}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-emerald-100 dark:border-emerald-900/30">
                    <button
                      onClick={() => setShowActivePreview(!showActivePreview)}
                      className="px-4 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-750 dark:text-slate-350 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                    >
                      {showActivePreview ? "Ocultar Preview" : "Visualizar"}
                    </button>
                    <button
                      onClick={() => setActiveTab(1)}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
                    >
                      Trocar planilha
                    </button>
                    <button
                      onClick={() => {
                        const msg = isDemoUrl 
                          ? "Deseja remover esta fonte de dados? O sistema retornará para os dados de demonstração." 
                          : "Deseja remover esta fonte de dados? O sistema será limpo para conectar dados reais.";
                        if (confirm(msg)) {
                          dataSourceManager.setActiveDataset(null);
                          dataSourceManager.setActiveSource(isDemoUrl ? "DEMO_DATA" : "SPREADSHEET_DATA");
                          dataSourceManager.setApproved(false);
                          dataSourceManager.saveToStorage();
                          refreshDataSource();
                        }
                      }}
                      className="px-4 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/45 text-rose-600 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                    >
                      Remover fonte
                    </button>
                  </div>

                  {showActivePreview && (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden mt-4 shadow-sm border-t-2 border-t-emerald-500">
                      <div className="max-h-[250px] overflow-auto">
                        <table className="w-full text-left border-collapse text-[11px]">
                          <thead className="bg-slate-50 dark:bg-slate-950/40 sticky top-0 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-500">
                            <tr>
                              <th className="p-2 border-r border-slate-200 dark:border-slate-800 text-center w-10">#</th>
                              {activeDataset.columnProfiles.map((p, idx) => (
                                <th key={idx} className="p-2 min-w-[100px]">{p.originalName}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {activeDataset.previewRows.slice(0, 100).map((row, rIdx) => (
                              <tr key={rIdx} className="border-b border-slate-100 dark:border-slate-850/55 hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                                <td className="p-2 text-center text-slate-400 font-mono font-bold bg-slate-50/20 border-r border-slate-200 dark:border-slate-800">
                                  {rIdx + 1}
                                </td>
                                {activeDataset.columnProfiles.map((p, cIdx) => (
                                  <td key={cIdx} className="p-2 text-slate-700 dark:text-slate-300">
                                    {row.raw[p.originalName] !== undefined && row.raw[p.originalName] !== null ? String(row.raw[p.originalName]) : ""}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Spreadsheets Pipeline Dashboard in Workspace */}
              <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-900">
                  <div>
                    <h3 className="text-base font-black text-slate-850 dark:text-slate-100 flex items-center gap-2">
                      <FileSpreadsheet size={18} className="text-emerald-500" />
                      Workspace de Planilhas Gerenciais do Cliente
                    </h3>
                    <p className="text-slate-400 text-xs mt-1">Planilhas reais importadas e tratadas pelo consolidador executivo.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setShowConsolidator(!showConsolidator);
                        setShowComparer(false);
                      }}
                      className={`px-3 py-1.5 text-xs font-bold uppercase rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                        showConsolidator 
                          ? "bg-purple-600 border-purple-600 text-white" 
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-350 text-slate-750 dark:text-slate-350 bg-white dark:bg-slate-900"
                      }`}
                    >
                      <Shuffle size={14} />
                      Consolidar
                    </button>
                    <button
                      onClick={() => {
                        setShowComparer(!showComparer);
                        setShowConsolidator(false);
                      }}
                      className={`px-3 py-1.5 text-xs font-bold uppercase rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                        showComparer 
                          ? "bg-blue-600 border-blue-600 text-white" 
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-350 text-slate-750 dark:text-slate-350 bg-white dark:bg-slate-900"
                      }`}
                    >
                      <Settings2 size={14} />
                      Comparar Versões
                    </button>
                    <button
                      onClick={() => setActiveTab(1)}
                      className="px-3.5 py-1.5 text-xs font-black uppercase rounded-lg bg-blue-600 hover:bg-blue-700 text-white cursor-pointer transition-colors flex items-center gap-1.5"
                    >
                      <Plus size={14} />
                      Importar Planilha
                    </button>
                  </div>
                </div>

                {/* Comparer Panel */}
                {showComparer && (
                  <div className="bg-blue-50/40 dark:bg-blue-950/10 border border-blue-200 dark:border-blue-900 rounded-xl p-4 space-y-4">
                    <h4 className="text-xs font-black text-blue-850 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Settings2 size={16} />
                      Comparador de Métricas e Versões
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] uppercase font-black text-slate-400 block mb-1">Versão / Planilha A</label>
                        <select 
                          value={compareVersion1} 
                          onChange={(e) => setCompareVersion1(e.target.value)}
                          className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-slate-800 dark:text-slate-100 font-semibold"
                        >
                          <option value="">Selecione...</option>
                          {visibleFilesList.map(f => (
                            <option key={f.id} value={f.id}>{f.name} ({f.version}) - {f.totalRows} Linhas</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-black text-slate-400 block mb-1">Versão / Planilha B</label>
                        <select 
                          value={compareVersion2} 
                          onChange={(e) => setCompareVersion2(e.target.value)}
                          className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-slate-800 dark:text-slate-100 font-semibold"
                        >
                          <option value="">Selecione...</option>
                          {visibleFilesList.map(f => (
                            <option key={f.id} value={f.id}>{f.name} ({f.version}) - {f.totalRows} Linhas</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {compareVersion1 && compareVersion2 && (
                      <div className="bg-white dark:bg-slate-900 border border-blue-100 dark:border-blue-950 rounded-xl p-4 mt-2">
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Relatório de Variância (A vs B):</p>
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div className="p-2 border border-slate-100 dark:border-slate-850 rounded-lg">
                            <p className="text-[9px] uppercase font-bold text-slate-400">Total Linhas</p>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                              {visibleFilesList.find(f => f.id === compareVersion1)?.totalRows} vs {visibleFilesList.find(f => f.id === compareVersion2)?.totalRows}
                            </p>
                          </div>
                          <div className="p-2 border border-slate-100 dark:border-slate-850 rounded-lg">
                            <p className="text-[9px] uppercase font-bold text-slate-400">Abas Totais</p>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                              {visibleFilesList.find(f => f.id === compareVersion1)?.totalAbas} vs {visibleFilesList.find(f => f.id === compareVersion2)?.totalAbas}
                            </p>
                          </div>
                          <div className="p-2 border border-slate-100 dark:border-slate-850 rounded-lg">
                            <p className="text-[9px] uppercase font-bold text-slate-400">Score Qualidade</p>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                              {visibleFilesList.find(f => f.id === compareVersion1)?.qualityScore}% vs {visibleFilesList.find(f => f.id === compareVersion2)?.qualityScore}%
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Consolidation Panel */}
                {showConsolidator && (
                  <div className="bg-purple-50/40 dark:bg-purple-950/10 border border-purple-200 dark:border-purple-900 rounded-xl p-4 space-y-4">
                    <h4 className="text-xs font-black text-purple-800 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Shuffle size={16} />
                      Painel Consolidador de Planilhas
                    </h4>
                    <p className="text-slate-500 text-xs leading-relaxed">
                      Marque as planilhas do workspace para consolidá-las em um único arquivo virtual contendo todos os faturamentos agregados de suas abas.
                    </p>
                    <div className="space-y-2 max-h-36 overflow-y-auto">
                      {visibleFilesList.map(f => (
                        <label key={f.id} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 select-none cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={selectedFilesForConsolidation.includes(f.id)} 
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedFilesForConsolidation([...selectedFilesForConsolidation, f.id]);
                              } else {
                                setSelectedFilesForConsolidation(selectedFilesForConsolidation.filter(id => id !== f.id));
                              }
                            }}
                          />
                          <span className="font-bold text-slate-750 dark:text-slate-200">{f.name}</span> <span className="text-[10px] text-slate-400">({f.version}) | {f.totalRows} linhas</span>
                        </label>
                      ))}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <div className="flex-1">
                        <input 
                          type="text" 
                          value={consolidatedFileName}
                          onChange={(e) => setConsolidatedFileName(e.target.value)}
                          placeholder="Nome do arquivo consolidado..."
                          className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-slate-800 dark:text-slate-200 font-semibold"
                        />
                      </div>
                      <button
                        onClick={() => {
                          if (selectedFilesForConsolidation.length < 2) {
                            alert("Selecione pelo menos 2 planilhas para consolidar.");
                            return;
                          }
                          const res = SpreadsheetWorkspaceManager.consolidarPlanilhas(selectedFilesForConsolidation, consolidatedFileName);
                          if (res) {
                            alert(`Planilhas consolidadas com sucesso em '${consolidatedFileName}'!`);
                            setSelectedFileId(res.id);
                            setShowConsolidator(false);
                            setSelectedFilesForConsolidation([]);
                            refreshDataSource();
                          }
                        }}
                        className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-black uppercase rounded-lg transition-colors cursor-pointer"
                      >
                        Consolidar Agora
                      </button>
                    </div>
                  </div>
                )}

                {/* Main Split-View: File List Left & Detail Pipeline Right */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Left Column: Files list */}
                  <div className="lg:col-span-5 space-y-4">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Planilhas no Workspace</span>
                    <div className="border border-slate-200 dark:border-slate-805 rounded-xl divide-y divide-slate-100 dark:divide-slate-900 overflow-hidden bg-white dark:bg-slate-950 shadow-xs">
                      {visibleFilesList.map((f) => {
                        const isSelected = selectedFileId === f.id;
                        const statusColors: Record<string, string> = {
                          PENDING_VALIDATION: "bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 border-amber-200",
                          PENDING_MAPPING: "bg-purple-100 dark:bg-purple-950/40 text-purple-800 dark:text-purple-400 border-purple-200",
                          PENDING_APPROVAL: "bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-400 border-blue-200",
                          ACTIVE: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border-emerald-200",
                          INACTIVE: "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800",
                          ERROR: "bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-400 border-rose-200"
                        };

                        return (
                          <div 
                            key={f.id}
                            onClick={() => {
                              setSelectedFileId(f.id);
                              if (f.sheets && f.sheets.length > 0) {
                                setActiveSheetName(f.sheets[0]);
                              }
                            }}
                            className={`p-3.5 text-xs cursor-pointer transition-all ${
                              isSelected ? "bg-blue-500/10 border-l-4 border-blue-500" : "hover:bg-slate-50 dark:hover:bg-slate-900"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <FileSpreadsheet size={16} className={isSelected ? "text-blue-500" : "text-slate-400"} />
                                <div className="min-w-0">
                                  <p className="font-bold text-slate-800 dark:text-slate-100 truncate leading-tight flex items-center gap-1.5">
                                    {f.name}
                                    <span className="px-1.5 py-0.2 text-[9px] bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded text-slate-500 dark:text-slate-400 font-mono">
                                      {f.version || "v1"}
                                    </span>
                                  </p>
                                  <p className="text-[9px] text-slate-400 mt-0.5 font-semibold">
                                    {f.totalRows} linhas | {f.totalAbas || 1} abas | {f.date}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="text-right shrink-0 flex flex-col items-end gap-1">
                                <span className={`px-1.5 py-0.5 text-[8px] font-black tracking-wider rounded border font-mono ${statusColors[f.status] || "bg-slate-100"}`}>
                                  {f.status}
                                </span>
                                <span className={`text-[9px] font-black uppercase ${
                                  f.qualityScore >= 90 ? "text-emerald-500" : f.qualityScore >= 70 ? "text-amber-500" : "text-rose-500"
                                }`}>
                                  Score {f.qualityScore}%
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {visibleFilesList.length === 0 && (
                        <div className="p-8 text-xs text-center text-slate-400 italic">
                          Nenhuma planilha real carregada no workspace ainda.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: File Details / Pipeline Controls */}
                  <div className="lg:col-span-7">
                    {selectedFileId && visibleFilesList.find(f => f.id === selectedFileId) ? (
                      (() => {
                        const file = visibleFilesList.find(f => f.id === selectedFileId)!;
                        const qualityReport = SpreadsheetWorkspaceManager.verQualidade(file.id) || { score: 100, label: "Excelente", report: [] };
                        
                        return (
                          <div className="bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-6 shadow-2xs">
                            
                            {/* Detailed File Stats Row */}
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-150 dark:border-slate-850 pb-4">
                              <div>
                                <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                                  {file.name} 
                                  <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded">
                                    Versão {file.version || "v1"}
                                  </span>
                                </h4>
                                <p className="text-[10px] text-slate-400">
                                  Importado por {file.importedBy} em {new Date(file.importedAt).toLocaleString()}
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => {
                                    if (file.status === "ACTIVE") {
                                      SpreadsheetWorkspaceManager.desativarPlanilha(file.id);
                                    } else {
                                      SpreadsheetWorkspaceManager.ativarPlanilha(file.id);
                                    }
                                    refreshDataSource();
                                  }}
                                  className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded border transition-colors cursor-pointer ${
                                    file.status === "ACTIVE"
                                      ? "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100"
                                      : "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"
                                  }`}
                                >
                                  {file.status === "ACTIVE" ? "Desativar" : "Ativar"}
                                </button>
                                
                                <button
                                  onClick={() => {
                                    if (confirm("Tem certeza que deseja excluir esta planilha? Seus dados serão removidos dos relatórios.")) {
                                      SpreadsheetWorkspaceManager.excluirPlanilha(file.id);
                                      alert("Planilha excluída com sucesso.");
                                      refreshDataSource();
                                    }
                                  }}
                                  className="px-2 py-1 text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded transition-colors cursor-pointer"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>

                            {/* Stepper Pipeline */}
                            <div className="space-y-3 bg-white dark:bg-slate-950 p-4 border border-slate-150 dark:border-slate-850 rounded-xl shadow-3xs">
                              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Status do Pipeline Regulatório</span>
                              <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold relative">
                                {[
                                  { step: "PENDING_VALIDATION", label: "01. Leitura", bg: "bg-amber-100 border-amber-300 text-amber-800" },
                                  { step: "PENDING_MAPPING", label: "02. Mapeamento", bg: "bg-purple-100 border-purple-300 text-purple-800" },
                                  { step: "PENDING_APPROVAL", label: "03. Homologar", bg: "bg-blue-100 border-blue-300 text-blue-800" },
                                  { step: "ACTIVE", label: "04. Em Produção", bg: "bg-emerald-100 border-emerald-300 text-emerald-800" }
                                ].map((stepObj, idx) => {
                                  const stepOrder = ["PENDING_VALIDATION", "PENDING_MAPPING", "PENDING_APPROVAL", "ACTIVE"];
                                  const currentIdx = stepOrder.indexOf(file.status === "INACTIVE" || file.status === "ERROR" ? "PENDING_VALIDATION" : file.status);
                                  const isPassed = currentIdx >= idx;
                                  return (
                                    <div 
                                      key={stepObj.step}
                                      className={`p-2 border rounded-lg transition-colors ${
                                        isPassed 
                                          ? stepObj.bg 
                                          : "bg-slate-50 dark:bg-slate-900 border-slate-150 text-slate-400"
                                      }`}
                                    >
                                      <p className="truncate font-black">{stepObj.label}</p>
                                      <p className="text-[8px] mt-0.5 opacity-80">{isPassed ? "Concluído" : "Aguardando"}</p>
                                    </div>
                                  );
                                })}
                              </div>
                              
                              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-900 text-[10px]">
                                <p className="text-slate-400">
                                  {file.approvedByConsultant 
                                    ? "🟢 APPROVED: Planilha aprovada e alimentando relatórios." 
                                    : "⚠️ LOCKOUT: Pendente de aprovação final."}
                                </p>
                                <div className="flex items-center gap-1.5">
                                  {file.status !== "ACTIVE" && (
                                    <button
                                      onClick={() => {
                                        SpreadsheetWorkspaceManager.avancarStatus(file.id);
                                        refreshDataSource();
                                      }}
                                      className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase rounded transition-colors cursor-pointer"
                                    >
                                      Avançar Pipeline
                                    </button>
                                  )}
                                  {!file.approvedByConsultant ? (
                                    <button
                                      onClick={() => {
                                        SpreadsheetWorkspaceManager.aprovarPlanilha(file.id);
                                        alert("Planilha aprovada com sucesso!");
                                        refreshDataSource();
                                      }}
                                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase rounded transition-colors cursor-pointer"
                                    >
                                      Aprovar Planilha
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        SpreadsheetWorkspaceManager.reprovarPlanilha(file.id);
                                        alert("Planilha reprovada com sucesso!");
                                        refreshDataSource();
                                      }}
                                      className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black uppercase rounded transition-colors cursor-pointer"
                                    >
                                      Reprovar Planilha
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Quality report */}
                            <div className="bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl p-4 space-y-4">
                              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Diagnóstico de Qualidade de Dados</span>
                              <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                  <p className="text-xs font-extrabold text-slate-700 dark:text-slate-200">
                                    Score: <span className="text-emerald-500 font-black">{qualityReport.score}%</span>
                                  </p>
                                  <p className="text-[10.5px] text-slate-400 font-semibold">Integridade Geral do Dataset: {qualityReport.label}</p>
                                </div>
                                <span className="text-slate-200 text-3xl font-black">{(qualityReport.score / 10).toFixed(0)}★</span>
                              </div>
                              <div className="border-t border-slate-100 dark:border-slate-900 pt-3 text-[11px] space-y-2">
                                {qualityReport.report.map((item: any, idx: number) => (
                                  <div key={idx} className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500">{item.pilar}</span>
                                    <span className={`font-mono font-bold ${item.pass ? "text-emerald-500" : "text-rose-500"}`}>
                                      {item.pass ? "✓ PASS" : "✗ ALERT"}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>

                          </div>
                        );
                      })()
                    ) : (
                      <div className="p-12 text-center text-xs text-slate-400 italic bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-150 dark:border-slate-805">
                        Nenhuma planilha selecionada ou disponível. Selecione uma planilha à esquerda para analisar o diagnóstico ou importar novos dados reais.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: IMPORTAR PLANILHA */}
          {activeTab === 1 && (
            <div className="space-y-4">
              <SimpleSpreadsheetImporter
                onImported={async (dataset) => {
                  const records = await dataSourceManager.getActiveRecords();
                  onDataLoaded(records, dataset.sourceName);
                  setActiveTab(0); // Redirect to Fontes de Dados
                  refreshDataSource();
                }}
                onCancel={() => {
                  setActiveTab(0);
                  refreshDataSource();
                }}
              />
            </div>
          )}

          {/* TAB 2: BANCOS DE DADOS */}
          {activeTab === 2 && (
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-850 dark:text-slate-100 flex items-center gap-2">
                  <Server size={20} className="text-blue-500" />
                  Conexão ao Banco de Dados do Cliente (Read-Only)
                </h3>
                <p className="text-slate-400 text-xs mt-1">Integre o banco de faturamento legado do cliente e extraia de forma automatizada tabelas de lançamentos.</p>
              </div>

              <div className="border border-slate-100 dark:border-slate-800 rounded-2xl p-2 bg-slate-50/50 dark:bg-slate-900/30">
                <DatabaseConnector onDataLoaded={onDataLoaded} currentSource={currentSource} />
              </div>
            </div>
          )}

          {/* TAB 3: VPN / SEGURANÇA */}
          {activeTab === 3 && (
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-lg font-black text-slate-850 dark:text-slate-100 flex items-center gap-2">
                    <Network size={20} className="text-blue-500" />
                    VPN Gateway Corporativo
                  </h3>
                  <p className="text-slate-400 text-xs mt-1">Conecte o Sauron OS em sub-redes Docker isoladas, garantindo leitura segura.</p>
                </div>
                <button
                  onClick={() => setIsVpnAdding(!isVpnAdding)}
                  className="px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 dark:text-blue-400 font-extrabold text-[10px] uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                >
                  {isVpnAdding ? "Cancelar Cadastro" : "+ Nova VPN"}
                </button>
              </div>

              {isVpnAdding && (
                <form onSubmit={handleAddVpn} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-5">
                  <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300">Cadastrar Nova VPN Criptografada</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-550 block">Apelido do Canal de Rede</label>
                      <input required value={newVpnName} onChange={e => setNewVpnName(e.target.value)} className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 font-semibold focus:outline-none" placeholder="ex: Banco Central Real" />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-550 block">Protocolo de Comunicação</label>
                      <select value={newVpnType} onChange={e => setNewVpnType(e.target.value as any)} className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 font-semibold focus:outline-none">
                        <option value="openvpn">OpenVPN (.ovpn file config)</option>
                        <option value="wireguard">WireGuard Protocol (Peer configuration)</option>
                        <option value="ipsec">IPsec tunnel client (Pre-shared Key)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-550 block">Usuário de Autenticação (Opcional)</label>
                      <input value={newVpnUser} onChange={e => setNewVpnUser(e.target.value)} className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200" placeholder="Username" />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-550 block">Senha / Token OTP (Opcional)</label>
                      <input type="password" value={newVpnPass} onChange={e => setNewVpnPass(e.target.value)} className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200" placeholder="••••••••" />
                    </div>
                    <div className="md:col-span-2 space-y-1">
                      <label className="font-bold text-slate-550 block">Conteúdo do Arquivo de Configuração (.ovpn / wg0.conf)</label>
                      <textarea value={newVpnContent} onChange={e => setNewVpnContent(e.target.value)} className="w-full h-24 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 font-mono text-[11px]" placeholder="client&#10;dev tun&#10;proto udp&#10;remote vpn.client.com 1194" />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase rounded hover:shadow cursor-pointer">
                      Registrar VPN
                    </button>
                  </div>
                </form>
              )}

              {/* VPN Tunnel List Grid */}
              <div className="space-y-4">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Túneis Privados Registrados</span>
                
                {vpnConfigs.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs font-semibold">Nenhum túnel VPN parametrizado para este cliente ainda.</div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {vpnConfigs.map((vpn) => {
                      const isConnecting = vpn.status === "connecting";
                      const isConnected = vpn.status === "connected";
                      return (
                        <div key={vpn.id} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between gap-4 shadow-sm">
                          <div className="flex justify-between items-start min-w-0">
                            <div>
                              <p className="font-black text-slate-800 dark:text-slate-100 text-sm truncate">{vpn.clientName}</p>
                              <p className="text-[10px] font-mono font-bold text-slate-400 mt-0.5 uppercase">{vpn.vpnType} Client</p>
                            </div>
                            <span className={`px-2.5 py-0.5 rounded text-[8px] font-mono font-black tracking-wider uppercase ${
                              isConnected ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400" :
                              isConnecting ? "bg-amber-100 text-amber-800 dark:bg-amber-955/40 dark:text-amber-400 animate-pulse" :
                              "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                            }`}>
                              {vpn.status}
                            </span>
                          </div>

                          {vpn.containerId && (
                            <div className="text-[10px] bg-slate-100 dark:bg-slate-950 p-2 rounded-lg font-mono text-slate-500 flex justify-between items-center">
                              <span>Docker PID: <strong className="text-slate-700 dark:text-slate-300">{vpn.containerId}</strong></span>
                              <span className="text-[8px] bg-emerald-500/20 text-emerald-600 font-bold px-1.5 py-0.5 rounded uppercase">Isolated</span>
                            </div>
                          )}

                          <div className="flex gap-2 justify-end">
                            {isConnected && (
                              <button
                                onClick={() => handleTestVpnDb(vpn.id)}
                                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-[9px] uppercase tracking-wide rounded-lg cursor-pointer"
                              >
                                Testar DB Ping
                              </button>
                            )}
                            
                            <button
                              onClick={() => handleToggleVpn(vpn.id, vpn.status)}
                              className={`px-3 py-1.5 text-white font-black text-[9px] uppercase tracking-wider rounded-lg flex items-center gap-1 cursor-pointer transition-colors ${
                                isConnected ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"
                              }`}
                            >
                              {isConnected ? <StopCircle size={11} /> : <Play size={11} />}
                              {isConnected ? "Desconectar" : "Ativar Túnel"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Terminal Logs */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-950 text-slate-100 space-y-2 shadow-inner">
                <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  <span className="flex items-center gap-1.5"><Server size={12} /> Log de Eventos do Container VPN</span>
                  <span className="text-blue-400 font-mono">tun0 status: active</span>
                </div>
                <div className="h-28 overflow-y-auto font-mono text-[10px] space-y-1.5 px-1 opacity-90 custom-scrollbar">
                  {vpnLogLines.length === 0 ? (
                    <p className="text-slate-500 italic">[Sem atividades na fila. Conecte uma VPN para iniciar a visualização.]</p>
                  ) : (
                    vpnLogLines.map((ln, idx) => (
                      <p key={idx} className="leading-relaxed hover:bg-white/5 p-0.5 rounded">{ln}</p>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FILTROS DO CLIENTE */}
          {activeTab === 4 && (
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-850 dark:text-slate-100 flex items-center gap-2">
                  <Filter size={20} className="text-blue-500" />
                  Mapeador de Filtros Executivos do Cliente
                </h3>
                <p className="text-slate-400 text-xs mt-1 font-semibold">Customize quais colunas da planilha ou banco de dados serão exibidas como filtros no painel lateral do Dashboard.</p>
              </div>

              {/* Table of active filters */}
              <div className="border border-slate-200 dark:border-slate-805 rounded-xl overflow-x-auto shadow-2xs">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Coluna Original</th>
                      <th className="px-4 py-3">Rótulo Amigável</th>
                      <th className="px-4 py-3">Tipo Seletor</th>
                      <th className="px-4 py-3">Visibilidade</th>
                      <th className="px-4 py-3 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-900 font-semibold text-slate-700 dark:text-slate-300">
                    {visibleFilterConfigs.map((cfg) => (
                      <tr key={cfg.column} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                        <td className="px-4 py-3 font-mono text-[11px] text-blue-500">{cfg.column}</td>
                        <td className="px-4 py-3 font-bold text-slate-850 dark:text-white">{cfg.label}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 uppercase font-bold">
                            {cfg.type}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            cfg.scope === "manager" ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40" :
                            cfg.scope === "consultant" ? "bg-rose-100 text-rose-800 dark:bg-rose-950/40" :
                            "bg-blue-100 text-blue-800 dark:bg-blue-950/40"
                          }`}>
                            {cfg.scope}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => {
                              const next = clientFilterConfigs.filter(f => f.column !== cfg.column);
                              setClientFilterConfigs(next);
                              localStorage.setItem("sauron_client_filters", JSON.stringify(next));
                              alert("Filtro removido!");
                            }}
                            className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {visibleFilterConfigs.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                          Nenhum filtro parametrizado ainda. Adicione filtros usando o painel abaixo.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Builder Form */}
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-4 shadow-3xs">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Adicionar Filtro Dinâmico</span>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs font-semibold">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-450 block uppercase">Coluna Origem</label>
                    <select
                      id="new-filter-col"
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-805 rounded px-2.5 py-1.5 text-slate-800 dark:text-slate-200 font-semibold"
                    >
                      {Object.keys(dataOrigem[0] || {}).filter(k => k !== "id" && !k.startsWith("__") && !k.includes("EMPTY")).map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-450 block uppercase">Nome Amigável (Label)</label>
                    <input
                      id="new-filter-label"
                      type="text"
                      placeholder="Ex: Holding Grupo"
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-805 rounded px-2.5 py-1.5 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-450 block uppercase">Modo Seleção</label>
                    <select
                      id="new-filter-type"
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-805 rounded px-2.5 py-1.5 text-slate-800 dark:text-slate-200 font-semibold"
                    >
                      <option value="multi">Multi-seleção estendida</option>
                      <option value="list">Lista simples suspensa</option>
                      <option value="date">Seletor de Competência (Data)</option>
                      <option value="range">Range de Valores (Numérico)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-450 block uppercase">Visibilidade</label>
                    <select
                      id="new-filter-scope"
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-805 rounded px-2.5 py-1.5 text-slate-800 dark:text-slate-200 font-semibold"
                    >
                      <option value="standard">Público Geral</option>
                      <option value="manager">Diretoria / CFO</option>
                      <option value="consultant">Oculto (Consultor)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <p className="text-[10px] text-slate-400 italic">
                    * Filtros extras alimentam o Dashboard automaticamente após salvar.
                  </p>
                  <button
                    onClick={() => {
                      const colEl = document.getElementById("new-filter-col") as HTMLSelectElement;
                      const labelEl = document.getElementById("new-filter-label") as HTMLInputElement;
                      const typeEl = document.getElementById("new-filter-type") as HTMLSelectElement;
                      const scopeEl = document.getElementById("new-filter-scope") as HTMLSelectElement;
                      
                      if (!colEl || !colEl.value) {
                        alert("Por favor, selecione uma coluna válida.");
                        return;
                      }
                      
                      const col = colEl.value;
                      const label = labelEl.value || col;
                      const type = typeEl.value;
                      const scope = scopeEl.value;
                      
                      if (clientFilterConfigs.some(f => f.column === col)) {
                        alert(`Já existe um filtro configurado para a coluna '${col}'.`);
                        return;
                      }
                      
                      const updatedFilters = [
                        ...clientFilterConfigs,
                        { column: col, label, active: true, type, scope }
                      ];
                      
                      setClientFilterConfigs(updatedFilters);
                      localStorage.setItem("sauron_client_filters", JSON.stringify(updatedFilters));
                      
                      if (labelEl) labelEl.value = "";
                      alert(`Filtro para a coluna '${col}' registrado com sucesso!`);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[11px] uppercase rounded-lg flex items-center gap-1.5 hover:shadow-sm transition-colors cursor-pointer"
                  >
                    <Plus size={14} />
                    Adicionar Filtro ao Painel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PERMISSÕES */}
          {activeTab === 5 && (
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-850 dark:text-slate-100 flex items-center gap-2">
                  <Lock size={20} className="text-blue-500" />
                  Governança e Níveis de Acesso (Perfis / Roles)
                </h3>
                <p className="text-slate-400 text-xs mt-1 font-semibold">Defina o nível de governança, visualização de telas e permissão de exportações para cada papel corporativo do cliente.</p>
              </div>

              {/* Permissions list matrix */}
              <div className="space-y-4">
                {rolesPermissions.map((rp, i) => (
                  <div key={rp.role} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs font-semibold">
                    <div>
                      <p className="font-extrabold text-slate-850 dark:text-white text-sm tracking-tight">{rp.role}</p>
                      <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                        Seções visíveis: <strong className="text-slate-600 dark:text-slate-300">{rp.screens.join(", ")}</strong>
                      </p>
                    </div>

                    <div className="flex gap-4 items-center">
                      <label className="flex items-center gap-1.5 cursor-pointer select-none">
                        <input 
                          type="checkbox" 
                          checked={rp.mixApprovedData} 
                          onChange={() => {
                            const newRp = [...rolesPermissions];
                            newRp[i].mixApprovedData = !newRp[i].mixApprovedData;
                            setRolesPermissions(newRp);
                          }}
                          className="rounded border-slate-350 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                        />
                        <span className="text-slate-600 dark:text-slate-300">Aprovar Combined Source</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer select-none">
                        <input 
                          type="checkbox" 
                          checked={rp.canExport} 
                          onChange={() => {
                            const newRp = [...rolesPermissions];
                            newRp[i].canExport = !newRp[i].canExport;
                            setRolesPermissions(newRp);
                          }}
                          className="rounded border-slate-350 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                        />
                        <span className="text-slate-600 dark:text-slate-300">Exportar Relatórios</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              {/* Non-blocking Actions Row */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-150 dark:border-slate-850">
                <button
                  onClick={() => setActiveTab(0)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Voltar à Central
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRestorePermissions}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    Restaurar Padrão
                  </button>
                  <button
                    onClick={handleSavePermissions}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider rounded-lg shadow cursor-pointer transition-all"
                  >
                    Salvar Permissões
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 6: HISTÓRICO & AUDITORIA */}
          {activeTab === 6 && (
            <div className="space-y-6">
              
              {/* Snapshot history list */}
              <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                <div>
                  <h3 className="text-lg font-black text-slate-850 dark:text-slate-100 flex items-center gap-2">
                    <FileText size={20} className="text-blue-500" />
                    Histórico de Snapshots Contábeis
                  </h3>
                  <p className="text-slate-400 text-xs mt-1">Veja ou apague congelamentos manuais de relatórios arquivados no servidor local.</p>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-900 border border-slate-150 dark:border-slate-805 rounded-xl overflow-hidden shadow-xs bg-white dark:bg-slate-950">
                  {auditLogs.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs italic">Nenhum evento registrado no histórico ainda.</div>
                  ) : (
                    auditLogs.filter(log => log.type === "SNAPSHOT_CREATED" || log.type?.includes("SNAP")).map((log: any) => (
                      <div key={log.id} className="p-3.5 flex justify-between items-center text-xs font-semibold">
                        <div>
                          <p className="font-bold text-slate-850 dark:text-white">{log.message}</p>
                          <p className="text-[9.5px] text-slate-400 mt-0.5">{new Date(log.timestamp).toLocaleString()}</p>
                        </div>
                        <span className="bg-blue-100 text-blue-800 dark:bg-blue-950 text-[10px] px-2 py-0.5 rounded font-bold font-mono">
                          SNAPSHOT
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Complete Audit and security logs */}
              <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                <div>
                  <h3 className="text-lg font-black text-slate-850 dark:text-slate-100 flex items-center gap-2">
                    <Shield size={20} className="text-blue-500" />
                    Trilha de Auditoria Geral (Audit Log)
                  </h3>
                  <p className="text-slate-400 text-xs mt-1">Registros automáticos de segurança e integridade de dados exigidos pelas normas B2B.</p>
                </div>

                <div className="divide-y divide-slate-150 dark:divide-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-80 overflow-y-auto shadow-2xs">
                  {auditLogs.map((log: any) => {
                    const sevColors: Record<string, string> = {
                      CRITICAL: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-450",
                      WARNING: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-450",
                      INFO: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    };

                    return (
                      <div key={log.id} className="p-3 flex justify-between items-start gap-4 text-xs hover:bg-slate-50/20 dark:hover:bg-slate-900/10 transition-colors">
                        <div className="min-w-0 flex-1">
                          <p className="font-mono text-[9px] text-slate-400">{new Date(log.timestamp).toLocaleString()}</p>
                          <p className="font-bold text-slate-750 dark:text-slate-200 mt-1 leading-relaxed">{log.message}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[8.5px] font-mono font-black shrink-0 uppercase ${sevColors[log.severity] || sevColors.INFO}`}>
                          {log.severity || "INFO"}
                        </span>
                      </div>
                    );
                  })}
                  {auditLogs.length === 0 && (
                    <div className="p-8 text-center text-slate-400 text-xs italic">Nenhum evento registrado nos logs de segurança ainda.</div>
                  )}
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
};
