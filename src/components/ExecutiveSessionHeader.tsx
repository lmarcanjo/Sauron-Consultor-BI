/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Layers } from "lucide-react";
import { WorkspaceProject } from "../modules/consultant-workspace/types";
import { ExecutiveSessionTimer } from "./ExecutiveSessionTimer";
import { ExecutiveSessionControls } from "./ExecutiveSessionControls";

interface ExecutiveSessionHeaderProps {
  project: WorkspaceProject;
  completedObjectivesCount: number;
  totalObjectivesCount: number;
  formattedTime: string;
  onToggleFullScreen: () => void;
  onEndMeeting: () => void;
}

export const ExecutiveSessionHeader: React.FC<ExecutiveSessionHeaderProps> = ({
  project,
  completedObjectivesCount,
  totalObjectivesCount,
  formattedTime,
  onToggleFullScreen,
  onEndMeeting,
}) => {
  return (
    <header className="h-16 border-b border-slate-900 bg-slate-950/80 backdrop-blur px-6 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
          <h1 className="text-sm font-black tracking-widest text-slate-100 font-mono">EXECUTIVE SESSION</h1>
        </div>
        <span className="h-4 w-px bg-slate-800" />
        <div className="flex flex-col">
          <span className="text-xs font-bold text-slate-300 leading-tight">{project.client}</span>
          <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wide">
            {project.group || "Comitê Geral"} • Junho/2026
          </span>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="hidden md:flex items-center gap-6">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Layers size={13} className="text-blue-400" />
          <span>Objetivos:</span>
          <span className="font-mono font-bold text-slate-200">
            {completedObjectivesCount} de {totalObjectivesCount}
          </span>
        </div>
        <ExecutiveSessionTimer formattedTime={formattedTime} />
      </div>

      {/* Header Action Buttons / Controls */}
      <ExecutiveSessionControls
        onToggleFullScreen={onToggleFullScreen}
        onEndMeeting={onEndMeeting}
      />
    </header>
  );
};
