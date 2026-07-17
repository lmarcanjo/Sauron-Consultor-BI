import React from 'react';
import { 
  Activity, Users, ClipboardList, Plus, CheckSquare
} from 'lucide-react';
import { AgendaItem } from './ExecutiveSessionAgenda';
import { ActionPlan } from '../modules/consultant-workspace/types';

export interface Participant {
  id: string;
  name: string;
  role: string;
  present: boolean;
}

export interface SessionDecision {
  id: string;
  description: string;
  responsible: string;
  deadline: string;
  priority: 'low' | 'medium' | 'high';
}

interface ExecutiveSessionRightPanelProps {
  currentChapter: AgendaItem;
  participants: Participant[];
  setParticipants: React.Dispatch<React.SetStateAction<Participant[]>>;
  newParticipantName: string;
  setNewParticipantName: (val: string) => void;
  newParticipantRole: string;
  setNewParticipantRole: (val: string) => void;
  addParticipant: () => void;
  notesText: string;
  setNotesText: React.Dispatch<React.SetStateAction<string>>;
  parsedNotesLines: { id: string; text: string }[];
  convertNoteToObservation: (text: string) => void;
  convertNoteToDecision: (text: string) => void;
  convertNoteToPending: (text: string) => void;
  convertNoteToActionForm: (text: string) => void;
  isCreatingAction: boolean;
  setIsCreatingAction: (val: boolean) => void;
  saveQuickActionPlan: (e?: React.FormEvent) => void;
  actDescription: string;
  setActDescription: (val: string) => void;
  actResponsible: string;
  setActResponsible: (val: string) => void;
  actDeadline: string;
  setActDeadline: (val: string) => void;
  actPriority: 'low' | 'medium' | 'high';
  setActPriority: (val: 'low' | 'medium' | 'high') => void;
  sessionDecisions: SessionDecision[];
}

