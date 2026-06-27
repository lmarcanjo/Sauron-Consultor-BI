/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { createSauronComponent } from "../../design-system/factory/createSauronComponent";
import { classComposer } from "../../design-system/factory/classComposer";

export interface SauronSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  options: { value: string; label: string }[];
}

const SelectComponent: React.FC<SauronSelectProps> = ({
  label,
  helperText,
  options,
  className,
  id,
  ...props
}) => {
  const selectId = id || `sauron-select-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="space-y-1 w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase font-mono"
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={classComposer(
          "w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500 uppercase tracking-wide cursor-pointer",
          className
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
            {opt.label}
          </option>
        ))}
      </select>
      {helperText && (
        <p className="text-slate-400 dark:text-slate-500 text-[9px] font-mono leading-relaxed mt-0.5">
          {helperText}
        </p>
      )}
    </div>
  );
};

export const SauronSelect = createSauronComponent("SauronSelect", SelectComponent);
