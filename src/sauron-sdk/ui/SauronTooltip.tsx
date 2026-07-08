/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { createSauronComponent } from "../../design-system/factory/createSauronComponent";
import { classComposer } from "../../design-system/factory/classComposer";

export interface SauronTooltipProps {
  content: string;
  children: React.ReactNode;
  className?: string;
}

const TooltipComponent: React.FC<SauronTooltipProps> = ({
  content,
  children,
  className,
}) => {
  const [visible, setVisible] = useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          className={classComposer(
            "absolute z-50 px-2.5 py-1.5 text-[10px] font-mono tracking-tight bg-slate-900 dark:bg-slate-950 text-slate-100 rounded-lg border border-slate-800 shadow-md bottom-full left-1/2 -translate-x-1/2 mb-1.5 whitespace-nowrap pointer-events-none animate-fade-in",
            className
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
};

export const SauronTooltip = createSauronComponent("SauronTooltip", TooltipComponent);
