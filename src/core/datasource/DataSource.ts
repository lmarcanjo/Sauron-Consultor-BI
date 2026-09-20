import {
  OrganizationalScope,
  DataSourceMetadata,
  DataSourceLifecycleStatus,
  DataSourceHealthStatus,
  CanonicalDataState,
  SchemaVersion,
  ConsultantConfirmation,
  QualityProfile,
  SynchronizationSummary,
  ConnectionEvidence,
  QualityAnomaly,
  DataSourceOriginType
} from './types';

export interface CreateDataSourceParams {
  id?: string;
  engagementId: string;
  organizationalScope: OrganizationalScope;
  name: string;
  originType: DataSourceOriginType;
  format?: string;
  credentialReferenceId?: string;
  createdByUserId: string;
  createdByUserName?: string;
}

export class DataSource {
  readonly id: string;
  readonly engagementId: string;
  readonly organizationalScope: OrganizationalScope;
  readonly createdAt: string;
  readonly createdBy: string;

  private _metadata: DataSourceMetadata;
  private _lifecycleStatus: DataSourceLifecycleStatus;
  private _healthStatus: DataSourceHealthStatus;
  
  private _connectionEvidences: ConnectionEvidence[];
  private _isDiscovering: boolean;
  
  private _schemaHistory: SchemaVersion[];
  private _currentSchemaVersion: SchemaVersion | null;
  
  private _confirmation: ConsultantConfirmation | null;
  private _currentQualityProfile: QualityProfile | null;
  private _syncHistory: SynchronizationSummary[];
  
  private _archivedAt?: string;

  constructor(params: CreateDataSourceParams) {
    if (!params.engagementId || params.engagementId.trim().length === 0) {
      throw new Error("EngagementId é obrigatório para o DataSource.");
    }
    if (!params.organizationalScope || !params.organizationalScope.targetId) {
      throw new Error("OrganizationalScope com targetId válido é obrigatório.");
    }
    if (!params.name || params.name.trim().length === 0) {
      throw new Error("Nome do DataSource é obrigatório.");
    }

    const now = new Date().toISOString();
    this.id = params.id || `ds_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`;
    this.engagementId = params.engagementId;
    this.organizationalScope = { ...params.organizationalScope };
    this.createdAt = now;
    this.createdBy = params.createdByUserId;

    this._metadata = {
      name: params.name.trim(),
      originType: params.originType,
      format: params.format,
      credentialReferenceId: params.credentialReferenceId,
      firstConnectedAt: now,
      lastUpdatedAt: now
    };

    this._lifecycleStatus = "ACTIVE";
    this._healthStatus = "UNKNOWN";
    this._connectionEvidences = [];
    this._isDiscovering = false;
    this._schemaHistory = [];
    this._currentSchemaVersion = null;
    this._confirmation = null;
    this._currentQualityProfile = null;
    this._syncHistory = [];
  }

  // --- GETTERS SEGUROS ---

  get metadata(): DataSourceMetadata {
    return { ...this._metadata };
  }

  get lifecycleStatus(): DataSourceLifecycleStatus {
    return this._lifecycleStatus;
  }

  get healthStatus(): DataSourceHealthStatus {
    return this._healthStatus;
  }

  get isDiscovering(): boolean {
    return this._isDiscovering;
  }

  get currentSchemaVersion(): SchemaVersion | null {
    return this._currentSchemaVersion ? { ...this._currentSchemaVersion } : null;
  }

  get schemaHistory(): SchemaVersion[] {
    return [...this._schemaHistory];
  }

  get confirmation(): ConsultantConfirmation | null {
    return this._confirmation ? { ...this._confirmation } : null;
  }

  get currentQualityProfile(): QualityProfile | null {
    return this._currentQualityProfile ? { ...this._currentQualityProfile } : null;
  }

  get syncHistory(): SynchronizationSummary[] {
    return [...this._syncHistory];
  }

  get connectionEvidences(): ConnectionEvidence[] {
    return [...this._connectionEvidences];
  }

  get archivedAt(): string | undefined {
    return this._archivedAt;
  }

  // --- DERIVAÇÃO OFICIAL DO ESTADO CANÔNICO ---

