/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { createSauronComponent } from "../../design-system/factory/createSauronComponent";
import { classComposer } from "../../design-system/factory/classComposer";

export interface SauronCommandItemProps extends React.HTMLAttributes<HTMLDivElement> {
  active?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
}

const CommandItemComponent: React.FC<SauronCommandItemProps> = ({
  active = false,
  disabled = false,
  icon,
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={classComposer(
        "flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg select-none transition-colors",
        disabled ? "opacity-40 pointer-events-none" : "cursor-pointer",
        active
          ? "bg-blue-600 text-white font-semibold"
          : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 active:bg-slate-100 dark:active:bg-slate-800",
        className
      )}
      role="option"
      aria-selected={active}
      {...props}
    >
      {icon && <span className={classComposer(active ? "text-white" : "text-slate-400 dark:text-slate-500")}>{icon}</span>}
      <span className="flex-1 text-left truncate">{children}</span>
    </div>
  );
};

export const SauronCommandItem = createSauronComponent("SauronCommandItem", CommandItemComponent);
