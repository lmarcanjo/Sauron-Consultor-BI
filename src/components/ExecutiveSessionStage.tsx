import React from 'react';
import { 
  ChevronLeft, ChevronRight, Check, Play, TrendingUp, AlertTriangle, ShieldAlert, CheckCircle2, BookOpen, Plus
} from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, Cell, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer 
} from 'recharts';
import { AgendaItem } from './ExecutiveSessionAgenda';
import { WorkspaceProject, ActionPlan } from '../modules/consultant-workspace/types';

interface ExecutiveSessionStageProps {
  currentChapter: AgendaItem;
  activeChapterIndex: number;
  visibleChapters: AgendaItem[];
  project: WorkspaceProject;
  activePlans: ActionPlan[];
  formatCurrency: (value: number) => string;
  chartDataRevenue: any[];
  chartDataCosts: any[];
  setActiveChapterIndex: (index: number) => void;
  setAgenda: React.Dispatch<React.SetStateAction<AgendaItem[]>>;
  setIsCreatingAction: (val: boolean) => void;
  setShowSummaryModal: (val: boolean) => void;
  setActivePlans: React.Dispatch<React.SetStateAction<ActionPlan[]>>;
  agenda: AgendaItem[];
}

export const ExecutiveSessionStage: React.FC<ExecutiveSessionStageProps> = ({
  currentChapter,
  activeChapterIndex,
  visibleChapters,
  project,
  activePlans,
  formatCurrency,
  chartDataRevenue,
  chartDataCosts,
  setActiveChapterIndex,
  setAgenda,
  setIsCreatingAction,
  setShowSummaryModal,
  setActivePlans,
  agenda
}) => {
  return (
    <section className="flex-1 bg-slate-950 flex flex-col overflow-hidden relative">
      <div className="flex-1 overflow-y-auto p-8 flex flex-col justify-between custom-scrollbar">
        
        {/* Upper Info Header of slide */}
        <div className="flex justify-between items-start border-b border-slate-900 pb-4 mb-6">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 font-mono">Sessão Executiva • Capítulo Ativo</span>
            <h2 className="text-2xl font-black tracking-tight text-white uppercase">{currentChapter.title}</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-slate-900 border border-slate-800 text-slate-400 text-[10px] px-2.5 py-1 rounded font-mono font-bold">
              CAPÍTULO {activeChapterIndex + 1} DE {visibleChapters.length}
            </span>
            <button 
              onClick={() => {
                setAgenda(prev => prev.map(a => a.chapterKey === currentChapter.chapterKey ? { ...a, completed: !a.completed } : a));
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                currentChapter.completed 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              <Check size={11} /> {currentChapter.completed ? 'Concluído' : 'Concluir'}
            </button>
          </div>
        </div>

        {/* Dynamic Stage Render based on Chapter Key */}
        <div className="flex-1 flex flex-col justify-center py-4">
          {currentChapter.chapterKey === 'abertura' && (
            <div className="max-w-3xl mx-auto w-full space-y-6 text-center md:text-left">
              <div className="space-y-2">
                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-none uppercase">
                  COMITÊ EXECUTIVO DE OPERAÇÕES
                </h1>
                <p className="text-slate-400 text-sm font-medium">
                  Análise estratégica do caso de consultoria e aprovação dos planos de ação táticos.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
                <div className="bg-slate-900/60 border border-slate-850 p-4 rounded-xl space-y-1">
                  <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider block">CLIENTE PARCEIRO</span>
                  <p className="text-sm font-bold text-slate-200">{project.client}</p>
                </div>
                <div className="bg-slate-900/60 border border-slate-850 p-4 rounded-xl space-y-1">
                  <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider block">SEGMENTO DE MERCADO</span>
                  <p className="text-sm font-bold text-blue-400">{project.segment || 'Automotivo'}</p>
                </div>
                <div className="bg-slate-900/60 border border-slate-850 p-4 rounded-xl space-y-1">
                  <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider block">LÍDER CONSULTOR</span>
                  <p className="text-sm font-bold text-slate-200">Lennon Marcanjo</p>
                </div>
              </div>

              {/* Meeting Mission / Ritual Objectives */}
              <div className="bg-slate-900/30 border border-slate-900 p-5 rounded-2xl space-y-3">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Objetivos Centrais do Comitê</span>
                <ul className="text-xs text-slate-300 space-y-2.5">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    <span>Validar desvios de receita e queda observada na margem operacional de seminovos.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    <span>Revisar estrutura de CMV, comissão de vendas e despesas corporativas correntes.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    <span>Aprovar as 5 ações táticas prioritárias no Plano de Ação Estratégico.</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {currentChapter.chapterKey === 'receita' && (
            <div className="space-y-6 w-full max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900/60 border border-slate-850 rounded-xl p-4 flex items-center gap-4">
                  <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
                    <TrendingUp size={20} />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">Receita Acumulada</span>
                    <p className="text-base font-black text-white">{formatCurrency(5400000)}</p>
                  </div>
                </div>
                <div className="bg-slate-900/60 border border-slate-850 rounded-xl p-4 flex items-center gap-4">
                  <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                    <Check size={20} />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">Meta Consolidada</span>
                    <p className="text-base font-black text-white">{formatCurrency(5800000)}</p>
                  </div>
                </div>
                <div className="bg-slate-900/60 border border-slate-850 rounded-xl p-4 flex items-center gap-4">
                  <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
                    <AlertTriangle size={20} />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">Defasagem Operacional</span>
                    <p className="text-base font-black text-rose-400">- 6,90%</p>
                  </div>
                </div>
              </div>

              {/* High Quality Visualization Chart */}
              <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-5 h-72">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-4">Curva de Faturamento vs Meta Acumulada</span>
                <ResponsiveContainer width="100%" height="90%">
                  <LineChart data={chartDataRevenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                    <YAxis stroke="#64748b" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }} />
                    <Line type="monotone" dataKey="Receita" stroke="#3b82f6" strokeWidth={3} name="Faturamento Real" />
                    <Line type="monotone" dataKey="Meta" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" name="Meta Estabelecida" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {currentChapter.chapterKey === 'margem' && (
            <div className="space-y-6 w-full max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900/40 border border-slate-900 p-5 rounded-2xl flex flex-col justify-center space-y-4">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 block">Margem Bruta Consolidada</span>
                    <h3 className="text-5xl font-black text-white font-mono">41.20%</h3>
                    <p className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                      <span>+ 1.5% vs Ciclo Anterior</span>
                    </p>
                  </div>
                  
                  <div className="space-y-2 border-t border-slate-850 pt-4">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Venda de Veículos</span>
                      <span className="font-mono text-slate-200">12.5%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Oficina e Pós-Venda</span>
                      <span className="font-mono text-slate-200">52.3%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Acessórios & F&I</span>
                      <span className="font-mono text-slate-200">48.0%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-xl space-y-2">
                    <h4 className="text-xs font-bold text-amber-500 flex items-center gap-1.5 uppercase">
                      <ShieldAlert size={14} /> Alerta de Alavanca de Margem
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      A margem bruta de seminovos caiu 3.4 pontos percentuais devido ao excesso de descontos na venda cruzada. É necessário frear a comissão em modelos Nissan.
                    </p>
                  </div>

                  {/* Margin Progress Bar Indicators */}
                  <div className="bg-slate-900/30 border border-slate-900 p-4 rounded-xl space-y-3">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Atingimento de Margem Alvo</span>
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono">
                          <span>Veículos Novos</span>
                          <span>92%</span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="bg-blue-500 h-full" style={{ width: '92%' }} />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono">
                          <span>Oficina Geral</span>
                          <span>105%</span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full" style={{ width: '100%' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentChapter.chapterKey === 'custos' && (
            <div className="space-y-6 w-full max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-5 h-72 flex flex-col justify-between">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-4">Composição Estrutural de Despesas</span>
                  <div className="flex-1 border border-transparent">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartDataCosts} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis type="number" stroke="#64748b" fontSize={9} />
                        <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={9} width={90} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                        <Bar dataKey="valor" radius={[0, 4, 4, 0]}>
                          {chartDataCosts.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-slate-900/40 border border-slate-900 p-5 rounded-2xl flex flex-col justify-center space-y-4">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Oportunidade de Saving</span>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400">Eficiência CMV Logística</p>
                    <h4 className="text-3xl font-black text-emerald-400 font-mono">R$ 180.000</h4>
                    <p className="text-slate-300 text-xs">Identificada possibilidade de centralizar compras de suprimentos na matriz, obtendo 15% de desconto em lote fechado.</p>
                  </div>
                  
                  <div className="border-t border-slate-850 pt-4 text-xs text-slate-400 flex items-start gap-2">
                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span>Ação correspondente: Centralizar compras de autopeças de giro na matriz com Carlos Henrique.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentChapter.chapterKey === 'comercial' && (
            <div className="space-y-6 w-full max-w-4xl mx-auto">
              <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-5">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-4">Leaderboard Comercial - Performance</span>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-wider text-[9px] font-bold">
                        <th className="pb-2.5">Vendedor</th>
                        <th className="pb-2.5 text-right">Volume de Vendas</th>
                        <th className="pb-2.5 text-right">Atingimento Meta</th>
                        <th className="pb-2.5 text-right">Comissão Estimada</th>
                        <th className="pb-2.5 text-right">Morale / Prod</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900 text-slate-300">
                      <tr>
                        <td className="py-3 font-semibold text-white flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-blue-500 text-slate-950 font-black text-[9px] flex items-center justify-center">1º</span>
                          Carlos Santos
                        </td>
                        <td className="py-3 text-right font-mono">{formatCurrency(1250000)}</td>
                        <td className="py-3 text-right text-emerald-400 font-bold font-mono">104%</td>
                        <td className="py-3 text-right font-mono">{formatCurrency(18750)}</td>
                        <td className="py-3 text-right">
                          <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase rounded">Alto</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 font-semibold text-white flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 font-black text-[9px] flex items-center justify-center">2º</span>
                          Ana Paula Silva
                        </td>
                        <td className="py-3 text-right font-mono">{formatCurrency(980000)}</td>
                        <td className="py-3 text-right text-slate-300 font-mono">98%</td>
                        <td className="py-3 text-right font-mono">{formatCurrency(14700)}</td>
                        <td className="py-3 text-right">
                          <span className="px-1.5 py-0.5 bg-slate-900 text-slate-400 border border-slate-800 text-[9px] font-black uppercase rounded">Médio</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 font-semibold text-white flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 font-black text-[9px] flex items-center justify-center">3º</span>
                          Roberto Melo
                        </td>
                        <td className="py-3 text-right font-mono">{formatCurrency(710000)}</td>
                        <td className="py-3 text-right text-rose-400 font-bold font-mono">71%</td>
                        <td className="py-3 text-right font-mono">{formatCurrency(10650)}</td>
                        <td className="py-3 text-right">
                          <span className="px-1.5 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[9px] font-black uppercase rounded">Crítico</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {currentChapter.chapterKey === 'pessoas' && (
            <div className="space-y-6 w-full max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900/60 border border-slate-850 rounded-xl p-5 text-center space-y-1">
                  <span className="text-[9px] font-black text-slate-500 uppercase block tracking-wider">Satisfação Geral do Time</span>
                  <h4 className="text-4xl font-black text-white font-mono">78%</h4>
                  <p className="text-[10px] text-emerald-400 font-bold">Excelente / Saudável</p>
                </div>
                <div className="bg-slate-900/60 border border-slate-850 rounded-xl p-5 text-center space-y-1">
                  <span className="text-[9px] font-black text-slate-500 uppercase block tracking-wider">Rotatividade (Turnover)</span>
                  <h4 className="text-4xl font-black text-white font-mono">4.1%</h4>
                  <p className="text-[10px] text-slate-400">Sob controle setorial</p>
                </div>
                <div className="bg-slate-900/60 border border-slate-850 rounded-xl p-5 text-center space-y-1">
                  <span className="text-[9px] font-black text-slate-500 uppercase block tracking-wider">Produtividade Média</span>
                  <h4 className="text-4xl font-black text-white font-mono">R$ 48K</h4>
                  <p className="text-[10px] text-emerald-400 font-bold">+ 12% vs meta técnica</p>
                </div>
              </div>

              <div className="bg-slate-900/30 border border-slate-900 p-5 rounded-2xl space-y-3">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Diagnóstico de Gestão de Equipes</span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Identificada alta sobrecarga no pós-venda, impulsionada pelo crescimento na demanda de serviços da concessionária. A contratação emergencial de 2 técnicos mecânicos plenos é necessária para aliviar o gargalo.
                </p>
              </div>
            </div>
          )}

          {currentChapter.chapterKey === 'plano' && (
            <div className="space-y-6 w-full max-w-4xl mx-auto">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Acompanhamento e Status das Ações</span>
                <button 
                  onClick={() => setIsCreatingAction(true)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={12} /> Nova Ação
                </button>
              </div>

              {/* Active/Pending Action Plans List */}
              <div className="space-y-3 max-h-72 overflow-y-auto custom-scrollbar">
                {activePlans.length > 0 ? (
                  activePlans.map((plan) => (
                    <div key={plan.id} className="bg-slate-900/40 border border-slate-900 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border ${
                            plan.priority === 'high' 
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                              : plan.priority === 'medium'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                : 'bg-slate-900 text-slate-400 border-slate-800'
                          }`}>
                            {plan.priority.toUpperCase()}
                          </span>
                          <p className="text-xs font-bold text-white leading-snug">{plan.description}</p>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] text-slate-400 font-mono">
                          <span>Responsável: <strong className="text-slate-300">{plan.responsible}</strong></span>
                          <span>Prazo: <strong className="text-slate-300">{plan.deadline}</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <select 
                          value={plan.status}
                          onChange={(e) => {
                            const newStatus = e.target.value as any;
                            setActivePlans(prev => prev.map(p => p.id === plan.id ? { ...p, status: newStatus } : p));
                          }}
                          className="bg-slate-950 border border-slate-850 rounded px-2 py-1 text-[10px] font-bold text-slate-300 focus:outline-none focus:border-blue-500"
                        >
                          <option value="pending">Pendente</option>
                          <option value="in-progress">Em Andamento</option>
                          <option value="completed">Concluído</option>
                        </select>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 border border-slate-900 border-dashed rounded-xl text-center text-slate-500 text-xs">
                    Nenhum plano de ação tático listado para este caso.
                  </div>
                )}
              </div>
            </div>
          )}

          {currentChapter.chapterKey === 'encerramento' && (
            <div className="max-w-2xl mx-auto w-full space-y-6 text-center">
              <div className="space-y-2">
                <CheckCircle2 size={48} className="text-emerald-500 mx-auto" />
                <h2 className="text-3xl font-black text-white tracking-tight uppercase">Sessão Executiva Concluída</h2>
                <p className="text-slate-400 text-sm max-w-lg mx-auto">
                  Todas as discussões de capítulos foram encerradas e as deliberações de pauta foram devidamente validadas pelo comitê.
                </p>
              </div>

              <div className="bg-slate-900/40 border border-slate-900 p-5 rounded-2xl max-w-md mx-auto space-y-3">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Assinatura Digital de Aprovação (Ata)</span>
                <p className="text-[11px] text-slate-400 leading-relaxed">Assine abaixo digitando o nome do representante legal do conselho para autenticar formalmente a ata de decisões:</p>
                <input 
                  type="text" 
                  placeholder="Nome do Diretor / Proprietário"
                  defaultValue="Roberto de Arcanjo"
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-center font-bold text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          {currentChapter.chapterKey.startsWith('custom_') && (
            <div className="max-w-xl mx-auto w-full text-center space-y-4">
              <BookOpen size={48} className="text-blue-500 mx-auto" />
              <h3 className="text-2xl font-black text-white tracking-tight uppercase">{currentChapter.title}</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Tópico estratégico adicionado dinamicamente durante a sessão. Use as ferramentas de anotações inteligentes no painel direito para registrar observações, decisões deliberadas ou novos planos de ação específicos sobre este assunto.
              </p>
            </div>
          )}
        </div>

        {/* Bottom Navigation of Story */}
        <div className="flex items-center justify-between border-t border-slate-900 pt-5 mt-6 shrink-0">
          <button 
            onClick={() => {
              if (activeChapterIndex > 0) setActiveChapterIndex(activeChapterIndex - 1);
            }}
            disabled={activeChapterIndex === 0}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-slate-300 rounded-lg text-xs font-bold flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <ChevronLeft size={14} /> Capítulo Anterior
          </button>

          <div className="flex items-center gap-1.5">
            {visibleChapters.map((ch, idx) => (
              <button 
                key={ch.id}
                onClick={() => setActiveChapterIndex(idx)}
                className={`h-2.5 rounded-full transition-all cursor-pointer ${
                  idx === activeChapterIndex 
                    ? 'w-6 bg-blue-500' 
                    : ch.completed 
                      ? 'w-2.5 bg-emerald-500' 
                      : 'w-2.5 bg-slate-800 hover:bg-slate-700'
                }`}
                title={ch.title}
              />
            ))}
          </div>

          <button 
            onClick={() => {
              const updated = [...agenda];
              const curIdx = updated.findIndex(item => item.chapterKey === currentChapter.chapterKey);
              if (curIdx !== -1) updated[curIdx].completed = true;
              setAgenda(updated);

              if (activeChapterIndex < visibleChapters.length - 1) {
                setActiveChapterIndex(activeChapterIndex + 1);
              } else {
                setShowSummaryModal(true);
              }
            }}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-black flex items-center gap-1 transition-all cursor-pointer"
          >
            {activeChapterIndex === visibleChapters.length - 1 ? 'Concluir Reunião' : 'Próximo Capítulo'} <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </section>
  );
};
