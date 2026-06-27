/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { createSauronComponent } from "../../design-system/factory/createSauronComponent";
import { classComposer } from "../../design-system/factory/classComposer";

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

export interface SauronTabsProps {
  tabs: TabItem[];
  activeTabId: string;
  onTabChange: (id: string) => void;
  className?: string;
}

const TabsComponent: React.FC<SauronTabsProps> = ({
  tabs,
  activeTabId,
  onTabChange,
  className,
}) => {
  return (
    <div
      className={classComposer(
        "flex border-b border-slate-200 dark:border-slate-800 gap-1.5 w-full overflow-x-auto scrollbar-none",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={classComposer(
              "px-4 py-3 text-[10px] font-black uppercase tracking-wider transition-all border-b-2 inline-flex items-center gap-1.5 focus:outline-none focus-visible:text-blue-500 whitespace-nowrap",
              isActive
                ? "border-b-blue-600 text-blue-600 dark:text-blue-400"
                : "border-b-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
            )}
          >
            {tab.icon && <span className="inline-block">{tab.icon}</span>}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

export const SauronTabs = createSauronComponent("SauronTabs", TabsComponent);
