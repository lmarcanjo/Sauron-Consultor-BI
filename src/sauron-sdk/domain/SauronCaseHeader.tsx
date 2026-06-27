/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { createSauronComponent } from "../../design-system/factory/createSauronComponent";
import { SauronBadge } from "../ui/SauronBadge";

export interface SauronCaseHeaderProps {
  title: string;
  category: string;
  status: "active" | "completed" | "pending" | "archived";
  onActionClick?: () => void;
  actionLabel?: string;
}

const CaseHeaderComponent: React.FC<SauronCaseHeaderProps> = ({
  title,
  category,
  status,
  onActionClick,
  actionLabel = "Configurar",
}) => {
  const badgeType = {
    active: "primary" as const,
    completed: "success" as const,
    pending: "warning" as const,
    archived: "neutral" as const,
  }[status];

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-xs">
      <div className="space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase font-mono tracking-wider">
            {category}
          </span>
          <SauronBadge type={badgeType}>{status}</SauronBadge>
        </div>
        <h1 className="text-xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100 font-sans">
          {title}
        </h1>
      </div>
      {onActionClick && (
        <button
          onClick={onActionClick}
          className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg bg-blue-600 hover:bg-blue-700 text-white cursor-pointer select-none transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export const SauronCaseHeader = createSauronComponent("SauronCaseHeader", CaseHeaderComponent);
