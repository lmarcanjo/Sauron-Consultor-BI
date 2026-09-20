/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Module Activation Framework — Product Projection Contracts
 *
 * These are PURE PRODUCT projections, not enterprise aggregates.
 * No financial calculation logic. No DOM access.
 */

import type { PreliminaryFinancialAnalysisArtifact } from '../preliminary-analysis/PreliminaryFinancialAnalysisContracts';
import type { SemanticArtifact } from '../semantic/SemanticContracts';
import type { SemanticConfirmationArtifact } from '../semantic/confirmation/SemanticConfirmationContracts';
import type { PlatformUser } from '../identity/types';

export type ModuleId = 'FINANCIAL' | 'COMMERCIAL' | 'INVENTORY' | 'ITEMS' | 'AFTER_SALES';

export type ModuleActivationStatus =
  | 'ACTIVE'
  | 'REQUIRES_CONFIGURATION'
  | 'INSUFFICIENT_DATA'
  | 'BLOCKED'
  | 'ERROR';

export interface ModuleRequirement {
  readonly requirementId: string;
  readonly label: string;
  readonly description: string;
  readonly status: 'SATISFIED' | 'MISSING' | 'OPTIONAL';
  readonly matchingPhysicalFields: readonly string[];
}

export type ModulePrimaryAction =
  | 'OPEN_DASHBOARD'
  | 'CONFIGURE'
  | 'REVIEW_FIELDS'
  | 'CHANGE_SOURCE'
  | 'NONE';

export interface ModuleActivationProjection {
  readonly moduleId: ModuleId;
  readonly status: ModuleActivationStatus;
  readonly requirements: readonly ModuleRequirement[];
  readonly availableMetrics: readonly string[];
  readonly availableDimensions: readonly string[];
  readonly missingRequirements: readonly string[];
  readonly limitations: readonly string[];
  readonly primaryAction: ModulePrimaryAction;
  readonly sourceFileName: string;
  readonly lastUpdated: string;
}

export interface ModuleConfigurationRecord {
  readonly configurationId: string;
  readonly moduleId: ModuleId;
  readonly engagementId: string;
  readonly dataSourceId: string;
  readonly schemaVersionNumber: number;
  readonly selectedFields: readonly string[];
  readonly selectedMetrics: readonly string[];
  readonly selectedDimensions: readonly string[];
  readonly selectedFilters: Record<string, string>;
  readonly createdBy: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly fingerprint: string;
  readonly status: 'ACTIVE' | 'INVALIDATED';
}

export interface ModuleActivationInput {
  readonly engagementId: string;
  readonly dataSourceId: string;
  readonly preliminaryArtifact: PreliminaryFinancialAnalysisArtifact | null;
  readonly currentUserId: string;
  readonly configuration?: ModuleConfigurationRecord | null;
  readonly semanticArtifact?: SemanticArtifact | null;
  readonly confirmationArtifact?: SemanticConfirmationArtifact | null;
  readonly currentUser?: PlatformUser | null;
}
