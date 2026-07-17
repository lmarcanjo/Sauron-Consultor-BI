/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ActiveSourceSelection } from "../../types/dataSource";

const ACTIVE_SELECTION_STORAGE_KEY_PREFIX = "sauron_active_source_selection_";

export interface ActiveSourceScope {
  tenantId?: string;
  workspaceId: string;
  scopeType: "GROUP" | "COMPANY" | "UNIT";
  scopeId: string;
}

export function getActiveSourceScopeKey(scope: ActiveSourceScope): string {
  return [
    scope.tenantId || "local",
    scope.workspaceId || "workspace_default",
    scope.scopeType,
    scope.scopeId || "none",
  ].join("::");
}

export const activeSourceSelectionStore = {
  get(contextId: string): ActiveSourceSelection | null {
    if (typeof localStorage === "undefined") return null;
    try {
      const raw = localStorage.getItem(`${ACTIVE_SELECTION_STORAGE_KEY_PREFIX}${contextId}`);
      if (raw) return JSON.parse(raw);
      for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index);
        if (!key?.startsWith(ACTIVE_SELECTION_STORAGE_KEY_PREFIX)) continue;
        const candidate = JSON.parse(localStorage.getItem(key) || "null") as ActiveSourceSelection | null;
        if (candidate?.workspaceId === contextId) return candidate;
      }
      return null;
    } catch {
      return null;
    }
  },

  set(selection: ActiveSourceSelection): void {
    if (typeof localStorage === "undefined") return;
    try {
      localStorage.setItem(
        `${ACTIVE_SELECTION_STORAGE_KEY_PREFIX}${selection.contextId}`,
        JSON.stringify(selection)
      );
    } catch (e) {
      console.error("[ActiveSourceSelectionStore] Failed to save selection:", e);
    }
  },

  getForScope(scope: ActiveSourceScope): ActiveSourceSelection | null {
    return this.get(getActiveSourceScopeKey(scope));
  },

  setForScope(scope: ActiveSourceScope, sourceIds: string[]): ActiveSourceSelection {
    const selection: ActiveSourceSelection = {
      contextId: getActiveSourceScopeKey(scope),
      sourceIds: Array.from(new Set(sourceIds)),
      updatedAt: new Date().toISOString(),
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      scopeType: scope.scopeType,
      scopeId: scope.scopeId,
    };
    this.set(selection);
    // Read-only compatibility pointer for older consumers. Context-aware code
    // always reads the canonical scoped key above.
    if (typeof localStorage !== "undefined") {
      try {
        localStorage.setItem(`${ACTIVE_SELECTION_STORAGE_KEY_PREFIX}${scope.workspaceId}`, JSON.stringify(selection));
      } catch {
        // The canonical scoped record is already persisted when possible.
      }
    }
    return selection;
  },

  delete(contextId: string): void {
    if (typeof localStorage === "undefined") return;
    try {
      localStorage.removeItem(`${ACTIVE_SELECTION_STORAGE_KEY_PREFIX}${contextId}`);
    } catch {}
  }
};