  /**
   * O Estado Canônico é estritamente derivado e projetado a partir das evidências do agregado.
   * Não pode ser alterado por setters genéricos arbitrários.
   */
  get derivedCanonicalState(): CanonicalDataState {
    if (this._lifecycleStatus === "ARCHIVED" || this._connectionEvidences.length === 0) {
      return "NO_SOURCE";
    }

    if (this._isDiscovering) {
      return "DISCOVERING";
    }

    if (!this._currentSchemaVersion) {
      return "SOURCE_CONNECTED";
    }

    if (
      this._confirmation &&
      this._confirmation.confirmedSchemaVersion === this._currentSchemaVersion.versionNumber
    ) {
      return "READY";
    }

    return "WAITING_CONFIRMATION";
  }

  // --- MÉTODOS EXPLICITOS DE DOMÍNIO ---

  public registerConnectionEvidence(evidence: Omit<ConnectionEvidence, "evidenceId">): void {
    if (this._lifecycleStatus === "ARCHIVED") {
      throw new Error("Não é possível alterar uma fonte de dados arquivada.");
    }

    const newEvidence: ConnectionEvidence = {
      ...evidence,
      evidenceId: `ev_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`
    };

    this._connectionEvidences.push(newEvidence);
    this._healthStatus = "HEALTHY";
    this._metadata.lastUpdatedAt = new Date().toISOString();
  }

  public startDiscovery(): void {
    if (this._lifecycleStatus === "ARCHIVED") {
      throw new Error("Não é possível iniciar discovery em uma fonte arquivada.");
    }
    if (this._connectionEvidences.length === 0) {
      throw new Error("Não é possível iniciar discovery sem evidências prévias de conexão.");
    }

    this._isDiscovering = true;
    this._metadata.lastUpdatedAt = new Date().toISOString();
  }

  public completeDiscovery(newSchema: Omit<SchemaVersion, "versionNumber" | "generatedAt">): SchemaVersion {
    if (!this._isDiscovering) {
      throw new Error("Não é possível concluir discovery sem que ele tenha sido iniciado.");
    }

    const versionNumber = this._schemaHistory.length + 1;
    const schemaVersion: SchemaVersion = {
      ...newSchema,
      versionNumber,
      generatedAt: new Date().toISOString()
    };

    this._schemaHistory.push(schemaVersion);
    this._currentSchemaVersion = schemaVersion;
    this._isDiscovering = false;

    // Nova versão de schema invalida a confirmação da versão anterior
    if (this._confirmation && this._confirmation.confirmedSchemaVersion !== versionNumber) {
      this._confirmation = null;
    }

    this._metadata.lastUpdatedAt = new Date().toISOString();
    return schemaVersion;
  }

  public confirmCurrentSchema(userUserId: string, userName: string, notes?: string): void {
    if (this._lifecycleStatus === "ARCHIVED") {
      throw new Error("Não é possível confirmar schema em uma fonte arquivada.");
    }
    if (!this._currentSchemaVersion) {
      throw new Error("Não existe versão de schema vigente para confirmação.");
    }

    this._confirmation = {
      confirmedByUserId: userUserId,
      confirmedByUserName: userName,
      confirmedAt: new Date().toISOString(),
      confirmedSchemaVersion: this._currentSchemaVersion.versionNumber,
      notes
    };

    this._metadata.lastUpdatedAt = new Date().toISOString();
  }

  public setQualityProfile(profile: QualityProfile): void {
    this._currentQualityProfile = { ...profile };
    this._metadata.lastUpdatedAt = new Date().toISOString();
  }

  public registerSynchronization(sync: Omit<SynchronizationSummary, "synchronizationId">): void {
    const syncRecord: SynchronizationSummary = {
      ...sync,
      synchronizationId: `sync_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`
    };

    this._syncHistory.push(syncRecord);
    if (syncRecord.outcome === "FAILED") {
      this._healthStatus = "DEGRADED";
    } else {
      this._healthStatus = "HEALTHY";
    }
    this._metadata.lastUpdatedAt = new Date().toISOString();
  }

  public disable(): void {
    if (this._lifecycleStatus === "ARCHIVED") return;
    this._lifecycleStatus = "DISABLED";
    this._metadata.lastUpdatedAt = new Date().toISOString();
  }

  public enable(): void {
    if (this._lifecycleStatus === "ARCHIVED") return;
    this._lifecycleStatus = "ACTIVE";
    this._metadata.lastUpdatedAt = new Date().toISOString();
  }

  public archive(): void {
    this._lifecycleStatus = "ARCHIVED";
    this._archivedAt = new Date().toISOString();
    this._metadata.lastUpdatedAt = this._archivedAt;
  }
}
