/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface IRepositoryPort<T extends { id: string }> {
  getById(id: string): Promise<T | null>;
  save(entity: T): Promise<void>;
  delete(id: string): Promise<void>;
  getAll(): Promise<T[]>;
  query(filter: Record<string, any>): Promise<T[]>;
}

// Model types definitions or placeholders for ports
export interface UserEntity { id: string; email: string; name: string; role: string; tenantId: string; }
export interface OrganizationEntity { id: string; name: string; tenantId: string; }
export interface EnterpriseEntity { id: string; name: string; cnpj: string; tenantId: string; }
export interface WorkspaceEntity { id: string; name: string; organizationId: string; tenantId: string; }
export interface WorkbookLibraryEntity { id: string; name: string; sheetCount: number; rowCount: number; columnCount: number; size: string; tenantId: string; }
export interface DatasetMetadataEntity { id: string; datasetId: string; sourceName: string; rowCount: number; tenantId: string; }
export interface ModuleMappingEntity { id: string; moduleName: string; mappingRules: string; tenantId: string; }
export interface WorkspaceDictionaryEntity { id: string; term: string; definition: string; tenantId: string; }
export interface PresentationEntity { id: string; title: string; slides: any[]; tenantId: string; }
export interface MeetingEntity { id: string; title: string; date: string; status: string; isClosed: boolean; tenantId: string; }
export interface ActionPlanEntity { id: string; title: string; responsible: string; status: string; tenantId: string; }
export interface AuditEntity { id: string; action: string; details: string; userId: string; tenantId: string; timestamp: string; }

// Specialised repository ports
export interface UserRepositoryPort extends IRepositoryPort<UserEntity> {
  getByEmail(email: string): Promise<UserEntity | null>;
}

export interface OrganizationRepositoryPort extends IRepositoryPort<OrganizationEntity> {}
export interface EnterpriseRepositoryPort extends IRepositoryPort<EnterpriseEntity> {}
export interface WorkspaceRepositoryPort extends IRepositoryPort<WorkspaceEntity> {
  getWorkspacesByTenant(tenantId: string): Promise<WorkspaceEntity[]>;
}
export interface WorkbookLibraryRepositoryPort extends IRepositoryPort<WorkbookLibraryEntity> {}
export interface DatasetMetadataRepositoryPort extends IRepositoryPort<DatasetMetadataEntity> {}
export interface ModuleMappingRepositoryPort extends IRepositoryPort<ModuleMappingEntity> {}
export interface WorkspaceDictionaryRepositoryPort extends IRepositoryPort<WorkspaceDictionaryEntity> {}
export interface PresentationRepositoryPort extends IRepositoryPort<PresentationEntity> {}
export interface MeetingRepositoryPort extends IRepositoryPort<MeetingEntity> {
  getActiveMeetings(): Promise<MeetingEntity[]>;
}
export interface ActionPlanRepositoryPort extends IRepositoryPort<ActionPlanEntity> {
  getActionsByResponsible(email: string): Promise<ActionPlanEntity[]>;
}
export interface AuditRepositoryPort extends IRepositoryPort<AuditEntity> {}
