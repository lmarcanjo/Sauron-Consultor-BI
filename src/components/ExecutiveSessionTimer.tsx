/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Clock } from "lucide-react";

interface ExecutiveSessionTimerProps {
  formattedTime: string;
}

export const ExecutiveSessionTimer: React.FC<ExecutiveSessionTimerProps> = ({ formattedTime }) => {
  return (
    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono bg-slate-900 px-3 py-1 rounded-md border border-slate-850">
      <Clock size={13} className="text-amber-500 animate-pulse" />
      <span className="text-amber-500 font-black">{formattedTime}</span>
    </div>
  );
};
