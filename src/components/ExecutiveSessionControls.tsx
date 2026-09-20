/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Maximize, CheckCircle2 } from "lucide-react";

interface ExecutiveSessionControlsProps {
  onToggleFullScreen: () => void;
  onEndMeeting: () => void;
}

export const ExecutiveSessionControls: React.FC<ExecutiveSessionControlsProps> = ({
  onToggleFullScreen,
  onEndMeeting,
}) => {
  return (
    <div className="flex items-center gap-2">
      <button 
        onClick={onToggleFullScreen}
        className="p-2 hover:bg-slate-900 text-slate-400 hover:text-slate-200 rounded-lg transition-all cursor-pointer"
        title="Tela Cheia"
      >
        <Maximize size={15} />
      </button>
      <button 
        onClick={onEndMeeting}
        className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-[11px] font-black tracking-wider uppercase rounded-lg shadow-lg hover:shadow-emerald-950 transition-all flex items-center gap-1.5 border border-emerald-500/30 cursor-pointer"
        data-testid="end-meeting-btn"
      >
        <CheckCircle2 size={13} /> Encerrar Reunião
      </button>
    </div>
  );
};
