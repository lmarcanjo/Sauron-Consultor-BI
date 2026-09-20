import { PlatformUser } from '../../identity/types';

/**
 * Capacidades explícitas que um conector pode declarar e suportar no ASTERION.
 */
export type ConnectorCapability =
  | 'connect'
  | 'validate'
  | 'discover'
  | 'sample'
  | 'synchronize'
  | 'health'
  | 'metadata'
  | 'incrementalSync'
  | 'streaming'
  | 'schemaEvolution';

/**
 * Metadados formais do Conector.
 */
export interface ConnectorMetadata {
  id: string;
  name: string;
  version: string;
  provider: string;
  description?: string;
  originType: string;
  supportedCapabilities: ConnectorCapability[];
}

/**
 * Contexto de execução padronizado para operações de conectores.
 */
export interface ConnectorExecutionContext {
  engagementId: string;
  dataSourceId: string;
  user?: PlatformUser | null;
  correlationId?: string;
  parameters?: Record<string, any>;
}

/**
 * Contrato de Saúde Operacional.
 */
export interface ConnectorHealthResult {
  status: 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE';
  latencyMs?: number;
  message?: string;
  checkedAt: string;
  details?: Record<string, any>;
}

/**
 * Contrato de Validação de Estrutura e Credenciais.
 */
export interface ConnectorValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
  checkedAt: string;
}

/**
 * Contrato de Descoberta Semântica / Estrutural.
 */
export interface ConnectorDiscoveryResult {
  containers: Array<{
    id: string;
    name: string;
    type: 'table' | 'sheet' | 'endpoint' | 'file';
    rowCountEstimate?: number;
    columns: Array<{
      name: string;
      inferredType: string;
      nullable?: boolean;
    }>;
  }>;
  discoveredAt: string;
}

/**
 * Contrato de Sincronização.
 */
export interface ConnectorSyncParams {
  mode: 'FULL' | 'INCREMENTAL';
  cursor?: string;
  batchSize?: number;
}

export interface ConnectorSyncBatch {
  records: Record<string, any>[];
  recordsCount: number;
  hasMore: boolean;
  nextCursor?: string;
  fingerprint?: string;
}

/**
 * Contrato Principal (Interface Primária do Conector).
 */
export interface IAsterionConnector {
  readonly metadata: ConnectorMetadata;

  supportsCapability(capability: ConnectorCapability): boolean;

  connect(ctx: ConnectorExecutionContext): Promise<boolean>;

  disconnect(ctx: ConnectorExecutionContext): Promise<void>;

  checkHealth(ctx: ConnectorExecutionContext): Promise<ConnectorHealthResult>;

  validate(ctx: ConnectorExecutionContext): Promise<ConnectorValidationResult>;

  discover(ctx: ConnectorExecutionContext): Promise<ConnectorDiscoveryResult>;

  sample?(ctx: ConnectorExecutionContext, limit?: number): Promise<Record<string, any>[]>;

  synchronize?(ctx: ConnectorExecutionContext, params: ConnectorSyncParams): AsyncIterable<ConnectorSyncBatch>;
}
