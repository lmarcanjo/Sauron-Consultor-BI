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
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  type = "neutral",
  icon: Icon,
  isAlert = false
}) => {
  const getCardStyle = () => {
    if (isAlert) {
      return "bg-red-50/80 border-red-300 ring-1 ring-red-500/10";
    }
    if (type === "positive" || title.toLowerCase().includes("retorno") || title.toLowerCase().includes("margem")) {
      return "bg-blue-50/10 border-blue-200/60 shadow-sm ring-1 ring-blue-500/5";
    }
    if (type === "negative") {
      return "bg-red-50/10 border-red-200/60 shadow-sm ring-1 ring-red-500/5";
    }
    return "bg-white border-slate-200 shadow-sm";
  };

  const getTextColor = () => {
    if (isAlert) return "text-red-700";
    if (type === "positive" || title.toLowerCase().includes("retorno") || title.toLowerCase().includes("margem")) return "text-blue-700";
    if (type === "negative") return "text-red-700";
    return "text-slate-900";
  };

  const getSubColor = () => {
    if (isAlert) return "text-red-650 font-bold";
    if (type === "positive" || title.toLowerCase().includes("retorno") || title.toLowerCase().includes("margem")) return "text-blue-600 font-medium";
    if (type === "negative") return "text-red-500 font-medium";
    return "text-slate-400";
  };

  const getIconColor = () => {
    if (isAlert) return "text-red-650 bg-red-100 border border-red-200";
    if (type === "positive" || title.toLowerCase().includes("retorno") || title.toLowerCase().includes("margem")) return "text-blue-600 bg-blue-50 border border-blue-100";
    if (type === "negative") return "text-red-600 bg-red-50 border border-red-100";
    return "text-slate-500 bg-slate-50 border border-slate-100";
  };

  return (
    <div className={`p-3.5 rounded-xl border ${getCardStyle()} transition-all hover:shadow-md hover:border-slate-300 duration-150`}>
      <div className="flex justify-between items-start gap-1">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate" title={title}>{title}</p>
          <h3 className={`text-lg font-extrabold ${getTextColor()} mt-1.5 font-sans tracking-tight truncate`} title={value}>{value}</h3>
          <p className={`text-[10px] ${getSubColor()} mt-1 flex items-center gap-1 font-sans truncate`} title={subtitle}>
            {isAlert && <TrendingDown size={11} className="text-red-600 shrink-0" />}
            {!isAlert && (type === "positive" || title.toLowerCase().includes("retorno") || title.toLowerCase().includes("margem")) && <TrendingUp size={11} className="text-blue-500 shrink-0" />}
            {!isAlert && type === "negative" && <TrendingDown size={11} className="text-red-500 shrink-0" />}
            <span>{subtitle}</span>
          </p>
        </div>
        <div className={`p-1.5 rounded p-2 ${getIconColor()} flex items-center justify-center shrink-0`}>
          <Icon size={14} className="stroke-[2.5]" />
        </div>
      </div>
    </div>
  );
};
