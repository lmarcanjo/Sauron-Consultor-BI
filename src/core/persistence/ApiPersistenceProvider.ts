/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { IPersistenceProvider } from "./IPersistenceProvider";
import { ApiClient, apiClient } from "./ApiClient";

/**
 * F5-VIII: API PERSISTENCE PROVIDER
 * 
 * High-integrity adapter implementing the standard IPersistenceProvider contract,
 * backed by the type-safe and trace-enabled ApiClient.
 */
export class ApiPersistenceProvider implements IPersistenceProvider {
  constructor(private client: ApiClient = apiClient) {}

  public async getItem(key: string): Promise<string | null> {
    try {
      const res = await this.client.get<{ value: string | null }>(`/persistence/get?key=${encodeURIComponent(key)}`);
      return res.data?.value || null;
    } catch {
      return null;
    }
  }

  public async setItem(key: string, value: string): Promise<void> {
    try {
      await this.client.post<void>("/persistence/set", { key, value });
    } catch (e) {
      console.warn(`ApiPersistenceProvider failed to set key [${key}]:`, e);
    }
  }

  public async removeItem(key: string): Promise<void> {
    try {
      await this.client.delete<void>(`/persistence/delete?key=${encodeURIComponent(key)}`);
    } catch (e) {
      console.warn(`ApiPersistenceProvider failed to remove key [${key}]:`, e);
    }
  }

  public async clear(): Promise<void> {
    try {
      await this.client.post<void>("/persistence/clear", {});
    } catch (e) {
      console.warn("ApiPersistenceProvider failed to clear context:", e);
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      const res = await this.client.get<{ status: string }>("/health");
      return res.success;
    } catch {
      return false;
    }
  }

  // Structured Query Delegations
  public async find<T>(collection: string, id: string): Promise<T | null> {
    try {
      const res = await this.client.get<T>(`/persistence/find?collection=${collection}&id=${id}`);
      return res.data || null;
    } catch {
      return null;
    }
  }

  public async save<T>(collection: string, id: string, data: T): Promise<void> {
    try {
      await this.client.post<void>("/persistence/save", { collection, id, data });
    } catch (e) {
      console.warn(`ApiPersistenceProvider failed to save record [${collection}:${id}]:`, e);
    }
  }

  public async query<T>(collection: string, filter?: Record<string, any>): Promise<T[]> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.set("collection", collection);
      if (filter) {
        queryParams.set("filter", JSON.stringify(filter));
      }
      const res = await this.client.get<T[]>(`/persistence/query?${queryParams.toString()}`);
      return res.data || [];
    } catch {
      return [];
    }
  }

  public async delete(collection: string, id: string): Promise<void> {
    try {
      await this.client.delete<void>(`/persistence/delete-record?collection=${collection}&id=${id}`);
    } catch (e) {
      console.warn(`ApiPersistenceProvider failed to delete record [${collection}:${id}]:`, e);
    }
  }
}
