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
  Check,
  ChevronDown,
  ChevronUp,
  Activity,
  Settings,
  HelpCircle,
  FileText,
  SlidersHorizontal,
  Bell,
  RefreshCw,
  Eye,
  Menu,
  Network,
  ShieldAlert,
  Presentation,
  MonitorPlay,
  BarChart3
} from "lucide-react";
import { consultantWorkspaceManager } from "../modules/consultant-workspace/ConsultantWorkspaceManager";
import { WorkspaceProject, ActionPlan, Meeting } from "../modules/consultant-workspace/types";
import { auditEngine } from "../core/audit/AuditEngine";
import { ExecutiveWidgets } from "./ExecutiveWidgets";

interface ExecutiveWorkspaceProps {
  filteredData: any[];
  activeFiles: any[];
  onSelectTab: (tabId: string) => void;
  formatCurrency: (value: number) => string;
}

// Workspace Layout Types
type WorkspaceLayout = "fechamento_mensal" | "diretoria" | "comercial" | "financeiro" | "auditoria" | "personalizado";

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
  const [activeLayout, setActiveLayout] = useState<WorkspaceLayout>(() => {
    return (localStorage.getItem("sauron_active_layout") as WorkspaceLayout) || "fechamento_mensal";
  });

  // --- Mission Control Modular Cockpit State ---
  const [enabledWidgets, setEnabledWidgets] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem("sauron_enabled_widgets_v1");
    return saved ? JSON.parse(saved) : {
      healthScore: true,
      timeline: true,
      insights: true,
      kpis: true,
      alerts: true,
      actionPlans: true,
      agenda: true,
      dataSources: true,
      analytics: true,
      presentationStatus: true,
      meetingStatus: true
    };
  });

  const [widgetOrder, setWidgetOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem("sauron_widget_order_v1");
    return saved ? JSON.parse(saved) : [
      "healthScore",
      "timeline",
      "insights",
      "kpis",
      "alerts",
      "actionPlans",
      "agenda",
      "dataSources",
      "analytics",
      "presentationStatus",
      "meetingStatus"
    ];
  });

  const [isMissionControlCustomizing, setIsMissionControlCustomizing] = useState(false);

  const toggleWidget = (widgetId: string) => {
    const updated = { ...enabledWidgets, [widgetId]: !enabledWidgets[widgetId] };
    setEnabledWidgets(updated);
    localStorage.setItem("sauron_enabled_widgets_v1", JSON.stringify(updated));
  };

  const moveWidget = (widgetId: string, direction: "up" | "down") => {
    const index = widgetOrder.indexOf(widgetId);
    if (index === -1) return;
    const nextIndex = direction === "up" ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= widgetOrder.length) return;

    const newOrder = [...widgetOrder];
    const [removed] = newOrder.splice(index, 1);
    newOrder.splice(nextIndex, 0, removed);
    
    setWidgetOrder(newOrder);
    localStorage.setItem("sauron_widget_order_v1", JSON.stringify(newOrder));
  };

  const resetWidgets = () => {
    const defaultOrder = [
      "healthScore",
      "timeline",
      "insights",
      "kpis",
      "alerts",
      "actionPlans",
      "agenda",
      "dataSources",
      "analytics",
      "presentationStatus",
      "meetingStatus"
    ];
    const defaultEnabled = {
      healthScore: true,
      timeline: true,
      insights: true,
      kpis: true,
      alerts: true,
      actionPlans: true,
      agenda: true,
      dataSources: true,
      analytics: true,
      presentationStatus: true,
      meetingStatus: true
    };
    setWidgetOrder(defaultOrder);
    setEnabledWidgets(defaultEnabled);
    localStorage.setItem("sauron_widget_order_v1", JSON.stringify(defaultOrder));
    localStorage.setItem("sauron_enabled_widgets_v1", JSON.stringify(defaultEnabled));
  };

  // --- UI Collapsible States ---
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  const [quickAddAction, setQuickAddAction] = useState(false);
  const [quickAddMeeting, setQuickAddMeeting] = useState(false);

  // --- Filter Construction Local States ---
  const [filterBrand, setFilterBrand] = useState("");
  const [filterCompany, setFilterCompany] = useState("");
  const [filterCNPJ, setFilterCNPJ] = useState("");

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
      await consultantWorkspaceManager.setActiveProject(list[0].id);
      setActiveProject(list[0]);
    } else {
      setActiveProject(null);
    }
  };

  useEffect(() => {
    loadWorkspace();
  }, []);

  // Save selected layout to localStorage
  const handleSelectLayout = (layout: WorkspaceLayout) => {
    setActiveLayout(layout);
    localStorage.setItem("sauron_active_layout", layout);
    auditEngine.logEvent(
      "LAYOUT_CHANGE",
      `Alterou layout de visualização do cockpit para: ${layout.toUpperCase()}`,
      "INFO",
      { layout }
    );
  };

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
    
    await loadWorkspace();
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!window.confirm("Deseja realmente remover este projeto? Esta ação é irreversível e apagará rituais e planos de ação.")) return;
    
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

  // --- Filter Construction Handlers ---
  const handleSaveProjectFilters = async () => {
    if (!activeProject) return;

    const updatedBrands = filterBrand ? [filterBrand] : activeProject.brands;
    const updatedCompanies = filterCompany ? [filterCompany] : activeProject.companies;
    const updatedCnpjs = filterCNPJ ? [filterCNPJ] : activeProject.cnpjs;

    const updatedProject = {
      ...activeProject,
      brands: updatedBrands,
      companies: updatedCompanies,
      cnpjs: updatedCnpjs,
      filters: filterBrand || filterCompany || filterCNPJ ? [{ id: `f_${Date.now()}`, name: "Filtro Ativo Cockpit", expression: "Filtros Personalizados" }] : []
    };

    await consultantWorkspaceManager.updateProject(updatedProject);
    auditEngine.logEvent(
      "FILTERS_UPDATE",
      `Filtros do cockpit atualizados (Marca: ${filterBrand || "Qualquer"}, Filial: ${filterCompany || "Qualquer"})`,
      "INFO",
      { projectId: activeProject.id }
    );

    setIsFiltersExpanded(false);
    await loadWorkspace();
  };

  const handleClearProjectFilters = async () => {
    if (!activeProject) return;
    setFilterBrand("");
    setFilterCompany("");
    setFilterCNPJ("");

    const updatedProject = {
      ...activeProject,
      filters: []
    };

    await consultantWorkspaceManager.updateProject(updatedProject);
    auditEngine.logEvent(
      "FILTERS_CLEAR",
      "Filtros do cockpit limpos com sucesso",
      "INFO",
      { projectId: activeProject.id }
    );

    setIsFiltersExpanded(false);
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
      origin: "Cockpit Executivo"
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
    setQuickAddAction(false);

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
          `Alterou status da tarefa "${plan.description}" para: ${nextStatus.toUpperCase()}`,
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
    setQuickAddMeeting(false);

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

    // 1. Dados (25%): Se tem spreadsheets ou dbConnections ou dados ativos
    const hasData = activeProject.spreadsheets.length > 0 || activeProject.dbConnections.length > 0 || filteredData.length > 0;
    const dataScore = hasData ? 100 : 0;

    // 2. Filtros (20%): Se filtros do projeto estão populados ou se filtros na UI estão configurados
    const hasFilters = activeProject.filters.length > 0 || activeProject.cnpjs.length > 0 || activeProject.brands.length > 0;
    const filtersScore = hasFilters ? 100 : 0;

    // 3. KPIs Mapeados (15%): Se as colunas obrigatórias estão preenchidas
    const hasKpis = filteredData.length > 0 && filteredData[0] && ("Receita" in filteredData[0] || "Despesa" in filteredData[0] || "Faturamento" in filteredData[0] || "Faturamento Bruto" in filteredData[0]);
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

  // --- Checklist Data (Operational Guide) ---
  const checklistItems = useMemo(() => {
    if (!activeProject) return [];

    const hasData = activeProject.spreadsheets.length > 0 || activeProject.dbConnections.length > 0 || filteredData.length > 0;
    const hasFilters = activeProject.filters.length > 0 || activeProject.cnpjs.length > 0 || activeProject.brands.length > 0;
    const hasKpis = filteredData.length > 0 && filteredData[0] && ("Receita" in filteredData[0] || "Despesa" in filteredData[0] || "Faturamento" in filteredData[0]);
    const hasPres = activeProject.presentations.length > 0;
    const hasPlans = activeProject.actionPlans.length > 0;
    const hasMeetings = activeProject.meetings.length > 0;

    return [
      {
        id: "data",
        label: "Sincronização de dados operacionais",
        description: hasData ? "Dados de faturamento carregados no Stage." : "Nenhum dado financeiro importado ou conectado.",
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
        tabTarget: "resumo"
      }
    ];
  }, [activeProject, filteredData]);

  // --- Filter Active Count & Labels ---
  const activeFiltersCount = useMemo(() => {
    if (!activeProject) return 0;
    let count = 0;
    if (activeProject.brands.length > 0) count++;
    if (activeProject.companies.length > 0) count++;
    if (activeProject.cnpjs.length > 0) count++;
    if (activeProject.filters.length > 0) count++;
    return count;
  }, [activeProject]);

  // --- Daily Brief Automatic Bulletins ---
  const dailyBrief = useMemo(() => {
    if (!activeProject) return null;

    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
    
    const hasData = activeProject.spreadsheets.length > 0 || activeProject.dbConnections.length > 0 || filteredData.length > 0;
    const meetingsCount = activeProject.meetings.length;
    const pendingActions = activeProject.actionPlans.filter(p => p.status === "pending" || p.status === "in-progress").length;

    const bulletins = [
      { 
        type: "meetings", 
        text: meetingsCount === 1 ? "1 reunião agendada." : `${meetingsCount} reuniões agendadas.` 
      },
      { 
        type: "pendencies", 
        text: pendingActions === 1 ? "1 pendência ou ação no Kanban." : `${pendingActions} pendências ativas.` 
      },
      { 
        type: "sync", 
        text: hasData ? "Dados sincronizados com o ERP." : "Central de Ingestion offline (dados offline estáveis)." 
      },
      { 
        type: "actionPlan", 
        text: pendingActions > 0 ? "Plano de ação com mitigações pendentes." : "Plano de ação atualizado e em dia." 
      },
      { 
        type: "analysis", 
        text: "Última análise realizada há 15 minutos." 
      }
    ];

    return {
      greeting,
      meetingsCount,
      pendingActions,
      hasData,
      bulletins
    };
  }, [activeProject, filteredData]);

  // --- Audit History Logs ---
  const recentActivities = useMemo(() => {
    return auditEngine.getLogs().slice(-6).reverse();
  }, [projects, activeProject]);

  // --- Connection Statuses (Micro Cards) ---
  const connectionStatuses = useMemo(() => {
    if (!activeProject) return { db: "disconnected", sheet: "pending", vpn: "inactive", api: "pending" };

    const hasDb = activeProject.dbConnections.length > 0;
    const hasSheet = activeProject.spreadsheets.length > 0 || activeFiles.length > 0;
    const isVpnActive = hasDb && activeProject.dbConnections.some(c => c.host.startsWith("10.") || c.host.includes("local"));
    const isApiActive = filteredData.length > 0;

    return {
      db: hasDb ? "connected" : "disconnected",
      sheet: hasSheet ? "connected" : "pending",
      vpn: isVpnActive ? "connected" : "inactive",
      api: isApiActive ? "connected" : "pending"
    };
  }, [activeProject, activeFiles, filteredData]);

  // Determine what panels are visible in the current layout configuration
  const visiblePanels = useMemo(() => {
    const allPanels = {
      dailyBrief: true,
      checklist: true,
      connections: true,
      timeline: true,
      healthScoreDetails: true,
      actionKanban: true,
      meetings: true
    };

    switch (activeLayout) {
      case "fechamento_mensal":
        return {
          ...allPanels,
          actionKanban: false,
          meetings: false
        };
      case "diretoria":
        return {
          ...allPanels,
          connections: false,
          checklist: false
        };
      case "comercial":
        return {
          ...allPanels,
          connections: false,
          meetings: false,
          healthScoreDetails: false
        };
      case "financeiro":
        return {
          ...allPanels,
          timeline: false,
          meetings: false
        };
      case "auditoria":
        return {
          ...allPanels,
          dailyBrief: false,
          checklist: false,
          actionKanban: false,
          meetings: false
        };
      case "personalizado":
      default:
        return allPanels;
    }
  }, [activeLayout]);

  return (
    <div className="flex flex-col gap-6 font-sans text-slate-800 dark:text-slate-100 max-w-7xl mx-auto px-4 md:px-6 py-6" id="executive-workspace-main">
      
      {/* 1. SELETOR DE WORKSPACE / PROJETOS - COCKPIT HEADER */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-white">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-500/20 shrink-0">
            <Briefcase size={26} />
          </div>
          <div>
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-blue-400">Ambiente de Operações</span>
            {activeProject ? (
              <h2 className="text-2xl font-black text-white leading-tight flex flex-wrap items-center gap-2">
                {activeProject.client}
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {activeProject.segment}
                </span>
              </h2>
            ) : (
              <h2 className="text-2xl font-black text-white leading-tight">Escolha ou Inicie um Projeto</h2>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {projects.length > 0 && (
            <select
              value={activeProject?.id || ""}
              onChange={(e) => handleSelectProject(e.target.value)}
              className="bg-slate-800 border border-slate-700 hover:border-slate-600 transition-colors rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer min-w-[220px]"
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
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-colors cursor-pointer shadow-md"
          >
            <FolderPlus size={15} />
            Novo Projeto
          </button>

          {projects.length === 0 && (
            <button
              onClick={handleSeedDemoProject}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-extrabold text-xs px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              <Sparkles size={15} className="text-amber-400" />
              Carregar Demo
            </button>
          )}

          {activeProject && (
            <button
              onClick={() => handleDeleteProject(activeProject.id)}
              className="p-2.5 bg-red-950/40 hover:bg-red-900/60 border border-red-900/40 text-red-400 hover:text-red-300 rounded-xl transition-colors cursor-pointer"
              title="Excluir Projeto Ativo"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* FORMULÁRIO DE CRIAÇÃO DE NOVO PROJETO (COLLAPSIBLE FORM) */}
      {isCreatingProject && (
        <form onSubmit={handleCreateProject} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col gap-4 animate-fade-in">
          <div className="flex justify-between items-center border-b border-slate-150 dark:border-slate-800 pb-3">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <FolderPlus size={16} className="text-blue-500" />
              Cadastrar Novo Contêiner de Projeto de Consultoria
            </h3>
            <button type="button" onClick={() => setIsCreatingProject(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xs">Cancelar</button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Razão Social do Cliente *</label>
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
              <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Filiais (Separadas por vírgula)</label>
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
            className="self-end bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs px-6 py-3 rounded-xl transition-colors cursor-pointer shadow-md"
          >
            Salvar e Ativar Novo Projeto
          </button>
        </form>
      )}

      {activeProject ? (
        <>
          {/* 2. HERO METADATA GRID SECTION (Cabeçalho de Leitura Rápida) */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">Cliente Executivo</span>
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 truncate">{activeProject.client}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">Grupo Econômico</span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{activeProject.group}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">Segmento / Foco</span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{activeProject.segment}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">Período Ativo</span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Maio / 2026</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">Consultor Líder</span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">Carlos Silveira</span>
            </div>
            <div className="flex flex-col gap-0.5 col-span-2 lg:col-span-1">
              <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">Integridade Geral</span>
              <span className="text-xs font-black text-emerald-500 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Seguro (Read-Only)
              </span>
            </div>
          </div>

          {/* 3. WORKSPACE LAYOUT TABS SELECTOR (Concept: Fechamento, Diretoria, Comercial, Financeiro, Auditoria, Personalizado) */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Layout Temático do Cockpit</span>
            <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              {[
                { id: "fechamento_mensal", label: "Fechamento Mensal", desc: "DRE, checklist e fontes" },
                { id: "diretoria", label: "Conselho de Diretoria", desc: "Brief, saúde e Kanban" },
                { id: "comercial", label: "Comercial & Vendas", desc: "Planos de caixa e vendas" },
                { id: "financeiro", label: "Fluxo Financeiro", desc: "Conexões, score e checklists" },
                { id: "auditoria", label: "Auditoria de Lotes", desc: "Timeline de eventos e redes" },
                { id: "personalizado", label: "Cockpit Completo", desc: "Todos os painéis ativos" }
              ].map((layout) => (
                <button
                  key={layout.id}
                  onClick={() => handleSelectLayout(layout.id as WorkspaceLayout)}
                  className={`flex-1 min-w-[130px] text-left p-3 rounded-xl transition-all cursor-pointer ${
                    activeLayout === layout.id
                      ? "bg-slate-900 dark:bg-slate-800 text-white shadow-md border-b-2 border-blue-500"
                      : "hover:bg-slate-200 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  <span className="text-xs font-black block leading-none mb-1">{layout.label}</span>
                  <span className="text-[9px] opacity-65 block leading-none truncate">{layout.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* MISSION CONTROL CENTER WIDGET CONFIGURATOR */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg text-white flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-xl">
                  <SlidersHorizontal size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white leading-tight">Sauron OS — Mission Control Cockpit</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Configure e reordene os módulos executivos e painéis de governança em tempo real.</p>
                </div>
              </div>
              <button
                onClick={() => setIsMissionControlCustomizing(!isMissionControlCustomizing)}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-black px-4 py-2 rounded-xl cursor-pointer transition-colors shadow-md"
              >
                {isMissionControlCustomizing ? "Concluir Ajustes" : "Configurar Cockpit"}
              </button>
            </div>

            {isMissionControlCustomizing && (
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex flex-col gap-3 animate-fade-in">
                <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                  <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider">Painéis Modulares Habilitados</span>
                  <button onClick={resetWidgets} className="text-[10px] text-blue-400 hover:text-blue-300 font-extrabold uppercase cursor-pointer">
                    Restaurar Configurações Originais
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {widgetOrder.map((id, index) => {
                    const label = id === "healthScore" ? "Saúde do Cliente & Score" :
                                  id === "timeline" ? "Timeline de Atividades" :
                                  id === "insights" ? "Insights de Governança" :
                                  id === "kpis" ? "KPIs Estratégicos & Faturamento" :
                                  id === "alerts" ? "Alertas de Integridade" :
                                  id === "actionPlans" ? "Plano de Ação (Kanban)" :
                                  id === "agenda" ? "Agenda & Rituais" :
                                  id === "dataSources" ? "Ambiente de Redes & Ingestão" :
                                  id === "analytics" ? "DRE & Performance Analítica" :
                                  id === "presentationStatus" ? "Status de Apresentações" : "Status de Reuniões";

                    return (
                      <div key={id} className="flex justify-between items-center p-3 rounded-xl bg-slate-900 border border-slate-800/80 text-xs font-semibold">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={enabledWidgets[id]}
                            onChange={() => toggleWidget(id)}
                            className="rounded text-blue-500 bg-slate-850 border-slate-700 focus:ring-blue-500 w-4 h-4"
                          />
                          <span className={enabledWidgets[id] ? "text-white" : "text-slate-500 line-through"}>{label}</span>
                        </label>
                        <div className="flex gap-1.5 shrink-0 ml-2">
                          <button
                            disabled={index === 0}
                            onClick={() => moveWidget(id, "up")}
                            className="p-1 px-2 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 cursor-pointer text-[10px] font-mono"
                            title="Mover para cima"
                          >
                            ▲
                          </button>
                          <button
                            disabled={index === widgetOrder.length - 1}
                            onClick={() => moveWidget(id, "down")}
                            className="p-1 px-2 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 cursor-pointer text-[10px] font-mono"
                            title="Mover para baixo"
                          >
                            ▼
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 4. FILTROS COLAPSÁVEIS - COMPACT FILTER BAR */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm transition-all overflow-hidden">
            <button
              onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
              className="w-full flex justify-between items-center px-5 py-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <SlidersHorizontal size={16} className="text-slate-400" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Escopo Operacional Ativo:</span>
                <div className="flex gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold bg-blue-500/10 text-blue-500 px-2.5 py-0.5 rounded-full">
                    {activeFiltersCount === 0 ? "Geral (Sem Filtros)" : `Filtros Ativos (${activeFiltersCount})`}
                  </span>
                  {activeProject.brands.length > 0 && (
                    <span className="text-[9px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded">
                      Marca: {activeProject.brands.join(", ")}
                    </span>
                  )}
                  {activeProject.companies.length > 0 && (
                    <span className="text-[9px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded">
                      Filial: {activeProject.companies.join(", ")}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                {isFiltersExpanded ? "Recolher Painel" : "Configurar Filtros"}
                {isFiltersExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </button>

            {isFiltersExpanded && (
              <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-slate-400">Filtrar por Marca</label>
                  <input
                    type="text"
                    value={filterBrand}
                    onChange={(e) => setFilterBrand(e.target.value)}
                    placeholder="Ex: Fiat ou Jeep"
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-slate-400">Filtrar por Filial/Empresa</label>
                  <input
                    type="text"
                    value={filterCompany}
                    onChange={(e) => setFilterCompany(e.target.value)}
                    placeholder="Ex: Norte Veículos"
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-slate-400">Filtrar por CNPJ</label>
                  <input
                    type="text"
                    value={filterCNPJ}
                    onChange={(e) => setFilterCNPJ(e.target.value)}
                    placeholder="Ex: 01.234.567/0001-89"
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div className="md:col-span-3 flex justify-end gap-2 pt-2">
                  <button
                    onClick={handleClearProjectFilters}
                    className="bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300 text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer"
                  >
                    Limpar Filtros
                  </button>
                  <button
                    onClick={handleSaveProjectFilters}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-black px-5 py-2 rounded-xl transition-colors cursor-pointer shadow-md"
                  >
                    Aplicar Escopo de Filtros
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 5. EXECUTIVE OVERVIEW - OS 4 GRANDES CARDINAIS DO COCKPIT */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* CARD 1: HEALTH SCORE COMPACT GAUGE */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-[150px]">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Health Score</span>
                <span className="text-[9px] px-2 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-500 rounded-full font-bold">Conformidade</span>
              </div>
              <div className="flex items-center gap-4">
                <span className={`text-4xl font-black ${
                  healthScore.total >= 80 ? "text-emerald-500" :
                  healthScore.total >= 50 ? "text-amber-500" : "text-rose-500"
                }`}>
                  {healthScore.total}%
                </span>
                <div className="flex-1">
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        healthScore.total >= 80 ? "bg-emerald-500" :
                        healthScore.total >= 50 ? "bg-amber-500" : "bg-rose-500"
                      }`}
                      style={{ width: `${healthScore.total}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-slate-400 block mt-1 font-bold">Meta recomendada: {">"} 80%</span>
                </div>
              </div>
              <button
                onClick={() => handleSelectLayout("personalizado")}
                className="text-left text-[10px] text-slate-400 hover:text-blue-500 font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                Análise Dimensional Detalhada
                <ArrowRight size={10} />
              </button>
            </div>

            {/* CARD 2: STATUS DOS DADOS */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-[150px]">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Status dos Dados</span>
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                  connectionStatuses.sheet === "connected" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                }`}>
                  {connectionStatuses.sheet === "connected" ? "Sincronizado" : "Incompleto"}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black text-slate-800 dark:text-slate-100 truncate">
                  {activeProject.spreadsheets.length > 0
                    ? activeProject.spreadsheets[0].name
                    : activeFiles.length > 0
                    ? activeFiles[0].name
                    : "Sem planilhas carregadas"}
                </span>
                <span className="text-[9px] text-slate-400 mt-1 block">
                  {activeProject.dbConnections.length > 0 ? "Conectado à réplica PostgreSQL" : "Modo isolado de planilhas locais"}
                </span>
              </div>
              <button
                onClick={() => onSelectTab("importacao")}
                className="text-left text-[10px] text-blue-500 hover:text-blue-600 font-bold flex items-center gap-1 cursor-pointer"
              >
                Gerenciar Ingestão de Lotes
                <ArrowRight size={10} />
              </button>
            </div>

            {/* CARD 3: PRÓXIMA REUNIÃO */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-[150px]">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Próxima Reunião</span>
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                  activeProject.meetings.length > 0 ? "bg-purple-500/10 text-purple-500" : "bg-slate-100 text-slate-400"
                }`}>
                  {activeProject.meetings.length > 0 ? "Agendado" : "Nenhum ritual"}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black text-slate-800 dark:text-slate-100 truncate">
                  {activeProject.meetings.length > 0
                    ? `Conselho de ${activeProject.meetings[0].responsible}`
                    : "Nenhum ritual ativo"}
                </span>
                <span className="text-[9px] text-slate-400 mt-1 block truncate">
                  {activeProject.meetings.length > 0 ? activeProject.meetings[0].observations : "Agende um ritual executivo de resultados"}
                </span>
              </div>
              <button
                onClick={() => onSelectTab("modo_reuniao")}
                className="text-left text-[10px] text-blue-500 hover:text-blue-600 font-bold flex items-center gap-1 cursor-pointer"
              >
                Entrar em Modo Reunião
                <ArrowRight size={10} />
              </button>
            </div>

            {/* CARD 4: PLANO DE AÇÃO */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-[150px]">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Planos de Ação</span>
                <span className="text-[9px] px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-full font-bold">Kanban</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-black text-slate-800 dark:text-slate-100">
                  {activeProject.actionPlans.filter(p => p.status === "completed").length} / {activeProject.actionPlans.length}
                </span>
                <span className="text-[10px] text-slate-400">metas de mitigação de desvios concluídas</span>
              </div>
              <button
                onClick={() => handleSelectLayout("comercial")}
                className="text-left text-[10px] text-blue-500 hover:text-blue-600 font-bold flex items-center gap-1 cursor-pointer"
              >
                Ver Quadro de Tarefas
                <ArrowRight size={10} />
              </button>
            </div>
          </div>

          {/* MAIN WORKSPACE CONTENT GRID - DYNAMICALLY RENDERED BY EXECUTIVEWIDGETS COMPONENT */}
          {dailyBrief && (
            <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-4 text-white relative overflow-hidden mb-6">
              <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
              
              <div>
                <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                  <Sparkles size={20} className="text-blue-400 animate-pulse" />
                  {dailyBrief.greeting}.
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-medium">
                  Status de controle do ecossistema executivo para o projeto <strong className="text-white">{activeProject.client}</strong>:
                </p>
              </div>

              <div className="border-t border-slate-800/80 pt-4 flex flex-col gap-3 font-mono">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Hoje existem:</span>
                <ul className="space-y-2 text-xs text-slate-300 pl-1">
                  <li className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                    <span><strong>{dailyBrief.meetingsCount}</strong> {dailyBrief.meetingsCount === 1 ? "reunião." : "reuniões."}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                    <span><strong>{dailyBrief.pendingActions}</strong> {dailyBrief.pendingActions === 1 ? "pendência." : "pendências."}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <span>{dailyBrief.hasData ? "Dados sincronizados." : "Dados em conformidade (sincronização offline)."}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                    <span>Plano de ação {dailyBrief.pendingActions > 0 ? "ativo com monitoramento de metas." : "atualizado."}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                    <span>Última análise realizada há 15 minutos.</span>
                  </li>
                </ul>
              </div>

              <div className="border-t border-slate-800/60 pt-3 flex items-center justify-between text-[10px] text-slate-500 font-bold">
                <span>FONTE: GOVERNANÇA SAURON OS</span>
                <span className="flex items-center gap-1 text-emerald-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  COCKPIT BASEADO EM REGRAS ATIVAS
                </span>
              </div>
            </div>
          )}

          <ExecutiveWidgets
            widgetOrder={widgetOrder}
            enabledWidgets={enabledWidgets}
            healthScore={healthScore}
            recentActivities={recentActivities}
            activeProject={activeProject}
            quickAddAction={quickAddAction}
            setQuickAddAction={setQuickAddAction}
            newActionDescription={newActionDescription}
            setNewActionDescription={setNewActionDescription}
            newActionResponsible={newActionResponsible}
            setNewActionResponsible={setNewActionResponsible}
            newActionDeadline={newActionDeadline}
            setNewActionDeadline={setNewActionDeadline}
            newActionPriority={newActionPriority}
            setNewActionPriority={setNewActionPriority}
            handleAddActionPlan={handleAddActionPlan}
            handleToggleActionPlanStatus={handleToggleActionPlanStatus}
            handleRemoveActionPlan={handleRemoveActionPlan}
            quickAddMeeting={quickAddMeeting}
            setQuickAddMeeting={setQuickAddMeeting}
            newMeetingResponsible={newMeetingResponsible}
            setNewMeetingResponsible={setNewMeetingResponsible}
            newMeetingObservations={newMeetingObservations}
            setNewMeetingObservations={setNewMeetingObservations}
            handleCreateMeeting={handleCreateMeeting}
            onSelectTab={onSelectTab}
            formatCurrency={formatCurrency}
          />

          {false && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* GAVETA ESQUERDA: DAILY BRIEF & HEALTH SCORE DETAILS */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              
              {/* PANEL: DAILY BRIEF AUTOMÁTICO (Baseado em Regras Reais) */}
              {visiblePanels.dailyBrief && dailyBrief && (
                <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-4 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
                  
                  <div>
                    <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                      <Sparkles size={20} className="text-blue-400 animate-pulse" />
                      {dailyBrief.greeting}.
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 font-medium">
                      Status de controle do ecossistema executivo para o projeto <strong className="text-white">{activeProject.client}</strong>:
                    </p>
                  </div>

                  <div className="border-t border-slate-800/80 pt-4 flex flex-col gap-3 font-mono">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Hoje existem:</span>
                    <ul className="space-y-2 text-xs text-slate-300 pl-1">
                      <li className="flex items-center gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                        <span><strong>{dailyBrief.meetingsCount}</strong> {dailyBrief.meetingsCount === 1 ? "reunião." : "reuniões."}</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                        <span><strong>{dailyBrief.pendingActions}</strong> {dailyBrief.pendingActions === 1 ? "pendência." : "pendências."}</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                        <span>{dailyBrief.hasData ? "Dados sincronizados." : "Dados em conformidade (sincronização offline)."}</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                        <span>Plano de ação {dailyBrief.pendingActions > 0 ? "ativo com monitoramento de metas." : "atualizado."}</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                        <span>Última análise realizada há 15 minutos.</span>
                      </li>
                    </ul>
                  </div>

                  <div className="border-t border-slate-800/60 pt-3 flex items-center justify-between text-[10px] text-slate-500 font-bold">
                    <span>FONTE: GOVERNANÇA SAURON OS</span>
                    <span className="flex items-center gap-1 text-emerald-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      COCKPIT BASEADO EM REGRAS ATIVAS
                    </span>
                  </div>
                </div>
              )}

              {/* PANEL: HEALTH SCORE PREMIUM COMPONENT */}
              {visiblePanels.healthScoreDetails && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col gap-5">
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Award size={16} className="text-blue-500" />
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Algoritmo de Saúde do Projeto</h3>
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium">Cálculo Determinístico Ponderado</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    {/* Gauge Circle */}
                    <div className="md:col-span-4 flex flex-col items-center justify-center border-r border-slate-100 dark:border-slate-800 py-2 pr-4">
                      <div className="relative w-32 h-32 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          <circle
                            className="text-slate-100 dark:text-slate-800"
                            strokeWidth="8"
                            stroke="currentColor"
                            fill="transparent"
                            r="42"
                            cx="50"
                            cy="50"
                          />
                          <circle
                            className={`transition-all duration-700 ${
                              healthScore.total >= 80 ? "text-emerald-500" :
                              healthScore.total >= 50 ? "text-amber-500" : "text-rose-500"
                            }`}
                            strokeWidth="8"
                            strokeDasharray={2 * Math.PI * 42}
                            strokeDashoffset={2 * Math.PI * 42 * (1 - healthScore.total / 100)}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="transparent"
                            r="42"
                            cx="50"
                            cy="50"
                          />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                          <span className="text-3xl font-black tracking-tight">{healthScore.total}%</span>
                          <span className="text-[8px] uppercase tracking-widest font-extrabold text-slate-400">Score</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-500 font-bold mt-2">Saúde do Projeto</span>
                    </div>

                    {/* Dimension Progress Bars */}
                    <div className="md:col-span-8 flex flex-col gap-3.5">
                      {/* Dimensão 1: Ingestão de Dados */}
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className="text-slate-600 dark:text-slate-300">1. Ingestão de Dados (25% peso)</span>
                          <span className={healthScore.data === 100 ? "text-emerald-500" : "text-slate-400"}>{healthScore.data}%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div className={`h-full ${healthScore.data === 100 ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"}`} style={{ width: `${healthScore.data}%` }} />
                        </div>
                      </div>

                      {/* Dimensão 2: Mapeamento KPIs */}
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className="text-slate-600 dark:text-slate-300">2. Mapeamento de KPIs (15% peso)</span>
                          <span className={healthScore.kpis === 100 ? "text-emerald-500" : "text-slate-400"}>{healthScore.kpis}%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div className={`h-full ${healthScore.kpis === 100 ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"}`} style={{ width: `${healthScore.kpis}%` }} />
                        </div>
                      </div>

                      {/* Dimensão 3: Filtros */}
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className="text-slate-600 dark:text-slate-300">3. Configuração de Filtros (20% peso)</span>
                          <span className={healthScore.filters === 100 ? "text-emerald-500" : "text-slate-400"}>{healthScore.filters}%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div className={`h-full ${healthScore.filters === 100 ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"}`} style={{ width: `${healthScore.filters}%` }} />
                        </div>
                      </div>

                      {/* Dimensão 4: Apresentações */}
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className="text-slate-600 dark:text-slate-300">4. Apresentação Estruturada (20% peso)</span>
                          <span className={healthScore.pres === 100 ? "text-emerald-500" : "text-slate-400"}>{healthScore.pres}%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div className={`h-full ${healthScore.pres === 100 ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"}`} style={{ width: `${healthScore.pres}%` }} />
                        </div>
                      </div>

                      {/* Dimensão 5: Planos de Caixa */}
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className="text-slate-600 dark:text-slate-300">5. Plano de Caixa Ativo (20% peso)</span>
                          <span className={healthScore.plans === 100 ? "text-emerald-500" : "text-slate-400"}>{healthScore.plans}%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div className={`h-full ${healthScore.plans === 100 ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"}`} style={{ width: `${healthScore.plans}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PANEL: PLANO DE AÇÃO CORRETIVO (KANBAN) */}
              {visiblePanels.actionKanban && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={16} className="text-emerald-500" />
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Mitigações de Caixa & Plano de Ação</h3>
                    </div>
                    <button
                      onClick={() => setQuickAddAction(!quickAddAction)}
                      className="text-xs font-extrabold text-blue-500 hover:text-blue-600 flex items-center gap-1 cursor-pointer"
                    >
                      {quickAddAction ? "Fechar" : "Nova Meta rápida"}
                      <Plus size={14} />
                    </button>
                  </div>

                  {/* Quick Inline form */}
                  {quickAddAction && (
                    <form onSubmit={handleAddActionPlan} className="bg-slate-50 dark:bg-slate-800/40 border border-slate-150 dark:border-slate-800 p-4 rounded-xl flex flex-col gap-3 animate-fade-in">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] uppercase font-bold text-slate-400">O que precisa ser feito *</label>
                          <input
                            type="text"
                            required
                            placeholder="Ex: Auditoria do estoque obsoleto..."
                            value={newActionDescription}
                            onChange={(e) => setNewActionDescription(e.target.value)}
                            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] uppercase font-bold text-slate-400">Responsável *</label>
                          <input
                            type="text"
                            required
                            placeholder="Ex: Roberto (Financeiro)"
                            value={newActionResponsible}
                            onChange={(e) => setNewActionResponsible(e.target.value)}
                            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] uppercase font-bold text-slate-400">Prazo</label>
                          <input
                            type="date"
                            value={newActionDeadline}
                            onChange={(e) => setNewActionDeadline(e.target.value)}
                            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] uppercase font-bold text-slate-400">Prioridade</label>
                          <select
                            value={newActionPriority}
                            onChange={(e) => setNewActionPriority(e.target.value as "low" | "medium" | "high")}
                            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white"
                          >
                            <option value="low">Baixa</option>
                            <option value="medium">Média</option>
                            <option value="high">Alta</option>
                          </select>
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="self-end bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl cursor-pointer transition-colors shadow-sm"
                      >
                        Salvar Plano de Ação
                      </button>
                    </form>
                  )}

                  {/* Actions List */}
                  <div className="space-y-2 overflow-y-auto max-h-[250px] pr-1">
                    {activeProject.actionPlans.length > 0 ? (
                      activeProject.actionPlans.map((plan) => (
                        <div
                          key={plan.id}
                          className={`flex justify-between items-center p-3.5 rounded-xl border transition-all ${
                            plan.status === "completed"
                              ? "bg-slate-50/50 dark:bg-slate-800/20 border-slate-100 dark:border-slate-800/40 opacity-60"
                              : "bg-slate-50 dark:bg-slate-800/40 border-slate-150 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700"
                          }`}
                        >
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <button
                              onClick={() => handleToggleActionPlanStatus(plan.id)}
                              className={`mt-0.5 w-4.5 h-4.5 rounded border shrink-0 flex items-center justify-center transition-colors cursor-pointer ${
                                plan.status === "completed"
                                  ? "bg-emerald-500 border-emerald-500 text-white"
                                  : plan.status === "in-progress"
                                  ? "bg-amber-500/10 border-amber-500 text-amber-500"
                                  : "border-slate-300 dark:border-slate-700 text-transparent hover:border-slate-400"
                              }`}
                              title={`Status: ${plan.status.toUpperCase()} (Clique para alterar)`}
                            >
                              {plan.status === "completed" ? (
                                <Check size={11} strokeWidth={3} />
                              ) : plan.status === "in-progress" ? (
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              ) : null}
                            </button>

                            <div className="min-w-0 flex-1">
                              <span className={`text-xs font-extrabold block ${plan.status === "completed" ? "line-through text-slate-500" : "text-slate-900 dark:text-white"}`}>
                                {plan.description}
                              </span>
                              <div className="flex flex-wrap gap-2.5 mt-1 text-[10px] text-slate-500 font-bold">
                                <span className="flex items-center gap-1">
                                  <Users size={11} />
                                  Responsável: {plan.responsible}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock size={11} />
                                  Prazo: {plan.deadline}
                                </span>
                                <span className={`px-1.5 py-0.2 rounded uppercase text-[8px] font-black ${
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
                            title="Remover Plano de Ação"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-slate-400 text-xs italic">
                        Nenhum plano de ação de caixa cadastrado neste projeto.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* GAVETA DIREITA: CHECKLISTS, CONEXÕES E TIMELINE */}
            <div className="flex flex-col gap-6">
              
              {/* PANEL: SMART OPERATIONAL GUIDE CHECKLIST */}
              {visiblePanels.checklist && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-blue-500" />
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Guia de Passos Operacionais</h3>
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium">Recomendações Reais</span>
                  </div>

                  <div className="space-y-3">
                    {checklistItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-slate-50/40 dark:bg-slate-800/10 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all"
                      >
                        <span className={`mt-0.5 w-4.5 h-4.5 rounded-full border shrink-0 flex items-center justify-center ${
                          item.completed
                            ? "bg-emerald-500/10 border-emerald-500 text-emerald-500"
                            : "border-slate-300 dark:border-slate-700 text-transparent"
                        }`}>
                          <Check size={10} strokeWidth={3.5} />
                        </span>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-1">
                            <span className={`text-xs font-extrabold block truncate ${item.completed ? "text-slate-400 dark:text-slate-500 line-through" : "text-slate-900 dark:text-white"}`}>
                              {item.label}
                            </span>
                            {!item.completed && (
                              <button
                                onClick={() => onSelectTab(item.tabTarget)}
                                className="text-[10px] text-blue-500 hover:text-blue-600 font-black shrink-0 flex items-center gap-0.5 cursor-pointer"
                              >
                                Resolver
                                <ArrowRight size={10} />
                              </button>
                            )}
                          </div>
                          <span className="text-[9px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-snug">
                            {item.description}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PANEL: CONEXÕES RÁPIDAS (Micro Cards de Status) */}
              {visiblePanels.connections && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Network size={16} className="text-blue-500" />
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Ambiente de Redes & APIs</h3>
                    </div>
                    <span className="text-[9px] text-slate-400 font-bold">Modo Seguro</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* ERP Card */}
                    <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/10 flex flex-col gap-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Banco ERP (Postgre)</span>
                      <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800 dark:text-white mt-1">
                        <span className={`w-2.5 h-2.5 rounded-full ${connectionStatuses.db === "connected" ? "bg-emerald-500 shadow-sm" : "bg-rose-500"}`} />
                        {connectionStatuses.db === "connected" ? "Conectado" : "Desconectado"}
                      </div>
                    </div>

                    {/* Planilhas Card */}
                    <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/10 flex flex-col gap-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Planilhas Fiscais</span>
                      <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800 dark:text-white mt-1">
                        <span className={`w-2.5 h-2.5 rounded-full ${connectionStatuses.sheet === "connected" ? "bg-emerald-500" : "bg-amber-500"}`} />
                        {connectionStatuses.sheet === "connected" ? "Atualizadas" : "Sem Carga"}
                      </div>
                    </div>

                    {/* VPN Card */}
                    <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/10 flex flex-col gap-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">VPN Gateway</span>
                      <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800 dark:text-white mt-1">
                        <span className={`w-2.5 h-2.5 rounded-full ${connectionStatuses.vpn === "connected" ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                        {connectionStatuses.vpn === "connected" ? "Ativa" : "Inativa"}
                      </div>
                    </div>

                    {/* APIs Card */}
                    <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/10 flex flex-col gap-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">APIs do Sistema</span>
                      <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800 dark:text-white mt-1">
                        <span className={`w-2.5 h-2.5 rounded-full ${connectionStatuses.api === "connected" ? "bg-emerald-500" : "bg-amber-500"}`} />
                        {connectionStatuses.api === "connected" ? "Estáveis" : "Pendente"}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PANEL: RITUAIS AGENDADOS FORM & CARD */}
              {visiblePanels.meetings && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-purple-500" />
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Rituais do Conselho</h3>
                    </div>
                    <button
                      onClick={() => setQuickAddMeeting(!quickAddMeeting)}
                      className="text-xs font-extrabold text-blue-500 hover:text-blue-600 flex items-center gap-1 cursor-pointer"
                    >
                      {quickAddMeeting ? "Fechar" : "Novo Ritual"}
                      <Plus size={14} />
                    </button>
                  </div>

                  {/* Form to quick schedule meeting */}
                  {quickAddMeeting && (
                    <form onSubmit={handleCreateMeeting} className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-150 dark:border-slate-800 rounded-xl flex flex-col gap-3 animate-fade-in">
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] uppercase font-bold text-slate-400">Consultor Líder *</label>
                        <input
                          type="text"
                          required
                          value={newMeetingResponsible}
                          onChange={(e) => setNewMeetingResponsible(e.target.value)}
                          placeholder="Ex: Carlos Silveira (Sauron)"
                          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] uppercase font-bold text-slate-400">Pauta da Reunião</label>
                        <input
                          type="text"
                          value={newMeetingObservations}
                          onChange={(e) => setNewMeetingObservations(e.target.value)}
                          placeholder="Ex: Auditoria Contábil de Fechamento"
                          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white"
                        />
                      </div>
                      <button type="submit" className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs py-2 rounded-xl transition-colors cursor-pointer shadow-sm">
                        Salvar Reunião
                      </button>
                    </form>
                  )}

                  <div className="space-y-2 overflow-y-auto max-h-[160px]">
                    {activeProject.meetings.length > 0 ? (
                      activeProject.meetings.map((meet) => (
                        <div key={meet.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/10 border border-slate-100 dark:border-slate-800/60 flex items-start gap-2.5 text-xs font-bold text-slate-800 dark:text-white">
                          <Calendar size={15} className="text-purple-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="block text-xs font-extrabold">Ritual: {meet.responsible}</span>
                            <span className="block text-[10px] text-slate-500 font-medium mt-0.5">{meet.observations || "Discussão estratégica geral"}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-slate-400 text-xs italic">
                        Nenhum ritual executivo agendado ainda.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* PANEL: TIMELINE DE ATIVIDADES OPERACIONAIS */}
              {visiblePanels.timeline && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <Activity size={16} className="text-blue-500 animate-pulse" />
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Timeline de Atividades Recentes</h3>
                    </div>
                    <span className="text-[9px] text-slate-500 font-bold">Auditoria Ativa</span>
                  </div>

                  <div className="relative border-l-2 border-slate-100 dark:border-slate-800 ml-2.5 pl-4 space-y-4 max-h-[280px] overflow-y-auto pr-1">
                    {recentActivities.length > 0 ? (
                      recentActivities.map((act) => (
                        <div key={act.id} className="relative group">
                          {/* Dot */}
                          <span className={`absolute -left-[23px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900 shrink-0 shadow-sm ${
                            act.severity === "CRITICAL" || act.severity === "WARNING" ? "bg-amber-500" : "bg-blue-500"
                          }`} />
                          
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1.5">
                              <Clock size={10} />
                              {new Date(act.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })} - {act.type}
                            </span>
                            <span className="text-[10px] font-black text-slate-800 dark:text-slate-200 block mt-0.5 leading-snug">
                              {act.message}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-slate-400 text-xs italic">
                        Nenhuma atividade auditada no período.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          )}
        </>
      ) : (
        /* WORKSPACE VAZIO / NENHUM PROJETO ATIVO */
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/40 text-blue-500 rounded-full flex items-center justify-center border border-blue-200 dark:border-blue-900">
            <Briefcase size={32} />
          </div>
          <div className="max-w-md">
            <h3 className="text-lg font-black text-slate-950 dark:text-white uppercase tracking-tight">Nenhum Projeto Ativo Cadastrado</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-2 leading-relaxed">
              Para liberar o cockpit operacional premium do Sauron, configure seu projeto de consultoria ou clique no botão abaixo para carregar um projeto demonstrativo completo com rituais, dados e planos de caixa.
            </p>
          </div>
          <button
            onClick={handleSeedDemoProject}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs px-6 py-3 rounded-xl transition-all cursor-pointer shadow-md"
          >
            <Sparkles size={16} className="text-amber-300" />
            Carregar Projeto Demonstrativo
          </button>
        </div>
      )}
    </div>
  );
};
