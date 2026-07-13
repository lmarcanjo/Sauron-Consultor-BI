/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * F15.1 — Enterprise Consolidation & Context Navigation
 * EnterpriseContextTypes.ts — Definições de tipos de contexto empresarial único.
 */

export interface EnterpriseContext {
  groupId?: string;
  companyId?: string;
  unitId?: string;
  workspaceId?: string;
  workbookIds: string[];
  datasetIds: string[];
  period?: {
    start?: string;
    end?: string;
  };
  scope: "GROUP" | "COMPANY" | "UNIT" | "WORKBOOK";
}

export interface ConsolidationCompatibility {
  compatible: boolean;
  message: string;
  incompatibleSources: string[];
  sharedColumns: string[];
}

export interface ContextLineage {
  scope: string;
  sources: Array<{
    workbookId: string;
    name: string;
    enterpriseId: string;
    enterpriseName: string;
    rowCount: number;
  }>;
  mappedColumns: string[];
}
