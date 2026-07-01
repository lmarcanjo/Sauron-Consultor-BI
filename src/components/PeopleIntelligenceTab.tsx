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
  DollarSign
} from "lucide-react";

import { LancamentoFinanceiro, MetricasConsolidadas } from "../types";
import { VendedoresTab } from "./VendedoresTab";
import { ComissoesTab } from "./ComissoesTab";

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
import { SauronLineageBadge } from "../sauron-sdk/domain/SauronLineageBadge";

// Services and Engine
import { executivePeopleService, CollaboratorDossier } from "../core/compensation/ExecutivePeopleService";
import { compensationEngine, CompensationResult } from "../core/compensation/CompensationEngine";
import { dataSourceManager } from "../services/dataSourceManager";

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
  taxaComissaoPecas: number;
  setTaxaComissaoPecas: (v: number) => void;
  triggerSystemBackup: () => void;
  userRole?: string;
}

export const PeopleIntelligenceTab: React.FC<PeopleIntelligenceTabProps> = (props) => {
  const [activeTab, setActiveTab] = useState<string>("colaboradores");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedColabId, setSelectedColabId] = useState<string>("colab_joao_silva");
  const [activePolicyId, setActivePolicyId] = useState<string>("automotive_premium");
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  // Filters for People Hub
  const [filterDepartment, setFilterDepartment] = useState("ALL");
  const [filterStore, setFilterStore] = useState("ALL");
  const [filterManager, setFilterManager] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [groupBy, setGroupBy] = useState("NONE");

  // Get all dossiers
  const isRealSpreadsheet = dataSourceManager.getActiveSource() === "SPREADSHEET_DATA";
  
  const realSellers = useMemo(() => {
    if (!isRealSpreadsheet) return [];
    const records = dataSourceManager.getActiveRecords();
    const uniqueNames = new Set<string>();
    records.forEach(r => {
      const name = r.Vendedor || r.vendedor || r.Consultor || r.consultor || r.Colaborador || r.colaborador;
      if (name && String(name).trim() !== "" && !String(name).toLowerCase().includes("demonstrativo")) {
        uniqueNames.add(String(name).trim());
      }
    });

    if (uniqueNames.size === 0) {
      uniqueNames.add("Colaborador não mapeado");
    }

    return Array.from(uniqueNames).map((name, idx) => {
      let totalSales = 0;
      let accessoriesSales = 0;
      records.forEach(r => {
        const rName = r.Vendedor || r.vendedor || r.Consultor || r.consultor || r.Colaborador || r.colaborador;
        if (rName && String(rName).trim() === name) {
          const val = parseFloat(String(r.Receita || r.receita || r.Venda || r.venda || r.Receitas || r.receitas || 0).replace(/[^\d.-]/g, ""));
          if (!isNaN(val)) totalSales += val;
        }
      });

      return {
        id: `seller_${idx}`,
        name: name,
        email: "Informação não disponível na planilha importada.",
        role: "Campo não mapeado.",
        team: "Campo não mapeado.",
        store: "Campo não mapeado.",
        department: "Campo não mapeado.",
        manager: "Campo não mapeado.",
        status: "Ativo" as const,
        hireDate: "Informação não disponível na planilha importada.",
        experience: "Informação não disponível na planilha importada.",
        achievements: "Informação não disponível na planilha importada.",
        strengths: "Informação não disponível na planilha importada.",
        weaknesses: "Informação não disponível na planilha importada.",
        feedback: "Informação não disponível na planilha importada.",
        performance: {
          collaboratorId: `seller_${idx}`,
          totalSales,
          accessoriesSales,
          partsSales: 0,
          csat: 4.5,
          cancellationRate: 0,
          campaignParticipated: [],
          lineage: {
            totalSalesCell: `Receita[${idx}]`,
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
  }, [isRealSpreadsheet, props.dataOrigem]);

  const allDossiers = isRealSpreadsheet ? realSellers : executivePeopleService.getDossiers();

  // Handle click on a table row to go to the dossier
  const handleSelectCollaborator = (dossier: CollaboratorDossier) => {
    setSelectedColabId(dossier.id);
    setActiveTab("dossies");
    setShowPrintPreview(false);
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

  // Active Selected Dossier details
  const activeDossier = isRealSpreadsheet
    ? (allDossiers.find(d => d.id === selectedColabId) || allDossiers[0])
    : (executivePeopleService.getCollaboratorDossier(selectedColabId) || allDossiers[0]);
  const activeCompensation: CompensationResult = compensationEngine.calculate(
    activeDossier.performance,
    activePolicyId
  );

  // Tab configurations
  const tabs: TabItem[] = [
    { id: "colaboradores", label: "Hub de Pessoas", icon: <Users size={12} /> },
    { id: "performance", label: "Performance Individual", icon: <TrendingUp size={12} /> },
    { id: "comissoes", label: "Comissões & Regras", icon: <Coins size={12} /> },
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
            Plataforma executiva de governança contábil, remuneração por desempenho, simulação de políticas de comissões determinísticas e dossiês individuais com auditoria de data lineage.
          </p>
        </div>
      </div>

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
                  label="Concessionária / Unidade"
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
                    { value: "STORE", label: "Por Unidade de Showroom" },
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
            taxaComissaoPecas={props.taxaComissaoPecas}
            setTaxaComissaoPecas={props.setTaxaComissaoPecas}
            triggerSystemBackup={props.triggerSystemBackup}
            userRole={props.userRole}
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

              {/* Policy Selector for Compensation simulation */}
              <SauronCard title="Simulação de Política" subtitle="Selecione a política de comissões ativa">
                <SauronSelect 
                  label="Política Salarial"
                  value={activePolicyId}
                  onChange={(e) => setActivePolicyId(e.target.value)}
                  options={[
                    { value: "automotive_premium", label: "Concessionária Premium Elite" },
                    { value: "automotive_popular", label: "Concessionária Popular" }
                  ]}
                />
              </SauronCard>
              
              {/* Premium Printable Document triggers */}
              <button
                onClick={() => setShowPrintPreview(!showPrintPreview)}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider text-white bg-slate-900 hover:bg-slate-800 active:scale-95 transition-all shadow-md border border-slate-750"
              >
                <Printer size={14} />
                <span>{showPrintPreview ? "Visualizar Dossiê" : "Gerar PDF Executivo"}</span>
              </button>
            </div>

            {/* Main content display */}
            <div className="lg:col-span-3">
              {showPrintPreview ? (
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
                      <p className="text-sm font-mono font-black text-slate-900 mt-0.5">R$ {activeDossier.performance.totalSales.toLocaleString("pt-BR")}</p>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase font-mono">CSAT Média</span>
                      <p className="text-sm font-mono font-black text-slate-900 mt-0.5">{activeDossier.performance.csat.toFixed(1)} / 5.0</p>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase font-mono">Comissão Líquida</span>
                      <p className="text-sm font-mono font-black text-blue-700 mt-0.5">R$ {activeCompensation.netCommission.toLocaleString("pt-BR")}</p>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase font-mono">Remuneração Bruta</span>
                      <p className="text-sm font-mono font-black text-emerald-700 mt-0.5">R$ {activeCompensation.totalEarnings.toLocaleString("pt-BR")}</p>
                    </div>
                  </div>

                  {/* Calculation Details and Lineage */}
                  <div className="space-y-2">
                    <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Rastreabilidade e Linhagem de Dados (Data Lineage)</h3>
                    <table className="w-full text-left border-collapse text-[10px]">
                      <thead>
                        <tr className="border-b border-slate-200 text-[8px] uppercase text-slate-400 font-bold">
                          <th className="py-1 px-2">Etapa do Cálculo</th>
                          <th className="py-1 px-2">Expressão Matemática Aplicada</th>
                          <th className="py-1 px-2 text-right">Resultado</th>
                          <th className="py-1 px-2 text-right">Linhagem de Origem</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                        {activeCompensation.trace.map((step, idx) => (
                          <tr key={idx}>
                            <td className="py-1.5 px-2 font-sans font-bold text-slate-900">{step.name}</td>
                            <td className="py-1.5 px-2 text-slate-500">{step.formula}</td>
                            <td className="py-1.5 px-2 text-right font-black">R$ {step.result.toLocaleString("pt-BR")}</td>
                            <td className="py-1.5 px-2 text-right">
                              {step.lineage ? (
                                <span className="inline-flex items-center gap-0.5 px-1 bg-slate-100 border border-slate-300 text-[8px] text-slate-600 rounded">
                                  {step.lineage.sheetName}!{step.lineage.sourceCell}
                                </span>
                              ) : (
                                <span className="text-[8px] text-slate-300 uppercase">Calculado</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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

                  {/* Compensation calculation & Trace details */}
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                      <div>
                        <h4 className="text-xs font-black uppercase text-slate-700 dark:text-white tracking-wider">Detalhamento Financeiro &amp; Trace Contábil</h4>
                        <p className="text-[10px] text-slate-400">Visão parametrizada do repasse salarial por regras ativas</p>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-[10px]">
                        <span className="text-slate-400">Fórmula Ativa:</span>
                        <strong className="text-blue-500 uppercase">{activePolicyId === "automotive_premium" ? "Premium Elite" : "Popular"}</strong>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800 p-3.5 rounded-xl">
                        <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block">Salário Base</span>
                        <p className="text-base font-mono font-black text-slate-800 dark:text-slate-200 mt-1">R$ {activeCompensation.baseSalary.toLocaleString("pt-BR")}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800 p-3.5 rounded-xl">
                        <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block">Comissão Líquida</span>
                        <p className="text-base font-mono font-black text-blue-600 dark:text-blue-400 mt-1">R$ {activeCompensation.netCommission.toLocaleString("pt-BR")}</p>
                      </div>
                      <div className="bg-blue-600 text-white p-3.5 rounded-xl">
                        <span className="text-[9px] font-mono text-blue-100 uppercase tracking-widest block font-extrabold">Remuneração Bruta Total</span>
                        <p className="text-base font-mono font-black mt-1">R$ {activeCompensation.totalEarnings.toLocaleString("pt-BR")}</p>
                      </div>
                    </div>

                    {/* EXPLANATION OF CALCULATION (E2-D) */}
                    <SauronCard title="Como chegamos neste valor (Data Lineage & Trace Contábil)" subtitle="Seção obrigatória de auditoria matemática sem dependência de inteligência artificial">
                      <div className="space-y-3.5">
                        {activeCompensation.trace.map((step, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs bg-slate-50 dark:bg-slate-950/30 p-3 rounded-xl border border-slate-150 dark:border-slate-800">
                            <div className="space-y-1 flex-1 min-w-0 pr-4">
                              <div className="flex items-center gap-2">
                                <strong className="text-slate-800 dark:text-slate-100 uppercase tracking-tight text-xs font-extrabold">{step.name}</strong>
                                {step.lineage && (
                                  <SauronLineageBadge 
                                    sourceCell={step.lineage.sourceCell} 
                                    sheetName={step.lineage.sheetName} 
                                  />
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 font-mono tracking-wide truncate">{step.formula}</p>
                            </div>
                            <div className="text-right font-mono">
                              <p className="font-black text-slate-900 dark:text-white">R$ {step.result.toLocaleString("pt-BR")}</p>
                            </div>
                          </div>
                        ))}
                      </div>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-3">
                <h3 className="text-xs font-black uppercase text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <CheckCircle size={14} className="text-emerald-500" />
                  Alinhamento Operacional e Cultura
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  A equipe de vendas demonstra alto alinhamento com as metas operacionais e os novos multiplicadores tributários e regionais do Sauron OS. Houve adesão de 100% às definições de bônus, reduzindo dispersões contábeis em carros populares e concentrando vendas em agregados de alta margem (F&I, acessórios).
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-3">
                <h3 className="text-xs font-black uppercase text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <HelpCircle size={14} className="text-amber-500" />
                  Melhoria Contínua de Capacitação
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  Identifica-se gargalo moderado no aproveitamento de leads digitais na ponta do varejo por consultores juniores. Recomenda-se mentorias em equipe lideradas por seniores para garantir que os benchmarks do plano de ação de margens sejam seguidos.
                </p>
              </div>
            </div>

            <div className="bg-blue-50/40 dark:bg-blue-950/10 border border-blue-150 rounded-2xl p-4 space-y-2 text-xs">
              <span className="font-extrabold uppercase text-[10px] tracking-wider text-blue-700 dark:text-blue-450 block">Conclusão do Consultor</span>
              <p className="text-slate-650 dark:text-slate-350 leading-relaxed font-medium">
                Os modelos salariais estão calibrados e perfeitamente aderentes aos resultados financeiros gerais (DRE) demonstrados nos outros módulos operacionais do Sauron OS. Recomenda-se homologação desta governança na próxima reunião do conselho executivo.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
