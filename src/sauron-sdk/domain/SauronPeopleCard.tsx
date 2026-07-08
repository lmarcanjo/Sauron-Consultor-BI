/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { User, Mail } from "lucide-react";
import { createSauronComponent } from "../../design-system/factory/createSauronComponent";
import { SauronCard } from "../ui/SauronCard";

export interface SauronPeopleCardProps {
  name: string;
  role: string;
  email?: string;
  phone?: string;
  organization?: string;
}

const PeopleCardComponent: React.FC<SauronPeopleCardProps> = ({
  name,
  role,
  email,
  phone,
  organization,
}) => {
  return (
    <SauronCard className="hover:shadow-sm transition-all duration-200">
      <div className="flex gap-3.5 items-center">
        <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-950/40 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 flex items-center justify-center font-bold text-xs uppercase font-mono">
          {name.substring(0, 2)}
        </div>
        <div className="space-y-0.5 flex-1 min-w-0">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase font-sans truncate">
            {name}
          </h4>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
            {role}
          </p>
          {organization && (
            <p className="text-[9px] text-slate-400 dark:text-slate-500 font-mono uppercase tracking-wider truncate">
              {organization}
            </p>
          )}
          {email && (
            <div className="flex items-center gap-1 text-[9px] font-mono text-slate-400 dark:text-slate-500 pt-0.5">
              <Mail size={10} />
              <span className="truncate">{email}</span>
            </div>
          )}
        </div>
      </div>
    </SauronCard>
  );
};

export const SauronPeopleCard = createSauronComponent("SauronPeopleCard", PeopleCardComponent);
