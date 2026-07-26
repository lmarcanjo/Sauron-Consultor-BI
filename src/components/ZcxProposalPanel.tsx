/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  Info,
  Layers,
  RotateCcw,
  Sparkles,
  Sliders,
} from "lucide-react";
import type { ZcxFieldProposal, ZcxProposal } from "../core/chaos-data-profiling";

interface ZcxProposalPanelProps {
  proposal: ZcxProposal;
  onAcceptSuggested: () => void;
  onReviewQuestions: () => void;
  onKeepOriginalNames: () => void;
  onOpenAdvancedConfig: () => void;
  onFieldToggle?: (fieldId: string) => void;
}

export const ZcxProposalPanel: React.FC<ZcxProposalPanelProps> = ({
  proposal,
  onAcceptSuggested,
  onReviewQuestions,
  onKeepOriginalNames,
  onOpenAdvancedConfig,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showEvidenceFor, setShowEvidenceFor] = useState<string | null>(null);

  const highConfidenceFields = proposal.fieldProposals.filter(f => f.confidenceTier === "HIGH");
  const mediumConfidenceFields = proposal.fieldProposals.filter(f => f.confidenceTier === "MEDIUM");
  const lowConfidenceFields = proposal.fieldProposals.filter(f => f.confidenceTier === "LOW");

  return (
    <div className="bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-950 rounded-2xl p-5 space-y-6 shadow-sm animate-fade-in" data-testid="zcx-proposal-panel">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400">
            <Sparkles size={22} className="animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>Estrutura inicial proposta pelo SAURON</span>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900">
                ZCX Active
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Analisamos sua fonte e organizamos os campos relevantes com evidências rastreáveis. Nenhuma alteração foi feita na planilha ou banco original.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
            Confiança: {Math.round(proposal.overallConfidence * 100)}%
          </span>
        </div>
      </div>

      {/* Summary Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850">
          <span className="text-[10px] uppercase font-bold text-slate-400">Registros</span>
          <strong className="block text-sm font-black text-slate-800 dark:text-slate-100 mt-0.5">
            {proposal.sourceSummary.totalRecords.toLocaleString("pt-BR")}
          </strong>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850">
          <span className="text-[10px] uppercase font-bold text-slate-400">Campos originais</span>
          <strong className="block text-sm font-black text-slate-800 dark:text-slate-100 mt-0.5">
            {proposal.sourceSummary.totalFields}
          </strong>
        </div>
        <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50">
          <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Alta confiança (≥85%)</span>
          <strong className="block text-sm font-black text-emerald-700 dark:text-emerald-300 mt-0.5">
            {highConfidenceFields.length}
          </strong>
        </div>
        <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50">
          <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">Dúvidas/Revisões</span>
          <strong className="block text-sm font-black text-amber-700 dark:text-amber-300 mt-0.5">
            {proposal.unresolvedQuestions.length + mediumConfidenceFields.length}
          </strong>
        </div>
      </div>

      {/* Main 4 Consultant Actions */}
      <div className="space-y-3">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
          Escolha como deseja prosseguir
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onAcceptSuggested}
            data-testid="zcx-btn-accept-suggested"
            className="p-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-left transition-all shadow-sm cursor-pointer flex flex-col justify-between space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 size={16} /> Usar estrutura sugerida
              </span>
              <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full">Recomendado</span>
            </div>
            <p className="text-[11px] text-indigo-100 font-medium leading-relaxed">
              Aplica os {highConfidenceFields.length} campos de alta confiança e libera os resultados imediatamente.
            </p>
          </button>

          <button
            type="button"
            onClick={onReviewQuestions}
            data-testid="zcx-btn-review-questions"
            className="p-4 rounded-xl bg-amber-50 hover:bg-amber-100/80 dark:bg-amber-950/30 dark:hover:bg-amber-900/40 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800 text-left transition-all cursor-pointer flex flex-col justify-between space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
                <HelpCircle size={16} /> Revisar dúvidas ({proposal.unresolvedQuestions.length})
              </span>
            </div>
            <p className="text-[11px] text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
              Valide apenas as perguntas que impactam os cálculos antes de confirmar.
            </p>
          </button>

          <button
            type="button"
            onClick={onKeepOriginalNames}
            data-testid="zcx-btn-keep-original"
            className="p-4 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-left transition-all cursor-pointer flex flex-col justify-between space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
                <RotateCcw size={16} /> Continuar com nomes originais
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              Utiliza os nomes físicos das colunas exatamente como vieram da planilha/banco.
            </p>
          </button>

          <button
            type="button"
            onClick={onOpenAdvancedConfig}
            data-testid="zcx-btn-advanced-config"
            className="p-4 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-left transition-all cursor-pointer flex flex-col justify-between space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Sliders size={16} /> Configurar manualmente
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              Abre o painel técnico completo para seleção individual de blocos e colunas.
            </p>
          </button>
        </div>
      </div>

      {/* Suggested Capabilities Section */}
      <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-4">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
          Resultados disponíveis com esta fonte
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {proposal.capabilityProposals.map(cap => (
            <div
              key={cap.moduleName}
              className={`p-3 rounded-xl border flex flex-col justify-between space-y-1 ${
                cap.status === "AVAILABLE"
                  ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40"
                  : cap.status === "PROBABLE"
                  ? "bg-blue-50/40 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/40"
                  : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 opacity-60"
              }`}
            >
              <div className="flex items-center justify-between">
                <strong className="text-xs font-extrabold text-slate-800 dark:text-slate-100">{cap.moduleName}</strong>
                <span
                  className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                    cap.status === "AVAILABLE"
                      ? "bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200"
                      : cap.status === "PROBABLE"
                      ? "bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                      : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {cap.status === "AVAILABLE" ? "Disponível" : cap.status === "PROBABLE" ? "Provável" : "Inconclusivo"}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
                {cap.evidence[0]}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Accordion: Detailed Evidence & Field Proposals */}
      <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
        <button
          type="button"
          onClick={() => setShowDetails(open => !open)}
          className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
        >
          {showDetails ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <span>{showDetails ? "Ocultar detalhes das evidências" : "Ver evidências de cada campo (" + proposal.fieldProposals.length + ")"}</span>
        </button>

        {showDetails && (
          <div className="mt-4 space-y-3 animate-fade-in">
            <div className="max-h-72 overflow-auto border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-850">
              {proposal.fieldProposals.map(field => (
                <div key={field.fieldId} className="p-3 text-xs flex flex-col md:flex-row md:items-center justify-between gap-2 bg-white dark:bg-slate-900">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-100">{field.physicalName}</span>
                      {field.suggestedLabel !== field.physicalName && (
                        <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                          → {field.suggestedLabel}
                        </span>
                      )}
                      <span
                        className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                          field.confidenceTier === "HIGH"
                            ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                            : field.confidenceTier === "MEDIUM"
                            ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600"
                        }`}
                      >
                        {Math.round(field.confidence * 100)}% ({field.confidenceTier})
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Categoria: {field.category} · Tipo: {field.inferredType}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowEvidenceFor(curr => curr === field.fieldId ? null : field.fieldId)}
                    className="text-[10px] font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline cursor-pointer"
                  >
                    {showEvidenceFor === field.fieldId ? "Fechar evidências" : "Ver evidências"}
                  </button>
                  {showEvidenceFor === field.fieldId && (
                    <div className="w-full mt-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[10px] text-slate-600 dark:text-slate-300 space-y-1">
                      {field.evidence.map((ev, i) => (
                        <p key={i}>• {ev}</p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ZcxProposalPanel;
