import React from "react";
import {
  Award,
  Activity,
  Clock,
  Sparkles,
  BarChart3,
  ShieldAlert,
  AlertTriangle,
  Check,
  TrendingUp,
  Plus,
  Trash2,
  Calendar,
  Network,
  Presentation,
  MonitorPlay,
  Users
} from "lucide-react";

interface ExecutiveWidgetsProps {
  widgetOrder: string[];
  enabledWidgets: Record<string, boolean>;
  healthScore: {
    total: number;
    data: number;
    kpis: number;
    filters: number;
    pres: number;
    plans: number;
  };
  recentActivities: any[];
  activeProject: {
    client: string;
    actionPlans: any[];
    meetings: any[];
  };
  quickAddAction: boolean;
  setQuickAddAction: (val: boolean) => void;
  newActionDescription: string;
  setNewActionDescription: (val: string) => void;
  newActionResponsible: string;
  setNewActionResponsible: (val: string) => void;
  newActionDeadline: string;
  setNewActionDeadline: (val: string) => void;
  newActionPriority: "low" | "medium" | "high";
  setNewActionPriority: (val: "low" | "medium" | "high") => void;
  handleAddActionPlan: (e: React.FormEvent) => void;
  handleToggleActionPlanStatus: (id: string) => void;
  handleRemoveActionPlan: (id: string) => void;
  quickAddMeeting: boolean;
  setQuickAddMeeting: (val: boolean) => void;
  newMeetingResponsible: string;
  setNewMeetingResponsible: (val: string) => void;
  newMeetingObservations: string;
  setNewMeetingObservations: (val: string) => void;
  handleCreateMeeting: (e: React.FormEvent) => void;
  onSelectTab: (tabId: string) => void;
  formatCurrency: (value: number) => string;
}

