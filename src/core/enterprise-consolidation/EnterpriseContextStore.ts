/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * F15.1 — Enterprise Consolidation & Context Navigation
 * EnterpriseContextStore.ts — Armazenamento e sincronização do contexto organizacional ativo.
 */

import { EnterpriseContext } from "./EnterpriseContextTypes";

const STORAGE_KEY = "sauron_active_enterprise_context";

const getInitialContext = (): EnterpriseContext => {
  if (typeof localStorage !== "undefined") {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
      
      // Tentar construir a partir de chaves antigas de compatibilidade
      const groupId = localStorage.getItem("sauron_active_group_id") || undefined;
      const companyId = localStorage.getItem("sauron_active_company_id") || undefined;
      const unitId = localStorage.getItem("sauron_active_unit_id") || undefined;
      
      let scope: EnterpriseContext["scope"] = "GROUP";
      if (unitId) scope = "UNIT";
      else if (companyId) scope = "COMPANY";

      return {
        groupId,
        companyId,
        unitId,
        workbookIds: [],
        datasetIds: [],
        scope
      };
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

export const setEnterpriseContext = (context: EnterpriseContext): void => {
  currentContext = { ...context };

  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentContext));
      
      // Sincronizar chaves legadas por compatibilidade
      if (currentContext.groupId) {
        localStorage.setItem("sauron_active_group_id", currentContext.groupId);
      } else {
        localStorage.removeItem("sauron_active_group_id");
      }

      if (currentContext.companyId) {
        localStorage.setItem("sauron_active_company_id", currentContext.companyId);
      } else {
        localStorage.removeItem("sauron_active_company_id");
      }

      if (currentContext.unitId) {
        localStorage.setItem("sauron_active_unit_id", currentContext.unitId);
      } else {
        localStorage.removeItem("sauron_active_unit_id");
      }

      // Despachar evento para notificar componentes de fora do React
      window.dispatchEvent(new CustomEvent("sauron:context-updated", { detail: currentContext }));
    } catch (e) {
      console.error("[EnterpriseContextStore] Failed to save context to localStorage", e);
    }
  }

  listeners.forEach(listener => listener(currentContext));
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
