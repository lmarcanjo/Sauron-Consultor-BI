/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { ShieldCheck, Database, SlidersHorizontal, AlertTriangle, CheckCircle2 } from "lucide-react";

interface TraceabilityPanelProps {
  totalImported: number;
  totalFiltered: number;
  missingFields: string[];
  sourceName: string;
}

export const TraceabilityPanel: React.FC<TraceabilityPanelProps> = ({
  totalImported,
  totalFiltered,
  missingFields,
  sourceName
}) => {
  const isHealthy = missingFields.length === 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 font-sans hover:shadow-md transition-all duration-150">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Rastreabilidade & Auditabilidade de Dados</h3>
          <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Origem, integridade sistêmica e processamento sanitário dos relatórios contábeis</p>
        </div>
        <div className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide ${
          isHealthy ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-amber-50 text-amber-700 border border-amber-200"
        }`}>
          {isHealthy ? <ShieldCheck size={12} className="stroke-[2.5]" /> : <AlertTriangle size={12} className="stroke-[2.5]" />}
          <span>{isHealthy ? "Garantia de Integridade Ativa" : "Campos Corrigidos"}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
        {/* Metric 1 */}
        <div className="p-2.5 bg-slate-50/50 rounded-lg border border-slate-150 flex items-start gap-2">
          <div className="p-1 px-1.5 bg-indigo-50 text-indigo-600 rounded">
            <Database size={13} className="stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Origem da Base</p>
            <p className="text-xs font-bold text-slate-700 mt-0.5 truncate max-w-[170px]" title={sourceName}>
              {sourceName}
            </p>
            <p className="text-[9px] text-slate-400 mt-0.4">Registros: <span className="font-mono font-bold text-slate-600">{totalImported}</span></p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-2.5 bg-slate-50/50 rounded-lg border border-slate-150 flex items-start gap-2">
          <div className="p-1 px-1.5 bg-blue-50 text-blue-600 rounded">
            <SlidersHorizontal size={13} className="stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Volume Filtrado</p>
            <p className="text-xs font-bold text-slate-700 mt-0.5">
              {totalFiltered} de {totalImported} linhas
            </p>
            <p className="text-[9px] text-slate-400 mt-0.4">
              Amostragem: <span className="font-mono font-bold text-slate-600">
                {totalImported > 0 ? ((totalFiltered / totalImported) * 100).toFixed(0) : 0}%
              </span>
            </p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-2.5 bg-slate-50/50 rounded-lg border border-slate-150 flex items-start gap-2">
          <div className="p-1 px-1.5 bg-emerald-50 text-emerald-600 rounded">
            <CheckCircle2 size={13} className="stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Sanitização</p>
            <p className="text-xs font-bold text-slate-700 mt-0.5">
              {isHealthy ? "Sem inconsistências" : `${missingFields.length} correções`}
            </p>
            <p className="text-[9px] text-emerald-600 font-bold mt-0.4">
              Tipagem: OK
            </p>
          </div>
        </div>
      </div>

      {!isHealthy && (
        <div className="mt-2.5 p-2.5 bg-amber-50/50 rounded-lg border border-amber-200/50 flex flex-col sm:flex-row gap-2 items-start sm:items-center">
          <div className="p-0.5 px-1.5 bg-amber-100 text-amber-700 rounded text-[9px] font-bold uppercase tracking-wide">Recuperação Automática</div>
          <div className="flex-1 text-[10px] text-slate-600 leading-normal">
            <span className="font-bold text-slate-700">Aviso:</span> Campos ausentes normalizados: <span className="font-mono text-amber-700 font-bold bg-amber-50 px-1 py-0.5 rounded text-[9px]">{missingFields.join(", ")}</span>.
          </div>
        </div>
      )}
    </div>
  );
};
