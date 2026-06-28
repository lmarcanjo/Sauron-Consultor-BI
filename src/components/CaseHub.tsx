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
import { CaseTabs } from "./CaseTabs";
import { CaseOverview } from "./CaseOverview";
import { CaseDossierPanel } from "./CaseDossierPanel";
import { CaseHistoryPanel } from "./CaseHistoryPanel";
import { CaseDataPanel } from "./CaseDataPanel";
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
      <CaseTabs activeTabId={activeTabId} setActiveTabId={setActiveTabId} />

      {/* 3. Main Workspace Split Layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Left Side: Contextual Content Area */}
        <div className={`w-full ${isPanelOpen ? "lg:w-2/3 xl:w-3/4" : "w-full"} space-y-6`}>
          
          {/* TAB: Resumo (Case Overview) */}
          {activeTabId === "resumo" && (
            <CaseOverview 
              widgetContext={widgetContext} 
              dnaSuggestions={dnaSuggestions} 
              activeProject={activeProject} 
            />
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
            <MeetingModePage 
              onExit={() => setActiveTabId("resumo")} 
              activeProject={activeProject}
              onUpdateProject={async (updatedProj) => {
                await consultantWorkspaceManager.updateProject(updatedProj);
                setActiveProject(updatedProj);
                setProjects(prev => prev.map(p => p.id === updatedProj.id ? updatedProj : p));
              }}
              filteredData={filteredData}
              formatCurrency={formatCurrency}
              widgetContext={widgetContext}
            />
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
            <CaseDossierPanel dossierLog={dossierLog} />
          )}

          {/* TAB: História do Caso */}
          {activeTabId === "historico" && (
            <CaseHistoryPanel historyEvents={historyEvents} />
          )}

        </div>

        {/* Right Side: Focus Sidebar Panel */}
        {isPanelOpen && (
          <CaseDataPanel context={context} dnaSuggestions={dnaSuggestions} />
        )}

      </div>

    </div>
  );
};
