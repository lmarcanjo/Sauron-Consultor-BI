/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { ShieldAlert } from "lucide-react";
import { createSauronComponent } from "../../design-system/factory/createSauronComponent";

export interface SauronPermissionBadgeProps {
  permission: string;
  isGranted: boolean;
}

const PermissionBadgeComponent: React.FC<SauronPermissionBadgeProps> = ({
  permission,
  isGranted,
}) => {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[9px] font-black font-mono px-1.5 py-0.5 rounded border uppercase tracking-wider ${
        isGranted
          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
          : "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20"
      }`}
    >
      <ShieldAlert size={10} className={isGranted ? "text-emerald-500" : "text-rose-500"} />
      <span>{permission}</span>
    </span>
  );
};

export const SauronPermissionBadge = createSauronComponent("SauronPermissionBadge", PermissionBadgeComponent);
