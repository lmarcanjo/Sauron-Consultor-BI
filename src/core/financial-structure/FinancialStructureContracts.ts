import { BusinessArtifact, AnalysisScope } from '../business-insight/BusinessArtifactContracts';
import { TrustArtifact, CertifiableUsageType } from '../trust/TrustContracts';
import { FieldSemanticDecision } from '../semantic/confirmation/SemanticConfirmationContracts';
import { PlatformUser } from '../identity/types';

export interface FinancialRecordInput {
  readonly recordId: string;
  readonly values: Record<string, number | string | null | undefined>;
}

export interface FinancialObservationInput {
  readonly user: PlatformUser;
  readonly scope: AnalysisScope;
  readonly trustArtifact: TrustArtifact;
  readonly semanticConfirmationDecisions: readonly FieldSemanticDecision[];
  readonly records: readonly FinancialRecordInput[];
  readonly trustUsage?: CertifiableUsageType;
  readonly options?: {
    readonly topN?: number;
  };
}

export interface FinancialStructureEngineMetadata {
  readonly engineId: string;
  readonly name: string;
  readonly version: string;
  readonly minimumSdkVersion: string;
  readonly supportedSdkVersions: readonly string[];
  readonly supportedCapabilities: readonly ('DESCRIPTIVE_ANALYSIS' | 'CONCENTRATION_ANALYSIS')[];
  readonly stability: 'STABLE';
}

import { CanonicalDataState } from '../datasource/types';
import { DataSource } from '../datasource/DataSource';
import { ActiveDataset } from '../../types/dataSource';
import { SemanticConfirmationArtifact } from '../semantic/confirmation/SemanticConfirmationContracts';

export interface FinancialObservationDatasetContextInput {
  readonly datasetId: string;
  readonly dataSourceId: string;
  readonly engagementId: string;
  readonly schemaVersionNumber: number;
  readonly containerId: string;
  readonly sourceFingerprint: string;
  readonly rawDataset?: ActiveDataset | null;
}

export type WorkspaceAvailability = 
  | 'NO_DATA'
  | 'PROCESSING'
  | 'REQUIRES_CONFIRMATION'
  | 'AVAILABLE'
  | 'BLOCKED';

export interface FinancialObservationContextProjection {
  readonly engagementId: string;
  readonly organizationalScope?: { readonly scopeType: string; readonly targetId: string };
  readonly dataSource: DataSource | null;
  readonly derivedCanonicalState: CanonicalDataState;
  readonly workspaceAvailability: WorkspaceAvailability;
  readonly schemaVersionNumber: number;
  readonly activeDataset: ActiveDataset | null;
  readonly semanticConfirmation: SemanticConfirmationArtifact | null;
  readonly confirmationArtifact?: SemanticConfirmationArtifact | null;
  readonly trustArtifact: TrustArtifact | null;
  readonly businessArtifact: BusinessArtifact | null;
  readonly artifactHistory: readonly BusinessArtifact[];
  readonly eligibleMonetaryFields: readonly string[];
  readonly eligibleTemporalFields: readonly string[];
  readonly eligibleCategoryFields: readonly string[];
  readonly blockingConditions: readonly string[];
  readonly limitations: readonly string[];
}

