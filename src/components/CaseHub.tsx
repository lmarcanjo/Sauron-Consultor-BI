/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import { CaseHubHeader } from "./CaseHubHeader";
import { CaseContextTabs } from "./CaseContextTabs";
import { CaseOverviewPanel } from "./CaseOverviewPanel";
import { CaseDossierPanel } from "./CaseDossierPanel";
import { CaseHistoryPanel } from "./CaseHistoryPanel";
import { CaseDataPanel } from "./CaseDataPanel";
import { CasePeoplePanel } from "./CasePeoplePanel";
import { CasePlansPanel } from "./CasePlansPanel";

import { CentralDadosTab } from "./CentralDadosTab";
import { IntelligentDRETab } from "./IntelligentDRETab";
import { ComercialTab } from "./ComercialTab";
import { MeetingModePage } from "./MeetingModePage";
import { PresentationBuilderPage } from "./PresentationBuilderPage";

import { consultantWorkspaceManager } from "../modules/consultant-workspace/ConsultantWorkspaceManager";
import { WorkspaceProject } from "../modules/consultant-workspace/types";
import { workspaceIntelligenceEngine } from "../core/workspace-intelligence/WorkspaceIntelligenceEngine";
import { WorkspaceContext } from "../core/workspace-intelligence/types";
import { workspaceDNAEngine } from "../core/workspace-intelligence/WorkspaceDNAEngine";
import { caseDossierEngine, CaseDossierReport } from "../core/workspace-intelligence/CaseDossierEngine";
import { caseHistoryEngine, CaseHistoryEvent } from "../core/workspace-intelligence/CaseHistoryEngine";

// Static Default Fallback Context
const DEFAULT_CONTEXT: WorkspaceContext = {
  currentUser: { id: "u_1", name: "Lennon Marcanjo", role: "Super Admin", permissions: [] } as any,
  currentOrganization: { id: "org_1", name: "Arcanjo Consulting" } as any,
  currentCase: null,
  currentWorkspace: { id: "ws_1", name: "Sauron Core Workspace" } as any,
  currentPeriod: { id: "junho_2026", name: "Junho/2026" },
  segmento: "Automotivo", grupo: "Corporativo", empresa: null, CNPJ: null, marca: null, loja: null,
  departamento: null, centroDeCusto: null, vendedor: null, permissions: [], filtrosAtivos: {},
  fonteDeDadosAtiva: "DEMO_DATA", modoDemoReal: "demo", escopoDeAcesso: "global", entidadeSelecionada: null
} as WorkspaceContext;

// Default Bootstrap Project Layout
const BOOTSTRAP_PROJECT_METADATA = {
  client: "Grupo Comercial Alpha", group: "Grupo Alpha", segment: "Automotivo",
  companies: ["Alpha Nissan", "Alpha Renault"], brands: ["Nissan", "Renault"], cnpjs: ["00.123.456/0001-01"],
  dbConnections: [], spreadsheets: [], importProfile: null, filters: [],
  kpis: [
    { id: "k1", name: "Volume Bruto Geral", target: 3850000 },
    { id: "k2", name: "Margem F&I", target: 35 }
  ],
  dashboards: [], presentations: [],
  actionPlans: [
    { id: "p1", description: "Otimizar mix de comissionamento de vendas da unidade Nissan", priority: "high", responsible: "Carlos Santos", deadline: "30/06/2026", status: "pending", origin: "KPI" },
    { id: "p2", description: "Lançar campanha de captação de pós-venda para inativos de 2 anos", priority: "medium", responsible: "Ana Paula Silva", deadline: "15/07/2026", status: "in-progress", origin: "Anomalia" }
  ],
  observations: "Caso de consultoria padrão para o conselho exec.", history: [], auditLog: []
};

interface CaseHubProps {
  filteredData: any[];
  activeFiles: any[];
  onSelectTab: (tabId: string) => void;
  formatCurrency: (value: number) => string;
  onDataLoaded?: (data: any[], sourceName: string) => void;
}

