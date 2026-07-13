/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { persistenceManager } from "./PersistenceManager";

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

export type Enterprise = BusinessGroup | Company | Unit;

export class EnterpriseRepository {
  private static STORAGE_KEY = "sauron_enterprises";

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
  }
}

export const enterpriseRepository = new EnterpriseRepository();