export const ExecutiveWidgets: React.FC<ExecutiveWidgetsProps> = ({
  widgetOrder,
  enabledWidgets,
  healthScore,
  recentActivities,
  activeProject,
  quickAddAction,
  setQuickAddAction,
  newActionDescription,
  setNewActionDescription,
  newActionResponsible,
  setNewActionResponsible,
  newActionDeadline,
  setNewActionDeadline,
  newActionPriority,
  setNewActionPriority,
  handleAddActionPlan,
  handleToggleActionPlanStatus,
  handleRemoveActionPlan,
  quickAddMeeting,
  setQuickAddMeeting,
  newMeetingResponsible,
  setNewMeetingResponsible,
  newMeetingObservations,
  setNewMeetingObservations,
  handleCreateMeeting,
  onSelectTab,
  formatCurrency
}) => {
  const dimensions = [
    { name: "Ingestão de Dados (25% peso)", score: healthScore.data },
    { name: "Mapeamento de KPIs (15% peso)", score: healthScore.kpis },
    { name: "Configuração de Filtros (20% peso)", score: healthScore.filters },
    { name: "Apresentação Estruturada (20% peso)", score: healthScore.pres },
    { name: "Plano de Caixa Ativo (20% peso)", score: healthScore.plans }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {widgetOrder
        .filter((id) => enabledWidgets[id])
        .map((id) => {
          switch (id) {
            case "healthScore":
              return (
                <div key={id} className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col gap-5 animate-fade-in">
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
                      {dimensions.map((dim, idx) => (
                        <div key={idx} className="flex flex-col gap-1">
                          <div className="flex justify-between items-center text-xs font-bold">
                            <span className="text-slate-600 dark:text-slate-300">{idx + 1}. {dim.name}</span>
                            <span className={dim.score === 100 ? "text-emerald-500" : "text-slate-400"}>{dim.score}%</span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div className={`h-full ${dim.score === 100 ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"}`} style={{ width: `${dim.score}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );

            case "timeline":
              return (
                <div key={id} className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col gap-4 animate-fade-in">
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <Activity size={16} className="text-blue-500 animate-pulse" />
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Timeline de Atividades</h3>
                    </div>
                    <span className="text-[9px] text-slate-500 font-bold font-mono">Auditoria</span>
                  </div>

                  <div className="relative border-l-2 border-slate-100 dark:border-slate-800 ml-2.5 pl-4 space-y-4 max-h-[280px] overflow-y-auto pr-1">
                    {recentActivities && recentActivities.length > 0 ? (
                      recentActivities.map((act) => (
                        <div key={act.id} className="relative group">
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
              );

            case "insights":
              return (
                <div key={id} className="lg:col-span-1 bg-gradient-to-br from-blue-500/5 to-transparent border border-blue-150 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col gap-4 animate-fade-in">
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-blue-500" />
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Insights de Governança</h3>
                    </div>
                    <span className="text-[9px] text-blue-500 font-extrabold font-mono">Recomendações</span>
                  </div>
                  <div className="space-y-3">
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/20 border border-slate-150 dark:border-slate-800/60 rounded-xl">
                      <span className="text-[9px] font-black uppercase text-blue-500 block mb-1">Mapeamento Contábil</span>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 font-semibold leading-relaxed">
                        Sauron OS detectou lançamentos na conta de fornecedores em desacordo com as notas fiscais importadas.
                      </p>
                    </div>
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/20 border border-slate-150 dark:border-slate-800/60 rounded-xl">
                      <span className="text-[9px] font-black uppercase text-purple-500 block mb-1">Ritual de Governança</span>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 font-semibold leading-relaxed">
                        Próximo ritual estratégico agendado foca na homologação do EBITDA consolidado.
                      </p>
                    </div>
                  </div>
                </div>
              );

            case "kpis":
              return (
                <div key={id} className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col gap-4 animate-fade-in">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="text-emerald-500" size={16} />
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">KPIs Estratégicos & Faturamento</h3>
                    </div>
                    <span className="text-[9px] text-slate-400 font-bold font-mono">Calculado</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/20 flex flex-col gap-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase">Receita Líquida Estimada</span>
                      <span className="text-lg font-black text-slate-900 dark:text-white mt-1">
                        {formatCurrency ? formatCurrency(8450000) : "R$ 8.450.000,00"}
                      </span>
                      <span className="text-[8px] font-extrabold text-emerald-500">▲ +4.2% vs mês anterior</span>
                    </div>
                    <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/20 flex flex-col gap-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase">EBITDA Estimado</span>
                      <span className="text-lg font-black text-slate-900 dark:text-white mt-1">
                        {formatCurrency ? formatCurrency(1250000) : "R$ 1.250.000,00"}
                      </span>
                      <span className="text-[8px] font-extrabold text-emerald-500">▲ Margem de 14.7%</span>
                    </div>
                  </div>
                </div>
              );

            case "alerts":
              return (
                <div key={id} className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col gap-4 animate-fade-in">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="text-amber-500" size={16} />
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Alertas de Integridade</h3>
                    </div>
                    <span className="text-[9px] text-slate-400 font-bold font-mono">Real-Time</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex gap-2 p-3 bg-amber-50 dark:bg-amber-950/10 border border-amber-200/40 rounded-xl">
                      <AlertTriangle className="text-amber-500 mt-0.5 shrink-0" size={14} />
                      <div className="text-[11px] font-bold text-amber-800 dark:text-amber-400 leading-snug">
                        Plano de contas possui lançamentos em conciliação manual pendente.
                      </div>
                    </div>
                    <div className="flex gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/10 border border-emerald-200/40 rounded-xl">
                      <Check className="text-emerald-500 mt-0.5 shrink-0" size={14} />
                      <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-400 leading-snug">
                        Mapeamentos contábeis homologados e validados.
                      </div>
                    </div>
                  </div>
                </div>
              );

            case "actionPlans":
              return (
                <div key={id} className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col gap-4 animate-fade-in">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={16} className="text-emerald-500" />
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Mitigações de Caixa & Plano de Ação</h3>
                    </div>
                    <button
                      onClick={() => setQuickAddAction(!quickAddAction)}
                      className="text-xs font-extrabold text-blue-500 hover:text-blue-600 flex items-center gap-1 cursor-pointer"
                    >
                      {quickAddAction ? "Fechar" : "Nova Meta"}
                      <Plus size={14} />
                    </button>
                  </div>

                  {quickAddAction && (
                    <form onSubmit={handleAddActionPlan} className="bg-slate-50 dark:bg-slate-800/40 border border-slate-150 p-4 rounded-xl flex flex-col gap-3 animate-fade-in">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] uppercase font-bold text-slate-400">O que precisa ser feito *</label>
                          <input
                            type="text"
                            required
                            placeholder="Ex: Auditoria do estoque..."
                            value={newActionDescription}
                            onChange={(e) => setNewActionDescription(e.target.value)}
                            className="bg-white dark:bg-slate-800 border rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] uppercase font-bold text-slate-400">Responsável *</label>
                          <input
                            type="text"
                            required
                            placeholder="Ex: Roberto..."
                            value={newActionResponsible}
                            onChange={(e) => setNewActionResponsible(e.target.value)}
                            className="bg-white dark:bg-slate-800 border rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] uppercase font-bold text-slate-400">Prazo</label>
                          <input
                            type="date"
                            value={newActionDeadline}
                            onChange={(e) => setNewActionDeadline(e.target.value)}
                            className="bg-white dark:bg-slate-800 border rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] uppercase font-bold text-slate-400">Prioridade</label>
                          <select
                            value={newActionPriority}
                            onChange={(e) => setNewActionPriority(e.target.value as "low" | "medium" | "high")}
                            className="bg-white dark:bg-slate-800 border rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white"
                          >
                            <option value="low">Baixa</option>
                            <option value="medium">Média</option>
                            <option value="high">Alta</option>
                          </select>
                        </div>
                      </div>
                      <button type="submit" className="self-end bg-emerald-600 text-white font-bold text-xs px-4 py-2 rounded-xl">
                        Salvar
                      </button>
                    </form>
                  )}

                  <div className="space-y-2 overflow-y-auto max-h-[250px] pr-1">
                    {activeProject.actionPlans && activeProject.actionPlans.length > 0 ? (
                      activeProject.actionPlans.map((plan) => (
                        <div
                          key={plan.id}
                          className={`flex justify-between items-center p-3.5 rounded-xl border transition-all ${
                            plan.status === "completed"
                              ? "bg-slate-50/50 dark:bg-slate-800/20 border-slate-100 opacity-60"
                              : "bg-slate-50 dark:bg-slate-800/40 border-slate-150 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <button
                              onClick={() => handleToggleActionPlanStatus(plan.id)}
                              className={`mt-0.5 w-4.5 h-4.5 rounded border shrink-0 flex items-center justify-center cursor-pointer transition-colors ${
                                plan.status === "completed" ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300"
                              }`}
                            >
                              {plan.status === "completed" && <Check size={11} />}
                            </button>
                            <div className="min-w-0 flex-1">
                              <span className={`text-xs font-extrabold text-slate-900 dark:text-white block ${plan.status === "completed" ? "line-through text-slate-500" : ""}`}>{plan.description}</span>
                              <div className="flex flex-wrap gap-2.5 mt-1 text-[10px] text-slate-500 font-bold">
                                <span className="flex items-center gap-1">
                                  <Users size={11} />
                                  Responsável: {plan.responsible}
                                </span>
                                {plan.deadline && (
                                  <span className="flex items-center gap-1">
                                    <Clock size={11} />
                                    Prazo: {plan.deadline}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <button onClick={() => handleRemoveActionPlan(plan.id)} className="text-slate-400 hover:text-red-500">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-slate-400 text-xs italic">
                        Sem tarefas ativas.
                      </div>
                    )}
                  </div>
                </div>
              );

            case "agenda":
              return (
                <div key={id} className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col gap-4 animate-fade-in">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-purple-500" />
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Rituais do Conselho (Agenda)</h3>
                    </div>
                    <button
                      onClick={() => setQuickAddMeeting(!quickAddMeeting)}
                      className="text-xs font-extrabold text-blue-500 hover:text-blue-600 flex items-center gap-1 cursor-pointer"
                    >
                      {quickAddMeeting ? "Fechar" : "Novo"}
                    </button>
                  </div>

                  {quickAddMeeting && (
                    <form onSubmit={handleCreateMeeting} className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-150 rounded-xl flex flex-col gap-2 animate-fade-in">
                      <input
                        type="text"
                        required
                        value={newMeetingResponsible}
                        onChange={(e) => setNewMeetingResponsible(e.target.value)}
                        placeholder="Responsável..."
                        className="bg-white dark:bg-slate-800 border rounded px-2 py-1 text-xs"
                      />
                      <input
                        type="text"
                        value={newMeetingObservations}
                        onChange={(e) => setNewMeetingObservations(e.target.value)}
                        placeholder="Pauta..."
                        className="bg-white dark:bg-slate-800 border rounded px-2 py-1 text-xs"
                      />
                      <button type="submit" className="bg-purple-600 text-white font-bold text-xs py-1.5 rounded">
                        Salvar Reunião
                      </button>
                    </form>
                  )}

                  <div className="space-y-2 overflow-y-auto max-h-[160px]">
                    {activeProject.meetings && activeProject.meetings.length > 0 ? (
                      activeProject.meetings.map((meet) => (
                        <div key={meet.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/10 border border-slate-100 dark:border-slate-800/60 flex items-start gap-2 text-xs font-bold">
                          <Calendar size={14} className="text-purple-500 mt-0.5 shrink-0" />
                          <div>
                            <span className="block text-xs font-extrabold">Ritual: {meet.responsible}</span>
                            <span className="block text-[10px] text-slate-500 font-medium mt-0.5">{meet.observations || "Alinhamento"}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-slate-400 text-xs italic">
                        Sem reuniões agendadas.
                      </div>
                    )}
                  </div>
                </div>
              );

            case "dataSources":
              return (
                <div key={id} className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col gap-4 animate-fade-in">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Network size={16} className="text-blue-500" />
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Ambiente de Redes & Ingestão</h3>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl border border-slate-100 bg-slate-50 dark:bg-slate-800/10 flex flex-col">
                      <span className="text-[9px] font-black text-slate-400 uppercase">Banco ERP</span>
                      <span className="text-xs font-bold text-emerald-500 mt-1">● Conectado</span>
                    </div>
                    <div className="p-3 rounded-xl border border-slate-100 bg-slate-50 dark:bg-slate-800/10 flex flex-col">
                      <span className="text-[9px] font-black text-slate-400 uppercase">Planilhas</span>
                      <span className="text-xs font-bold text-emerald-500 mt-1">● Atualizadas</span>
                    </div>
                    <div className="p-3 rounded-xl border border-slate-100 bg-slate-50 dark:bg-slate-800/10 flex flex-col">
                      <span className="text-[9px] font-black text-slate-400 uppercase">VPN Gateway</span>
                      <span className="text-xs font-bold text-emerald-500 mt-1">● Ativa</span>
                    </div>
                    <div className="p-3 rounded-xl border border-slate-100 bg-slate-50 dark:bg-slate-800/10 flex flex-col">
                      <span className="text-[9px] font-black text-slate-400 uppercase">APIs</span>
                      <span className="text-xs font-bold text-emerald-500 mt-1">● Estáveis</span>
                    </div>
                  </div>
                </div>
              );

            case "analytics":
              return (
                <div key={id} className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col gap-4 animate-fade-in">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="text-blue-500" size={16} />
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">DRE & Performance Analítica</h3>
                    </div>
                    <button onClick={() => onSelectTab("contabil")} className="text-xs font-bold text-blue-500 hover:underline">
                      Ir para DRE
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                    A visualização financeira ativa consolida receitas, despesas e fluxo de caixa de múltiplas abas mapeadas no sistema.
                  </p>
                </div>
              );

            case "presentationStatus":
              return (
                <div key={id} className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col gap-4 animate-fade-in">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Presentation size={16} className="text-blue-500" />
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Apresentações (Deck Status)</h3>
                    </div>
                    <span className="text-[9px] text-slate-400 font-bold font-mono">PPTX</span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/10 border rounded-xl flex justify-between items-center text-xs font-bold">
                    <div>
                      <span>Apresentação v0.7</span>
                      <span className="block text-[9px] text-slate-400 font-medium">Decks de conselho prontos</span>
                    </div>
                    <button onClick={() => onSelectTab("apresentacoes")} className="text-blue-500 hover:underline cursor-pointer">
                      Abrir
                    </button>
                  </div>
                </div>
              );

            case "meetingStatus":
              return (
                <div key={id} className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col gap-4 animate-fade-in">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <MonitorPlay size={16} className="text-emerald-500" />
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Meeting Status</h3>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold leading-normal">
                    Projete os dashboards e rituais do conselho na tela principal para discussões presenciais.
                  </p>
                  <button onClick={() => onSelectTab("modo_reuniao")} className="text-xs text-blue-500 hover:underline text-left mt-1 font-extrabold">
                    Entrar em Modo Reunião
                  </button>
                </div>
              );

            default:
              return null;
          }
        })}
    </div>
  );
};
