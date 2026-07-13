/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ActiveSourceSelection } from "../../types/dataSource";

const ACTIVE_SELECTION_STORAGE_KEY_PREFIX = "sauron_active_source_selection_";

export const activeSourceSelectionStore = {
  get(contextId: string): ActiveSourceSelection | null {
    if (typeof localStorage === "undefined") return null;
    try {
      const raw = localStorage.getItem(`${ACTIVE_SELECTION_STORAGE_KEY_PREFIX}${contextId}`);
      return raw ? JSON.parse(raw) : null;
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

  delete(contextId: string): void {
    if (typeof localStorage === "undefined") return;
    try {
      localStorage.removeItem(`${ACTIVE_SELECTION_STORAGE_KEY_PREFIX}${contextId}`);
    } catch {}
  }
};
