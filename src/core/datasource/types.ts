import { PlatformEventName } from '../events/PlatformEvents';

export type DataSourceOriginType =
  | "EXCEL"
  | "CSV"
  | "FILE"
  | "POSTGRESQL"
  | "MYSQL"
  | "SQL_SERVER"
  | "ORACLE"
  | "REST_API"
  | "GRAPHQL_API"
  | "ERP"
  | "CRM"
  | "OTHER";

export type ScopeType = "GROUP" | "COMPANY" | "UNIT";

export interface OrganizationalScope {
  scopeType: ScopeType;
  targetId: string;
}

export type CanonicalDataState =
  | "NO_SOURCE"
  | "SOURCE_CONNECTED"
  | "DISCOVERING"
  | "WAITING_CONFIRMATION"
  | "READY";

export type DataSourceLifecycleStatus = "ACTIVE" | "DISABLED" | "ARCHIVED";

export type DataSourceHealthStatus = "UNKNOWN" | "HEALTHY" | "DEGRADED" | "UNAVAILABLE";

export interface DataSourceMetadata {
  name: string;
  originType: DataSourceOriginType;
  format?: string;
  credentialReferenceId?: string;
  sizeBytes?: number;
  locationReference?: string;
  firstConnectedAt: string;
  lastUpdatedAt: string;
}

export interface SchemaVersion {
  versionNumber: number;
  containerProfiles: Array<{
    id: string;
    name: string;
    type: string;
    rowCount?: number;
    columnNames?: string[];
  }>;
  generatedAt: string;
}

export interface ConsultantConfirmation {
  confirmedByUserId: string;
  confirmedByUserName: string;
  confirmedAt: string;
  confirmedSchemaVersion: number;
  notes?: string;
}

export interface QualityAnomaly {
  anomalyType: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  description: string;
  affectedField?: string;
  detectedAt: string;
}

export interface QualityProfile {
  evaluatedRecordsCount: number;
  totalColumnsCount: number;
  nullsPercentage: number;
  typeDivergencesCount: number;
  anomalies: QualityAnomaly[];
  evaluatedAt: string;
  schemaVersionRef: number;
}

export interface SynchronizationSummary {
  synchronizationId: string;
  dataSourceId: string;
  startedAt: string;
  completedAt: string;
  outcome: "SUCCESS" | "PARTIAL_SUCCESS" | "FAILED";
  recordsRead: number;
  bytesRead: number;
  fingerprintOrChecksum?: string;
  schemaVersionGenerated?: number;
  actor: string;
  errorSummary?: string;
}

export interface ConnectionEvidence {
  evidenceId: string;
  connectedAt: string;
  connectedByUserId: string;
  summary: string;
}
