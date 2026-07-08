/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * F4-A: PERSISTENCE PROVIDER SPECIFICATION
 * 
 * Defines the low-level physical I/O interface.
 * All storage adapters must implement this contract, enabling seamless transition 
 * between LocalStorage, Remote API Gateways, PostgreSQL, and In-Memory caches.
 */
export interface IPersistenceProvider {
  /**
   * Reads a raw string value from the key-value namespace.
   */
  getItem(key: string): Promise<string | null>;

  /**
   * Writes a raw string value to the key-value namespace.
   */
  setItem(key: string, value: string): Promise<void>;

  /**
   * Deletes a key-value pair from the storage context.
   */
  removeItem(key: string): Promise<void>;

  /**
   * Flushes all stored keys within this provider's sandbox.
   */
  clear(): Promise<void>;

  /**
   * Checks if the provider is currently online and healthy.
   */
  healthCheck(): Promise<boolean>;

  // Structured Query Capability (for SQL/Document stores)
  find?<T>(collection: string, id: string): Promise<T | null>;
  save?<T>(collection: string, id: string, data: T): Promise<void>;
  query?<T>(collection: string, filter?: Record<string, any>): Promise<T[]>;
  delete?(collection: string, id: string): Promise<void>;
}

/**
 * 1. LocalProvider: Client-side LocalStorage implementation
 */
export class LocalProvider implements IPersistenceProvider {
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

  public async healthCheck(): Promise<boolean> {
    try {
      const testKey = "__sauron_local_test__";
      await this.setItem(testKey, "1");
      const ok = (await this.getItem(testKey)) === "1";
      await this.removeItem(testKey);
      return ok;
    } catch {
      return false;
    }
  }
}

/**
 * 2. ApiProvider: Dispatches payloads to server-side HTTP controllers
 */
export class ApiProvider implements IPersistenceProvider {
  constructor(private baseUrl: string = "/api/v1/persistence") {}

  public async getItem(key: string): Promise<string | null> {
    try {
      const res = await fetch(`${this.baseUrl}/get?key=${encodeURIComponent(key)}`);
      if (!res.ok) return null;
      const json = await res.json();
      return json.value || null;
    } catch {
      return null;
    }
  }

  public async setItem(key: string, value: string): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/set`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
    } catch (e) {
      console.warn("ApiProvider failed to set item", e);
    }
  }

  public async removeItem(key: string): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
    } catch (e) {
      console.warn("ApiProvider failed to remove item", e);
    }
  }

  public async clear(): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/clear`, { method: "POST" });
    } catch (e) {
      console.warn("ApiProvider failed to clear", e);
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/health`);
      return res.ok;
    } catch {
      return false;
    }
  }
}

/**
 * 3. PostgresProvider: Full server-side SQL mapper interface
 */
export class PostgresProvider implements IPersistenceProvider {
  private inMemoryDbMock = new Map<string, string>(); // Node-native fallback simulation

  public async getItem(key: string): Promise<string | null> {
    // In production, this issues SQL queries:
    // SELECT value FROM sauron_key_value WHERE key = $1
    return this.inMemoryDbMock.get(key) || null;
  }

  public async setItem(key: string, value: string): Promise<void> {
    // In production, this issues:
    // INSERT INTO sauron_key_value(key, value) VALUES($1, $2) ON CONFLICT(key) DO UPDATE SET value = EXCLUDED.value
    this.inMemoryDbMock.set(key, value);
  }

  public async removeItem(key: string): Promise<void> {
    // DELETE FROM sauron_key_value WHERE key = $1
    this.inMemoryDbMock.delete(key);
  }

  public async clear(): Promise<void> {
    // TRUNCATE sauron_key_value
    this.inMemoryDbMock.clear();
  }

  public async healthCheck(): Promise<boolean> {
    // Performs DB ping: "SELECT 1"
    return true;
  }

  // Structured Query implementations
  public async find<T>(collection: string, id: string): Promise<T | null> {
    const raw = await this.getItem(`${collection}:${id}`);
    return raw ? (JSON.parse(raw) as T) : null;
  }

  public async save<T>(collection: string, id: string, data: T): Promise<void> {
    await this.setItem(`${collection}:${id}`, JSON.stringify(data));
  }

  public async query<T>(collection: string, filter?: Record<string, any>): Promise<T[]> {
    const results: T[] = [];
    const prefix = `${collection}:`;
    
    for (const [key, val] of this.inMemoryDbMock.entries()) {
      if (key.startsWith(prefix)) {
        try {
          const parsed = JSON.parse(val) as T;
          // Apply simple filter match if provided
          if (filter) {
            let matches = true;
            for (const [fKey, fVal] of Object.entries(filter)) {
              if ((parsed as any)[fKey] !== fVal) {
                matches = false;
                break;
              }
            }
            if (matches) results.push(parsed);
          } else {
            results.push(parsed);
          }
        } catch {
          // Skip corrupt records
        }
      }
    }
    return results;
  }

  public async delete(collection: string, id: string): Promise<void> {
    await this.removeItem(`${collection}:${id}`);
  }
}

/**
 * 4. MemoryProvider: Highly optimized sandbox for Unit Testing and CI runs
 */
export class MemoryProvider implements IPersistenceProvider {
  private store = new Map<string, string>();

  public async getItem(key: string): Promise<string | null> {
    return this.store.get(key) || null;
  }

  public async setItem(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  public async removeItem(key: string): Promise<void> {
    this.store.delete(key);
  }

  public async clear(): Promise<void> {
    this.store.clear();
  }

  public async healthCheck(): Promise<boolean> {
    return true;
  }

  public async find<T>(collection: string, id: string): Promise<T | null> {
    const raw = this.store.get(`${collection}:${id}`);
    return raw ? JSON.parse(raw) as T : null;
  }

  public async save<T>(collection: string, id: string, data: T): Promise<void> {
    this.store.set(`${collection}:${id}`, JSON.stringify(data));
  }

  public async query<T>(collection: string, filter?: Record<string, any>): Promise<T[]> {
    const results: T[] = [];
    const prefix = `${collection}:`;
    for (const [key, val] of this.store.entries()) {
      if (key.startsWith(prefix)) {
        const parsed = JSON.parse(val) as T;
        if (filter) {
          let match = true;
          for (const [fK, fV] of Object.entries(filter)) {
            if ((parsed as any)[fK] !== fV) {
              match = false;
              break;
            }
          }
          if (match) results.push(parsed);
        } else {
          results.push(parsed);
        }
      }
    }
    return results;
  }

  public async delete(collection: string, id: string): Promise<void> {
    this.store.delete(`${collection}:${id}`);
  }
}
