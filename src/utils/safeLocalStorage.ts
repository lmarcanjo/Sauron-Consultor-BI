/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const safeLocalStorage = {
  get<T>(key: string, fallback: T): T {
    if (typeof localStorage === "undefined") {
      return fallback;
    }
    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return fallback;
      }
      return JSON.parse(item) as T;
    } catch (e) {
      console.warn(`[safeLocalStorage] Failed to parse key "${key}", using fallback.`, e);
      return fallback;
    }
  },

  set<T>(key: string, value: T): void {
    if (typeof localStorage === "undefined") {
      return;
    }
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`[safeLocalStorage] Failed to write key "${key}".`, e);
    }
  },

  remove(key: string): void {
    if (typeof localStorage === "undefined") {
      return;
    }
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error(`[safeLocalStorage] Failed to remove key "${key}".`, e);
    }
  },

  getString(key: string, fallback = ""): string {
    if (typeof localStorage === "undefined") {
      return fallback;
    }
    try {
      const item = localStorage.getItem(key);
      return item !== null ? item : fallback;
    } catch (e) {
      return fallback;
    }
  },

  setString(key: string, value: string): void {
    if (typeof localStorage === "undefined") {
      return;
    }
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.error(`[safeLocalStorage] Failed to write string key "${key}".`, e);
    }
  }
};
