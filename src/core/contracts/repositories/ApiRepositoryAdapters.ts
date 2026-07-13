/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ApiClient } from "../../api/ApiClient";
import * as Ports from "./RepositoryPorts";

export class ApiRepositoryAdapter<T extends { id: string }> implements Ports.IRepositoryPort<T> {
  constructor(protected endpointPath: string) {}

  public async getById(id: string): Promise<T | null> {
    try {
      const response = await ApiClient.get<T>(`/api/v1/${this.endpointPath}/${id}`);
      return response.data;
    } catch {
      return null;
    }
  }

  public async save(entity: T): Promise<void> {
    await ApiClient.post<T, void>(`/api/v1/${this.endpointPath}`, entity);
  }

  public async delete(id: string): Promise<void> {
    await ApiClient.delete<void>(`/api/v1/${this.endpointPath}/${id}`);
  }

  public async getAll(): Promise<T[]> {
    try {
      const response = await ApiClient.get<T[]>(`/api/v1/${this.endpointPath}`);
      return response.data || [];
    } catch {
      return [];
    }
  }

  public async query(filter: Record<string, any>): Promise<T[]> {
    try {
      const response = await ApiClient.get<T[]>(`/api/v1/${this.endpointPath}`, { params: filter });
      return response.data || [];
    } catch {
      return [];
    }
  }
}

export class ApiUserRepositoryAdapter extends ApiRepositoryAdapter<Ports.UserEntity> implements Ports.UserRepositoryPort {
  constructor() { super("users"); }
  public async getByEmail(email: string): Promise<Ports.UserEntity | null> {
    try {
      const response = await ApiClient.get<Ports.UserEntity>(`/api/v1/users/email/${email}`);
      return response.data;
    } catch {
      return null;
    }
  }
}

export class ApiOrganizationRepositoryAdapter extends ApiRepositoryAdapter<Ports.OrganizationEntity> implements Ports.OrganizationRepositoryPort {
  constructor() { super("organizations"); }
}

export class ApiEnterpriseRepositoryAdapter extends ApiRepositoryAdapter<Ports.EnterpriseEntity> implements Ports.EnterpriseRepositoryPort {
  constructor() { super("enterprises"); }
}

export class ApiWorkspaceRepositoryAdapter extends ApiRepositoryAdapter<Ports.WorkspaceEntity> implements Ports.WorkspaceRepositoryPort {
  constructor() { super("workspaces"); }
  public async getWorkspacesByTenant(tenantId: string): Promise<Ports.WorkspaceEntity[]> {
    return this.query({ tenantId });
  }
}

export class ApiWorkbookLibraryRepositoryAdapter extends ApiRepositoryAdapter<Ports.WorkbookLibraryEntity> implements Ports.WorkbookLibraryRepositoryPort {
  constructor() { super("workbooks"); }
}

export class ApiDatasetMetadataRepositoryAdapter extends ApiRepositoryAdapter<Ports.DatasetMetadataEntity> implements Ports.DatasetMetadataRepositoryPort {
  constructor() { super("datasets"); }
}

export class ApiModuleMappingRepositoryAdapter extends ApiRepositoryAdapter<Ports.ModuleMappingEntity> implements Ports.ModuleMappingRepositoryPort {
  constructor() { super("mappings"); }
}

export class ApiWorkspaceDictionaryRepositoryAdapter extends ApiRepositoryAdapter<Ports.WorkspaceDictionaryEntity> implements Ports.WorkspaceDictionaryRepositoryPort {
  constructor() { super("dictionaries"); }
}

export class ApiPresentationRepositoryAdapter extends ApiRepositoryAdapter<Ports.PresentationEntity> implements Ports.PresentationRepositoryPort {
  constructor() { super("presentations"); }
}

export class ApiMeetingRepositoryAdapter extends ApiRepositoryAdapter<Ports.MeetingEntity> implements Ports.MeetingRepositoryPort {
  constructor() { super("meetings"); }
  public async getActiveMeetings(): Promise<Ports.MeetingEntity[]> {
    return this.query({ active: true });
  }
}

export class ApiActionPlanRepositoryAdapter extends ApiRepositoryAdapter<Ports.ActionPlanEntity> implements Ports.ActionPlanRepositoryPort {
  constructor() { super("actionplans"); }
  public async getActionsByResponsible(email: string): Promise<Ports.ActionPlanEntity[]> {
    return this.query({ responsible: email });
  }
}

export class ApiAuditRepositoryAdapter extends ApiRepositoryAdapter<Ports.AuditEntity> implements Ports.AuditRepositoryPort {
  constructor() { super("audits"); }
}
