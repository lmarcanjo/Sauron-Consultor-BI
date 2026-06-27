/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { MessageSquare, Pin } from "lucide-react";
import { createSauronComponent } from "../../design-system/factory/createSauronComponent";
import { SauronCard } from "../ui/SauronCard";

export interface SauronMeetingNoteProps {
  content: string;
  author: string;
  timestamp: string;
}

const MeetingNoteComponent: React.FC<SauronMeetingNoteProps> = ({
  content,
  author,
  timestamp,
}) => {
  return (
    <SauronCard className="bg-amber-500/5 border-amber-500/10 dark:bg-amber-500/5 dark:border-amber-950/20">
      <div className="flex gap-3 items-start">
        <div className="p-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-lg">
          <Pin size={12} />
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 dark:text-slate-500">
            <span className="font-bold">{author}</span>
            <span>{timestamp}</span>
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed font-sans">
            {content}
          </p>
        </div>
      </div>
    </SauronCard>
  );
};

export const SauronMeetingNote = createSauronComponent("SauronMeetingNote", MeetingNoteComponent);
