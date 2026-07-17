/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { platformLogger } from "../platform/PlatformLogger";

/**
 * ============================================================================
 * FOUNDATION F3 — SAURON INTEGRATION PLATFORM SDK CONTRACTS
 * ============================================================================
 * This file defines the core, decoupled interfaces, types, and schemas for the 
 * Sauron Integration Platform. All future ERP, database, file, and custom API 
 * connectors must comply with these strict specifications.
 */

/**
 * Standard types of data sources supported by the Sauron Platform.
 */
export type DataSourceType =
  | "ERP"             // e.g., SAP, Totvs, Senior, QuickBooks
  | "DATABASE"        // e.g., PostgreSQL, SQL Server, MySQL, Oracle, MongoDB
  | "REST_API"        // Custom SaaS Webhooks/APIs
  | "FILE_SFTP"       // SFTP or FTPS file exchanges
  | "FILE_CLOUD"      // GCS, AWS S3, or Google Drive CSV/Excel files
  | "OAUTH_SERVICE";  // Third-party OAuth services (Fitbit, Strava, Stripe, etc.)

/**
 * Unified execution context passed to all connector operations.
 */
export interface ConnectorContext {
  tenantId: string;
  organizationId: string;
  workspaceId: string;
  correlationId: string;
  userEmail: string;
  environment: "development" | "staging" | "production";
}

/**
 * Connection Configuration parameters supplied by the central Credential Vault.
 */
export interface SecureConnectionParams {
  connectorId: string;
  host?: string;
  port?: number;
  username?: string;
  encryptedPassword?: string; // Always processed as a vault reference
  apiKey?: string;
  apiSecret?: string;
  authToken?: string;
  sslEnabled: boolean;
  sshTunnelEnabled: boolean;
  sshConfig?: {
    sshHost: string;
    sshPort: number;
    sshUser: string;
    privateKeyVaultKey: string;
  };
  additionalParams?: Record<string, string | number | boolean>;
}

/**
 * Health Report returned by connector diagnostic checks.
 */
export interface ConnectorHealthReport {
  connectorId: string;
  status: "healthy" | "degraded" | "unreachable" | "auth_error";
  latencyMs: number;
  availableEndpoints: string[];
  lastCheckedAt: string;
  errorMessage?: string;
  diagnosticDetails?: Record<string, any>;
}

/**
 * Structural definition of discovered schema items (e.g., database tables or ERP endpoints).
 */
export interface DiscoveredSchema {
  entityName: string;
  type: "table" | "view" | "collection" | "endpoint";
  fields: {
    name: string;
    dataType: string;
    nullable: boolean;
    isPrimaryKey: boolean;
  }[];
  rowCountEstimate?: number;
}

/**
 * Sync configurations for data ingestion.
 */
export interface SyncOptions {
  mode: "incremental" | "complete";
  batchSize: number;
  cursorField?: string;
  cursorValue?: string;
  forceSyncAll: boolean;
}

/**
 * Ingestion Task Progress update interface.
 */
export interface IngestionProgress {
  jobId: string;
  recordsProcessed: number;
  recordsFailed: number;
  percentComplete: number;
  currentStage: string;
  updatedAt: string;
}

/**
 * F3-A: CONNECTOR SDK CONTRACT
 * 
 * Every connector must implement this base lifecycle interface. This guarantees
 * uniform deployment, lifecycle automation, and complete independence from the Core.
 */
export interface ISauronConnector {
  /**
   * Type of data source this connector interfaces with.
   */
  readonly type: DataSourceType;

  /**
   * Human-friendly name and version of the connector.
   */
  readonly metadata: {
    name: string;
    version: string;
    author: string;
    description: string;
  };

  /**
   * Authenticate with the target ERP/database.
   * Exposes whether handshake succeeded and stores temporary session context safely inside memory.
   */
  authenticate(params: SecureConnectionParams, ctx: ConnectorContext): Promise<boolean>;

  /**
   * Discover and catalog available datasets, endpoints, or tables.
   */
  discover(ctx: ConnectorContext): Promise<DiscoveredSchema[]>;

  /**
   * Dry-run validation check. Confirms all required permissions, firewall policies,
   * schema requirements, and configurations are intact before beginning a real ingestion.
   */
  validate(schema: DiscoveredSchema[], ctx: ConnectorContext): Promise<{ isValid: boolean; warnings: string[]; errors: string[] }>;

