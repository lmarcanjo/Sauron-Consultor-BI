/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { Layers, Database, Search, TrendingUp, Hourglass, PlugZap, ShieldAlert } from "lucide-react";
import { ConsultingModelConfiguration } from "../core/business-intelligence/ConsultingModelRepository";
import { buildCustomAreaViewModel } from "../core/business-intelligence/CustomAreaViewModel";
import { LancamentoFinanceiro } from "../types";

interface CustomAreaTabProps {
  areaId: string;
  activeConfig: ConsultingModelConfiguration | null;
  dataOrigem: LancamentoFinanceiro[];
  formatCurrency: (v: number) => string;
  /** Whether the current user holds VIEW_AREA:<areaId>. Defaults to true for backward compatibility with callers that already gate at the route level. */
  hasAccess?: boolean;
}

const formatMetricValue = (value: number, format: "currency" | "number" | "percentage", formatCurrency: (v: number) => string): string => {
  if (format === "currency") return formatCurrency(value);
  if (format === "percentage") return `${value.toFixed(1)}%`;
  return new Intl.NumberFormat("pt-BR").format(Math.round(value * 100) / 100);
};

export const CustomAreaTab: React.FC<CustomAreaTabProps> = ({
  areaId,
  activeConfig,
  dataOrigem,
  formatCurrency,
  hasAccess = true
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const viewModel = useMemo(
    () => buildCustomAreaViewModel(areaId, activeConfig, dataOrigem, undefined, hasAccess),
    [areaId, activeConfig, dataOrigem, hasAccess]
  );

  // Filtered preview rows matching search (search only applies to the bounded preview)
  const filteredRows = useMemo(() => {
    if (!viewModel) return [];
    if (!searchTerm.trim()) return viewModel.recordsPreview;
    const term = searchTerm.toLowerCase();
    return viewModel.recordsPreview.filter(row =>
      viewModel.fields.some(f => String(row[f.physicalName] ?? "").toLowerCase().includes(term))
    );
  }, [viewModel, searchTerm]);

  if (viewModel?.accessDenied) {
    return (
      <div role="alert" className="flex flex-col items-center justify-center p-20 text-slate-500 font-sans">
        <ShieldAlert size={36} className="text-amber-500 mb-4" />
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">Acesso restrito</p>
        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 max-w-xs text-center">Você não possui acesso a esta área neste projeto.</p>
      </div>
    );
  }

  if (!viewModel) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-slate-500 font-sans">
        <Layers size={36} className="text-slate-400 mb-4 animate-bounce" />
        <p className="text-xs font-semibold uppercase tracking-wider">Área não configurada ou inativa</p>
        <p className="text-[10px] text-slate-600 dark:text-slate-300 mt-1">Configure esta área no painel para iniciar as análises.</p>
      </div>
    );
  }

  const { areaName, areaDescription, readiness, consistency, fields, metrics, summary } = viewModel;

  return (
    <div className="space-y-6 font-sans animate-fade-in">

      {/* Title Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-slate-850 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div>
          <h2 className="text-base font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Layers className="text-blue-500 animate-pulse" size={18} />
            <span>{areaName}</span>
          </h2>
          <p className="text-xs text-slate-450 mt-1 max-w-xl">{areaDescription}</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-xl">
          <Database size={13} className="text-slate-400" />
          <span className="text-[10px] font-mono text-slate-300 font-extrabold">{summary.totalRecords} registros ativos</span>
        </div>
      </div>

      {/* Readiness / Consistency banner — pending configuration must never be silent */}
      {readiness !== "READY" && (
        <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl p-4">
          <Hourglass size={16} className="text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-amber-700 dark:text-amber-400">
              {readiness === "NOT_CONFIGURED" ? "Área ainda sem campos configurados" : "Indicadores desta área ainda não foram definidos"}
            </p>
            <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-1">
              {readiness === "NOT_CONFIGURED"
                ? "Acesse o Modelo Consultivo para selecionar quais colunas da planilha pertencem a esta área."
                : "Os campos estão selecionados, mas nenhum indicador foi definido para esta área ainda."}
            </p>
          </div>
        </div>
      )}
      {consistency === "NO_DATA" && (
        <div className="flex items-start gap-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <PlugZap size={16} className="text-slate-400 mt-0.5 shrink-0" />
          <p className="text-[11px] text-slate-500">Nenhum dado ativo no momento. Importe ou selecione uma fonte de dados para ver esta área populada.</p>
        </div>
      )}

      {/* Certified metrics row — only consultant-defined indicators, never generic stats */}
      {metrics.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {metrics.map((metric) => (
            <div key={metric.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-10">
                <TrendingUp size={48} className="text-blue-500" />
              </div>
              <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider mb-1">
                {metric.name}
              </span>
              <h3 className="text-lg font-black text-slate-850 dark:text-slate-100">
                {formatMetricValue(metric.value, metric.format, formatCurrency)}
              </h3>
            </div>
          ))}
        </div>
      )}

      {/* Bounded Records Preview and Search */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">

        {/* Search Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-850 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-slate-50/50 dark:bg-slate-950/20">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar nesta área..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 font-bold"
            />
          </div>
          <span className="text-[10px] font-semibold text-slate-500 shrink-0 self-center">
            Exibindo {filteredRows.length} de {summary.previewCount} registros na prévia (total: {summary.totalRecords})
          </span>
        </div>

        {/* Bounded preview table (never the full workbook) */}
        <div className="overflow-x-auto">
          {fields.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <p className="text-xs font-semibold">Nenhuma coluna associada a esta área.</p>
              <p className="text-[10px] text-slate-600 dark:text-slate-300 mt-1">Acesse o Modelo Consultivo para selecionar campos desta área.</p>
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <p className="text-xs font-semibold">Nenhum resultado encontrado.</p>
            </div>
          ) : (
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-950/30 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-black tracking-wider text-slate-450 select-none">
                  {fields.map(f => (
                    <th key={f.physicalName} className="p-3 font-extrabold">{f.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                    {fields.map(f => {
                      const rawVal = row[f.physicalName];
                      const formatted = (f.isNumeric && rawVal !== "") ? formatCurrency(Number(rawVal)) : String(rawVal ?? "-");
                      return (
                        <td key={f.physicalName} className="p-3 font-medium text-slate-700 dark:text-slate-350">
                          {formatted}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {summary.totalRecords > summary.previewCount && (
          <div className="p-3 bg-slate-55/30 border-t border-slate-100 dark:border-slate-800/80 text-center text-[10px] text-slate-450 font-bold uppercase">
            Prévia limitada a {summary.previewCount} registros de {summary.totalRecords}. Use a busca para localizar casos específicos.
          </div>
        )}
      </div>

    </div>
  );
};
export default CustomAreaTab;
