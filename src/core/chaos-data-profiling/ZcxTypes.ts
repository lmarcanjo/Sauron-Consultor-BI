/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ZcxProposalStatus =
  | "GENERATED"
  | "UNDER_REVIEW"
  | "PARTIALLY_ACCEPTED"
  | "ACCEPTED"
  | "REJECTED"
  | "SUPERSEDED";

export type ZcxConfidenceTier = "HIGH" | "MEDIUM" | "LOW";

export type ZcxFieldCategory =
  | "essential"
  | "dimension"
  | "metric"
  | "date"
  | "identifier"
  | "description"
  | "technical"
  | "empty"
  | "ambiguous";

export interface ZcxFieldProposal {
  fieldId: string;
  physicalName: string;
  suggestedLabel: string;
  suggestedRole: string;
  confidence: number; // 0.0 to 1.0
  confidenceTier: ZcxConfidenceTier;
  category: ZcxFieldCategory;
  evidence: string[];
  autoSelected: boolean; // true if confidence >= 0.85
  inferredType: string;
  sampleValues: unknown[];
  containerId: string;
}

export type ZcxCapabilityModule = "Financeiro" | "Comercial" | "Pessoas" | "DRE" | "Comissão";

export type ZcxCapabilityStatus = "AVAILABLE" | "PROBABLE" | "NEEDS_CONFIRMATION" | "NOT_IDENTIFIED";

export interface ZcxCapabilityProposal {
  moduleName: ZcxCapabilityModule;
  status: ZcxCapabilityStatus;
  confidence: number;
  evidence: string[];
  missingFieldRoles?: string[];
}

export interface ZcxUnresolvedQuestion {
  questionId: string;
  title: string;
  description: string;
  scope: "source" | "container" | "block" | "field";
  targetFields: string[];
  options: { label: string; action: string; payload?: unknown }[];
  impact: string;
}

export interface ZcxProposal {
  proposalId: string;
  sourceId: string;
  profileId: string;
  groupId: string;
  companyId?: string;
  generatedAt: string;
  version: number;
  status: ZcxProposalStatus;
  sourceSummary: {
    totalRecords: number;
    totalFields: number;
    containersCount: number;
    blocksCount: number;
  };
  fieldProposals: ZcxFieldProposal[];
  capabilityProposals: ZcxCapabilityProposal[];
  unresolvedQuestions: ZcxUnresolvedQuestion[];
  overallConfidence: number;
  evidence: string[];
  warnings: string[];
}
