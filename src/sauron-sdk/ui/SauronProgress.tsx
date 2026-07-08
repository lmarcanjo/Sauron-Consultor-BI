/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { createSauronComponent } from "../../design-system/factory/createSauronComponent";
import { classComposer } from "../../design-system/factory/classComposer";

export interface SauronProgressProps {
  value: number; // 0 to 100
  label?: string;
  showPercentage?: boolean;
  className?: string;
}

const ProgressComponent: React.FC<SauronProgressProps> = ({
  value,
  label,
  showPercentage = true,
  className,
}) => {
  const percentage = Math.min(100, Math.max(0, value));

  return (
    <div className={classComposer("space-y-1.5 w-full", className)}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center">
          {label && (
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase font-mono tracking-wider">
              {label}
            </span>
          )}
          {showPercentage && (
            <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 font-mono">
              {percentage}%
            </span>
          )}
        </div>
      )}
      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
        <div
          className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export const SauronProgress = createSauronComponent("SauronProgress", ProgressComponent);
