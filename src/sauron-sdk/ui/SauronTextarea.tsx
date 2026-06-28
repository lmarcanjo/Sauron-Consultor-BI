/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { createSauronComponent } from "../../design-system/factory/createSauronComponent";
import { classComposer } from "../../design-system/factory/classComposer";

export interface SauronTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: boolean;
}

const TextareaComponent: React.FC<SauronTextareaProps> = ({
  label,
  helperText,
  error,
  className,
  id,
  ...props
}) => {
  const textareaId = id || `sauron-textarea-${crypto.randomUUID().substring(0, 8)}`;

  return (
    <div className="space-y-1 w-full">
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase font-mono"
        >
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={classComposer(
          "w-full px-3 py-2 text-xs bg-white dark:bg-slate-950 border rounded-lg text-slate-800 dark:text-white focus:outline-none focus:ring-1 placeholder-slate-400 font-medium transition-shadow resize-y min-h-[80px]",
          error
            ? "border-rose-500 focus:ring-rose-500"
            : "border-slate-200 dark:border-slate-800 focus:ring-blue-500",
          className
        )}
        {...props}
      />
      {helperText && (
        <p className="text-slate-400 dark:text-slate-500 text-[9px] font-mono leading-relaxed mt-0.5">
          {helperText}
        </p>
      )}
    </div>
  );
};

export const SauronTextarea = createSauronComponent("SauronTextarea", TextareaComponent);
