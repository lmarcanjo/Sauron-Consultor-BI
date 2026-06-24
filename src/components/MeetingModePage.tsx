import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X, Maximize, Play, Save, Download } from 'lucide-react';

export const MeetingModePage = ({ onExit }: { onExit: () => void }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const slides = [
    { title: "Capa da Apresentação", type: "Capa" },
    { title: "Resumo Executivo", type: "Resumo" },
    { title: "DRE Consolidado", type: "DRE" },
    { title: "Ranking de Vendedores", type: 'Ranking' }
  ];

  const goNext = () => setCurrentSlideIndex(v => Math.min(v + 1, slides.length - 1));
  const goPrev = () => setCurrentSlideIndex(v => Math.max(v - 1, 0));

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] animate-fade-in bg-white">
      {/* Meeting Header */}
      <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200">
        <h2 className="text-xl font-extrabold text-sauron-navy flex items-center gap-2">
          <Play className="text-rose-500 fill-rose-500" size={20} /> MODO REUNIÃO
        </h2>
        <div className="flex gap-2">
           <button onClick={onExit} className="border border-slate-200 text-slate-600 px-3 py-1.5 rounded text-xs font-bold hover:bg-slate-50 flex items-center gap-1">
             <X size={14} /> SAIR
           </button>
           <button className="bg-sauron-navy text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-sauron-dark flex items-center gap-1">
             <Download size={14} /> ATA
           </button>
        </div>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Main Presentation Screen */}
        <div className="flex-1 bg-slate-100 border border-slate-200 rounded-lg flex flex-col items-center justify-center relative p-8">
           <div className="absolute top-4 right-4 flex gap-2">
             <span className="bg-white border border-slate-200 text-slate-500 text-[10px] px-2 py-0.5 rounded font-bold">
               SLIDE {currentSlideIndex + 1} / {slides.length}
             </span>
             <button className="bg-white border border-slate-200 text-slate-500 p-1 rounded hover:bg-slate-50">
               <Maximize size={14} />
             </button>
           </div>
           
           <div className="bg-white w-full max-w-4xl aspect-video rounded-lg shadow-sm border border-slate-200 p-8 flex flex-col items-center justify-center text-center">
             <h2 className="text-4xl font-extrabold text-sauron-navy mb-4">{slides[currentSlideIndex].title}</h2>
             <p className="text-slate-500">Exibição interativa e sem poluição: {slides[currentSlideIndex].type}</p>
           </div>
           
           {/* Navigation Controls */}
           <div className="absolute bottom-4 flex gap-4">
             <button onClick={goPrev} disabled={currentSlideIndex === 0} className="bg-white border border-slate-200 text-slate-600 p-3 rounded-full hover:bg-slate-50 shadow-sm disabled:opacity-50">
               <ChevronLeft size={20} />
             </button>
             <button onClick={goNext} disabled={currentSlideIndex === slides.length - 1} className="bg-white border border-slate-200 text-slate-600 p-3 rounded-full hover:bg-slate-50 shadow-sm disabled:opacity-50">
               <ChevronRight size={20} />
             </button>
           </div>
        </div>

        {/* Meeting Assistant Panel */}
        <div className="w-80 border border-slate-200 bg-white rounded-lg flex flex-col">
           <div className="bg-slate-50 border-b border-slate-200 p-3">
             <h3 className="text-xs font-bold text-sauron-navy uppercase tracking-wide">Assistente de Reunião</h3>
           </div>
           <div className="flex-1 p-4 overflow-y-auto space-y-4 text-sm">
             <div>
               <h4 className="font-bold text-xs text-sauron-dark mb-2">Anotações do Slide Local</h4>
               <p className="text-slate-600 text-xs italic bg-amber-50 p-2 rounded border border-amber-100">
                 Destaque a queda na margem da loja Norte. (Nota privada)
               </p>
             </div>
             <div className="pt-4 border-t border-slate-100">
               <h4 className="font-bold text-xs text-sauron-dark mb-2">Plano de Ação Instantâneo</h4>
               <textarea placeholder="Ex: João vai revisar a precificação..." className="w-full border border-slate-200 rounded p-2 text-xs h-20 text-slate-700 bg-slate-50"></textarea>
               <button className="mt-2 w-full bg-sauron-blue text-white py-1.5 rounded text-[10px] font-bold tracking-wide">ADICIONAR TAREFA</button>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};
