import React, { useState, useEffect, useMemo } from "react";
import { 
  Presentation, 
  ShieldAlert, 
  Plus, 
  FileText, 
  Play, 
  Printer, 
  AlertTriangle, 
  Sparkles, 
  TrendingUp, 
  ArrowUp, 
  ArrowDown, 
  Trash2, 
  Save, 
  RotateCcw,
  Check,
  Shield,
  LayoutTemplate
} from "lucide-react";
import { showToast } from "./Toast";
import { LancamentoFinanceiro, MetricasConsolidadas } from "../types";

interface FechamentoMensalTabProps {
  metrics: MetricasConsolidadas;
  filtros: any;
  formatCurrency: (v: number) => string;
}

export interface SlideConfig {
  id: string;
  title: string;
  subtitle?: string;
  type: "cover" | "agenda" | "stats" | "diagnostics" | "roadmap";
  content: string;
}

export const FechamentoMensalTab: React.FC<FechamentoMensalTabProps> = ({
  metrics,
  filtros,
  formatCurrency
}) => {
  const [isPlayingDeck, setIsPlayingDeck] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Load meeting topics & annotations from localStorage to feed presentation slides dynamically!
  const [localTopics, setLocalTopics] = useState<string[]>([]);
  const [localNotes, setLocalNotes] = useState<Record<string, string>>({});
  const [slides, setSlides] = useState<SlideConfig[]>([]);

  // Default Slide Blueprints (Baseline templates)
  const defaultSlideConfigs = useMemo<SlideConfig[]>(() => [
    {
      id: "slide_cover",
      title: "Relatório de Fechamento Estratégico",
      subtitle: "Sauron OS — Enterprise Consulting Operating System",
      type: "cover",
      content: "Apresentação executiva de governança e controle de faturamento consolidado."
    },
    {
      id: "slide_agenda",
      title: "Pauta da Reunião de Fechamento",
      subtitle: "Compilado Técnico de Governança",
      type: "agenda",
      content: "Desenho prioritário de atas definidas para alinhamento regional:"
    },
    {
      id: "slide_stats",
      title: "Desempenho Consolidado de Resultados",
      subtitle: "Métricas de Receitas & Custos do Período",
      type: "stats",
      content: "Desempenho financeiro agrupado do faturamento bruto real e margens de lucro."
    },
    {
      id: "slide_diagnostics",
      title: "Diagnósticos e Notas da Operação",
      subtitle: "Incidentes e Performance Regional",
      type: "diagnostics",
      content: "Anotações e hipóteses operacionais fundamentadas pelo consultor:"
    },
    {
      id: "slide_roadmap",
      title: "Diretrizes e Próximos Passos",
      subtitle: "Plano de Ação para Recuperação de Margem",
      type: "roadmap",
      content: "Plano estruturado de contingenciamento contra gargalos comerciais:"
    }
  ], []);

  // --- INITIAL LOAD ---
  useEffect(() => {
    // 1. Load context details
    const savedTopics = localStorage.getItem("sauron_consultant_topics");
    if (savedTopics) {
      try { setLocalTopics(JSON.parse(savedTopics)); } catch(e){}
    } else {
      setLocalTopics([
        "Apresentação dos resultados consolidados",
        "Auditoria do descompasso de custos fiscais",
        "Plano de ação imediato para reverter queda de margem"
      ]);
    }

    const savedNotes = localStorage.getItem("sauron_consultant_notes");
    if (savedNotes) {
      try { setLocalNotes(JSON.parse(savedNotes)); } catch(e){}
    }

    // 2. Load Presentation Builder structures
    const savedCustomPresentation = localStorage.getItem("sauron_custom_presentation");
    if (savedCustomPresentation) {
      try {
        setSlides(JSON.parse(savedCustomPresentation));
      } catch (e) {
        setSlides(defaultSlideConfigs);
      }
    } else {
      setSlides(defaultSlideConfigs);
    }
  }, [isPlayingDeck, defaultSlideConfigs]);

  // --- BUILDER ACTIONS ---
  const handleSavePresentation = () => {
    localStorage.setItem("sauron_custom_presentation", JSON.stringify(slides));
    showToast("success", "Estrutura personalizada da apresentação salva.");
  };

  const handleResetToDefault = () => {
    if (window.confirm("Deseja restaurar a apresentação para as lâminas padrão do Sauron OS?")) {
      setSlides(defaultSlideConfigs);
      localStorage.removeItem("sauron_custom_presentation");
    }
  };

  const handleUpdateSlideField = (id: string, field: keyof SlideConfig, value: string) => {
    setSlides(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleMoveSlide = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= slides.length) return;
    setSlides(prev => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  const handleDeleteSlide = (id: string) => {
    if (slides.length <= 1) {
      showToast("warning", "A apresentação precisa ter ao menos uma lâmina ativa.");
      return;
    }
    setSlides(prev => prev.filter(s => s.id !== id));
  };

  const handleAddSlide = (type: "cover" | "agenda" | "stats" | "diagnostics" | "roadmap") => {
    let title = "Nova Lâmina";
    let subtitle = "Subtítulo customizado";
    if (type === "cover") { title = "Relatório Adicional"; subtitle = "Setores Especiais"; }
    else if (type === "agenda") { title = "Pauta de Discussão Extra"; }
    else if (type === "stats") { title = "Visão Econômica Detalhada"; }
    else if (type === "diagnostics") { title = "Obstáculos e Campo Técnico"; }
    else if (type === "roadmap") { title = "Diretrize Suplementar"; }

    const newSlide: SlideConfig = {
      id: `slide_custom_${Date.now()}`,
      title,
      subtitle,
      type,
      content: "Insira aqui as anotações explicativas em formato de parágrafo livre para apresentação."
    };
    setSlides(prev => [...prev, newSlide]);
  };

  // --- DYNAMIC SLIDE RENDERING COMBINATION ---
  const slideDeck = useMemo(() => {
    return slides.map(s => {
      let items: any[] = [];
      let steps: any[] = [];

      if (s.type === "agenda") {
        items = localTopics;
      } else if (s.type === "diagnostics") {
        items = Object.entries(localNotes).map(([k, text]) => {
          const [type, value] = k.split("-");
          return { type, name: value, description: text };
        });
      } else if (s.type === "roadmap") {
        steps = [
          { order: 1, text: "Limitar a autonomia regional de gerentes locais para concessão de descontos em campanhas acima de 3% sem anuência prévia." },
          { order: 2, text: "Auditar licenças ativas do painel de TI operacional e links redundantes de telecomunicações antigos." },
          { order: 3, text: "Alterar modelo de comissionamento de vendas: condicionar comissões cheias à retenção de margem média mínima de 1.5%." }
        ];
      }

      return {
        ...s,
        items,
        steps,
        metrics: {
          receita: metrics.receitaTotal,
          lucro: metrics.lucroTotal,
          margem: metrics.margemMedia,
          despesa: metrics.despesaTotal
        }
      };
    });
  }, [slides, localTopics, localNotes, metrics]);

  const handleNextSlide = () => {
    if (currentSlide < slideDeck.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const handlePrevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  return (
    <div className="space-y-4 font-sans text-slate-800 dark:text-slate-150 animate-fade-in" id="fechamento-mensal-tab-container">
      {/* Presentation view switcher banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xs font-black uppercase text-slate-800 dark:text-white tracking-wider flex items-center gap-1.5 animate-pulse">
            <Presentation size={14} className="text-blue-500" />
            <span>Fechamento Mensal e Apresentação Executiva</span>
          </h3>
          <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5 max-w-xl">
            Edite, ordene, e prepare seu slide deck executivo para reunião de diretoria usando o Construtor abaixo. Inicie a visualização profissional em tela cheia com um clique.
          </p>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => window.print()}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-[10px] uppercase rounded-lg border border-slate-200 dark:border-slate-800 transition cursor-pointer flex items-center gap-1.5"
          >
            <Printer size={11} />
            <span>Imprimir Relatório</span>
          </button>

          <button
            onClick={() => {
              setCurrentSlide(0);
              setIsPlayingDeck(true);
            }}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase rounded-lg shadow-sm transition cursor-pointer flex items-center gap-1.5"
          >
            <Play size={11} className="stroke-[2.5]" />
            <span>Iniciar Apresentação</span>
          </button>
        </div>
      </div>

      {/* TWO SECTIONS: PRESENTATION BUILDER VS UTILITIES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* LEFT COMPONENT: CONSTRUTOR DE APRESENTAÇÃO (Takes 2 columns) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-4">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 dark:border-slate-800/80 pb-3 gap-2">
              <div>
                <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-205 flex items-center gap-1.5">
                  <LayoutTemplate size={12} className="text-blue-500" />
                  <span>Construtor de Apresentação (Builder)</span>
                </h4>
                <p className="text-[9px] text-slate-400 mt-0.5 font-medium">Customize os blocos, adicione lâminas, reordene-as e salve sua configuração operacional.</p>
              </div>
              <div className="flex gap-1.5 self-end">
                <button
                  onClick={handleResetToDefault}
                  className="px-2 py-1 bg-slate-105 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-705 text-slate-605 dark:text-slate-300 text-[9px] font-bold uppercase rounded flex items-center gap-1 transition"
                  title="Restaurar lâminas originais"
                >
                  <RotateCcw size={10} />
                  <span>Config Padrão</span>
                </button>
                <button
                  onClick={handleSavePresentation}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-black uppercase rounded flex items-center gap-1 transition shadow-sm"
                  title="Salvar ordem e conteúdo no computador"
                >
                  <Save size={10} />
                  <span>Salvar Blueprint</span>
                </button>
              </div>
            </div>

            {/* QUICK ACTIONS: ADD NEW SLIDE */}
            <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl space-y-2">
              <span className="text-[8px] font-black uppercase tracking-wider text-slate-450 block">Adicionar Novo Bloco de Lâmina:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { type: "cover", label: "+ Capa", desc: "Capa do deck executivo" },
                  { type: "agenda", label: "+ Pauta Atas", desc: "Listagem de metas de pauta das atas" },
                  { type: "stats", label: "+ BI Métricas", desc: "Faturamento e lucros consolidados" },
                  { type: "diagnostics", label: "+ Obstáculos", desc: "Notas de atrito técnico regional" },
                  { type: "roadmap", label: "+ Ações", desc: "Planos de contingenciamento recomendados" }
                ].map((btn) => (
                  <button
                    key={btn.type}
                    onClick={() => handleAddSlide(btn.type as any)}
                    className="px-2.5 py-1 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 text-[9px] font-black uppercase rounded transition cursor-pointer"
                    title={btn.desc}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            {/* INTERACTIVE LIST OF CARDS */}
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {slides.map((slide, index) => (
                <div 
                  key={slide.id} 
                  className="p-3.5 bg-slate-50 dark:bg-slate-850/40 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3 hover:border-slate-300 dark:hover:border-slate-700 transition"
                >
                  {/* Card Title Header with Reordering and deletion */}
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 font-mono">
                        {slide.type}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono font-bold">Lâmina {index + 1}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleMoveSlide(index, "up")}
                        disabled={index === 0}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded disabled:opacity-25 transition"
                        title="Mover para cima"
                      >
                        <ArrowUp size={11} className="text-slate-500" />
                      </button>
                      <button
                        onClick={() => handleMoveSlide(index, "down")}
                        disabled={index === slides.length - 1}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded disabled:opacity-25 transition"
                        title="Mover para baixo"
                      >
                        <ArrowDown size={11} className="text-slate-500" />
                      </button>
                      <button
                        onClick={() => handleDeleteSlide(slide.id)}
                        className="p-1 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-900/45 rounded transition text-red-500 ml-1"
                        title="Deletar bloco"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>

                  {/* Input editorial fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Título:</label>
                      <input
                        type="text"
                        value={slide.title}
                        onChange={(e) => handleUpdateSlideField(slide.id, "title", e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs px-2.5 py-1 rounded text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-sans"
                      />
                    </div>
                    {slide.type === "cover" && (
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Subtítulo:</label>
                        <input
                          type="text"
                          value={slide.subtitle || ""}
                          onChange={(e) => handleUpdateSlideField(slide.id, "subtitle", e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs px-2.5 py-1 rounded text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-sans"
                        />
                      </div>
                    )}
                    <div className="md:col-span-2 space-y-1 mt-0.5">
                      <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Texto Explicativo de Rodapé/Fundo:</label>
                      <textarea
                        rows={2}
                        value={slide.content}
                        onChange={(e) => handleUpdateSlideField(slide.id, "content", e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs px-2.5 py-1.5 rounded text-slate-850 dark:text-slate-200 focus:outline-none focus:border-blue-500 font-sans resize-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* RIGHT COMPONENT: METADATA & COMPLIANCE BOX (Takes 1 column) */}
        <div className="space-y-4">
          {/* Executive Agenda draft */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
            <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-350 border-b border-slate-50 dark:border-slate-800 pb-2 flex items-center gap-1.5">
              <ShieldAlert size={12} className="text-rose-500" />
              <span>Diretrizes de Governança BI</span>
            </h4>
            
            <div className="p-3 bg-red-50/40 dark:bg-red-950/20 border border-red-150 dark:border-red-900/40 rounded-xl space-y-2">
              <span className="text-[9px] font-extrabold text-red-600 dark:text-red-400 uppercase tracking-widest block">Isolamento Segregado</span>
              <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                O Sauron OS herda restrições de alta auditoria. Qualquer alteração ou construção nesta tela impacta unicamente relatórios visuais gerados localmente e nunca altera bases lógicas consolidadas no ERP.
              </p>
            </div>

            <div className="p-3 bg-blue-50/40 dark:bg-blue-950/20 border border-blue-150 dark:border-blue-900/40 rounded-xl space-y-1.5">
              <span className="text-[9px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wide block">Tópicos Sincronizados de Atas</span>
              <ul className="list-decimal pl-4 space-y-1 text-[10px] text-slate-500 font-semibold font-serif">
                {localTopics.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

      </div>

      {/* FULL-SCREEN SLIDE DECK INTERACTIVE IFRAME OVERLAY */}
      {isPlayingDeck && (
        <div className="fixed inset-0 bg-slate-950 text-white z-50 flex flex-col justify-between p-6 md:p-12 animate-fade-in font-sans" id="presentation-deck-modal">
          
          {/* Top details */}
          <div className="flex justify-between items-center border-b border-white/10 pb-4 shrink-0">
            <div className="flex items-center gap-2">
              <span className="p-1 px-2.5 bg-blue-650 rounded text-xs uppercase font-extrabold tracking-widest font-mono">SAURON OS CONFIGURABLE</span>
              <span className="text-[10px] text-white/50 uppercase font-black">Lâmina {currentSlide + 1} de {slideDeck.length}</span>
            </div>
            <button
              onClick={() => setIsPlayingDeck(false)}
              className="px-3.5 py-1.5 bg-white/15 hover:bg-white/25 rounded-lg text-[10px] uppercase font-black tracking-widest transition cursor-pointer"
            >
              Fechar Apresentação
            </button>
          </div>

          {/* Slide Content stage wrapper */}
          <div className="flex-1 flex flex-col justify-center max-w-4xl mx-auto w-full py-8 text-center md:text-left">
            
            {/* 1. COVER TYPE */}
            {slideDeck[currentSlide].type === "cover" && (
              <div className="space-y-6 text-center">
                <div className="mx-auto inline-block p-1 bg-gradient-to-r from-blue-500 via-emerald-500 to-amber-500 rounded-full">
                  <div className="bg-slate-950 p-2.5 rounded-full">
                    <Sparkles className="text-amber-400 animate-pulse" size={32} />
                  </div>
                </div>
                <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
                  {slideDeck[currentSlide].title}
                </h1>
                <p className="text-sm md:text-lg text-emerald-450 font-mono font-bold">
                  {slideDeck[currentSlide].subtitle}
                </p>
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl max-w-xl mx-auto text-xs text-white/70 leading-relaxed italic">
                  "{slideDeck[currentSlide].content}"
                </div>
              </div>
            )}

            {/* 2. AGENDA TYPE */}
            {slideDeck[currentSlide].type === "agenda" && (
              <div className="space-y-6">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block mb-1">REUNIÃO ESTRATÉGICA / ATAS</span>
                  <h2 className="text-2xl md:text-4xl font-black uppercase leading-none">{slideDeck[currentSlide].title}</h2>
                  <p className="text-xs text-white/50 mt-1">{slideDeck[currentSlide].content}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  {slideDeck[currentSlide].items?.map((item, idx) => (
                    <div key={idx} className="p-4 bg-white/5 border border-white/5 rounded-xl flex items-start gap-3">
                      <span className="p-1 px-2 text-white bg-blue-600 rounded font-mono font-bold text-xs">{idx + 1}</span>
                      <p className="text-sm font-semibold text-white/95 pt-0.5">{item}</p>
                    </div>
                  ))}
                  {(!slideDeck[currentSlide].items || slideDeck[currentSlide].items.length === 0) && (
                    <p className="text-xs text-white/40 italic">Nenhum tópico de ata listado na pauta do consultor.</p>
                  )}
                </div>
              </div>
            )}

            {/* 3. STATS DECK RENDERING */}
            {slideDeck[currentSlide].type === "stats" && (
              <div className="space-y-6">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 block mb-1">DADOS CONSOLIDADOS BI</span>
                  <h2 className="text-2xl md:text-4xl font-extrabold uppercase leading-none">{slideDeck[currentSlide].title}</h2>
                  <p className="text-xs text-white/55 mt-1">{slideDeck[currentSlide].content}</p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                  <div className="p-5 bg-white/5 border border-white/10 rounded-2xl">
                    <span className="text-[9px] font-bold text-white/50 uppercase block">Faturamento Bruto</span>
                    <span className="text-lg md:text-xl font-mono font-bold text-white block mt-1">
                      {formatCurrency(slideDeck[currentSlide].metrics?.receita || 0)}
                    </span>
                  </div>

                  <div className="p-5 bg-white/5 border border-white/10 rounded-2xl">
                    <span className="text-[9px] font-bold text-white/50 uppercase block">Resultado Líquido</span>
                    <span className="text-lg md:text-xl font-mono font-bold text-emerald-450 block mt-1">
                      {formatCurrency(slideDeck[currentSlide].metrics?.lucro || 0)}
                    </span>
                  </div>

                  <div className="p-5 bg-white/5 border border-white/10 rounded-2xl">
                    <span className="text-[9px] font-bold text-white/50 uppercase block">Margem Média</span>
                    <span className="text-lg md:text-xl font-mono font-bold text-blue-450 block mt-1">
                      {slideDeck[currentSlide].metrics?.margem?.toFixed(1)}%
                    </span>
                  </div>

                  <div className="p-5 bg-white/5 border border-white/10 rounded-2xl">
                    <span className="text-[9px] font-bold text-white/50 uppercase block">Despesa Total</span>
                    <span className="text-lg md:text-xl font-mono font-bold text-amber-500 block mt-1">
                      {formatCurrency(slideDeck[currentSlide].metrics?.despesa || 0)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 4. DIAGNOSTICS DETAILS SLIDE */}
            {slideDeck[currentSlide].type === "diagnostics" && (
              <div className="space-y-6">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 block mb-1">DIAGNÓSTICOS E OBSTÁCULOS</span>
                  <h2 className="text-2xl md:text-4xl font-extrabold uppercase leading-none">{slideDeck[currentSlide].title}</h2>
                  <p className="text-xs text-white/55 mt-1">{slideDeck[currentSlide].content}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pt-1 pr-1">
                  {(slideDeck[currentSlide].items as any[])?.map((item, idx) => (
                    <div key={idx} className="p-4 bg-white/5 border border-white/5 rounded-xl space-y-1">
                      <div className="flex justify-between text-[8px] uppercase tracking-wider font-extrabold text-blue-400">
                        <span>{item.type}</span>
                        <span className="text-white/40">Campo Operacional</span>
                      </div>
                      <h4 className="font-extrabold text-sm text-white">{item.name}</h4>
                      <p className="text-xs text-white/75 leading-relaxed font-serif">"{item.description}"</p>
                    </div>
                  ))}
                  {(!slideDeck[currentSlide].items || (slideDeck[currentSlide].items as any[]).length === 0) && (
                    <div className="col-span-2 text-center p-8 bg-white/5 rounded-xl text-white/40 italic">
                      Nenhum obstáculo ativo registrado na área do consultor para fechar esta pauta de diálogos.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 5. ROADMAP FLOW */}
            {slideDeck[currentSlide].type === "roadmap" && (
              <div className="space-y-6">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 block mb-1">PLANO DE AÇÃO</span>
                  <h2 className="text-2xl md:text-4xl font-extrabold uppercase leading-none">{slideDeck[currentSlide].title}</h2>
                  <p className="text-xs text-white/50 mt-1">{slideDeck[currentSlide].content}</p>
                </div>

                <div className="space-y-3 pt-2">
                  {slideDeck[currentSlide].steps?.map((step) => (
                    <div key={step.order} className="p-4 bg-white/5 hover:bg-white/10 transition-colors border border-white/5 rounded-xl flex items-center gap-4">
                      <span className="p-2 px-3.5 bg-emerald-600/40 text-emerald-400 border border-emerald-500/20 font-black font-mono rounded-lg">
                        {step.order}
                      </span>
                      <p className="text-xs md:text-sm text-white/95 font-medium leading-relaxed">{step.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Footer controllers */}
          <div className="flex justify-between items-center border-t border-white/10 pt-4 shrink-0">
            <span className="text-[9px] text-white/40 font-mono">SAURON CONSULTOR OS SLIDE BUILDER ENG</span>
            
            <div className="flex items-center gap-4">
              <button
                onClick={handlePrevSlide}
                disabled={currentSlide === 0}
                className="p-1.5 px-4 bg-white/10 hover:bg-white/20 rounded-lg disabled:opacity-20 text-[10px] font-extrabold uppercase cursor-pointer"
              >
                Anterior
              </button>
              <button
                onClick={handleNextSlide}
                disabled={currentSlide === slideDeck.length - 1}
                className="p-1.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-20 text-[10px] font-extrabold uppercase cursor-pointer"
              >
                Próximo
              </button>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