export const CaseHub: React.FC<CaseHubProps> = ({
  filteredData,
  activeFiles,
  formatCurrency,
  onDataLoaded
}) => {
  const [projects, setProjects] = useState<WorkspaceProject[]>([]);
  const [activeProject, setActiveProject] = useState<WorkspaceProject | null>(null);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectGroup, setNewProjectGroup] = useState("");
  const [newProjectSegment, setNewProjectSegment] = useState("Automotivo");
  const [activeTabId, setActiveTabId] = useState<string>("resumo");
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(true);
  const [dossierLog, setDossierLog] = useState<CaseDossierReport | null>(null);
  const [historyEvents, setHistoryEvents] = useState<CaseHistoryEvent[]>([]);

  const [context, setContext] = useState<WorkspaceContext>(() => 
    workspaceIntelligenceEngine.contextManager.getContext() || DEFAULT_CONTEXT
  );

  const dummyMetrics = useMemo(() => ({
    receitaTotal: filteredData.reduce((sum, d) => sum + (d.Receita || 0), 0) || 5400000,
    custoTotal: filteredData.reduce((sum, d) => sum + (d.Custo || 0), 0) || 3800000,
    despesaTotal: filteredData.reduce((sum, d) => sum + (d.Despesa || 0), 0) || 1100000,
    lucroTotal: 500000, margemMedia: 9.2, porMarca: [], porCnpj: [], porRazao: [], porMes: []
  }), [filteredData]);

  useEffect(() => {
    const unsub = workspaceIntelligenceEngine.contextManager.subscribe(setContext);
    const handleSwitchTab = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) setActiveTabId(customEvent.detail);
    };
    window.addEventListener("sauron:switch-case-tab", handleSwitchTab);
    return () => {
      unsub();
      window.removeEventListener("sauron:switch-case-tab", handleSwitchTab);
    };
  }, []);

  const loadWorkspace = async () => {
    let list = await consultantWorkspaceManager.listActiveProjects();
    if (list.length === 0) {
      const defaultProject = await consultantWorkspaceManager.createProject(BOOTSTRAP_PROJECT_METADATA as any);
      list = [defaultProject];
      await consultantWorkspaceManager.setActiveProject(defaultProject.id);
    }
    setProjects(list);
    const active = await consultantWorkspaceManager.getActiveProject();
    const proj = active || list[0];
    setActiveProject(proj);

    const currentContext = workspaceIntelligenceEngine.contextManager.getContext() || context;
    const resolved = workspaceIntelligenceEngine.resolver.resolveContext(
      currentContext.currentUser, currentContext.currentOrganization, currentContext.currentWorkspace,
      proj, currentContext.currentPeriod, currentContext.entidadeSelecionada, currentContext.filtrosAtivos,
      currentContext.fonteDeDadosAtiva
    );
    workspaceIntelligenceEngine.contextManager.setContext(resolved);

    if (proj) {
      setDossierLog(caseDossierEngine.generateDossier(proj));
      setHistoryEvents(caseHistoryEngine.getEventsForCase(proj.id));
    }
  };

  useEffect(() => { loadWorkspace(); }, []);

  useEffect(() => {
    if (activeProject) {
      setDossierLog(caseDossierEngine.generateDossier(activeProject));
      setHistoryEvents(caseHistoryEngine.getEventsForCase(activeProject.id));
    }
  }, [activeProject, activeTabId]);

  const dnaSuggestions = useMemo(() => workspaceDNAEngine.getSuggestions(context), [context]);

  const handleSelectCase = async (projectId: string) => {
    await consultantWorkspaceManager.setActiveProject(projectId);
    const proj = projects.find(p => p.id === projectId) || null;
    setActiveProject(proj);

    const resolved = workspaceIntelligenceEngine.resolver.resolveContext(
      context.currentUser, context.currentOrganization, context.currentWorkspace,
      proj, context.currentPeriod, null, context.filtrosAtivos, context.fonteDeDadosAtiva
    );
    workspaceIntelligenceEngine.contextManager.setContext(resolved);
  };

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName) return;

    const newProj = await consultantWorkspaceManager.createProject({
      client: newProjectName, group: newProjectGroup || "Grupo Geral", segment: newProjectSegment,
      companies: [newProjectName], brands: [], cnpjs: [], dbConnections: [], spreadsheets: [],
      importProfile: null, filters: [], kpis: [{ id: `k_${Date.now()}`, name: "Margem Operacional de Produção", target: 45 }],
      dashboards: [], presentations: [], actionPlans: [], observations: `Caso inicializado para ${newProjectName}.`,
      history: [], auditLog: []
    });

    setProjects(prev => [...prev, newProj]);
    setActiveProject(newProj);
    setIsCreatingProject(false);
    setNewProjectName("");
    setNewProjectGroup("");

    const resolved = workspaceIntelligenceEngine.resolver.resolveContext(
      context.currentUser, context.currentOrganization, context.currentWorkspace,
      newProj, context.currentPeriod, null, context.filtrosAtivos, context.fonteDeDadosAtiva
    );
    workspaceIntelligenceEngine.contextManager.setContext(resolved);

    caseHistoryEngine.logNarrativeEvent(
      newProj.id, "Dados importados",
      `Novo caso de consultoria "${newProj.client}" inicializado. DNA de ${newProjectSegment} ativado.`,
      "data_imported"
    );
  };

  const widgetContext = useMemo(() => ({
    filteredData, activeFiles, formatCurrency, onSelectTab: setActiveTabId,
    activeProject: activeProject ? { id: activeProject.id, client: activeProject.client } as any : null,
    currentUser: context.currentUser, context
  }), [filteredData, activeFiles, formatCurrency, activeProject, context]);

  return (
    <div className="space-y-6">
      <CaseHubHeader
        projects={projects} activeProject={activeProject} onSelectCase={handleSelectCase}
        isCreatingProject={isCreatingProject} setIsCreatingProject={setIsCreatingProject}
        newProjectName={newProjectName} setNewProjectName={setNewProjectName}
        newProjectGroup={newProjectGroup} setNewProjectGroup={setNewProjectGroup}
        newProjectSegment={newProjectSegment} setNewProjectSegment={setNewProjectSegment}
        handleCreateCase={handleCreateCase} isPanelOpen={isPanelOpen} setIsPanelOpen={setIsPanelOpen}
      />

      <CaseContextTabs activeTabId={activeTabId} setActiveTabId={setActiveTabId} />

      <div className="flex flex-col lg:flex-row gap-6">
        <div className={`w-full ${isPanelOpen ? "lg:w-2/3 xl:w-3/4" : "w-full"} space-y-6`}>
          {activeTabId === "resumo" && (
            <CaseOverviewPanel widgetContext={widgetContext} dnaSuggestions={dnaSuggestions} activeProject={activeProject} />
          )}

          {activeTabId === "dados" && (
            <CentralDadosTab dataOrigem={filteredData} onDataLoaded={onDataLoaded || (() => {})} currentSource="Conexão de Dados Ativa" camposAusentes={[]} />
          )}

          {activeTabId === "financeiro" && (
            <div className="space-y-6">
              <IntelligentDRETab filteredData={filteredData} formatCurrency={formatCurrency} activeIndustryTemplateId={activeProject?.segment.toLowerCase() || "automotive"} />
            </div>
          )}

          {activeTabId === "comercial" && (
            <ComercialTab metrics={dummyMetrics as any} formatCurrency={formatCurrency} />
          )}

          {activeTabId === "pessoas" && (
            <CasePeoplePanel filteredData={filteredData} formatCurrency={formatCurrency} dummyMetrics={dummyMetrics} />
          )}

          {activeTabId === "reunioes" && (
            <MeetingModePage
              onExit={() => setActiveTabId("resumo")} activeProject={activeProject}
              onUpdateProject={async (updatedProj) => {
                await consultantWorkspaceManager.updateProject(updatedProj);
                setActiveProject(updatedProj);
                setProjects(prev => prev.map(p => p.id === updatedProj.id ? updatedProj : p));
              }}
              filteredData={filteredData} formatCurrency={formatCurrency} widgetContext={widgetContext}
            />
          )}

          {activeTabId === "planos" && <CasePlansPanel filteredData={filteredData} />}

          {activeTabId === "apresentacoes" && (
            <PresentationBuilderPage dataOrigem={filteredData} filteredData={filteredData} formatCurrency={formatCurrency} metrics={dummyMetrics as any} />
          )}

          {activeTabId === "dossie" && dossierLog && <CaseDossierPanel dossierLog={dossierLog} />}

          {activeTabId === "historico" && <CaseHistoryPanel historyEvents={historyEvents} />}
        </div>

        {isPanelOpen && <CaseDataPanel context={context} dnaSuggestions={dnaSuggestions} />}
      </div>
    </div>
  );
};
