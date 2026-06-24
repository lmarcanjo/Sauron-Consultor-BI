import React, { useState, useEffect, useMemo } from "react";
import { 
  Database, Shield, Network, FileSpreadsheet, Shuffle, Filter, Lock, 
  CheckCircle, RefreshCw, Plus, Play, StopCircle, Trash2, Eye, Server, 
  ChevronRight, ChevronLeft, Key, UserCheck, ShieldAlert, FileText, AlertTriangle, 
  HelpCircle, Send, ClipboardCheck, ArrowUpRight, ArrowDownRight, Settings2, BarChart3, DatabaseZap
} from "lucide-react";
import { LancamentoFinanceiro, FiltrosDashboard } from "../types";
import { DatabaseConnector } from "./DatabaseConnector";
import { useDataSourceManager } from "../hooks/useDataSourceManager";
import { SpreadsheetWorkspaceManager } from "../services/spreadsheetWorkspaceManager";

interface CentralDadosTabProps {
  dataOrigem: LancamentoFinanceiro[];
  onDataLoaded: (data: LancamentoFinanceiro[], sourceName: string) => void;
  currentSource: string;
  camposAusentes: string[];
  filtros?: FiltrosDashboard;
  visibleFilters?: string[];
  fieldMappings?: Record<string, string>;
}

