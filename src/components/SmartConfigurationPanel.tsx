import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Lightbulb, SlidersHorizontal, XCircle } from "lucide-react";
import { ActiveDataset } from "../types/dataSource";
import {
  applySmartConfigurationPlan,
  buildSmartConfigurationPlan,
  ignoreSmartConfigurationPlan,
  SmartConfigurationPlan,
} from "../core/smart-configuration";

interface SmartConfigurationPanelProps {
  activeDataset: ActiveDataset | null;
  onApplied?: () => void;
}

function formatConfidence(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export const SmartConfigurationPanel: React.FC<SmartConfigurationPanelProps> = ({ activeDataset, onApplied }) => {
  const [plan, setPlan] = useState<SmartConfigurationPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [hidden, setHidden] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setPlan(null);
    setMessage(null);
    setHidden(false);
    setCompleted(false);

    if (!activeDataset) return;

    setLoading(true);
    buildSmartConfigurationPlan({ activeDataset })
      .then(nextPlan => {
        if (!cancelled) setPlan(nextPlan);
      })
      .catch(error => {
        if (!cancelled) setMessage(error instanceof Error ? error.message : "Não foi possível gerar sugestões.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeDataset?.datasetId, activeDataset?.importedAt]);

  const applicableSuggestions = useMemo(
    () => (plan?.suggestions || []).filter(suggestion => suggestion.status === "suggested" && suggestion.confidence >= 0.58),
    [plan],
  );

  if (!activeDataset || hidden) return null;

  if (loading) {
    return (
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
        <p className="text-xs font-bold text-slate-500">Procurando configurações inteligentes...</p>
      </section>
    );
  }

  if (!plan || plan.suggestions.length === 0) return null;

  const acceptAll = () => {
    const result = applySmartConfigurationPlan(plan);
    setMessage(`${result.appliedMappings.length} área(s) configurada(s) com os campos sugeridos. Sugestões salvas.`);
    setCompleted(true);
    onApplied?.();
  };

  const ignoreNow = () => {
    ignoreSmartConfigurationPlan(plan);
    setHidden(true);
  };

  return (
    <section className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900 rounded-xl p-4 shadow-sm space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center shrink-0">
            <Lightbulb className="text-emerald-600" size={18} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Encontramos estas informações</h3>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">
              Encontramos informações que podem ajudar em {plan.suggestions.length} áreas. Confiança geral {formatConfidence(plan.overallConfidence)}.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={acceptAll}
            disabled={applicableSuggestions.length === 0 || completed}
            aria-label="Aceitar sugestões"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-black uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle2 size={15} />
            {completed ? "Informações salvas" : "Confirmar tudo"}
          </button>
          <button
            type="button"
            onClick={() => setExpanded(value => !value)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-black uppercase tracking-wider"
          >
            <SlidersHorizontal size={15} />
            Editar sugestões
          </button>
          <button
            type="button"
            onClick={ignoreNow}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 text-xs font-black uppercase tracking-wider"
          >
            <XCircle size={15} />
            Agora não
          </button>
        </div>
      </div>

      {message && (
        <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{message}</p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {plan.suggestions.map(suggestion => (
          <div key={suggestion.id} className="border border-slate-200 dark:border-slate-800 rounded-lg p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black text-slate-900 dark:text-white">{suggestion.moduleName}</p>
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1 truncate">{suggestion.sheetName}</p>
              </div>
              <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-2 py-1 rounded">
                {formatConfidence(suggestion.confidence)}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1">
              {suggestion.columnSuggestions.slice(0, expanded ? suggestion.columnSuggestions.length : 4).map(columnSuggestion => (
                <span
                  key={`${suggestion.id}:${columnSuggestion.semanticRole}`}
                  className="text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded"
                  title={columnSuggestion.label}
                >
                  {columnSuggestion.label}: {columnSuggestion.column}
                </span>
              ))}
            </div>
            {expanded && suggestion.warnings.length > 0 && (
              <p className="text-[11px] font-bold text-amber-600 dark:text-amber-300 mt-3">
                {suggestion.warnings.join(" ")}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};
