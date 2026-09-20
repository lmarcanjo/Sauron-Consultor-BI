import { DataSource } from './DataSource';
import { DataSourceRepository } from './DataSourceRepository';
import { LocalDataSourceRepository } from './LocalDataSourceRepository';
import { DataSourceOriginType, OrganizationalScope, QualityProfile, SynchronizationSummary, SchemaVersion } from './types';
import { WorkspaceRepository } from '../../modules/consultant-workspace/WorkspaceRepository';
import { OrganizationService } from '../../modules/consultant-workspace/OrganizationService';
import { identityEngine } from '../identity/IdentityEngine';
import { PlatformUser } from '../identity/types';
import { auditEngine } from '../audit/AuditEngine';
import { dispatchPlatformEvent } from '../events/PlatformEvents';
import { EnterpriseRepository, SourceEnterpriseBinding } from '../persistence/EnterpriseRepository';

export interface CreateDataSourceDTO {
  engagementId: string;
  organizationalScope: OrganizationalScope;
  name: string;
  originType: DataSourceOriginType;
  format?: string;
  credentialReferenceId?: string;
}

export class DataSourceService {
  private workspaceRepository: WorkspaceRepository;
  private organizationService: OrganizationService;
  private enterpriseRepository: EnterpriseRepository;

  constructor(
    private repository: DataSourceRepository = new LocalDataSourceRepository(),
    workspaceRepository?: WorkspaceRepository,
    organizationService?: OrganizationService,
    enterpriseRepository?: EnterpriseRepository
  ) {
    this.workspaceRepository = workspaceRepository || new WorkspaceRepository();
    this.organizationService = organizationService || new OrganizationService();
    this.enterpriseRepository = enterpriseRepository || new EnterpriseRepository();
  }

  /**
   * Valida autorização do consultor para o Engajamento especificado
   */
  private async validateEngagementAccess(engagementId: string, user: PlatformUser | null): Promise<void> {
    if (!engagementId || engagementId.trim().length === 0) {
      throw new Error("EngagementId é obrigatório para o DataSource.");
    }
    const currentUser = user !== undefined ? user : identityEngine.getCurrentUser();
    if (!currentUser) return;

    const project = await this.workspaceRepository.getProject(engagementId);
    if (project) {
      if (project.assignedConsultantId && project.assignedConsultantId !== currentUser.id && currentUser.role !== 'SUPER_ADMIN') {
        throw new Error(`Acesso negado ao engajamento ID ${engagementId}.`);
      }
    }
  }

  /**
   * Valida o escopo organizacional pertencente ao Engajamento
   */
  private async validateOrganizationalScope(engagementId: string, scope: OrganizationalScope): Promise<void> {
    if (!scope || !scope.scopeType || !scope.targetId) {
      throw new Error("O Escopo Organizacional (scopeType e targetId) é obrigatório.");
    }

    if (scope.scopeType === "GROUP") {
      const group = (await this.organizationService.getEnterpriseById(scope.targetId)) as any;
      if (!group || group.type !== "Grupo") {
        throw new Error(`Grupo Econômico ID ${scope.targetId} não existe.`);
      }
      if (group.archived) {
        throw new Error(`Não é possível vincular fonte a um Grupo Econômico arquivado.`);
      }
      if (group.engagementId && group.engagementId !== engagementId) {
        throw new Error(`O Grupo Econômico alvo pertence a outro Engajamento.`);
      }
    } else if (scope.scopeType === "COMPANY") {
      const company = (await this.organizationService.getEnterpriseById(scope.targetId)) as any;
      if (!company || company.type === "Grupo") {
        throw new Error(`Empresa ID ${scope.targetId} não existe.`);
      }
      if (company.archived) {
        throw new Error(`Não é possível vincular fonte a uma Empresa arquivada.`);
      }
      if (company.engagementId && company.engagementId !== engagementId) {
        throw new Error(`A Empresa alvo pertence a outro Engajamento.`);
      }
    } else if (scope.scopeType === "UNIT") {
      const unit = (await this.organizationService.getEnterpriseById(scope.targetId)) as any;
      if (!unit) {
        throw new Error(`Unidade Operacional ID ${scope.targetId} não existe.`);
      }
      if (unit.archived) {
        throw new Error(`Não é possível vincular fonte a uma Unidade Operacional arquivada.`);
      }
      if (unit.engagementId && unit.engagementId !== engagementId) {
        throw new Error(`A Unidade Operacional alvo pertence a outro Engajamento.`);
      }
    } else {
      throw new Error(`Tipo de escopo organizacional inválido: ${scope.scopeType}`);
    }
  }