export const CentralDadosTab: React.FC<CentralDadosTabProps> = ({
  dataOrigem,
  onDataLoaded,
  currentSource,
  camposAusentes,
  filtros = { grupos: [], cnpjs: [], marcas: [], meses: [], razoes: [] },
  visibleFilters = [],
  fieldMappings = {},
}) => {
  // Main 10-step tab layout state
  const [activeTab, setActiveTab] = useState<number>(0);
  const steps = [
    { title: "Cliente", desc: "Perfil e Segmento" },
    { title: "VPN", desc: "Túneis de Conexão" },
    { title: "Banco", desc: "Config do Cliente" },
    { title: "Planilhas", desc: "Upload & Abas" },
    { title: "Mapeamento", desc: "Schema Mapping" },
    { title: "Filtros do Cliente", desc: "Config de Variáveis" },
    { title: "Permissões", desc: "Níveis de Acesso" },
    { title: "Validação", desc: "Integridade de Dados" },
    { title: "Sincronização", desc: "Carga de Dados" },
    { title: "Auditoria", desc: "Log de Rastreabilidade" }
  ];

  // 1. Cliente State
  const [clientProfile, setClientProfile] = useState({
    name: "Grupo Topázio Corporativo",
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

  // 4. Planilhas State
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([
    { id: "f1", name: "consolidado_financeiro_topazio_fiat.xlsx", size: 1845120, sheets: ["Faturamento", "Custos_Operacionais", "Layout_DRE"], date: "2026-06-23" },
    { id: "f2", name: "faturamento_vendas_jeep.csv", size: 345000, sheets: ["Default_Sheet"], date: "2026-06-22" }
  ]);
  const [selectedFileId, setSelectedFileId] = useState<string>("f1");
  const [activeSheetName, setActiveSheetName] = useState<string>("Faturamento");
  const [dragActive, setDragActive] = useState<boolean>(false);

  // Spreadsheet Beta custom states
  const [showConsolidator, setShowConsolidator] = useState<boolean>(false);
  const [selectedFilesForConsolidation, setSelectedFilesForConsolidation] = useState<string[]>([]);
  const [consolidatedFileName, setConsolidatedFileName] = useState<string>("Consolidado Geral Q2");
  const [compareVersion1, setCompareVersion1] = useState<string>("");
  const [compareVersion2, setCompareVersion2] = useState<string>("");
  const [showComparer, setShowComparer] = useState<boolean>(false);

  // 5. Schema Mapping State
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
    approveSource,
    rejectSource,
    workspace
  } = useDataSourceManager();

  const handleReplaceFileSim = (fileId: string, fileName: string) => {
    const confirmReplace = confirm(`Deseja substituir o arquivo '${fileName}' por uma nova versão?`);
    if (!confirmReplace) return;

    const data = [
      { Grupo: "Grupo Alfa S/A", CNPJ: "12.345.678/0001-90", Marca: "Alfa Fiat", Empresa: "Alfa Filial 1", Mês: "2026-06", Razão: "Faturamento Vendas", Categoria: "Receita Operacional", Receita: Math.floor(Math.random() * 60000) + 20000, Custo: 11000, Despesa: 4000, Lucro: 15000, Margem: 42, Vendedor: "Carlos" }
    ];

    const newFileId = `sim_file_${Date.now()}`;
    const newFile = {
      id: newFileId,
      fileName: fileName,
      importedAt: new Date().toISOString(),
      importedBy: "Lennon Marcanjo",
      status: "PENDING_VALIDATION" as const,
      sheets: [
        {
          id: `sheet_${Date.now()}`,
          fileId: newFileId,
          sheetName: "Dados Vendas Atualizados",
          rows: data,
          columns: [
            { name: "Grupo", type: "string", hasEmptyValues: false },
            { name: "Receita", type: "number", hasEmptyValues: false },
            { name: "Mês", type: "string", hasEmptyValues: false }
          ]
        }
      ],
      totalRows: data.length,
      totalColumns: 13
    };

    SpreadsheetWorkspaceManager.substituirPlanilha(fileId, newFile);
    setSelectedFileId(newFileId);
    alert(`Arquivo substituído! Uma nova versão (incrementada) foi gerada e a versão anterior foi arquivada como INACTIVE.`);
  };

  const internalActiveDataSource = activeDataSource;
  const approveMixedData = approvedByConsultant;
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Compute visible files list dynamically
  const visibleFilesList = useMemo(() => {
    if (activeDataSource === "DEMO_DATA") {
      return uploadedFiles.map(f => ({
        ...f,
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
      // Include all files to let the developer manage them and keep history
      return workspaceFiles;
    }
  }, [activeDataSource, uploadedFiles, workspace]);

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
        return recordKeys.has(colLower) && !colLower.includes("topazio") && !colLower.includes("topázio");
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

  // Data anomalies calculation
  const lucroInconsistente = dataOrigem.filter(
    (d) => Math.abs((d.Receita - d.Custo - d.Despesa) - d.Lucro) > 2
  );
  const margemInconsistente = dataOrigem.filter(
    (d) => d.Receita > 0 && Math.abs((d.Lucro / d.Receita) * 100 - d.Margem) > 1
  );
  const zeroValues = dataOrigem.filter(d => !d.Receita && !d.Custo && !d.Despesa);

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
              <h1 className="text-xl font-black tracking-tight uppercase">Central de Conexões e Dados</h1>
            </div>
            <p className="text-slate-400 text-xs mt-2 max-w-2xl leading-relaxed">
              Consolidador Corporativo e VPN Gateway de segurança. Administre e sincronize bancos de dados legados do cliente, planilhas multidimensionais, mapeamentos, filtros corporativos e regras de governança de faturamento.
            </p>
          </div>

          <div className="bg-slate-800/60 border border-slate-700 p-4 rounded-2xl min-w-[240px] flex flex-col gap-2 shadow-inner">
            <div>
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Modo de Origem Ativo</span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`w-2 h-2 rounded-full ${internalActiveDataSource !== "DEMO_DATA" ? "bg-emerald-500 animate-pulse" : "bg-blue-400"}`}></span>
                <span className="text-xs font-extrabold text-blue-400 tracking-wide font-mono">{internalActiveDataSource}</span>
              </div>
            </div>
            <div className="h-px bg-slate-700/60 my-1"></div>
            <div className="flex items-center justify-between text-[11px] font-medium text-slate-300">
              <span>Registros Ativos:</span>
              <span className="text-emerald-400 font-bold font-mono">{dataOrigem.length.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-medium text-slate-300">
              <span>Canal Selecionado:</span>
              <span className="text-slate-200 truncate max-w-[120px] font-semibold">{currentSource || "Nenhum carregado"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 9-Steps/Tabs Interactive Timeline & Selection */}
      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Left Side: Navigation Links & Step Check Status */}
        <div className="w-full md:w-64 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shrink-0 flex flex-col gap-1 shadow-sm">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3 px-2 flex justify-between items-center">
            <span>Roteiro de Integração</span>
            <span className="text-blue-500 font-mono font-black">{activeTab + 1}/{steps.length}</span>
          </div>
          
          {steps.map((st, i) => {
            const isCompleted = i < activeTab;
            const isActive = i === activeTab;
            return (
              <button
                key={i}
                onClick={() => setActiveTab(i)}
                className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer flex items-center justify-between text-xs ${
                  isActive 
                    ? "bg-blue-600 text-white font-extrabold shadow-md transform scale-[1.02]" 
                    : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                }`}
              >
                <div className="min-w-0 pr-1">
                  <p className="font-extrabold truncate uppercase tracking-tight">{st.title}</p>
                  <p className={`text-[10px] truncate ${isActive ? "text-blue-100 font-medium" : "text-slate-400"}`}>{st.desc}</p>
                </div>
                {isCompleted ? (
                  <CheckCircle size={15} className="text-emerald-500 shrink-0 ml-1" />
                ) : (
                  <span className={`text-[10px] font-mono font-bold shrink-0 ml-1 ${isActive ? "text-blue-200" : "text-slate-400"}`}>0{i + 1}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Side: Tab Panel Content (Bento Style panels) */}
        <div className="flex-1 min-w-0">
          
          {/* TAB 1: CLIENTE */}
          {activeTab === 0 && (
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-850 dark:text-slate-100 flex items-center gap-2">
                  <UserCheck size={20} className="text-blue-500" />
                  Perfil Geral do Cliente Corporativo
                </h3>
                <p className="text-slate-400 text-xs mt-1">Configure o apelido, dados para contato do cliente e segmento comercial para sugestões inteligentes.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1 text-xs">
                  <label className="block font-black text-slate-400 uppercase tracking-widest text-[9px]">Empresa / Holding Parceira</label>
                  <input 
                    type="text" 
                    value={clientProfile.name}
                    onChange={e => setClientProfile({ ...clientProfile, name: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 font-bold focus:outline-none focus:border-blue-500"
                    placeholder="Grupo Topázio Corporativo"
                  />
                </div>

                <div className="space-y-1 text-xs">
                  <label className="block font-black text-slate-400 uppercase tracking-widest text-[9px]">Segmento de Atuação</label>
                  <select 
                    value={clientProfile.segment}
                    onChange={e => setClientProfile({ ...clientProfile, segment: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 font-bold focus:outline-none focus:border-blue-500"
                  >
                    <option value="automotivo">Automotivo (Veículos Novos & Seminovos)</option>
                    <option value="agro">Agrobusiness (Produção, Grãos, Silos)</option>
                    <option value="servicos">Serviços Corporativos & BI</option>
                    <option value="industria">Industrial & Manufatura</option>
                    <option value="geral">Varejo Geral (Consumo Massivo)</option>
                  </select>
                </div>

                <div className="space-y-1 text-xs">
                  <label className="block font-black text-slate-400 uppercase tracking-widest text-[9px]">Consultor Responsável</label>
                  <input 
                    type="text" 
                    value={clientProfile.consultant}
                    onChange={e => setClientProfile({ ...clientProfile, consultant: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1 text-xs">
                  <label className="block font-black text-slate-400 uppercase tracking-widest text-[9px]">E-mail para Alertas</label>
                  <input 
                    type="email" 
                    value={clientProfile.email}
                    onChange={e => setClientProfile({ ...clientProfile, email: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="md:col-span-2 space-y-1 text-xs">
                  <label className="block font-black text-slate-400 uppercase tracking-widest text-[9px]">Notas de Planejamento do Consultor</label>
                  <textarea 
                    value={clientProfile.notes}
                    onChange={e => setClientProfile({ ...clientProfile, notes: e.target.value })}
                    className="w-full h-24 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 leading-relaxed font-serif text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Segment intelligence card suggestion */}
              <div className="p-4 bg-orange-50/50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-950 rounded-xl flex gap-3 text-xs text-orange-900 dark:text-orange-300">
                <ShieldAlert className="shrink-0 text-orange-500 mt-0.5" size={18} />
                <div>
                  <strong className="font-extrabold uppercase text-[10px] tracking-wide block">Regras e Recomendações Automáticas do Segmento</strong>
                  <p className="mt-1 opacity-90 leading-relaxed">
                    {clientProfile.segment === "automotivo" && "Adote foco em análise de receita de novos vs seminovos. Estude de forma prioritária a margem bruta contábil e a parametrização de comissões, incluindo taxas e bônus de agentes financeiros cadastrados."}
                    {clientProfile.segment === "agro" && "Configure comissões com base em sacras e prazos agrícolas sazonais. O faturamento e os custos de hedge e transporte devem acompanhar o mapeamento de contas."}
                    {clientProfile.segment === "servicos" && "Avalie KPIs de recorrência (SaaS) e margem líquida de horas-consultas faturadas. O mapeamento do centro de custo é altamente relevante para alocação de despesas."}
                    {clientProfile.segment === "industria" && "Mapeie detalhadamente custos de insumos (matérias-primas). Analise o lucro bruto industrial por planta fabril."}
                    {clientProfile.segment === "geral" && "Configurações gerais de faturamento contábil tradicional, incluindo análise simplificada de margens por filial."}
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSaveProfile}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow cursor-pointer transition-all"
                >
                  Gravar Perfil de Execução
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: VPN SETTINGS */}
          {activeTab === 1 && (
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-lg font-black text-slate-850 dark:text-slate-100 flex items-center gap-2">
                    <Network size={20} className="text-blue-500" />
                    Sauron VPN Gateway
                  </h3>
                  <p className="text-slate-400 text-xs mt-1">Conecte o Sauron OS em sub-redes Docker isoladas, forçando comunicação segura somente leitura.</p>
                </div>
                <button
                  onClick={() => setIsVpnAdding(!isVpnAdding)}
                  className="px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 dark:text-blue-400 font-extrabold text-[10px] uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                >
                  {isVpnAdding ? "Cancelar Cadastro" : "+ Nova VPN de Cliente"}
                </button>
              </div>

              {isVpnAdding && (
                <form onSubmit={handleAddVpn} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-5">
                  <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300">Cadastrar Nova VPN Criptografada</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-550 block">Apelido do Canal de Rede</label>
                      <input required value={newVpnName} onChange={e => setNewVpnName(e.target.value)} className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 font-semibold focus:outline-none" placeholder="ex: Banco Central Topázio FIAT" />
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
                      Registrar e Isolador VPN
                    </button>
                  </div>
                </form>
              )}

              {/* VPN Tunnel List Grid */}
              <div className="space-y-4">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Túneis Privados Registrados</span>
                
                {vpnConfigs.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs">Nenhum túnel VPN parametrizado para este cliente ainda.</div>
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

              {/* Real-time VPN Terminal Logs */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-950 text-slate-100 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  <span className="flex items-center gap-1.5"><Server size={12} /> Log de Eventos do Container VPN</span>
                  <span className="text-blue-400">tun0 status: active</span>
                </div>
                <div className="h-28 overflow-y-auto font-mono text-[10px] space-y-1.5 px-1 opacity-90 custom-scrollbar">
                  {vpnLogLines.length === 0 ? (
                    <p className="text-slate-500 italic">[Sem atividades na fila do container. Conecte uma VPN para ver registros em tempo real.]</p>
                  ) : (
                    vpnLogLines.map((ln, idx) => (
                      <p key={idx} className="leading-relaxed hover:bg-white/5 p-0.5 rounded">{ln}</p>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BANCO DE DADOS */}
          {activeTab === 2 && (
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-850 dark:text-slate-100 flex items-center gap-2">
                  <Server size={20} className="text-blue-500" />
                  Conexão ao Banco de Dados do Cliente (Read-Only)
                </h3>
                <p className="text-slate-400 text-xs mt-1">Conecte o banco de faturamento legado do cliente e extraia de forma automatizada tabelas de lançamentos para consolidação.</p>
              </div>

              <div className="border border-slate-100 dark:border-slate-800 rounded-2xl p-2 bg-slate-50/50 dark:bg-slate-900/30">
                <DatabaseConnector onDataLoaded={onDataLoaded} currentSource={currentSource} />
              </div>
            </div>
          )}

          {/* TAB 4: PLANILHAS */}
          {activeTab === 3 && (
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6" id="spreadsheet-workspace-dashboard">
              
              {/* Toolbar header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-900 pb-5">
                <div>
                  <h3 className="text-lg font-black text-slate-850 dark:text-slate-100 flex items-center gap-2">
                    <FileSpreadsheet size={22} className="text-emerald-500" />
                    Gerenciador de Workspace de Planilhas (Sprint Beta)
                  </h3>
                  <p className="text-slate-400 text-xs mt-1">
                    Garantia de conformidade, linhagem estrita, score de confiança e versionamento integrado para governança de relatórios.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      setShowConsolidator(!showConsolidator);
                      setShowComparer(false);
                    }}
                    className={`px-3 py-1.5 text-xs font-bold uppercase rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                      showConsolidator 
                        ? "bg-purple-600 border-purple-600 text-white" 
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-350 text-slate-700 dark:text-slate-350 bg-white dark:bg-slate-900"
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
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-350 text-slate-700 dark:text-slate-350 bg-white dark:bg-slate-900"
                    }`}
                  >
                    <Settings2 size={14} />
                    Comparar Versões
                  </button>
                  <button
                    onClick={() => {
                      // Trigger clean simulation import
                      const name = prompt("Digite o nome do arquivo para simular a importação (ex: faturamento_mensal.xlsx):", "vendas_junho_2026.xlsx");
                      if (name) {
                        const fileId = `sim_file_${Date.now()}`;
                        const mockRows = [
                          { Grupo: "Grupo Alfa S/A", CNPJ: "12.345.678/0001-90", Marca: "Alfa Fiat", Empresa: "Alfa Filial 1", Mês: "2026-06", Razão: "Faturamento Vendas", Categoria: "Receita", Receita: Math.floor(Math.random() * 50000) + 15000, Custo: 10000, Despesa: 3000, Lucro: 12000, Margem: 40, Vendedor: "Carlos" },
                          { Grupo: "Grupo Alfa S/A", CNPJ: "12.345.678/0001-90", Marca: "Alfa Fiat", Empresa: "Alfa Filial 1", Mês: "2026-06", Razão: "Faturamento Vendas", Categoria: "Receita", Receita: Math.floor(Math.random() * 40000) + 10000, Custo: 8000, Despesa: 2000, Lucro: 10000, Margem: 38, Vendedor: "Julia" }
                        ];
                        const mockFile = {
                          id: fileId,
                          fileName: name,
                          importedAt: new Date().toISOString(),
                          importedBy: "Lennon Marcanjo",
                          status: "PENDING_VALIDATION" as const,
                          sheets: [
                            {
                              id: `sheet_${Date.now()}`,
                              fileId: fileId,
                              sheetName: "Faturamento Geral",
                              rows: mockRows,
                              columns: [
                                { name: "Grupo", type: "string", hasEmptyValues: false },
                                { name: "Receita", type: "number", hasEmptyValues: false },
                                { name: "Mês", type: "string", hasEmptyValues: false }
                              ]
                            }
                          ],
                          totalRows: mockRows.length,
                          totalColumns: 13
                        };
                        SpreadsheetWorkspaceManager.importarPlanilha(mockFile, "APPEND");
                        setSelectedFileId(fileId);
                        setActiveSheetName("Faturamento Geral");
                        alert(`Arquivo '${name}' carregado com status PENDING_VALIDATION.`);
                      }
                    }}
                    className="px-3 py-1.5 text-xs font-bold uppercase rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer transition-colors flex items-center gap-1"
                  >
                    <Plus size={14} />
                    Simular Planilha
                  </button>
                </div>
              </div>

              {/* Version comparer panel */}
              {showComparer && (
                <div className="bg-blue-50/40 dark:bg-blue-950/10 border border-blue-200 dark:border-blue-900 rounded-xl p-4 space-y-4">
                  <h4 className="text-xs font-black text-blue-800 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Settings2 size={16} />
                    Comparador de Métricas e Versões
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase font-black text-slate-400 block mb-1">Planilha / Versão A</label>
                      <select 
                        value={compareVersion1} 
                        onChange={(e) => setCompareVersion1(e.target.value)}
                        className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5"
                      >
                        <option value="">Selecione...</option>
                        {visibleFilesList.map(f => (
                          <option key={f.id} value={f.id}>{f.name} ({f.version}) - {f.totalRows} Linhas</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-black text-slate-400 block mb-1">Planilha / Versão B</label>
                      <select 
                        value={compareVersion2} 
                        onChange={(e) => setCompareVersion2(e.target.value)}
                        className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5"
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
                          <p className={`text-[10px] font-black mt-1 ${
                            (visibleFilesList.find(f => f.id === compareVersion2)?.totalRows || 0) >= (visibleFilesList.find(f => f.id === compareVersion1)?.totalRows || 0) ? "text-emerald-500" : "text-rose-500"
                          }`}>
                            {((visibleFilesList.find(f => f.id === compareVersion2)?.totalRows || 0) - (visibleFilesList.find(f => f.id === compareVersion1)?.totalRows || 0)) >= 0 ? "+" : ""}
                            {(visibleFilesList.find(f => f.id === compareVersion2)?.totalRows || 0) - (visibleFilesList.find(f => f.id === compareVersion1)?.totalRows || 0)} díf
                          </p>
                        </div>
                        <div className="p-2 border border-slate-100 dark:border-slate-850 rounded-lg">
                          <p className="text-[9px] uppercase font-bold text-slate-400">Mês / Abas</p>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                            {visibleFilesList.find(f => f.id === compareVersion1)?.totalAbas} vs {visibleFilesList.find(f => f.id === compareVersion2)?.totalAbas}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1 font-semibold">Abas Totais</p>
                        </div>
                        <div className="p-2 border border-slate-100 dark:border-slate-850 rounded-lg">
                          <p className="text-[9px] uppercase font-bold text-slate-400">Score Qualidade</p>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                            {visibleFilesList.find(f => f.id === compareVersion1)?.qualityScore}% vs {visibleFilesList.find(f => f.id === compareVersion2)?.qualityScore}%
                          </p>
                          <p className={`text-[10px] font-black mt-1 ${
                            (visibleFilesList.find(f => f.id === compareVersion2)?.qualityScore || 0) >= (visibleFilesList.find(f => f.id === compareVersion1)?.qualityScore || 0) ? "text-emerald-500" : "text-rose-500"
                          }`}>
                            {(visibleFilesList.find(f => f.id === compareVersion2)?.qualityScore || 0) - (visibleFilesList.find(f => f.id === compareVersion1)?.qualityScore || 0)}% diff
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Consolidation panel */}
              {showConsolidator && (
                <div className="bg-purple-50/40 dark:bg-purple-950/10 border border-purple-200 dark:border-purple-900 rounded-xl p-4 space-y-4">
                  <h4 className="text-xs font-black text-purple-800 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Shuffle size={16} />
                    Painel Consolidador de Planilhas
                  </h4>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    Marque as planilhas do workspace para consolidá-las em um único arquivo virtual. Isto unirá os faturamentos de todas as abas.
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
                        <span className="font-bold">{f.name}</span> <span className="text-[10px] text-slate-400">({f.version}) | {f.totalRows} linhas</span>
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
                        className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5"
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
                        }
                      }}
                      className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-black uppercase rounded-lg transition-colors cursor-pointer"
                    >
                      Consolidar Agora
                    </button>
                  </div>
                </div>
              )}

              {/* Main Grid: Left Files List | Right File Panel */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left side: Files List */}
                <div className="lg:col-span-5 space-y-4">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Planilhas no Workspace</span>
                  <div className="border border-slate-200 dark:border-slate-850 rounded-xl divide-y divide-slate-100 dark:divide-slate-900 overflow-hidden bg-white dark:bg-slate-950">
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
                          className={`p-3 text-xs cursor-pointer transition-all ${
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
                                <p className="text-[9px] text-slate-400 mt-0.5">
                                  {f.totalRows} linhas | {f.totalAbas || 1} abas | {f.date}
                                </p>
                              </div>
                            </div>
                            
                            {/* Score & Badge */}
                            <div className="text-right shrink-0 flex flex-col items-end gap-1">
                              <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded-md border font-mono ${statusColors[f.status] || "bg-slate-100"}`}>
                                {f.status}
                              </span>
                              <span className={`text-[9px] font-black uppercase ${
                                f.qualityScore >= 90 ? "text-emerald-500" : f.qualityScore >= 70 ? "text-amber-500" : "text-rose-500"
                              }`}>
                                Confiança {f.qualityScore}%
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {visibleFilesList.length === 0 && (
                      <div className="p-6 text-xs text-center text-slate-400 italic">
                        Nenhuma planilha real carregada no workspace ainda.
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side: Detailed Workspace Pipeline Dashboard */}
                <div className="lg:col-span-7">
                  {selectedFileId && visibleFilesList.find(f => f.id === selectedFileId) ? (
                    (() => {
                      const file = visibleFilesList.find(f => f.id === selectedFileId)!;
                      const qualityReport = SpreadsheetWorkspaceManager.verQualidade(file.id) || { score: 100, label: "Excelente", report: [] };
                      
                      return (
                        <div className="bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-6">
                          
                          {/* File Details Title bar */}
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
                              {/* Toggle active state */}
                              <button
                                onClick={() => {
                                  if (file.status === "ACTIVE") {
                                    SpreadsheetWorkspaceManager.desativarPlanilha(file.id);
                                  } else {
                                    SpreadsheetWorkspaceManager.ativarPlanilha(file.id);
                                  }
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
                                onClick={() => handleReplaceFileSim(file.id, file.name)}
                                className="px-2.5 py-1 text-[10px] font-bold uppercase rounded border border-slate-250 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                              >
                                Substituir
                              </button>

                              <button
                                onClick={() => {
                                  if (confirm("Tem certeza que deseja excluir esta planilha?")) {
                                    SpreadsheetWorkspaceManager.excluirPlanilha(file.id);
                                    alert("Planilha excluída com sucesso.");
                                  }
                                }}
                                className="px-2 py-1 text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded transition-colors cursor-pointer"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>

                          {/* 1. Status Pipeline Stepper */}
                          <div className="space-y-3 bg-white dark:bg-slate-950 p-4 border border-slate-150 dark:border-slate-850 rounded-xl">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Status do Pipeline Regulatório</span>
                            <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold relative">
                              {[
                                { step: "PENDING_VALIDATION", label: "01. Validação", bg: "bg-amber-100 border-amber-300 text-amber-800" },
                                { step: "PENDING_MAPPING", label: "02. Mapeamento", bg: "bg-purple-100 border-purple-300 text-purple-800" },
                                { step: "PENDING_APPROVAL", label: "03. Aprovação", bg: "bg-blue-100 border-blue-300 text-blue-800" },
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
                            
                            {/* Pipeline Progression controls */}
                            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-900">
                              <p className="text-[10px] text-slate-400">
                                {file.approvedByConsultant 
                                  ? "🟢 APPROVED: Ativo e consumível por relatórios executivos." 
                                  : "⚠️ LOCKOUT: Bloqueado. Exige aprovação para alimentar os relatórios."}
                              </p>
                              <div className="flex items-center gap-1.5">
                                {file.status !== "ACTIVE" && (
                                  <button
                                    onClick={() => {
                                      SpreadsheetWorkspaceManager.avancarStatus(file.id);
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
                                      alert("Planilha aprovada com sucesso! Agora alimentará relatórios e dashboards.");
                                    }}
                                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase rounded transition-colors cursor-pointer"
                                  >
                                    Aprovar Planilha
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      SpreadsheetWorkspaceManager.reprovarPlanilha(file.id);
                                      alert("Planilha reprovada com sucesso. Seu status foi definido como ERROR e seus dados foram bloqueados.");
                                    }}
                                    className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black uppercase rounded transition-colors cursor-pointer"
                                  >
                                    Reprovar Planilha
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* 2. Score de Qualidade Details (Radial and Checklist) */}
                          <div className="bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl p-4 space-y-4">
                            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-900">
                              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Score de Qualidade de Dados (5 Pilares de Confiança)</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                file.qualityScore >= 90 ? "bg-emerald-100 text-emerald-800" : file.qualityScore >= 70 ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"
                              }`}>
                                {qualityReport.label} ({file.qualityScore}%)
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                              {/* Left score circle */}
                              <div className="col-span-1 md:col-span-2 flex flex-col items-center justify-center p-3 border border-slate-100 dark:border-slate-900 rounded-xl bg-slate-50/50 dark:bg-slate-900/10">
                                <span className={`text-3xl font-black ${
                                  file.qualityScore >= 90 ? "text-emerald-500" : file.qualityScore >= 70 ? "text-amber-500" : "text-rose-500"
                                }`}>
                                  {file.qualityScore}%
                                </span>
                                <span className="text-[9px] uppercase font-bold text-slate-400 mt-1">Nível de Confiança</span>
                              </div>

                              {/* Right checklist details */}
                              <div className="col-span-1 md:col-span-3 space-y-1.5 text-[9.5px]">
                                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                                  <CheckCircle size={12} className={qualityReport.report.some((r: string) => r.includes("cabeçalho")) ? "text-rose-500" : "text-emerald-500"} />
                                  <span>Cabeçalhos: {qualityReport.report.some((r: string) => r.includes("cabeçalho")) ? "Possui colunas vazias / '__EMPTY'" : "100% Identificados"}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                                  <CheckCircle size={12} className={qualityReport.report.some((r: string) => r.includes("vazias")) ? "text-rose-500" : "text-emerald-500"} />
                                  <span>Preenchimento: {qualityReport.report.some((r: string) => r.includes("vazias")) ? "Contém células vazias" : "Sem células vazias"}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                                  <CheckCircle size={12} className={qualityReport.report.some((r: string) => r.includes("datas")) ? "text-rose-500" : "text-emerald-500"} />
                                  <span>Temporalidade: {qualityReport.report.some((r: string) => r.includes("datas")) ? "Contém datas inválidas" : "Formato temporal em conformidade"}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                                  <CheckCircle size={12} className={qualityReport.report.some((r: string) => r.includes("valores")) ? "text-rose-500" : "text-emerald-500"} />
                                  <span>Tipos Financeiros: {qualityReport.report.some((r: string) => r.includes("valores")) ? "Tipagem inconsistente" : "Numéricos em conformidade"}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                                  <CheckCircle size={12} className={qualityReport.report.some((r: string) => r.includes("duplicadas")) ? "text-rose-500" : "text-emerald-500"} />
                                  <span>Duplicidades: {qualityReport.report.some((r: string) => r.includes("duplicadas")) ? "Possíveis duplicidades detectadas" : "Sem lançamentos idênticos"}</span>
                                </div>
                              </div>
                            </div>

                            {/* Detailed Report Logs if any */}
                            {qualityReport.report.length > 0 && (
                              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-2 rounded-lg max-h-24 overflow-y-auto font-mono text-[8.5px] leading-relaxed text-slate-500">
                                {qualityReport.report.map((line: string, i: number) => (
                                  <p key={i}>• {line}</p>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* 3. Data Lineage and Traceability sample */}
                          <div className="bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl p-4 space-y-4">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Auditoria de Rastreabilidade & Linhagem</span>
                            <div className="bg-slate-50 dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-850 space-y-2">
                              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Metadados de Linhagem da Primeira Linha:</p>
                              {(() => {
                                const rowsSample = file.sheetsData?.[0]?.rows || [];
                                const sample = rowsSample[0] || {};
                                return (
                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-[10px] font-mono">
                                    <div className="bg-white dark:bg-slate-950 p-1.5 border border-slate-100 dark:border-slate-900 rounded">
                                      <p className="text-[8px] text-slate-400">ARQUIVO ORIGEM</p>
                                      <p className="font-bold text-slate-700 dark:text-slate-300 truncate">{sample.arquivo || file.name}</p>
                                    </div>
                                    <div className="bg-white dark:bg-slate-950 p-1.5 border border-slate-100 dark:border-slate-900 rounded">
                                      <p className="text-[8px] text-slate-400">ABA/SHEET</p>
                                      <p className="font-bold text-slate-700 dark:text-slate-300 truncate">{sample.aba || "Faturamento"}</p>
                                    </div>
                                    <div className="bg-white dark:bg-slate-950 p-1.5 border border-slate-100 dark:border-slate-900 rounded">
                                      <p className="text-[8px] text-slate-400">Nº LINHA EXCEL</p>
                                      <p className="font-bold text-slate-700 dark:text-slate-300">{sample.linha || 2}</p>
                                    </div>
                                    <div className="bg-white dark:bg-slate-950 p-1.5 border border-slate-100 dark:border-slate-900 rounded col-span-2">
                                      <p className="text-[8px] text-slate-400">REGISTRO DE IMPORTAÇÃO</p>
                                      <p className="font-bold text-slate-700 dark:text-slate-300 truncate">{sample.dataImportacao || file.importedAt}</p>
                                    </div>
                                    <div className="bg-white dark:bg-slate-950 p-1.5 border border-slate-100 dark:border-slate-900 rounded">
                                      <p className="text-[8px] text-slate-400">OPERADOR AUTORIZADO</p>
                                      <p className="font-bold text-slate-700 dark:text-slate-300 truncate">{sample.usuario || file.importedBy}</p>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>

                        </div>
                      );
                    })()
                  ) : (
                    <div className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/10 text-slate-400 italic text-xs">
                      Selecione uma planilha real no workspace à esquerda para exibir o painel avançado do pipeline analítico, qualidade de score e histórico.
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}

          {/* TAB 5: SCHEMA MAPPING */}
          {activeTab === 4 && (
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-lg font-black text-slate-850 dark:text-slate-100 flex items-center gap-2">
                    <Shuffle size={20} className="text-blue-500" />
                    Mapeamento de Dados (Schema Mapping Panel)
                  </h3>
                  <p className="text-slate-400 text-xs mt-1">Conecte colunas livres da planilha ou banco às chaves corporativas padronizadas requeridas pelo hub do Sauron.</p>
                </div>
                <button
                  onClick={() => {
                    // Smart auto mapper
                    const autoMapped = {
                      Grupo: "Grupo_Corporativo",
                      CNPJ: "Chave_CNPJ",
                      Marca: "Bandeira",
                      Empresa: "Filial_Empresa",
                      Mês: "Data_Referencia",
                      Razão: "Operacao_Razao",
                      Categoria: "Plano_de_Contas",
                      Receita: "Receitas",
                      Custo: "Custo_CMV",
                      Despesa: "Despesas_Admin"
                    };
                    setCustomMappings(autoMapped);
                    localStorage.setItem("sauron_schema_mapping", JSON.stringify(autoMapped));
                    alert("A engine analítica Sauron realizou o Mapeamento Automático inteligente das suas colunas base!");
                  }}
                  className="px-4 py-2 bg-blue-600/15 hover:bg-blue-600/25 text-blue-600 dark:text-blue-400 text-xs font-black uppercase rounded hover:shadow cursor-pointer transition-colors"
                >
                  Mapeamento Automático
                </button>
              </div>

              {/* Direct Schema Matching layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { field: "Grupo", desc: "Nome do grupo corporativo principal do cliente", required: true },
                  { field: "CNPJ", desc: "CNPJ do parceiro para consolidação", required: true },
                  { field: "Marca", desc: "Bandeira ou marca envolvida comercialmente", required: true },
                  { field: "Empresa", desc: "Nome amigável da filial ou estabelecimento", required: true },
                  { field: "Mês", desc: "Mês ou data correspondente ao faturamento", required: true },
                  { field: "Razão", desc: "Motivação do faturamento / tipo de negócio (ex: Novos)", required: true },
                  { field: "Categoria", desc: "Plano de contas contábil estendido", required: false },
                  { field: "Receita", desc: "Faturamento bruto gerado", required: true },
                  { field: "Custo", desc: "CMV ou custos operacionais diretos", required: true },
                  { field: "Despesa", desc: "Despesas gerais contábeis associadas", required: true },
                ].map((item) => (
                  <div key={item.field} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs shadow-inner">
                    <div className="min-w-0 pr-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-tight">{item.field}</span>
                        {item.required && <span className="text-red-500 font-bold">*</span>}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[200px]">{item.desc}</p>
                    </div>
                    
                    <select
                      value={customMappings[item.field] || ""}
                      onChange={(e) => {
                        const newMp = { ...customMappings, [item.field]: e.target.value };
                        setCustomMappings(newMp);
                        localStorage.setItem("sauron_schema_mapping", JSON.stringify(newMp));
                      }}
                      className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-100 font-mono focus:outline-none"
                    >
                      <option value="">-- Ignorar Campo --</option>
                      <option value="Grupo_Corporativo">Grupo_Corporativo</option>
                      <option value="Chave_CNPJ">Chave_CNPJ</option>
                      <option value="Bandeira">Bandeira</option>
                      <option value="Filial_Empresa">Filial_Empresa</option>
                      <option value="Data_Referencia">Data_Referencia</option>
                      <option value="Operacao_Razao">Operacao_Razao</option>
                      <option value="Plano_de_Contas">Plano_de_Contas</option>
                      <option value="Receitas">Receitas</option>
                      <option value="Custo_CMV">Custo_CMV</option>
                      <option value="Despesas_Admin">Despesas_Admin</option>
                      <option value="Observações_Gerais">Observações_Gerais</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: FILTROS DO CLIENTE */}
          {activeTab === 5 && (
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-850 dark:text-slate-100 flex items-center gap-2">
                  <Filter size={20} className="text-blue-500" />
                  Configurador de Variáveis / Filtros do Cliente
                </h3>
                <p className="text-slate-400 text-xs mt-1">Defina quais variáveis extraídas da origem estarão expostas como filtros dinâmicos para o cliente final.</p>
              </div>

              {/* Advanced client-facing filters table */}
              <div className="border border-slate-250 dark:border-slate-800 rounded-2xl overflow-hidden shadow-inner bg-slate-50/20">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 dark:bg-slate-900 border-b border-slate-250 dark:border-slate-800 text-[10px] font-black uppercase text-slate-400">
                    <tr>
                      <th className="py-2 px-3">Variável Origem</th>
                      <th className="py-2 px-3">Etiqueta Amigável (Label)</th>
                      <th className="py-2 px-3">Modo de Seleção</th>
                      <th className="py-2 px-3 text-center">Nível de Visibilidade</th>
                      <th className="py-2 px-3 text-right">Ativo?</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                    {visibleFilterConfigs.map((config, idx) => (
                      <tr key={config.column} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                        <td className="py-3 px-3 font-mono font-bold text-slate-500">{config.column}</td>
                        <td className="py-3 px-3">
                          <input 
                            type="text" 
                            value={config.label}
                            onChange={(e) => {
                              const newFlt = [...clientFilterConfigs];
                              const actualIdx = clientFilterConfigs.findIndex(f => f.column === config.column);
                              if (actualIdx !== -1) {
                                newFlt[actualIdx].label = e.target.value;
                                setClientFilterConfigs(newFlt);
                              }
                            }}
                            className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-805 rounded px-2 py-0.5 text-slate-800 dark:text-slate-200"
                          />
                        </td>
                        <td className="py-3 px-3">
                          <select 
                            value={config.type}
                            onChange={(e) => {
                              const newFlt = [...clientFilterConfigs];
                              const actualIdx = clientFilterConfigs.findIndex(f => f.column === config.column);
                              if (actualIdx !== -1) {
                                newFlt[actualIdx].type = e.target.value;
                                setClientFilterConfigs(newFlt);
                              }
                            }}
                            className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-805 rounded px-2 py-0.5"
                          >
                            <option value="multi">Multi-seleção estendida</option>
                            <option value="list">Lista simples suspensa</option>
                            <option value="date">Seletor de Competência (Data)</option>
                            <option value="range">Range de Valores (Numérico)</option>
                          </select>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <select
                            value={config.scope}
                            onChange={(e) => {
                              const newFlt = [...clientFilterConfigs];
                              const actualIdx = clientFilterConfigs.findIndex(f => f.column === config.column);
                              if (actualIdx !== -1) {
                                newFlt[actualIdx].scope = e.target.value;
                                setClientFilterConfigs(newFlt);
                              }
                            }}
                            className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-805 rounded px-2 py-0.5 uppercase text-[9px] font-black"
                          >
                            <option value="standard">Público Geral</option>
                            <option value="manager">Diretoria / CFO</option>
                            <option value="consultant">Oculto (Consultor)</option>
                          </select>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => {
                              const newFlt = [...clientFilterConfigs];
                              const actualIdx = clientFilterConfigs.findIndex(f => f.column === config.column);
                              if (actualIdx !== -1) {
                                newFlt[actualIdx].active = !newFlt[actualIdx].active;
                                setClientFilterConfigs(newFlt);
                              }
                            }}
                            className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                              config.active ? "bg-emerald-600 text-white" : "bg-slate-300 text-slate-600 dark:bg-slate-805"
                            }`}
                          >
                            {config.active ? "Sim" : "Não"}
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

              {/* Dynamic Filter Builder Panel */}
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-4">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Adicionar Filtro Dinâmico Personalizado</span>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-450 block">Coluna Origem</label>
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
                    <label className="text-[10px] font-black text-slate-450 block">Nome Amigável (Label)</label>
                    <input
                      id="new-filter-label"
                      type="text"
                      placeholder="Ex: Holding Grupo"
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-805 rounded px-2.5 py-1.5 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-450 block">Modo Seleção</label>
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
                    <label className="text-[10px] font-black text-slate-450 block">Visibilidade</label>
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
                    * Colunas vazias ou de sistema não são selecionáveis para proteger a DRE.
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
                      
                      // Check if already exists
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
                      
                      // Clear label input
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

          {/* TAB 7: PERMISSÕES */}
          {activeTab === 6 && (
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-850 dark:text-slate-100 flex items-center gap-2">
                  <Lock size={20} className="text-blue-500" />
                  Níveis de Acesso & Governança de Perfis (Roles)
                </h3>
                <p className="text-slate-400 text-xs mt-1">Customize os privilégios e visibilidades para os variados cargos corporativos do cliente.</p>
              </div>

              {/* Roles matrix list */}
              <div className="space-y-4">
                {rolesPermissions.map((rp, i) => (
                  <div key={rp.role} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs">
                    <div>
                      <p className="font-extrabold text-slate-850 dark:text-white text-sm tracking-tight">{rp.role}</p>
                      <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                        Seções visíveis: <strong className="text-slate-600 dark:text-slate-300">{rp.screens.join(", ")}</strong>
                      </p>
                    </div>

                    <div className="flex gap-4 items-center">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={rp.mixApprovedData} 
                          onChange={() => {
                            const newRp = [...rolesPermissions];
                            newRp[i].mixApprovedData = !newRp[i].mixApprovedData;
                            setRolesPermissions(newRp);
                          }}
                          className="rounded border-slate-350"
                        />
                        <span className="font-bold text-slate-550 block">Aprovar Combined Source</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={rp.canExport} 
                          onChange={() => {
                            const newRp = [...rolesPermissions];
                            newRp[i].canExport = !newRp[i].canExport;
                            setRolesPermissions(newRp);
                          }}
                          className="rounded border-slate-350"
                        />
                        <span className="font-bold text-slate-550 block">Exportar Relatórios</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: VALIDAÇÃO */}
          {activeTab === 7 && (
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6 animate-fade-in">
              <div>
                <h3 className="text-lg font-black text-slate-850 dark:text-slate-100 flex items-center gap-2">
                  <ClipboardCheck size={20} className="text-blue-500" />
                  Validação Cruzada de Consistência Teórica
                </h3>
                <p className="text-slate-400 text-xs mt-1">Nossa engine varre e audita em tempo real o dataset mapeado, sinalizando divergências matemáticas antes que cheguem aos relatórios compartilhados.</p>
              </div>

              {/* Dynamic Health Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl">
                  <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">Dataset Health</span>
                  <p className="text-xl font-mono font-black text-emerald-600 dark:text-emerald-400 mt-1">
                    {lucroInconsistente.length + margemInconsistente.length === 0 ? "100%" : `${Math.max(0, 100 - Math.round(((lucroInconsistente.length + margemInconsistente.length) / dataOrigem.length) * 100))}%`}
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl">
                  <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">Campos Omitidos</span>
                  <p className="text-xl font-mono font-black text-blue-600 dark:text-blue-400 mt-1">
                    {camposAusentes.length} <span className="text-xs text-slate-400">omitidos</span>
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl">
                  <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">Lucro Inconsistente</span>
                  <p className={`text-xl font-mono font-black mt-1 ${lucroInconsistente.length > 0 ? "text-amber-500" : "text-emerald-600"}`}>
                    {lucroInconsistente.length} rows
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl">
                  <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">Margem Divergente</span>
                  <p className={`text-xl font-mono font-black mt-1 ${margemInconsistente.length > 0 ? "text-amber-500" : "text-emerald-600"}`}>
                    {margemInconsistente.length} rows
                  </p>
                </div>
              </div>

              {/* Anomalous Inconsistent dataset records details */}
              <div className="space-y-4">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Detalhes de Inconsistências Mapeadas</span>
                
                {lucroInconsistente.length === 0 && margemInconsistente.length === 0 ? (
                  <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 p-5 rounded-2xl text-center flex flex-col items-center justify-center gap-2">
                    <CheckCircle className="text-emerald-600" size={32} />
                    <p className="text-xs font-black text-emerald-800 dark:text-emerald-400">Dataset sem nenhuma fresta ou contradição na DRE!</p>
                    <p className="text-[10px] text-slate-500">As relações estruturais de faturamento (Lucros = Receitas - Custos - Despesas) batem à risca em todas as competências mapeadas.</p>
                  </div>
                ) : (
                  <div className="border border-slate-150 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-850 overflow-hidden max-h-[250px] overflow-y-auto">
                    {/* Profit anomalies */}
                    {lucroInconsistente.slice(0, 15).map((ln, idx) => (
                      <div key={idx} className="p-3 text-xs bg-amber-500/[0.04] flex items-center justify-between border-l-4 border-amber-500">
                        <div>
                          <p className="font-extrabold text-slate-800 dark:text-slate-100">{ln.Empresa} (Mês: {ln.Mês})</p>
                          <p className="text-[9px] text-slate-400 mt-0.5">Operação: {ln.Razão} | Conta: {ln.Categoria || "N/A"}</p>
                        </div>
                        <div className="text-right font-mono text-[10px]">
                          <p className="text-slate-400">Declarado: R$ {ln.Lucro.toLocaleString()}</p>
                          <p className="text-amber-600 font-bold">DRE Real: R$ {(ln.Receita - ln.Custo - ln.Despesa).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 9: SINCRONIZAÇÃO */}
          {activeTab === 8 && (
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
              
              {/* Dynamic trigger & sync panel */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Real-time synchronization card controls */}
                <div className="border border-slate-250 dark:border-slate-805 rounded-2xl p-4 bg-slate-55/40 dark:bg-slate-900/40 divide-y divide-slate-200 dark:divide-slate-800 space-y-4">
                  <div className="pb-3 text-xs space-y-1">
                    <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">Sincronizador Ativo do Workspace</span>
                    <h4 className="font-black text-sm text-slate-850 dark:text-slate-105">Estratégia de Carga</h4>
                    <p className="text-slate-450 leading-relaxed text-[11px]">Sincronize as bases a qualquer momento. Escolha de qual fonte e SNAPSHOT carregar os dados financeiros consolidados.</p>
                  </div>

                  <div className="pt-4 flex flex-col gap-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-550 block">Conectar Banco Remoto</span>
                      <button
                        onClick={triggerSyncDatabase}
                        disabled={isSyncing}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-[10px] uppercase rounded-lg flex items-center gap-1.5 hover:shadow-xs transition-colors cursor-pointer"
                      >
                        <RefreshCw size={12} className={isSyncing ? "animate-spin" : ""} />
                        {isSyncing ? "Buscando..." : "Sync Banco Cliente"}
                      </button>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-550 block">Snapshot Fictício (Segurança)</span>
                      <button
                        onClick={() => {
                          setActiveSource("DEMO_DATA");
                          rejectSource();
                          alert("Dataset do workspace resetado com sucesso para dados DEMO do sistema (Fictícios).");
                        }}
                        className="px-3 py-2 bg-slate-200 hover:bg-slate-350 dark:bg-slate-800 dark:hover:bg-slate-705 text-slate-700 dark:text-slate-300 font-extrabold text-[10px] uppercase rounded-lg transition-colors cursor-pointer"
                      >
                        Ativar Modo Demo
                      </button>
                    </div>
                  </div>

                  {/* Approve combination switch */}
                  <div className="pt-4 text-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-550 block">Permitir COMBINED SOURCE (Mixed)?</span>
                      <button
                        onClick={() => {
                          const nextState = !approveMixedData;
                          if (nextState) {
                            approveSource();
                            setActiveSource("MIXED_APPROVED_DATA");
                            alert("MIXED_APPROVED_DATA ativado. Agora o consultor pode mesclar relatórios de planilhas e DB.");
                          } else {
                            rejectSource();
                            setActiveSource("DEMO_DATA");
                          }
                        }}
                        className={`px-3 py-1.5 rounded text-[10px] font-black uppercase transition-colors cursor-pointer ${
                          approveMixedData ? "bg-emerald-600 text-white" : "bg-slate-300 text-slate-600 dark:bg-slate-800"
                        }`}
                      >
                        {approveMixedData ? "Aprovado" : "Bloqueado"}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      *MIXED_APPROVED_DATA só pode existir e ser consumido por relatórios e apresentações corporativos se o consultor explicitamente aprovar combinar fontes acima.
                    </p>
                  </div>
                </div>

                {/* Audit Trial Logging Container (VPN, DB attempts, succeeded, failed, imported rows, timestamp, user) */}
                <div className="border border-slate-250 dark:border-slate-805 rounded-2xl p-4 bg-slate-55/40 dark:bg-slate-900/40 text-xs flex flex-col gap-3">
                  <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2.5">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5"><Key size={12} /> Log de Auditoria & Rastreabilidade</span>
                    <button onClick={fetchAuditLogs} className="p-1 hover:bg-slate-100 rounded text-slate-500 transition-colors" title="Forçar Leitura Logs">
                      <RefreshCw size={12} />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto h-48 space-y-2.5 pr-1 custom-scrollbar">
                    {auditLogs.length === 0 ? (
                      <p className="text-slate-400 italic text-center py-10">[Nenhum log de auditoria coletável registrado ainda]</p>
                    ) : (
                      auditLogs.map((log) => {
                        const isSuccess = log.status === "Sucesso" || log.status === "Info";
                        const isFail = log.status === "Falha";
                        return (
                          <div key={log.id} className="bg-white dark:bg-slate-950 p-2.5 border border-slate-100 dark:border-slate-850 rounded-xl space-y-1.5 text-[10px] leading-relaxed">
                            <div className="flex justify-between items-center">
                              <span className="font-extrabold text-slate-700 dark:text-slate-200 uppercase">{log.eventType}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                                isSuccess ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400" :
                                isFail ? "bg-rose-100 text-rose-800 dark:bg-rose-955/20 dark:text-rose-450" :
                                "bg-amber-100 text-amber-800"
                              }`}>{log.status}</span>
                            </div>
                            <p className="text-slate-600 dark:text-slate-400 break-words">{log.description}</p>
                            <div className="flex justify-between text-[8px] text-slate-400 border-t border-slate-50 dark:border-slate-850 pt-1">
                              <span>User: <strong className="font-mono text-slate-500">{log.user}</strong></span>
                              <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 10: AUDITORIA */}
          {activeTab === 9 && (
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="text-lg font-black text-slate-850 dark:text-slate-100 flex items-center gap-2">
                    <Shield size={20} className="text-blue-600" />
                    Trilha de Auditoria & Segurança Regulatória
                  </h3>
                  <p className="text-slate-400 text-xs mt-1">
                    Histórico detalhado de todas as tentativas de conexão VPN, conexões a banco de dados read-only, cargas incrementais de planilhas e ações administrativas.
                  </p>
                </div>
                <button
                  onClick={() => {
                    const csvRows = [
                      ["ID", "Data/Hora", "Evento", "Descricao", "Status", "Usuario"],
                      ...auditLogs.map((log) => [
                        log.id,
                        new Date(log.timestamp).toLocaleString("pt-BR"),
                        log.eventType,
                        log.description,
                        log.status,
                        log.user
                      ])
                    ];
                    const csvContent = "data:text/csv;charset=utf-8," 
                      + csvRows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n");
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", `auditoria_sauron_${Date.now()}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold uppercase rounded-lg flex items-center gap-2 shadow transition-colors cursor-pointer"
                >
                  <FileText size={14} />
                  Exportar Logs (.CSV)
                </button>
              </div>

              {/* Advanced Filter Status bar */}
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-4 rounded-xl flex flex-wrap gap-4 items-center justify-between">
                <div className="flex gap-4">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span>Sucessos / Info: <strong>{auditLogs.filter(l => l.status !== "Falha").length}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                    <span>Falhas / Alertas: <strong>{auditLogs.filter(l => l.status === "Falha").length}</strong></span>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">Estado do Sistema: Em Conformidade</span>
              </div>

              {/* Log Timeline Table List */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-950">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900 text-[10px] font-black uppercase text-slate-400 border-b border-slate-200 dark:border-slate-800">
                        <th className="py-3 px-4">Timestamp</th>
                        <th className="py-3 px-4">Categoria / Evento</th>
                        <th className="py-3 px-4">Usuário</th>
                        <th className="py-3 px-4">Descrição da Atividade</th>
                        <th className="py-3 px-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 dark:divide-slate-800 font-semibold">
                      {auditLogs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400 italic">[Sem registros de auditoria na sessão atual]</td>
                        </tr>
                      ) : (
                        auditLogs.map((log) => {
                          const isSuccess = log.status === "Sucesso" || log.status === "Info";
                          const isFail = log.status === "Falha";
                          return (
                            <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                              <td className="py-3 px-4 text-slate-400 font-mono text-[10px]">
                                {new Date(log.timestamp).toLocaleString("pt-BR")}
                              </td>
                              <td className="py-3 px-4 text-slate-850 dark:text-slate-200">
                                <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded font-mono text-[9px] uppercase tracking-wide">
                                  {log.eventType}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{log.user}</td>
                              <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-sm truncate" title={log.description}>
                                {log.description}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                                  isSuccess ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-450" :
                                  isFail ? "bg-rose-100 text-rose-800 dark:bg-rose-955/20 dark:text-rose-450" :
                                  "bg-amber-100 text-amber-800"
                                }`}>
                                  {log.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Policy alert warning box */}
              <div className="p-4 bg-blue-50/40 dark:bg-slate-900/50 border border-blue-100 dark:border-slate-800 rounded-xl flex gap-3 text-xs text-slate-600 dark:text-slate-350 leading-relaxed font-medium">
                <Lock className="text-blue-500 shrink-0 mt-0.5" size={16} />
                <span>
                  <strong>Política de Retenção e Não Alteração:</strong> Por motivos de governança de dados em reuniões executivas e faturamento real de concessionárias, os registros acima são marcados em modo estritamente read-only na base corporativa. Nenhuma ação de exclusão física ou bypass de logs é permitida.
                </span>
              </div>
            </div>
          )}

          {/* Navigation Bottom Row Tracker */}
          <div className="flex justify-between items-center mt-5 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
            <button
              onClick={() => setActiveTab(prev => Math.max(0, prev - 1))}
              disabled={activeTab === 0}
              className="flex items-center gap-1 px-4 py-2 bg-white hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-20 text-xs font-bold text-slate-700 dark:text-slate-300 rounded-lg cursor-pointer transition-colors"
            >
              <ChevronLeft size={16} /> Etapa Anterior
            </button>
            <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider font-mono">Processo Seguro Homologado B2B</span>
            <button
              onClick={() => setActiveTab(prev => Math.min(steps.length - 1, prev + 1))}
              disabled={activeTab === steps.length - 1}
              className="flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-20 text-white text-xs font-bold rounded-lg cursor-pointer transition-all"
            >
              Próxima Etapa <ChevronRight size={16} />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
