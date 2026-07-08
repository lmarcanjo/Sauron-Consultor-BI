import React from 'react';
import { ClipboardList, ArrowUp, ArrowDown, Eye, EyeOff, Plus } from 'lucide-react';

export interface AgendaItem {
  id: string;
  title: string;
  completed: boolean;
  visible: boolean;
  chapterKey: string;
}

interface ExecutiveSessionAgendaProps {
  agenda: AgendaItem[];
  currentChapter: AgendaItem;
  visibleChapters: AgendaItem[];
  newCustomAgendaTitle: string;
  setNewCustomAgendaTitle: (val: string) => void;
  saveAgendaModel: () => void;
  setActiveChapterIndex: (index: number) => void;
  setAgenda: React.Dispatch<React.SetStateAction<AgendaItem[]>>;
  moveAgendaItem: (index: number, direction: 'up' | 'down') => void;
  addCustomAgendaItem: () => void;
  completedObjectivesCount: number;
}

export const ExecutiveSessionAgenda: React.FC<ExecutiveSessionAgendaProps> = ({
  agenda,
  currentChapter,
  visibleChapters,
  newCustomAgendaTitle,
  setNewCustomAgendaTitle,
  saveAgendaModel,
  setActiveChapterIndex,
  setAgenda,
  moveAgendaItem,
  addCustomAgendaItem,
  completedObjectivesCount,
}) => {
  return (
    <aside className="w-72 border-r border-slate-900 bg-slate-950/40 flex flex-col shrink-0 overflow-y-auto custom-scrollbar">
      <div className="p-4 border-b border-slate-900 flex justify-between items-center bg-slate-950/60">
        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
          <ClipboardList size={13} className="text-blue-400" /> ROTEIRO / CAPÍTULOS
        </span>
        <button 
          onClick={saveAgendaModel}
          className="p-1 text-[9px] font-bold text-slate-500 hover:text-slate-300 border border-slate-800 rounded hover:bg-slate-900 transition-all uppercase cursor-pointer"
          title="Salvar modelo de agenda para este caso"
        >
          Salvar Modelo
        </button>
      </div>

      {/* Agenda Items List */}
      <div className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        {agenda.map((item, idx) => {
          const isSelected = item.chapterKey === currentChapter.chapterKey;
          return (
            <div 
              key={item.id}
              className={`group flex flex-col rounded-xl border p-2.5 transition-all ${
                isSelected 
                  ? 'bg-slate-900/90 border-blue-500/60 shadow-md' 
                  : 'bg-slate-950 border-slate-900 hover:border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between gap-1.5">
                <button 
                  onClick={() => {
                    const visIdx = visibleChapters.findIndex(c => c.chapterKey === item.chapterKey);
                    if (visIdx !== -1) {
                      setActiveChapterIndex(visIdx);
                    } else {
                      const updated = agenda.map(a => a.id === item.id ? { ...a, visible: true } : a);
                      setAgenda(updated);
                      setTimeout(() => {
                        const newVisChapters = updated.filter(a => a.visible);
                        const newIdx = newVisChapters.findIndex(c => c.chapterKey === item.chapterKey);
                        if (newIdx !== -1) {
                          setActiveChapterIndex(newIdx);
                        }
                      }, 50);
                    }
                  }}
                  className="flex-1 text-left flex items-center gap-2 cursor-pointer text-xs font-semibold"
                >
                  <input 
                    type="checkbox" 
                    checked={item.completed}
                    onChange={(e) => {
                      e.stopPropagation();
                      setAgenda(prev => prev.map(a => a.id === item.id ? { ...a, completed: e.target.checked } : a));
                    }}
                    className="rounded border-slate-800 text-blue-600 bg-slate-900 focus:ring-0 cursor-pointer"
                  />
                  <span className={`${item.completed ? 'line-through text-slate-500' : isSelected ? 'text-blue-400 font-bold' : 'text-slate-300'}`}>
                    {item.title}
                  </span>
                </button>
                
                {/* Inline Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => moveAgendaItem(idx, 'up')}
                    disabled={idx === 0}
                    className="p-0.5 text-slate-500 hover:text-slate-300 disabled:opacity-20 cursor-pointer"
                  >
                    <ArrowUp size={11} />
                  </button>
                  <button 
                    onClick={() => moveAgendaItem(idx, 'down')}
                    disabled={idx === agenda.length - 1}
                    className="p-0.5 text-slate-500 hover:text-slate-300 disabled:opacity-20 cursor-pointer"
                  >
                    <ArrowDown size={11} />
                  </button>
                  <button 
                    onClick={() => {
                      setAgenda(prev => prev.map(a => a.id === item.id ? { ...a, visible: !a.visible } : a));
                    }}
                    className="p-0.5 text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {item.visible ? <Eye size={11} /> : <EyeOff size={11} className="text-rose-500" />}
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Custom Agenda Creator */}
        <div className="pt-4 border-t border-slate-900 space-y-2">
          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Novo Capítulo Personalizado</label>
          <div className="flex gap-1">
            <input 
              type="text" 
              value={newCustomAgendaTitle}
              onChange={e => setNewCustomAgendaTitle(e.target.value)}
              placeholder="Ex: Alinhamento de Metas"
              className="flex-1 bg-slate-900 border border-slate-850 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-600"
            />
            <button 
              onClick={addCustomAgendaItem}
              className="p-1 bg-blue-600 hover:bg-blue-500 rounded text-white flex items-center justify-center cursor-pointer"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats Footer inside Agenda */}
      <div className="p-4 border-t border-slate-900 bg-slate-950/60 space-y-1.5">
        <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Metas Concluídas</span>
        <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
          <div 
            className="bg-blue-500 h-full transition-all duration-500" 
            style={{ width: `${(completedObjectivesCount / Math.max(1, agenda.length)) * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
          <span>Progresso</span>
          <span>{Math.round((completedObjectivesCount / Math.max(1, agenda.length)) * 100)}%</span>
        </div>
      </div>
    </aside>
  );
};
