/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { ConsultorAreaTab } from "./ConsultorAreaTab";

interface CasePlansPanelProps {
  filteredData: any[];
}

export const CasePlansPanel: React.FC<CasePlansPanelProps> = ({ filteredData }) => {
  return (
    <ConsultorAreaTab
      dataOrigem={filteredData}
    />
  );
};