  /**
   * Begin pulling data. Returns a generator/stream of unstructured ingestion payloads.
   */
  sync(options: SyncOptions, ctx: ConnectorContext): AsyncGenerator<Record<string, any>[], void, unknown>;

  /**
   * Safely terminate active client instances, database pools, tunnels, and secure memory stores.
   */
  disconnect(ctx: ConnectorContext): Promise<void>;

  /**
   * Perform a quick ping / heartbeat check to determine target health and network latency.
   */
  health(ctx: ConnectorContext): Promise<ConnectorHealthReport>;
}

/**
 * F3-D: CREDENTIAL VAULT CONTRACT
 * 
 * Secure wrapper preventing connectors from accessing or persisting credentials directly.
 */
export interface ICredentialVault {
  /**
   * Retrieves decrypted connection parameters for a secure connector.
   * Restricts decryption purely to high-isolation server runtimes.
   */
  getCredentials(connectorId: string, ctx: ConnectorContext): Promise<SecureConnectionParams>;

  /**
   * Securely saves or updates encrypted credentials.
   */
  saveCredentials(connectorId: string, params: SecureConnectionParams, ctx: ConnectorContext): Promise<void>;

  /**
   * Rotates credentials or tokens dynamically.
   */
  rotateCredentials(connectorId: string, ctx: ConnectorContext): Promise<void>;
}

/**
 * F3-F: CANONICAL DATA CONTRACTS
 * 
 * These standardized models represent the baseline fields required by Sauron's Core Engines.
 * Connectors must map their custom ERP formats into these canonical structures during 
 * the Transformation phase.
 */

export interface CanonicalRevenue {
  id: string;
  sourceSystem: string;
  companyCnpj: string;
  branchCode: string;
  costCenterId: string;
  fiscalPeriod: string; // YYYY-MM
  grossRevenue: number;
  netRevenue: number;
  deductions: number;
  taxesPaid: number;
  currency: string;
  extractedAt: string;
}

export interface CanonicalCOGS {
  id: string;
  sourceSystem: string;
  companyCnpj: string;
  branchCode: string;
  costCenterId: string;
  fiscalPeriod: string; // YYYY-MM
  costOfGoodsSold: number;
  rawMaterialsCost: number;
  directLaborCost: number;
  manufacturingOverhead: number;
  currency: string;
  extractedAt: string;
}

export interface CanonicalMargin {
  id: string;
  sourceSystem: string;
  companyCnpj: string;
  branchCode: string;
  costCenterId: string;
  fiscalPeriod: string; // YYYY-MM
  contributionMarginValue: number;
  contributionMarginPercent: number;
  variableExpenses: number;
  extractedAt: string;
}

export interface CanonicalCostCenter {
  id: string;
  sourceSystem: string;
  code: string;
  name: string;
  managerName?: string;
  parentCostCenterCode?: string;
  departmentName?: string;
  isActive: boolean;
}

export interface CanonicalClient {
  id: string;
  sourceSystem: string;
  name: string;
  cnpjOrCpf: string;
  industrySegment?: string;
  region: string;
  creditLimit: number;
  isActive: boolean;
}

export interface CanonicalSalesRepresentative {
  id: string;
  sourceSystem: string;
  employeeId?: string;
  fullName: string;
  region: string;
  monthlyTarget: number;
  commissionRate: number;
  totalSalesAchieved: number;
  accruedCommissions: number;
}

/**
 * F3-C: DATA LINEAGE & INGESTION FLOW SCHEMAS
 * 
 * Tracks the raw source data journey to guarantee absolute auditable calculations.
 */
export interface DataLineageRecord {
  lineageId: string;
  jobId: string;
  sourceSystem: string;
  extractedFromTableOrEndpoint: string;
  sourceRecordId: string;
  targetRecordId: string;
  transformationRulesApplied: string[];
  operatorEmail: string;
  timestamp: string;
}

/**
 * F3-E: SYNC ENGINE retry rules & DLQ
 */
export interface DeadLetterQueueEntry {
  id: string;
  jobId: string;
  connectorId: string;
  rawPayload: Record<string, any>;
  failureReason: string;
  stackTrace?: string;
  capturedAt: string;
  retryAttempts: number;
  status: "unresolved" | "retried" | "discarded";
}

/**
 * F3-H: OBSERVABILITY (Sauron Observatory™ Integration)
 */
