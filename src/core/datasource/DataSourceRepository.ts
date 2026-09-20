import { DataSource } from './DataSource';

export interface DataSourceRepository {
  save(dataSource: DataSource): Promise<void>;
  findById(id: string): Promise<DataSource | null>;
  findByEngagement(engagementId: string): Promise<DataSource[]>;
  findByOrganizationalScope(scopeType: string, targetId: string): Promise<DataSource[]>;
  listActive(): Promise<DataSource[]>;
  archive(id: string): Promise<void>;
}
