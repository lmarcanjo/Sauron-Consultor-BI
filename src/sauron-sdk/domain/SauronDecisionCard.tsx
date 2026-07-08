/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Hammer, User2 } from "lucide-react";
import { createSauronComponent } from "../../design-system/factory/createSauronComponent";
import { SauronCard } from "../ui/SauronCard";

export interface SauronDecisionCardProps {
  description: string;
  responsible?: string;
  meetingTitle?: string;
  timestamp?: string;
}

const DecisionCardComponent: React.FC<SauronDecisionCardProps> = ({
  description,
  responsible,
  meetingTitle,
  timestamp,
}) => {
  return (
    <SauronCard className="hover:border-blue-500/30 transition-all">
      <div className="flex gap-3.5 items-start">
        <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 rounded-xl">
          <Hammer size={15} />
        </div>
        <div className="space-y-1.5 flex-1">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-black font-mono uppercase bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded-full">
              Decisão Registrada
            </span>
            {timestamp && (
              <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500">
                {timestamp}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-200 font-semibold leading-relaxed">
            {description}
          </p>
          {(responsible || meetingTitle) && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-mono text-slate-400 dark:text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800/60 mt-2">
              {responsible && (
                <span className="inline-flex items-center gap-1">
                  <User2 size={10} />
                  Responsável: <strong className="text-slate-600 dark:text-slate-300">{responsible}</strong>
                </span>
              )}
              {meetingTitle && (
                <span>
                  Ritual: <strong className="text-slate-600 dark:text-slate-300">{meetingTitle}</strong>
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </SauronCard>
  );
};

export const SauronDecisionCard = createSauronComponent("SauronDecisionCard", DecisionCardComponent);
