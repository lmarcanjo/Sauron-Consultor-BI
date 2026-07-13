import React, { useState, useEffect } from 'react';
import { MonitorPlay, ChevronLeft, ChevronRight, Clock, Maximize, Target, HelpCircle, CheckSquare, Save, X, Presentation, FileText } from 'lucide-react';
import { showToast } from './Toast';

interface ModoReuniaoTabProps {
  slides?: any[];
  onExit?: () => void;
}

export const ModoReuniaoTab: React.FC<ModoReuniaoTabProps> = ({ onExit }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 5;
  const [timerSeconds, setTimerSeconds] = useState(0);

  const [notes, setNotes] = useState('');
  const [questions, setQuestions] = useState('');
  const [decisions, setDecisions] = useState('');

  useEffect(() => {
    const it = setInterval(() => setTimerSeconds(s => s + 1), 1000);
    return () => clearInterval(it);
  }, []);

  const formatTime = (totalS: number) => {
    const mins = Math.floor(totalS / 60);
    const secs = totalS % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 rounded-xl overflow-hidden shadow-2xl font-sans border border-slate-800 text-white relative min-h-[700px]">
      
      {/* Top Bar - Presenter HUD */}
      <div className="flex justify-between items-center bg-slate-900 border-b border-white/10 px-4 py-2 opacity-80 hover:opacity-100 transition-opacity z-10 shrink-0">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-xs font-black uppercase text-blue-400 tracking-wider">
            <MonitorPlay size={14} /> Modo Reunião
          </span>
          <span className="h-4 w-px bg-white/20"></span>
          <div className="flex items-center gap-1 text-xs font-mono font-bold text-amber-500">
            <Clock size={12} /> {formatTime(timerSeconds)}
          </div>
        </div>
        
        <div className="text-[10px] uppercase font-black tracking-widest text-slate-500">
          Sauron OS Consultant
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
              } else {
                document.exitFullscreen().catch(() => {});
              }
            }}
            className="p-1.5 hover:bg-white/10 rounded transition-colors text-slate-400" 
            title="Tela Cheia"
          >
            <Maximize size={14} />
          </button>
          <button 
            onClick={onExit}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/40 border border-rose-500/50 text-rose-400 text-[10px] font-black uppercase rounded transition-colors"
          >
            <X size={12} /> Encerrar
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        
        {/* Main Stage: Slide Viewer */}
        <div className="flex-1 flex flex-col relative bg-slate-900">
          <div className="flex-1 p-8 flex items-center justify-center">
            {/* The actual slide bounds inside meeting mode */}
            <div className="w-full max-w-5xl aspect-[16/9] bg-white rounded-xl shadow-2xl overflow-hidden relative border border-slate-800 flex items-center justify-center">
               <div className="text-center">
                 <Presentation className="text-slate-200 mx-auto mb-4" size={64} />
                 <h1 className="text-4xl font-black text-slate-800 uppercase tracking-tight">Slide {currentSlide + 1}</h1>
                 <p className="text-slate-500 font-bold mt-2">Visão Executiva do Painel de BI</p>
               </div>
               <div className="absolute bottom-4 right-4 text-xs font-extrabold text-slate-400">
                 {currentSlide + 1} / {totalSlides}
               </div>
            </div>
          </div>

          {/* Slide Navigation Controls Overlay */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-slate-900/90 border border-white/10 backdrop-blur-md px-6 py-3 rounded-full shadow-2xl">
            <button 
              onClick={() => setCurrentSlide(c => Math.max(0, c - 1))}
              disabled={currentSlide === 0}
              className="p-2 bg-white/5 hover:bg-white/10 disabled:opacity-20 rounded-full transition-colors font-bold text-white cursor-pointer"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex gap-1.5">
              {Array.from({ length: totalSlides }).map((_, i) => (
                <div 
                  key={i} 
                  className={`w-2 h-2 rounded-full ${currentSlide === i ? 'bg-blue-500 scale-125' : 'bg-white/20'} transition-all`}
                />
              ))}
            </div>
            <button 
              onClick={() => setCurrentSlide(c => Math.min(totalSlides - 1, c + 1))}
              disabled={currentSlide === totalSlides - 1}
              className="p-2 bg-white/5 hover:bg-white/10 disabled:opacity-20 rounded-full transition-colors font-bold text-white cursor-pointer"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Right Panel: Consultant Private Desk */}
        <div className="w-80 border-l border-white/10 flex flex-col shrink-0 bg-slate-950">
          <div className="p-3 border-b border-white/10 bg-slate-900/50">
            <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1.5">
              <Target size={12} /> Ata de Reunião Direta
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
            
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 block flex items-center gap-1">
                 <Save size={10} /> Notas Privadas (Consultor)
              </label>
              <textarea 
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Anotações ocultas do cliente durante a apresentação..."
                className="w-full h-24 bg-white/5 border border-white/10 text-xs px-2.5 py-2 rounded text-slate-300 focus:outline-none focus:border-blue-500 font-serif resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 block flex items-center gap-1">
                 <HelpCircle size={10} /> Dúvidas do Cliente
              </label>
              <textarea 
                value={questions}
                onChange={e => setQuestions(e.target.value)}
                placeholder="Ex: Por que a margem caiu em veículos novos?"
                className="w-full h-20 bg-white/5 border border-white/10 text-xs px-2.5 py-2 rounded text-slate-300 focus:outline-none focus:border-emerald-500 font-serif resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 block flex items-center gap-1">
                 <CheckSquare size={10} /> Decisões / Plano de Ação
              </label>
              <textarea 
                value={decisions}
                onChange={e => setDecisions(e.target.value)}
                placeholder="- Analisar margem de acessórios&#10;- Treinar vendedores B e C"
                className="w-full h-28 bg-white/5 border border-white/10 text-xs px-2.5 py-2 rounded text-amber-300 focus:outline-none focus:border-amber-500 font-mono resize-none leading-relaxed"
              />
            </div>

          </div>

          <div className="p-3 border-t border-white/10 bg-slate-900/50 flex flex-col gap-2">
             <button 
                onClick={() => {
                  const content = `ATA DE REUNIÃO\n\nTempo: ${formatTime(timerSeconds)}\n\nAnotações Gerais:\n${notes}\n\nPerguntas Levantadas:\n${questions}\n\nDecisões e Plano de Ação:\n${decisions}`;
                  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `ata_reuniao_${new Date().getTime()}.txt`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-widest rounded transition-colors flex items-center justify-center gap-2"
             >
                <FileText size={12} /> Exportar Ata Reunião
             </button>
             <button 
                onClick={() => {
                  try { localStorage.setItem('sauron_ata_created', Date.now().toString()); } catch(e) {}
                  showToast('success', 'Resumo da reunião salvo com sucesso.');
                }}
                className="w-full py-2 bg-white/5 hover:bg-white/10 text-white/70 text-[10px] font-black uppercase tracking-widest rounded transition-colors flex items-center justify-center gap-2 border border-white/10"
             >
                <Save size={12} /> Salvar Histórico
             </button>
          </div>
        </div>

      </div>
    </div>
  );
};
