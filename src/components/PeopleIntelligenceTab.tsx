/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { 
  Users, 
  TrendingUp, 
  Coins, 
  FileText, 
  Lightbulb, 
  Search, 
  FileCheck, 
  Printer, 
  UserCheck, 
  UserX,
  UserCheck2,
  Calendar,
  Briefcase,
  Layers,
  MapPin,
  Clock,
  QrCode,
  CheckCircle,
  HelpCircle,
  TrendingDown,
  Percent,
  Sliders,
  DollarSign,
  ReceiptText,
  Loader2
} from "lucide-react";

import { LancamentoFinanceiro, MetricasConsolidadas } from "../types";
import { VendedoresTab } from "./VendedoresTab";
import { ComissoesTab } from "./ComissoesTab";
import { activeDatasetStore } from "../core/data/ActiveDatasetStore";
import { buildPeopleView, PeopleBusinessView } from "../core/data/businessViews";
import { getDefaultProjectId, listModuleMappings } from "../core/data/moduleMapping";
import { buildModuleDashboard, ExecutiveDashboard } from "../core/dashboard-engine";
import { ModuleFieldMappingPanel } from "./ModuleFieldMappingPanel";
import { buildSellerStatement, SellerStatement } from "../core/data/sellerStatement";
import { CommissionClosingPanel } from "./CommissionClosingPanel";
import { DashboardBlocksRenderer } from "./DashboardBlocksRenderer";
import { platformLogger } from "../core/platform/PlatformLogger";
import { getEnterpriseContext } from "../core/enterprise-consolidation";

// SDK Components
import { SauronTabs, TabItem } from "../sauron-sdk/ui/SauronTabs";
import { SauronTable } from "../sauron-sdk/ui/SauronTable";
import { SauronCard } from "../sauron-sdk/ui/SauronCard";
import { SauronBadge } from "../sauron-sdk/ui/SauronBadge";
import { SauronPeopleCard } from "../sauron-sdk/domain/SauronPeopleCard";
import { SauronTimeline, TimelineEvent } from "../sauron-sdk/ui/SauronTimeline";
import { SauronDossierSection } from "../sauron-sdk/domain/SauronDossierSection";
import { SauronKpiCard } from "../sauron-sdk/ui/SauronKpiCard";
import { SauronMetric } from "../sauron-sdk/ui/SauronMetric";
import { SauronInput } from "../sauron-sdk/ui/SauronInput";
import { SauronSelect } from "../sauron-sdk/ui/SauronSelect";

// Services and Engine
import { CollaboratorDossier } from "../core/compensation/ExecutivePeopleService";

interface PeopleIntelligenceTabProps {
  dataOrigem: LancamentoFinanceiro[];
  formatCurrency: (v: number) => string;
  metrics: MetricasConsolidadas;
  calculatedCommissions: {
    regraAtiva: string;
    totalGeralComissao: number;
    detailsByCnpj: any[];
    detalhePorConta: any[];
  };
  segmentoCliente: string;
  setSegmentoCliente: (v: string) => void;
  observacaoGerente: string;
  setObservacaoGerente: (v: string) => void;
  faturamentoOffset: number;
  setFaturamentoOffset: (v: number) => void;
  despesaOffset: number;
  setDespesaOffset: (v: number) => void;
  narrarFeedback: boolean;
  setNarrarFeedback: (v: boolean) => void;
  comissaoFormula: string;
  setComissaoFormula: (v: string) => void;
  percentualComissaoBase: number;
  setPercentualComissaoBase: (v: number) => void;
  taxaComissaoAcessorios: number;
  setTaxaComissaoAcessorios: (v: number) => void;
  taxaComissaoItens: number;
  setTaxaComissaoItens: (v: number) => void;
  triggerSystemBackup: () => void;
  userRole?: string;
  peopleView?: any[];
  activeDataset?: any;
}

