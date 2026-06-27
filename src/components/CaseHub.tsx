/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import {
  Building, FolderPlus, Sparkles, SlidersHorizontal, Settings, HelpCircle,
  LayoutGrid, Check, Bell, Activity, ArrowRight, TrendingUp, TrendingDown, X, Target, User,
  PanelRightClose, PanelRight, Info, FileText, Calendar, ShieldCheck, Database,
  ShoppingBag, Plus, ClipboardList, CheckCircle2, ChevronRight, Play, Wrench,
  Users, Trash2, Sprout, Ship, Factory, Award, AlertTriangle, MessageSquare, Briefcase
} from "lucide-react";
import { DesignSystem } from "../design-system";
import { consultantWorkspaceManager } from "../modules/consultant-workspace/ConsultantWorkspaceManager";
import { WorkspaceProject, ActionPlan, Meeting } from "../modules/consultant-workspace/types";
import { workspaceIntelligenceEngine } from "../core/workspace-intelligence/WorkspaceIntelligenceEngine";
import { WorkspaceContext } from "../core/workspace-intelligence/types";
import { workspaceDNAEngine, DNASuggestions } from "../core/workspace-intelligence/WorkspaceDNAEngine";
import { caseDossierEngine, CaseDossierReport } from "../core/workspace-intelligence/CaseDossierEngine";
import { caseHistoryEngine, CaseHistoryEvent } from "../core/workspace-intelligence/CaseHistoryEngine";
import { peopleManager } from "../modules/people/PeopleManager";
import { ExecutiveBriefWidget, ClientPulseWidget } from "./ExecutiveWidgets";
import { KpiCard } from "./KpiCard";

// Modular sector views reuse (we can import them or render them in context)
import { CentralDadosTab } from "./CentralDadosTab";
import { IntelligentDRETab } from "./IntelligentDRETab";
import { ComercialTab } from "./ComercialTab";
import { PeopleIntelligenceTab } from "./PeopleIntelligenceTab";
import { MeetingModePage } from "./MeetingModePage";
import { ConsultorAreaTab } from "./ConsultorAreaTab";
import { PresentationBuilderPage } from "./PresentationBuilderPage";

interface CaseHubProps {
  filteredData: any[];
  activeFiles: any[];
  onSelectTab: (tabId: string) => void;
  formatCurrency: (value: number) => string;
}

