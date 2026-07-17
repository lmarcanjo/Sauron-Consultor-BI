/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { ShieldCheck, Database, RefreshCw } from "lucide-react";
import { createSauronComponent } from "../../design-system/factory/createSauronComponent";
import { SauronBadge } from "../ui/SauronBadge";

export interface SauronDataStatusProps {
  sourceType: "simulated" | "spreadsheet" | "database";
  isLocked: boolean;
  onRefresh?: () => void;
}

const DataStatusComponent: React.FC<SauronDataStatusProps> = ({
  sourceType,
  isLocked,
  onRefresh,
}) => {
  const badgeType = {
    simulated: "warning" as const,
    spreadsheet: "primary" as const,
    database: "success" as const,
  }[sourceType];

  const label = {
    simulated: "Fonte local não conectada",
    spreadsheet: "Planilha de Importação Ativa",
    database: "Sincronizado via Banco Corporativo",
  }[sourceType];

  return (
    <div className="flex items-center justify-between p-3 border border-slate-200/80 dark:border-slate-800/80 rounded-xl bg-white dark:bg-slate-900 shadow-xs">
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 rounded-lg">
          <Database size={13} />
        </div>
        <div className="space-y-0.5">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase font-mono tracking-wider block">
            Fonte de Dados
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black uppercase text-slate-700 dark:text-slate-200 font-mono tracking-tight">
              {label}
            </span>
            <SauronBadge type={badgeType}>{sourceType}</SauronBadge>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isLocked && (
          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-600 font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 uppercase">
            <ShieldCheck size={10} /> Integridade Segura
          </span>
        )}
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
            aria-label="Atualizar dados"
          >
            <RefreshCw size={12} />
          </button>
        )}
      </div>
    </div>
  );
};

export const SauronDataStatus = createSauronComponent("SauronDataStatus", DataStatusComponent);