  // --- MÉTODOS DE APLICAÇÃO ---

  async registerDataSource(dto: CreateDataSourceDTO, user?: PlatformUser | null): Promise<DataSource> {
    const currentUser = user !== undefined ? user : identityEngine.getCurrentUser();
    await this.validateEngagementAccess(dto.engagementId, currentUser);
    await this.validateOrganizationalScope(dto.engagementId, dto.organizationalScope);

    const dataSource = new DataSource({
      engagementId: dto.engagementId,
      organizationalScope: dto.organizationalScope,
      name: dto.name,
      originType: dto.originType,
      format: dto.format,
      credentialReferenceId: dto.credentialReferenceId,
      createdByUserId: currentUser?.id || "u-consultant",
      createdByUserName: currentUser?.profile?.fullName || "Consultor"
    });

    await this.repository.save(dataSource);

    auditEngine.logEvent("DATA_SOURCE_REGISTERED", `Fonte de dados "${dataSource.metadata.name}" registrada no Engajamento ${dto.engagementId}`, "INFO", {
      user: currentUser?.profile?.fullName || currentUser?.id,
      count: 1
    });
    dispatchPlatformEvent("DATA_SOURCE_STATE_CHANGED", { dataSourceId: dataSource.id, action: "REGISTERED" });

    return dataSource;
  }

  async getDataSourceById(id: string, user?: PlatformUser | null): Promise<DataSource | null> {
    const currentUser = user !== undefined ? user : identityEngine.getCurrentUser();
    const dataSource = await this.repository.findById(id);
    if (!dataSource) return null;

    await this.validateEngagementAccess(dataSource.engagementId, currentUser);
    return dataSource;
  }

  async listDataSourcesByEngagement(engagementId: string, user?: PlatformUser | null): Promise<DataSource[]> {
    const currentUser = user !== undefined ? user : identityEngine.getCurrentUser();
    await this.validateEngagementAccess(engagementId, currentUser);
    return await this.repository.findByEngagement(engagementId);
  }

  async listDataSourcesByScope(scopeType: string, targetId: string, user?: PlatformUser | null): Promise<DataSource[]> {
    const currentUser = user !== undefined ? user : identityEngine.getCurrentUser();
    const list = await this.repository.findByOrganizationalScope(scopeType, targetId);
    if (list.length > 0) {
      await this.validateEngagementAccess(list[0].engagementId, currentUser);
    }
    return list;
  }

  /**
   * Creates the canonical source-to-organization relation after a DataSource
   * has been registered. UI/import code never writes the binding repository.
   */
  async bindImportedSource(
    dataSourceId: string,
    workbookId: string,
    datasetId: string,
    workspaceId: string | undefined,
    user?: PlatformUser | null
  ): Promise<SourceEnterpriseBinding> {
    const currentUser = user !== undefined ? user : identityEngine.getCurrentUser();
    const dataSource = await this.getDataSourceById(dataSourceId, currentUser);
    if (!dataSource) throw new Error(`DataSource ID ${dataSourceId} não encontrado.`);

    return this.enterpriseRepository.bindSource({
      sourceId: dataSourceId,
      workbookId,
      datasetId,
      workspaceId,
      groupId: dataSource.organizationalScope.scopeType === "GROUP"
        ? dataSource.organizationalScope.targetId
        : undefined,
      companyId: dataSource.organizationalScope.scopeType === "COMPANY"
        ? dataSource.organizationalScope.targetId
        : undefined,
      unitId: dataSource.organizationalScope.scopeType === "UNIT"
        ? dataSource.organizationalScope.targetId
        : undefined,
      scopeType: dataSource.organizationalScope.scopeType,
    });
  }