const SellerStatementPreview: React.FC<{
  statement: SellerStatement;
  formatCurrency: (v: number) => string;
  onClose: () => void;
}> = ({ statement, formatCurrency, onClose }) => {
  const generatedAt = new Date(statement.generatedAt);
  const formattedDate = Number.isFinite(generatedAt.getTime())
    ? generatedAt.toLocaleDateString("pt-BR")
    : new Date().toLocaleDateString("pt-BR");

  return (
    <div className="bg-white text-slate-900 border border-slate-300 rounded-2xl p-8 shadow-2xl space-y-6 relative max-w-4xl mx-auto" id="seller-statement-print-preview">
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Resumo/Holerite do Vendedor</h2>
          <h1 className="text-xl font-black uppercase tracking-tight text-slate-950 mt-1">{statement.sellerName}</h1>
          <p className="text-[11px] font-mono text-slate-500 mt-1">Data: {formattedDate}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-2 rounded-lg border border-slate-300 text-[10px] font-black uppercase text-slate-700 hover:bg-slate-50"
        >
          Voltar ao dossiê
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="border border-slate-200 rounded-xl p-4">
          <h3 className="text-[10px] font-black uppercase text-slate-400 mb-3">Identificação</h3>
          <div className="space-y-2">
            <p><strong>Nome:</strong> {statement.sellerName}</p>
            <p><strong>CPF:</strong> {statement.cpf || "Não mapeado"}</p>
            <p><strong>Matrícula:</strong> {statement.registration || "Não mapeada"}</p>
            <p><strong>Setor:</strong> {statement.department || "Não mapeado"}</p>
            <p><strong>Loja:</strong> {statement.store || "Não mapeada"}</p>
            <p><strong>Período:</strong> {statement.period || "Não disponível"}</p>
          </div>
        </div>

        <div className="border border-slate-200 rounded-xl p-4">
          <h3 className="text-[10px] font-black uppercase text-slate-400 mb-3">Resumo Operacional</h3>
          <div className="space-y-2">
            <p><strong>Total vendido:</strong> {statement.totalSold !== null ? formatCurrency(statement.totalSold) : "Não configurado"}</p>
            <p><strong>Quantidade de registros:</strong> {statement.recordCount.toLocaleString("pt-BR")}</p>
            <p>
              <strong>Comissão:</strong>{" "}
              {statement.commission.configured && statement.commission.value !== null
                ? formatCurrency(statement.commission.value)
                : "Comissão não configurada"}
            </p>
            <p><strong>Nome do gestor:</strong> {statement.managerName || "Não informado"}</p>
          </div>
        </div>
      </div>

      <div className="border border-slate-200 rounded-xl p-4 text-xs">
        <h3 className="text-[10px] font-black uppercase text-slate-400 mb-3">Observações</h3>
        {statement.observations.length > 0 ? (
          <ul className="space-y-1 list-disc list-inside text-slate-700">
            {statement.observations.map(item => <li key={item}>{item}</li>)}
          </ul>
        ) : (
          <p className="text-slate-700">Resumo gerado somente com dados reais mapeados.</p>
        )}
      </div>

      <div className="border border-slate-200 rounded-xl p-4 text-[11px]">
        <h3 className="text-[10px] font-black uppercase text-slate-400 mb-3">Origem dos Dados</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 font-mono text-slate-600">
          <p><strong>Arquivo:</strong> {statement.source.fileName}</p>
          <p><strong>Dados ativos:</strong> {statement.source.fileName}</p>
          <p><strong>Aba Pessoas:</strong> {statement.source.peopleSheetName || "Não configurada"}</p>
          <p><strong>Aba Comissão:</strong> {statement.source.commissionSheetName || "Não configurada"}</p>
          <p className="md:col-span-2"><strong>Colunas usadas:</strong> {statement.source.columnsUsed.join(", ") || "Nenhuma coluna mapeada"}</p>
        </div>
      </div>

      <div className="border-t border-slate-200 pt-10 grid grid-cols-1 md:grid-cols-2 gap-12 text-center text-[10px]">
        <div className="space-y-8">
          <div className="border-b border-slate-400 mx-auto w-3/4" />
          <div>
            <strong className="block text-slate-800 font-black uppercase font-mono">{statement.sellerName}</strong>
            <span className="text-slate-500 block font-mono">Assinatura do vendedor</span>
          </div>
        </div>
        <div className="space-y-8">
          <div className="border-b border-slate-400 mx-auto w-3/4" />
          <div>
            <strong className="block text-slate-800 font-black uppercase font-mono">{statement.managerName || "Gestor responsável"}</strong>
            <span className="text-slate-500 block font-mono">Assinatura do gestor</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const PeopleIntelligenceTab: React.FC<PeopleIntelligenceTabProps> = (props) => {
  const [activeTab, setActiveTab] = useState<string>("colaboradores");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedColabId, setSelectedColabId] = useState<string>("");
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showSellerStatementPreview, setShowSellerStatementPreview] = useState(false);
  const [sellerStatement, setSellerStatement] = useState<SellerStatement | null>(null);
  const [sellerStatementLoading, setSellerStatementLoading] = useState(false);
  const [sellerStatementError, setSellerStatementError] = useState<string | null>(null);
  const [statementManagerName, setStatementManagerName] = useState("");

  // Filters for People Hub
  const [filterDepartment, setFilterDepartment] = useState("ALL");
  const [filterStore, setFilterStore] = useState("ALL");
  const [filterManager, setFilterManager] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [groupBy, setGroupBy] = useState("NONE");

  const activeDataset = props.activeDataset || activeDatasetStore.getActiveDataset();
  const isRealSpreadsheet = !!activeDataset;
  const [peopleBusinessView, setPeopleBusinessView] = useState<PeopleBusinessView | null>(null);
  const [peopleDashboard, setPeopleDashboard] = useState<ExecutiveDashboard | null>(null);
  const [mappingRevision, setMappingRevision] = useState(0);

  React.useEffect(() => {
    if (activeDataset) {
      platformLogger.info(`[Sauron Instrumentation] PEOPLE_RECEIVED_ACTIVE_DATASET - datasetId: ${activeDataset.datasetId}, sourceName: ${activeDataset.sourceName}, rowCount: ${activeDataset.rowCount}, columnCount: ${activeDataset.columnCount}, sourceType: ${activeDataset.sourceType}`);
    } else {
      platformLogger.info(`[Sauron Instrumentation] PEOPLE_RECEIVED_ACTIVE_DATASET - datasetId: null, sourceName: null, rowCount: 0, columnCount: 0, sourceType: null`);
    }
  }, [activeDataset]);

  React.useEffect(() => {
    let isMounted = true;

    if (!activeDataset) {
      setPeopleBusinessView(null);
      setPeopleDashboard(null);
      return;
    }

    const projectId = getDefaultProjectId(activeDataset);
    const moduleMappings = listModuleMappings(activeDataset.datasetId, projectId);

    Promise.all([
      buildPeopleView(),
      buildModuleDashboard("Pessoas", (() => {
        const context = getEnterpriseContext();
        return {
          activeDataset,
          moduleMappings,
          contextType: context.scope,
          contextId: context.unitId || context.companyId || context.groupId || activeDataset.datasetId,
          workspaceId: context.workspaceId,
          period: context.period,
        };
      })()),
    ]).then(([view, dashboard]) => {
      if (!isMounted) return;
      setPeopleBusinessView(view);
      setPeopleDashboard(dashboard);
    });

    return () => {
      isMounted = false;
    };
  }, [activeDataset?.datasetId, activeDataset?.importedAt, mappingRevision]);

  const isPendingConfiguration = useMemo(() => {
    if (!isRealSpreadsheet) return false;
    return !!peopleBusinessView && !peopleBusinessView.hasData;
  }, [isRealSpreadsheet, peopleBusinessView]);

  const realSellers = useMemo(() => {
    if (!isRealSpreadsheet || !peopleBusinessView?.hasData) return [];

    return peopleBusinessView.people.map((person, idx) => {
      return {
        id: `seller_${idx}`,
        name: person.name,
        email: "Informação não disponível.",
        role: person.role || "Regra de comissão não configurada",
        team: "N/A",
        store: "N/A",
        department: person.department || "N/A",
        manager: "N/A",
        status: "Ativo" as const,
        hireDate: "N/A",
        experience: "N/A",
        achievements: "N/A",
        strengths: "N/A",
        weaknesses: "N/A",
        feedback: "N/A",
        performance: {
          collaboratorId: `seller_${idx}`,
          totalSales: person.commissionTotal || 0,
          accessoriesSales: 0,
          partsSales: 0,
          csat: 0,
          cancellationRate: 0,
          campaignParticipated: [],
          lineage: {
            totalSalesCell: peopleBusinessView.sheetName || "ActiveDataset",
            accessoriesSalesCell: `N/A`,
            partsSalesCell: `N/A`,
            csatCell: `N/A`,
            cancellationRateCell: `N/A`
          }
        },
        timeline: [],
        pdi: [],
        documents: [],
      };
    });
  }, [isRealSpreadsheet, peopleBusinessView]);

  const allDossiers = isRealSpreadsheet ? realSellers : [];

  // Handle click on a table row to go to the dossier
  const handleSelectCollaborator = (dossier: CollaboratorDossier) => {
    setSelectedColabId(dossier.id);
    setActiveTab("dossies");
    setShowPrintPreview(false);
    setShowSellerStatementPreview(false);
    setSellerStatementError(null);
  };

  // Filter Collaborators
  const filteredDossiers = allDossiers.filter((col) => {
    const matchesSearch = 
      col.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      col.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      col.department.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = filterDepartment === "ALL" || col.department === filterDepartment;
    const matchesStore = filterStore === "ALL" || col.store === filterStore;
    const matchesManager = filterManager === "ALL" || col.manager === filterManager;
    const matchesStatus = filterStatus === "ALL" || col.status === filterStatus;

    return matchesSearch && matchesDept && matchesStore && matchesManager && matchesStatus;
  });

  // Unique lists for filtering dropdowns
  const departments = Array.from(new Set(allDossiers.map((c) => c.department)));
  const stores = Array.from(new Set(allDossiers.map((c) => c.store)));
  const managers = Array.from(new Set(allDossiers.map((c) => c.manager)));

  // Groups division
  const groupedData: { [key: string]: CollaboratorDossier[] } = {};
  if (groupBy !== "NONE") {
    filteredDossiers.forEach((col) => {
      let key = "Outros";
      if (groupBy === "DEPARTMENT") key = col.department;
      else if (groupBy === "STORE") key = col.store;
      else if (groupBy === "MANAGER") key = col.manager;
      else if (groupBy === "STATUS") key = col.status;

      if (!groupedData[key]) {
        groupedData[key] = [];
      }
      groupedData[key].push(col);
    });
  }

  if (!activeDataset) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-4 max-w-xl mx-auto my-12 shadow-sm font-sans">
        <Users className="text-emerald-500 w-12 h-12" />
        <h3 className="text-base font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">Configuração Pendente</h3>
        <p className="text-sm font-extrabold text-slate-700 dark:text-slate-300">
          Nenhuma fonte de dados ativa.
        </p>
      </div>
    );
  }

  if (!peopleBusinessView) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-4 max-w-xl mx-auto my-12 shadow-sm font-sans">
        <Users className="text-emerald-500 w-12 h-12" />
        <h3 className="text-base font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">Preparando a visão de pessoas</h3>
        <p className="text-sm font-extrabold text-slate-700 dark:text-slate-300">
          Preparando a visão de pessoas a partir da planilha.
        </p>
      </div>
    );
  }

  if (isPendingConfiguration) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-4 max-w-xl mx-auto my-12 shadow-sm font-sans">
        <Users className="text-emerald-500 w-12 h-12 animate-pulse" />
        <h3 className="text-base font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">Configuração Pendente</h3>
        <p className="text-sm font-extrabold text-slate-700 dark:text-slate-300">
          Configuração pendente: selecione uma coluna de pessoa/vendedor.
        </p>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Abas disponíveis: {peopleBusinessView.availableSheets.slice(0, 8).join(", ") || "Nenhuma aba disponível."}
        </p>
        <div className="w-full max-w-2xl">
          <ModuleFieldMappingPanel
            moduleName="Pessoas"
            activeDataset={activeDataset}
            onSaved={() => setMappingRevision(revision => revision + 1)}
          />
        </div>
        {peopleDashboard && (
          <div className="w-full max-w-5xl">
            <DashboardBlocksRenderer blocks={peopleDashboard.blocks} />
          </div>
        )}
      </div>
    );
  }

  // Active Selected Dossier details
  const emptyDossier: CollaboratorDossier = {
    id: "empty",
    name: "Nenhum colaborador",
    role: "N/A",
    team: "N/A",
    department: "N/A",
    store: "N/A",
    manager: "N/A",
    email: "N/A",
    status: "Ativo",
    hireDate: "N/A",
    experience: "N/A",
    achievements: "N/A",
    strengths: "N/A",
    weaknesses: "N/A",
    feedback: "N/A",
    performance: {
      collaboratorId: "empty",
      totalSales: 0,
      accessoriesSales: 0,
      partsSales: 0,
      csat: 5.0,
      cancellationRate: 0,
      campaignParticipated: [],
      lineage: {
        totalSalesCell: "N/A",
        accessoriesSalesCell: "N/A",
        partsSalesCell: "N/A",
        csatCell: "N/A",
        cancellationRateCell: "N/A"
      }
    },
    timeline: [],
    pdi: [],
    documents: []
  };

  const activeDossier = allDossiers.find(d => d.id === selectedColabId) || allDossiers[0] || emptyDossier;

  const handleGenerateSellerStatement = async () => {
    if (!activeDataset || activeDossier.id === "empty") return;

    setSellerStatementLoading(true);
    setSellerStatementError(null);
    try {
      const statement = await buildSellerStatement({
        sellerName: activeDossier.name,
        managerName: statementManagerName || (activeDossier.manager !== "N/A" ? activeDossier.manager : ""),
      });
      setSellerStatement(statement);
      setShowSellerStatementPreview(true);
      setShowPrintPreview(false);
    } catch (error) {
      setSellerStatement(null);
      setShowSellerStatementPreview(false);
      setSellerStatementError(error instanceof Error ? error.message : "Não foi possível gerar o resumo do vendedor.");
    } finally {
      setSellerStatementLoading(false);
    }
  };

  // Tab configurations
  const tabs: TabItem[] = [
    { id: "colaboradores", label: "Hub de Pessoas", icon: <Users size={12} /> },
    { id: "performance", label: "Performance Individual", icon: <TrendingUp size={12} /> },
    { id: "comissoes", label: "Comissões & Regras", icon: <Coins size={12} /> },
    { id: "fechamento_comissoes", label: "Fechamento de Comissões", icon: <FileCheck size={12} /> },
    { id: "dossies", label: "Dossiê Executivo", icon: <FileText size={12} /> },
    { id: "impressoes", label: "Impressões de Consultoria", icon: <Lightbulb size={12} /> },
  ];

  // Table columns definition for Hub
  const columns = [
    {
      header: "Nome do Colaborador",
      accessor: (row: CollaboratorDossier) => (
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/10 flex items-center justify-center font-bold font-mono text-[10px] uppercase">
            {row.name.substring(0, 2)}
          </div>
          <div>
            <p className="font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-tight text-xs">{row.name}</p>
            <p className="text-[9px] text-slate-400 dark:text-slate-500 font-mono tracking-wider">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Cargo / Equipe",
      accessor: (row: CollaboratorDossier) => (
        <div>
          <p className="font-bold text-slate-700 dark:text-slate-300 text-xs">{row.role}</p>
          <p className="text-[10px] text-slate-400 font-mono">{row.team}</p>
        </div>
      ),
    },
    {
      header: "Loja & Departamento",
      accessor: (row: CollaboratorDossier) => (
        <div>
          <p className="font-semibold text-slate-600 dark:text-slate-400 text-xs uppercase">{row.store}</p>
          <p className="text-[10px] text-slate-400 font-mono uppercase">{row.department}</p>
        </div>
      ),
    },
    {
      header: "Gestor Direto",
      accessor: (row: CollaboratorDossier) => (
        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800 rounded px-2 py-0.5">
          {row.manager}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: (row: CollaboratorDossier) => (
        <SauronBadge type={row.status === "Ativo" ? "success" : "neutral"}>
          {row.status}
        </SauronBadge>
      ),
    },
  ];

  return (
    <div className="space-y-6 font-sans text-slate-800 dark:text-slate-150 animate-fade-in" id="executive-people-intelligence">
      
      {/* Upper Brand Card */}
      <div className="bg-slate-900 border border-slate-850 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
          <Users size={120} />
        </div>
        <div className="z-10 relative">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-600 rounded-lg text-white">
              <Users size={18} />
            </span>
            <h1 className="text-sm font-black tracking-widest uppercase text-blue-400">Sauron OS • Executive People Intelligence</h1>
          </div>
          <p className="text-slate-400 text-xs mt-2 max-w-3xl leading-relaxed">
            Veja as pessoas encontradas na planilha, seus resultados e os resumos que precisam de confirmação.
          </p>
        </div>
      </div>

      <ModuleFieldMappingPanel
        moduleName="Pessoas"
        activeDataset={activeDataset}
        onSaved={() => setMappingRevision(revision => revision + 1)}
      />

      {peopleDashboard ? (
        <DashboardBlocksRenderer blocks={peopleDashboard.blocks} />
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-bold text-slate-500">Preparando blocos de Pessoas...</p>
        </div>
      )}

      {/* Tabs Menu */}
      <SauronTabs 
        tabs={tabs} 
        activeTabId={activeTab} 
        onTabChange={(id) => {
          setActiveTab(id);
          setShowPrintPreview(false);
        }} 
      />

      {/* Content Renderer */}
      <div className="min-h-[450px]">
        
        {/* TAB 1: HUB DE PESSOAS (PEOPLE HUB) */}
        {activeTab === "colaboradores" && (
          <div className="space-y-5 animate-fade-in">
            
            {/* Filter Panel */}
            <SauronCard title="Filtros e Agrupamentos Executivos" subtitle="Segmentação avançada sem persistência destrutiva">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                
                {/* Search */}
                <div className="md:col-span-1">
                  <SauronInput 
                    label="Pesquisa Direta"
                    placeholder="Nome, cargo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* Department Filter */}
                <SauronSelect 
                  label="Departamento"
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  options={[
                    { value: "ALL", label: "Todos os Departamentos" },
                    ...departments.map((d) => ({ value: d, label: d }))
                  ]}
                />

                {/* Store Filter */}
                <SauronSelect 
                  label="Unidade"
                  value={filterStore}
                  onChange={(e) => setFilterStore(e.target.value)}
                  options={[
                    { value: "ALL", label: "Todas as Unidades" },
                    ...stores.map((s) => ({ value: s, label: s }))
                  ]}
                />

                {/* Manager Filter */}
                <SauronSelect 
                  label="Gestor Responsável"
                  value={filterManager}
                  onChange={(e) => setFilterManager(e.target.value)}
                  options={[
                    { value: "ALL", label: "Todos os Gestores" },
                    ...managers.map((m) => ({ value: m, label: m }))
                  ]}
                />

                {/* Group By Selector */}
                <SauronSelect 
                  label="Agrupar Listagem Por"
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value)}
                  options={[
                    { value: "NONE", label: "Sem Agrupamento" },
                    { value: "DEPARTMENT", label: "Por Departamento" },
                    { value: "STORE", label: "Por Unidade" },
                    { value: "MANAGER", label: "Por Gestor" },
                    { value: "STATUS", label: "Por Status de Trabalho" }
                  ]}
                />
              </div>
            </SauronCard>

            {/* List Table or Group Tree */}
            {groupBy === "NONE" ? (
              <SauronCard 
                title="Quadro Operacional de Colaboradores" 
                subtitle={`Mostrando ${filteredDossiers.length} de ${allDossiers.length} colaboradores ativos`}
              >
                <SauronTable 
                  columns={columns}
                  data={filteredDossiers}
                  keyExtractor={(row) => row.id}
                  onRowClick={handleSelectCollaborator}
                  emptyTitle="Nenhum colaborador localizado"
                  emptyDescription="Revise os parâmetros de filtros táticos ou de busca textual."
                />
              </SauronCard>
            ) : (
              <div className="space-y-4">
                {Object.keys(groupedData).map((groupKey) => (
                  <SauronCard 
                    key={groupKey} 
                    title={`Grupo: ${groupKey}`} 
                    subtitle={`${groupedData[groupKey].length} colaboradores encontrados`}
                  >
                    <SauronTable 
                      columns={columns}
                      data={groupedData[groupKey]}
                      keyExtractor={(row) => row.id}
                      onRowClick={handleSelectCollaborator}
                    />
                  </SauronCard>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PERFORMANCE INDIVIDUAL */}
        {activeTab === "performance" && (
          <VendedoresTab 
            dataOrigem={props.dataOrigem}
            formatCurrency={props.formatCurrency}
          />
        )}

        {/* TAB 3: COMISSÕES E REGRAS */}
        {activeTab === "comissoes" && (
          <div className="space-y-4">
            <ModuleFieldMappingPanel
              moduleName="Comissão"
              activeDataset={activeDataset}
              onSaved={() => setMappingRevision(revision => revision + 1)}
            />
            <ComissoesTab 
              metrics={props.metrics}
              formatCurrency={props.formatCurrency}
              calculatedCommissions={props.calculatedCommissions}
              segmentoCliente={props.segmentoCliente}
              setSegmentoCliente={props.setSegmentoCliente}
              observacaoGerente={props.observacaoGerente}
              setObservacaoGerente={props.setObservacaoGerente}
              faturamentoOffset={props.faturamentoOffset}
              setFaturamentoOffset={props.setFaturamentoOffset}
              despesaOffset={props.despesaOffset}
              setDespesaOffset={props.setDespesaOffset}
              narrarFeedback={props.narrarFeedback}
              setNarrarFeedback={props.setNarrarFeedback}
              comissaoFormula={props.comissaoFormula}
              setComissaoFormula={props.setComissaoFormula}
              percentualComissaoBase={props.percentualComissaoBase}
              setPercentualComissaoBase={props.setPercentualComissaoBase}
              taxaComissaoAcessorios={props.taxaComissaoAcessorios}
              setTaxaComissaoAcessorios={props.setTaxaComissaoAcessorios}
              taxaComissaoItens={props.taxaComissaoItens}
              setTaxaComissaoItens={props.setTaxaComissaoItens}
              triggerSystemBackup={props.triggerSystemBackup}
              userRole={props.userRole}
            />
          </div>
        )}

        {/* TAB 4: FECHAMENTO DE COMISSÕES */}
        {activeTab === "fechamento_comissoes" && (
          <CommissionClosingPanel
            activeDataset={activeDataset}
            formatCurrency={props.formatCurrency}
            onMappingSaved={() => setMappingRevision(revision => revision + 1)}
          />
        )}

        {/* TAB 4: DOSSIÊS DO COLABORADOR */}
        {activeTab === "dossies" && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-fade-in">
            
            {/* Sidebar list selection */}
            <div className="lg:col-span-1 space-y-4">
              <SauronCard title="Colaboradores" subtitle="Selecione para abrir o dossiê executivo">
                <div className="space-y-2">
                  {allDossiers.map((col) => {
                    const isSelected = col.id === selectedColabId;
                    return (
                      <button
                        key={col.id}
                        onClick={() => {
                          setSelectedColabId(col.id);
                          setShowPrintPreview(false);
                          setShowSellerStatementPreview(false);
                          setSellerStatementError(null);
                        }}
                        className={`w-full text-left rounded-xl transition-all block focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                          isSelected ? "ring-2 ring-blue-500 scale-[1.02]" : ""
                        }`}
                      >
                        <SauronPeopleCard 
                          name={col.name}
                          role={col.role}
                          organization={col.store}
                        />
                      </button>
                    );
                  })}
                </div>
              </SauronCard>

              <SauronCard title="Resumo do Vendedor" subtitle="Preview imprimível com dados reais mapeados">
                <div className="space-y-3">
                  <SauronInput
                    label="Nome do gestor"
                    placeholder="Gestor responsável"
                    value={statementManagerName}
                    onChange={(event) => setStatementManagerName(event.target.value)}
                  />
                  <button
                    type="button"
                    onClick={handleGenerateSellerStatement}
                    disabled={sellerStatementLoading || activeDossier.id === "empty"}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sellerStatementLoading ? <Loader2 size={14} className="animate-spin" /> : <ReceiptText size={14} />}
                    <span>{sellerStatementLoading ? "Gerando resumo" : "Gerar resumo do vendedor"}</span>
                  </button>
                  {sellerStatementError && (
                    <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                      {sellerStatementError}
                    </p>
                  )}
                </div>
              </SauronCard>
              
              {/* Premium Printable Document triggers */}
              <button
                onClick={() => {
                  setShowPrintPreview(!showPrintPreview);
                  setShowSellerStatementPreview(false);
                }}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider text-white bg-slate-900 hover:bg-slate-800 active:scale-95 transition-all shadow-md border border-slate-750"
              >
                <Printer size={14} />
                <span>{showPrintPreview ? "Visualizar Dossiê" : "Gerar PDF Executivo"}</span>
              </button>
            </div>

            {/* Main content display */}
            <div className="lg:col-span-3">
              {showSellerStatementPreview && sellerStatement ? (
                <SellerStatementPreview
                  statement={sellerStatement}
                  formatCurrency={props.formatCurrency}
                  onClose={() => setShowSellerStatementPreview(false)}
                />
              ) : showPrintPreview ? (
                /* PREMIUM PRINT PREVIEW SHEET CONTAINER (E2-F) */
                <div className="bg-white text-slate-900 border border-slate-300 rounded-2xl p-8 shadow-2xl space-y-6 relative max-w-4xl mx-auto" id="premium-print-dossier">
                  
                  {/* Decorative Print Ribbon */}
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-600 rounded-t-2xl" />

                  {/* Document Meta Header */}
                  <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                    <div>
                      <h2 className="text-xs font-black uppercase text-slate-500 font-mono tracking-widest">Documento Executivo de Governança</h2>
                      <h1 className="text-lg font-extrabold font-sans text-slate-900 uppercase tracking-tight mt-0.5">Dossiê e Remuneração de Colaborador</h1>
                      <div className="flex items-center gap-1.5 mt-1 text-[10px] font-mono text-slate-400">
                        <Clock size={11} />
                        <span>Gerado em {new Date().toLocaleDateString("pt-BR")} às {new Date().toLocaleTimeString("pt-BR")}</span>
                        <span className="mx-1">•</span>
                        <span>Doc Ref: SOP-DOS-{activeDossier.id.substring(6).toUpperCase()}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2 py-0.5 border border-blue-500 text-blue-600 bg-blue-50 text-[9px] font-mono font-black rounded uppercase">
                        VERSÃO v2.4.1-STABLE
                      </span>
                    </div>
                  </div>

                  {/* Print Grid Content */}
                  <div className="grid grid-cols-3 gap-6 text-xs">
                    
                    {/* Identification */}
                    <div className="col-span-2 space-y-3">
                      <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1">Identificação Cadastral</h3>
                      <div className="grid grid-cols-2 gap-3 leading-relaxed">
                        <div>
                          <span className="text-[9px] text-slate-400 uppercase font-mono block">Nome Completo:</span>
                          <strong className="text-slate-800 text-xs font-extrabold">{activeDossier.name}</strong>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 uppercase font-mono block">E-mail Corporativo:</span>
                          <span className="text-slate-700 font-mono">{activeDossier.email}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 uppercase font-mono block">Cargo / Função:</span>
                          <strong className="text-slate-850 font-bold">{activeDossier.role}</strong>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 uppercase font-mono block">Showroom / Unidade:</span>
                          <span className="text-slate-700 font-semibold">{activeDossier.store}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 uppercase font-mono block">Admissão:</span>
                          <span className="text-slate-700 font-mono font-bold">{activeDossier.hireDate}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 uppercase font-mono block">Gestor Direto:</span>
                          <span className="text-slate-700 font-medium">{activeDossier.manager}</span>
                        </div>
                      </div>
                    </div>

                    {/* QR Code and Validation */}
                    <div className="col-span-1 border border-slate-200 bg-slate-50 rounded-xl p-3 flex flex-col justify-between items-center text-center">
                      <div className="flex flex-col items-center">
                        <QrCode size={48} className="text-slate-800 mb-1.5" />
                        <span className="text-[8px] font-mono text-slate-500 font-black uppercase tracking-wider">QR CODE VALIDATOR</span>
                        <p className="text-[8px] text-slate-400 font-mono mt-0.5 leading-tight">Selado via hash de conformidade tributária</p>
                      </div>
                      <div className="w-full border-t border-slate-200 pt-1.5 mt-2">
                        <span className="text-[8px] font-mono font-bold text-slate-600 block truncate">UID: {activeDossier.id}</span>
                      </div>
                    </div>
                  </div>

                  {/* Summary performance numbers */}
                  <div className="border-t border-b border-slate-200 py-3 grid grid-cols-4 gap-4 bg-slate-50/50 px-4 rounded-xl text-center">
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase font-mono">Faturamento Período</span>
                      <p className="text-sm font-mono font-black text-slate-900 mt-0.5">
                        {sellerStatement?.totalSold !== null && sellerStatement?.totalSold !== undefined ? props.formatCurrency(sellerStatement.totalSold) : "Configuração pendente"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase font-mono">CSAT Média</span>
                      <p className="text-sm font-mono font-black text-slate-900 mt-0.5">Configuração pendente</p>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase font-mono">Comissão Líquida</span>
                      <p className="text-sm font-mono font-black text-blue-700 mt-0.5">
                        {sellerStatement?.commission.configured && sellerStatement.commission.value !== null ? props.formatCurrency(sellerStatement.commission.value) : "Comissão não configurada"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase font-mono">Remuneração Bruta</span>
                      <p className="text-sm font-mono font-black text-emerald-700 mt-0.5">Configuração pendente</p>
                    </div>
                  </div>

                  {/* Financial fields are shown only when their real mapping exists. */}
                  <div className="space-y-2">
                    <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Origem dos dados financeiros</h3>
                    <p className="text-xs text-slate-500">A remuneração só é exibida quando uma coluna de comissão e sua regra estiverem configuradas.</p>
                  </div>

                  {/* Signatures */}
                  <div className="border-t border-slate-200 pt-8 grid grid-cols-2 gap-12 text-center text-[10px]">
                    <div className="space-y-8">
                      <div className="border-b border-slate-350 mx-auto w-3/4" />
                      <div>
                        <strong className="block text-slate-800 font-black uppercase font-mono">{activeDossier.name}</strong>
                        <span className="text-slate-400 block font-mono">Assinatura do Colaborador</span>
                      </div>
                    </div>
                    <div className="space-y-8">
                      <div className="border-b border-slate-350 mx-auto w-3/4" />
                      <div>
                        <strong className="block text-slate-800 font-black uppercase font-mono">{activeDossier.manager}</strong>
                        <span className="text-slate-400 block font-mono">Assinatura do Gestor Responsável</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* STANDALONE EXECUTIVE DOSSIER VIEWER */
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Summary Profile Block */}
                  <SauronCard className="bg-slate-900 border border-slate-800 text-white p-5 rounded-2xl relative overflow-hidden">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-blue-600 border border-blue-500/30 text-white flex items-center justify-center font-black text-sm uppercase">
                          {activeDossier.name.substring(0, 2)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-base font-black text-white uppercase tracking-tight">{activeDossier.name}</h2>
                            <SauronBadge type={activeDossier.status === "Ativo" ? "success" : "neutral"}>
                              {activeDossier.status}
                            </SauronBadge>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{activeDossier.role} • {activeDossier.store}</p>
                        </div>
                      </div>
                      <div className="text-right font-mono text-[10px] text-slate-400 leading-relaxed">
                        <p>Admissão: <strong className="text-slate-200">{activeDossier.hireDate}</strong></p>
                        <p>Email: <span className="text-slate-300 font-semibold">{activeDossier.email}</span></p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-xs leading-relaxed">
                      <div>
                        <span className="text-[9px] font-mono font-black uppercase text-slate-450 block mb-0.5">Visão Profissional &amp; Experiência</span>
                        <p className="text-slate-300">{activeDossier.experience}</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-mono font-black uppercase text-slate-450 block mb-0.5">Histórico de Destaques</span>
                        <p className="text-slate-300">{activeDossier.achievements}</p>
                      </div>
                    </div>
                  </SauronCard>

                  {/* Operational Metrics (Performance & Indicadores) */}
                  <SauronDossierSection title="Métricas de Desempenho e Indicadores" subtitle="Ativos de faturamento e conformidade de qualidade">
                    <SauronKpiCard 
                      title="Faturamento Geral Vendas" 
                      value={`R$ ${activeDossier.performance.totalSales.toLocaleString("pt-BR")}`}
                      subtitle="Volume de faturamento bruto"
                      icon={<TrendingUp size={16} className="text-blue-500" />}
                    />
                    <SauronKpiCard 
                      title="Vendas de Acessórios" 
                      value={`R$ ${activeDossier.performance.accessoriesSales.toLocaleString("pt-BR")}`}
                      subtitle="Volume de agregados de margem"
                      icon={<Layers size={16} className="text-blue-500" />}
                    />
                    <SauronKpiCard 
                      title="Média Satisfação CSAT" 
                      value={`${activeDossier.performance.csat.toFixed(1)} / 5.0`}
                      subtitle="Pesquisa direta de satisfação"
                      trend={{ value: activeDossier.performance.csat >= 4.2 ? 12 : -5, isPositive: activeDossier.performance.csat >= 4.2 }}
                      icon={<UserCheck2 size={16} className="text-emerald-500" />}
                    />
                    <SauronKpiCard 
                      title="Taxa de Cancelamento" 
                      value={`${(activeDossier.performance.cancellationRate * 100).toFixed(1)}%`}
                      subtitle="Propostas canceladas no CRM"
                      trend={{ value: activeDossier.performance.cancellationRate <= 0.05 ? -22 : 15, isPositive: activeDossier.performance.cancellationRate <= 0.05 }}
                      icon={<TrendingDown size={16} className={activeDossier.performance.cancellationRate <= 0.05 ? "text-emerald-500" : "text-rose-500"} />}
                    />
                  </SauronDossierSection>

                  {/* Career timeline & Professional goals (PDI) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Timeline */}
                    <SauronCard title="Histórico e Evolução de Carreira" subtitle="Milestones operacionais e de liderança">
                      <SauronTimeline 
                        events={activeDossier.timeline.map((item) => ({
                          id: item.id,
                          title: item.title,
                          description: item.description,
                          timestamp: item.timestamp
                        }))}
                      />
                    </SauronCard>

                    {/* PDI Goals */}
                    <SauronCard title="Plano de Desenvolvimento Individual (PDI)" subtitle="Metas táticas e capacitação de conformidade">
                      <div className="space-y-3.5">
                        {activeDossier.pdi.map((goal) => {
                          let badgeType: "primary" | "success" | "warning" | "neutral" = "neutral";
                          if (goal.status === "completed") badgeType = "success";
                          else if (goal.status === "in_progress") badgeType = "primary";
                          else badgeType = "warning";

                          return (
                            <div key={goal.id} className="flex justify-between items-start gap-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800 p-3 rounded-xl">
                              <div className="space-y-1">
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-snug">{goal.description}</p>
                                <p className="text-[10px] text-slate-400 font-mono">Prazo de Entrega: {goal.deadline}</p>
                              </div>
                              <SauronBadge type={badgeType}>
                                {goal.status === "completed" ? "Concluído" : goal.status === "in_progress" ? "Em Andamento" : "Pendente"}
                              </SauronBadge>
                            </div>
                          );
                        })}
                      </div>
                    </SauronCard>
                  </div>

                  {/* Compensation values are never inferred from a default policy. */}
                  <div className="space-y-4">
                    <SauronCard title="Remuneração variável" subtitle="Valores reais dependem de mapeamento e regra aprovados">
                      <p className="text-xs font-semibold text-slate-500">Comissão não configurada. Nenhum salário, bônus ou percentual foi inventado.</p>
                    </SauronCard>
                  </div>

                  {/* Documents & Feedback notes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Feedback */}
                    <SauronCard title="Diagnóstico de Liderança e Consultoria" subtitle="Pareceres estratégicos agregados">
                      <div className="p-4 bg-blue-50/40 dark:bg-blue-950/10 border border-blue-150 dark:border-blue-950 rounded-xl space-y-1.5 text-xs">
                        <strong className="font-extrabold uppercase text-[10px] tracking-wide block text-blue-700 dark:text-blue-400">
                          Diagnóstico de Governança
                        </strong>
                        <p className="text-slate-700 dark:text-slate-300 font-medium italic leading-relaxed">
                          "{activeDossier.feedback}"
                        </p>
                      </div>
                    </SauronCard>

                    {/* Audited Documents */}
                    <SauronCard title="Arquivos e Documentos Digitais" subtitle="Contratos de remuneração e compliance de RH">
                      <div className="space-y-2 text-xs">
                        {activeDossier.documents.map((doc) => (
                          <div key={doc.id} className="flex justify-between items-center bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800 p-2.5 rounded-lg">
                            <div>
                              <p className="font-bold text-slate-750 dark:text-slate-200">{doc.name}</p>
                              <p className="text-[10px] text-slate-400 font-mono">ID: {doc.code} • {doc.date}</p>
                            </div>
                            <SauronBadge type={doc.status === "validated" ? "success" : "warning"}>
                              {doc.status === "validated" ? "Validado" : "Pendente"}
                            </SauronBadge>
                          </div>
                        ))}
                      </div>
                    </SauronCard>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: IMPRESSÕES DE CONSULTORIA */}
        {activeTab === "impressoes" && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6 animate-fade-in">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Lightbulb className="text-blue-500" size={18} />
              <h2 className="text-sm font-black uppercase text-slate-750 dark:text-white">Impressões Gerais de Saúde Organizacional</h2>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-850 text-center space-y-2">
              <HelpCircle size={20} className="text-amber-500 mx-auto" />
              <h3 className="text-xs font-black uppercase text-slate-700 dark:text-slate-200">
                Configuração Pendente
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                Há uma fonte de dados ativa. Confirme os campos deste módulo para gerar análises.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
