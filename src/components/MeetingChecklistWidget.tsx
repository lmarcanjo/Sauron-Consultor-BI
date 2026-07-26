/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * MeetingChecklistWidget — Checklist Executivo Pré-Reunião
 *
 * Não realiza cálculos de negócio e serve de apoio visual para o consultor.
 */

import React from "react";
import { CheckSquare, Calendar, ChevronRight, Play } from "lucide-react";
import { Enterprise } from "../core/persistence/EnterpriseRepository";
import { ActiveDataset, SpreadsheetFile } from "../types/dataSource";
import { ExecutivePresentation } from "../core/business-intelligence/ExecutivePresentationEngine";

interface MeetingChecklistWidgetProps {
  enterprises: Enterprise[];
  activeDataset: ActiveDataset | null;
  activeFiles: SpreadsheetFile[];
  presentation: ExecutivePresentation | null;
  isMarketConfigured: boolean;
  hasActionPlan: boolean;
  onSelectTab: (tab: string) => void;
}

export const MeetingChecklistWidget: React.FC<MeetingChecklistWidgetProps> = ({
  enterprises,
  activeDataset,
  activeFiles,
  presentation,
  isMarketConfigured,
  hasActionPlan,
  onSelectTab
}) => {
  const hasEnterprise = enterprises.length > 0;
  const hasData = !!activeDataset && activeDataset.rowCount > 0;
  const hasSegment = enterprises.some(e => e.segment && e.segment !== "");
  const hasMapping = !!activeDataset && activeDataset.columnProfiles && activeDataset.columnProfiles.length > 0;
  const hasPresentation = !!presentation && presentation.status === "ready";
  
  let hasPendingActions = false;
  try {
    // Se faltar empresa, dados, mapeamento ou apresentação, considera que tem pendências críticas/importantes
    hasPendingActions = !hasEnterprise || !hasData || !hasMapping || !hasPresentation;
  } catch (e) {}

  const checklistItems = [
    { id: "ent", label: "Empresas cadastradas", done: hasEnterprise, tab: "enterprise_center" },
    { id: "data", label: "Dados atualizados", done: hasData, tab: "central_dados" },
    { id: "seg", label: "Segmento operacional identificado", done: hasSegment, tab: "enterprise_center" },
    { id: "map", label: "Campos financeiros configurados", done: hasMapping, tab: "analise_estrutura" },
    { id: "kpis", label: "Indicadores chave (KPIs) disponíveis", done: hasMapping, tab: "resumo" },
    { id: "pres", label: "Apresentação executiva pronta", done: hasPresentation, tab: "preparacao_reuniao" },
    { id: "mkt", label: "Inteligência de mercado ativa", done: isMarketConfigured, tab: "enterprise_center" },
    { id: "plan", label: "Plano anterior ou de ação carregado", done: hasActionPlan, tab: "plano_executivo" },
    { id: "pend", label: "Pendências críticas revisadas", done: !hasPendingActions, tab: "enterprise_center" }
  ];

  const completedCount = checklistItems.filter(item => item.done).length;
  const allCompleted = completedCount === checklistItems.length;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl shadow-sm space-y-4">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <CheckSquare className="text-emerald-500" size={18} />
          <h3 className="text-sm font-black uppercase tracking-wide text-slate-800 dark:text-white">
            Checklist de Reunião
          </h3>
        </div>
        <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
          {completedCount} de 9 concluídos
        </span>
      </div>

      {/* Checklist items list */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {checklistItems.map(item => (
          <div
            key={item.id}
            onClick={() => !item.done && onSelectTab(item.tab)}
            className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all ${
              item.done
                ? "bg-slate-50/50 dark:bg-slate-950/20 border-slate-100 dark:border-slate-850/50 text-slate-500 dark:text-slate-400"
                : "bg-amber-50/20 dark:bg-amber-950/5 border-amber-100/50 dark:border-amber-950/20 hover:border-amber-400 dark:hover:border-amber-700 text-slate-800 dark:text-slate-200 cursor-pointer"
            }`}
          >
            <span className={`text-xs mt-0.5 shrink-0 font-bold ${item.done ? "text-emerald-500" : "text-amber-500"}`}>
              {item.done ? "✔" : "○"}
            </span>
            <div className="flex-1">
              <p className={`text-[10px] font-bold ${item.done ? "line-through opacity-70" : ""}`}>
                {item.label}
              </p>
              {!item.done && (
                <span className="text-[8px] font-black uppercase text-amber-500 hover:text-amber-600 inline-flex items-center gap-0.5 mt-0.5">
                  Resolver <ChevronRight size={8} />
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Ready Banner */}
      {allCompleted ? (
        <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-xl animate-fade-in">
          <div className="flex items-center gap-3">
            <Calendar className="text-emerald-500 shrink-0 animate-bounce" size={20} />
            <div>
              <h4 className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-450">
                Projeto pronto para reunião
              </h4>
              <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-500">
                Todas as etapas obrigatórias foram validadas e homologadas.
              </p>
            </div>
          </div>
          <button
            onClick={() => onSelectTab("preparacao_reuniao")}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black uppercase transition-all shadow-sm cursor-pointer"
          >
            <Play size={12} fill="currentColor" /> Preparar Reunião
          </button>
        </div>
      ) : (
        <div className="p-3 bg-amber-50/20 dark:bg-amber-950/10 border border-amber-100/50 dark:border-amber-900/20 rounded-xl">
          <p className="text-[9px] font-semibold text-amber-600 dark:text-amber-500 leading-relaxed text-center">
            Complete os itens pendentes do checklist acima para liberar a Sessão Executiva da Reunião.
          </p>
        </div>
      )}
    </div>
  );
};