  async registerConnectionEvidence(id: string, summary: string, user?: PlatformUser | null): Promise<DataSource> {
    const currentUser = user !== undefined ? user : identityEngine.getCurrentUser();
    const dataSource = await this.getDataSourceById(id, currentUser);
    if (!dataSource) throw new Error(`DataSource ID ${id} não encontrado.`);

    dataSource.registerConnectionEvidence({
      connectedAt: new Date().toISOString(),
      connectedByUserId: currentUser?.id || "u-consultant",
      summary
    });

    await this.repository.save(dataSource);

    auditEngine.logEvent("DATA_SOURCE_CONNECTED", `Evidência de conexão registrada para a fonte "${dataSource.metadata.name}"`, "INFO", {
      user: currentUser?.profile?.fullName || currentUser?.id
    });
    dispatchPlatformEvent("DATA_SOURCE_STATE_CHANGED", { dataSourceId: dataSource.id, action: "CONNECTED" });

    return dataSource;
  }

  async startDiscovery(id: string, user?: PlatformUser | null): Promise<DataSource> {
    const currentUser = user !== undefined ? user : identityEngine.getCurrentUser();
    const dataSource = await this.getDataSourceById(id, currentUser);
    if (!dataSource) throw new Error(`DataSource ID ${id} não encontrado.`);

    dataSource.startDiscovery();
    await this.repository.save(dataSource);

    auditEngine.logEvent("DATA_SOURCE_DISCOVERY_STARTED", `Discovery iniciado para a fonte "${dataSource.metadata.name}"`, "INFO", {
      user: currentUser?.profile?.fullName || currentUser?.id
    });
    dispatchPlatformEvent("DATA_SOURCE_STATE_CHANGED", { dataSourceId: dataSource.id, action: "DISCOVERY_STARTED" });

    return dataSource;
  }

  async completeDiscovery(
    id: string,
    schema: Omit<SchemaVersion, "versionNumber" | "generatedAt">,
    qualityProfile?: QualityProfile,
    user?: PlatformUser | null
  ): Promise<DataSource> {
    const currentUser = user !== undefined ? user : identityEngine.getCurrentUser();
    const dataSource = await this.getDataSourceById(id, currentUser);
    if (!dataSource) throw new Error(`DataSource ID ${id} não encontrado.`);

    const generatedSchema = dataSource.completeDiscovery(schema);
    if (qualityProfile) {
      dataSource.setQualityProfile(qualityProfile);
    }

    await this.repository.save(dataSource);

    auditEngine.logEvent("DATA_SOURCE_DISCOVERY_COMPLETED", `Discovery concluído para a fonte "${dataSource.metadata.name}" (Schema v${generatedSchema.versionNumber})`, "INFO", {
      user: currentUser?.profile?.fullName || currentUser?.id
    });
    dispatchPlatformEvent("DATA_SOURCE_STATE_CHANGED", { dataSourceId: dataSource.id, action: "DISCOVERY_COMPLETED" });

    return dataSource;
  }

