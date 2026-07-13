import { ActiveDataset } from "../../types/dataSource";

export type BusinessDomain =
  | "automotive"
  | "agribusiness"
  | "retail"
  | "services"
  | "finance"
  | "healthcare"
  | "education"
  | "construction"
  | "unknown";

export interface WorkbookFingerprint {
  workbookId: string;
  sourceName: string;
  sheetNames: string[];
  columnTokens: string[];
  formulaTokens: string[];
  namedRangeTokens: string[];
  structuralSignature: string;
  businessTerms: string[];
  createdAt: string;
}

export interface BusinessDomainClassification {
  domain: BusinessDomain;
  confidence: number;
  matchedTerms: string[];
  scores: Record<BusinessDomain, number>;
}

export interface Workspace {
  id: string;
  name: string;
  businessDomain: BusinessDomain;
  fingerprints: WorkbookFingerprint[];
  workbookIds: string[];
  createdAt: string;
  updatedAt: string;
  lastMappingsByModule: Record<string, unknown>;
  acceptedSuggestions: string[];
  ignoredSuggestions: string[];

  // F11.1 Domain properties
  detectedDomain?: string;
  detectedSubDomain?: string | null;
  domainConfidence?: number;
  domainPackId?: string;
  manualDomain?: string;
  enterpriseId?: string;
}

export interface WorkspaceRegistryState {
  workspaces: Record<string, Workspace>;
  currentWorkspaceId?: string;
  updatedAt: string;
}

export interface WorkspaceSimilarityResult {
  workspaceId: string;
  workspaceName: string;
  score: number;
  reason: string;
  matchingSignals: string[];
  conflictingSignals: string[];
}

export type ImportRecommendedAction =
  | "attach_to_current_workspace"
  | "create_new_workspace"
  | "choose_existing_workspace"
  | "open_temporarily";

export interface ImportDecisionOption {
  action: ImportRecommendedAction;
  label: string;
  workspaceId?: string;
  workspaceName?: string;
  reason: string;
}

export interface ImportDecision {
  recommendedAction: ImportRecommendedAction;
  confidence: number;
  reason: string;
  options: ImportDecisionOption[];
  warnings: string[];
  fingerprint: WorkbookFingerprint;
  domain: BusinessDomainClassification;
  similarities: WorkspaceSimilarityResult[];
  currentWorkspaceId?: string;
}

export interface WorkbookFingerprintInput {
  dataset: ActiveDataset;
  workbookId?: string;
  formulas?: string[];
  namedRanges?: string[];
}

export interface RegisterWorkbookDecisionInput {
  dataset: ActiveDataset;
  workbookId: string;
  decisionAction: ImportRecommendedAction;
  workspaceId?: string;
  workspaceName?: string;
  enterpriseId?: string;
}
