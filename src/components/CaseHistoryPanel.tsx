import React from "react";
import { Activity } from "lucide-react";
import { CaseHistoryEvent } from "../core/workspace-intelligence/CaseHistoryEngine";

interface CaseHistoryPanelProps {
  historyEvents: CaseHistoryEvent[];
}

export const CaseHistoryPanel: React.FC<CaseHistoryPanelProps> = ({ historyEvents }) => {
  return (
    <div className="space-y-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xs">
      <div className="border-b border-slate-100 dark:border-slate-800/80 pb-4">
        <h2 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
          <Activity size={18} className="text-blue-500" />
          <span>História do Caso de Consultoria</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">Narrativa cronológica de rituais, marcos executivos e conquistas operacionais.</p>
      </div>

      {/* Timeline layout */}
      <div className="relative pl-6 space-y-6 border-l-2 border-slate-150 dark:border-slate-800">
        {historyEvents.map((evt) => {
          let badgeColor = "bg-blue-500";
          if (evt.category === "anomaly_detected") badgeColor = "bg-rose-500";
          if (evt.category === "commission_approved") badgeColor = "bg-emerald-500";
          if (evt.category === "metric_achieved") badgeColor = "bg-amber-500";

          return (
            <div key={evt.id} className="relative animate-fade-in">
              {/* Timeline Dot */}
              <span className={`absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 ${badgeColor}`} />
              
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-extrabold text-slate-800 dark:text-white">{evt.title}</h4>
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded">
                    {evt.formattedTime}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  {evt.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
