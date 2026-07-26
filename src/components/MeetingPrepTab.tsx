/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 *
 * F14 — Consultant Intelligence Platform & F15.1 Enterprise Consolidation
 * MeetingPrepTab.tsx — Tela de Preparação de Reunião com inteligência consolidada de contexto.
 */

import React, { useState, useEffect, useRef } from "react";
import {
  ClipboardCheck, Sparkles, AlertTriangle, Play, CheckCircle2,
  ListTodo, Plus, Trash2, Calendar, FileText, BadgeCheck, ShieldAlert,
  ArrowUpRight, ArrowDownRight, RefreshCw, BarChart3, CheckSquare, Target, Network, Building
} from "lucide-react";
import { activeDatasetStore } from "../core/data/ActiveDatasetStore";
import { workspaceIntelligenceEngine } from "../core/workspace-intelligence/WorkspaceIntelligenceEngine";
import { meetingPrepService } from "../services/meetingPrepService";
import { MeetingPrepReport, AgendaItem } from "../types/meetingPrep";
import { showToast } from "./Toast";
import { enterpriseRepository, Enterprise, Company, BusinessGroup } from "../core/persistence/EnterpriseRepository";
import { ExecutivePresentationEngine } from "../core/business-intelligence/ExecutivePresentationEngine";
import { getEnterpriseContext, setEnterpriseContext } from "../core/enterprise-consolidation";
import { PLATFORM_EVENTS, subscribePlatformEvent } from "../core/events/PlatformEvents";
import { getDefaultProjectId, listModuleMappings } from "../core/data/moduleMapping";
import { FinancialConsistencyStatus } from "./FinancialConsistencyStatus";
import { platformLogger } from "../core/platform/PlatformLogger";
import { certifiedMetricSnapshotStore } from "../core/financial-consistency";

interface MeetingPrepTabProps {
  onSelectTab: (tab: string) => void;
}

