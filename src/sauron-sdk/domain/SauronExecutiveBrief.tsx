/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Award, Target, HelpCircle } from "lucide-react";
import { createSauronComponent } from "../../design-system/factory/createSauronComponent";
import { SauronCard } from "../ui/SauronCard";

export interface SauronExecutiveBriefProps {
  objective: string;
  scope: string;
  nextRitual?: string;
}

const ExecutiveBriefComponent: React.FC<SauronExecutiveBriefProps> = ({
  objective,
  scope,
  nextRitual,
}) => {
  return (
    <SauronCard title="Briefing Executivo" subtitle="Resumo macroscópico da intervenção">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-1 bg-slate-50/50 dark:bg-slate-950/20 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
            <Target size={14} />
            <span className="text-[10px] font-bold uppercase font-mono tracking-wider">Objetivo</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed font-sans mt-1">
            {objective}
          </p>
        </div>

        <div className="space-y-1 bg-slate-50/50 dark:bg-slate-950/20 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <Award size={14} />
            <span className="text-[10px] font-bold uppercase font-mono tracking-wider">Escopo</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed font-sans mt-1">
            {scope}
          </p>
        </div>

        <div className="space-y-1 bg-slate-50/50 dark:bg-slate-950/20 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
            <HelpCircle size={14} />
            <span className="text-[10px] font-bold uppercase font-mono tracking-wider">Próximo Alinhamento</span>
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-300 font-bold leading-relaxed font-sans mt-1">
            {nextRitual || "Não agendado"}
          </p>
        </div>
      </div>
    </SauronCard>
  );
};

export const SauronExecutiveBrief = createSauronComponent("SauronExecutiveBrief", ExecutiveBriefComponent);
