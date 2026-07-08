/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { createSauronComponent } from "../../design-system/factory/createSauronComponent";
import { classComposer } from "../../design-system/factory/classComposer";

export interface SauronInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: boolean;
  errorMessage?: string;
}

const InputComponent: React.FC<SauronInputProps> = ({
  label,
  helperText,
  error,
  errorMessage,
  className,
  id,
  ...props
}) => {
  const inputId = id || `sauron-input-${crypto.randomUUID().substring(0, 8)}`;

  return (
    <div className="space-y-1 w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase font-mono"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={classComposer(
          "w-full px-3 py-2 text-xs bg-white dark:bg-slate-950 border rounded-lg text-slate-800 dark:text-white focus:outline-none focus:ring-1 placeholder-slate-400 font-medium transition-shadow",
          error
            ? "border-rose-500 focus:ring-rose-500"
            : "border-slate-200 dark:border-slate-800 focus:ring-blue-500",
          className
        )}
        {...props}
      />
      {error && errorMessage && (
        <p className="text-rose-500 text-[10px] font-medium mt-1 font-sans">
          {errorMessage}
        </p>
      )}
      {!error && helperText && (
        <p className="text-slate-400 dark:text-slate-500 text-[9px] font-mono leading-relaxed mt-0.5">
          {helperText}
        </p>
      )}
    </div>
  );
};

export const SauronInput = createSauronComponent("SauronInput", InputComponent);
