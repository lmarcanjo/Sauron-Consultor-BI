/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ModuleConfigurationRecord, ModuleId } from './ModuleActivationContracts';
import { persistenceManager } from '../persistence/PersistenceManager';

export interface IModuleConfigurationRepository {
  save(config: ModuleConfigurationRecord): Promise<void>;
  findByModule(moduleId: ModuleId, engagementId: string): Promise<ModuleConfigurationRecord | null>;
  findAllByEngagement(engagementId: string): Promise<readonly ModuleConfigurationRecord[]>;
  invalidate(moduleId: ModuleId, engagementId: string, reason: string): Promise<void>;
  remove(moduleId: ModuleId, engagementId: string): Promise<void>;
}

export class LocalModuleConfigurationRepository implements IModuleConfigurationRepository {
  private static readonly PREFIX = 'asterion_module_config_';

  public async save(config: ModuleConfigurationRecord): Promise<void> {
    const key = LocalModuleConfigurationRepository.buildKey(config.moduleId, config.engagementId);
    await persistenceManager.set(key, config);
    await this.trackEngagement(config.engagementId, config.moduleId);
  }

  public async findByModule(moduleId: ModuleId, engagementId: string): Promise<ModuleConfigurationRecord | null> {
    const key = LocalModuleConfigurationRepository.buildKey(moduleId, engagementId);
    return await persistenceManager.get<ModuleConfigurationRecord>(key);
  }

  public async findAllByEngagement(engagementId: string): Promise<readonly ModuleConfigurationRecord[]> {
    const trackKey = `${LocalModuleConfigurationRepository.PREFIX}track_${engagementId}`;
    const moduleIds = await persistenceManager.get<ModuleId[]>(trackKey) || [];
    const results: ModuleConfigurationRecord[] = [];
    for (const mid of moduleIds) {
      const config = await this.findByModule(mid, engagementId);
      if (config) results.push(config);
    }
    return results;
  }

  public async invalidate(moduleId: ModuleId, engagementId: string, _reason: string): Promise<void> {
    const existing = await this.findByModule(moduleId, engagementId);
    if (existing) {
      const updated: ModuleConfigurationRecord = {
        ...existing,
        status: 'INVALIDATED',
        updatedAt: new Date().toISOString(),
      };
      await this.save(updated);
    }
  }

  public async remove(moduleId: ModuleId, engagementId: string): Promise<void> {
    const key = LocalModuleConfigurationRepository.buildKey(moduleId, engagementId);
    await persistenceManager.remove(key);
  }

  private async trackEngagement(engagementId: string, moduleId: ModuleId): Promise<void> {
    const trackKey = `${LocalModuleConfigurationRepository.PREFIX}track_${engagementId}`;
    const existing = await persistenceManager.get<ModuleId[]>(trackKey) || [];
    if (!existing.includes(moduleId)) {
      existing.push(moduleId);
      await persistenceManager.set(trackKey, existing);
    }
  }

  private static buildKey(moduleId: ModuleId, engagementId: string): string {
    return `${LocalModuleConfigurationRepository.PREFIX}${moduleId}_${engagementId}`;
  }
}

/** InMemory implementation for unit tests */
export class InMemoryModuleConfigurationRepository implements IModuleConfigurationRepository {
  private readonly store = new Map<string, ModuleConfigurationRecord>();

  public async save(config: ModuleConfigurationRecord): Promise<void> {
    this.store.set(`${config.moduleId}_${config.engagementId}`, JSON.parse(JSON.stringify(config)));
  }

  public async findByModule(moduleId: ModuleId, engagementId: string): Promise<ModuleConfigurationRecord | null> {
    const item = this.store.get(`${moduleId}_${engagementId}`);
    return item ? JSON.parse(JSON.stringify(item)) : null;
  }

  public async findAllByEngagement(engagementId: string): Promise<readonly ModuleConfigurationRecord[]> {
    return Array.from(this.store.values())
      .filter(c => c.engagementId === engagementId)
      .map(c => JSON.parse(JSON.stringify(c)));
  }

  public async invalidate(moduleId: ModuleId, engagementId: string, _reason: string): Promise<void> {
    const key = `${moduleId}_${engagementId}`;
    const existing = this.store.get(key);
    if (existing) {
      this.store.set(key, { ...existing, status: 'INVALIDATED', updatedAt: new Date().toISOString() });
    }
  }

  public async remove(moduleId: ModuleId, engagementId: string): Promise<void> {
    this.store.delete(`${moduleId}_${engagementId}`);
  }

  public clear(): void {
    this.store.clear();
  }
}

export const moduleConfigurationRepository = new LocalModuleConfigurationRepository();