export interface IntegrationObservabilityMetrics {
  connectorId: string;
  tenantId: string;
  lastSuccessfulSyncAt: string;
  averageExecutionDurationSeconds: number;
  networkLatencyMs: number;
  currentAvailabilityRate: number; // 0.0 to 1.0
  consecutiveFailuresCount: number;
  totalRecordsIngested: number;
  dataQualityIssuesDetected: number;
  healthStatus: "healthy" | "degraded" | "failing";
}

/**
 * Base abstract wrapper for running high-integrity ingestion jobs.
 */
export abstract class BaseSyncJobExecutor {
  /**
   * F3-C: Ingest Pipeline sequence.
   * Every connector must follow this pipeline sequencing exactly.
   */
  public async executePipeline(
    connector: ISauronConnector,
    params: SecureConnectionParams,
    options: SyncOptions,
    ctx: ConnectorContext
  ): Promise<{ success: boolean; totalRecords: number; errorsCount: number }> {
    platformLogger.info(`[IntegrationPipeline] Starting pipeline for ${connector.metadata.name}, Correlation: ${ctx.correlationId}`);
    
    let totalRecords = 0;
    let errorsCount = 0;

    try {
      // 1. Authenticate stage
      const isAuthenticated = await connector.authenticate(params, ctx);
      if (!isAuthenticated) {
        throw new Error("[Pipeline-Auth] Handshake failed or authentication rejected by target server.");
      }

      // 2. Discover & Validate Stage
      const schemas = await connector.discover(ctx);
      const validation = await connector.validate(schemas, ctx);
      if (!validation.isValid) {
        throw new Error(`[Pipeline-Validation] Structural constraints failed: ${validation.errors.join("; ")}`);
      }

      // 3. Ingestion Sync Stream loop (Download -> Validate -> Transform -> Normalize -> DataQuality -> Lineage -> Persist -> Notify)
      const dataStream = connector.sync(options, ctx);

      for await (const rawBatch of dataStream) {
        // Download / Capture stage complete (data loaded in memory batch)
        
        // Transform, Normalize & Quality validation phase
        const normalizedBatch: any[] = [];
        for (const rawRecord of rawBatch) {
          try {
            // Transform & Normalize Step
            const normalized = this.transformAndNormalize(rawRecord, connector.type);
            
            // Data Quality checks
            const isQualityOk = this.checkDataQualityRules(normalized);
            if (!isQualityOk) {
              await this.handleDeadLetter(rawRecord, "Failed Data Quality rules validation", ctx);
              errorsCount++;
              continue;
            }

            // Data Lineage tracking
            const lineage = this.trackLineage(rawRecord, normalized, ctx);
            normalizedBatch.push({ record: normalized, lineage });
            totalRecords++;
          } catch (transformErr: any) {
            await this.handleDeadLetter(rawRecord, `Transformation error: ${transformErr.message}`, ctx);
            errorsCount++;
          }
        }

        // Persist stage
        if (normalizedBatch.length > 0) {
          await this.persistToStaging(normalizedBatch, ctx);
        }
      }

      // Notify stage
      await this.dispatchCompletionNotification(totalRecords, errorsCount, ctx);
      
      return { success: true, totalRecords, errorsCount };
    } catch (pipelineError: any) {
      console.error(`[IntegrationPipeline] CRITICAL PIPELINE FAILURE: ${pipelineError.message}`);
      await this.dispatchFailureNotification(pipelineError.message, ctx);
      return { success: false, totalRecords, errorsCount };
    } finally {
      await connector.disconnect(ctx);
    }
  }

  // --- Pipeline Abstract Hooks to be implemented by Platform runtime ---
  protected abstract transformAndNormalize(rawRecord: Record<string, any>, source: DataSourceType): any;
  protected abstract checkDataQualityRules(normalizedRecord: any): boolean;
  protected abstract trackLineage(raw: Record<string, any>, normalized: any, ctx: ConnectorContext): DataLineageRecord;
  protected abstract persistToStaging(batch: { record: any; lineage: DataLineageRecord }[], ctx: ConnectorContext): Promise<void>;
  protected abstract handleDeadLetter(rawRecord: Record<string, any>, reason: string, ctx: ConnectorContext): Promise<void>;
  protected abstract dispatchCompletionNotification(total: number, errors: number, ctx: ConnectorContext): Promise<void>;
  protected abstract dispatchFailureNotification(errorMessage: string, ctx: ConnectorContext): Promise<void>;
}
