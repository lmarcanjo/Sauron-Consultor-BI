/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { persistenceManager } from "./PersistenceManager";
import { isTemporarySourceId } from "../data/sourceIdentity";

export interface BusinessGroup {
  id: string;
  name: string;
  type: "Grupo";
  segment?: string;
  cnpj?: string;
  notes?: string;
  companyIds: string[];
  workbookIds?: string[];
}

export interface Company {
  id: string;
  name: string;
  type: "Empresa" | "Fazenda" | "Loja" | "Filial" | "Unidade" | "Outro";
  segment?: string;
  cnpj?: string;
  notes?: string;
  parentId?: string; // links to BusinessGroup
  unitIds: string[];
  workbookIds?: string[];
  contacts?: any[];
}

export interface Unit {
  id: string;
  name: string;
  type: "Unidade" | "Fazenda" | "Loja" | "Filial" | "Outro";
  segment?: string;
  cnpj?: string;
  notes?: string;
  parentId?: string; // links to Company
  workbookIds?: string[];
  contacts?: any[];
}

export type SourceBindingStatus = "ACTIVE" | "ARCHIVED" | "REMOVED";

export interface SourceEnterpriseBinding {
  bindingId: string;
  sourceId: string;
  workbookId: string;
  datasetId: string;
  tenantId: string;
  workspaceId: string;
  groupId?: string;
  companyId?: string;
  unitId?: string;
  status: SourceBindingStatus;
  createdAt: string;
  updatedAt: string;
}

export type Enterprise = BusinessGroup | Company | Unit;

export class EnterpriseRepository {
  private static STORAGE_KEY = "sauron_enterprises";
  private static BINDINGS_STORAGE_KEY = "sauron_source_enterprise_bindings_v1";

  public async getAll(): Promise<Enterprise[]> {
    const list = await persistenceManager.get<Enterprise[]>(EnterpriseRepository.STORAGE_KEY);
    return list || [];
  }

  public async getById(id: string): Promise<Enterprise | null> {
    const list = await this.getAll();
    return list.find(e => e.id === id) || null;
  }

  public async save(entity: Enterprise): Promise<void> {
    const list = await this.getAll();
    const index = list.findIndex(e => e.id === entity.id);
    if (index >= 0) {
      list[index] = entity;
    } else {
      list.push(entity);
    }
    await persistenceManager.set(EnterpriseRepository.STORAGE_KEY, list);
  }

  /**
   * Soft‑delete an enterprise by moving it to the archive state.
   * The archived entity remains in storage with a new `archived` flag.
   */
  public async archiveEnterprise(id: string): Promise<void> {
    const list = await this.getAll();
    const entity = list.find(e => e.id === id);
    if (!entity) return;
    // Add an archival flag (preserve original shape for compatibility)
    (entity as any).archived = true;
    await this.save(entity);
  }

  /**
   * Permanently remove an enterprise from storage.
   * Use only after it has been archived.
   */
  public async delete(id: string): Promise<void> {
    const list = await this.getAll();
    const next = list.filter(e => e.id !== id);
    await persistenceManager.set(EnterpriseRepository.STORAGE_KEY, next);
  }

  public async clear(): Promise<void> {
    await persistenceManager.remove(EnterpriseRepository.STORAGE_KEY);
    await persistenceManager.remove(EnterpriseRepository.BINDINGS_STORAGE_KEY);
  }

  private async readSourceBindings(): Promise<SourceEnterpriseBinding[]> {
    const bindings = await persistenceManager.get<SourceEnterpriseBinding[]>(EnterpriseRepository.BINDINGS_STORAGE_KEY);
    return Array.isArray(bindings) ? bindings : [];
  }

  private async writeSourceBindings(bindings: SourceEnterpriseBinding[]): Promise<void> {
    await persistenceManager.set(EnterpriseRepository.BINDINGS_STORAGE_KEY, bindings);
  }

