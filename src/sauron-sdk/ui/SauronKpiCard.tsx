/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { ArrowUpRight, ArrowDownRight, TrendingUp } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { createSauronComponent } from "../../design-system/factory/createSauronComponent";
import { classComposer } from "../../design-system/factory/classComposer";
import { SauronCard } from "./SauronCard";

export interface SauronKpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  sparklineData?: number[];
  className?: string;
  icon?: React.ReactNode;
}

const KpiCardComponent: React.FC<SauronKpiCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  sparklineData,
  className,
  icon,
}) => {
  return (
    <SauronCard className={classComposer("relative overflow-hidden", className)}>
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono uppercase tracking-wider">
            {title}
          </p>
          <h3 className="text-xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100 font-sans">
            {value}
          </h3>
          {subtitle && (
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
        {icon && (
          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950/40 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800">
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-4 mt-4">
        {trend && (
          <div className="flex items-center gap-1.5">
            <span
              className={classComposer(
                "inline-flex items-center text-[10px] font-black font-mono px-1.5 py-0.5 rounded-full border",
                trend.isPositive
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20"
              )}
            >
              {trend.isPositive ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
              {trend.value}%
            </span>
            <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              vs. ant.
            </span>
          </div>
        )}
        
        {sparklineData && (
          <div className="h-8 w-20">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklineData.map((v, i) => ({ val: v }))}>
                <Line
                  type="monotone"
                  dataKey="val"
                  stroke={trend?.isPositive ? "#10b981" : "#f43f5e"}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </SauronCard>
  );
};

export const SauronKpiCard = createSauronComponent("SauronKpiCard", KpiCardComponent);
