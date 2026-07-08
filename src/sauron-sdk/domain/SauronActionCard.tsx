/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { CheckSquare, Calendar, User, ChevronRight } from "lucide-react";
import { createSauronComponent } from "../../design-system/factory/createSauronComponent";
import { SauronCard } from "../ui/SauronCard";
import { SauronBadge } from "../ui/SauronBadge";

export interface SauronActionCardProps {
  description: string;
  responsible: string;
  deadline: string;
  priority: "high" | "medium" | "low";
  status: "pending" | "completed" | "in_progress";
  onStatusToggle?: () => void;
}

const ActionCardComponent: React.FC<SauronActionCardProps> = ({
  description,
  responsible,
  deadline,
  priority,
  status,
  onStatusToggle,
}) => {
  const priorityBadgeType = {
    high: "danger" as const,
    medium: "warning" as const,
    low: "neutral" as const,
  }[priority];

  const statusBadgeType = {
    pending: "neutral" as const,
    in_progress: "primary" as const,
    completed: "success" as const,
  }[status];

  const readableStatus = {
    pending: "Pendente",
    in_progress: "Em Progresso",
    completed: "Concluído",
  }[status];

  return (
    <SauronCard className="hover:shadow-sm transition-all">
      <div className="flex gap-3.5 items-start">
        <button
          onClick={onStatusToggle}
          disabled={!onStatusToggle}
          className={`p-2 rounded-xl border transition-all ${
            status === "completed"
              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
              : "bg-slate-50 dark:bg-slate-950/40 text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-600 dark:hover:text-slate-200"
          }`}
          aria-label={status === "completed" ? "Marcar como pendente" : "Marcar como concluído"}
        >
          <CheckSquare size={15} />
        </button>

        <div className="space-y-2 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <SauronBadge type={statusBadgeType}>{readableStatus}</SauronBadge>
            <SauronBadge type={priorityBadgeType}>Prioridade {priority}</SauronBadge>
          </div>

          <p className={`text-xs font-semibold leading-relaxed ${status === "completed" ? "line-through text-slate-400 dark:text-slate-500" : "text-slate-800 dark:text-slate-100"}`}>
            {description}
          </p>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-mono text-slate-400 dark:text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800/60 mt-1">
            <span className="inline-flex items-center gap-1">
              <User size={10} />
              Responsável: <strong className="text-slate-600 dark:text-slate-300">{responsible}</strong>
            </span>
            <span className="inline-flex items-center gap-1">
              <Calendar size={10} />
              Prazo: <strong className="text-slate-600 dark:text-slate-300">{deadline}</strong>
            </span>
          </div>
        </div>
      </div>
    </SauronCard>
  );
};

export const SauronActionCard = createSauronComponent("SauronActionCard", ActionCardComponent);
