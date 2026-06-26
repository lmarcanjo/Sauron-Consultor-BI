import React, { useState, useEffect, useMemo } from "react";
import {
  FolderOpen,
  FolderPlus,
  TrendingUp,
  Building,
  Users,
  Database,
  Shield,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plus,
  Trash2,
  Calendar,
  Briefcase,
  Layers,
  ArrowRight,
  Sparkles,
  Award,
  BookOpen,
  Check
} from "lucide-react";
import { consultantWorkspaceManager } from "../modules/consultant-workspace/ConsultantWorkspaceManager";
import { WorkspaceProject, ActionPlan, Meeting } from "../modules/consultant-workspace/types";
import { analyticsEngine } from "../core/analytics/AnalyticsEngine";
import { presentationEngine } from "../core/presentation/PresentationEngine";
import { dataEngine } from "../core/data/DataEngine";
import { auditEngine } from "../core/audit/AuditEngine";

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
  // --- Workspace & Project State ---
  const [projects, setProjects] = useState<WorkspaceProject[]>([]);
  const [activeProject, setActiveProject] = useState<WorkspaceProject | null>(null);
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  // --- Project Creation Form States ---
  const [newClient, setNewClient] = useState("");
  const [newGroup, setNewGroup] = useState("");
  const [newSegment, setNewSegment] = useState("Automotivo");
  const [newCompanies, setNewCompanies] = useState("");
  const [newBrands, setNewBrands] = useState("");
  const [newCnpjs, setNewCnpjs] = useState("");

  // --- Quick Action Plan State ---
  const [newActionDescription, setNewActionDescription] = useState("");
  const [newActionPriority, setNewActionPriority] = useState<"low" | "medium" | "high">("medium");
  const [newActionResponsible, setNewActionResponsible] = useState("");
  const [newActionDeadline, setNewActionDeadline] = useState("");

  // --- Quick Meeting State ---
  const [isSchedulingMeeting, setIsSchedulingMeeting] = useState(false);
  const [newMeetingResponsible, setNewMeetingResponsible] = useState("");
  const [newMeetingObservations, setNewMeetingObservations] = useState("");

  // --- Load Data ---
  const loadWorkspace = async () => {
    const list = await consultantWorkspaceManager.listActiveProjects();
    setProjects(list);
    const active = await consultantWorkspaceManager.getActiveProject();
    if (active) {
      setActiveProject(active);
    } else if (list.length > 0) {
      // If no active project, set the first one as active automatically
      await consultantWorkspaceManager.setActiveProject(list[0].id);
      setActiveProject(list[0]);
    } else {
      setActiveProject(null);
    }
  };

  useEffect(() => {
    loadWorkspace();
  }, []);

  // --- Actions ---
  const handleSelectProject = async (projectId: string) => {
    await consultantWorkspaceManager.setActiveProject(projectId);
    const project = await consultantWorkspaceManager.getActiveProject();
    setActiveProject(project);
    auditEngine.logEvent(
      "PROJECT_CHANGE",
      `Alterou para o projeto do cliente: ${project?.client}`,
      "INFO",
      { projectId }
    );
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.trim() || !newSegment.trim()) return;

    const companiesArr = newCompanies.split(",").map(c => c.trim()).filter(Boolean);
    const brandsArr = newBrands.split(",").map(b => b.trim()).filter(Boolean);
    const cnpjsArr = newCnpjs.split(",").map(c => c.trim()).filter(Boolean);

    const projectData = {
      client: newClient,
      group: newGroup || "Grupo Geral",
      segment: newSegment,
      companies: companiesArr,
      brands: brandsArr,
      cnpjs: cnpjsArr,
      dbConnections: [],
      spreadsheets: [],
      importProfile: null,
      filters: [],
      kpis: [],
      dashboards: [],
      presentations: [],
      actionPlans: [],
      observations: "",
      history: [],
      auditLog: []
    };

    const created = await consultantWorkspaceManager.createProject(projectData);
    await consultantWorkspaceManager.setActiveProject(created.id);
    
    // Log project creation event
    auditEngine.logEvent(
      "PROJECT_CREATE",
      `Criou um novo projeto de consultoria para o cliente: ${newClient}`,
      "INFO",
      { projectId: created.id }
    );

    // Reset Form
    setNewClient("");
    setNewGroup("");
    setNewCompanies("");
    setNewBrands("");
    setNewCnpjs("");
    setIsCreatingProject(false);
    
    // Refresh List
    await loadWorkspace();
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!window.confirm("Deseja realmente remover este projeto? Esta ação é irreversível.")) return;
    
    const p = projects.find(proj => proj.id === projectId);
    await consultantWorkspaceManager.deleteProject(projectId);
    auditEngine.logEvent(
      "PROJECT_DELETE",
      `Excluiu o projeto de consultoria do cliente: ${p?.client}`,
      "WARNING",
      { projectId }
    );

    await loadWorkspace();
  };

  const handleAddActionPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject || !newActionDescription.trim() || !newActionResponsible.trim()) return;

    const newPlan: ActionPlan = {
      id: `plan_${Date.now()}`,
      description: newActionDescription,
      priority: newActionPriority,
      responsible: newActionResponsible,
      deadline: newActionDeadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      status: "pending",
      origin: "Executive Workspace Hub"
    };

    const updatedProject = {
      ...activeProject,
      actionPlans: [...activeProject.actionPlans, newPlan]
    };

    await consultantWorkspaceManager.updateProject(updatedProject);
    auditEngine.logEvent(
      "ACTION_PLAN_CREATE",
      `Adicionou novo plano de ação: "${newActionDescription}" para ${newActionResponsible}`,
      "INFO",
      { projectId: activeProject.id }
    );

    setNewActionDescription("");
    setNewActionResponsible("");
    setNewActionDeadline("");
    setNewActionPriority("medium");

    await loadWorkspace();
  };

  const handleToggleActionPlanStatus = async (planId: string) => {
    if (!activeProject) return;

    const updatedPlans = activeProject.actionPlans.map(plan => {
      if (plan.id === planId) {
        const nextStatus: "pending" | "in-progress" | "completed" = 
          plan.status === "pending" ? "in-progress" : 
          plan.status === "in-progress" ? "completed" : "pending";
        
        auditEngine.logEvent(
          "ACTION_PLAN_UPDATE",
          `Alterou status da tarefa "${plan.description}" para: ${nextStatus}`,
          "INFO",
          { planId, nextStatus }
        );

        return { ...plan, status: nextStatus };
      }
      return plan;
    });

    const updatedProject = {
      ...activeProject,
      actionPlans: updatedPlans
    };

    await consultantWorkspaceManager.updateProject(updatedProject);
    await loadWorkspace();
  };

  const handleRemoveActionPlan = async (planId: string) => {
    if (!activeProject) return;

    const updatedPlans = activeProject.actionPlans.filter(p => p.id !== planId);
    const updatedProject = {
      ...activeProject,
      actionPlans: updatedPlans
    };

    await consultantWorkspaceManager.updateProject(updatedProject);
    auditEngine.logEvent(
      "ACTION_PLAN_DELETE",
      `Removeu o plano de ação id: ${planId}`,
      "WARNING",
      { projectId: activeProject.id }
    );

    await loadWorkspace();
  };

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject || !newMeetingResponsible.trim()) return;

    const newMeeting: Meeting = {
      id: `meet_${Date.now()}`,
      presentationId: activeProject.presentations[0]?.id || "pres_default",
      selectedCharts: [],
      observations: newMeetingObservations,
      decisions: "Discussão de resultados e plano de ação estruturado.",
      actionPlans: activeProject.actionPlans.filter(p => p.status === "pending"),
      responsible: newMeetingResponsible,
      pendingItems: []
    };

    await consultantWorkspaceManager.saveMeeting(activeProject.id, newMeeting);
    auditEngine.logEvent(
      "MEETING_SCHEDULE",
      `Agendou reunião estratégica com o consultor responsável: ${newMeetingResponsible}`,
      "INFO",
      { projectId: activeProject.id }
    );

    setNewMeetingResponsible("");
    setNewMeetingObservations("");
    setIsSchedulingMeeting(false);

    await loadWorkspace();
  };

  // --- Seed Demo Project ---
  const handleSeedDemoProject = async () => {
    const demoProject = {
      client: "Grupo Concessionárias Norte",
      group: "Norte Holding S/A",
      segment: "Automotivo",
      companies: ["Norte Veículos", "Norte Peças", "Norte Oficina"],
      brands: ["Fiat", "Jeep"],
      cnpjs: ["01.234.567/0001-89", "01.234.567/0002-90"],
      dbConnections: [{ id: "db_1", name: "ERP Central ReadOnly", host: "10.0.0.45" }],
      spreadsheets: [{ id: "sh_1", name: "DRE_Consolidado_Maio_2026.xlsx", path: "/imports/dre.xlsx" }],
      importProfile: { id: "p_1", name: "Layout Concessionária Padrão", rules: {} },
      filters: [{ id: "f_1", name: "Filtro Automotivo Principal", expression: "Marca == Fiat" }],
      kpis: [{ id: "k_1", name: "Margem Alvo", target: 12 }],
      dashboards: [{ id: "d_1", name: "Dashboard Executivo Comercial", layout: {} }],
      presentations: [{ id: "pres_demo", name: "Fechamento Controladoria Maio 2026", slides: [1, 2, 3] }],
      actionPlans: [
        {
          id: "plan_demo_1",
          description: "Reduzir despesas administrativas da Norte Oficina em 10%",
          priority: "high" as const,
          responsible: "Carlos Silveira (Consultor)",
          deadline: "2026-07-15",
          status: "in-progress" as const,
          origin: "Análise de Anomalias de Custo"
        },
        {
          id: "plan_demo_2",
          description: "Reestruturar comissionamento dos vendedores de veículos novos",
          priority: "medium" as const,
          responsible: "Roberto Dias (Gerente Comercial)",
          deadline: "2026-07-20",
          status: "pending" as const,
          origin: "Relatório de Eficiência Comercial"
        }
      ],
      meetings: [
        {
          id: "meet_demo_1",
          presentationId: "pres_demo",
          selectedCharts: [],
          observations: "Reunião preliminar de alinhamento com a presidência do Grupo Norte.",
          decisions: "Definição de cronograma de auditoria interna dos lotes contábeis.",
          actionPlans: [],
          responsible: "Carlos Silveira",
          pendingItems: ["Aprovação final do DRE gerencial"]
        }
      ],
      observations: "Cliente focado em reestruturação operacional e controle de estoque de peças.",
      history: [],
      auditLog: []
    };

    const created = await consultantWorkspaceManager.createProject(demoProject);
    await consultantWorkspaceManager.setActiveProject(created.id);
    auditEngine.logEvent(
      "PROJECT_CREATE",
      `Criou o projeto demonstrativo Grupo Concessionárias Norte`,
      "INFO",
      { projectId: created.id }
    );
    await loadWorkspace();
  };

  // --- Dynamic Calculation of Health Score (0-100) ---
  const healthScore = useMemo(() => {
    if (!activeProject) return { total: 0, data: 0, filters: 0, kpis: 0, pres: 0, plans: 0 };

    // 1. Dados (25%): Se tem spreadsheets ou dbConnections
    const hasData = activeProject.spreadsheets.length > 0 || activeProject.dbConnections.length > 0 || filteredData.length > 0;
    const dataScore = hasData ? 100 : 0;

    // 2. Filtros (20%): Se filtros do projeto estão populados ou se filtros na UI estão configurados
    const hasFilters = activeProject.filters.length > 0 || activeProject.cnpjs.length > 0 || activeProject.brands.length > 0;
    const filtersScore = hasFilters ? 100 : 0;

    // 3. KPIs Mapeados (15%): Se as colunas obrigatórias estão preenchidas
    const hasKpis = filteredData.length > 0 && filteredData[0] && ("Receita" in filteredData[0] || "Despesa" in filteredData[0]);
    const kpisScore = hasKpis ? 100 : 0;

    // 4. Apresentações (20%): Se possui apresentações salvas
    const hasPresentations = activeProject.presentations.length > 0;
    const presScore = hasPresentations ? 100 : 0;

    // 5. Planos de Ação (20%): Se possui planos de ação cadastrados
    const hasPlans = activeProject.actionPlans.length > 0;
    const plansScore = hasPlans ? 100 : 0;

    // Weighted average
    const total = Math.round(
      (dataScore * 0.25) +
      (filtersScore * 0.20) +
      (kpisScore * 0.15) +
      (presScore * 0.20) +
      (plansScore * 0.20)
    );

    return {
      total,
      data: dataScore,
      filters: filtersScore,
      kpis: kpisScore,
      pres: presScore,
      plans: plansScore
    };
  }, [activeProject, filteredData]);

  // --- Checklist Data ---
  const checklistItems = useMemo(() => {
    if (!activeProject) return [];

    const hasData = activeProject.spreadsheets.length > 0 || activeProject.dbConnections.length > 0 || filteredData.length > 0;
    const hasFilters = activeProject.filters.length > 0 || activeProject.cnpjs.length > 0 || activeProject.brands.length > 0;
    const hasKpis = filteredData.length > 0 && filteredData[0] && ("Receita" in filteredData[0]);
    const hasPres = activeProject.presentations.length > 0;
    const hasPlans = activeProject.actionPlans.length > 0;
    const hasMeetings = activeProject.meetings.length > 0;

    return [
      {
        id: "data",
        label: "Sincronização de dados operacionais",
        description: hasData ? "Dados carregados com sucesso no Stage." : "Nenhum dado financeiro importado ou conectado.",
        completed: hasData,
        tabTarget: "importacao"
      },
      {
        id: "kpi",
        label: "Mapeamento e integridade dos KPIs",
        description: hasKpis ? "Colunas de faturamento e despesas mapeadas." : "Vincule as colunas contábeis para habilitar cálculos.",
        completed: hasKpis,
        tabTarget: "importacao"
      },
      {
        id: "filters",
        label: "Configuração de Filtros do Workspace",
        description: hasFilters ? "Filtros organizacionais salvos no projeto." : "Configure marcas, filiais ou períodos de foco.",
        completed: hasFilters,
        tabTarget: "dre_inteligente"
      },
      {
        id: "pres",
        label: "Construção de apresentação executiva",
        description: hasPres ? "Deck de slides consolidado no Presentation Studio." : "Nenhum slide montado para a reunião com o conselho.",
        completed: hasPres,
        tabTarget: "apresentacoes"
      },
      {
        id: "meetings",
        label: "Agendamento da reunião de conselho",
        description: hasMeetings ? "Reunião de resultados e ata registrada." : "Agende a data e o responsável do encontro executivo.",
        completed: hasMeetings,
        tabTarget: "modo_reuniao"
      },
      {
        id: "plans",
        label: "Lançamento do plano de ação de caixa",
        description: hasPlans ? "Metas de correção mapeadas no Kanban." : "Cadastre planos de ação para mitigar os desvios.",
        completed: hasPlans,
        tabTarget: "resumo" // Default dashboard list
      }
    ];
  }, [activeProject, filteredData]);

  // --- Audit History Logs ---
  const recentActivities = useMemo(() => {
    return auditEngine.getLogs().slice(-5).reverse();
  }, [projects, activeProject]);

  return (
    <div className="flex flex-col gap-6 font-sans text-slate-800 dark:text-slate-100 max-w-7xl mx-auto px-4 md:px-6 py-6" id="executive-workspace-main">
      
      {/* 1. SELETOR DE WORKSPACE / PROJETOS */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-white">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600 rounded-xl text-white">
            <Briefcase size={24} />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Projeto Ativo</span>
            {activeProject ? (
              <h2 className="text-xl font-extrabold text-white leading-tight flex items-center gap-2">
                {activeProject.client}
                <span className="text-xs font-medium px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {activeProject.segment}
                </span>
              </h2>
            ) : (
              <h2 className="text-xl font-extrabold text-white leading-tight">Selecione ou Crie um Projeto</h2>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {projects.length > 0 && (
            <select
              value={activeProject?.id || ""}
              onChange={(e) => handleSelectProject(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer min-w-[200px]"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.client} ({p.group})
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => setIsCreatingProject(!isCreatingProject)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer"
          >
            <FolderPlus size={14} />
            Novo Projeto
          </button>

          {projects.length === 0 && (
            <button
              onClick={handleSeedDemoProject}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer"
            >
              <Sparkles size={14} className="text-amber-400" />
              Carregar Demo
            </button>
          )}

          {activeProject && (
            <button
              onClick={() => handleDeleteProject(activeProject.id)}
              className="p-2 bg-red-950/40 hover:bg-red-900/60 border border-red-900/60 text-red-400 hover:text-red-300 rounded-xl transition-colors cursor-pointer"
              title="Excluir Projeto Ativo"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* MODAL DE CRIAÇÃO DE PROJETO INLINE */}
      {isCreatingProject && (
        <form onSubmit={handleCreateProject} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-md flex flex-col gap-4 animate-fade-in">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">Novo Contêiner de Projeto</h3>
            <button type="button" onClick={() => setIsCreatingProject(false)} className="text-slate-400 hover:text-slate-500 text-xs">Cancelar</button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Nome do Cliente Executivo *</label>
              <input
                type="text"
                required
                value={newClient}
                onChange={(e) => setNewClient(e.target.value)}
                placeholder="Ex: Grupo Concessionárias Bahia"
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Grupo Econômico / Holding</label>
              <input
                type="text"
                value={newGroup}
                onChange={(e) => setNewGroup(e.target.value)}
                placeholder="Ex: Nordeste Holding S/A"
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Segmento de Mercado</label>
              <select
                value={newSegment}
                onChange={(e) => setNewSegment(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="Automotivo">Automotivo (Concessionárias)</option>
                <option value="Agronegócio">Agronegócio</option>
                <option value="Industrial">Industrial</option>
                <option value="Serviços">Prestação de Serviços</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Filiais / Empresas (Separadas por vírgula)</label>
              <input
                type="text"
                value={newCompanies}
                onChange={(e) => setNewCompanies(e.target.value)}
                placeholder="Ex: Bahia Sul Veículos, Bahia Norte Oficina"
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Marcas Atendidas (Separadas por vírgula)</label>
              <input
                type="text"
                value={newBrands}
                onChange={(e) => setNewBrands(e.target.value)}
                placeholder="Ex: Fiat, Toyota, Jeep"
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">CNPJ das Filiais (Separadas por vírgula)</label>
              <input
                type="text"
                value={newCnpjs}
                onChange={(e) => setNewCnpjs(e.target.value)}
                placeholder="Ex: 12.345.678/0001-90"
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="self-end bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-colors cursor-pointer"
          >
            Salvar e Ativar Projeto
          </button>
        </form>
      )}

      {activeProject ? (
        <>
          {/* 2. HEADER RESUMO DO PROJETO */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-extrabold uppercase text-slate-400">Holding</span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{activeProject.group}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-extrabold uppercase text-slate-400">Filiais Cadastradas</span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {activeProject.companies.length > 0 ? activeProject.companies.join(", ") : "Nenhuma cadastrada"}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-extrabold uppercase text-slate-400">Marcas</span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {activeProject.brands.length > 0 ? activeProject.brands.join(", ") : "Não configuradas"}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-extrabold uppercase text-slate-400">CNPJs Integrados</span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
                {activeProject.cnpjs.length > 0 ? activeProject.cnpjs.join(", ") : "Nenhum informado"}
              </span>
            </div>
            <div className="flex flex-col gap-0.5 col-span-2 md:col-span-1">
              <span className="text-[10px] font-extrabold uppercase text-slate-400">Última Carga / Auditoria</span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Clock size={12} className="text-slate-400" />
                {new Date(activeProject.lastUpdated).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
              </span>
            </div>
          </div>

          {/* 3. HEALTH SCORE CARD & METRICS INLINE */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* HEALTH SCORE GRAPHIC */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Health Score do Projeto</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500">Índice Operacional</span>
              </div>

              <div className="flex flex-col md:flex-row items-center justify-around gap-4 py-2">
                {/* SVG Circular Progress */}
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      className="text-slate-100 dark:text-slate-800"
                      strokeWidth="10"
                      stroke="currentColor"
                      fill="transparent"
                      r="40"
                      cx="50"
                      cy="50"
                    />
                    <circle
                      className={`transition-all duration-500 ${
                        healthScore.total >= 80 ? "text-emerald-500" :
                        healthScore.total >= 50 ? "text-amber-500" : "text-rose-500"
                      }`}
                      strokeWidth="10"
                      strokeDasharray={2 * Math.PI * 40}
                      strokeDashoffset={2 * Math.PI * 40 * (1 - healthScore.total / 100)}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r="40"
                      cx="50"
                      cy="50"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-3xl font-extrabold tracking-tight">{healthScore.total}%</span>
                    <span className="text-[8px] uppercase tracking-widest font-extrabold text-slate-400">Score Geral</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 w-full md:w-auto text-xs">
                  <div className="flex justify-between md:justify-start gap-4 items-center">
                    <span className="w-20 text-slate-500">Fontes Dados:</span>
                    <span className={`font-bold ${healthScore.data === 100 ? "text-emerald-500" : "text-slate-400"}`}>{healthScore.data}%</span>
                  </div>
                  <div className="flex justify-between md:justify-start gap-4 items-center">
                    <span className="w-20 text-slate-500">Filtros Setup:</span>
                    <span className={`font-bold ${healthScore.filters === 100 ? "text-emerald-500" : "text-slate-400"}`}>{healthScore.filters}%</span>
                  </div>
                  <div className="flex justify-between md:justify-start gap-4 items-center">
                    <span className="w-20 text-slate-500">KPIs Mapeados:</span>
                    <span className={`font-bold ${healthScore.kpis === 100 ? "text-emerald-500" : "text-slate-400"}`}>{healthScore.kpis}%</span>
                  </div>
                  <div className="flex justify-between md:justify-start gap-4 items-center">
                    <span className="w-20 text-slate-500">Apresentação:</span>
                    <span className={`font-bold ${healthScore.pres === 100 ? "text-emerald-500" : "text-slate-400"}`}>{healthScore.pres}%</span>
                  </div>
                  <div className="flex justify-between md:justify-start gap-4 items-center">
                    <span className="w-20 text-slate-500">Plano Ação:</span>
                    <span className={`font-bold ${healthScore.plans === 100 ? "text-emerald-500" : "text-slate-400"}`}>{healthScore.plans}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. SMART CHECKLIST - O QUE PRECISO FAZER AGORA */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm lg:col-span-2 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-blue-500" />
                  Próximos Passos recomendados
                </h3>
                <span className="text-[10px] font-semibold text-slate-500">Assistente do Workspace</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {checklistItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all"
                  >
                    <button
                      disabled
                      className={`mt-0.5 p-1 rounded-full border shrink-0 flex items-center justify-center w-5 h-5 ${
                        item.completed
                          ? "bg-emerald-500/10 border-emerald-500 text-emerald-500"
                          : "border-slate-300 dark:border-slate-700 text-transparent"
                      }`}
                    >
                      <Check size={10} strokeWidth={3} />
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-1">
                        <span className={`text-xs font-bold block truncate ${item.completed ? "text-slate-500 dark:text-slate-400 line-through" : "text-slate-900 dark:text-white"}`}>
                          {item.label}
                        </span>
                        {!item.completed && (
                          <button
                            onClick={() => onSelectTab(item.tabTarget)}
                            className="text-[10px] text-blue-500 hover:text-blue-600 font-bold shrink-0 flex items-center gap-0.5 cursor-pointer"
                          >
                            Resolver
                            <ArrowRight size={10} />
                          </button>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5 truncate">
                        {item.description}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 5. DATA INGESTION STATE & MEETINGS STATS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ESTADO DAS FONTES DE DADOS */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Database size={14} className="text-blue-500" />
                Fontes de Dados
              </h3>

              <div className="flex flex-col gap-3 flex-1 justify-center">
                {/* PostgreSQL Connection */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Database size={16} className="text-blue-500" />
                    <div>
                      <span className="text-xs font-bold block">Banco ERP PostgreSQL</span>
                      <span className="text-[10px] text-slate-500 block">
                        {activeProject.dbConnections.length > 0
                          ? `Host: ${activeProject.dbConnections[0].host}`
                          : "Sem conexão ERP ativa (Modo Seguro)"}
                      </span>
                    </div>
                  </div>
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${activeProject.dbConnections.length > 0 ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"}`} />
                </div>

                {/* Spreadsheet Files */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Database size={16} className="text-indigo-500" />
                    <div>
                      <span className="text-xs font-bold block">Planilhas Faturamento</span>
                      <span className="text-[10px] text-slate-500 block">
                        {activeProject.spreadsheets.length > 0
                          ? activeProject.spreadsheets[0].name
                          : activeFiles.length > 0
                          ? activeFiles[0].name
                          : "Nenhuma planilha importada"}
                      </span>
                    </div>
                  </div>
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${activeProject.spreadsheets.length > 0 || activeFiles.length > 0 ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"}`} />
                </div>

                {/* Sincronização */}
                <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
                  <span>Modo seguro de leitura ativo</span>
                  <button
                    onClick={() => onSelectTab("importacao")}
                    className="text-xs font-bold text-blue-500 hover:text-blue-600 cursor-pointer"
                  >
                    Gerenciar Cargas
                  </button>
                </div>
              </div>
            </div>

            {/* STATUS APRESENTAÇÃO & REUNIAO */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Layers size={14} className="text-purple-500" />
                Status do Trabalho Executivo
              </h3>

              <div className="flex flex-col gap-3 flex-1 justify-center">
                {/* Apresentações */}
                <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex justify-between items-center">
                  <div>
                    <span className="text-xs font-bold block">Apresentação Estratégica</span>
                    <span className="text-[10px] text-slate-500 block">
                      {activeProject.presentations.length > 0
                        ? `${activeProject.presentations.length} Deck(s) de slides criado(s)`
                        : "Nenhuma apresentação estruturada para este mês."}
                    </span>
                  </div>
                  <button
                    onClick={() => onSelectTab("apresentacoes")}
                    className="text-xs font-bold text-blue-500 hover:text-blue-600 cursor-pointer shrink-0"
                  >
                    Ir
                  </button>
                </div>

                {/* Reuniões */}
                <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex justify-between items-center">
                  <div>
                    <span className="text-xs font-bold block">Reunião Agendada</span>
                    <span className="text-[10px] text-slate-500 block">
                      {activeProject.meetings.length > 0
                        ? `Próxima reunião liderada por: ${activeProject.meetings[0].responsible}`
                        : "Nenhum ritual executivo agendado."}
                    </span>
                  </div>
                  <button
                    onClick={() => setIsSchedulingMeeting(true)}
                    className="text-xs font-bold text-blue-500 hover:text-blue-600 cursor-pointer shrink-0"
                  >
                    Agendar
                  </button>
                </div>
              </div>
            </div>

            {/* MEU COMPROMISSO / MEETING BOOKER FORM INLINE */}
            {isSchedulingMeeting ? (
              <form onSubmit={handleCreateMeeting} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col gap-3 animate-fade-in">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Agendar Reunião</h3>
                  <button type="button" onClick={() => setIsSchedulingMeeting(false)} className="text-slate-400 hover:text-slate-500 text-xs">Fechar</button>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase font-bold text-slate-400">Consultor Líder *</label>
                  <input
                    type="text"
                    required
                    value={newMeetingResponsible}
                    onChange={(e) => setNewMeetingResponsible(e.target.value)}
                    placeholder="Ex: Carlos Silveira (Sauron)"
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase font-bold text-slate-400">Objetivo & Pauta</label>
                  <input
                    type="text"
                    value={newMeetingObservations}
                    onChange={(e) => setNewMeetingObservations(e.target.value)}
                    placeholder="Ex: Fechamento de DRE Contábil"
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 rounded-xl mt-1 transition-colors cursor-pointer">
                  Salvar Reunião
                </button>
              </form>
            ) : (
              /* COMPROMISSOS CADASTRADOS QUICK LIST */
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Calendar size={14} className="text-purple-500" />
                  Rituais Cadastrados
                </h3>
                
                <div className="flex flex-col gap-2 overflow-y-auto max-h-[140px] flex-1">
                  {activeProject.meetings.length > 0 ? (
                    activeProject.meetings.map((meet) => (
                      <div key={meet.id} className="p-2.5 rounded-lg bg-slate-55 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 flex items-start gap-2 text-xs">
                        <Calendar size={14} className="text-slate-400 mt-0.5" />
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white block">Líder: {meet.responsible}</span>
                          <span className="text-[10px] text-slate-500 block">{meet.observations || "Sem observações"}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-slate-400 text-xs italic flex-1 flex items-center justify-center">
                      Nenhuma reunião registrada ainda.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 6. PLANO DE AÇÃO KANBAN & TIMELINE DE ATIVIDADES */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* PLANO DE AÇÃO / KANBAN SIMPLIFICADO */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm lg:col-span-2 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <TrendingUp size={14} className="text-emerald-500" />
                  Plano de Ação Corretivo (Kanban)
                </h3>
                <span className="text-[10px] font-bold text-slate-500">
                  {activeProject.actionPlans.filter(p => p.status === "completed").length} / {activeProject.actionPlans.length} Concluídos
                </span>
              </div>

              {/* LIST OF ACTIONS */}
              <div className="flex-1 overflow-y-auto max-h-[220px] pr-1 space-y-2">
                {activeProject.actionPlans.length > 0 ? (
                  activeProject.actionPlans.map((plan) => (
                    <div
                      key={plan.id}
                      className={`flex justify-between items-center p-3 rounded-xl border transition-all ${
                        plan.status === "completed"
                          ? "bg-slate-50/50 dark:bg-slate-800/20 border-slate-100 dark:border-slate-800/50 opacity-60"
                          : "bg-slate-50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <button
                          onClick={() => handleToggleActionPlanStatus(plan.id)}
                          className={`mt-0.5 w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-colors cursor-pointer ${
                            plan.status === "completed"
                              ? "bg-emerald-500 border-emerald-500 text-white"
                              : plan.status === "in-progress"
                              ? "bg-amber-500/10 border-amber-500 text-amber-500"
                              : "border-slate-300 dark:border-slate-700 text-transparent"
                          }`}
                          title={`Alterar status (Atual: ${plan.status})`}
                        >
                          {plan.status === "completed" ? (
                            <Check size={10} strokeWidth={3} />
                          ) : plan.status === "in-progress" ? (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          ) : null}
                        </button>

                        <div className="min-w-0 flex-1">
                          <span className={`text-xs font-bold block ${plan.status === "completed" ? "line-through text-slate-500" : "text-slate-900 dark:text-white"}`}>
                            {plan.description}
                          </span>
                          <div className="flex flex-wrap gap-2 mt-1 text-[10px] text-slate-500 font-medium">
                            <span className="flex items-center gap-1">
                              <Users size={10} />
                              {plan.responsible}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock size={10} />
                              Prazo: {plan.deadline}
                            </span>
                            <span className={`px-1.5 py-0.2 rounded uppercase text-[8px] font-extrabold ${
                              plan.priority === "high" ? "bg-red-500/10 text-red-500" :
                              plan.priority === "medium" ? "bg-amber-500/10 text-amber-500" :
                              "bg-slate-500/10 text-slate-500"
                            }`}>
                              {plan.priority}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemoveActionPlan(plan.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50/10 rounded-lg transition-colors cursor-pointer shrink-0"
                        title="Remover Plano"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-400 text-xs italic">
                    Nenhum plano de ação de mitigação de caixa cadastrado. Cadastre no formulário abaixo.
                  </div>
                )}
              </div>

              {/* FORM TO ADD ACTION */}
              <form onSubmit={handleAddActionPlan} className="grid grid-cols-1 md:grid-cols-12 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="md:col-span-5">
                  <input
                    type="text"
                    required
                    placeholder="O que precisa ser feito? Ex: Saneamento do estoque obsoleto..."
                    value={newActionDescription}
                    onChange={(e) => setNewActionDescription(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900 dark:text-white"
                  />
                </div>
                <div className="md:col-span-3">
                  <input
                    type="text"
                    required
                    placeholder="Responsável..."
                    value={newActionResponsible}
                    onChange={(e) => setNewActionResponsible(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900 dark:text-white"
                  />
                </div>
                <div className="md:col-span-2">
                  <select
                    value={newActionPriority}
                    onChange={(e) => setNewActionPriority(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900 dark:text-white cursor-pointer"
                  >
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Plus size={14} />
                    Adicionar
                  </button>
                </div>
              </form>
            </div>

            {/* ATIVIDADES RECENTES (TIMELINE) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Clock size={14} className="text-blue-500" />
                Linha do Tempo de Auditoria
              </h3>

              <div className="flex-1 overflow-y-auto max-h-[280px] space-y-4">
                {recentActivities.length > 0 ? (
                  recentActivities.map((act) => (
                    <div key={act.id} className="relative pl-5 border-l-2 border-slate-100 dark:border-slate-800 last:border-transparent pb-1">
                      {/* Circle indicator */}
                      <span className="absolute -left-[6px] top-1.5 w-2.5 h-2.5 rounded-full bg-blue-500 border border-white dark:border-slate-900 shrink-0" />
                      
                      <div className="flex flex-col gap-0.5 text-xs">
                        <div className="flex justify-between items-start gap-2">
                          <span className="font-extrabold text-slate-900 dark:text-white leading-tight">
                            {act.type}
                          </span>
                          <span className="text-[9px] text-slate-400 font-medium shrink-0">
                            {new Date(act.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
                          {act.message}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-slate-400 text-xs italic">
                    Nenhuma atividade operacional registrada nesta sessão.
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        /* WORKSPACE EMPTY STATE */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-sm max-w-xl mx-auto my-6 flex flex-col items-center gap-4">
          <div className="p-4 bg-blue-50 dark:bg-slate-800/50 text-blue-500 rounded-full">
            <Briefcase size={40} />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Workspace Sem Projetos Ativos</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              O Sauron Executive Experience armazena e versiona múltiplos projetos corporativos. 
              Crie um novo projeto usando o botão acima ou carregue o projeto demonstrativo oficial do escritório para começar a operar.
            </p>
          </div>
          <button
            onClick={handleSeedDemoProject}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-6 py-3 rounded-xl transition-all cursor-pointer shadow-md shadow-blue-500/10"
          >
            <Sparkles size={14} className="text-amber-300" />
            Carregar Projeto Demonstrativo
          </button>
        </div>
      )}
    </div>
  );
};
