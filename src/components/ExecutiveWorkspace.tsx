/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import { 
  Building, 
  FolderPlus, 
  Sparkles, 
  SlidersHorizontal, 
  Settings, 
  HelpCircle, 
  LayoutGrid, 
  Check,
  Bell,
  Activity,
  ArrowRight,
  TrendingUp,
  X,
  Target,
  User,
  PanelRightClose,
  PanelRight,
  Info
} from "lucide-react";
import { DesignSystem } from "../design-system";
import { consultantWorkspaceManager } from "../modules/consultant-workspace/ConsultantWorkspaceManager";
import { WorkspaceProject } from "../modules/consultant-workspace/types";
import { layoutEngine } from "../core/layout/LayoutEngine";
import { widgetRegistry } from "../core/widgets/WidgetEngine";
import { identityEngine } from "../core/identity/IdentityEngine";
import { auditEngine } from "../core/audit/AuditEngine";
import { workspaceIntelligenceEngine } from "../core/workspace-intelligence/WorkspaceIntelligenceEngine";
import { WorkspaceContext, ContextTab, ContextRecommendation, ContextActivity } from "../core/workspace-intelligence/types";

// Import widgets to trigger self-registration
import "./ExecutiveWidgets";

interface ExecutiveWorkspaceProps {
  filteredData: any[];
  activeFiles: any[];
  onSelectTab: (tabId: string) => void;
  formatCurrency: (value: number) => string;
}

