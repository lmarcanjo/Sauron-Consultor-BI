import React, { useState, useMemo } from 'react';
import { Presentation, Plus, Copy, Trash2, Eye, LayoutTemplate, Layers, Settings, Maximize, FileText, ChevronRight, Play, MonitorPlay } from 'lucide-react';
import { SlideConfig } from './FechamentoMensalTab';
import { useDataSourceManager } from '../hooks/useDataSourceManager';

interface ApresentacoesTabProps {
  metrics?: any;
  formatCurrency?: (v: number) => string;
  onPresent?: () => void;
}

export const ApresentacoesTab: React.FC<ApresentacoesTabProps> = ({ metrics, formatCurrency, onPresent }) => {
  const { activeDataSource } = useDataSourceManager();

  const [presentations, setPresentations] = useState([
    { id: '1', title: 'Fechamento Maio/2026 — Grupo Topázio', date: '2026-06-01', type: 'Fechamento Mensal' },
    { id: '2', title: 'Diagnóstico de Performance: Seminovos', date: '2026-05-15', type: 'Diagnóstico de Loja' },
  ]);

  const visiblePresentations = useMemo(() => {
    if (activeDataSource === "DEMO_DATA") {
      return presentations;
    } else {
      return presentations.filter(p => !p.title.includes("Topázio") && !p.title.includes("Topazio") && !p.title.includes("Seminovos"));
    }
  }, [activeDataSource, presentations]);

  const [currentView, setCurrentView] = useState<'list' | 'builder'>('list');
  const [activePresentationId, setActivePresentationId] = useState<string | null>(null);

  // Builder State
  const [slides, setSlides] = useState<SlideConfig[]>([
    { id: 'slide1', title: 'Relatório de Fechamento Estratégico', subtitle: 'Sauron OS', type: 'cover', content: 'Apresentação executiva' },
    { id: 'slide2', title: 'Pauta da Reunião', type: 'agenda', content: 'Tópicos definidos' },
    { id: 'slide3', title: 'Desempenho Comercial', subtitle: 'Vendedores', type: 'stats', content: 'Receitas por vendedor' },
  ]);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  if (currentView === 'builder') {
    const slide = slides[activeSlideIndex];
    return (
      <div className="flex flex-col h-full bg-slate-100 dark:bg-slate-950 rounded-xl overflow-hidden shadow-inner font-sans border border-slate-200 dark:border-slate-800">
        {/* Top Builder Toolbar */}
        <div className="flex justify-between items-center bg-white dark:bg-slate-900 px-4 py-3 border-b border-slate-200 dark:border-slate-800 shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setCurrentView('list')}
              className="text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-blue-500 transition-colors mr-2 flex items-center gap-1"
            >
              <ChevronRight className="rotate-180" size={14} /> Voltar
            </button>
            <Presentation size={16} className="text-blue-500" />
            <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Construtor de Deck Corporativo</h2>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={onPresent}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 rounded transition-colors shadow-sm"
            >
              <Eye size={12} />
              Preview
            </button>
            <button 
              onClick={onPresent}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-[10px] font-black uppercase text-white rounded transition-colors shadow-sm"
            >
              <Play size={12} className="stroke-[2.5]" />
              Apresentar Reunião
            </button>
          </div>
        </div>

        {/* Builder 3-Column Layout */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Column: Mini Slide Spoilers (Canva style) */}
          <div className="w-56 bg-slate-50 dark:bg-slate-900/50 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0">
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900/80">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1">
                <Layers size={12} /> Painéis ({slides.length})
              </span>
              <button onClick={() => setSlides([...slides, { id: Date.now().toString(), title: 'Nova Lâmina', type: 'cover', content: '' }])} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 transition-colors" title="Adicionar Lâmina">
                <Plus size={14} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {slides.map((s, idx) => (
                <div 
                  key={s.id}
                  onClick={() => setActiveSlideIndex(idx)}
                  className={`w-full aspect-[16/9] rounded-lg border-2 cursor-pointer transition-all overflow-hidden flex flex-col items-center justify-center p-2 relative group ${activeSlideIndex === idx ? 'border-blue-500 shadow-md ring-2 ring-blue-500/20' : 'border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 bg-white dark:bg-slate-800'}`}
                >
                  <span className="absolute top-1 left-2 text-[8px] font-extrabold text-slate-400">{idx + 1}</span>
                  <div className="text-center w-full">
                    <p className="text-[9px] font-bold text-slate-800 dark:text-slate-200 truncate">{s.title || 'Sem título'}</p>
                    <p className="text-[8px] text-slate-400 mt-0.5 uppercase tracking-wider">{s.type}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Center Column: Slide Canvas Preview */}
          <div className="flex-1 p-8 overflow-y-auto bg-slate-200/50 dark:bg-slate-950 flex justify-center items-start">
            <div className="w-full max-w-4xl aspect-[16/9] bg-white dark:bg-slate-900 shadow-2xl rounded-xl border border-slate-300 dark:border-slate-800 flex flex-col justify-center items-center p-12 text-center scale-95 origin-top relative overflow-hidden transition-all">
              {/* Fake UI for the Canvas rendering */}
              <div className="absolute top-4 left-4 flex gap-2 items-center">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              </div>
              <p className="text-[10px] font-mono font-black uppercase text-blue-500 mb-4 tracking-[0.2em]">{slide.type} LÂMINA</p>
              <h1 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2 leading-tight">
                {slide.title}
              </h1>
              {slide.subtitle && <h2 className="text-xl lg:text-2xl text-slate-500 dark:text-slate-400 font-bold mb-8">{slide.subtitle}</h2>}
              <p className="text-sm text-slate-600 dark:text-slate-500 leading-relaxed max-w-2xl text-center italic">
                "{slide.content}"
              </p>
              <div className="absolute bottom-4 right-6 text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest">{activeSlideIndex + 1} / {slides.length}</div>
            </div>
          </div>

          {/* Right Column: Slide Properties */}
          <div className="w-72 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col shrink-0 shadow-[-4px_0_15px_-3px_rgb(0_0_0_/_0.1)] dark:shadow-[-4px_0_15px_-3px_rgb(0_0_0_/_0.5)]">
            <div className="p-3 border-b border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1">
                <Settings size={12} /> Propriedades
              </span>
            </div>
            
            <div className="p-4 space-y-4 flex-1 overflow-y-auto">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Tipo do Layout</label>
                <select 
                  value={slide.type}
                  onChange={(e) => {
                    const next = [...slides];
                    next[activeSlideIndex].type = e.target.value as any;
                    setSlides(next);
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs px-2.5 py-1.5 rounded text-slate-800 dark:text-slate-100 font-bold"
                >
                  <option value="cover">Capa</option>
                  <option value="agenda">Pauta Resumo</option>
                  <option value="stats">Métricas BI</option>
                  <option value="diagnostics">Diagnósticos</option>
                  <option value="roadmap">Plano de Ação</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Título Principal</label>
                <input 
                  type="text" 
                  value={slide.title}
                  onChange={(e) => {
                    const next = [...slides];
                    next[activeSlideIndex].title = e.target.value;
                    setSlides(next);
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs px-2.5 py-1.5 rounded text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Subtítulo</label>
                <input 
                  type="text" 
                  value={slide.subtitle || ""}
                  onChange={(e) => {
                    const next = [...slides];
                    next[activeSlideIndex].subtitle = e.target.value;
                    setSlides(next);
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs px-2.5 py-1.5 rounded text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Texto Explicativo</label>
                <textarea 
                  rows={4}
                  value={slide.content}
                  onChange={(e) => {
                    const next = [...slides];
                    next[activeSlideIndex].content = e.target.value;
                    setSlides(next);
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs px-2.5 py-1.5 rounded text-slate-800 dark:text-slate-100 resize-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <button 
                  onClick={() => {
                    const next = [...slides];
                    next.push({...slide, id: Date.now().toString()});
                    setSlides(next);
                  }}
                  className="w-full flex items-center gap-2 justify-center px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 rounded cursor-pointer transition-colors"
                >
                  <Copy size={12} /> Duplicar Lâmina
                </button>
                <button 
                  disabled={slides.length === 1}
                  onClick={() => {
                    if (slides.length > 1) {
                      const next = slides.filter((_, i) => i !== activeSlideIndex);
                      setSlides(next);
                      if (activeSlideIndex >= next.length) setActiveSlideIndex(next.length - 1);
                    }
                  }}
                  className="w-full flex items-center gap-2 justify-center px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 text-xs font-bold text-rose-600 dark:text-rose-400 rounded cursor-pointer transition-colors disabled:opacity-50"
                >
                  <Trash2 size={12} /> Excluir Lâmina
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- List View Component Render ---
  return (
    <div className="space-y-6">
      
      {/* List Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black uppercase text-slate-800 dark:text-white flex items-center gap-2">
            <Presentation className="text-blue-500" />
            Galeria de Apresentações Executivas
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">Modelos prontos e templates do consultor.</p>
        </div>
        <button 
          onClick={() => setCurrentView('builder')}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[10px] uppercase font-black tracking-wider rounded-lg shadow-sm transition-colors cursor-pointer"
        >
          <Plus size={14} /> Nova Apresentação
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visiblePresentations.map(p => (
          <div key={p.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4 group">
            <div className="flex justify-between items-start">
              <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 transition-colors">
                <Presentation size={18} className="text-slate-600 dark:text-slate-300 group-hover:text-blue-500 transition-colors" />
              </div>
              <span className="text-[9px] font-mono font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded uppercase">
                {p.date}
              </span>
            </div>
            
            <div>
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1 block">{p.type}</span>
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 leading-tight">
                {p.title}
              </h3>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex justify-between items-center mt-auto">
              <button 
                onClick={() => setCurrentView('builder')}
                className="text-[10px] font-black uppercase text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors flex items-center gap-1"
              >
                Editar <ChevronRight size={12} />
              </button>
              <button 
                onClick={onPresent}
                className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-500 hover:text-emerald-500 transition-colors cursor-pointer" 
                title="Modo Reunião"
              >
                <MonitorPlay size={12} />
              </button>
            </div>
          </div>
        ))}

        {/* Create from template card */}
        <div 
          onClick={() => setCurrentView('builder')}
          className="border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/50 dark:hover:bg-slate-800/50 rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-colors min-h-[160px] gap-2"
        >
          <div className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-sm mb-1">
            <LayoutTemplate size={20} className="text-slate-400" />
          </div>
          <span className="text-xs font-black uppercase text-slate-600 dark:text-slate-300">Explorar Templates</span>
          <span className="text-[10px] font-semibold text-slate-400">Ver modelos prontos Sauron OS</span>
        </div>
      </div>
    </div>
  );
};
