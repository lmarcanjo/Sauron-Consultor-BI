/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { CheckCircle2, Circle, Eye, EyeOff } from "lucide-react";
import { createSauronComponent } from "../../design-system/factory/createSauronComponent";

export interface SauronAgendaItemProps {
  title: string;
  completed: boolean;
  visible: boolean;
  onToggleComplete?: () => void;
  onToggleVisible?: () => void;
}

const AgendaItemComponent: React.FC<SauronAgendaItemProps> = ({
  title,
  completed,
  visible,
  onToggleComplete,
  onToggleVisible,
}) => {
  return (
    <div
      className={`flex items-center justify-between p-3 border rounded-xl transition-all ${
        !visible
          ? "opacity-40 bg-slate-50/50 dark:bg-slate-950/10 border-slate-200 dark:border-slate-800"
          : completed
          ? "bg-emerald-500/5 border-emerald-500/20"
          : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80"
      }`}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleComplete}
          disabled={!onToggleComplete || !visible}
          className={`focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-full ${
            completed ? "text-emerald-500" : "text-slate-300 dark:text-slate-600 hover:text-slate-400"
          }`}
          aria-label={completed ? "Marcar item como pendente" : "Marcar item como concluído"}
        >
          {completed ? <CheckCircle2 size={16} /> : <Circle size={16} />}
        </button>
        <span
          className={`text-xs font-bold uppercase tracking-wider font-sans ${
            completed ? "line-through text-slate-450 dark:text-slate-500" : "text-slate-700 dark:text-slate-250"
          }`}
        >
          {title}
        </span>
      </div>

      {onToggleVisible && (
        <button
          onClick={onToggleVisible}
          className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80"
          aria-label={visible ? "Ocultar da agenda executiva" : "Mostrar na agenda executiva"}
        >
          {visible ? <Eye size={13} /> : <EyeOff size={13} />}
        </button>
      )}
    </div>
  );
};

export const SauronAgendaItem = createSauronComponent("SauronAgendaItem", AgendaItemComponent);