export const ExecutiveSessionRightPanel: React.FC<ExecutiveSessionRightPanelProps> = ({
  currentChapter,
  participants,
  setParticipants,
  newParticipantName,
  setNewParticipantName,
  newParticipantRole,
  setNewParticipantRole,
  addParticipant,
  notesText,
  setNotesText,
  parsedNotesLines,
  convertNoteToObservation,
  convertNoteToDecision,
  convertNoteToPending,
  convertNoteToActionForm,
  isCreatingAction,
  setIsCreatingAction,
  saveQuickActionPlan,
  actDescription,
  setActDescription,
  actResponsible,
  setActResponsible,
  actDeadline,
  setActDeadline,
  actPriority,
  setActPriority,
  sessionDecisions
}) => {
  return (
    <aside className="w-80 border-l border-slate-900 bg-slate-950/60 flex flex-col shrink-0 overflow-y-auto custom-scrollbar">
      
      {/* Contextual Recommendation / Guidelines Header */}
      <div className="p-4 border-b border-slate-900 bg-slate-950/80">
        <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider flex items-center gap-1.5 mb-2">
          <Activity size={13} /> INSIGHT CONTEXTUAL DA PAUTA
        </span>

        {/* Conditional help description based on chapter */}
        <div className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-850">
          {currentChapter.chapterKey === 'abertura' && (
            <span>Certifique-se de validar a presença de todos os stakeholders fundamentais antes de iniciar as discussões de números.</span>
          )}
          {currentChapter.chapterKey === 'receita' && (
            <span>Foque em identificar quais unidades ou marcas do grupo acumularam o maior desvio no ciclo corrente.</span>
          )}
          {currentChapter.chapterKey === 'margem' && (
            <span>Explore a venda de categorias de alto valor agregado como alavanca corretiva imediata para elevar a margem da linha comercial.</span>
          )}
          {currentChapter.chapterKey === 'custos' && (
            <span>Configure custos e despesas para revisar a composição financeira desta pauta.</span>
          )}
          {currentChapter.chapterKey === 'comercial' && (
            <span>Configure vendedor, cliente, produto e valor para revisar o desempenho comercial real.</span>
          )}
          {currentChapter.chapterKey === 'pessoas' && (
            <span>Configure uma coluna de pessoa ou vendedor para revisar dados reais de equipe.</span>
          )}
          {currentChapter.chapterKey === 'plano' && (
            <span>Revisar e reatribuir prazos de entregas vencidas. Cada ação concluída gera impacto positivo na pontuação de maturidade.</span>
          )}
          {currentChapter.chapterKey === 'encerramento' && (
            <span>Revise as anotações geradas no Quick Notes Parser e as decisões aprovadas para exportação final da ata do comitê.</span>
          )}
          {currentChapter.chapterKey.startsWith('custom_') && (
            <span>Pauta complementar sugerida. Mantenha os registros estruturados para alimentar a memória histórica do caso.</span>
          )}
        </div>
      </div>

      {/* Panels */}
      <div className="flex-1 p-4 space-y-5 overflow-y-auto custom-scrollbar">
        
        {/* Participant manager inside opening (Chapter Abertura) */}
        {currentChapter.chapterKey === 'abertura' && (
          <div className="space-y-3">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block flex items-center gap-1">
              <Users size={12} className="text-blue-400" /> Presença e Comitê
            </span>
            <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar">
              {participants.map(p => (
                <div key={p.id} className="flex items-center justify-between text-xs bg-slate-900 px-2.5 py-1.5 rounded border border-slate-850">
                  <span className="font-semibold text-slate-200">{p.name} <strong className="text-[9px] text-slate-500 font-mono">({p.role})</strong></span>
                  <input 
                    type="checkbox" 
                    checked={p.present}
                    onChange={(e) => {
                      setParticipants(prev => prev.map(item => item.id === p.id ? { ...item, present: e.target.checked } : item));
                    }}
                    className="rounded border-slate-850 text-blue-600 bg-slate-950 focus:ring-0 cursor-pointer"
                  />
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-900">
              <input 
                type="text" 
                placeholder="Nome do Stakeholder"
                value={newParticipantName}
                onChange={e => setNewParticipantName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-850 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
              <div className="flex gap-1">
                <input 
                  type="text" 
                  placeholder="Cargo (Diretor, Sócio, etc)"
                  value={newParticipantRole}
                  onChange={e => setNewParticipantRole(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-850 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
                <button 
                  onClick={addParticipant}
                  className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-white text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Notes Area with live conversion actions */}
        <div className="space-y-2 border-t border-slate-900 pt-4">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block flex items-center justify-between">
            <span>BLOCO DE NOTAS RÁPIDO</span>
            <span className="text-[8px] font-mono text-slate-600">UMA LINHA POR ANOTAÇÃO</span>
          </label>
          <textarea 
            value={notesText}
            onChange={e => setNotesText(e.target.value)}
            placeholder="Ex: João vai renegociar frete&#10;Reduzir margem de carros novos..."
            className="w-full h-24 bg-slate-900 border border-slate-850 rounded-xl text-xs px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-600 font-mono resize-none leading-normal"
          />

          {/* Parsed note action converting triggers */}
          {parsedNotesLines.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-900 bg-slate-900/10 p-2.5 rounded-xl border border-slate-900">
              <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest block">Anotações Capturadas (Sincronizar)</span>
              <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                {parsedNotesLines.map(line => (
                  <div key={line.id} className="bg-slate-950 p-2 rounded border border-slate-850 space-y-2">
                    <p className="text-[11px] font-serif italic text-slate-300 leading-snug">"{line.text}"</p>
                    <div className="flex flex-wrap gap-1">
                      <button 
                        onClick={() => convertNoteToObservation(line.text)}
                        className="px-1.5 py-0.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded text-[9px] font-black uppercase flex items-center gap-0.5 cursor-pointer"
                      >
                        💡 Obs
                      </button>
                      <button 
                        onClick={() => convertNoteToDecision(line.text)}
                        className="px-1.5 py-0.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded text-[9px] font-black uppercase flex items-center gap-0.5 cursor-pointer"
                      >
                        ⚖️ Decisão
                      </button>
                      <button 
                        onClick={() => convertNoteToActionForm(line.text)}
                        className="px-1.5 py-0.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded text-[9px] font-black uppercase flex items-center gap-0.5 cursor-pointer"
                      >
                        🔨 Ação
                      </button>
                      <button 
                        onClick={() => convertNoteToPending(line.text)}
                        className="px-1.5 py-0.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded text-[9px] font-black uppercase flex items-center gap-0.5 cursor-pointer"
                      >
                        📌 Pend
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Inline Action Plan Builder Form */}
        <div className="space-y-3 pt-4 border-t border-slate-900">
          <button 
            type="button"
            onClick={() => setIsCreatingAction(!isCreatingAction)}
            className="w-full py-1.5 bg-slate-900 border border-slate-850 text-slate-300 hover:text-white hover:bg-slate-850 rounded text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus size={12} /> {isCreatingAction ? 'Ocultar Formulário' : 'Novo Plano de Ação'}
          </button>

          {isCreatingAction && (
            <form onSubmit={saveQuickActionPlan} className="bg-slate-900/40 p-3 rounded-xl border border-slate-900 space-y-2.5">
              <span className="text-[9px] font-black uppercase text-blue-400 tracking-wider block">Cadastrar Nova Ação Tática</span>
              
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase">Descrição da Ação</label>
                <input 
                  type="text" 
                  value={actDescription}
                  onChange={e => setActDescription(e.target.value)}
                  placeholder="Ex: João vai renegociar frete"
                  required
                  className="w-full bg-slate-950 border border-slate-850 rounded px-2 py-1 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase">Responsável</label>
                  <input 
                    type="text" 
                    value={actResponsible}
                    onChange={e => setActResponsible(e.target.value)}
                    placeholder="Nome"
                    className="w-full bg-slate-950 border border-slate-850 rounded px-2 py-1 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase">Prazo / Limite</label>
                  <input 
                    type="text" 
                    value={actDeadline}
                    onChange={e => setActDeadline(e.target.value)}
                    placeholder="Data"
                    className="w-full bg-slate-950 border border-slate-850 rounded px-2 py-1 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase">Prioridade Estratégica</label>
                <div className="grid grid-cols-3 gap-1">
                  {(['low', 'medium', 'high'] as const).map(p => (
                    <button 
                      key={p}
                      type="button"
                      onClick={() => setActPriority(p)}
                      className={`py-1 text-[9px] font-bold uppercase rounded border transition-all cursor-pointer ${
                        actPriority === p 
                          ? 'bg-blue-600 text-white border-blue-500' 
                          : 'bg-slate-950 text-slate-400 border-slate-850'
                      }`}
                    >
                      {p === 'low' ? 'Baixa' : p === 'medium' ? 'Média' : 'Alta'}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                type="submit"
                className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-wider rounded-lg shadow cursor-pointer transition-all"
              >
                Salvar Ação
              </button>
            </form>
          )}
        </div>

        {/* Live Decisions Logged Panel */}
        <div className="space-y-2 pt-4 border-t border-slate-900">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block flex items-center gap-1">
            <CheckSquare size={12} className="text-amber-500" /> Decisões Aprovadas ({sessionDecisions.length})
          </span>
          <div className="space-y-1.5 max-h-44 overflow-y-auto custom-scrollbar">
            {sessionDecisions.length > 0 ? (
              sessionDecisions.map(d => (
                <div key={d.id} className="bg-slate-900/40 border border-slate-900 p-2.5 rounded-lg space-y-1">
                  <p className="text-[11px] font-bold text-slate-200 leading-snug">{d.description}</p>
                  <span className="text-[9px] text-slate-500 font-mono">Resp: {d.responsible}</span>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-slate-600 text-[10px] italic border border-dashed border-slate-900 rounded-lg">
                Nenhuma decisão firmada ainda.
              </div>
            )}
          </div>
        </div>

      </div>
    </aside>
  );
};
