import React, { useMemo, useState, useEffect } from "react";
import { AlertCircle, ArrowRight, ShieldAlert, Sparkles, TrendingDown, HelpCircle, CheckCircle, Calendar, MapPin, DollarSign, RefreshCw } from "lucide-react";
import { LancamentoFinanceiro } from "../types";
import { dataSourceManager } from "../services/dataSourceManager";
import { activeDatasetStore } from "../core/data/ActiveDatasetStore";
import { platformLogger } from "../core/platform/PlatformLogger";

interface DiagnosticoObstaculosTabProps {
  dataOrigem: LancamentoFinanceiro[];
  formatCurrency: (v: number) => string;
}

export const DiagnosticoObstaculosTab: React.FC<DiagnosticoObstaculosTabProps> = ({
  dataOrigem,
  formatCurrency
}) => {
  const [selectedImpactLevel, setSelectedImpactLevel] = useState<"alto" | "critico" | "todos">("todos");

  const activeDataset = activeDatasetStore.getActiveDataset();
  
  useEffect(() => {
    if (activeDataset) {
      platformLogger.info(`[Sauron Instrumentation] DIAGNOSTICO_RECEIVED_ACTIVE_DATASET - datasetId: ${activeDataset.datasetId}, sourceName: ${activeDataset.sourceName}, rowCount: ${activeDataset.rowCount}, columnCount: ${activeDataset.columnCount}, sourceType: ${activeDataset.sourceType}`);
    } else {
      platformLogger.info(`[Sauron Instrumentation] DIAGNOSTICO_RECEIVED_ACTIVE_DATASET - datasetId: null, sourceName: null, rowCount: 0, columnCount: 0, sourceType: null`);
    }
  }, [activeDataset]);

  const isPendingConfiguration = useMemo(() => {
    if (!activeDataset) return false;
    if (dataSourceManager.getActiveSource() !== "SPREADSHEET_DATA") return false;
    if (activeDataset && activeDataset.columnProfiles) {
      // Diagnostico requires KPIs or DREs to detect anomalies
      const hasDiagnosticoCol = activeDataset.columnProfiles.some((p: any) => p.isKPI || p.isDRE);
      return !hasDiagnosticoCol;
    }
    return true; // if no profiles, pending
  }, [activeDataset]);

  if (!activeDataset) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-4 max-w-xl mx-auto my-12 shadow-sm font-sans">
        <ShieldAlert className="text-slate-400 w-12 h-12" />
        <h3 className="text-base font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">Nenhuma fonte de dados ativa.</h3>
        <p className="text-sm font-extrabold text-slate-700 dark:text-slate-300">
          Importe uma planilha real para visualizar diagnósticos.
        </p>
      </div>
    );
  }

  if (isPendingConfiguration) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-4 max-w-xl mx-auto my-12 shadow-sm font-sans">
        <ShieldAlert className="text-emerald-500 w-12 h-12 animate-pulse" />
        <h3 className="text-base font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">Configuração Pendente</h3>
        <p className="text-sm font-extrabold text-slate-700 dark:text-slate-300">
          Fonte de dados ativa. Configure os campos deste módulo para gerar análises.
        </p>
      </div>
    );
  }

  // This legacy surface no longer invents obstacles. Certified metrics must be
  // supplied by the Business Intelligence and Dashboard engines first.
  const obstaculos: Array<{ id: string; severity: "alto" | "critico"; title: string; what: string; where: string; when: string; reason: string; impact: number; cause: string; recommendation: string }> = [];

  const filtrados = useMemo(() => {
    if (selectedImpactLevel === "todos") return obstaculos;
    return obstaculos.filter(o => o.severity === selectedImpactLevel);
  }, [obstaculos, selectedImpactLevel]);

  if (filtrados.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-4 max-w-xl mx-auto my-12 shadow-sm font-sans">
        <ShieldAlert className="text-amber-500 w-12 h-12" />
        <h3 className="text-base font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">Configuração pendente</h3>
        <p className="text-sm font-extrabold text-slate-700 dark:text-slate-300">
          Há uma fonte de dados ativa, mas faltam informações financeiras e operacionais. Revise os campos para gerar diagnósticos.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-sans text-slate-800 dark:text-slate-150 animate-fade-in" id="diagnostico-obstaculos-view">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2 mb-2">
            <AlertCircle size={15} className="text-red-500 animate-bounce" />
            <span>Diagnóstico Clínico de Obstáculos Corporativos</span>
          </h3>
          <p className="text-[10px] text-slate-500 leading-relaxed max-w-2xl">
            Sauron audita continuamente seus dados em busca de gargalos ocultos. Abaixo estão listados os incidentes corporativos ativos que requerem ação imediata para reverter estagnações de fluxos de caixa e comissionamento.
          </p>
        </div>

        {/* Filter level selector */}
        <div className="flex bg-slate-100 dark:bg-slate-950/80 border border-slate-205 dark:border-slate-800 rounded p-0.5 items-center shrink-0">
          {[
            { id: "todos", label: "Exibir Todos" },
            { id: "critico", label: "Causas Críticas ⚡️" },
            { id: "alto", label: "Desvios Altos" }
          ].map((op) => (
            <button
              key={op.id}
              onClick={() => setSelectedImpactLevel(op.id as any)}
              className={`px-3 py-1 font-bold text-[9px] uppercase rounded transition-all cursor-pointer ${
                selectedImpactLevel === op.id
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-extrabold"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
              }`}
            >
              {op.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of issues foldered */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtrados.map((o) => (
          <div 
            key={o.id}
            className={`border rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between bg-white dark:bg-slate-900 transition-all ${
              o.severity === "critico"
                ? "border-red-200 hover:border-red-400/80 dark:border-red-955"
                : "border-slate-200 hover:border-slate-400 dark:border-slate-800"
            }`}
          >
            {/* Header issue card */}
            <div className={`p-4 ${o.severity === "critico" ? "bg-red-500/5" : "bg-slate-500/5"} border-b border-slate-100 dark:border-slate-805`}>
              <div className="flex justify-between items-start mb-2">
                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase font-mono tracking-wider ${
                  o.severity === "critico" ? "bg-red-100 text-red-800 dark:bg-red-955" : "bg-amber-100 text-amber-800 dark:bg-amber-955"
                }`}>
                  {o.severity === "critico" ? "⚠️ CRÍTICO" : "⚡️ IMPORTANTE"}
                </span>
                <span className="text-[10px] font-mono font-bold text-red-650 dark:text-red-400 flex items-center gap-0.5">
                  -{formatCurrency(o.impact)}
                </span>
              </div>
              <h4 className="text-xs font-black uppercase tracking-tight text-slate-800 dark:text-white">{o.title}</h4>
            </div>

            {/* Folder body details */}
            <div className="p-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-2 border-b border-slate-50 dark:border-slate-800 pb-2.5 text-[10px] text-slate-550 dark:text-slate-400 font-serif">
                <div className="flex items-center gap-1">
                  <MapPin size={11} className="text-slate-400 shrink-0" />
                  <span className="truncate" title={o.where}>Local: <strong className="font-sans font-bold text-slate-700 dark:text-slate-300">{o.where}</strong></span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar size={11} className="text-slate-400 shrink-0" />
                  <span>Mês: <strong className="font-sans font-bold text-slate-705 dark:text-slate-300">{o.when}</strong></span>
                </div>
              </div>

              {/* Core analytics blocks */}
              <div className="space-y-2 font-sans">
                <div>
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">O que aconteceu?</span>
                  <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed font-semibold">"{o.what}"</p>
                </div>

                <div>
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Eixo Central Associado</span>
                  <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold font-mono">{o.reason}</p>
                </div>

                <div className="p-2.5 bg-slate-100/50 dark:bg-slate-850 rounded-lg space-y-1">
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Causa Provável (Diagnosticado)</span>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed">"{o.cause}"</p>
                </div>

                <div className="p-2.5 bg-emerald-500/5 border border-emerald-500/10 rounded-lg space-y-1">
                  <span className="text-[8px] font-extrabold text-emerald-600 uppercase tracking-widest block">Recomendação Consultiva Recomendada</span>
                  <p className="text-[10px] text-emerald-900 dark:text-emerald-400 font-medium leading-relaxed">"{o.recommendation}"</p>
                </div>
              </div>
            </div>

            {/* Plan indicator link */}
            <div className="bg-slate-50 dark:bg-slate-850/60 p-2.5 px-4 flex justify-between items-center text-[10px] text-slate-405 font-mono border-t border-slate-105 dark:border-slate-805">
              <span>Auditoria: Algoritmo de Negócio</span>
              <span className="text-[9px] text-blue-500 font-bold flex items-center gap-0.5 cursor-pointer hover:underline">
                Adicionar Tópico Relatório
                <ArrowRight size={10} />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
