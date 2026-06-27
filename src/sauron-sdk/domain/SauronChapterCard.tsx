/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { BookOpen, Check } from "lucide-react";
import { createSauronComponent } from "../../design-system/factory/createSauronComponent";
import { SauronCard } from "../ui/SauronCard";

export interface SauronChapterCardProps {
  index: number;
  title: string;
  subtitle?: string;
  active?: boolean;
  completed?: boolean;
  onClick?: () => void;
}

const ChapterCardComponent: React.FC<SauronChapterCardProps> = ({
  index,
  title,
  subtitle,
  active = false,
  completed = false,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`p-4 border rounded-xl transition-all select-none ${
        onClick ? "cursor-pointer" : ""
      } ${
        active
          ? "bg-blue-50/30 dark:bg-blue-950/10 border-blue-500 shadow-sm"
          : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 hover:bg-slate-50/50 dark:hover:bg-slate-950/10"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs font-mono border ${
            completed
              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
              : active
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-slate-50 dark:bg-slate-950 text-slate-500 border-slate-200 dark:border-slate-800"
          }`}
        >
          {completed ? <Check size={12} /> : index}
        </div>
        <div className="flex-1 space-y-0.5">
          <h4 className={`text-xs font-bold uppercase tracking-wider font-sans ${active ? "text-blue-600 dark:text-blue-400" : "text-slate-800 dark:text-slate-200"}`}>
            {title}
          </h4>
          {subtitle && (
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono uppercase tracking-wider">
              {subtitle}
            </p>
          )}
        </div>
        <BookOpen size={14} className={active ? "text-blue-500" : "text-slate-300 dark:text-slate-700"} />
      </div>
    </div>
  );
};

export const SauronChapterCard = createSauronComponent("SauronChapterCard", ChapterCardComponent);