  /**
   * Returns the canonical source-to-enterprise relation. Legacy workbookIds
   * arrays are read only to perform an idempotent migration on first access.
   */
  public async listSourceBindings(): Promise<SourceEnterpriseBinding[]> {
    const bindings = await this.readSourceBindings();
    const bySource = new Map(bindings.map(binding => [binding.sourceId, binding]));
    const entities = await this.getAll();
    const orderedEntities = [
      ...entities.filter(entity => entity.type === "Unidade"),
      ...entities.filter(entity => entity.type === "Empresa"),
      ...entities.filter(entity => entity.type === "Grupo"),
    ];
    let changed = false;

    for (const entity of orderedEntities) {
      for (const workbookId of entity.workbookIds || []) {
        if (isTemporarySourceId(workbookId) || bySource.has(workbookId)) continue;
        const companyId = entity.type === "Empresa" ? entity.id : entity.type === "Unidade" ? (entity as Unit).parentId : undefined;
        const company = companyId ? entities.find(candidate => candidate.id === companyId) : undefined;
        const binding: SourceEnterpriseBinding = {
          bindingId: `binding_${workbookId}`,
          sourceId: workbookId,
          workbookId,
          datasetId: workbookId,
          tenantId: "local",
          workspaceId: "workspace_default",
          groupId: entity.type === "Grupo" ? entity.id : (company as Company | undefined)?.parentId,
          companyId,
          unitId: entity.type === "Unidade" ? entity.id : undefined,
          status: "ACTIVE",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        bySource.set(workbookId, binding);
        changed = true;
      }
    }

    const migrated = Array.from(bySource.values());
    const bindingByLegacyId = new Map<string, SourceEnterpriseBinding>();
    migrated.forEach(binding => {
      [binding.sourceId, binding.workbookId, binding.datasetId].forEach(id => bindingByLegacyId.set(id, binding));
    });

    // Normalize legacy mirrors once the canonical relation is known. This
    // removes the same workbook from sibling entities without deleting any
    // physical workbook or row storage.
    const normalizedEntities = entities.map(entity => {
      const nextIds = new Set<string>();
      for (const id of entity.workbookIds || []) {
        if (isTemporarySourceId(id)) {
          changed = true;
          continue;
        }
        const binding = bindingByLegacyId.get(id);
        if (!binding) {
          nextIds.add(id);
          continue;
        }
        const ownerId = binding.unitId || binding.companyId || binding.groupId;
        if (ownerId === entity.id) nextIds.add(binding.workbookId);
        else changed = true;
      }
      migrated
        .filter(binding => (binding.unitId || binding.companyId || binding.groupId) === entity.id)
        .forEach(binding => nextIds.add(binding.workbookId));
      const currentIds = entity.workbookIds || [];
      if (currentIds.length !== nextIds.size || currentIds.some(id => !nextIds.has(id))) changed = true;
      return { ...entity, workbookIds: Array.from(nextIds) };
    });

    if (changed) {
      await this.writeSourceBindings(migrated);
      await persistenceManager.set(EnterpriseRepository.STORAGE_KEY, normalizedEntities);
    }
    return migrated.filter(binding => binding.status === "ACTIVE");
  }

  public async getSourceBinding(sourceId: string): Promise<SourceEnterpriseBinding | null> {
    const binding = (await this.listSourceBindings()).find(item => item.sourceId === sourceId);
    return binding || null;
  }

  public async bindSource(input: {
    sourceId: string;
    workbookId: string;
    datasetId: string;
    tenantId?: string;
    workspaceId?: string;
    groupId?: string;
    companyId?: string;
    unitId?: string;
  }): Promise<SourceEnterpriseBinding> {
    if (isTemporarySourceId(input.sourceId) || isTemporarySourceId(input.workbookId)) {
      throw new Error("A fonte temporária precisa ser convertida em workbook persistido antes do vínculo.");
    }

    const now = new Date().toISOString();
    const existing = await this.listSourceBindings();
    const current = existing.find(binding => binding.sourceId === input.sourceId);
    const binding: SourceEnterpriseBinding = {
      bindingId: current?.bindingId || `binding_${input.sourceId}`,
      sourceId: input.sourceId,
      workbookId: input.workbookId,
      datasetId: input.datasetId,
      tenantId: input.tenantId || "local",
      workspaceId: input.workspaceId || "workspace_default",
      groupId: input.groupId,
      companyId: input.companyId,
      unitId: input.unitId,
      status: "ACTIVE",
      createdAt: current?.createdAt || now,
      updatedAt: now,
    };
    const nextBindings = existing.filter(item => item.sourceId !== binding.sourceId);
    nextBindings.push(binding);
    await this.writeSourceBindings(nextBindings);

    // Keep old arrays as a read-compatible mirror. All future resolution uses
    // the binding collection above, so the mirror cannot create ownership.
    const entities = await this.getAll();
    const targetId = binding.unitId || binding.companyId || binding.groupId;
    const nextEntities = entities.map(entity => {
      const currentIds = (entity.workbookIds || []).filter(id => id !== binding.workbookId && id !== binding.sourceId);
      if (entity.id === targetId) currentIds.push(binding.workbookId);
      return { ...entity, workbookIds: Array.from(new Set(currentIds)) };
    });
    await persistenceManager.set(EnterpriseRepository.STORAGE_KEY, nextEntities);
    return binding;
  }

  public async removeSourceBinding(sourceId: string): Promise<void> {
    const bindings = await this.listSourceBindings();
    const target = bindings.find(binding => binding.sourceId === sourceId);
    if (!target) return;
    await this.writeSourceBindings(bindings.filter(binding => binding.sourceId !== sourceId));
    const entities = await this.getAll();
    await persistenceManager.set(
      EnterpriseRepository.STORAGE_KEY,
      entities.map(entity => ({
        ...entity,
        workbookIds: (entity.workbookIds || []).filter(id => id !== target.workbookId && id !== target.sourceId),
      }))
    );
  }
}

export const enterpriseRepository = new EnterpriseRepository();