export const CaseHub: React.FC<CaseHubProps> = ({
  filteredData,
  activeFiles,
  onSelectTab,
  formatCurrency
}) => {
  // --- Core States ---
  const [projects, setProjects] = useState<WorkspaceProject[]>([]);
  const [activeProject, setActiveProject] = useState<WorkspaceProject | null>(null);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectGroup, setNewProjectGroup] = useState("");
  const [newProjectSegment, setNewProjectSegment] = useState("Automotivo");

  // Context Engine Integration
  const [context, setContext] = useState<WorkspaceContext>(() => {
    const ctx = workspaceIntelligenceEngine.contextManager.getContext();
    if (ctx) return ctx;
    // Fallback if not bootstrapped
    return {
      currentUser: { id: "u_1", name: "Lennon Marcanjo", role: "Super Admin", permissions: [] } as any,
      currentOrganization: { id: "org_1", name: "Arcanjo Consulting" } as any,
      currentCase: null,
      currentWorkspace: { id: "ws_1", name: "Sauron Core Workspace" } as any,
      currentPeriod: { id: "junho_2026", name: "Junho/2026" },
      segmento: "Automotivo",
      grupo: "Corporativo",
      empresa: null,
      CNPJ: null,
      marca: null,
      loja: null,
      departamento: null,
      centroDeCusto: null,
      vendedor: null,
      permissions: [],
      filtrosAtivos: {},
      fonteDeDadosAtiva: "DEMO_DATA",
      modoDemoReal: "demo",
      escopoDeAcesso: "global",
      entidadeSelecionada: null
    } as WorkspaceContext;
  });

  const [activeTabId, setActiveTabId] = useState<string>("resumo");
  // States for PeopleIntelligenceTab
  const [clientSegment, setClientSegment] = useState<string>("Automotivo");
  const [managerNotes, setManagerNotes] = useState<string>("");
  const [faturamentoOffset, setFaturamentoOffset] = useState<number>(0);
  const [despesaOffset, setDespesaOffset] = useState<number>(0);
  const [narrarFeedback, setNarrarFeedback] = useState<boolean>(true);
  const [comissaoFormula, setComissaoFormula] = useState<string>("Fórmula Padrão");
  const [comissaoGeral, setComissaoGeral] = useState<number>(1.5);
  const [comissaoAcessorios, setComissaoAcessorios] = useState<number>(2.0);
  const [comissaoVeiculos, setComissaoVeiculos] = useState<number>(1.0);

  // Shared type-safe MetricasConsolidadas helper
  const dummyMetrics: any = useMemo(() => {
    return {
      receitaTotal: filteredData.reduce((sum, d) => sum + (d.Receita || 0), 0) || 5400000,
      custoTotal: filteredData.reduce((sum, d) => sum + (d.Custo || 0), 0) || 3800000,
      despesaTotal: filteredData.reduce((sum, d) => sum + (d.Despesa || 0), 0) || 1100000,
      lucroTotal: 500000,
      margemMedia: 9.2,
      porMarca: [] as any[],
      porCnpj: [] as any[],
      porRazao: [] as any[],
      porMes: [] as any[]
    };
  }, [filteredData]);

  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(true);
  const [dossierLog, setDossierLog] = useState<CaseDossierReport | null>(null);
  const [historyEvents, setHistoryEvents] = useState<CaseHistoryEvent[]>([]);

  // Subscribe to contextual system updates
  useEffect(() => {
    const unsub = workspaceIntelligenceEngine.contextManager.subscribe((newContext) => {
      setContext(newContext);
    });

    const handleSwitchTab = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        setActiveTabId(customEvent.detail);
      }
    };

    window.addEventListener("sauron:switch-case-tab", handleSwitchTab);

    return () => {
      unsub();
      window.removeEventListener("sauron:switch-case-tab", handleSwitchTab);
    };
  }, []);

  // Fetch projects & bootstrap default on mount
  const loadWorkspace = async () => {
    let list = await consultantWorkspaceManager.listActiveProjects();
    if (list.length === 0) {
      const defaultProject = await consultantWorkspaceManager.createProject({
        client: "Grupo Comercial Alpha",
        group: "Grupo Alpha",
        segment: "Automotivo",
        companies: ["Alpha Nissan", "Alpha Renault"],
        brands: ["Nissan", "Renault"],
        cnpjs: ["00.123.456/0001-01"],
        dbConnections: [],
        spreadsheets: [],
        importProfile: null,
        filters: [],
        kpis: [
          { id: "k1", name: "Volume Bruto Geral", target: 3850000 },
          { id: "k2", name: "Margem F&I", target: 35 }
        ],
        dashboards: [],
        presentations: [],
        actionPlans: [
          { id: "p1", description: "Otimizar mix de comissionamento de vendas da unidade Nissan", priority: "high", responsible: "Carlos Santos", deadline: "30/06/2026", status: "pending", origin: "KPI" },
          { id: "p2", description: "Lançar campanha de captação de pós-venda para inativos de 2 anos", priority: "medium", responsible: "Ana Paula Silva", deadline: "15/07/2026", status: "in-progress", origin: "Anomalia" }
        ],
        observations: "Caso de consultoria padrão para o conselho exec.",
        history: [],
        auditLog: []
      });
      list = [defaultProject];
      await consultantWorkspaceManager.setActiveProject(defaultProject.id);
    }
    setProjects(list);
    const active = await consultantWorkspaceManager.getActiveProject();
    const proj = active || list[0];
    setActiveProject(proj);

    // Bootstrap context initially
    const currentContext = workspaceIntelligenceEngine.contextManager.getContext();
    const resolved = workspaceIntelligenceEngine.resolver.resolveContext(
      currentContext?.currentUser || context.currentUser,
      currentContext?.currentOrganization || context.currentOrganization,
      currentContext?.currentWorkspace || context.currentWorkspace,
      proj,
      currentContext?.currentPeriod || context.currentPeriod,
      currentContext?.entidadeSelecionada || null,
      currentContext?.filtrosAtivos || {},
      currentContext?.fonteDeDadosAtiva || "DEMO_DATA"
    );
    workspaceIntelligenceEngine.contextManager.setContext(resolved);

    // Update Dossier & History
    if (proj) {
      setDossierLog(caseDossierEngine.generateDossier(proj));
      setHistoryEvents(caseHistoryEngine.getEventsForCase(proj.id));
    }
  };

  useEffect(() => {
    loadWorkspace();
  }, []);

  // Update dynamic dossier and history whenever project changes or tab selects
  useEffect(() => {
    if (activeProject) {
      setDossierLog(caseDossierEngine.generateDossier(activeProject));
      setHistoryEvents(caseHistoryEngine.getEventsForCase(activeProject.id));
    }
  }, [activeProject, activeTabId]);

  // DNA Suggestions based on Case Industry
  const dnaSuggestions = useMemo<DNASuggestions>(() => {
    return workspaceDNAEngine.getSuggestions(context);
  }, [context]);

  const handleSelectCase = async (projectId: string) => {
    await consultantWorkspaceManager.setActiveProject(projectId);
    const proj = projects.find(p => p.id === projectId) || null;
    setActiveProject(proj);

    const resolved = workspaceIntelligenceEngine.resolver.resolveContext(
      context.currentUser,
      context.currentOrganization,
      context.currentWorkspace,
      proj,
      context.currentPeriod,
      null, // clear selection on change
      context.filtrosAtivos,
      context.fonteDeDadosAtiva
    );
    workspaceIntelligenceEngine.contextManager.setContext(resolved);
  };

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName) return;

    const newProj = await consultantWorkspaceManager.createProject({
      client: newProjectName,
      group: newProjectGroup || "Grupo Geral",
      segment: newProjectSegment,
      companies: [newProjectName],
      brands: [],
      cnpjs: [],
      dbConnections: [],
      spreadsheets: [],
      importProfile: null,
      filters: [],
      kpis: [
        { id: `k_${Date.now()}`, name: "Margem Operacional de Produção", target: 45 }
      ],
      dashboards: [],
      presentations: [],
      actionPlans: [],
      observations: `Caso inicializado para ${newProjectName}.`,
      history: [],
      auditLog: []
    });

    setProjects(prev => [...prev, newProj]);
    setActiveProject(newProj);
    setIsCreatingProject(false);
    setNewProjectName("");
    setNewProjectGroup("");

    const resolved = workspaceIntelligenceEngine.resolver.resolveContext(
      context.currentUser,
      context.currentOrganization,
      context.currentWorkspace,
      newProj,
      context.currentPeriod,
      null,
      context.filtrosAtivos,
      context.fonteDeDadosAtiva
    );
    workspaceIntelligenceEngine.contextManager.setContext(resolved);

    caseHistoryEngine.logNarrativeEvent(
      newProj.id,
      "Dados importados",
      `Novo caso de consultoria "${newProj.client}" inicializado. DNA de ${newProjectSegment} ativado.`,
      "data_imported"
    );
  };

  // Build the unified layout context object passed to legacy components
  const widgetContext = useMemo(() => ({
    filteredData,
    activeFiles,
    formatCurrency,
    onSelectTab: (tab: string) => setActiveTabId(tab),
    activeProject: activeProject ? { id: activeProject.id, client: activeProject.client } as any : null,
    currentUser: context.currentUser,
    context
  }), [filteredData, activeFiles, formatCurrency, activeProject, context]);

  return (
    <div className="space-y-6">
      
      {/* 1. Header: Command Center / Active Case Selection */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600/10 text-blue-500 rounded-xl">
            <Building size={20} />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-blue-500 tracking-wider">Centro de Comando do Caso</span>
            <div className="flex items-center gap-2 mt-0.5">
              <select
                value={activeProject?.id || ""}
                onChange={(e) => handleSelectCase(e.target.value)}
                className="bg-transparent font-extrabold text-lg text-slate-800 dark:text-white focus:outline-none cursor-pointer"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                    {p.client} ({p.segment})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsCreatingProject(!isCreatingProject)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
          >
            <FolderPlus size={14} />
            <span>Novo Caso</span>
          </button>
          <button
            onClick={() => setIsPanelOpen(!isPanelOpen)}
            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
            title={isPanelOpen ? "Fechar Painel" : "Abrir Painel"}
          >
            {isPanelOpen ? <PanelRightClose size={18} /> : <PanelRight size={18} />}
          </button>
        </div>
      </div>

      {/* Case Creation Drawer/Modal */}
      {isCreatingProject && (
        <form onSubmit={handleCreateCase} className="p-6 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4 animate-fade-in">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">Inicializar Novo Caso de Consultoria</h3>
            <button type="button" onClick={() => setIsCreatingProject(false)} className="text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Nome do Cliente</label>
              <input
                type="text"
                placeholder="Ex: Grupo Auto Líder"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className={DesignSystem.Input.text}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Grupo Econômico</label>
              <input
                type="text"
                placeholder="Ex: Auto Líder S/A"
                value={newProjectGroup}
                onChange={(e) => setNewProjectGroup(e.target.value)}
                className={DesignSystem.Input.text}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Segmento (DNA do Caso)</label>
              <select
                value={newProjectSegment}
                onChange={(e) => setNewProjectSegment(e.target.value)}
                className={DesignSystem.Input.text}
              >
                <option value="Automotivo">Automotivo</option>
                <option value="Agro">Agro</option>
                <option value="Indústria">Indústria</option>
                <option value="Serviços">Serviços</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsCreatingProject(false)}
              className="px-4 py-2 text-xs uppercase font-bold text-slate-500 hover:text-slate-700"
            >
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase rounded-xl">
              Inicializar Caso
            </button>
          </div>
        </form>
      )}

      {/* 2. Case Context Navigation Tabs */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-2xs overflow-x-auto flex gap-1">
        {[
          { id: "resumo", label: "Resumo do Caso", icon: LayoutGrid },
          { id: "dados", label: "Dados Conectados", icon: Database },
          { id: "financeiro", label: "Financeiro & DRE", icon: TrendingUp },
          { id: "comercial", label: "Comercial", icon: ShoppingBag },
          { id: "pessoas", label: "Pessoas / Performance", icon: Users },
          { id: "reunioes", label: "Reuniões", icon: ClipboardList },
          { id: "planos", label: "Planos Táticos", icon: Target },
          { id: "apresentacoes", label: "Apresentações", icon: Sparkles },
          { id: "dossie", label: "Dossiê do Caso", icon: FileText },
          { id: "historico", label: "História do Caso", icon: Activity }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTabId === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 hover:text-slate-800 dark:hover:text-white"
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Main Workspace Split Layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Left Side: Contextual Content Area */}
        <div className={`w-full ${isPanelOpen ? "lg:w-2/3 xl:w-3/4" : "w-full"} space-y-6`}>
          
          {/* TAB: Resumo (Case Overview) */}
          {activeTabId === "resumo" && (
            <div className="space-y-6">
              
              {/* Executive Brief Widget */}
              <ExecutiveBriefWidget context={widgetContext} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Visual Widget: Maturity Index (IMO) */}
                <div className={DesignSystem.Card.container}>
                  <div className={DesignSystem.Card.header}>
                    <span className="text-xs font-black uppercase text-slate-800 dark:text-slate-200">
                      Índice de Maturidade Operacional (IMO)
                    </span>
                  </div>
                  <div className="p-5 flex flex-col items-center justify-center text-center space-y-3">
                    <div className="relative w-28 h-28 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="56" cy="56" r="48" className="stroke-slate-100 dark:stroke-slate-850 fill-none" strokeWidth="8" />
                        <circle cx="56" cy="56" r="48" className="stroke-blue-600 fill-none" strokeWidth="8" strokeDasharray="301.6" strokeDashoffset={301.6 * (1 - 0.78)} strokeLinecap="round" />
                      </svg>
                      <span className="absolute text-2xl font-black text-slate-800 dark:text-white">78%</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Nível Saudável / Em Consolidação</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Atingimento de rituais e consistência de dados em nível elevado.</p>
                    </div>
                  </div>
                </div>

                {/* Client Pulse Widget */}
                <ClientPulseWidget context={widgetContext} />

              </div>

              {/* Strategic KPIs & Decisions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* KPIs Estratégicos */}
                <div className="md:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
                  <h3 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200">KPIs Estratégicos</h3>
                  <div className="space-y-3">
                    {dnaSuggestions.kpis.map((kpi, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{kpi.name}</span>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-black text-slate-800 dark:text-white">{kpi.target}</span>
                          <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/20">Ativo</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Centro de Decisões */}
                <div className="md:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
                  <h3 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200">Centro de Decisões</h3>
                  {activeProject?.meetings && activeProject.meetings.length > 0 ? (
                    <div className="space-y-3">
                      {activeProject.meetings.map((m, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl space-y-1">
                          <div className="flex items-center gap-1.5 text-[9px] font-bold text-blue-400 uppercase">
                            <ClipboardList size={10} />
                            <span>Sessão Aprovada</span>
                          </div>
                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">
                            {m.decisions || "Aprovação do teto de compras de estoque."}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      Nenhuma decisão registrada ainda.
                    </div>
                  )}
                </div>

                {/* Próximas Ações */}
                <div className="md:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
                  <h3 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200">Próximas Ações</h3>
                  {activeProject?.actionPlans && activeProject.actionPlans.length > 0 ? (
                    <div className="space-y-2.5">
                      {activeProject.actionPlans.slice(0, 3).map((p, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs">
                          <CheckCircle2 size={13} className="text-blue-500 mt-0.5 shrink-0" />
                          <div className="space-y-0.5">
                            <p className="font-semibold text-slate-700 dark:text-slate-300">{p.description}</p>
                            <p className="text-[10px] text-slate-500 font-mono">Prazo: {p.deadline} • Resp: {p.responsible}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      Nenhuma ação tática pendente.
                    </div>
                  )}
                </div>

              </div>

              {/* Status dos Dados & Teaser Sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Status dos Dados */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
                  <h3 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Database size={13} className="text-blue-500" />
                    <span>Status de Integração de Dados</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Última sincronização de dados estruturados com as filiais locais:
                  </p>
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Conexão Estável</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">DEMO_DATA Ativo</span>
                  </div>
                </div>

                {/* Narrativa & Rituais Recomendados */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
                  <h3 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Sparkles size={13} className="text-amber-500" />
                    <span>Rituais Recomendados (DNA)</span>
                  </h3>
                  <div className="space-y-2">
                    {dnaSuggestions.rituais.map((rit, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-slate-700 dark:text-slate-300">{rit.name}</p>
                          <p className="text-[10px] text-slate-500">{rit.description}</p>
                        </div>
                        <span className="text-[9px] font-mono bg-blue-150 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded shrink-0">{rit.frequency}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB: Dados */}
          {activeTabId === "dados" && (
            <CentralDadosTab
              dataOrigem={filteredData}
              onDataLoaded={() => {}}
              currentSource="Conexão de Dados Ativa"
              camposAusentes={[]}
            />
          )}

          {/* TAB: Financeiro */}
          {activeTabId === "financeiro" && (
            <div className="space-y-6">
              <IntelligentDRETab 
                filteredData={filteredData} 
                formatCurrency={formatCurrency} 
                activeIndustryTemplateId={activeProject?.segment.toLowerCase() || "automotive"} 
              />
            </div>
          )}

          {/* TAB: Comercial */}
          {activeTabId === "comercial" && (
            <ComercialTab 
              metrics={dummyMetrics as any} 
              formatCurrency={formatCurrency} 
            />
          )}

          {/* TAB: Pessoas / Performance */}
          {activeTabId === "pessoas" && (
            <PeopleIntelligenceTab 
              dataOrigem={filteredData} 
              formatCurrency={formatCurrency} 
              metrics={dummyMetrics as any}
              calculatedCommissions={{
                regraAtiva: comissaoFormula,
                totalGeralComissao: 35000,
                detailsByCnpj: [],
                detalhePorConta: []
              }}
              segmentoCliente={clientSegment}
              setSegmentoCliente={setClientSegment}
              observacaoGerente={managerNotes}
              setObservacaoGerente={setManagerNotes}
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
              triggerSystemBackup={() => {}}
            />
          )}

          {/* TAB: Reuniões */}
          {activeTabId === "reunioes" && (
            <MeetingModePage onExit={() => setActiveTabId("resumo")} />
          )}

          {/* TAB: Planos Táticos */}
          {activeTabId === "planos" && (
            <ConsultorAreaTab
              dataOrigem={filteredData}
            />
          )}

          {/* TAB: Apresentações */}
          {activeTabId === "apresentacoes" && (
            <PresentationBuilderPage 
              dataOrigem={filteredData}
              filteredData={filteredData}
              formatCurrency={formatCurrency}
              metrics={dummyMetrics as any}
            />
          )}

          {/* TAB: Dossiê do Caso */}
          {activeTabId === "dossie" && dossierLog && (
            <div className="space-y-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xs">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 dark:border-slate-800/80 pb-4 gap-2">
                <div>
                  <h2 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                    <FileText size={18} className="text-blue-500" />
                    <span>Dossiê Consolidado de Desempenho</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Relatório analítico dinâmico agregando todos os ativos estruturais do caso.</p>
                </div>
                <span className="text-[10px] font-mono bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded">
                  Gerado em: {new Date(dossierLog.generatedAt).toLocaleDateString()}
                </span>
              </div>

              {/* Informações Gerais */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl">
                  <span className="text-[9px] font-black uppercase text-slate-400">Cliente</span>
                  <p className="text-xs font-bold text-slate-800 dark:text-white mt-0.5">{dossierLog.client}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl">
                  <span className="text-[9px] font-black uppercase text-slate-400">Grupo Econômico</span>
                  <p className="text-xs font-bold text-slate-800 dark:text-white mt-0.5">{dossierLog.group}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl">
                  <span className="text-[9px] font-black uppercase text-slate-400">Segmento do Caso</span>
                  <p className="text-xs font-bold text-slate-800 dark:text-white mt-0.5">{dossierLog.segment}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl">
                  <span className="text-[9px] font-black uppercase text-slate-400">Rastreabilidade / Origem</span>
                  <p className="text-xs font-bold text-slate-800 dark:text-white mt-0.5 truncate">{dossierLog.dataSourceTrace}</p>
                </div>
              </div>

              {/* Grid of aggregated indicators */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Ativos de Dados e Metas */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800/60 pb-1.5">Unidades & Contratos</h3>
                  <div className="space-y-2">
                    <p className="text-xs text-slate-500 font-medium">Empresas e CNPJs cobertos:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {dossierLog.companies.map((c, i) => (
                        <span key={i} className="text-[10px] font-bold bg-slate-100 dark:bg-slate-850 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded">
                          {c}
                        </span>
                      ))}
                      {dossierLog.cnpjs.length > 0 ? dossierLog.cnpjs.map((cnpj, i) => (
                        <span key={i} className="text-[10px] font-mono bg-slate-100 dark:bg-slate-850 text-slate-500 px-2.5 py-1 rounded">
                          {cnpj}
                        </span>
                      )) : (
                        <span className="text-[10px] font-mono text-slate-400">Sem CNPJs adicionais</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <p className="text-xs text-slate-500 font-medium">Fontes de Dados Conectadas:</p>
                    {dossierLog.connectedDataSources.length > 0 ? (
                      <div className="space-y-1.5">
                        {dossierLog.connectedDataSources.map((src, i) => (
                          <div key={i} className="flex justify-between items-center text-xs p-2 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-lg">
                            <span className="font-bold text-slate-700 dark:text-slate-300">{src.name}</span>
                            <span className="text-[10px] font-mono bg-blue-100/50 dark:bg-blue-900/10 text-blue-500 px-1.5 py-0.5 rounded">{src.type}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-50 dark:bg-slate-950 text-center text-xs text-slate-500 rounded-lg">
                        Nenhuma fonte externa conectada. Utilizando base padrão.
                      </div>
                    )}
                  </div>
                </div>

                {/* Performance de Pessoas e Consultores */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800/60 pb-1.5">Equipes & Pessoas</h3>
                  <div className="space-y-2">
                    <p className="text-xs text-slate-500 font-medium">Consultores e Colaboradores em Destaque:</p>
                    <div className="space-y-2">
                      {dossierLog.people.employees.map((emp) => (
                        <div key={emp.id} className="flex justify-between items-center text-xs p-2 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-lg">
                          <div>
                            <p className="font-bold text-slate-700 dark:text-slate-300">{emp.fullName}</p>
                            <p className="text-[10px] text-slate-500">{emp.role} • {emp.branch}</p>
                          </div>
                          <span className="text-[10px] bg-emerald-500/15 text-emerald-500 px-2 py-0.5 rounded font-black uppercase">Ativo</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

              {/* Relação de Rituais e Decisões */}
              <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 space-y-3">
                <h3 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200">Decisões Administrativas Registradas</h3>
                {dossierLog.decisions.length > 0 ? (
                  <ul className="space-y-2">
                    {dossierLog.decisions.map((dec, idx) => (
                      <li key={idx} className="flex gap-2 items-start text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        <CheckCircle2 size={13} className="text-blue-500 mt-0.5 shrink-0" />
                        <span>{dec}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-500 italic">Nenhuma decisão registrada formalmente em atas.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB: História do Caso */}
          {activeTabId === "historico" && (
            <div className="space-y-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xs">
              <div className="border-b border-slate-100 dark:border-slate-800/80 pb-4">
                <h2 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                  <Activity size={18} className="text-blue-500" />
                  <span>História do Caso de Consultoria</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Narrativa cronológica de rituais, marcos executivos e conquistas operacionais.</p>
              </div>

              {/* Timeline layout */}
              <div className="relative pl-6 space-y-6 border-l-2 border-slate-150 dark:border-slate-800">
                {historyEvents.map((evt) => {
                  let badgeColor = "bg-blue-500";
                  if (evt.category === "anomaly_detected") badgeColor = "bg-rose-500";
                  if (evt.category === "commission_approved") badgeColor = "bg-emerald-500";
                  if (evt.category === "metric_achieved") badgeColor = "bg-amber-500";

                  return (
                    <div key={evt.id} className="relative animate-fade-in">
                      {/* Timeline Dot */}
                      <span className={`absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 ${badgeColor}`} />
                      
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <h4 className="text-sm font-extrabold text-slate-800 dark:text-white">{evt.title}</h4>
                          <span className="text-[10px] font-mono text-slate-500 bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded">
                            {evt.formattedTime}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                          {evt.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Right Side: Focus Sidebar Panel */}
        {isPanelOpen && (
          <aside className="w-full lg:w-1/3 xl:w-1/4 bg-slate-900 border border-slate-800 rounded-2xl p-4 text-slate-300 space-y-5 shadow-sm shrink-0">
            
            {/* Header: Focus Entity status */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg">
                  <Target size={14} />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs text-white uppercase tracking-wider">DNA do Caso</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Ritos & Alertas de Segmento</p>
                </div>
              </div>
              {context.entidadeSelecionada && (
                <button
                  onClick={() => workspaceIntelligenceEngine.switchEntity(null)}
                  className="p-1 text-slate-500 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
                  title="Limpar seleção"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Industry Segment DNA */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-extrabold text-blue-400 uppercase bg-blue-950 border border-blue-900 px-2 py-0.5 rounded">
                  {dnaSuggestions.segmentName}
                </span>
                <span className="text-[9px] font-mono text-slate-500">Workspace DNA</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-normal">
                Sugerindo tabulações, alertas, ações táticas e KPIs calibrados para o segmento <strong>{dnaSuggestions.segmentName}</strong>.
              </p>
            </div>

            {/* DNA-based Alertas */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Bell size={12} className="text-amber-500" />
                <span>Alertas de Negócio</span>
              </h4>
              <div className="space-y-2.5">
                {dnaSuggestions.alertas.map((al, i) => {
                  const isHigh = al.priority === "high";
                  return (
                    <div key={i} className="p-2.5 bg-slate-950 rounded-lg border border-slate-850/80 text-[11px] leading-relaxed relative overflow-hidden">
                      <div className={`absolute top-0 left-0 w-1 h-full ${isHigh ? "bg-rose-500" : "bg-amber-500"}`} />
                      <p className="font-bold text-white pl-1">{al.title}</p>
                      <p className="text-slate-400 mt-0.5 pl-1">{al.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* DNA-based Ações Recomendadas */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Award size={12} className="text-blue-400" />
                <span>Ações Recomendadas</span>
              </h4>
              <div className="space-y-2">
                {dnaSuggestions.acoesRecomendadas.map((act, i) => (
                  <div key={i} className="p-2.5 bg-slate-950 rounded-lg border border-slate-850/80 text-[11px] space-y-1">
                    <p className="font-bold text-slate-200">{act.label}</p>
                    <p className="text-slate-400 leading-normal">{act.description}</p>
                  </div>
                ))}
              </div>
            </div>

          </aside>
        )}

      </div>

    </div>
  );
};
