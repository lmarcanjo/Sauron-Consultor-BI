/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { CaseHub } from "./CaseHub";

interface ExecutiveWorkspaceProps {
  filteredData: any[];
  activeFiles: any[];
  onSelectTab: (tabId: string) => void;
  formatCurrency: (value: number) => string;
}

export const ExecutiveWorkspace: React.FC<ExecutiveWorkspaceProps> = ({
  filteredData,
  activeFiles,
  onSelectTab,
  formatCurrency
}) => {
  return (
    <CaseHub
      filteredData={filteredData}
      activeFiles={activeFiles}
      onSelectTab={onSelectTab}
      formatCurrency={formatCurrency}
    />
  );
};
