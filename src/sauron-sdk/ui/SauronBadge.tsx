/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { createSauronComponent } from "../../design-system/factory/createSauronComponent";
import { classComposer } from "../../design-system/factory/classComposer";

export interface SauronBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  type?: "primary" | "success" | "warning" | "danger" | "neutral";
}

const BadgeComponent: React.FC<SauronBadgeProps> = ({
  type = "neutral",
  className,
  children,
  ...props
}) => {
  const styles = {
    primary: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
    success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    danger: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
    neutral: "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20",
  };

  return (
    <span
      className={classComposer(
        "px-2 py-0.5 text-[9px] font-black font-mono uppercase rounded-full border",
        styles[type],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

export const SauronBadge = createSauronComponent("SauronBadge", BadgeComponent);
