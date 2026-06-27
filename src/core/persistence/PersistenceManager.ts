/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface IPersistenceProvider {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
}

/**
 * LocalStorage Provider (Default Implementation)
 */
class LocalStorageProvider implements IPersistenceProvider {
  public async getItem(key: string): Promise<string | null> {
    if (typeof window === "undefined" || !window.localStorage) return null;
    return window.localStorage.getItem(key);
  }

  public async setItem(key: string, value: string): Promise<void> {
    if (typeof window === "undefined" || !window.localStorage) return;
    window.localStorage.setItem(key, value);
  }

  public async removeItem(key: string): Promise<void> {
    if (typeof window === "undefined" || !window.localStorage) return;
    window.localStorage.removeItem(key);
  }

  public async clear(): Promise<void> {
    if (typeof window === "undefined" || !window.localStorage) return;
    window.localStorage.clear();
  }
}

/**
 * Enterprise Persistence Manager
 */
class PersistenceManager {
  private provider: IPersistenceProvider;

  constructor() {
    this.provider = new LocalStorageProvider();
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
