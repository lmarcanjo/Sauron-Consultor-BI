/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { FolderGit } from "lucide-react";
import { createSauronComponent } from "../../design-system/factory/createSauronComponent";
import { SauronCard } from "../ui/SauronCard";

export interface SauronDossierSectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

const DossierSectionComponent: React.FC<SauronDossierSectionProps> = ({
  title,
  subtitle,
  children,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <FolderGit size={14} className="text-blue-500" />
        <div>
          <h4 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider font-sans">
            {title}
          </h4>
          {subtitle && (
            <p className="text-[10px] text-slate-450 dark:text-slate-500 font-mono uppercase tracking-wider">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {children}
      </div>
    </div>
  );
};

export const SauronDossierSection = createSauronComponent("SauronDossierSection", DossierSectionComponent);