  async confirmSchema(id: string, notes?: string, user?: PlatformUser | null): Promise<DataSource> {
    const currentUser = user !== undefined ? user : identityEngine.getCurrentUser();
    const dataSource = await this.getDataSourceById(id, currentUser);
    if (!dataSource) throw new Error(`DataSource ID ${id} não encontrado.`);

    dataSource.confirmCurrentSchema(
      currentUser?.id || "u-consultant",
      currentUser?.profile?.fullName || "Consultor",
      notes
    );

    await this.repository.save(dataSource);

    auditEngine.logEvent("DATA_SOURCE_SCHEMA_CONFIRMED", `Schema v${dataSource.currentSchemaVersion?.versionNumber} confirmado pelo consultor para a fonte "${dataSource.metadata.name}"`, "INFO", {
      user: currentUser?.profile?.fullName || currentUser?.id
    });
    dispatchPlatformEvent("DATA_SOURCE_STATE_CHANGED", { dataSourceId: dataSource.id, action: "SCHEMA_CONFIRMED" });

    return dataSource;
  }

  async registerSync(id: string, sync: Omit<SynchronizationSummary, "synchronizationId" | "dataSourceId">, user?: PlatformUser | null): Promise<DataSource> {
    const currentUser = user !== undefined ? user : identityEngine.getCurrentUser();
    const dataSource = await this.getDataSourceById(id, currentUser);
    if (!dataSource) throw new Error(`DataSource ID ${id} não encontrado.`);

    dataSource.registerSynchronization({
      ...sync,
      dataSourceId: id
    });

    await this.repository.save(dataSource);

    auditEngine.logEvent("DATA_SOURCE_SYNC_COMPLETED", `Sincronização registrada para a fonte "${dataSource.metadata.name}" (Status: ${sync.outcome})`, "INFO", {
      user: currentUser?.profile?.fullName || currentUser?.id
    });
    dispatchPlatformEvent("DATA_SOURCE_STATE_CHANGED", { dataSourceId: dataSource.id, action: "SYNC_COMPLETED" });

    return dataSource;
  }

  async disableDataSource(id: string, user?: PlatformUser | null): Promise<DataSource> {
    const currentUser = user !== undefined ? user : identityEngine.getCurrentUser();
    const dataSource = await this.getDataSourceById(id, currentUser);
    if (!dataSource) throw new Error(`DataSource ID ${id} não encontrado.`);

    dataSource.disable();
    await this.repository.save(dataSource);

    auditEngine.logEvent("DATA_SOURCE_DISABLED", `Fonte de dados "${dataSource.metadata.name}" desativada`, "INFO", {
      user: currentUser?.profile?.fullName || currentUser?.id
    });
    dispatchPlatformEvent("DATA_SOURCE_STATE_CHANGED", { dataSourceId: dataSource.id, action: "DISABLED" });

    return dataSource;
  }

  async enableDataSource(id: string, user?: PlatformUser | null): Promise<DataSource> {
    const currentUser = user !== undefined ? user : identityEngine.getCurrentUser();
    const dataSource = await this.getDataSourceById(id, currentUser);
    if (!dataSource) throw new Error(`DataSource ID ${id} não encontrado.`);

    dataSource.enable();
    await this.repository.save(dataSource);

    auditEngine.logEvent("DATA_SOURCE_ENABLED", `Fonte de dados "${dataSource.metadata.name}" ativada`, "INFO", {
      user: currentUser?.profile?.fullName || currentUser?.id
    });
    dispatchPlatformEvent("DATA_SOURCE_STATE_CHANGED", { dataSourceId: dataSource.id, action: "ENABLED" });

    return dataSource;
  }

  async archiveDataSource(id: string, user?: PlatformUser | null): Promise<DataSource> {
    const currentUser = user !== undefined ? user : identityEngine.getCurrentUser();
    const dataSource = await this.getDataSourceById(id, currentUser);
    if (!dataSource) throw new Error(`DataSource ID ${id} não encontrado.`);

    dataSource.archive();
    await this.repository.save(dataSource);

    auditEngine.logEvent("DATA_SOURCE_ARCHIVED", `Fonte de dados "${dataSource.metadata.name}" arquivada`, "INFO", {
      user: currentUser?.profile?.fullName || currentUser?.id
    });
    dispatchPlatformEvent("DATA_SOURCE_STATE_CHANGED", { dataSourceId: dataSource.id, action: "ARCHIVED" });

    return dataSource;
  }
}