export const ExecutiveWorkspace: React.FC<ExecutiveWorkspaceProps> = ({
  filteredData,
  activeFiles,
  onSelectTab,
  formatCurrency
}) => {
  // --- States ---
  const [projects, setProjects] = useState<WorkspaceProject[]>([]);
  const [activeProject, setActiveProject] = useState<WorkspaceProject | null>(null);
  const [activePreset, setActivePreset] = useState<string>(layoutEngine.getActivePresetName());
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectGroup, setNewProjectGroup] = useState("");
  const [newProjectSegment, setNewProjectSegment] = useState("");

  // Context Engine integrations
  const [context, setContext] = useState<WorkspaceContext>(workspaceIntelligenceEngine.contextManager.getContext() || {
    currentUser: identityEngine.getCurrentUser(),
    currentOrganization: identityEngine.getCurrentOrganization(),
    currentCase: null,
    currentWorkspace: identityEngine.getCurrentWorkspace(),
    currentPeriod: { id: "junho_2026", name: "Junho/2026" },
    segmento: "Geral",
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
  });

  const [activeTabId, setActiveTabId] = useState("resumo");
  const [isPanelOpen, setIsPanelOpen] = useState(true);

  // Subscribe to context updates
  useEffect(() => {
    const unsub = workspaceIntelligenceEngine.contextManager.subscribe((newContext) => {
      setContext(newContext);
    });
    return unsub;
  }, []);

  const currentUser = context.currentUser;
  const currentOrg = context.currentOrganization;

  // --- Dynamic Widget Context ---
  const widgetContext = useMemo(() => ({
    filteredData,
    activeFiles,
    formatCurrency,
    onSelectTab,
    activeProject: context.currentCase ? { id: context.currentCase.id, client: context.currentCase.name } as any : activeProject,
    currentUser,
    context // Include full reactive context
  }), [filteredData, activeFiles, formatCurrency, onSelectTab, activeProject, currentUser, context]);

  // --- Load Workspace ---
  const loadWorkspace = async () => {
    let list = await consultantWorkspaceManager.listActiveProjects();
    if (list.length === 0) {
      const defaultProject = await consultantWorkspaceManager.createProject({
        client: "Grupo Comercial Alpha",
        group: "Grupo Alpha",
        segment: "Automotivo (Concessionárias)",
        companies: ["Alpha Nissan", "Alpha Renault"],
        brands: ["Nissan", "Renault"],
        cnpjs: ["00.123.456/0001-01"],
        dbConnections: [],
        spreadsheets: [],
        importProfile: null,
        filters: [],
        kpis: [],
        dashboards: [],
        presentations: [],
        actionPlans: [],
        observations: "Caso de consultoria padrão para o conselho exec.",
        history: [],
        auditLog: []
      });
      list = [defaultProject];
      await consultantWorkspaceManager.setActiveProject(defaultProject.id);
    }
    setProjects(list);
    const active = await consultantWorkspaceManager.getActiveProject();
    setActiveProject(active || list[0]);

    // Bootstrap context initially with active project
    const currentContext = workspaceIntelligenceEngine.contextManager.getContext();
    if (currentContext && !currentContext.currentCase && (active || list[0])) {
      const resolved = workspaceIntelligenceEngine.resolver.resolveContext(
        currentContext.currentUser,
        currentContext.currentOrganization,
        currentContext.currentWorkspace,
        active || list[0],
        currentContext.currentPeriod,
        currentContext.entidadeSelecionada,
        currentContext.filtrosAtivos,
        currentContext.fonteDeDadosAtiva
      );
      workspaceIntelligenceEngine.contextManager.setContext(resolved);
    }
  };

  useEffect(() => {
    loadWorkspace();
  }, []);

  const handleSelectProject = async (projectId: string) => {
    await consultantWorkspaceManager.setActiveProject(projectId);
    const proj = projects.find(p => p.id === projectId) || null;
    setActiveProject(proj);
    
    // Update context
    if (context) {
      const resolved = workspaceIntelligenceEngine.resolver.resolveContext(
        context.currentUser,
        context.currentOrganization,
        context.currentWorkspace,
        proj,
        context.currentPeriod,
        null, // clear selected entity
        context.filtrosAtivos,
        context.fonteDeDadosAtiva
      );
      workspaceIntelligenceEngine.contextManager.setContext(resolved);
    }
    auditEngine.logEvent("WORKSPACE_CHANGED", `Selecionou caso de consultoria ID: ${projectId}`, "INFO");
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName) return;

    const newProj = await consultantWorkspaceManager.createProject({
      client: newProjectName,
      group: newProjectGroup || "Grupo Geral",
      segment: newProjectSegment || "Geral",
      companies: [newProjectName],
      brands: [],
      cnpjs: [],
      dbConnections: [],
      spreadsheets: [],
      importProfile: null,
      filters: [],
      kpis: [],
      dashboards: [],
      presentations: [],
      actionPlans: [],
      observations: `Caso criado para ${newProjectName}.`,
      history: [],
      auditLog: []
    });

    setProjects(prev => [...prev, newProj]);
    setActiveProject(newProj);
    setIsCreatingProject(false);
    setNewProjectName("");
    setNewProjectGroup("");
    setNewProjectSegment("");

    // Update context
    if (context) {
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
    }
  };

  const handlePresetChange = (presetName: string) => {
    layoutEngine.setActivePreset(presetName);
    setActivePreset(presetName);
    auditEngine.logEvent("LAYOUT_CHANGED", `Alterou layout de visualização para: ${presetName}`, "INFO");
  };

  // Get Context Tabs
  const contextTabs = useMemo(() => {
    return workspaceIntelligenceEngine.tabs.getTabsForContext(context);
  }, [context]);

  // Sync tab selection to layout presets dynamically
  const handleTabSelect = (tabId: string) => {
    setActiveTabId(tabId);
    if (tabId === "resumo") {
      handlePresetChange("Diretoria");
    } else if (tabId === "financeiro") {
      handlePresetChange("Financeiro");
    } else if (tabId === "comercial") {
      handlePresetChange("Comercial");
    } else {
      handlePresetChange("Customizado");
    }
  };

  // Get Context Recommendations
  const recommendations = useMemo(() => {
    return workspaceIntelligenceEngine.recommendations.getRecommendationsForContext(context);
  }, [context]);

  // Get Context Activities
  const activities = useMemo(() => {
    return workspaceIntelligenceEngine.activities.getFilteredActivities(context);
  }, [context]);

  // --- Dynamic Grid Rendering of Enabled Widgets ---
  const activeLayout = useMemo(() => {
    return layoutEngine.getActiveLayout();
  }, [activePreset]);

  const renderedWidgets = useMemo(() => {
    return activeLayout.enabledWidgets.map(widgetId => {
      const widgetDef = widgetRegistry.getWidget(widgetId);
      if (!widgetDef) return null;

      const sizeClasses = {
        sm: "col-span-1",
        md: "col-span-1 lg:col-span-1",
        lg: "col-span-1 lg:col-span-2",
        full: "col-span-1 lg:col-span-3"
      };

      const WidgetComponent = widgetDef.component;

      return (
        <div key={widgetId} className={`${sizeClasses[widgetDef.defaultSize]} transition-all animate-fade-in`}>
          <WidgetComponent context={widgetContext} />
        </div>
      );
    }).filter(Boolean);
  }, [activeLayout, widgetContext]);

  return (
    <div className="space-y-6">
      
      {/* Dynamic Context Selector & Tab Control Center */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 p-4 border-b border-slate-100 dark:border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
              <Building size={18} />
            </div>
            <div>
              <p className={DesignSystem.Typography.caption}>Caso Ativo em Foco</p>
              <select
                value={activeProject?.id || ""}
                onChange={(e) => handleSelectProject(e.target.value)}
                className="bg-transparent font-extrabold text-sm text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer mt-0.5"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id} className="bg-slate-950 text-slate-100">
                    {p.group} — {p.client}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Actions & Panel Toggle */}
          <div className="flex flex-wrap items-center gap-2">
            {layoutEngine.getAllPresets().map((preset) => (
              <button
                key={preset.name}
                onClick={() => handlePresetChange(preset.name)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all border cursor-pointer ${
                  activePreset === preset.name
                    ? "bg-blue-600 border-blue-700 text-white shadow-sm"
                    : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/80"
                }`}
              >
                {preset.name}
              </button>
            ))}
            <button
              onClick={() => setIsCreatingProject(!isCreatingProject)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-[10px] uppercase rounded-lg border border-slate-250 dark:border-slate-700 cursor-pointer transition-all flex items-center gap-1"
            >
              <FolderPlus size={13} />
              <span>Novo Caso</span>
            </button>
            <button
              onClick={() => setIsPanelOpen(!isPanelOpen)}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              title={isPanelOpen ? "Fechar Painel de Contexto" : "Abrir Painel de Contexto"}
            >
              {isPanelOpen ? <PanelRightClose size={18} /> : <PanelRight size={18} />}
            </button>
          </div>
        </div>

        {/* Dynamic Context Tabs */}
        <div className="flex items-center gap-1 px-4 py-2 overflow-x-auto bg-slate-50/50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800/40">
          {contextTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabSelect(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTabId === tab.id
                  ? "bg-blue-600 text-white font-bold shadow-sm shadow-blue-600/10"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Case Creation Form */}
      {isCreatingProject && (
        <form onSubmit={handleCreateProject} className="p-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4 animate-fade-in">
          <p className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">Inicializar Novo Caso de Consultoria</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Nome do Cliente"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className={DesignSystem.Input.text}
              required
            />
            <input
              type="text"
              placeholder="Grupo Econômico (ex: Grupo Alpha)"
              value={newProjectGroup}
              onChange={(e) => setNewProjectGroup(e.target.value)}
              className={DesignSystem.Input.text}
            />
            <input
              type="text"
              placeholder="Segmento Industrial"
              value={newProjectSegment}
              onChange={(e) => setNewProjectSegment(e.target.value)}
              className={DesignSystem.Input.text}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreatingProject(false)}
              className="px-3 py-1.5 text-[10px] uppercase font-black text-slate-500 hover:text-slate-700"
            >
              Cancelar
            </button>
            <button type="submit" className={DesignSystem.Button.build("filled", "sm")}>
              Confirmar
            </button>
          </div>
        </form>
      )}

      {/* Main Command Center Layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* Left Side: Dynamic Grid Widgets (2/3 width or full width) */}
        <div className={`w-full ${isPanelOpen ? "lg:w-2/3 xl:w-3/4" : "w-full"} space-y-6`}>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {renderedWidgets.length === 0 ? (
              <div className="col-span-full py-16 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                <Info size={32} className="mx-auto text-slate-400 mb-2" />
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Nenhum widget ativo para o layout selecionado</h3>
                <p className="text-xs text-slate-500 mt-1">Troque de abas inteligentes para renderizar widgets táticos.</p>
              </div>
            ) : (
              renderedWidgets
            )}
          </div>
        </div>

        {/* Right Side: Collapsible Context Panel (1/3 width) */}
        {isPanelOpen && (
          <aside className="w-full lg:w-1/3 xl:w-1/4 bg-slate-900 border border-slate-800 rounded-2xl p-4 text-slate-300 space-y-5 shadow-sm shrink-0">
            
            {/* Header: Focus Entity status */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg">
                  <Target size={14} />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs text-white uppercase tracking-wider">Foco Contextual</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Sauron Operating Intelligence</p>
                </div>
              </div>
              {context.entidadeSelecionada && (
                <button
                  onClick={() => workspaceIntelligenceEngine.switchEntity(null)}
                  className="p-1 text-slate-500 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
                  title="Voltar para Visão Corporativa"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Selected Focus Overview */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
              {context.entidadeSelecionada ? (
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-extrabold text-blue-400 uppercase bg-blue-950 border border-blue-900 px-1.5 py-0.2 rounded">
                      {context.entidadeSelecionada.type}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500">ID: {context.entidadeSelecionada.id}</span>
                  </div>
                  <h4 className="font-bold text-sm text-white">{context.entidadeSelecionada.name}</h4>
                  
                  {context.entidadeSelecionada.type === "vendedor" && (
                    <div className="text-[10px] text-slate-400 space-y-1 pt-1.5 border-t border-slate-800/60 font-medium">
                      <p>• Função: {context.vendedor?.role}</p>
                      <p>• Loja: {context.loja}</p>
                      <p>• Período: {context.currentPeriod?.name}</p>
                    </div>
                  )}

                  {context.entidadeSelecionada.type === "company" && (
                    <div className="text-[10px] text-slate-400 space-y-1 pt-1.5 border-t border-slate-800/60 font-medium">
                      <p>• Segmento: {context.segmento}</p>
                      <p>• Grupo: {context.grupo}</p>
                      <p>• CNPJ: {context.CNPJ || "00.123.456/0001-01"}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  <h4 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Building size={12} className="text-slate-400" />
                    <span>Visão Corporativa</span>
                  </h4>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Exibindo consolidação macro de todas as unidades, marcas e consultores ativos do caso <strong>{context.currentCase?.name}</strong>.
                  </p>
                </div>
              )}
            </div>

            {/* Alertas & Recomendações */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Bell size={12} className="text-amber-500" />
                <span>Alertas & Recomendações ({recommendations.length})</span>
              </h4>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {recommendations.length === 0 ? (
                  <p className="text-[10px] text-slate-500 italic">Nenhum alerta para este contexto.</p>
                ) : (
                  recommendations.map(rec => (
                    <div 
                      key={rec.id} 
                      className={`p-2.5 rounded-xl border space-y-1.5 transition-all ${
                        rec.priority === "high" 
                          ? "bg-rose-950/20 border-rose-900/40 text-rose-200" 
                          : "bg-slate-950 border-slate-800/80 text-slate-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h5 className="font-bold text-xs leading-snug">{rec.title}</h5>
                        {rec.priority === "high" && <span className="text-[8px] bg-rose-900/60 text-rose-300 font-extrabold px-1 rounded uppercase tracking-wider">Alt</span>}
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed">{rec.description}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Atividade Recente */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Activity size={12} className="text-indigo-500" />
                <span>Histórico do Foco ({activities.length})</span>
              </h4>
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {activities.length === 0 ? (
                  <p className="text-[10px] text-slate-500 italic">Nenhuma atividade registrada.</p>
                ) : (
                  activities.map(act => (
                    <div key={act.id} className="text-[11px] border-l-2 border-slate-800 pl-3 py-0.5 space-y-1 relative">
                      <div className="absolute w-1.5 h-1.5 bg-slate-700 rounded-full -left-[4px] top-1.5" />
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-white text-[10px] uppercase tracking-wide truncate max-w-[150px]">{act.title}</span>
                        <span className="text-[8px] font-mono text-slate-500">
                          {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-normal">{act.description}</p>
                      <div className="flex items-center justify-between text-[9px] text-slate-500 pt-0.5 font-medium">
                        <span>Por: {act.user.name}</span>
                        <span className="opacity-80 lowercase italic font-mono">{act.category}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </aside>
        )}

      </div>
    </div>
  );
};
