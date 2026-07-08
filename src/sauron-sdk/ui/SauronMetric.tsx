/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { createSauronComponent } from "../../design-system/factory/createSauronComponent";
import { classComposer } from "../../design-system/factory/classComposer";

export interface SauronMetricProps {
  label: string;
  value: string | number;
  type?: "primary" | "success" | "warning" | "danger" | "neutral";
  className?: string;
}

const MetricComponent: React.FC<SauronMetricProps> = ({
  label,
  value,
  type = "neutral",
  className,
}) => {
  const textColors = {
    primary: "text-blue-600 dark:text-blue-400",
    success: "text-emerald-600 dark:text-emerald-400",
    warning: "text-amber-600 dark:text-amber-400",
    danger: "text-rose-600 dark:text-rose-400",
    neutral: "text-slate-700 dark:text-slate-300",
  };

  return (
    <div className={classComposer("flex flex-col gap-0.5", className)}>
      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase font-mono tracking-wider">
        {label}
      </span>
      <span className={classComposer("text-sm font-black font-mono tracking-tight", textColors[type])}>
        {value}
      </span>
    </div>
  );
};

export const SauronMetric = createSauronComponent("SauronMetric", MetricComponent);
