/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ScopeType } from "../datasource/types";

export type PreliminaryFinancialAnalysisStatus =
  | "COMPLETED"
  | "COMPLETED_WITH_LIMITATIONS"
  | "BLOCKED"
  | "INVALIDATED";

export interface PreliminaryFinancialMetric {
  metricId: string;
  code: string;
  label: string;
  value: number;
  unit: string;
  sourcePhysicalName?: string;
  validInputCount: number;
  excludedInputCount: number;
  limitations: string[];
  provenance: {
    sourceId: string;
    workbookId: string;
    containerId: string;
    sheetName: string;
  };
}

export interface PreliminaryFinancialGroupingItem {
  physicalValue: string;
  displayName: string;
  recordCount: number;
  valueTotal: number;
  paidValueTotal: number;
  balanceTotal: number;
  sourceRecordIdentities: string[];
  limitations: string[];
}

export interface PreliminaryFinancialGrouping {
  dimensionCode: string;
  dimensionLabel: string;
  sourcePhysicalName: string;
  totalGroupCount: number;
  includedGroupCount: number;
  truncated: boolean;
  items: PreliminaryFinancialGroupingItem[];
}

export interface PreliminaryFinancialTemporalSeriesItem {
  periodKey: string; // e.g. "2026-05"
  recordCount: number;
  valueTotal: number;
  paidValueTotal: number;
  balanceTotal: number;
}

export interface PreliminaryFinancialTemporalSeries {
  seriesCode: string;
  seriesLabel: string;
  sourcePhysicalName: string;
  items: PreliminaryFinancialTemporalSeriesItem[];
}

export interface PreliminaryFinancialQualityFinding {
  id: string;
  code: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  message: string;
  physicalRowIndex?: number;
  physicalColumnName?: string;
  invalidValue?: string;
}

export interface PreliminaryFinancialLimitation {
  code: string;
  message: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
}

export interface PreliminaryFieldUsage {
  physicalName: string;
  physicalColumnIndex: number;
  displayName: string;
  usageStatus: "USED" | "IGNORED";
  semanticRole?: string;
  limitationCode?: string;
}

export interface PreliminaryFinancialAnalysisArtifact {
  artifactId: string;
  artifactVersion: number;
  analysisMode: "PRELIMINARY";
  clientId: string;
  engagementId: string;
  organizationalScope: {
    scopeType: ScopeType;
    targetId: string;
  };
  dataSourceId: string;
  workbookId: string;
  containerId: string; // e.g. sheet name
  sourceFileName: string;
  sourceFingerprint: string;
  schemaVersionNumber: number;
  
  // Row counts reconciliation equation
  physicalRowCount: number;
  headerRowCount: number;
  dataRowCount: number;
  validRowCount: number;
  partiallyValidRowCount: number;
  excludedRowCount: number;
  emptyRowCount: number;
  
  columnCount: number;
  physicalFields: PreliminaryFieldUsage[];
  fieldUsages: Record<string, string>; // Maps semantic key to physical column name
  
  metrics: PreliminaryFinancialMetric[];
  groupings: PreliminaryFinancialGrouping[];
  temporalSeries: PreliminaryFinancialTemporalSeries[];
  qualityFindings: PreliminaryFinancialQualityFinding[];
  limitations: PreliminaryFinancialLimitation[];
  
  policyId: string;
  policyVersion: string;
  policyFingerprint: string;
  engineVersion: string;
  
  provenance: {
    generatedAt: string;
    generatedByUserId: string;
    algorithm: string;
  };
  fingerprint: string;
  generatedAt: string;
  generatedByUserId: string;
  status: PreliminaryFinancialAnalysisStatus;
}
