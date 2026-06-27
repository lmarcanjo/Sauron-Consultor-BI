import React, { useState, useEffect, useMemo } from "react";
import {
  FolderOpen, FolderPlus, TrendingUp, TrendingDown, Building, Users, Database, Shield,
  ShieldCheck, CheckCircle2, AlertTriangle, Clock, Plus, Trash2, Calendar, Briefcase,
  Layers, ArrowRight, Sparkles, Award, BookOpen, Check, ChevronDown, ChevronUp,
  Activity, Settings, HelpCircle, FileText, SlidersHorizontal, Bell, RefreshCw, Eye,
  Menu, Network, ShieldAlert, Presentation, MonitorPlay, BarChart3, Trash, CheckSquare,
  ClipboardList, CheckSquare2, FileCheck, ArrowUpRight, Play, ExternalLink, ShieldX, CheckSquare as CheckIcon
} from "lucide-react";
import { consultantWorkspaceManager } from "../modules/consultant-workspace/ConsultantWorkspaceManager";
import { WorkspaceProject, ActionPlan, Meeting } from "../modules/consultant-workspace/types";
import { auditEngine } from "../core/audit/AuditEngine";
import { identityEngine } from "../core/identity/IdentityEngine";

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
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectGroup, setNewProjectGroup] = useState("");
  const [newProjectSegment, setNewProjectSegment] = useState("");

  // --- Simulated context from IdentityEngine ---
  const currentUser = useMemo(() => identityEngine.getCurrentUser(), []);
  const currentOrg = useMemo(() => identityEngine.getCurrentOrganization(), []);

  // --- Dynamic actions & meetings inside selected project ---
  const [tasks, setTasks] = useState<ActionPlan[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskResp, setNewTaskResp] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"low" | "medium" | "high">("medium");

  // --- Interactive Maturity Dimension checklist expansion ---
  const [activeMaturityDimension, setActiveMaturityDimension] = useState<string | null>("dados");

  // --- Decisions List inside Decision Center ---
  const [decisions, setDecisions] = useState<Array<{
    id: string;
    title: string;
    category: string;
    impact: string;
    status: "pending" | "approved" | "archived";
    recommendedBy: string;
  }>>([
    {
      id: "dec_1",
      title: "Redução de CMV em 3.2pp por renegociação de compras de lubrificantes",
      category: "Custos",
      impact: "Alto (+ R$ 42k/mês)",
      status: "pending",
      recommendedBy: "AnalyticsEngine"
    },
    {
      id: "dec_2",
      title: "Reenquadramento tributário para monofásico em Peças & Acessórios",
      category: "Tributário",
      impact: "Médio (+ R$ 18k/mês)",
      status: "pending",
      recommendedBy: "BusinessEngine"
    },
    {
      id: "dec_3",
      title: "Otimização de Headcount na Oficina (revisão de metas de produtividade)",
      category: "Operações",
      impact: "Alto (+ R$ 35k/mês)",
      status: "pending",
      recommendedBy: "ConsultantWorkspaceManager"
    },
    {
      id: "dec_4",
      title: "Aceleração de Giro de Seminovos obsoletos (> 90 dias) com bônus de vendas",
      category: "Vendas",
      impact: "Alto (Liberação de R$ 320k em capital de giro)",
      status: "pending",
      recommendedBy: "AnalyticsEngine"
    }
  ]);

  // --- Load Data and Seed Default Project if needed ---
  const loadWorkspace = async () => {
    let list = await consultantWorkspaceManager.listActiveProjects();
    
    // Seed default robust project if none exists (to ensure first-time high fidelity experience)
    if (list.length === 0) {
      const defaultProject = await consultantWorkspaceManager.createProject({
        client: "Grupo Topázio Veículos",
        group: "Grupo Topázio",
        segment: "Automotivo (Concessionárias)",
        companies: ["Topázio Nissan", "Topázio Renault", "Topázio Seminovos"],
        brands: ["Nissan", "Renault"],
        cnpjs: ["00.123.456/0001-01", "00.123.456/0002-02"],
        dbConnections: [
          { id: "db_1", name: "Sauron Cloud PostgreSQL", host: "postgresql.sauron-platform.internal" }
        ],
        spreadsheets: [
          { id: "ss_1", name: "Fechamento_Junho_2026.xlsx", path: "/imports/Fechamento_Junho_2026.xlsx" }
        ],
        importProfile: {
          id: "prof_1",
          name: "Perfil Importação Nissan",
          rules: {}
        },
        filters: [],
        kpis: [
          { id: "kpi_1", name: "Faturamento Bruto", target: 4500000 },
          { id: "kpi_2", name: "Margem Bruta (%)", target: 14.5 }
        ],
        dashboards: [],
        presentations: [],
        actionPlans: [
          {
            id: "act_1",
            description: "Renegociar taxas de adiantamento de recebíveis com banco Nissan",
            priority: "high",
            responsible: "Ana Finanças",
            deadline: "2026-07-10",
            status: "in-progress",
            origin: "DRE"
          },
          {
            id: "act_2",
            description: "Implementar rito de precificação dinâmica de Seminovos",
            priority: "medium",
            responsible: "Carlos Loja Nissan",
            deadline: "2026-07-15",
            status: "pending",
            origin: "Auditoria"
          },
          {
            id: "act_3",
            description: "Revisar comissão técnica da Oficina",
            priority: "low",
            responsible: "Roberto Consultor",
            deadline: "2026-07-20",
            status: "completed",
            origin: "KPI"
          }
        ],
        observations: "Projeto de reestruturação operacional e controle financeiro do Grupo Topázio.",
        history: [
          { id: "h_1", event: "Setup de Alinhamento Estratégico Realizado", timestamp: "2026-06-01T10:00:00Z" },
          { id: "h_2", event: "Primeiro Diagnóstico de Vazamentos de Caixa Concluído", timestamp: "2026-06-15T14:30:00Z" },
          { id: "h_3", event: "Homologação do Modelo Contábil de CMV Ativado", timestamp: "2026-06-20T11:15:00Z" }
        ],
        auditLog: []
      });
      list = [defaultProject];
      await consultantWorkspaceManager.setActiveProject(defaultProject.id);
    }

    setProjects(list);
    const active = await consultantWorkspaceManager.getActiveProject();
    if (active) {
      setActiveProject(active);
      setTasks(active.actionPlans || []);
      setMeetings(active.meetings || [
        {
          id: "m_1",
          presentationId: "pres_junho",
          selectedCharts: ["DRE", "Margens"],
          observations: "Definição do CMV alvo para Q3/2026",
          decisions: "CMV reduzido em 1.5pp homologado",
          actionPlans: [],
          responsible: "Gabriel Arcanjo",
          pendingItems: ["Aprovação diretoria"]
        }
      ]);
    } else if (list.length > 0) {
      await consultantWorkspaceManager.setActiveProject(list[0].id);
      setActiveProject(list[0]);
      setTasks(list[0].actionPlans || []);
    }
  };

  useEffect(() => {
    loadWorkspace();
  }, []);

  const handleSelectProject = async (projectId: string) => {
    await consultantWorkspaceManager.setActiveProject(projectId);
    const proj = projects.find(p => p.id === projectId) || null;
    setActiveProject(proj);
    if (proj) {
      setTasks(proj.actionPlans || []);
      setMeetings(proj.meetings || []);
    }
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
      observations: `Caso de consultoria criado para ${newProjectName}.`,
      history: [{ id: "h_1", event: "Caso de Consultoria inicializado", timestamp: new Date().toISOString() }],
      auditLog: []
    });

    setProjects(prev => [...prev, newProj]);
    setActiveProject(newProj);
    setTasks([]);
    setMeetings([]);
    setIsCreatingProject(false);
    setNewProjectName("");
    setNewProjectGroup("");
    setNewProjectSegment("");

    auditEngine.logEvent(
      "PROJECT_CREATED",
      `Criou o caso de consultoria: ${newProj.client}`,
      "INFO",
      { projectId: newProj.id }
    );
  };

  // --- Task Operations ---
  const handleToggleTask = async (taskId: string) => {
    if (!activeProject) return;
    const updatedTasks = tasks.map(t => {
      if (t.id === taskId) {
        const nextStatus: ActionPlan["status"] = 
          t.status === "completed" ? "pending" : 
          t.status === "pending" ? "in-progress" : "completed";
        return { ...t, status: nextStatus };
      }
      return t;
    });

    setTasks(updatedTasks);
    const updatedProj = { ...activeProject, actionPlans: updatedTasks };
    setActiveProject(updatedProj);
    await consultantWorkspaceManager.updateProject(updatedProj);

    auditEngine.logEvent(
      "TASK_TOGGLED",
      `Atualizou status do plano de ação ID ${taskId}`,
      "INFO",
      { taskId }
    );
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject || !newTaskDesc) return;

    const newTask: ActionPlan = {
      id: crypto.randomUUID(),
      description: newTaskDesc,
      priority: newTaskPriority,
      responsible: newTaskResp || (currentUser?.profile?.fullName || "Consultor"),
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      status: "pending",
      origin: "Comando Central"
    };

    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    const updatedProj = { ...activeProject, actionPlans: updatedTasks };
    setActiveProject(updatedProj);
    await consultantWorkspaceManager.updateProject(updatedProj);

    setNewTaskDesc("");
    setNewTaskResp("");
    setNewTaskPriority("medium");

    auditEngine.logEvent(
      "TASK_CREATED",
      `Criou nova ação: ${newTask.description}`,
      "INFO",
      { taskId: newTask.id }
    );
  };

  // --- Decision operations ---
  const handleDecisionStatus = (id: string, status: "approved" | "archived") => {
    setDecisions(prev => prev.map(d => d.id === id ? { ...d, status } : d));
    const dec = decisions.find(d => d.id === id);
    if (dec) {
      auditEngine.logEvent(
        "DECISION_RESOLVED",
        `Decisão estratégica [${dec.title}] marcada como ${status.toUpperCase()}`,
        status === "approved" ? "WARNING" : "INFO"
      );
    }
  };

  // --- Calculated KPIs based on filteredData or fallbacks ---
  const stats = useMemo(() => {
    let revenue = 3850000;
    let margin = 13.8;
    let expenses = 420000;
    let ebitda = 345000;

    if (filteredData && filteredData.length > 0) {
      const totRev = filteredData.reduce((acc, d) => {
        const val = Number(d.Valor || d.valor || d.Total || 0);
        return acc + val;
      }, 0);
      if (totRev > 0) revenue = totRev;
    }

    return {
      revenue,
      margin,
      expenses,
      ebitda
    };
  }, [filteredData]);

  // Dimension details checklists mapped to activeMaturityDimension
  const dimensionChecklists = {
    dados: [
      { id: "d1", label: "Ingestão de faturamento ativa e automatizada", checked: true },
      { id: "d2", label: "Mascaramento de CPFs/Dados pessoais em conformidade com LGPD", checked: true },
      { id: "d3", label: "Validação contábil de contas e centros de custos concluída", checked: true },
    ],
    kpis: [
      { id: "k1", label: "Definição de margem de contribuição mínima por segmento", checked: true },
      { id: "k2", label: "Estabelecer meta de vendas de seminovos para Q3", checked: true },
      { id: "k3", label: "Homologação de CMV alvo para compras de peças corporativas", checked: false },
    ],
    filtros: [
      { id: "f1", label: "Filtros de Grupos Econômicos mapeados e parametrizados", checked: true },
      { id: "f2", label: "Divisão lógica de faturamento por marcas ativada", checked: true },
      { id: "f3", label: "Segmentação dinâmica por canais comerciais disponível", checked: true },
    ],
    storytelling: [
      { id: "s1", label: "Criação do deck mensal consolidado para o conselho", checked: true },
      { id: "s2", label: "Story Builder estruturado por árvores de resultados", checked: true },
      { id: "s3", label: "Identificação visual de quebra de faturamento no slide 2", checked: true },
    ],
    reunioes: [
      { id: "r1", label: "Sessão de Conselho agendada na agenda do Board", checked: true },
      { id: "r2", label: "Ata de reunião anterior redigida e homologada", checked: true },
      { id: "r3", label: "Definição formal de ritos semanais de faturamento", checked: true },
    ],
    plano: [
      { id: "p1", label: "Atribuição de responsáveis por plano de reestruturação de CMV", checked: true },
      { id: "p2", label: "Agendamento de follow-up semanal de vendas", checked: false },
      { id: "p3", label: "Homologação de pendências de caixa remanescentes", checked: false },
    ]
  };

  // --- EMPTY STATE RENDERING ---
  if (projects.length === 0 || !activeProject) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 text-center space-y-6 max-w-2xl mx-auto">
        <div className="w-16 h-16 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center">
          <Building size={32} />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black uppercase tracking-wider text-slate-800 dark:text-white">
            Bem-vindo ao Sauron OS
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
            O Consulting Operating System de alta confiabilidade para consultores e conselhos executivos. Para inicializar, crie um novo caso de consultoria ou carregue o cenário de demonstração certificado.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={async () => {
              const defaultProject = await consultantWorkspaceManager.createProject({
                client: "Grupo Topázio Veículos",
                group: "Grupo Topázio",
                segment: "Automotivo (Concessionárias)",
                companies: ["Topázio Nissan", "Topázio Renault", "Topázio Seminovos"],
                brands: ["Nissan", "Renault"],
                cnpjs: ["00.123.456/0001-01", "00.123.456/0002-02"],
                dbConnections: [
                  { id: "db_1", name: "Sauron Cloud PostgreSQL", host: "postgresql.sauron-platform.internal" }
                ],
                spreadsheets: [
                  { id: "ss_1", name: "Fechamento_Junho_2026.xlsx", path: "/imports/Fechamento_Junho_2026.xlsx" }
                ],
                importProfile: {
                  id: "prof_1",
                  name: "Perfil Importação Nissan",
                  rules: {}
                },
                filters: [],
                kpis: [
                  { id: "kpi_1", name: "Faturamento Bruto", target: 4500000 },
                  { id: "kpi_2", name: "Margem Bruta (%)", target: 14.5 }
                ],
                dashboards: [],
                presentations: [],
                actionPlans: [
                  {
                    id: "act_1",
                    description: "Renegociar taxas de adiantamento de recebíveis com banco Nissan",
                    priority: "high",
                    responsible: "Ana Finanças",
                    deadline: "2026-07-10",
                    status: "in-progress",
                    origin: "DRE"
                  }
                ],
                observations: "Projeto de reestruturação operacional e controle financeiro.",
                history: [
                  { id: "h_1", event: "Setup de Alinhamento Estratégico Realizado", timestamp: new Date().toISOString() }
                ],
                auditLog: []
              });
              setProjects([defaultProject]);
              setActiveProject(defaultProject);
              setTasks(defaultProject.actionPlans || []);
              setMeetings([{
                id: "m_1",
                presentationId: "pres_junho",
                selectedCharts: ["DRE", "Margens"],
                observations: "Definição do CMV alvo para Q3/2026",
                decisions: "CMV reduzido em 1.5pp homologado",
                actionPlans: [],
                responsible: "Gabriel Arcanjo",
                pendingItems: ["Aprovação diretoria"]
              }]);
            }}
            className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wide rounded-xl shadow-lg shadow-blue-600/20 cursor-pointer transition-all flex items-center justify-center gap-2"
          >
            <Sparkles size={14} />
            Inicializar Caso de Demonstração
          </button>
          <button
            onClick={() => setIsCreatingProject(true)}
            className="px-5 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-black text-xs uppercase tracking-wide rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer transition-all"
          >
            Criar Caso de Consultoria
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      
      {/* Selector & Workspace Manager Bar */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg shrink-0">
            <Building size={18} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest leading-none">Operating System de Consultoria</p>
            <div className="flex items-center gap-2 mt-1">
              <select
                value={activeProject?.id || ""}
                onChange={(e) => handleSelectProject(e.target.value)}
                className="bg-transparent font-extrabold text-base text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer pr-1"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id} className="bg-slate-900 text-slate-100">
                    {p.group} — {p.client}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreatingProject(!isCreatingProject)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-extrabold text-[10px] uppercase rounded-lg border border-slate-200 dark:border-slate-700 transition cursor-pointer"
          >
            <FolderPlus size={13} />
            <span>Novo Caso</span>
          </button>
        </div>
      </div>

      {/* Creation Modal/Collapse */}
      {isCreatingProject && (
        <form onSubmit={handleCreateProject} className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4 animate-fade-in">
          <p className="text-xs font-black uppercase text-slate-700 dark:text-slate-300">Inicializar Novo Caso de Consultoria</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Nome do Caso/Cliente"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="px-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white"
              required
            />
            <input
              type="text"
              placeholder="Grupo Econômico (ex: Grupo Topázio)"
              value={newProjectGroup}
              onChange={(e) => setNewProjectGroup(e.target.value)}
              className="px-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white"
            />
            <input
              type="text"
              placeholder="Segmento Industrial"
              value={newProjectSegment}
              onChange={(e) => setNewProjectSegment(e.target.value)}
              className="px-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreatingProject(false)}
              className="px-3 py-1.5 text-[10px] uppercase font-black text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase rounded-lg"
            >
              Confirmar
            </button>
          </div>
        </form>
      )}

      {/* ────────────────────────────────────────────────────────────────────────
          1. EXECUTIVE BRIEF
          ──────────────────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-blue-900/10 via-indigo-950/5 to-transparent border border-blue-500/10 p-5 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -z-10" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white font-sans">
              Bem-vindo ao Centro de Comando Executivo, <span className="text-blue-500 font-extrabold">{currentUser?.profile?.fullName || "Consultor"}</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Caso de Consultoria: <strong className="text-slate-700 dark:text-slate-200">{activeProject?.client}</strong> ({activeProject?.segment}) • Organização: <strong className="text-slate-700 dark:text-slate-200">{currentOrg.name}</strong>
            </p>
          </div>
          <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-full text-[10px] font-mono text-blue-700 dark:text-blue-400 uppercase font-black tracking-wider">
            <CheckCircle2 size={12} className="text-blue-500 shrink-0" />
            Dados Atualizados • 4 Recomendações Ativas
          </div>
        </div>

        {/* Dynamic Executive Brief Narrative (Rule-based) */}
        <div className="mt-4 p-3 bg-white/60 dark:bg-slate-900/40 backdrop-blur-xs rounded-xl border border-slate-200/50 dark:border-slate-800/60 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
          <span className="font-extrabold text-blue-600 dark:text-blue-400 uppercase mr-1">Resumo Executivo do Período:</span>
          O caso de consultoria do {activeProject?.client} apresenta um índice de maturidade operacional <span className="text-emerald-500 font-bold">saudável (Score 88/100)</span>. 
          O faturamento projetado aponta para <span className="font-bold text-slate-900 dark:text-slate-100">{formatCurrency(stats.revenue)}</span>, com margem geral de {stats.margin}%. 
          Há {decisions.filter(d => d.status === "pending").length} decisões pendentes de deliberação imediata no Decision Center, e {tasks.filter(t => t.status !== "completed").length} planos operacionais em andamento para este ciclo.
        </div>
      </section>

      {/* Grid of Command Center Cockpit Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Main Cockpit View) */}
        <div className="lg:col-span-2 space-y-6">

          {/* ────────────────────────────────────────────────────────────────────────
              2. ÍNDICE DE MATURIDADE OPERACIONAL
              ──────────────────────────────────────────────────────────────────────── */}
          <section className="bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800/50">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
                <Award size={14} className="text-indigo-500" /> Índice de Maturidade Operacional (Health Score)
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">Clique nas Dimensões para Ver Detalhes</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
              {/* Big Score Widget */}
              <div className="md:col-span-1 text-center py-5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-150 dark:border-slate-850">
                <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Score Geral</p>
                <p className="text-4xl font-extrabold text-blue-600 dark:text-blue-400 mt-1 font-mono tracking-tight">88</p>
                <span className="text-[8px] px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 rounded-full font-bold uppercase mt-1 inline-block">Maturidade Alta</span>
              </div>

              {/* Six Dimensions Checklist Selector Grid */}
              <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {/* Dim 1: Dados */}
                <button
                  type="button"
                  onClick={() => setActiveMaturityDimension(activeMaturityDimension === "dados" ? null : "dados")}
                  className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${activeMaturityDimension === "dados" ? "bg-indigo-500/10 border-indigo-500 text-indigo-750 dark:text-indigo-300" : "bg-slate-50 dark:bg-slate-950 border-slate-150 dark:border-slate-850 hover:bg-slate-100"}`}
                >
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                  <div>
                    <p className="font-extrabold text-[10px]">1. Dados (ETL)</p>
                    <span className="text-[9px] font-mono text-slate-400">3 de 3 concluídas</span>
                  </div>
                </button>

                {/* Dim 2: KPIs */}
                <button
                  type="button"
                  onClick={() => setActiveMaturityDimension(activeMaturityDimension === "kpis" ? null : "kpis")}
                  className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${activeMaturityDimension === "kpis" ? "bg-indigo-500/10 border-indigo-500 text-indigo-750 dark:text-indigo-300" : "bg-slate-50 dark:bg-slate-950 border-slate-150 dark:border-slate-850 hover:bg-slate-100"}`}
                >
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                  <div>
                    <p className="font-extrabold text-[10px]">2. KPIs (Metas)</p>
                    <span className="text-[9px] font-mono text-slate-400">2 de 3 concluídas</span>
                  </div>
                </button>

                {/* Dim 3: Filtros */}
                <button
                  type="button"
                  onClick={() => setActiveMaturityDimension(activeMaturityDimension === "filtros" ? null : "filtros")}
                  className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${activeMaturityDimension === "filtros" ? "bg-indigo-500/10 border-indigo-500 text-indigo-750 dark:text-indigo-300" : "bg-slate-50 dark:bg-slate-950 border-slate-150 dark:border-slate-850 hover:bg-slate-100"}`}
                >
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                  <div>
                    <p className="font-extrabold text-[10px]">3. Filtros (Ativos)</p>
                    <span className="text-[9px] font-mono text-slate-400">3 de 3 concluídas</span>
                  </div>
                </button>

                {/* Dim 4: Storytelling */}
                <button
                  type="button"
                  onClick={() => setActiveMaturityDimension(activeMaturityDimension === "storytelling" ? null : "storytelling")}
                  className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${activeMaturityDimension === "storytelling" ? "bg-indigo-500/10 border-indigo-500 text-indigo-750 dark:text-indigo-300" : "bg-slate-50 dark:bg-slate-950 border-slate-150 dark:border-slate-850 hover:bg-slate-100"}`}
                >
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                  <div>
                    <p className="font-extrabold text-[10px]">4. Storytelling</p>
                    <span className="text-[9px] font-mono text-slate-400">3 de 3 concluídas</span>
                  </div>
                </button>

                {/* Dim 5: Reuniões */}
                <button
                  type="button"
                  onClick={() => setActiveMaturityDimension(activeMaturityDimension === "reunioes" ? null : "reunioes")}
                  className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${activeMaturityDimension === "reunioes" ? "bg-indigo-500/10 border-indigo-500 text-indigo-750 dark:text-indigo-300" : "bg-slate-50 dark:bg-slate-950 border-slate-150 dark:border-slate-850 hover:bg-slate-100"}`}
                >
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                  <div>
                    <p className="font-extrabold text-[10px]">5. Rituais Board</p>
                    <span className="text-[9px] font-mono text-slate-400">3 de 3 concluídas</span>
                  </div>
                </button>

                {/* Dim 6: Plano */}
                <button
                  type="button"
                  onClick={() => setActiveMaturityDimension(activeMaturityDimension === "plano" ? null : "plano")}
                  className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${activeMaturityDimension === "plano" ? "bg-indigo-500/10 border-indigo-500 text-indigo-750 dark:text-indigo-300" : "bg-slate-50 dark:bg-slate-950 border-slate-150 dark:border-slate-850 hover:bg-slate-100"}`}
                >
                  <AlertTriangle size={13} className="text-amber-500 shrink-0 animate-pulse" />
                  <div>
                    <p className="font-extrabold text-[10px]">6. Plano Executivo</p>
                    <span className="text-[9px] font-mono text-amber-500">1 de 3 concluídas</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Checklist details drawer inside card */}
            {activeMaturityDimension && (
              <div className="mt-3 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl space-y-2 animate-fade-in">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Checklist Operacional de Qualidade — {activeMaturityDimension.toUpperCase()}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  {dimensionChecklists[activeMaturityDimension as keyof typeof dimensionChecklists]?.map((item) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded flex items-center justify-center border ${item.checked ? 'bg-blue-500/10 border-blue-500/30 text-blue-600' : 'bg-slate-100 dark:bg-slate-900 border-slate-200 text-transparent'}`}>
                        {item.checked && <Check size={12} strokeWidth={3} />}
                      </div>
                      <span className={item.checked ? "text-slate-600 dark:text-slate-300 font-medium" : "text-slate-400 font-medium italic"}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* ────────────────────────────────────────────────────────────────────────
              3. CLIENT PULSE
              ──────────────────────────────────────────────────────────────────────── */}
          <section className="bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800/50">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
                <Activity size={14} className="text-indigo-500" /> Client Pulse — Saúde de Resultados do Período
              </h3>
              <span className="text-[10px] text-slate-400 font-semibold font-mono">Consolidação Operacional</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Pulse 1 */}
              <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Receita & Faturamento</span>
                  <span className="text-[10px] text-emerald-500 font-black flex items-center gap-0.5 font-mono">
                    <TrendingUp size={10} /> +12%
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: "84%" }} />
                </div>
                <p className="text-[10px] text-slate-500 font-medium font-mono flex justify-between">
                  <span>Alvo: R$ 4.5M</span>
                  <span>Proj: {formatCurrency(stats.revenue)}</span>
                </p>
              </div>

              {/* Pulse 2 */}
              <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Margem Comercial</span>
                  <span className="text-[10px] text-amber-500 font-black flex items-center gap-0.5 font-mono">
                    <TrendingDown size={10} /> -0.4pp
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: "72%" }} />
                </div>
                <p className="text-[10px] text-slate-500 font-medium font-mono flex justify-between">
                  <span>Alvo: 14.5%</span>
                  <span>Atual: {stats.margin}%</span>
                </p>
              </div>

              {/* Pulse 3 */}
              <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">EBITDA Gerencial</span>
                  <span className="text-[10px] text-emerald-500 font-black flex items-center gap-0.5 font-mono">
                    <TrendingUp size={10} /> +5.3%
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: "91%" }} />
                </div>
                <p className="text-[10px] text-slate-500 font-medium font-mono flex justify-between">
                  <span>Alvo: R$ 380k</span>
                  <span>Proj: R$ 412k</span>
                </p>
              </div>

              {/* Pulse 4 */}
              <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Planos Concluídos</span>
                  <span className="text-[10px] text-blue-500 font-black font-mono">
                    {Math.round((tasks.filter(t => t.status === "completed").length / (tasks.length || 1)) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${(tasks.filter(t => t.status === "completed").length / (tasks.length || 1)) * 100}%` }} />
                </div>
                <p className="text-[10px] text-slate-500 font-medium font-mono flex justify-between">
                  <span>Iniciativas: {tasks.length}</span>
                  <span>Concluídas: {tasks.filter(t => t.status === "completed").length}</span>
                </p>
              </div>
            </div>
          </section>

          {/* ────────────────────────────────────────────────────────────────────────
              4. DECISION CENTER
              ──────────────────────────────────────────────────────────────────────── */}
          <section className="bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800/50">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
                <Sparkles size={14} className="text-blue-500" /> Decision Center — Deliberações Recomendadas
              </h3>
              <span className="text-[9px] font-mono text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded uppercase font-black">Algoritmo Homologado</span>
            </div>

            <div className="space-y-3">
              {decisions.map((dec) => (
                <div 
                  key={dec.id} 
                  className={`p-3 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-all ${
                    dec.status === "approved" ? "border-emerald-500/20 bg-emerald-500/5 opacity-70" :
                    dec.status === "archived" ? "border-slate-200/40 bg-slate-100/10 dark:bg-slate-950/40 opacity-50" :
                    "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-755 bg-slate-50/50 dark:bg-slate-950/30"
                  }`}
                >
                  <div className="space-y-1 pr-4">
                    <div className="flex items-center gap-2">
                      <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded font-mono ${
                        dec.category === "Custos" ? "bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400" :
                        dec.category === "Tributário" ? "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400" :
                        "bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400"
                      }`}>
                        {dec.category}
                      </span>
                      <span className="text-[9px] font-mono font-bold text-emerald-600 dark:text-emerald-400">{dec.impact}</span>
                    </div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug">{dec.title}</p>
                    <p className="text-[9px] text-slate-400 font-mono">Recomendação via: {dec.recommendedBy}</p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto justify-end">
                    {dec.status === "pending" ? (
                      <>
                        <button
                          onClick={() => handleDecisionStatus(dec.id, "approved")}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[9px] uppercase rounded-lg transition-colors cursor-pointer"
                        >
                          Aprovar
                        </button>
                        <button
                          onClick={() => handleDecisionStatus(dec.id, "archived")}
                          className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-755 text-slate-600 dark:text-slate-300 font-extrabold text-[9px] uppercase rounded-lg transition-colors cursor-pointer"
                        >
                          Arquivar
                        </button>
                      </>
                    ) : (
                      <span className="text-[10px] font-mono font-black uppercase text-slate-400 flex items-center gap-1">
                        <Check size={12} strokeWidth={3} /> {dec.status === "approved" ? "Aprovado" : "Arquivado"}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ────────────────────────────────────────────────────────────────────────
              5. RITUAIS DO MÉTODO SAURON
              ──────────────────────────────────────────────────────────────────────── */}
          <section className="bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-4">
            <div className="pb-2 border-b border-slate-100 dark:border-slate-800/50 flex justify-between items-center">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
                <MonitorPlay size={14} className="text-indigo-500" /> Rituais do Método Sauron
              </h3>
              <button 
                onClick={() => onSelectTab("modo_reuniao")}
                className="text-[10px] text-indigo-500 hover:text-indigo-600 font-black uppercase flex items-center gap-0.5 cursor-pointer"
              >
                Board Room <Play size={10} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Ritual 1 */}
              <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-slate-800 dark:text-slate-100">Dossiê de Conselho</span>
                    <span className="text-[8px] px-1.5 py-0.2 bg-emerald-500/10 text-emerald-500 rounded font-bold uppercase">Preparado</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">Última revisão do fechamento operacional e validação de CMV de peças para o board.</p>
                </div>
                <button
                  onClick={() => onSelectTab("apresentacoes")}
                  className="w-full mt-2 py-1 bg-slate-150 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-[10px] font-extrabold uppercase rounded-lg text-center cursor-pointer transition-colors"
                >
                  Ver Slides
                </button>
              </div>

              {/* Ritual 2 */}
              <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-slate-800 dark:text-slate-100">Rito Quinzenal</span>
                    <span className="text-[8px] px-1.5 py-0.2 bg-blue-500/10 text-blue-500 rounded font-bold uppercase">Agendado</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">Comitê de reestruturação tributária monofásica de peças e faturamento de oficina.</p>
                </div>
                <button
                  onClick={() => onSelectTab("modo_reuniao")}
                  className="w-full mt-2 py-1 bg-blue-550/10 text-blue-500 hover:bg-blue-550/20 text-[10px] font-extrabold uppercase rounded-lg text-center cursor-pointer transition-colors"
                >
                  Abrir Ata
                </button>
              </div>

              {/* Ritual 3 */}
              <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-slate-800 dark:text-slate-100">Fechamento de Ciclo</span>
                    <span className="text-[8px] px-1.5 py-0.2 bg-amber-500/10 text-amber-500 rounded font-bold uppercase">Pendente</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">Análise de lacunas fiscais e apuração de comissões finais dos gerentes de filiais.</p>
                </div>
                <button
                  onClick={() => onSelectTab("fechamento_mensal")}
                  className="w-full mt-2 py-1 bg-amber-550/10 text-amber-500 hover:bg-amber-550/20 text-[10px] font-extrabold uppercase rounded-lg text-center cursor-pointer transition-colors"
                >
                  Iniciar Conciliação
                </button>
              </div>
            </div>
          </section>

          {/* ────────────────────────────────────────────────────────────────────────
              6. PRÓXIMAS AÇÕES DO PROJETO
              ──────────────────────────────────────────────────────────────────────── */}
          <section className="bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800/50">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
                <CheckSquare size={14} className="text-blue-500" /> Próximas Ações do Projeto
              </h3>
              <span className="text-[10px] text-slate-400 font-bold font-mono">Plano Operacional Semanal</span>
            </div>

            {/* Form to add action plan item */}
            <form onSubmit={handleAddTask} className="flex gap-2">
              <input
                type="text"
                placeholder="Adicionar tarefa operacional ao plano executivo..."
                value={newTaskDesc}
                onChange={(e) => setNewTaskDesc(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 font-medium"
                required
              />
              <input
                type="text"
                placeholder="Responsável"
                value={newTaskResp}
                onChange={(e) => setNewTaskResp(e.target.value)}
                className="w-24 sm:w-32 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 font-medium"
              />
              <button
                type="submit"
                className="px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center shrink-0 cursor-pointer"
              >
                <Plus size={16} />
              </button>
            </form>

            {/* Checklist items */}
            <div className="space-y-2">
              {tasks.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-400">Nenhuma tarefa pendente neste caso.</p>
              ) : (
                tasks.map((task) => {
                  const isCompleted = task.status === "completed";
                  const isProgress = task.status === "in-progress";

                  return (
                    <div 
                      key={task.id} 
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-950/20 border-slate-150 dark:border-slate-850 transition-all ${
                        isCompleted ? "opacity-60" : ""
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => handleToggleTask(task.id)}
                          className={`mt-0.5 w-4.5 h-4.5 rounded border flex items-center justify-center transition-all cursor-pointer ${
                            isCompleted ? "bg-emerald-500 border-emerald-600 text-white" :
                            isProgress ? "bg-blue-500/10 border-blue-500 text-blue-500" :
                            "border-slate-300 dark:border-slate-700 text-transparent"
                          }`}
                        >
                          {isCompleted ? <Check size={11} strokeWidth={3} /> : isProgress ? <Clock size={10} /> : null}
                        </button>
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs font-bold leading-normal truncate ${
                            isCompleted ? "line-through text-slate-400" : "text-slate-800 dark:text-slate-100"
                          }`}>
                            {task.description}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-[9px] text-slate-400 font-mono">
                            <span className="font-extrabold uppercase text-slate-500 flex items-center gap-0.5">
                              <Users size={10} /> {task.responsible}
                            </span>
                            <span>•</span>
                            <span>Expira: {task.deadline}</span>
                            <span>•</span>
                            <span className={`font-black uppercase text-[8px] px-1 py-0.2 rounded ${
                              task.priority === "high" ? "bg-rose-500/10 text-rose-500" :
                              task.priority === "medium" ? "bg-amber-500/10 text-amber-500" :
                              "bg-slate-100 dark:bg-slate-800 text-slate-400"
                            }`}>
                              {task.priority}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded font-mono ${
                          isCompleted ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400" :
                          isProgress ? "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400" :
                          "bg-slate-150 dark:bg-slate-850 text-slate-500"
                        }`}>
                          {task.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* ────────────────────────────────────────────────────────────────────────
              7. KPIs ESTRATÉGICOS
              ──────────────────────────────────────────────────────────────────────── */}
          <section className="bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800/50">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
                <BarChart3 size={14} className="text-indigo-500" /> KPIs Estratégicos (Metas de Conselho)
              </h3>
              <button 
                onClick={() => onSelectTab("comercial")}
                className="text-[10px] text-blue-500 hover:text-blue-600 font-extrabold uppercase flex items-center gap-0.5"
              >
                Mapeamento Geral <ArrowRight size={10} />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* KPI 1 */}
              <div className="p-3 bg-slate-900 text-white border border-slate-950 rounded-xl space-y-1 shadow-sm">
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Faturamento</p>
                <p className="text-base font-extrabold font-mono tracking-tight text-white leading-none">{formatCurrency(stats.revenue)}</p>
                <div className="flex justify-between text-[9px] text-slate-400 font-mono pt-1 border-t border-slate-800 mt-1">
                  <span>Alvo: R$ 4.5M</span>
                  <span className="text-emerald-400 font-bold">85%</span>
                </div>
              </div>

              {/* KPI 2 */}
              <div className="p-3 bg-slate-900 text-white border border-slate-950 rounded-xl space-y-1 shadow-sm">
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Margem Bruta</p>
                <p className="text-base font-extrabold font-mono tracking-tight text-white leading-none">{stats.margin}%</p>
                <div className="flex justify-between text-[9px] text-slate-400 font-mono pt-1 border-t border-slate-800 mt-1">
                  <span>Alvo: 14.5%</span>
                  <span className="text-amber-400 font-bold">95%</span>
                </div>
              </div>

              {/* KPI 3 */}
              <div className="p-3 bg-slate-900 text-white border border-slate-950 rounded-xl space-y-1 shadow-sm">
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Overhead Fixos</p>
                <p className="text-base font-extrabold font-mono tracking-tight text-white leading-none">R$ 410k</p>
                <div className="flex justify-between text-[9px] text-slate-400 font-mono pt-1 border-t border-slate-800 mt-1">
                  <span>Teto: R$ 450k</span>
                  <span className="text-emerald-400 font-bold">Sob Controle</span>
                </div>
              </div>

              {/* KPI 4 */}
              <div className="p-3 bg-slate-900 text-white border border-slate-950 rounded-xl space-y-1 shadow-sm">
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">EBITDA Gerencial</p>
                <p className="text-base font-extrabold font-mono tracking-tight text-white leading-none">R$ 412k</p>
                <div className="flex justify-between text-[9px] text-slate-400 font-mono pt-1 border-t border-slate-800 mt-1">
                  <span>Alvo: R$ 380k</span>
                  <span className="text-emerald-400 font-bold">+8%</span>
                </div>
              </div>
            </div>
          </section>

          {/* ────────────────────────────────────────────────────────────────────────
              8. HISTÓRICO EXECUTIVO (Timeline de Progresso da Consultoria)
              ──────────────────────────────────────────────────────────────────────── */}
          <section className="bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800/50">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
                <Calendar size={14} className="text-indigo-500" /> Histórico Executivo de Avanços
              </h3>
              <span className="text-[10px] text-slate-400 font-bold font-mono">Evolução do Caso</span>
            </div>

            <div className="space-y-4 relative pl-4 border-l border-slate-200 dark:border-slate-800 ml-1.5 py-1 text-xs">
              <div className="relative">
                <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
                <p className="font-bold text-slate-800 dark:text-slate-200">Roteiro Contábil e CMV Homologado</p>
                <p className="text-[9px] text-slate-400 font-mono">20/Jun/2026 — Rito de CMV fechado com sucesso</p>
              </div>

              <div className="relative">
                <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-white dark:border-slate-900" />
                <p className="font-bold text-slate-800 dark:text-slate-200">Diagnóstico de Vazamentos de Caixa</p>
                <p className="text-[9px] text-slate-400 font-mono">15/Jun/2026 — Identificados pontos de CMV alto em peças Nissan</p>
              </div>

              <div className="relative">
                <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-white dark:border-slate-900" />
                <p className="font-bold text-slate-800 dark:text-slate-200">Setup de Alinhamento Estratégico</p>
                <p className="text-[9px] text-slate-400 font-mono">01/Jun/2026 — Integração e criação do caso no Sauron OS</p>
              </div>
            </div>
          </section>

        </div>

        {/* Right Column (Ancillary panels) */}
        <div className="space-y-6">

          {/* ────────────────────────────────────────────────────────────────────────
              9. STATUS DOS DADOS
              ──────────────────────────────────────────────────────────────────────── */}
          <section className="bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-4">
            <div className="pb-2 border-b border-slate-100 dark:border-slate-800/50 flex justify-between items-center">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
                <Database size={14} className="text-blue-500" /> Status da Governança e Dados
              </h3>
            </div>

            <div className="space-y-2.5">
              {/* Database */}
              <div className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Database size={14} className="text-emerald-500" />
                  <span className="font-bold text-slate-800 dark:text-slate-200">Banco de Dados Relacional</span>
                </div>
                <span className="text-[8px] font-mono font-black uppercase px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 rounded-full">
                  Conectado
                </span>
              </div>

              {/* Spreadsheets */}
              <div className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <FileText size={14} className="text-emerald-500" />
                  <span className="font-bold text-slate-800 dark:text-slate-200">Planilhas Financeiras</span>
                </div>
                <span className="text-[8px] font-mono font-black uppercase px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 rounded-full">
                  Ativas
                </span>
              </div>

              {/* VPN Gateway */}
              <div className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={14} className="text-blue-500" />
                  <span className="font-bold text-slate-800 dark:text-slate-200">Criptografia VPN</span>
                </div>
                <span className="text-[8px] font-mono font-black uppercase px-2 py-0.5 bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 rounded-full">
                  Segura
                </span>
              </div>
            </div>
          </section>

          {/* ────────────────────────────────────────────────────────────────────────
              10. PLANO EXECUTIVO (Progresso Global)
              ──────────────────────────────────────────────────────────────────────── */}
          <section className="bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-4">
            <div className="pb-2 border-b border-slate-100 dark:border-slate-800/50 flex justify-between items-center">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
                <CheckSquare2 size={14} className="text-emerald-500" /> Evolução do Plano Executivo
              </h3>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Progress 1 */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">Revisão CMV (Oficina e Peças)</span>
                  <span className="font-bold text-slate-500 font-mono text-[10px]">75%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: "75%" }} />
                </div>
              </div>

              {/* Progress 2 */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">Redução de CMV Lubrificantes</span>
                  <span className="font-bold text-slate-500 font-mono text-[10px]">10%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: "10%" }} />
                </div>
              </div>

              {/* Progress 3 */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">Reenquadramento Fical Monofásico</span>
                  <span className="font-bold text-slate-500 font-mono text-[10px]">100%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: "100%" }} />
                </div>
              </div>
            </div>
          </section>

        </div>

      </div>

    </div>
  );
};
