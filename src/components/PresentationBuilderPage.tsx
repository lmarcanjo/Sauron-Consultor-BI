/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Presentation, Layers, Eye, EyeOff, Trash2, Settings, Play, PlusCircle, CheckSquare, 
  BookMarked, ChevronLeft, ChevronRight, Download, Sparkles, Lightbulb
} from 'lucide-react';
import { LancamentoFinanceiro } from '../types';
import { activeDatasetStore } from "../core/data/ActiveDatasetStore";
import { Enterprise, enterpriseRepository } from "../core/persistence/EnterpriseRepository";
import { workspaceIntelligenceEngine } from "../core/workspace-intelligence";
import { ExecutivePresentation } from "../core/business-intelligence/ExecutivePresentationEngine";
import type { PresentationSlide } from "../core/business-intelligence/ExecutivePresentationEngine";
import { FinancialConsistencyStatus } from "./FinancialConsistencyStatus";
import { executiveDeliverablesService } from "../core/executive-deliverables";
import { identityEngine } from "../core/identity/IdentityEngine";

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
  type: string;
  visible: boolean;
  notes: string;
  content: any;
}

export const PresentationBuilderPage: React.FC<PresentationBuilderPageProps> = ({
  dataOrigem: _dataOrigem = [],
  filteredData: _filteredData = [],
  formatCurrency: _formatCurrency = (v: number) => "R$ " + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}) => {
  const activeDataset = activeDatasetStore.getActiveDataset();
  
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [selectedEnterpriseId, setSelectedEnterpriseId] = useState<string>("");
  const [presentation, setPresentation] = useState<ExecutivePresentation | null>(null);
  const [slides, setSlides] = useState<SlideConfig[]>([]);
  const [selectedSlideId, setSelectedSlideId] = useState<string>('');
  const [activeMode, setActiveMode] = useState<'builder' | 'meeting'>('builder');
  const [currentMeetingIndex, setCurrentMeetingIndex] = useState<number>(0);
  const [meetingActionTasks, setMeetingActionTasks] = useState<string[]>([]);
  const [newActionTask, setNewActionTask] = useState<string>("");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Load available enterprises
  useEffect(() => {
    enterpriseRepository.getAll().then(list => {
      setEnterprises(list);
      const ws = workspaceIntelligenceEngine.getCurrentIntelligentWorkspace();
      if (ws?.enterpriseId) {
        setSelectedEnterpriseId(ws.enterpriseId);
      } else if (list.length > 0) {
        setSelectedEnterpriseId(list[0].id);
      }
    });
  }, []);

  // The builder edits the persisted MVP-3 composition. It never reads all rows.
  useEffect(() => {
    let mounted = true;
    if (!activeDataset) {
      setPresentation(null);
      setSlides([]);
      return () => { mounted = false; };
    }
    void executiveDeliverablesService.loadActiveArtifact(activeDataset, identityEngine.getCurrentUser()).then(async result => {
      if (!mounted || !result.artifact) {
        if (mounted) { setPresentation(null); setSlides([]); }
        return;
      }
      const composed = await executiveDeliverablesService.ensurePresentation(result.artifact, identityEngine.getCurrentUser());
      if (!mounted) return;
      const res = composed.presentation;
      setPresentation(res);
      const mappedSlides = res.slides.map(slide => ({
        id: slide.id,
        title: slide.title,
        subtitle: slide.subtitle,
        type: slide.type,
        visible: true,
        notes: slide.content.summary || slide.content.points?.join("\n") || slide.content.lineage || "",
        content: slide.content
      }));
      setSlides(mappedSlides);
      setSelectedSlideId(mappedSlides[0]?.id || "");
    }).catch(() => {
      if (mounted) { setPresentation(null); setSlides([]); }
    });
    return () => { mounted = false; };
  }, [activeDataset?.datasetId, activeDataset?.importedAt]);

  const selectedSlide = slides.find(s => s.id === selectedSlideId) || slides[0] || null;

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActionTask.trim()) return;
    setMeetingActionTasks([...meetingActionTasks, newActionTask.trim()]);
    setNewActionTask("");
  };

  const handleExportAta = () => {
    const content = `
========================================
ATA DE REUNIÃO DE RESULTADOS - SAURON OS
========================================
Escopo: ${presentation?.targetType || "Empresa"} — ${presentation?.targetName || "Consolidada"}
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
    link.download = `ata_reuniao_${(presentation?.targetName || "consultoria").toLowerCase().replace(/\s+/g, '_')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSavePresentation = async () => {
    if (!presentation) return;
    try {
      const persistedSlides: PresentationSlide[] = slides.map(slide => ({
        id: slide.id,
        title: slide.title,
        subtitle: slide.subtitle,
        type: slide.type as PresentationSlide["type"],
        content: slide.content,
      }));
      const updated = await executiveDeliverablesService.persistEditedPresentation(presentation.id, persistedSlides, identityEngine.getCurrentUser());
      setPresentation(updated);
      setSaveMessage("Edição salva. A próxima exportação usará esta versão.");
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : "Não foi possível salvar a edição.");
    }
  };

  const renderSlideContent = (slide: SlideConfig) => {
    const content = slide.content || {};
    
    switch (slide.type) {
      case 'cover':
        return (
          <div className="text-center space-y-4">
            <BookMarked size={48} className="text-blue-600 dark:text-blue-400 mx-auto animate-bounce" strokeWidth={1} />
            <div>
              <div className="text-[9px] bg-blue-100/50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-black px-2 py-0.5 rounded uppercase tracking-wider inline-block">
                Sessão de Resultados BI
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-350 mt-3 font-semibold">{content.summary}</p>
            </div>
          </div>
        );

      case 'executive_summary':
        return (
          <div className="w-full text-left space-y-3 px-4">
            <p className="text-xs text-slate-750 dark:text-slate-300 font-semibold leading-relaxed">{content.summary}</p>
            {content.points && (
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {content.points.map((p: string, i: number) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            )}
          </div>
        );

      case 'main_indicators':
        return (
          <div className="w-full grid grid-cols-2 gap-3 px-4">
            {content.metrics?.map((m: any, i: number) => (
              <div key={i} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-center">
                <span className="text-[9px] uppercase font-bold text-slate-450 dark:text-slate-400 block tracking-wider">{m.label}</span>
                <span className="text-sm font-black text-slate-900 dark:text-white mt-1 block">{m.value}</span>
              </div>
            ))}
          </div>
        );

      case 'attention_points':
      case 'opportunities':
      case 'risks':
      case 'pending':
      case 'recommendations':
      case 'comparatives':
        return (
          <div className="w-full text-left px-4">
            {content.points && (
              <ul className="list-disc pl-4 space-y-1.5 text-xs text-slate-700 dark:text-slate-300 font-semibold">
                {content.points.map((p: string, i: number) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            )}
          </div>
        );

      case 'financial_data':
        return (
          <div className="w-full max-w-md mx-auto overflow-hidden border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-slate-50 dark:bg-slate-950/40 text-slate-450 uppercase font-black tracking-wider">
                <tr>
                  <th className="p-2">Categoria</th>
                  <th className="p-2 text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {content.data?.map((row: any, i: number) => (
                  <tr key={i} className="border-t border-slate-100 dark:border-slate-850">
                    <td className="p-2 font-bold text-slate-750 dark:text-slate-300">{row.categoria}</td>
                    <td className={`p-2 text-right font-mono font-bold ${row.valor < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                      {row.valor < 0 ? `- R$ ${Math.abs(row.valor).toLocaleString('pt-BR')}` : `R$ ${row.valor.toLocaleString('pt-BR')}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'next_steps':
        return (
          <div className="w-full max-w-md mx-auto space-y-2 px-4 text-xs">
            {content.checklist?.map((item: string, i: number) => (
              <p key={i} className="flex items-center gap-2 text-slate-750 dark:text-slate-300 font-semibold">
                <CheckSquare size={13} className="text-blue-500 shrink-0" />
                {item}
              </p>
            ))}
          </div>
        );

      case 'data_lineage':
        return (
          <div className="w-full text-center px-6 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-[11px] font-mono text-slate-500 leading-relaxed max-w-md mx-auto">
            {content.lineage}
          </div>
        );

      default:
        return <div className="text-slate-450 italic text-[11px]">Tipo de slide desconhecido.</div>;
    }
  };

  if (!presentation || presentation.status === "insufficient_data") {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-4 max-w-xl mx-auto my-12 shadow-sm font-sans animate-fade-in" data-testid="presentation-empty">
        <Presentation className="text-emerald-500 w-12 h-12 animate-pulse" />
        <h3 className="text-base font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">Nenhuma apresentação executiva disponível</h3>
        <p className="text-sm font-extrabold text-slate-700 dark:text-slate-300">
          Execute a análise da fonte para gerar uma apresentação executiva com os materiais disponíveis.
        </p>
      </div>
    );
  }

  const currentMeetingSlide = slides.filter(s => s.visible)[currentMeetingIndex];

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] font-sans animate-fade-in text-slate-850 dark:text-slate-100" id="presentations-master-page" data-testid="presentation-editor">
      
      {activeMode === 'builder' ? (
        <div className="flex flex-col h-full gap-4">
          
          {/* Header row */}
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm min-h-[70px]">
            <div>
              <h2 className="text-base font-black uppercase tracking-tight flex items-center gap-2">
                <Presentation className="text-blue-600 animate-pulse" size={18} />
                Módulo Unificado de Apresentações Executivas
              </h2>
              <p className="text-slate-450 text-xs mt-0.5">Monte decks estratégicos alimentados diretamente por dados do cliente.</p>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1 text-xs">
                <span className="text-[10px] font-black uppercase text-slate-400 mr-2">Escopo:</span>
                <select
                  value={selectedEnterpriseId}
                  onChange={(e) => setSelectedEnterpriseId(e.target.value)}
                  className="bg-transparent border-0 font-bold outline-none text-xs"
                >
                  <option value="">Apresentação Consolidada</option>
                  {enterprises.map(ent => (
                    <option key={ent.id} value={ent.id}>{ent.name} ({ent.type})</option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-100 font-extrabold text-[10px] uppercase tracking-wider rounded-xl cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <Download size={13} />
                Exportar / Imprimir
              </button>

              <button
                type="button"
                onClick={handleSavePresentation}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl cursor-pointer transition-colors flex items-center gap-1.5"
                data-testid="save-presentation-edits"
              >
                <CheckSquare size={13} />
                Salvar edição
              </button>

              <button
                onClick={() => {
                  setCurrentMeetingIndex(0);
                  setActiveMode('meeting');
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <Play size={13} />
                Modo Reunião
              </button>
            </div>
          </div>

          {presentation.consistency && <FinancialConsistencyStatus consistency={presentation.consistency} />}
          {saveMessage && <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300" role="status" data-testid="presentation-save-status">{saveMessage}</p>}

          <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0 overflow-hidden">
            
            {/* COLUMN 1: Slide List */}
            <div className="w-full md:w-72 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 overflow-y-auto shrink-0 shadow-sm space-y-4">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5 border-b border-slate-50 dark:border-slate-800 pb-2.5">
                <Layers size={13} /> Lâminas da Apresentação
              </span>

              <div className="space-y-1.5 max-h-[calc(100vh-280px)] overflow-y-auto pr-1" data-testid="presentation-slides">
                {slides.map((s, idx) => (
                  <div
                    key={s.id}
                    onClick={() => setSelectedSlideId(s.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex justify-between items-center gap-2 group ${
                      selectedSlideId === s.id
                        ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-550 dark:border-blue-800/80 shadow-sm'
                        : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/40'
                    }`}
                  >
                    <div className="truncate flex items-center gap-2">
                      <span className="text-[10px] font-bold font-mono text-slate-400 shrink-0">#{idx + 1}</span>
                      <div className="truncate">
                        <p className={`text-xs font-bold truncate ${selectedSlideId === s.id ? 'text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-slate-200'}`}>
                          {s.title}
                        </p>
                        <p className="text-[9px] text-slate-450 truncate font-semibold mt-0.5">{s.subtitle}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSlides(slides.map(item => item.id === s.id ? { ...item, visible: !item.visible } : item));
                        }}
                        className="text-slate-400 hover:text-slate-650 dark:hover:text-white p-0.5 rounded"
                      >
                        {s.visible ? <Eye size={12} /> : <EyeOff size={12} className="text-rose-500" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* COLUMN 2: Slide Preview Screen */}
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

                    <div className="flex-1 h-36 mt-4 mb-2 min-h-0 flex items-center justify-center font-mono text-xs z-10">
                      {renderSlideContent(selectedSlide)}
                    </div>

                    <div className="flex justify-between items-center text-[9px] text-slate-350 border-t border-slate-100 dark:border-slate-800/80 pt-3 z-10">
                      <span>Origem dos dados em tempo real</span>
                      <span>Sauron Platform</span>
                    </div>

                  </div>
                </div>
              ) : (
                <div className="text-center py-20 text-slate-400 font-medium my-auto text-xs">Selecione um slide para visualizar.</div>
              )}
            </div>

            {/* COLUMN 3: Slide Config Settings */}
            <div className="w-full md:w-80 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 overflow-y-auto shrink-0 shadow-sm space-y-5 text-xs">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5 border-b border-slate-50 dark:border-slate-800 pb-2.5">
                <Settings size={13} /> Parâmetros do Slide Selecionado
              </span>

              {selectedSlide ? (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label htmlFor="presentation-slide-title" className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Título do Slide</label>
                    <input 
                      id="presentation-slide-title"
                      type="text" 
                      value={selectedSlide.title}
                      onChange={(e) => {
                        setSlides(slides.map(s => s.id === selectedSlide.id ? { ...s, title: e.target.value } : s));
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="presentation-slide-subtitle" className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Subtítulo Estratégico</label>
                    <input 
                      id="presentation-slide-subtitle"
                      type="text" 
                      value={selectedSlide.subtitle}
                      onChange={(e) => {
                        setSlides(slides.map(s => s.id === selectedSlide.id ? { ...s, subtitle: e.target.value } : s));
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="presentation-slide-notes" className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Notas do Slide</label>
                    <textarea 
                      id="presentation-slide-notes"
                      value={selectedSlide.notes}
                      onChange={(e) => {
                        setSlides(slides.map(s => s.id === selectedSlide.id ? { ...s, notes: e.target.value } : s));
                      }}
                      rows={5}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 font-serif text-[11px] leading-relaxed resize-none focus:outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-slate-450 italic text-center py-10">Escolha uma lâmina para editar suas propriedades.</div>
              )}
            </div>

          </div>

        </div>
      ) : (
        
        // MEETING MODE
        <div className="flex-1 flex flex-col min-h-0 bg-slate-950 text-white rounded-3xl p-5 shadow-2xl overflow-hidden animate-fade-in relative">
          
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
                    <p className="text-slate-455 text-xs font-semibold">{currentMeetingSlide.subtitle}</p>
                  </div>

                  <div className="h-44 w-full mt-6 mb-4 flex items-center justify-center text-xs font-mono text-slate-350">
                    {renderSlideContent(currentMeetingSlide)}
                  </div>

                </div>
              ) : (
                <div className="font-medium text-slate-500 my-auto text-xs">Exibição concluída.</div>
              )}

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

            <div className="w-full lg:w-85 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shrink-0 shadow-lg text-xs gap-4 overflow-y-auto">
              
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Lightbulb size={15} className="text-amber-400 shrink-0" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-350">Instruções de Apresentação</span>
                </div>
                
                <p className="text-[11px] leading-relaxed text-slate-300 italic bg-slate-950/80 border border-slate-850 p-3 rounded-xl shadow-inner whitespace-pre-line">
                  {currentMeetingSlide?.notes || "Demonstre os resultados reais consolidados."}
                </p>

                <div className="bg-slate-955 border border-slate-850/60 p-3 rounded-xl flex gap-2 text-[10px] text-slate-400 leading-relaxed font-semibold">
                  <Sparkles size={14} className="text-blue-400 shrink-0 mt-0.5" />
                  <span>
                    Dica Sauron: Utilize a ata abaixo para registrar os planos de ação e responsabilidades do comitê corporativo.
                  </span>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-800">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Inscrever Deliberações (Ata da Reunião)</span>
                
                <form onSubmit={handleAddTask} className="flex gap-2">
                  <input
                    type="text"
                    value={newActionTask}
                    onChange={(e) => setNewActionTask(e.target.value)}
                    placeholder="Ex: Definir comitê de custos..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white placeholder-slate-650 outline-none text-[11px]"
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

      {/* Hidden printable presentation container */}
      <div id="sauron-printable-presentation" className="hidden">
        {slides.filter(s => s.visible).map((s, idx) => (
          <div key={s.id} className="print-slide-page border border-slate-300 p-8 rounded-2xl flex flex-col justify-between my-4 aspect-[16/9] text-left bg-white text-black">
            <div>
              <p className="text-[10px] font-mono font-bold text-slate-550 uppercase tracking-widest mb-1">
                Lâmina {idx + 1} de {slides.filter(s => s.visible).length}
              </p>
              <h2 className="text-xl font-bold uppercase text-slate-900 border-b pb-2 mb-2">{s.title}</h2>
              <p className="text-xs text-slate-600 font-semibold">{s.subtitle}</p>
              <div className="mt-4 py-2 font-serif text-sm">
                {renderSlideContent(s)}
              </div>
            </div>
            <div className="text-[10px] text-slate-400 border-t pt-2 flex justify-between">
              <span>Sauron Platform — Roteiro Consultivo Real</span>
              <span>{new Date().toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
        ))}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        #sauron-printable-presentation {
          display: none;
        }
        @media print {
          body * {
            visibility: hidden !important;
          }
          #sauron-printable-presentation, #sauron-printable-presentation * {
            visibility: visible !important;
          }
          #sauron-printable-presentation {
            display: block !important;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print-slide-page {
            page-break-after: always;
            break-after: page;
            margin: 0 !important;
            padding: 2.5rem !important;
            height: 98vh;
            border: none !important;
          }
        }
      `}} />

    </div>
  );
};
