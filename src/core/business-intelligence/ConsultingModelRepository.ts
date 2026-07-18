/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { persistenceManager } from "../persistence/PersistenceManager";

export interface SelectedFieldConfig {
  fieldId: string;
  physicalName: string;
  sheetName: string;
  detectedType: string;
  interpretation?: string;
  confidence?: number;
  use: "compare_values" | "group_results" | "filter_analyses" | "show_indicator" | "show_tables" | "auxiliary_detail" | "do_not_use";
  displayLabel: string;
  consultantLabel?: string;
  visible: boolean;
}

export interface BusinessAreaConfig {
  id: string;
  name: string;
  description: string;
  iconKey: string;
  relatedFields: string[];
  relatedMetrics: string[];
  order: number;
  visible: boolean;
}

export interface CustomMetricConfig {
  id: string;
  name: string;
  fieldId: string;
  operation: "sum" | "average" | "count" | "distinct_count" | "min" | "max" | "percentage" | "difference";
  groupBy?: string;
  format: "currency" | "number" | "percentage";
  visibleIn: string[];
}

export interface ConsultingModelConfiguration {
  workspaceId: string;
  groupId: string;
  companyId?: string; // empty means group-wide or default
  enabledModules: string[];
  businessAreas: BusinessAreaConfig[];
  selectedFields: Record<string, SelectedFieldConfig>; // keyed by physicalName
  customMetrics: CustomMetricConfig[];
  displayDictionary: Record<string, string>; // term -> custom label
  navigationPreferences?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export function getActiveConsultingModelConfigSync(): ConsultingModelConfiguration | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem("sauron_active_consulting_config");
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function setActiveConsultingModelConfigSync(config: ConsultingModelConfiguration | null): void {
  if (typeof localStorage === "undefined") return;
  if (config) {
    localStorage.setItem("sauron_active_consulting_config", JSON.stringify(config));
  } else {
    localStorage.removeItem("sauron_active_consulting_config");
  }
}

export class ConsultingModelRepository {
  private static STORAGE_KEY_PREFIX = "sauron_consulting_model_";

  private getStorageKey(workspaceId: string, companyId?: string): string {
    const cleanCompanyId = companyId || "group_default";
    return `${ConsultingModelRepository.STORAGE_KEY_PREFIX}${workspaceId}_${cleanCompanyId}`;
  }

  public async getConfiguration(workspaceId: string, companyId?: string): Promise<ConsultingModelConfiguration | null> {
    const key = this.getStorageKey(workspaceId, companyId);
    return await persistenceManager.get<ConsultingModelConfiguration>(key);
  }

  public async saveConfiguration(config: ConsultingModelConfiguration): Promise<void> {
    const key = this.getStorageKey(config.workspaceId, config.companyId);
    config.updatedAt = new Date().toISOString();
    await persistenceManager.set(key, config);
    setActiveConsultingModelConfigSync(config);
    
    // Dispatch sync event
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("sauron:consulting-model-updated", { detail: config }));
    }
  }

  public createDefaultConfiguration(workspaceId: string, groupId: string, companyId?: string): ConsultingModelConfiguration {
    const now = new Date().toISOString();
    return {
      workspaceId,
      groupId,
      companyId,
      enabledModules: ["diagnostico", "financeiro", "dre", "comercial", "pessoas", "comissao", "apresentacao", "reuniao", "plano", "historico"],
      businessAreas: [
        {
          id: "financeiro",
          name: "Resultado Financeiro",
          description: "Análise de receitas, custos, despesas e margem operacional.",
          iconKey: "DollarSign",
          relatedFields: [],
          relatedMetrics: [],
          order: 1,
          visible: true
        },
        {
          id: "comercial",
          name: "Comercial",
          description: "Desempenho de vendas, clientes e comissões.",
          iconKey: "TrendingUp",
          relatedFields: [],
          relatedMetrics: [],
          order: 2,
          visible: true
        },
        {
          id: "pessoas",
          name: "Pessoas",
          description: "Gestão e performance de equipes e representantes.",
          iconKey: "Users",
          relatedFields: [],
          relatedMetrics: [],
          order: 3,
          visible: true
        }
      ],
      selectedFields: {},
      customMetrics: [],
      displayDictionary: {},
      createdAt: now,
      updatedAt: now
    };
  }
}

export const consultingModelRepository = new ConsultingModelRepository();
export default consultingModelRepository;
