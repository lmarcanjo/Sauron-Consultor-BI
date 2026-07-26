/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SourceInterpretationStatus =
  | "PROPOSED"
  | "CONFIRMED"
  | "EDITED"
  | "IGNORED"
  | "NEEDS_REVIEW";

export type InterpretationScope = "source" | "container" | "block" | "view";

export interface FieldInterpretation {
  fieldId: string;
  sourceId: string;
  containerId: string;
  blockId?: string;
  scope: InterpretationScope;
  physicalName: string; // IMMUTABLE
  originalType: string;
  sampleValues: unknown[];
  inferredType: string;
  suggestedLabel: string;
  suggestedMeaning?: string; // e.g. "Valor da movimentação" (OPCIONAL)
  suggestedDomain?: string;  // e.g. "Financeiro"
  suggestedProcess?: string; // e.g. "Faturamento"
  suggestedEntity?: string;  // e.g. "Transação"
  confidence: number;
  coverage: number;          // e.g. 0.98 for 98% non-null
  evidence: string[];
  consultantDecision?: "CONFIRMED" | "REJECTED" | "EDITED" | "KEEP_ORIGINAL";
  status: SourceInterpretationStatus;
  updatedAt: string;
}

export interface SourceDrivenStructure {
  structureId: string;
  containerId: string;
  title: string;
  probableDomain: string;
  recordCount: number;
  confidence: number;
  evidence: string[];
  fields: FieldInterpretation[];
}

export interface SourceDrivenAnalysis {
  sourceId: string;
  sourceName: string;
  generatedAt: string;
  totalRecords: number;
  totalFields: number;
  structures: SourceDrivenStructure[];
  interpretations: FieldInterpretation[];
  unresolvedMaterialQuestions: {
    questionId: string;
    title: string;
    description: string;
    targetFields: string[];
    impact: string;
  }[];
}
