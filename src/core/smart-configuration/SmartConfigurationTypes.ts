import { ActiveDataset } from "../../types/dataSource";
import { WorkbookCatalog } from "../workbook";
import {
  BusinessDomainClassification,
  WorkbookFingerprint,
} from "../workspace-intelligence";
import { ModuleFieldMapping, ModuleName } from "../data/moduleMapping";

export type SmartSuggestionSource = "heuristic" | "workspace_memory" | "mixed";
export type SmartSuggestionStatus = "suggested" | "review_only";

export interface ColumnRoleSuggestion {
  column: string;
  semanticRole: string;
  label: string;
  confidence: number;
  evidence: string[];
  source: SmartSuggestionSource;
}

export interface ModuleMappingSuggestion {
  id: string;
  moduleName: ModuleName;
  sheetName: string;
  selectedColumns: string[];
  semanticRoles: Record<string, string>;
  confidence: number;
  source: SmartSuggestionSource;
  status: SmartSuggestionStatus;
  reasons: string[];
  warnings: string[];
  columnSuggestions: ColumnRoleSuggestion[];
}

export interface SmartConfigurationContext {
  activeDataset: ActiveDataset;
  workbookId?: string;
  workspaceId?: string;
  projectId?: string;
  fingerprint?: WorkbookFingerprint;
  workbookCatalog?: WorkbookCatalog;
}

export interface SmartConfigurationPlan {
  id: string;
  datasetId: string;
  projectId: string;
  workbookId?: string;
  workspaceId?: string;
  domain: BusinessDomainClassification;
  fingerprint: WorkbookFingerprint;
  suggestions: ModuleMappingSuggestion[];
  overallConfidence: number;
  reviewRequired: boolean;
  warnings: string[];
  generatedAt: string;
}

export interface ApplySmartConfigurationOptions {
  modules?: ModuleName[];
  minConfidence?: number;
  includeReviewOnly?: boolean;
}

export interface ApplySmartConfigurationResult {
  appliedMappings: ModuleFieldMapping[];
  skippedSuggestions: ModuleMappingSuggestion[];
  acceptedSuggestionIds: string[];
}

export interface WorkspaceModuleMappingMemory {
  moduleName: ModuleName;
  sheetName: string;
  selectedColumns: string[];
  semanticRoles: Record<string, string>;
  sourceSuggestionId?: string;
  updatedAt: string;
}
