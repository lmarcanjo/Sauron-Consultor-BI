/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { createSauronComponent } from "../../design-system/factory/createSauronComponent";
import { classComposer } from "../../design-system/factory/classComposer";
import { tokens } from "../../design-system/tokens";

export interface SauronCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  loading?: boolean;
}

const CardComponent: React.FC<SauronCardProps> = ({
  title,
  subtitle,
  actions,
  loading = false,
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={classComposer(
        "bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-xs overflow-hidden transition-all duration-200",
        className
      )}
      {...props}
    >
      {(title || subtitle || actions) && (
        <div className="p-4 border-b border-slate-100 dark:border-slate-850 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20">
          <div>
            {title && (
              <h3 className="text-xs font-bold tracking-wider text-slate-700 dark:text-slate-200 uppercase font-sans">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono uppercase tracking-wider mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}

      <div className="p-5">
        {loading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
            <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-full" />
            <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-5/6" />
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
};

export const SauronCard = createSauronComponent("SauronCard", CardComponent);
