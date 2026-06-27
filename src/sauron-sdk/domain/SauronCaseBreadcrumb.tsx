/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { ChevronRight, Home } from "lucide-react";
import { createSauronComponent } from "../../design-system/factory/createSauronComponent";

export interface SauronCaseBreadcrumbProps {
  paths: string[];
}

const CaseBreadcrumbComponent: React.FC<SauronCaseBreadcrumbProps> = ({ paths }) => {
  return (
    <nav className="flex items-center gap-1.5 py-1" aria-label="Breadcrumb">
      <div className="text-slate-400 dark:text-slate-500">
        <Home size={11} />
      </div>
      {paths.map((p, idx) => (
        <React.Fragment key={idx}>
          <ChevronRight size={11} className="text-slate-300 dark:text-slate-600" />
          <span
            className={
              idx === paths.length - 1
                ? "text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 font-mono tracking-wider"
                : "text-[10px] font-medium uppercase text-slate-400 dark:text-slate-500 font-mono tracking-wider"
            }
          >
            {p}
          </span>
        </React.Fragment>
      ))}
    </nav>
  );
};

export const SauronCaseBreadcrumb = createSauronComponent("SauronCaseBreadcrumb", CaseBreadcrumbComponent);
