/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { createSauronComponent } from "../../design-system/factory/createSauronComponent";
import { classComposer } from "../../design-system/factory/classComposer";

export interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  icon?: React.ReactNode;
}

export interface SauronTimelineProps {
  events: TimelineEvent[];
  className?: string;
}

const TimelineComponent: React.FC<SauronTimelineProps> = ({ events, className }) => {
  return (
    <div className={classComposer("space-y-4 relative pl-4 border-l border-slate-200 dark:border-slate-800", className)}>
      {events.map((evt) => (
        <div key={evt.id} className="relative group">
          {/* Node Dot */}
          <div className="absolute -left-[21px] top-1 bg-white dark:bg-slate-900 border-2 border-blue-500 rounded-full w-2.5 h-2.5 group-hover:scale-125 transition-transform" />

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {evt.timestamp}
              </span>
              {evt.icon && <span className="text-slate-400">{evt.icon}</span>}
            </div>
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase font-sans">
              {evt.title}
            </h4>
            {evt.description && (
              <p className="text-[10px] text-slate-500 leading-relaxed font-sans">
                {evt.description}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export const SauronTimeline = createSauronComponent("SauronTimeline", TimelineComponent);
