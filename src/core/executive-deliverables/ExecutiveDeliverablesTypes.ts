/**
 * MVP-3 product projections. These contracts contain no business calculation.
 */

import type { ModuleActivationProjection } from "../module-activation/ModuleActivationContracts";
import type { PreliminaryFinancialAnalysisArtifact } from "../preliminary-analysis/PreliminaryFinancialAnalysisContracts";
import type { ExecutivePresentation } from "../business-intelligence/ExecutivePresentationEngine";
import type { WorkspaceProject } from "../../modules/consultant-workspace/types";

export type DeliverableType =
  | "EXECUTIVE_SUMMARY"
  | "FINANCIAL_DASHBOARD"
  | "DATA_QUALITY_REPORT"
  | "SOURCE_INVENTORY"
  | "COMMERCIAL_DASHBOARD"
  | "INVENTORY_DASHBOARD"
  | "ITEMS_DASHBOARD"
  | "AFTER_SALES_DASHBOARD"
  | "EXECUTIVE_PRESENTATION";

export type DeliverableStatus = "AVAILABLE" | "NOT_AVAILABLE" | "REQUIRES_CONFIGURATION" | "BLOCKED";
export type DeliverableAction = "OPEN" | "CONFIGURE" | "GENERATE" | "REANALYZE" | "NONE";

export interface AutomaticDeliverable {
  deliverableId: string;
  type: DeliverableType;
  status: DeliverableStatus;
  reason?: string;
  sourceArtifactIds: string[];
  generatedAt?: string;
  version?: number;
  action: DeliverableAction;
}

export interface AutomaticDeliverablesProjection {
  projectionId: string;
  engagementId: string;
  dataSourceId: string;
  sourceFingerprint: string;
  artifactFingerprint: string;
  artifactVersion: number;
  deliverables: AutomaticDeliverable[];
  generatedAt: string;
}

export interface ExecutiveDeliverablesInput {
  artifact: PreliminaryFinancialAnalysisArtifact;
  moduleProjections?: readonly ModuleActivationProjection[];
}

export interface ComposedExecutivePresentation {
  presentation: ExecutivePresentation;
  artifactId: string;
  artifactFingerprint: string;
  sourceFingerprint: string;
  engagementId: string;
  generatedAt: string;
  version: number;
}

export interface ExecutiveSnapshot {
  snapshotId: string;
  clientId: string;
  engagementId: string;
  dataSourceId: string;
  preliminaryArtifactId: string;
  presentationId: string;
  sourceFingerprint: string;
  artifactFingerprint: string;
  createdAt: string;
  createdBy: string;
  status: "CURRENT" | "OUTDATED";
  label: string;
  version: number;
}

export interface ExecutiveExportProvenance {
  engagementId: string;
  clientId: string;
  dataSourceId: string;
  preliminaryArtifactId: string;
  artifactFingerprint: string;
  sourceFingerprint: string;
  presentationId: string;
  presentationVersion: number;
  generatedAt: string;
  generatedByUserId: string;
  exportVersion: string;
}

export interface ExecutiveExportContext {
  artifact: PreliminaryFinancialAnalysisArtifact;
  project: WorkspaceProject;
  presentation: ExecutivePresentation;
  moduleProjections: readonly ModuleActivationProjection[];
}

export interface GeneratedExecutiveFile {
  fileName: string;
  mimeType: string;
  bytes: Uint8Array;
  provenance: ExecutiveExportProvenance;
}
