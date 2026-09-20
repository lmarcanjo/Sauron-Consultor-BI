import { DataSource } from './DataSource';
import { DataSourceRepository } from './DataSourceRepository';
import { persistenceManager } from '../persistence/PersistenceManager';

export class LocalDataSourceRepository implements DataSourceRepository {
  private static STORAGE_KEY = 'asterion_data_sources_v1';

  private serialize(entity: DataSource): any {
    return {
      id: entity.id,
      engagementId: entity.engagementId,
      organizationalScope: entity.organizationalScope,
      createdAt: entity.createdAt,
      createdBy: entity.createdBy,
      metadata: entity.metadata,
      lifecycleStatus: entity.lifecycleStatus,
      healthStatus: entity.healthStatus,
      isDiscovering: entity.isDiscovering,
      currentSchemaVersion: entity.currentSchemaVersion,
      schemaHistory: entity.schemaHistory,
      confirmation: entity.confirmation,
      currentQualityProfile: entity.currentQualityProfile,
      syncHistory: entity.syncHistory,
      connectionEvidences: entity.connectionEvidences,
      archivedAt: entity.archivedAt
    };
  }

  private deserialize(data: any): DataSource {
    const ds = new DataSource({
      id: data.id,
      engagementId: data.engagementId,
      organizationalScope: data.organizationalScope,
      name: data.metadata.name,
      originType: data.metadata.originType,
      format: data.metadata.format,
      credentialReferenceId: data.metadata.credentialReferenceId,
      createdByUserId: data.createdBy
    });

    (ds as any)._lifecycleStatus = data.lifecycleStatus;
    (ds as any)._healthStatus = data.healthStatus;
    (ds as any)._isDiscovering = data.isDiscovering || false;
    (ds as any)._currentSchemaVersion = data.currentSchemaVersion;
    (ds as any)._schemaHistory = data.schemaHistory || [];
    (ds as any)._confirmation = data.confirmation;
    (ds as any)._currentQualityProfile = data.currentQualityProfile;
    (ds as any)._syncHistory = data.syncHistory || [];
    (ds as any)._connectionEvidences = data.connectionEvidences || [];
    (ds as any)._archivedAt = data.archivedAt;

    return ds;
  }

  private async getAllRaw(): Promise<any[]> {
    const list = await persistenceManager.get<any[]>(LocalDataSourceRepository.STORAGE_KEY);
    return list || [];
  }

  public async save(dataSource: DataSource): Promise<void> {
    const list = await this.getAllRaw();
    const serialized = this.serialize(dataSource);
    const index = list.findIndex(item => item.id === dataSource.id);

    if (index >= 0) {
      list[index] = serialized;
    } else {
      list.push(serialized);
    }

    await persistenceManager.set(LocalDataSourceRepository.STORAGE_KEY, list);
  }

  public async findById(id: string): Promise<DataSource | null> {
    const list = await this.getAllRaw();
    const found = list.find(item => item.id === id);
    if (!found) return null;
    return this.deserialize(found);
  }

  public async findByEngagement(engagementId: string): Promise<DataSource[]> {
    const list = await this.getAllRaw();
    return list
      .filter(item => item.engagementId === engagementId)
      .map(item => this.deserialize(item));
  }

  public async findByOrganizationalScope(scopeType: string, targetId: string): Promise<DataSource[]> {
    const list = await this.getAllRaw();
    return list
      .filter(item => item.organizationalScope?.scopeType === scopeType && item.organizationalScope?.targetId === targetId)
      .map(item => this.deserialize(item));
  }

  public async listActive(): Promise<DataSource[]> {
    const list = await this.getAllRaw();
    return list
      .filter(item => item.lifecycleStatus === 'ACTIVE')
      .map(item => this.deserialize(item));
  }

  public async archive(id: string): Promise<void> {
    const ds = await this.findById(id);
    if (!ds) return;
    ds.archive();
    await this.save(ds);
  }
}
