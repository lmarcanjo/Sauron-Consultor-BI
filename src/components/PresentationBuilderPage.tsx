import React, { useState, useMemo } from 'react';
import { 
  Presentation, Layers, Eye, EyeOff, Copy, Trash2, Settings, Play, Plus, 
  BookMarked, ChevronLeft, ChevronRight, Download, PlusCircle, CheckSquare, 
  HelpCircle, Sparkles, TrendingUp, DollarSign, PieChart as PieIcon, LayoutGrid, 
  Bookmark, Briefcase, FileText, CheckCircle, Lightbulb, Clock, User
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell 
} from 'recharts';
import { LancamentoFinanceiro } from '../types';

interface PresentationBuilderPageProps {
  dataOrigem: LancamentoFinanceiro[];
  filteredData: LancamentoFinanceiro[];
  metrics?: any;
  formatCurrency?: (v: number) => string;
}

interface SlideConfig {
  id: string;
  title: string;
  subtitle: string;
  type: 'cover' | 'dre' | 'ranking' | 'category' | 'checklist';
  visible: boolean;
  notes: string;
  categoryFilter?: string;
  empresaFilter?: string;
}

export const PresentationBuilderPage: React.FC<PresentationBuilderPageProps> = ({
  dataOrigem = [],
  filteredData = [],
  metrics,
  formatCurrency = (v: number) => "R$ " + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}) => {
  
  // 1. Initial Slide deck config (Start empty and generate dynamically from active metrics)
  const [slides, setSlides] = useState<SlideConfig[]>([]);

  React.useEffect(() => {
    if (slides.length === 0) {
      setSlides([
        { 
          id: 's1', 
          title: 'Fechamento de Resultados & Planejamento BI', 
          subtitle: 'Sauron OS — Consultoria de Alta Performance', 
          type: 'cover', 
          visible: true, 
          notes: 'Iniciar apresentação dando boas vindas aos investidores e diretores da holding. Destacar que todas as fontes foram mapeadas via VPN.' 
        },
        { 
          id: 's2', 
          title: 'DRE Consolidada e Evolução das Margens', 
          subtitle: `Faturamento Consolidado: R$ ${(metrics?.totalReceita || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`, 
          type: 'dre', 
          visible: true, 
          notes: 'Aponte o volume total de Receita Bruta. Destaque se houve variações no CMV ou despesas administrativas.' 
        },
        { 
          id: 's3', 
          title: 'Ranking de Faturamento por Filial', 
          subtitle: 'Desempenho comparativo das marcas e CNPJs', 
          type: 'ranking', 
          visible: true, 
          notes: 'Análise de share interno. Mostre qual filial lidera faturamentos e qual necessita de ajustes de giro ou estoque de passagem.' 
        },
        { 
          id: 's4', 
          title: 'Composição de Custos por Categoria', 
          subtitle: 'Matriz estendida de Plano de Contas', 
          type: 'category', 
          visible: true, 
          notes: 'Visualização macro das despesas ordinárias e plano de contas. Identificar gargalos de custos operacionais.' 
        },
        { 
          id: 's5', 
          title: 'Plano de Metas & Plano de Ação', 
          subtitle: 'Próximas metas operacionais definidas', 
          type: 'checklist', 
          visible: true, 
          notes: 'Sinalizar metas contábeis para o próximo ciclo de DRE, incluindo diminuição de despesas gerais.' 
        },
      ]);
    }
  }, [slides.length, metrics]);

  const [selectedSlideId, setSelectedSlideId] = useState<string>('s1');
  const [activeMode, setActiveMode] = useState<'builder' | 'meeting'>('builder');
  const [currentMeetingIndex, setCurrentMeetingIndex] = useState<number>(0);

  // Retrieve client profile dynamically from localStorage
  const dynamicClientName = useMemo(() => {
    try {
      const saved = localStorage.getItem("sauron_client_profile");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.name) {
          return parsed.name;
        }
      }
    } catch (e) {}
    return "Holding Consolidada";
  }, []);

  // Meeting notes and tasks
  const [meetingActionTasks, setMeetingActionTasks] = useState<string[]>([]);
  const [newActionTask, setNewActionTask] = useState<string>("");

  const selectedSlide = (slides.find(s => s.id === selectedSlideId) || slides[0] || { id: 's1', title: 'Carregando...', subtitle: '', type: 'cover', visible: true, notes: '' }) as SlideConfig;

  // 2. Real-Time Data aggregates for chart preview
  const chartDataDRE = useMemo(() => {
    // Group raw rows by Month
    const group: Record<string, { name: string; Receita: number; Custo: number; Lucro: number }> = {};
    const source = filteredData.length > 0 ? filteredData : dataOrigem;

    source.forEach(row => {
      const mes = row.Mês || "Total";
      if (!group[mes]) {
        group[mes] = { name: mes, Receita: 0, Custo: 0, Lucro: 0 };
      }
      group[mes].Receita += row.Receita || 0;
      group[mes].Custo += row.Custo || 0;
      group[mes].Lucro += row.Lucro || 0;
    });

    return Object.values(group).sort((a,b) => a.name.localeCompare(b.name)).slice(0, 8);
  }, [dataOrigem, filteredData]);

  const chartDataRanking = useMemo(() => {
    // Group faturamento by Empresa
    const group: Record<string, number> = {};
    const source = filteredData.length > 0 ? filteredData : dataOrigem;

    source.forEach(row => {
      const emp = row.Empresa || "Geral";
      group[emp] = (group[emp] || 0) + (row.Receita || 0);
    });

    return Object.entries(group)
      .map(([name, val]) => ({ name, Faturamento: Math.round(val) }))
      .sort((a, b) => b.Faturamento - a.Faturamento)
      .slice(0, 6);
  }, [dataOrigem, filteredData]);

  const chartDataCategory = useMemo(() => {
    // Share of cost by category
    const group: Record<string, number> = {};
    const source = filteredData.length > 0 ? filteredData : dataOrigem;

    source.forEach(row => {
      const cat = row.Categoria || "Operacional";
      group[cat] = (group[cat] || 0) + (row.Custo + row.Despesa);
    });

    const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
    return Object.entries(group)
      .map(([name, value], idx) => ({ 
        name, 
        value: Math.round(value),
        color: COLORS[idx % COLORS.length]
      }))
      .filter(item => item.value > 0)
      .sort((a,b) => b.value - a.value)
      .slice(0, 5);
  }, [dataOrigem, filteredData]);

  const slideFilters = useMemo(() => {
    const list = dataOrigem.length > 0 ? dataOrigem : [];
    const empresas = Array.from(new Set(list.map(r => r.Empresa))).filter(Boolean);
    const categorias = Array.from(new Set(list.map(r => r.Categoria))).filter(Boolean);
    return { empresas, categorias };
  }, [dataOrigem]);

  // Slide mutations
  const toggleSlideVisibility = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSlides(slides.map(s => s.id === id ? { ...s, visible: !s.visible } : s));
  };

  const deleteSlide = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (slides.length <= 1) return;
    const filtered = slides.filter(s => s.id !== id);
    setSlides(filtered);
    if (selectedSlideId === id) setSelectedSlideId(filtered[0].id);
  };

  const addSlideFromLibrary = (type: 'cover' | 'dre' | 'ranking' | 'category' | 'checklist', title: string) => {
    const newSlide: SlideConfig = {
      id: "slide_" + crypto.randomUUID().substring(0, 8),
      title,
      subtitle: 'Visão corporativa sob demanda',
      type,
      visible: true,
      notes: `Consultor: Adicione as considerações contábeis sobre este slide.`
    };
    setSlides([...slides, newSlide]);
    setSelectedSlideId(newSlide.id);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActionTask.trim()) return;
    setMeetingActionTasks([...meetingActionTasks, newActionTask.trim()]);
    setNewActionTask("");
  };

  const handleExportAta = () => {
    const profileSaved = localStorage.getItem("sauron_client_profile");
    const clientName = profileSaved ? JSON.parse(profileSaved).name : "Cliente Sauron OS";
    const consultant = profileSaved ? JSON.parse(profileSaved).consultant : "Consultor Responsável";

    const content = `
========================================
ATA DE REUNIÃO DE RESULTADOS - SAURON OS
========================================
Cliente: ${clientName}
Consultor: ${consultant}
Data: ${new Date().toLocaleDateString('pt-BR')}
Hora: ${new Date().toLocaleTimeString('pt-BR')}

TAREFAS E PLANOS DE AÇÃO DELIBERADOS:
${meetingActionTasks.map((t, idx) => `[ ] ${idx + 1}. ${t}`).join('\n')}

----------------------------------------
Sauron OS - Inteligência BI de Alta Performance
    `;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ata_reuniao_${clientName.toLowerCase().replace(/\s+/g, '_')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Precomputed metrics inside slides
  const totalReceita = useMemo(() => {
    return (filteredData.length > 0 ? filteredData : dataOrigem).reduce((sum, r) => sum + (r.Receita || 0), 0);
  }, [dataOrigem, filteredData]);

  const totalLucro = useMemo(() => {
    return (filteredData.length > 0 ? filteredData : dataOrigem).reduce((sum, r) => sum + (r.Lucro || 0), 0);
  }, [dataOrigem, filteredData]);

  const currentMeetingSlide = slides.filter(s => s.visible)[currentMeetingIndex];

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] font-sans animate-fade-in text-slate-850 dark:text-slate-100" id="presentations-master-page">
      
      {/* 2. MODE: BUILDER (Standard Designer page) */}
      {activeMode === 'builder' ? (
        <div className="flex flex-col h-full gap-4">
          
          {/* Header row */}
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm min-h-[70px]">
            <div>
              <h2 className="text-base font-black uppercase tracking-tight flex items-center gap-2">
                <Presentation className="text-blue-600 animate-pulse" size={18} />
                Módulo Unificado de Apresentações Executivas
              </h2>
              <p className="text-slate-400 text-xs mt-0.5">Monte decks estratégicos interativos alimentados diretamente pela base de dados consolidada do cliente.</p>
            </div>
            <button
              onClick={() => {
                const visibleIdx = slides.findIndex(s => s.visible);
                if (visibleIdx !== -1) {
                  setCurrentMeetingIndex(visibleIdx);
                  setActiveMode('meeting');
                } else {
                  alert("Habilite ao menos um slide para iniciar a apresentação.");
                }
              }}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl flex items-center gap-2 shadow-md cursor-pointer hover:scale-[1.03] transition-all"
            >
              <Play size={14} className="fill-white" />
              Iniciar Modo Reunião
            </button>
          </div>

          {/* 3-Column Studio Workspace */}
          <div className="flex-1 flex flex-col md:flex-row min-h-0 gap-4">
            
            {/* COLUMN 1: Miniatures Sidebar */}
            <div className="w-full md:w-64 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 flex flex-col gap-2 overflow-y-auto shrink-0 shadow-sm">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 px-1 flex justify-between items-center">
                <span>Slides Ativos ({slides.length})</span>
                <Layers size={13} />
              </span>

              <div className="flex flex-col gap-2.5">
                {slides.map((s, idx) => {
                  const isSelected = s.id === selectedSlideId;
                  return (
                    <div
                      key={s.id}
                      onClick={() => setSelectedSlideId(s.id)}
                      className={`group p-3 rounded-xl border-2 transition-all cursor-pointer relative overflow-hidden ${
                        isSelected 
                          ? "border-blue-600 bg-white dark:bg-slate-950 shadow-md transform scale-[1.01]" 
                          : "border-slate-150 dark:border-slate-850 hover:border-slate-300 dark:hover:border-slate-700 bg-white/70 dark:bg-slate-950/60"
                      } ${!s.visible ? "opacity-45" : ""}`}
                    >
                      <div className="flex justify-between items-center mb-1.5 z-10 relative">
                        <span className="text-[9px] font-mono font-black text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        
                        <div className="flex items-center gap-0.5 opacity-100 md:opacity-60 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => toggleSlideVisibility(s.id, e)}
                            className="p-1 hover:bg-slate-55 dark:hover:bg-slate-800 rounded text-slate-500"
                            title="Toggle Visibility"
                          >
                            {s.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                          </button>
                          <button 
                            onClick={(e) => deleteSlide(s.id, e)}
                            className="p-1 hover:text-red-500 hover:bg-slate-55 dark:hover:bg-slate-800 rounded text-slate-500"
                            title="Deletar Slide"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      <p className="font-extrabold text-[11px] text-slate-800 dark:text-slate-100 truncate pr-4">{s.title}</p>
                      <p className="text-[8px] font-black uppercase tracking-wider text-slate-400 mt-0.5 font-mono">{s.type}</p>
                    </div>
                  );
                })}
              </div>

              {/* AUTOMATIC GRAPHICS LIBRARY (Biblioteca de Gráficos) */}
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-850 space-y-2">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block px-1">Biblioteca de Gráficos (Sauron BI)</span>
                
                <button
                  onClick={() => addSlideFromLibrary('dre', 'DRE de Custos e Lançamentos')}
                  className="w-full text-left p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-blue-500 rounded-xl flex items-center gap-2 text-[11px] font-semibold transition-colors"
                >
                  <PlusCircle size={13} className="text-blue-500 shrink-0" />
                  <span>Novo Faturamento Mensal</span>
                </button>

                <button
                  onClick={() => addSlideFromLibrary('ranking', 'Ranking Comparativo de Share')}
                  className="w-full text-left p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-blue-500 rounded-xl flex items-center gap-2 text-[11px] font-semibold transition-colors"
                >
                  <PlusCircle size={13} className="text-blue-500 shrink-0" />
                  <span>Novo Ranking Comercial</span>
                </button>

                <button
                  onClick={() => addSlideFromLibrary('category', 'Distribuição DRE de Custos')}
                  className="w-full text-left p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-blue-500 rounded-xl flex items-center gap-2 text-[11px] font-semibold transition-colors"
                >
                  <PlusCircle size={13} className="text-blue-500 shrink-0" />
                  <span>Novo Gráfico de Categoria</span>
                </button>
              </div>

            </div>

            {/* COLUMN 2: Slide Studio Preview Screen */}
            <div className="flex-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col justify-between p-6 overflow-y-auto relative min-h-[300px]">
              
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest absolute top-4 left-6">
                Preview Canvas do Slide Ativo
              </div>

              {selectedSlide ? (
                <div className="my-auto flex flex-col items-center justify-center w-full">
                  <div className="bg-white dark:bg-slate-950 w-full max-w-2xl aspect-[16/9] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden text-left">
                    
                    <div className="absolute top-0 right-0 p-12 opacity-[0.02]">
                      <Presentation size={140} />
                    </div>

                    <div className="space-y-1.5 z-10">
                      <p className="text-[9px] font-mono font-black uppercase text-blue-500 tracking-widest mb-1">
                        Sauron Presenter — {selectedSlide.type?.toUpperCase()} Lâmina
                      </p>
                      <h3 className="text-xl font-black text-slate-850 dark:text-white uppercase leading-tight">
                        {selectedSlide.title || "Lâmina Sem Título"}
                      </h3>
                      <p className="text-slate-400 text-xs font-semibold">{selectedSlide.subtitle}</p>
                    </div>

                    {/* DYNAMIC CHART RENDER BASED ON TYPE */}
                    <div className="flex-1 h-36 mt-4 mb-2 min-h-0 flex items-center justify-center font-mono text-xs z-10">
                      
                      {selectedSlide.type === 'cover' && (
                        <div className="text-center space-y-4">
                          <BookMarked size={48} className="text-blue-600 dark:text-blue-400 mx-auto animate-bounce" strokeWidth={1} />
                          <div>
                            <div className="text-[9px] bg-blue-100/50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-black px-2 py-0.5 rounded uppercase tracking-wider inline-block">
                              Sessão de Resultados BI
                            </div>
                            <p className="text-[10px] text-slate-400 mt-2 font-semibold">{dynamicClientName}</p>
                          </div>
                        </div>
                      )}

                      {selectedSlide.type === 'dre' && (
                        chartDataDRE.length === 0 ? (
                          <div className="text-slate-450 italic text-center text-[10px]">Aguardando conexões de faturamento reais...</div>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartDataDRE}>
                              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                              <XAxis dataKey="name" fontSize={9} />
                              <YAxis fontSize={9} tickFormatter={(v) => v > 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                              <Bar dataKey="Receita" fill="#2563EB" radius={[4, 4, 0, 0]} />
                              <Bar dataKey="Lucro" fill="#10B981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        )
                      )}

                      {selectedSlide.type === 'ranking' && (
                        chartDataRanking.length === 0 ? (
                          <div className="text-slate-450 italic text-center text-[10px]">Conecte dados ativos para calcular o share corporativo.</div>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartDataRanking} layout="vertical">
                              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                              <XAxis type="number" fontSize={9} />
                              <YAxis dataKey="name" type="category" fontSize={9} width={80} />
                              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                              <Bar dataKey="Faturamento" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        )
                      )}

                      {selectedSlide.type === 'category' && (
                        chartDataCategory.length === 0 ? (
                          <div className="text-slate-450 italic text-[10px]">Sem despesas mapeadas na base cadastrada.</div>
                        ) : (
                          <div className="flex items-center w-full gap-4 px-2">
                            <div className="w-1/2 h-full min-h-0">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={chartDataCategory}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={25}
                                    outerRadius={38}
                                    paddingAngle={3}
                                    dataKey="value"
                                  >
                                    {chartDataCategory.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                  </Pie>
                                  <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                            <div className="w-1/2 space-y-1 text-[9px] font-semibold">
                              {chartDataCategory.slice(0, 4).map((entry, idx) => (
                                <p key={idx} className="flex items-center gap-1.5 truncate">
                                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }}></span>
                                  <span className="text-slate-600 dark:text-slate-400 truncate">{entry.name}:</span>
                                  <strong className="text-slate-800 dark:text-white font-mono">{formatCurrency(entry.value)}</strong>
                                </p>
                              ))}
                            </div>
                          </div>
                        )
                      )}

                      {selectedSlide.type === 'checklist' && (
                        <div className="w-full max-w-md bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-3 rounded-xl scale-90 text-[10px] space-y-2 text-left text-slate-700 dark:text-slate-300">
                          <p className="font-extrabold uppercase text-[9px] text-slate-400">Prancheta Administrativa do Consultor</p>
                          <p className="flex items-center gap-1.5"><CheckSquare size={12} className="text-blue-500 shrink-0" /> Revisar markup de vendas seminovas de concessionários</p>
                          <p className="flex items-center gap-1.5"><CheckSquare size={12} className="text-blue-500 shrink-0" /> Auditar custos tributários CNPJ Fiat</p>
                          <p className="flex items-center gap-1.5"><CheckSquare size={12} className="text-blue-500 shrink-0" /> Travar comissões de entrada de veículos recebidos</p>
                        </div>
                      )}

                    </div>

                    {/* Metadata dynamic footer footer */}
                    <div className="flex justify-between items-center text-[9px] text-slate-300 border-t border-slate-100 dark:border-slate-800/80 pt-3 z-10">
                      <div className="flex items-center gap-2 font-mono">
                        <span>Receita: <strong className="text-slate-400 font-bold">{formatCurrency(totalReceita)}</strong></span>
                        <span className="text-slate-200">|</span>
                        <span>Lucro: <strong className="text-emerald-500 font-bold">{formatCurrency(totalLucro)}</strong></span>
                      </div>
                      <span>{dynamicClientName}</span>
                    </div>

                  </div>
                </div>
              ) : (
                <div className="text-center py-20 text-slate-400 font-medium my-auto text-xs">Crie ou habilite um slide para editar.</div>
              )}

              <div className="h-[2px]"></div>

            </div>

            {/* COLUMN 3: Slide Config Settings & custom filters */}
            <div className="w-full md:w-80 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 overflow-y-auto shrink-0 shadow-sm space-y-5 text-xs">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5 border-b border-slate-50 dark:border-slate-800 pb-2.5">
                <Settings size={13} /> Parâmetros do Slide Selecionado
              </span>

              {selectedSlide ? (
                <div className="space-y-4">
                  
                  {/* Title */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Título do Slide</label>
                    <input 
                      type="text" 
                      value={selectedSlide.title}
                      onChange={(e) => {
                        setSlides(slides.map(s => s.id === selectedSlide.id ? { ...s, title: e.target.value } : s));
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold focus:outline-none"
                    />
                  </div>

                  {/* Subtitle */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Subtítulo Estratégico</label>
                    <input 
                      type="text" 
                      value={selectedSlide.subtitle}
                      onChange={(e) => {
                        setSlides(slides.map(s => s.id === selectedSlide.id ? { ...s, subtitle: e.target.value } : s));
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                    />
                  </div>

                  {/* Context Slide level custom filter */}
                  <div className="space-y-2 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200/60 dark:border-slate-805">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Filtro de Contexto (Slide-Lock)</span>
                    <p className="text-[10px] text-slate-405 leading-relaxed">Fixe um filtro definitivo neste slide que se sobrepõe automaticamente aos seletores gerais durante a reunião.</p>
                    
                    <div className="space-y-1.5 mt-2">
                      <select
                        value={selectedSlide.empresaFilter || ""}
                        onChange={(e) => {
                          setSlides(slides.map(s => s.id === selectedSlide.id ? { ...s, empresaFilter: e.target.value } : s));
                        }}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-[11px]"
                      >
                        <option value="">-- Ignorar Filtro de Empresa --</option>
                        {slideFilters.empresas.map(emp => (
                          <option key={emp} value={emp}>{emp}</option>
                        ))}
                      </select>

                      <select
                        value={selectedSlide.categoryFilter || ""}
                        onChange={(e) => {
                          setSlides(slides.map(s => s.id === selectedSlide.id ? { ...s, categoryFilter: e.target.value } : s));
                        }}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-[11px]"
                      >
                        <option value="">-- Ignorar Filtro de Categoria --</option>
                        {slideFilters.categorias.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Private consultant advice notes */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Anotações Privadas do Consultor</label>
                    <textarea 
                      value={selectedSlide.notes}
                      onChange={(e) => {
                        setSlides(slides.map(s => s.id === selectedSlide.id ? { ...s, notes: e.target.value } : s));
                      }}
                      rows={5}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 font-serif text-[11px] leading-relaxed resize-none focus:outline-none"
                    />
                  </div>

                  {/* Clone duplication button */}
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        const cloned: SlideConfig = {
                          ...selectedSlide,
                          id: "slide_" + crypto.randomUUID().substring(0, 8),
                          title: selectedSlide.title + " (Cópia)"
                        };
                        setSlides([...slides, cloned]);
                      }}
                      className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-[10px] uppercase rounded-xl cursor-pointer text-center"
                    >
                      Duplicar esta Lâmina (Clone)
                    </button>
                  </div>

                </div>
              ) : (
                <div className="text-slate-400 italic text-center py-10">Escolha uma lâmina para editar suas propriedades corporativas.</div>
              )}

            </div>

          </div>

        </div>
      ) : (
        
        // 4. MODE: MEETING (Corporate Immersive Meeting layout with Live notes and Ata recorder)
        <div className="flex-1 flex flex-col min-h-0 bg-slate-950 text-white rounded-3xl p-5 shadow-2xl overflow-hidden animate-fade-in relative">
          
          {/* Immersive Toolbar */}
          <div className="flex justify-between items-center pb-4 border-b border-slate-900 shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
              <h2 className="text-base font-black uppercase tracking-wider text-white">Sauron OS — Modo Reunião Integrado</h2>
            </div>
            
            <div className="flex gap-2.5">
              <button
                onClick={handleExportAta}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-black text-[10px] uppercase tracking-wide rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download size={12} />
                Exportar Ata de Reunião
              </button>
              
              <button
                onClick={() => setActiveMode('builder')}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-[10px] uppercase tracking-wide rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
              >
                Encerrar Modo Reunião
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col lg:flex-row min-h-0 mt-5 gap-5">
            
            {/* Left Box: Fullscreen-style Slide Presentation Canvas */}
            <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between items-center relative min-h-[300px]">
              
              <div className="absolute top-4 right-6 flex items-center gap-2 text-[10px] font-mono text-slate-500">
                <span>SLIDE {currentMeetingIndex + 1} DE {slides.filter(s => s.visible).length}</span>
              </div>

              {currentMeetingSlide ? (
                <div className="my-auto flex flex-col items-center justify-center w-full max-w-2xl text-left bg-slate-950/80 p-8 border border-slate-850 rounded-2xl shadow-inner relative overflow-hidden transition-all">
                  
                  <div className="space-y-1.5">
                    <p className="text-[9px] font-mono font-black uppercase text-blue-400 tracking-widest mb-1">
                      Sauron Presenter — Lâmina de Relatório
                    </p>
                    <h1 className="text-2xl font-black text-white leading-tight uppercase">
                      {currentMeetingSlide.title}
                    </h1>
                    <p className="text-slate-450 text-xs font-semibold">{currentMeetingSlide.subtitle}</p>
                  </div>

                  {/* CHART WRAPPER OR RECHARTS GRID */}
                  <div className="h-44 w-full mt-6 mb-4 flex items-center justify-center text-xs font-mono text-slate-400">
                    
                    {currentMeetingSlide.type === 'cover' && (
                      <div className="text-center space-y-3">
                        <BookMarked size={48} className="text-white mx-auto animate-bounce" strokeWidth={1} />
                        <div>
                          <div className="text-[9px] bg-blue-600/30 text-blue-300 font-black px-2.5 py-0.5 rounded uppercase inline-block">
                            {dynamicClientName.toUpperCase()}
                          </div>
                          <p className="text-[10px] text-slate-500 mt-2 font-medium">Lennon Marcanjo — Consultor Especialista</p>
                        </div>
                      </div>
                    )}

                    {currentMeetingSlide.type === 'dre' && (
                      chartDataDRE.length === 0 ? (
                        <p className="italic">Nenhum dado financeiro processável.</p>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartDataDRE}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.10} />
                            <XAxis dataKey="name" fontSize={9} stroke="#64748B" />
                            <YAxis fontSize={9} stroke="#64748B" tickFormatter={(v) => v > 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                            <Bar dataKey="Receita" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Lucro" fill="#10B981" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      )
                    )}

                    {currentMeetingSlide.type === 'ranking' && (
                      chartDataRanking.length === 0 ? (
                        <p className="italic">Gire filtros do consultor...</p>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartDataRanking} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" opacity={0.10} />
                            <XAxis type="number" fontSize={8} stroke="#64748B" />
                            <YAxis dataKey="name" type="category" fontSize={8} width={80} stroke="#64748B" />
                            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                            <Bar dataKey="Faturamento" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      )
                    )}

                    {currentMeetingSlide.type === 'category' && (
                      chartDataCategory.length === 0 ? (
                        <p className="italic">Base vazia.</p>
                      ) : (
                        <div className="flex items-center w-full gap-4 px-2">
                          <div className="w-1/2 h-full min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={chartDataCategory}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={25}
                                  outerRadius={38}
                                  paddingAngle={3}
                                  dataKey="value"
                                >
                                  {chartDataCategory.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="w-1/2 space-y-1 text-[9px] font-semibold text-slate-300">
                            {chartDataCategory.slice(0, 4).map((entry, idx) => (
                              <p key={idx} className="flex items-center gap-1.5 truncate">
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }}></span>
                                <span className="text-slate-400 truncate">{entry.name}:</span>
                                <strong className="text-white font-mono">{formatCurrency(entry.value)}</strong>
                              </p>
                            ))}
                          </div>
                        </div>
                      )
                    )}

                    {currentMeetingSlide.type === 'checklist' && (
                      <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-3 rounded-xl scale-95 text-[10px] space-y-2 text-left text-slate-350">
                        <p className="font-extrabold uppercase text-[9px] text-slate-500">Próximos Passos & Responsabilidades</p>
                        <p className="flex items-center gap-1.5"><CheckSquare size={12} className="text-blue-400 shrink-0" /> Monitoramento contínuo de custos de peças de giro</p>
                        <p className="flex items-center gap-1.5"><CheckSquare size={12} className="text-blue-400 shrink-0" /> Auditoria tributária no CNPJ Fiat e Jeep</p>
                        <p className="flex items-center gap-1.5"><CheckSquare size={12} className="text-blue-400 shrink-0" /> Execução de testes de conexão de faturamento read-only</p>
                      </div>
                    )}

                  </div>

                </div>
              ) : (
                <div className="font-medium text-slate-500 my-auto text-xs">Exibição concluída.</div>
              )}

              {/* Navigation Arrows Row */}
              <div className="flex gap-4 shrink-0 mt-4 z-10">
                <button
                  onClick={() => setCurrentMeetingIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentMeetingIndex === 0}
                  className="bg-slate-800 border border-slate-700 text-white p-3 rounded-full hover:bg-slate-700 transition disabled:opacity-30 cursor-pointer shadow-lg"
                >
                  <ChevronLeft size={22} className="stroke-[2.5]" />
                </button>
                <button
                  onClick={() => setCurrentMeetingIndex(prev => Math.min(slides.filter(s => s.visible).length - 1, prev + 1))}
                  disabled={currentMeetingIndex === slides.filter(s => s.visible).length - 1}
                  className="bg-slate-800 border border-slate-700 text-white p-3 rounded-full hover:bg-slate-700 transition disabled:opacity-30 cursor-pointer shadow-lg"
                >
                  <ChevronRight size={22} className="stroke-[2.5]" />
                </button>
              </div>

            </div>

            {/* Right Box: Immersive Meeting Note & action points */}
            <div className="w-full lg:w-85 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shrink-0 shadow-lg text-xs gap-4 overflow-y-auto">
              
              {/* consultant notes private card */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Lightbulb size={15} className="text-amber-400 shrink-0" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-350">Instruções de Apresentação</span>
                </div>
                
                <p className="text-[11px] leading-relaxed text-slate-300 italic bg-slate-950/80 border border-slate-850 p-3 rounded-xl shadow-inner whitespace-pre-line">
                  {currentMeetingSlide?.notes || "Demonstre os faturamentos consolidados da holding."}
                </p>

                <div className="bg-slate-950/50 border border-slate-850/60 p-3 rounded-xl flex gap-2 text-[10px] text-slate-400 leading-relaxed font-semibold">
                  <Sparkles size={14} className="text-blue-400 shrink-0 mt-0.5" />
                  <span>
                    Dica Sauron: Ofereça foco em comparar o Lucro Bruto do mês contra o custo operacional fixo de concessionárias do grupo.
                  </span>
                </div>
              </div>

              {/* Action minutes points (Ata) */}
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Inscrever Deliberações (Ata da Reunião)</span>
                
                <form onSubmit={handleAddTask} className="flex gap-2">
                  <input
                    type="text"
                    value={newActionTask}
                    onChange={(e) => setNewActionTask(e.target.value)}
                    placeholder="Ex: João vai revisar precificação..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white placeholder-slate-600 outline-none text-[11px]"
                  />
                  <button type="submit" className="px-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-lg font-mono text-[10px] uppercase cursor-pointer">
                    Add
                  </button>
                </form>

                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {meetingActionTasks.map((task, idx) => (
                    <div key={idx} className="bg-slate-955 p-2 rounded-lg border border-slate-850 text-[10px] text-slate-300 flex justify-between items-center gap-1">
                      <span className="truncate">{task}</span>
                      <button 
                        onClick={() => setMeetingActionTasks(meetingActionTasks.filter((_, i) => i !== idx))}
                        className="text-slate-500 hover:text-red-400 p-0.5 rounded transition-colors"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
};
