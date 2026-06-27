/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Inbox } from "lucide-react";
import { createSauronComponent } from "../../design-system/factory/createSauronComponent";
import { classComposer } from "../../design-system/factory/classComposer";

export interface SauronEmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

const EmptyStateComponent: React.FC<SauronEmptyStateProps> = ({
  title,
  description,
  action,
  icon,
  className,
}) => {
  return (
    <div
      className={classComposer(
        "flex flex-col items-center justify-center p-8 text-center bg-slate-50/40 dark:bg-slate-950/20 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl",
        className
      )}
    >
      <div className="text-slate-400 dark:text-slate-500 mb-3">
        {icon || <Inbox size={32} />}
      </div>
      <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase mb-1 tracking-wider">
        {title}
      </h4>
      {description && (
        <p className="text-[10px] text-slate-500 max-w-xs leading-relaxed mb-4">
          {description}
        </p>
      )}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
};

export const SauronEmptyState = createSauronComponent("SauronEmptyState", EmptyStateComponent);
