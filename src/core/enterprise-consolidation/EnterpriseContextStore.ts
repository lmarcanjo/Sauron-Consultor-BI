/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * F15.1 — Enterprise Consolidation & Context Navigation
 * EnterpriseContextStore.ts — Armazenamento e sincronização do contexto organizacional ativo.
 */

import { EnterpriseContext } from "./EnterpriseContextTypes";
import { dispatchPlatformEvent, PLATFORM_EVENTS } from "../events/PlatformEvents";
import { runLegacyCompatibilityMigration } from "../migrations/LegacyCompatibilityMigration";

const STORAGE_KEY = "sauron_active_enterprise_context";
type ContextRefreshOptions = { refreshSources?: boolean };
type ContextResolver = (context: EnterpriseContext) => Promise<void>;
let contextResolver: ContextResolver | null = null;
let refreshSequence = 0;

export function registerEnterpriseContextResolver(resolver: ContextResolver): () => void {
  contextResolver = resolver;
  return () => {
    if (contextResolver === resolver) contextResolver = null;
  };
}

const getInitialContext = (): EnterpriseContext => {
  runLegacyCompatibilityMigration();
  if (typeof localStorage !== "undefined") {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
      
      return { workbookIds: [], datasetIds: [], scope: "GROUP" };
    } catch (e) {
      console.error("[EnterpriseContextStore] Error parsing context from localStorage", e);
    }
  }

  return {
    scope: "GROUP",
    workbookIds: [],
    datasetIds: []
  };
};

let currentContext: EnterpriseContext = getInitialContext();
const listeners = new Set<(ctx: EnterpriseContext) => void>();

export const getEnterpriseContext = (): EnterpriseContext => {
  return { ...currentContext };
};

export const setEnterpriseContext = (context: EnterpriseContext, options: ContextRefreshOptions = {}): void => {
  currentContext = { ...context };

  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentContext));
      
      dispatchPlatformEvent(PLATFORM_EVENTS.ENTERPRISE_CONTEXT_CHANGED, currentContext);
    } catch (e) {
      console.error("[EnterpriseContextStore] Failed to save context to localStorage", e);
    }
  }

  listeners.forEach(listener => listener(currentContext));

  if (options.refreshSources !== false && contextResolver) {
    const sequence = ++refreshSequence;
    void Promise.resolve().then(async () => {
      if (sequence !== refreshSequence || !contextResolver) return;
      await contextResolver({ ...currentContext });
    }).catch(error => {
      console.error("[EnterpriseContextStore] Não foi possível atualizar as fontes do contexto", error);
    });
  }
};

export const subscribeEnterpriseContext = (listener: (ctx: EnterpriseContext) => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const clearEnterpriseContext = (): void => {
  setEnterpriseContext({
    scope: "GROUP",
    workbookIds: [],
    datasetIds: []
  });
};
