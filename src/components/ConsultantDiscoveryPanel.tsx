/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Database,
  FileSpreadsheet,
  HelpCircle,
  Info,
  Layers,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import type { ConsultantUnderstandingSummary } from "../core/chaos-data-profiling/ConsultantUnderstandingSummary";
import type { EnterpriseModel } from "../core/enterprise-consolidation/EnterpriseDiscoveryTypes";
import { EnterpriseMapView } from "./EnterpriseMapView";

interface ConsultantDiscoveryPanelProps {
  summary: ConsultantUnderstandingSummary;
  enterpriseModel?: EnterpriseModel;
  onAcceptSuggestedStructure: () => void;
  onReviewInterpretations: () => void;
  onKeepOriginalNames: () => void;
  onConfirmSourceUnderstanding: () => Promise<void> | void;
  canConfirmSourceUnderstanding?: boolean;
  confirmationStatus?: "idle" | "confirming" | "success" | "error";
  confirmationError?: string | null;
  onGoToAnalysis: () => void;
}

export const ConsultantDiscoveryPanel: React.FC<ConsultantDiscoveryPanelProps> = ({
  summary,
  enterpriseModel,
  onAcceptSuggestedStructure,
  onReviewInterpretations,
  onKeepOriginalNames,
  onConfirmSourceUnderstanding,
  canConfirmSourceUnderstanding = true,
  confirmationStatus = "idle",
  confirmationError = null,
  onGoToAnalysis,
}) => {
  const [showEnterpriseMap, setShowEnterpriseMap] = useState(false);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-8 shadow-sm font-sans" data-testid="consultant-discovery-panel">
      {/* CABEÇALHO COGNITIVO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
              <Sparkles size={12} className="animate-pulse" /> Aprendizado Concluído
            </span>
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
              {summary.discovery.originType} · {summary.sourceName}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Compreensão da empresa a partir dos dados
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl font-medium">
            O SAURON analisou a estrutura da fonte e organizou as descobertas abaixo. Nenhuma configuração técnica é necessária para prosseguir.
          </p>
        </div>
      </div>

      {/* 1. O QUE DESCOBRIMOS */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-2">
          <Database size={14} className="text-indigo-600 dark:text-indigo-400" /> 1. O que descobrimos
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800/80">
            <span className="text-[10px] uppercase font-bold text-slate-400">Registros</span>
            <strong className="block text-base font-black text-slate-800 dark:text-slate-100 mt-0.5">
              {summary.discovery.totalRecords.toLocaleString("pt-BR")}
            </strong>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800/80">
            <span className="text-[10px] uppercase font-bold text-slate-400">Campos</span>
            <strong className="block text-base font-black text-slate-800 dark:text-slate-100 mt-0.5">
              {summary.discovery.totalFields}
            </strong>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800/80">
            <span className="text-[10px] uppercase font-bold text-slate-400">Tabelas / Abas</span>
            <strong className="block text-base font-black text-slate-800 dark:text-slate-100 mt-0.5">
              {summary.discovery.totalTables}
            </strong>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800/80">
            <span className="text-[10px] uppercase font-bold text-slate-400">Blocos</span>
            <strong className="block text-base font-black text-slate-800 dark:text-slate-100 mt-0.5">
              {summary.discovery.totalBlocks || 1}
            </strong>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800/80">
            <span className="text-[10px] uppercase font-bold text-slate-400">Qualidade</span>
            <strong className="block text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              {summary.discovery.overallQualityScore}%
            </strong>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800/80">
            <span className="text-[10px] uppercase font-bold text-slate-400">Origem</span>
            <strong className="block text-base font-black text-slate-800 dark:text-slate-100 mt-0.5 truncate">
              {summary.discovery.originType}
            </strong>
          </div>
        </div>
      </div>

      {/* MAPA ORGANIZACIONAL DA EMPRESA */}
      {enterpriseModel && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Mapa Corporativo da Organização
            </h3>
            <button
              type="button"
              onClick={() => setShowEnterpriseMap(curr => !curr)}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              {showEnterpriseMap ? "Ocultar Mapa Empresarial" : "Visualizar Mapa Empresarial"}
            </button>
          </div>

          {showEnterpriseMap && <EnterpriseMapView model={enterpriseModel} />}
        </div>
      )}

      {/* 2. O QUE ENCONTRAMOS (ÁREAS DA EMPRESA) */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-2">
          <Layers size={14} className="text-indigo-600 dark:text-indigo-400" /> 2. O que encontramos
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {summary.foundDomains.map((domain, idx) => (
            <div key={idx} className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <strong className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Área de {domain.domainName}
                </strong>
                <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                  {Math.round(domain.confidence * 100)}% confiança
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {domain.fieldCount} campo(s) identificados nesta estrutura.
              </p>
              {domain.evidence.length > 0 && (
                <div className="pt-2 text-[11px] text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800/80 space-y-1">
                  <span className="text-[9px] font-bold uppercase text-slate-400">Evidências:</span>
                  {domain.evidence.map((ev, eIdx) => (
                    <p key={eIdx} className="italic text-slate-500 dark:text-slate-400">• {ev}</p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 3. O QUE AINDA NÃO TEMOS CERTEZA (DÚVIDAS MATERIAIS APENAS) */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-2">
          <HelpCircle size={14} className="text-amber-500" /> 3. O que ainda precisa de revisão
        </h3>
        {summary.ambiguities.length > 0 ? (
          <div className="space-y-2">
            {summary.ambiguities.map(amb => (
              <div key={amb.id} className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <strong className="font-extrabold text-amber-900 dark:text-amber-200 block">{amb.title}</strong>
                  <p className="text-amber-800/80 dark:text-amber-300/80">{amb.description}</p>
                </div>
                <button
                  type="button"
                  onClick={onReviewInterpretations}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] self-start sm:self-center shrink-0 cursor-pointer"
                >
                  {amb.suggestedAction}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
            Nenhuma ambiguidade material foi encontrada. Todas as interpretações possuem alto nível de evidência.
          </div>
        )}
      </div>

      {/* 4. NOSSA COMPREENSÃO (NARRATIVA EXPLICÁVEL RASTREÁVEL) */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-2">
          <Info size={14} className="text-indigo-600 dark:text-indigo-400" /> 4. Nossa compreensão
        </h3>
        <div className="p-5 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
          "{summary.narrative}"
        </div>
      </div>

      {/* 5. PRÓXIMOS PASSOS (UMA ÚNICA CTA DE VALIDAÇÃO CANÔNICA) */}
      <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-6">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
          5. Conclusão do entendimento
        </h3>
        {confirmationError && (
          <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-600 dark:text-red-400 font-semibold">
            {confirmationError}
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onReviewInterpretations}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer flex items-center gap-2"
            >
              <HelpCircle size={15} /> Revisar dúvidas detalhadas
            </button>
            <button
              type="button"
              onClick={onKeepOriginalNames}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer flex items-center gap-2"
            >
              <RotateCcw size={15} /> Manter todos os nomes originais
            </button>
          </div>

          <div className="flex items-center gap-3">
            {confirmationStatus === "success" ? (
              <button
                type="button"
                onClick={onGoToAnalysis}
                className="px-6 py-3 rounded-2xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center gap-2"
                data-testid="btn-go-to-analysis"
              >
                Ir para análises <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={onConfirmSourceUnderstanding}
                disabled={!canConfirmSourceUnderstanding || confirmationStatus === "confirming"}
                aria-busy={confirmationStatus === "confirming"}
                className="px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-black uppercase tracking-wider transition-all shadow-lg hover:shadow-indigo-500/20 cursor-pointer flex items-center gap-2"
                data-testid="btn-confirm-source-understanding"
              >
                <CheckCircle2 size={18} />
                {confirmationStatus === "confirming"
                  ? "Validando entendimento..."
                  : "Validar entendimento da empresa"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsultantDiscoveryPanel;
