/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { UserCheck } from "lucide-react";
import { createSauronComponent } from "../../design-system/factory/createSauronComponent";
import { SauronBadge } from "../ui/SauronBadge";

export interface SauronUserContextProps {
  name: string;
  role: string;
  organization?: string;
}

const UserContextComponent: React.FC<SauronUserContextProps> = ({
  name,
  role,
  organization,
}) => {
  return (
    <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-xl">
      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/40 flex items-center justify-center">
        <UserCheck size={14} />
      </div>
      <div className="space-y-0.5 flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <strong className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
            {name}
          </strong>
          <SauronBadge type="primary">{role}</SauronBadge>
        </div>
        {organization && (
          <p className="text-[10px] text-slate-450 dark:text-slate-500 font-mono uppercase tracking-wider truncate">
            {organization}
          </p>
        )}
      </div>
    </div>
  );
};

export const SauronUserContext = createSauronComponent("SauronUserContext", UserContextComponent);
