import React from 'react';
import { 
  FileText, Printer, X, Download, CheckSquare, Activity 
} from 'lucide-react';
import { AgendaItem } from './ExecutiveSessionAgenda';
import { Participant, SessionDecision } from './ExecutiveSessionRightPanel';
import { WorkspaceProject, ActionPlan } from '../modules/consultant-workspace/types';

interface ExecutiveSessionSummaryProps {
  showSummaryModal: boolean;
  setShowSummaryModal: (val: boolean) => void;
  isAtaPrintView: boolean;
  setIsAtaPrintView: (val: boolean) => void;
  project: WorkspaceProject;
  timerSeconds: number;
  formatTime: (totalS: number) => string;
  participants: Participant[];
  sessionDecisions: SessionDecision[];
  newActionPlans: ActionPlan[];
  sessionObservations: string[];
  sessionPendingItems: string[];
  completedObjectivesCount: number;
  agenda: AgendaItem[];
  visibleChapters: AgendaItem[];
  exportAtaAsTextFile: () => void;
  handleFinalizeSession: () => void;
  isSyncing: boolean;
}

export const ExecutiveSessionSummary: React.FC<ExecutiveSessionSummaryProps> = ({
  showSummaryModal,
  setShowSummaryModal,
  isAtaPrintView,
  setIsAtaPrintView,
  project,
  timerSeconds,
  formatTime,
  participants,
  sessionDecisions,
  newActionPlans,
  sessionObservations,
  sessionPendingItems,
  completedObjectivesCount,
  agenda,
  visibleChapters,
  exportAtaAsTextFile,
  handleFinalizeSession,
  isSyncing
}) => {
  if (!showSummaryModal) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/95 z-50 flex items-center justify-center p-4 md:p-8 animate-fade-in overflow-y-auto select-text">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-900/60 flex justify-between items-center shrink-0">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-emerald-400 tracking-widest font-mono">REUNIÃO ENCONTRANDO DESFECHO</span>
            <h3 className="text-xl font-black text-white uppercase flex items-center gap-2">
              <FileText size={18} className="text-emerald-500" /> RESUMO EXECUTIVO DA REUNIÃO
            </h3>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setIsAtaPrintView(!isAtaPrintView)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Printer size={13} /> {isAtaPrintView ? 'Fechar Impressão' : 'Visualizar Ata'}
            </button>
            <button 
              onClick={() => setShowSummaryModal(false)}
              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 custom-scrollbar">
          
          {isAtaPrintView ? (
            /* Print Preview Mode with elegant printable stylesheet */
            <div className="bg-white text-slate-900 p-8 rounded-2xl shadow-inner space-y-6 font-serif max-w-2xl mx-auto border border-slate-300" id="printable-ata-area">
              <div className="text-center space-y-1.5 border-b-2 border-slate-800 pb-4">
                <h2 className="text-2xl font-black uppercase tracking-tight font-sans">ATA DE REUNIÃO DE CONSELHO EXECUTIVO</h2>
                <p className="text-xs uppercase font-mono tracking-widest text-slate-500">Sauron OS Consultant Core Platform</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-sans pb-4 border-b border-slate-200">
                <div>
                  <p><strong>Caso:</strong> {project.client}</p>
                  <p><strong>Grupo:</strong> {project.group}</p>
                  <p><strong>Segmento:</strong> {project.segment}</p>
                </div>
                <div>
                  <p><strong>Data de Emissão:</strong> {new Date().toLocaleDateString('pt-BR')}</p>
                  <p><strong>Duração Registrada:</strong> {formatTime(timerSeconds)}</p>
                  <p><strong>Consultor:</strong> Responsável pela sessão</p>
                </div>
              </div>

              {/* Present Stakeholders */}
              <div className="space-y-2">
                <h4 className="text-sm font-black uppercase tracking-wider font-sans border-b border-slate-200 pb-1 text-slate-800">1. Participantes Presentes</h4>
                <ul className="list-disc pl-5 text-xs space-y-1 text-slate-700">
                  {participants.filter(p => p.present).map(p => (
                    <li key={p.id}><strong>{p.name}</strong> — {p.role}</li>
                  ))}
                </ul>
              </div>

              {/* Deliberations & Decisions */}
              <div className="space-y-2">
                <h4 className="text-sm font-black uppercase tracking-wider font-sans border-b border-slate-200 pb-1 text-slate-800">2. Decisões Estratégicas Tomadas</h4>
                {sessionDecisions.length > 0 ? (
                  <ol className="list-decimal pl-5 text-xs space-y-2 text-slate-700">
                    {sessionDecisions.map(d => (
                      <li key={d.id}><strong>{d.description}</strong> <span className="text-[10px] font-sans text-slate-500 font-bold">(Deliberado pelo comitê executivo)</span></li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-xs italic text-slate-500">Nenhuma decisão formal registrada.</p>
                )}
              </div>

              {/* New Actions */}
              <div className="space-y-2">
                <h4 className="text-sm font-black uppercase tracking-wider font-sans border-b border-slate-200 pb-1 text-slate-800">3. Novos Planos de Ação táticos</h4>
                {newActionPlans.length > 0 ? (
                  <div className="space-y-2">
                    {newActionPlans.map((a, idx) => (
                      <div key={a.id} className="text-xs text-slate-700">
                        <p><strong>3.{idx + 1}. {a.description}</strong></p>
                        <p className="text-[10px] font-sans text-slate-500 pl-3">Responsável: {a.responsible} | Prazo Alvo: {a.deadline} | Prioridade: {a.priority.toUpperCase()}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs italic text-slate-500">Nenhum plano de ação de negócio desenhado.</p>
                )}
              </div>

              {/* Technical Indicators Reviewed */}
              <div className="space-y-2">
                <h4 className="text-sm font-black uppercase tracking-wider font-sans border-b border-slate-200 pb-1 text-slate-800">4. Indicadores e Capítulos Vistos</h4>
                <p className="text-xs text-slate-700 leading-relaxed">
                  O comitê executivo declara ter analisado com critério profissional e de alta governança corporativa os seguintes tópicos e indicadores chaves durante a reunião: 
                  {visibleChapters.filter(c => c.completed).map(c => c.title).join(', ') || 'Nenhum indicador concluído'}.
                </p>
              </div>

              {/* Signatures */}
              <div className="pt-12 grid grid-cols-2 gap-8 text-center text-xs font-sans">
                <div className="space-y-1">
                  <div className="border-b border-slate-400 mx-auto w-3/4 h-5" />
                  <p className="font-bold text-slate-700">Consultor responsável</p>
                  <p className="text-[10px] text-slate-500">Sauron OS Consulting</p>
                </div>
                <div className="space-y-1">
                  <div className="border-b border-slate-400 mx-auto w-3/4 h-5" />
                  <p className="font-bold text-slate-700">Representante do Conselho</p>
                  <p className="text-[10px] text-slate-500">Assinatura do Cliente</p>
                </div>
              </div>
            </div>
          ) : (
            /* Interactive Layout Summary View */
            <div className="space-y-6">
              
              {/* General Stats and Timer */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl text-center space-y-1">
                  <span className="text-[9px] font-black text-slate-500 uppercase">Tempo de Reunião</span>
                  <p className="text-2xl font-black text-white font-mono">{formatTime(timerSeconds)}</p>
                </div>
                <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl text-center space-y-1">
                  <span className="text-[9px] font-black text-slate-500 uppercase">Presentes</span>
                  <p className="text-2xl font-black text-emerald-400 font-mono">
                    {participants.filter(p => p.present).length} de {participants.length}
                  </p>
                </div>
                <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl text-center space-y-1">
                  <span className="text-[9px] font-black text-slate-500 uppercase">Decisões Aprovadas</span>
                  <p className="text-2xl font-black text-amber-500 font-mono">{sessionDecisions.length}</p>
                </div>
                <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl text-center space-y-1">
                  <span className="text-[9px] font-black text-slate-500 uppercase">Ações Criadas</span>
                  <p className="text-2xl font-black text-blue-400 font-mono">{newActionPlans.length}</p>
                </div>
              </div>

              {/* Split Lists of outputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Decisions taking block */}
                <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5 space-y-4">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block flex items-center gap-1.5">
                    <CheckSquare size={13} className="text-amber-500" /> Decisões Estabelecidas
                  </span>
                  <div className="space-y-2.5 max-h-56 overflow-y-auto custom-scrollbar">
                    {sessionDecisions.length > 0 ? (
                      sessionDecisions.map((d, i) => (
                        <div key={d.id} className="p-3 bg-slate-900/60 border border-slate-850 rounded-xl space-y-1">
                          <p className="text-xs font-semibold text-slate-200 leading-normal">{i + 1}. {d.description}</p>
                          <span className="text-[9px] text-slate-500 font-mono">Aprovado de forma unânime</span>
                        </div>
                      ))
                    ) : (
                      <div className="py-12 text-center text-slate-600 text-xs italic">Nenhuma decisão formal firmada nesta sessão.</div>
                    )}
                  </div>
                </div>

                {/* Action plans created block */}
                <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5 space-y-4">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block flex items-center gap-1.5">
                    <Activity size={13} className="text-blue-400" /> Novos Planos de Ação Criados
                  </span>
                  <div className="space-y-2.5 max-h-56 overflow-y-auto custom-scrollbar">
                    {newActionPlans.length > 0 ? (
                      newActionPlans.map((a, i) => (
                        <div key={a.id} className="p-3 bg-slate-900/60 border border-slate-850 rounded-xl space-y-1.5">
                          <p className="text-xs font-semibold text-slate-200 leading-normal">{i + 1}. {a.description}</p>
                          <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                            <span>Resp: {a.responsible}</span>
                            <span>Prazo: {a.deadline}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-12 text-center text-slate-600 text-xs italic">Nenhum plano de ação desenhado nesta sessão.</div>
                    )}
                  </div>
                </div>

              </div>

              {/* Observations list */}
              <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5 space-y-3">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Observações do Caso permanentemente registradas</span>
                <div className="space-y-2 max-h-36 overflow-y-auto custom-scrollbar">
                  {sessionObservations.length > 0 ? (
                    sessionObservations.map((o, i) => (
                      <p key={i} className="text-xs text-slate-300 leading-relaxed bg-slate-900/40 p-2 rounded-xl border border-slate-850/60">- {o}</p>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 text-center py-6">Nenhuma observação isolada registrada.</p>
                  )}
                </div>
              </div>

              {/* Pending items */}
              {sessionPendingItems.length > 0 && (
                <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5 space-y-3">
                  <span className="text-[10px] font-black uppercase text-rose-400 tracking-wider block">Pendências Corporativas Mapeadas</span>
                  <div className="space-y-1.5">
                    {sessionPendingItems.map((p, idx) => (
                      <div key={idx} className="text-xs text-slate-300 bg-rose-500/5 p-2 rounded-xl border border-rose-500/10 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                        <span>{p}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Modal Actions */}
        <div className="p-6 border-t border-slate-800 bg-slate-900/60 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
          <button 
            onClick={exportAtaAsTextFile}
            className="w-full md:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Download size={13} /> Exportar Arquivo de Texto (Ata)
          </button>

          <div className="flex gap-2 w-full md:w-auto">
            <button 
              onClick={() => setShowSummaryModal(false)}
              className="flex-1 md:flex-none px-5 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
            >
              Voltar
            </button>
            <button 
              onClick={handleFinalizeSession}
              disabled={isSyncing}
              className="flex-1 md:flex-none px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg cursor-pointer transition-all disabled:opacity-55"
            >
              {isSyncing ? 'Sincronizando Base...' : 'Sincronizar e Concluir'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
