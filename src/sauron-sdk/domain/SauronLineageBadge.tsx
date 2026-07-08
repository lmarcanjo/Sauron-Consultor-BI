/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Link2 } from "lucide-react";
import { createSauronComponent } from "../../design-system/factory/createSauronComponent";

export interface SauronLineageBadgeProps {
  sourceCell: string;
  sheetName?: string;
}

const LineageBadgeComponent: React.FC<SauronLineageBadgeProps> = ({
  sourceCell,
  sheetName = "DRE",
}) => {
  return (
    <span className="inline-flex items-center gap-1 text-[9px] font-black font-mono px-1.5 py-0.5 rounded bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20 uppercase tracking-wider">
      <Link2 size={10} className="text-slate-400" />
      <span>{sheetName}!{sourceCell}</span>
    </span>
  );
};

export const SauronLineageBadge = createSauronComponent("SauronLineageBadge", LineageBadgeComponent);
