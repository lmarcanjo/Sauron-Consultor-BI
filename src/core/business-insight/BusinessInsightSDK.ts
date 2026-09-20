import { BusinessArtifact, BusinessInsightCapability, AnalysisScope } from './BusinessArtifactContracts';
import { TrustArtifact, CertifiableUsageType } from '../trust/TrustContracts';
import { PlatformUser } from '../identity/types';

export const BUSINESS_INSIGHT_SDK_VERSION = '1.0.0';

export type EngineStability = 'EXPERIMENTAL' | 'BETA' | 'STABLE' | 'DEPRECATED';

export interface BusinessInsightEngineMetadata {
  readonly engineId: string;
  readonly name: string;
  readonly version: string;
  readonly minimumSdkVersion: string;
  readonly supportedSdkVersions: readonly string[];
  readonly supportedCapabilities: readonly BusinessInsightCapability[];
  readonly requiredTrustUsage: CertifiableUsageType;
  readonly supportedScopes: readonly ('ENGAGEMENT' | 'GROUP' | 'COMPANY' | 'UNIT' | 'DATA_SOURCE' | 'CONTAINER')[];
  readonly stability: EngineStability;
}

export interface BusinessInsightExecutionContext {
  readonly user: PlatformUser;
  readonly scope: AnalysisScope;
  readonly trustArtifact: TrustArtifact;
  readonly requiredCapability: BusinessInsightCapability;
  readonly options?: Record<string, any>;
}

export interface BusinessInsightExecutionResult {
  readonly success: boolean;
  readonly artifact?: BusinessArtifact;
  readonly error?: Error;
  readonly executionDurationMs: number;
}

export interface IAsterionBusinessInsightEngine {
  readonly metadata: BusinessInsightEngineMetadata;
  execute(context: BusinessInsightExecutionContext): Promise<BusinessInsightExecutionResult>;
}

export type BusinessInsightErrorCode =
  | 'BUSINESS_ENGINE_NOT_FOUND'
  | 'DUPLICATE_BUSINESS_ENGINE'
  | 'INCOMPATIBLE_ENGINE_VERSION'
  | 'UNSUPPORTED_CAPABILITY'
  | 'UNSUPPORTED_TRUST_USAGE'
  | 'TRUST_USAGE_NOT_ALLOWED'
  | 'TRUST_ARTIFACT_BLOCKED'
  | 'TRUST_ARTIFACT_INVALIDATED'
  | 'INSUFFICIENT_GOVERNED_INPUT'
  | 'INCOMPATIBLE_ARTIFACTS'
  | 'INVALID_ANALYSIS_SCOPE'
  | 'INVALID_COMPARISON'
  | 'MISSING_PROVENANCE'
  | 'LIMITATION_PROPAGATION_REQUIRED'
  | 'BUSINESS_POLICY_VIOLATION';

export class BusinessInsightError extends Error {
  readonly code: BusinessInsightErrorCode;

  constructor(code: BusinessInsightErrorCode, message: string) {
    super(`[BusinessInsightSDK] ${code}: ${message}`);
    this.name = 'BusinessInsightError';
    this.code = code;
  }
}
