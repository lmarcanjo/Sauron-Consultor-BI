/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { TrendingUp, TrendingDown, ArrowUpRight, LucideIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string;
  subtitle: string;
  type?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  isAlert?: boolean;
  comparison?: { val: string; isPositive: boolean } | null;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  type = "neutral",
  icon: Icon,
  isAlert = false,
  comparison = null
}) => {
  const getCardStyle = () => {
    if (isAlert) {
      return "bg-red-50/80 dark:bg-red-950/20 border-red-300 dark:border-red-900/60 ring-1 ring-red-500/10";
    }
    if (type === "positive" || title.toLowerCase().includes("retorno") || title.toLowerCase().includes("margem")) {
      return "bg-blue-50/15 dark:bg-blue-950/15 border-blue-200/60 dark:border-blue-900/40 shadow-sm ring-1 ring-blue-500/5";
    }
    if (type === "negative") {
      return "bg-red-50/15 dark:bg-red-950/15 border-red-200/60 dark:border-red-900/40 shadow-sm ring-1 ring-red-500/5";
    }
    return "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm";
  };

  const getTextColor = () => {
    if (isAlert) return "text-red-700 dark:text-red-400";
    if (type === "positive" || title.toLowerCase().includes("retorno") || title.toLowerCase().includes("margem")) return "text-blue-700 dark:text-blue-400";
    if (type === "negative") return "text-red-700 dark:text-red-400";
    return "text-slate-900 dark:text-slate-100";
  };

  const getSubColor = () => {
    if (isAlert) return "text-red-650 dark:text-red-300 font-bold";
    if (type === "positive" || title.toLowerCase().includes("retorno") || title.toLowerCase().includes("margem")) return "text-blue-600 dark:text-blue-350 font-medium";
    if (type === "negative") return "text-red-500 dark:text-red-300 font-medium";
    return "text-slate-450 dark:text-slate-500";
  };

  const getIconColor = () => {
    if (isAlert) return "text-red-650 dark:text-red-300 bg-red-100 dark:bg-red-950 border border-red-200 dark:border-red-900/60";
    if (type === "positive" || title.toLowerCase().includes("retorno") || title.toLowerCase().includes("margem")) return "text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-950 border border-blue-100 dark:border-blue-900/40";
    if (type === "negative") return "text-red-650 dark:text-red-300 bg-red-50 dark:bg-red-950 border border-red-100 dark:border-red-900/40";
    return "text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700";
  };

  return (
    <div className={`p-3.5 rounded-xl border ${getCardStyle()} transition-all hover:shadow-md hover:border-slate-300 dark:hover:border-slate-750 duration-150`}>
      <div className="flex justify-between items-start gap-1">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate" title={title}>{title}</p>
          <h3 className={`text-lg font-extrabold ${getTextColor()} mt-1.5 font-sans tracking-tight truncate`} title={value}>{value}</h3>
          <p className={`text-[10px] ${getSubColor()} mt-1 flex items-center gap-1 font-sans truncate`} title={subtitle}>
            {isAlert && <TrendingDown size={11} className="text-red-600 shrink-0" />}
            {!isAlert && (type === "positive" || title.toLowerCase().includes("retorno") || title.toLowerCase().includes("margem")) && <TrendingUp size={11} className="text-blue-500 shrink-0" />}
            {!isAlert && type === "negative" && <TrendingDown size={11} className="text-red-500 shrink-0" />}
            <span>{subtitle}</span>
          </p>
          {comparison && (
            <div className={`mt-2 flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md w-fit border leading-none ${
              comparison.isPositive
                ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60"
                : "bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-350 border-rose-200 dark:border-rose-900/60"
            }`}>
              <span>{comparison.isPositive ? "▲" : "▼"}</span>
              <span>{comparison.val}</span>
            </div>
          )}
        </div>
        <div className={`p-1.5 rounded p-2 ${getIconColor()} flex items-center justify-center shrink-0`}>
          <Icon size={14} className="stroke-[2.5]" />
        </div>
      </div>
    </div>
  );
};
