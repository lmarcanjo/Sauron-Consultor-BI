/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { persistenceManager } from "../../persistence/PersistenceManager";
import * as Ports from "./RepositoryPorts";

export class LocalRepositoryAdapter<T extends { id: string }> implements Ports.IRepositoryPort<T> {
  constructor(protected collectionName: string) {}

  public async getById(id: string): Promise<T | null> {
    const raw = await persistenceManager.get<T>(`${this.collectionName}:${id}`);
    return raw;
  }

  public async save(entity: T): Promise<void> {
    await persistenceManager.set(`${this.collectionName}:${entity.id}`, entity);
  }

  public async delete(id: string): Promise<void> {
    await persistenceManager.remove(`${this.collectionName}:${id}`);
  }

  public async getAll(): Promise<T[]> {
    // Standard Local persistence fallback lists
    const indexKey = `index:${this.collectionName}`;
    const ids = await persistenceManager.get<string[]>(indexKey) || [];
    const results: T[] = [];
    for (const id of ids) {
      const item = await this.getById(id);
      if (item) results.push(item);
    }
    return results;
  }

  public async query(filter: Record<string, any>): Promise<T[]> {
    const all = await this.getAll();
    return all.filter((item: any) => {
      for (const key of Object.keys(filter)) {
        if (item[key] !== filter[key]) return false;
      }
      return true;
    });
  }

  protected async addToIndex(id: string): Promise<void> {
    const indexKey = `index:${this.collectionName}`;
    const ids = await persistenceManager.get<string[]>(indexKey) || [];
    if (!ids.includes(id)) {
      ids.push(id);
      await persistenceManager.set(indexKey, ids);
    }
  }
}

export class LocalUserRepositoryAdapter extends LocalRepositoryAdapter<Ports.UserEntity> implements Ports.UserRepositoryPort {
  constructor() { super("users"); }
  public async getByEmail(email: string): Promise<Ports.UserEntity | null> {
    const all = await this.getAll();
    return all.find((u) => u.email === email) || null;
  }
  public override async save(entity: Ports.UserEntity): Promise<void> {
    await super.save(entity);
    await this.addToIndex(entity.id);
  }
}

export class LocalOrganizationRepositoryAdapter extends LocalRepositoryAdapter<Ports.OrganizationEntity> implements Ports.OrganizationRepositoryPort {
  constructor() { super("organizations"); }
  public override async save(entity: Ports.OrganizationEntity): Promise<void> {
    await super.save(entity);
    await this.addToIndex(entity.id);
  }
}

export class LocalEnterpriseRepositoryAdapter extends LocalRepositoryAdapter<Ports.EnterpriseEntity> implements Ports.EnterpriseRepositoryPort {
  constructor() { super("enterprises"); }
  public override async save(entity: Ports.EnterpriseEntity): Promise<void> {
    await super.save(entity);
    await this.addToIndex(entity.id);
  }
}

export class LocalWorkspaceRepositoryAdapter extends LocalRepositoryAdapter<Ports.WorkspaceEntity> implements Ports.WorkspaceRepositoryPort {
  constructor() { super("workspaces"); }
  public async getWorkspacesByTenant(tenantId: string): Promise<Ports.WorkspaceEntity[]> {
    return this.query({ tenantId });
  }
  public override async save(entity: Ports.WorkspaceEntity): Promise<void> {
    await super.save(entity);
    await this.addToIndex(entity.id);
  }
}

export class LocalWorkbookLibraryRepositoryAdapter extends LocalRepositoryAdapter<Ports.WorkbookLibraryEntity> implements Ports.WorkbookLibraryRepositoryPort {
  constructor() { super("workbooks"); }
  public override async save(entity: Ports.WorkbookLibraryEntity): Promise<void> {
    await super.save(entity);
    await this.addToIndex(entity.id);
  }
}

export class LocalDatasetMetadataRepositoryAdapter extends LocalRepositoryAdapter<Ports.DatasetMetadataEntity> implements Ports.DatasetMetadataRepositoryPort {
  constructor() { super("datasets"); }
  public override async save(entity: Ports.DatasetMetadataEntity): Promise<void> {
    await super.save(entity);
    await this.addToIndex(entity.id);
  }
}

export class LocalModuleMappingRepositoryAdapter extends LocalRepositoryAdapter<Ports.ModuleMappingEntity> implements Ports.ModuleMappingRepositoryPort {
  constructor() { super("mappings"); }
  public override async save(entity: Ports.ModuleMappingEntity): Promise<void> {
    await super.save(entity);
    await this.addToIndex(entity.id);
  }
}

export class LocalWorkspaceDictionaryRepositoryAdapter extends LocalRepositoryAdapter<Ports.WorkspaceDictionaryEntity> implements Ports.WorkspaceDictionaryRepositoryPort {
  constructor() { super("dictionaries"); }
  public override async save(entity: Ports.WorkspaceDictionaryEntity): Promise<void> {
    await super.save(entity);
    await this.addToIndex(entity.id);
  }
}

export class LocalPresentationRepositoryAdapter extends LocalRepositoryAdapter<Ports.PresentationEntity> implements Ports.PresentationRepositoryPort {
  constructor() { super("presentations"); }
  public override async save(entity: Ports.PresentationEntity): Promise<void> {
    await super.save(entity);
    await this.addToIndex(entity.id);
  }
}

export class LocalMeetingRepositoryAdapter extends LocalRepositoryAdapter<Ports.MeetingEntity> implements Ports.MeetingRepositoryPort {
  constructor() { super("meetings"); }
  public async getActiveMeetings(): Promise<Ports.MeetingEntity[]> {
    const list = await this.getAll();
    return list.filter((m) => m.status === "active" || !m.isClosed);
  }
  public override async save(entity: Ports.MeetingEntity): Promise<void> {
    await super.save(entity);
    await this.addToIndex(entity.id);
  }
}

export class LocalActionPlanRepositoryAdapter extends LocalRepositoryAdapter<Ports.ActionPlanEntity> implements Ports.ActionPlanRepositoryPort {
  constructor() { super("actionplans"); }
  public async getActionsByResponsible(email: string): Promise<Ports.ActionPlanEntity[]> {
    return this.query({ responsible: email });
  }
  public override async save(entity: Ports.ActionPlanEntity): Promise<void> {
    await super.save(entity);
    await this.addToIndex(entity.id);
  }
}

export class LocalAuditRepositoryAdapter extends LocalRepositoryAdapter<Ports.AuditEntity> implements Ports.AuditRepositoryPort {
  constructor() { super("audits"); }
  public override async save(entity: Ports.AuditEntity): Promise<void> {
    await super.save(entity);
    await this.addToIndex(entity.id);
  }
}
