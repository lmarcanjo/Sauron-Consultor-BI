/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// 1. Re-export low-level provider components
export * from "./IPersistenceProvider";

// 2. Re-export repository abstractions
export * from "./IRepository";

// 3. Re-export transactional Unit of Work
export * from "./UnitOfWork";

// 4. Re-export transactional manager
export * from "./TransactionManager";

// 5. Re-export cache strategies
export * from "./CacheLayer";

// 6. Re-export offline sync models
export * from "./OfflineEngine";

// 7. Re-export snapshot engine
export * from "./SnapshotEngine";

// 8. Re-export observability telemetry
export * from "./PersistenceObservability";

export * from "./EnterpriseRepository";
export * from "./TimelineRepository";

import { IPersistenceProvider, LocalProvider } from "./IPersistenceProvider";

/**
 * Enterprise Persistence Manager (Legacy Compatibility Wrapper)
 * Backed by modern IPersistenceProvider interfaces.
 */
class PersistenceManager {
  private provider: IPersistenceProvider;

  constructor() {
    this.provider = new LocalProvider();
  }

  /**
   * Set a custom provider (e.g., IndexedDB, Cloud PostgreSQL, Firebase)
   */
  public setProvider(provider: IPersistenceProvider): void {
    this.provider = provider;
  }

  /**
   * Get value for a key.
   */
  public async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.provider.getItem(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (e) {
      console.error(`PersistenceManager error reading key [${key}]:`, e);
      return null;
    }
  }

  /**
   * Set value for a key.
   */
  public async set<T>(key: string, value: T): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      await this.provider.setItem(key, serialized);
    } catch (e) {
      console.error(`PersistenceManager error writing key [${key}]:`, e);
    }
  }

  /**
   * Remove key.
   */
  public async remove(key: string): Promise<void> {
    try {
      await this.provider.removeItem(key);
    } catch (e) {
      console.error(`PersistenceManager error deleting key [${key}]:`, e);
    }
  }

  /**
   * Clear all stored data.
   */
  public async clear(): Promise<void> {
    try {
      await this.provider.clear();
    } catch (e) {
      console.error("PersistenceManager error clearing storage:", e);
    }
  }
}

export const persistenceManager = new PersistenceManager();
export default persistenceManager;
