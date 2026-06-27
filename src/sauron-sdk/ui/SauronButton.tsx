/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { createSauronComponent } from "../../design-system/factory/createSauronComponent";
import { classComposer } from "../../design-system/factory/classComposer";
import { tokens } from "../../design-system/tokens";

export interface SauronButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "filled" | "outline" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const ButtonComponent: React.FC<SauronButtonProps> = ({
  variant = "filled",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  ...props
}) => {
  const base = "inline-flex items-center justify-center gap-1.5 font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer disabled:opacity-50 select-none text-center focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none";

  const sizes = {
    sm: "px-2.5 py-1.5 text-[9px]",
    md: "px-4 py-2 text-[10px]",
    lg: "px-5 py-2.5 text-xs",
  };

  const variants = {
    filled: "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-xs border border-blue-700",
    outline: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 active:bg-slate-100 dark:active:bg-slate-800",
    ghost: "bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 active:bg-slate-200 dark:active:bg-slate-800",
    danger: "bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-xs border border-rose-700",
    success: "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-xs border border-emerald-700",
  };

  const isBtnDisabled = disabled || loading;

  return (
    <button
      className={classComposer(base, sizes[size], variants[variant], className)}
      disabled={isBtnDisabled}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <span className="animate-spin inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full mr-1" />
      ) : null}
      {children}
    </button>
  );
};

export const SauronButton = createSauronComponent("SauronButton", ButtonComponent);