export const MeetingPrepTab: React.FC<MeetingPrepTabProps> = ({ onSelectTab }) => {
  const [activeDataset, setActiveDataset] = useState(activeDatasetStore.getActiveDataset());
  const [previewRows, setPreviewRows] = useState<any[]>(() => activeDatasetStore.getActiveRows());
  const workspace = workspaceIntelligenceEngine.getCurrentIntelligentWorkspace();
  
  const [context, setContext] = useState(getEnterpriseContext());
  const [report, setReport] = useState<MeetingPrepReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [presentation, setPresentation] = useState<any>(null);
  const loadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const presentationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Agenda State
  const [agenda, setAgenda] = useState<AgendaItem[]>([]);
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [selectedPriority, setSelectedPriority] = useState<"high" | "medium" | "low">("medium");

  const loadData = async () => {
    setIsLoading(true);
    try {
      const activeCtx = getEnterpriseContext();
      setContext(activeCtx);

      const rep = await meetingPrepService.generateReport({
        activeDataset,
        activeRecords: previewRows,
        workspace,
        // Structural workbook analysis is intentionally deferred from the
        // navigation path; BI values remain real and the UI stays responsive.
        skipStructuralAnalysis: true,
      });
      setReport(rep);

      const ents = await enterpriseRepository.getAll();
      setEnterprises(ents);

      if (presentationTimerRef.current) clearTimeout(presentationTimerRef.current);
      setPresentation(null);
      if (activeDataset && previewRows.length > 0) {
        const datasetForPresentation = activeDataset;
        const recordsForPresentation = previewRows;
        const workspaceForPresentation = workspace;
        presentationTimerRef.current = setTimeout(async () => {
          const presEngine = new ExecutivePresentationEngine();
          const pres = await presEngine.generatePresentation({
            activeDataset: datasetForPresentation,
            allRows: recordsForPresentation,
            workspace: workspaceForPresentation as any,
            moduleMappings: listModuleMappings(datasetForPresentation.datasetId, getDefaultProjectId(datasetForPresentation)),
            allowActiveDatasetPreviewFallback: true,
          });
          setPresentation(pres);
        }, 750);
      }
    } catch (e) {
      showToast("error", "Erro ao processar dados de preparação.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribeDataset = activeDatasetStore.subscribe(() => {
      setActiveDataset(activeDatasetStore.getActiveDataset());
      setPreviewRows(activeDatasetStore.getActiveRows());
    });
    const scheduleLoad = () => {
      if (loadTimerRef.current) clearTimeout(loadTimerRef.current);
      loadTimerRef.current = setTimeout(() => {
        void loadData();
      }, 750);
    };

    scheduleLoad();

    const handleContextEvent = scheduleLoad;
    const unsubscribe = subscribePlatformEvent(PLATFORM_EVENTS.ENTERPRISE_CONTEXT_CHANGED, handleContextEvent);
    return () => {
      unsubscribe();
      unsubscribeDataset();
      if (loadTimerRef.current) clearTimeout(loadTimerRef.current);
      if (presentationTimerRef.current) clearTimeout(presentationTimerRef.current);
    };
  }, [activeDataset, previewRows]);

  // Load / Sync Agenda
  useEffect(() => {
    if (!report) return;

    try {
      const saved = localStorage.getItem(`sauron_agenda_${workspace?.id || "default"}`);
      if (saved) {
        setAgenda(JSON.parse(saved));
      } else {
        const initialAgenda: AgendaItem[] = report.suggestedTopics.map((topic, index) => ({
          id: topic.id,
          title: topic.title,
          source: "suggested",
          origin: topic.origin,
          discussed: false,
          priority: topic.priority,
          order: index
        }));
        setAgenda(initialAgenda);
        localStorage.setItem(`sauron_agenda_${workspace?.id || "default"}`, JSON.stringify(initialAgenda));
      }
    } catch (e) {
      platformLogger.warn("Não foi possível carregar a agenda salva.", e);
    }
  }, [report, workspace?.id]);

  const saveAgenda = (updated: AgendaItem[]) => {
    setAgenda(updated);
    try {
      localStorage.setItem(`sauron_agenda_${workspace?.id || "default"}`, JSON.stringify(updated));
    } catch (e) {}
  };

  const handleAddManualTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicTitle.trim()) return;

    const newItem: AgendaItem = {
      id: `manual_${Date.now()}`,
      title: newTopicTitle.trim(),
      source: "manual",
      discussed: false,
      priority: selectedPriority,
      order: agenda.length
    };

    const next = [...agenda, newItem];
    saveAgenda(next);
    setNewTopicTitle("");
    showToast("success", "Tópico adicionado à agenda da reunião.");
  };

  const handleToggleDiscussed = (id: string) => {
    const next = agenda.map(item =>
      item.id === id ? { ...item, discussed: !item.discussed } : item
    );
    saveAgenda(next);
  };

  const handleRemoveTopic = (id: string) => {
    const next = agenda.filter(item => item.id !== id);
    saveAgenda(next);
  };

  const handleSaveSnapshot = () => {
    if (!report || report.status === "no_data") return;

    try {
      if (report.certifiedSnapshot) {
        const snapshot = certifiedMetricSnapshotStore.save(report.certifiedSnapshot);
        localStorage.setItem("sauron_last_meeting_snapshot", snapshot.snapshotId);
        showToast("success", `Snapshot do período ${report.context.period} salvo com os dados conferidos.`);
        return;
      }

      const snapshot = {
        savedAt: new Date().toISOString(),
        dataSource: report.context.dataSource,
        period: report.context.period,
        metrics: report.radarDimensions.reduce((acc, curr) => {
          acc[curr.id] = curr.rawValue;
          return acc;
        }, {} as Record<string, number | null>)
      };

      localStorage.setItem(`sauron_snapshot_${workspace?.id || "default"}_${report.context.period}`, JSON.stringify(snapshot));
      localStorage.setItem("sauron_last_meeting_snapshot", Date.now().toString());
      showToast("success", `Snapshot do período ${report.context.period} salvo com sucesso!`);
    } catch (e) {
      showToast("error", "Erro ao salvar snapshot.");
    }
  };

  const setPrepScope = (scope: "GROUP" | "COMPANY") => {
    const nextContext = { ...context, scope };
    if (scope === "GROUP") {
      nextContext.companyId = undefined;
      nextContext.unitId = undefined;
    } else {
      const firstCompany = enterprises.find(e => e.type === "Empresa") as Company;
      nextContext.companyId = firstCompany?.id;
      nextContext.unitId = undefined;
    }
    setEnterpriseContext(nextContext);
    showToast("info", `Escopo de preparação alterado para: ${scope}`);
  };

  // Checklist Calculations
  const hasEnterprise = enterprises.length > 0;
  const hasData = !!activeDataset && activeDataset.rowCount > 0;
  const hasSegment = enterprises.some(e => e.segment && e.segment !== "");
  const hasMapping = !!activeDataset && activeDataset.columnProfiles && activeDataset.columnProfiles.length > 0;
  const hasPresentation = !!presentation && presentation.status === "ready";
  
  let hasActionPlan = false;
  try { hasActionPlan = !!localStorage.getItem("sauron_plan_created"); } catch(e) {}

  const checklistItems = [
    { label: "Empresa Cadastrada", done: hasEnterprise },
    { label: "Planilha Importada", done: hasData },
    { label: "Mapeamento DRE ativo", done: hasMapping },
    { label: "Resumo Executivo pronto", done: hasPresentation },
    { label: "Plano de Ações vinculado", done: hasActionPlan }
  ];

  const doneCount = checklistItems.filter(i => i.done).length;
  const checklistPercent = Math.round((doneCount / checklistItems.length) * 100);

  // Filter companies in scope
  const companiesInScope = enterprises.filter(e => {
    if (context.scope === "GROUP") return e.type === "Empresa" && e.parentId === context.groupId;
    return e.id === context.companyId;
  });

  const companiesWithData = companiesInScope.filter(c => (c as any).workbookIds?.length > 0);
  const companiesWithoutData = companiesInScope.filter(c => !((c as any).workbookIds?.length > 0));

  if (isLoading || !report) {
    return (
      <div className="flex flex-col items-center justify-center p-24 text-slate-500 space-y-3 font-sans">
        <RefreshCw className="animate-spin text-blue-500" size={32} />
        <p className="text-xs font-bold uppercase tracking-wider">Carregando Inteligência de Preparação...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 font-sans text-slate-800 dark:text-slate-100" id="meeting-prep-tab">
      
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <ClipboardCheck size={160} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 text-left">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest bg-blue-600/30 text-blue-400 rounded-full border border-blue-500/20">
                Preparação Analítica: {context.scope}
              </span>
              <span className="text-[10px] font-bold text-slate-400">
                Última atualização: {new Date(report.generatedAt).toLocaleTimeString()}
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight">Preparação da Reunião</h1>
            <p className="text-xs text-slate-400 max-w-xl">
              Consolidação de prioridades e pauta comercial respeitando o contexto corporativo de {report.context.enterpriseName}.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <button
              onClick={() => setPrepScope(context.scope === "GROUP" ? "COMPANY" : "GROUP")}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-755 border border-slate-705 text-white rounded-xl text-xs font-extrabold uppercase transition-all cursor-pointer shadow-sm"
            >
              {context.scope === "GROUP" ? "Preparar Individual" : "Preparar Grupo"}
            </button>
            <button
              onClick={handleSaveSnapshot}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-850 hover:bg-slate-800 border border-slate-700 text-white rounded-xl text-xs font-extrabold uppercase transition-all cursor-pointer shadow-sm"
            >
              Salvar Snapshot
            </button>
            <button
              onClick={() => onSelectTab("modo_reuniao")}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold uppercase transition-all cursor-pointer shadow-md"
            >
              <Play size={12} fill="currentColor" /> Iniciar Reunião
            </button>
          </div>
        </div>

        {/* Status bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t border-slate-850/60 text-left">
          <div>
            <span className="text-[9px] font-black text-slate-500 uppercase block tracking-wider">Escopo</span>
            <span className="text-xs font-bold text-slate-200">{context.scope === "GROUP" ? "Consolidado do Grupo" : "Empresa Individual"}</span>
          </div>
          <div>
            <span className="text-[9px] font-black text-slate-500 uppercase block tracking-wider">Empresas no Escopo</span>
            <span className="text-xs font-bold text-slate-200">{companiesInScope.length} cadastradas</span>
          </div>
          <div>
            <span className="text-[9px] font-black text-slate-500 uppercase block tracking-wider">Período de Dados</span>
            <span className="text-xs font-bold text-slate-200">{report.context.period}</span>
          </div>
          <div>
            <span className="text-[9px] font-black text-slate-500 uppercase block tracking-wider">Lançamentos</span>
            <span className="text-xs font-bold text-slate-200">{report.context.rowCount} registros</span>
          </div>
        </div>
      </div>

      {presentation?.consistency && <FinancialConsistencyStatus consistency={presentation.consistency} />}

      {report.status === "no_data" ? (
        <div className="bg-amber-50/10 border border-amber-200/50 p-8 rounded-2xl text-center space-y-3">
          <AlertTriangle className="text-amber-500 w-10 h-10 mx-auto" />
          <h3 className="text-sm font-black uppercase text-amber-800 dark:text-amber-450">Dados Insuficientes</h3>
          <p className="text-xs text-slate-650 dark:text-slate-400 max-w-md mx-auto">
            Por favor, realize a importação de planilhas financeiras para carregar os relatórios de preparação da reunião.
          </p>
        </div>
      ) : (
        <>
          {/* Hierarchical Scope Panel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-5 rounded-2xl shadow-xs space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-500" /> Empresas com Dados Disponíveis ({companiesWithData.length})
              </h3>
              <div className="flex flex-wrap gap-2 pt-1">
                {companiesWithData.map(c => (
                  <span key={c.id} className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-emerald-500/10">
                    <Building size={10} /> {c.name}
                  </span>
                ))}
                {companiesWithData.length === 0 && <span className="text-[10px] text-slate-450">Nenhuma empresa com dados associados.</span>}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-5 rounded-2xl shadow-xs space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
                <AlertTriangle size={13} className="text-amber-500 animate-pulse" /> Empresas Pendentes de Dados ({companiesWithoutData.length})
              </h3>
              <div className="flex flex-wrap gap-2 pt-1">
                {companiesWithoutData.map(c => (
                  <span key={c.id} className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-bold px-2.5 py-1 rounded-lg">
                    <Building size={10} /> {c.name}
                  </span>
                ))}
                {companiesWithoutData.length === 0 && <span className="text-[10px] text-slate-450">Todas as empresas possuem dados.</span>}
              </div>
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left/Middle Column */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Resumo Executivo */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl shadow-sm text-left">
                <div className="flex items-center gap-2 border-b border-slate-150 dark:border-slate-800 pb-3 mb-4">
                  <Sparkles size={16} className="text-blue-500 animate-pulse" />
                  <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white">Resumo Executivo (30s)</h2>
                </div>
                
                <div className="space-y-3.5">
                  {report.summary30s.map(line => (
                    <div key={line.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850">
                      <span className={`text-[10px] mt-0.5 shrink-0 px-1.5 py-0.5 rounded font-black uppercase ${
                        line.type === "positive" ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400" :
                        line.type === "negative" ? "bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-455" :
                        line.type === "warning" ? "bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-455" :
                        "bg-slate-200 dark:bg-slate-800 text-slate-650 dark:text-slate-400"
                      }`}>
                        {line.type === "positive" ? "Fato" : line.type === "negative" ? "Aviso" : line.type === "warning" ? "Alerta" : "Info"}
                      </span>
                      <div className="flex-1 space-y-1">
                        <p className="text-xs font-semibold leading-relaxed text-slate-700 dark:text-slate-300">
                          {line.text}
                        </p>
                        <div className="flex items-center gap-1 text-[8px] font-bold text-slate-450 font-mono tracking-tight uppercase">
                          <span>Origem:</span>
                          <span className="text-blue-500">{line.lineage}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Radar Executivo */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl shadow-sm text-left">
                <div className="flex items-center gap-2 border-b border-slate-150 dark:border-slate-800 pb-3 mb-4">
                  <Target size={16} className="text-emerald-500" />
                  <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white">Radar Executivo</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {report.radarDimensions.map(d => (
                    <div key={d.id} className="p-4 rounded-xl border border-slate-150 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-450">{d.label}</span>
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                          d.status === "ok" ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-455" :
                          d.status === "attention" ? "bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-455" :
                          d.status === "critical" ? "bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-455" :
                          "bg-slate-200 dark:bg-slate-800 text-slate-500"
                        }`}>
                          {d.status === "ok" ? "Estável" : d.status === "attention" ? "Alerta" : d.status === "critical" ? "Crítico" : "Sem Dados"}
                        </span>
                      </div>
                      
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-black tracking-tight text-slate-850 dark:text-slate-100">
                          {d.displayValue || "N/A"}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 font-mono">
                          (Confiança: {d.confidence}%)
                        </span>
                      </div>

                      <div className="text-[8px] font-bold text-slate-450 dark:text-slate-550 border-t border-slate-100 dark:border-slate-850/60 pt-1.5 flex flex-col gap-0.5">
                        <div className="truncate font-mono">
                          <span className="uppercase text-[7px] text-slate-500 mr-1 font-sans">Origem:</span>
                          <span className="text-blue-500">{d.lineage}</span>
                        </div>
                        {d.warnings.length > 0 && (
                          <div className="text-rose-500 flex items-center gap-0.5 font-sans">
                            <AlertTriangle size={8} /> {d.warnings[0]}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mudanças */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl shadow-sm text-left">
                <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-800 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 size={16} className="text-purple-500" />
                    <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white">Mudanças vs Período Anterior</h2>
                  </div>
                </div>

                {report.changes.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">
                    Importe períodos múltiplos para comparar variações operacionais.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {report.changes.map(c => (
                      <div key={c.id} className="p-4 rounded-xl border border-slate-155 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-450">{c.label}</span>
                          <p className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                            {c.currentValue ? `R$ ${(c.currentValue / 1000).toFixed(0)}k` : "N/D"}
                          </p>
                          <div className="text-[8px] font-mono text-slate-450 truncate max-w-[200px]">
                            <span className="text-blue-500">{c.lineage}</span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end">
                          <div className={`flex items-center gap-1 text-xs font-black ${
                            c.direction === "stable" ? "text-slate-500" :
                            c.isPositiveChange ? "text-emerald-600 dark:text-emerald-450" : "text-rose-600 dark:text-rose-455"
                          }`}>
                            {c.direction === "up" ? <ArrowUpRight size={14} /> : c.direction === "down" ? <ArrowDownRight size={14} /> : null}
                            <span>{c.changePercent || "Estável"}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Right Column */}
            <div className="space-y-6">
              
              {/* Agenda */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl shadow-sm text-left">
                <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-800 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <ListTodo size={16} className="text-blue-500" />
                    <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white">Agenda da Reunião</h2>
                  </div>
                  <span className="text-[9px] font-black uppercase bg-slate-100 dark:bg-slate-950 px-2 py-0.5 rounded text-slate-500">
                    {agenda.filter(i => i.discussed).length} de {agenda.length}
                  </span>
                </div>

                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                  {agenda.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">Adicione tópicos à pauta.</p>
                  ) : (
                    agenda.sort((a,b) => a.order - b.order).map(item => (
                      <div key={item.id} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-105 dark:border-slate-850 hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-all gap-2">
                        <div className="flex items-start gap-2 flex-1">
                          <input
                            type="checkbox"
                            checked={item.discussed}
                            onChange={() => handleToggleDiscussed(item.id)}
                            className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                          <div className="space-y-0.5">
                            <p className={`text-xs font-bold leading-tight ${item.discussed ? "line-through text-slate-400 dark:text-slate-550" : "text-slate-800 dark:text-slate-200"}`}>
                              {item.title}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleRemoveTopic(item.id)}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-rose-500 hover:text-rose-600 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleAddTopic} className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-850 space-y-2">
                  <input
                    type="text"
                    placeholder="Novo tópico..."
                    value={newTopicTitle}
                    onChange={e => setNewTopicTitle(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white"
                  />
                  <button
                    type="submit"
                    className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus size={12} /> Adicionar Tópico
                  </button>
                </form>
              </div>

              {/* Sugestões de Tópicos */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl shadow-sm text-left">
                <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-800 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <BadgeCheck size={16} className="text-emerald-500 animate-pulse" />
                    <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white">Sugestões de Tópicos</h2>
                  </div>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {report.suggestedTopics.map(topic => (
                    <div
                      key={topic.id}
                      onClick={() => {
                        if (agenda.some(i => i.id === topic.id)) return;
                        const next = [...agenda, {
                          id: topic.id,
                          title: topic.title,
                          source: "suggested" as const,
                          origin: topic.origin,
                          discussed: false,
                          priority: topic.priority,
                          order: agenda.length
                        }];
                        saveAgenda(next);
                        showToast("success", "Tópico adicionado à agenda.");
                      }}
                      className="p-3 rounded-xl border border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20 hover:border-blue-400 dark:hover:border-blue-700 transition-all cursor-pointer space-y-1 text-left relative overflow-hidden group"
                    >
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{topic.title}</h4>
                      <p className="text-[10px] text-slate-500 leading-relaxed">{topic.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Checklist de Prontidão */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl shadow-sm text-left">
                <div className="flex items-center gap-2 border-b border-slate-150 dark:border-slate-800 pb-3 mb-4">
                  <CheckSquare size={16} className="text-blue-500" />
                  <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white">Prontidão Executiva</h2>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-black uppercase">
                      <span className="text-slate-450">Itens Consolidados</span>
                      <span className="text-blue-500">{checklistPercent}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all duration-500"
                        style={{ width: `${checklistPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    {checklistItems.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="text-slate-650 dark:text-slate-400 font-semibold">{item.label}</span>
                        <span className={`text-[10px] font-bold ${item.done ? "text-emerald-500" : "text-amber-500"}`}>
                          {item.done ? "✔ Pronto" : "○ Pendente"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>

          </div>
        </>
      )}

      {report.globalWarnings.length > 0 && (
        <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-4 rounded-2xl text-left">
          <ul className="list-disc pl-4 space-y-1">
            {report.globalWarnings.map((w, idx) => (
              <li key={idx} className="text-[9px] font-semibold text-slate-500">
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}

    </div>
  );

  function handleAddTopic(e: React.FormEvent) {
    handleAddManualTopic(e);
  }
};
