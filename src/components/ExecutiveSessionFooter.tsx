/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

interface ExecutiveSessionFooterProps {
  clientName: string;
}

export const ExecutiveSessionFooter: React.FC<ExecutiveSessionFooterProps> = ({ clientName }) => {
  return (
    <footer className="h-8 border-t border-slate-900 bg-slate-950/90 px-6 flex items-center justify-between text-[10px] text-slate-500 font-mono shrink-0">
      <span>SAURON OPERATING PLATFORM • SECURE SESSION</span>
      <span>{clientName.toUpperCase()} • V0.6.5</span>
    </footer>
  );
};
