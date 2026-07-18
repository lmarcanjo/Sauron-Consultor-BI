/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BusinessAreaConfig, CustomMetricConfig, SelectedFieldConfig } from "./ConsultingModelRepository";

export interface BusinessAreaDefinition extends BusinessAreaConfig {
  icon?: string;
  color?: string;
  dashboards?: any[];
  presentations?: any[];
  meetingTopics?: any[];
  reports?: any[];
  permissions?: string[];
}

export interface ProjectDNA {
  projectId: string;
  consultingMethod: string;
  businessAreas: BusinessAreaDefinition[];
  terminology: Record<string, string>;
  visualIdentity: {
    theme: "dark" | "light" | "orbital";
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    logoUrl?: string;
  };
  presentationStyle: string;
  meetingStyle: string;
  permissions: string[];
  customMetrics: CustomMetricConfig[];
  customDashboards: any[];
  customReports: any[];
  aiBehavior: string;
}

export interface PredefinedQuestion {
  id: string;
  text: string;
  description: string;
  targetOperation: "sum" | "average" | "count" | "distinct_count" | "min" | "max";
  expectedFieldRole: string; // e.g. "value", "margin", "product", "seller", "employee"
  format: "currency" | "number" | "percentage";
}

export const PREDEFINED_QUESTIONS: PredefinedQuestion[] = [
  {
    id: "q_seller_sales",
    text: "Qual vendedor vende mais?",
    description: "Soma das vendas agregada por vendedor.",
    targetOperation: "sum",
    expectedFieldRole: "seller",
    format: "currency"
  },
  {
    id: "q_store_margin",
    text: "Qual loja/unidade tem maior margem?",
    description: "Média das margens de contribuição agregada por filial.",
    targetOperation: "average",
    expectedFieldRole: "store",
    format: "percentage"
  },
  {
    id: "q_product_low_turnover",
    text: "Qual produto gira menos?",
    description: "Soma de vendas (faturamento) agrupada por produto (ordem crescente).",
    targetOperation: "sum",
    expectedFieldRole: "product",
    format: "currency"
  },
  {
    id: "q_team_production",
    text: "Qual equipe/setor produz mais?",
    description: "Contagem de registros de produção agrupada por setor.",
    targetOperation: "count",
    expectedFieldRole: "department",
    format: "number"
  },
  {
    id: "q_technician_clients",
    text: "Qual técnico atende mais clientes?",
    description: "Contagem de clientes únicos atendidos por colaborador.",
    targetOperation: "distinct_count",
    expectedFieldRole: "employee",
    format: "number"
  }
];

export interface IndustryBlueprint {
  id: string;
  name: string;
  description: string;
  iconKey: string;
  businessAreas: BusinessAreaDefinition[];
  terminology: Record<string, string>;
  visualIdentity: ProjectDNA["visualIdentity"];
}

export const BLUEPRINTS: IndustryBlueprint[] = [
  {
    id: "financeiro",
    name: "Método Financeiro Tradicional",
    description: "Foco em margens, custos fixos/variáveis, fluxo de caixa e rentabilidade.",
    iconKey: "Calculator",
    terminology: {
      people: "Colaboradores",
      commission: "Remuneração Variável",
      dashboard: "Painel Financeiro",
      report: "Diagnóstico Mensal",
      presentation: "Relatório de Resultados"
    },
    visualIdentity: {
      theme: "orbital",
      primaryColor: "#0f172a",
      secondaryColor: "#1e293b",
      accentColor: "#0ea5e9"
    },
    businessAreas: [
      { id: "financeiro", name: "Resultados Gerais", description: "Fluxo de caixa consolidado e receitas.", iconKey: "Calculator", relatedFields: [], relatedMetrics: [], order: 1, visible: true },
      { id: "dre", name: "Demonstrativo (DRE)", description: "Estrutura contábil de receitas, custos e despesas.", iconKey: "Target", relatedFields: [], relatedMetrics: [], order: 2, visible: true }
    ]
  },
  {
    id: "comercial",
    name: "Método de Performance Comercial",
    description: "Foco em funil de vendas, ticket médio, margens de produtos e metas de vendedores.",
    iconKey: "TrendingUp",
    terminology: {
      people: "Equipe Comercial",
      commission: "Comissões de Vendas",
      dashboard: "Painel Comercial",
      report: "Dossiê de Performance",
      presentation: "Deck de Vendas"
    },
    visualIdentity: {
      theme: "orbital",
      primaryColor: "#172554",
      secondaryColor: "#1e3a8a",
      accentColor: "#eab308"
    },
    businessAreas: [
      { id: "comercial", name: "Resultados Gerais", description: "Indicadores de faturamento e ticket médio.", iconKey: "TrendingUp", relatedFields: [], relatedMetrics: [], order: 1, visible: true },
      { id: "comissoes", name: "Remunerações", description: "Distribuição de incentivos e comissões da equipe.", iconKey: "Award", relatedFields: [], relatedMetrics: [], order: 2, visible: true }
    ]
  },
  {
    id: "agro",
    name: "Método de Gestão Agrícola",
    description: "Foco em produtores, fazendas, insumos, talhões de safras e prêmio de colheita.",
    iconKey: "Layers",
    terminology: {
      people: "Produtores",
      customer: "Comprador",
      seller: "Representante",
      department: "Talhão",
      branch: "Fazenda",
      company: "Cooperativa",
      group: "Grupo Agrícola",
      commission: "Prêmio de Safra",
      dashboard: "Painel da Safra",
      report: "Relatório de Colheita",
      meeting: "Assembleia",
      presentation: "Relatório de Safra"
    },
    visualIdentity: {
      theme: "orbital",
      primaryColor: "#064e3b",
      secondaryColor: "#065f46",
      accentColor: "#10b981"
    },
    businessAreas: [
      { id: "safras", name: "Produção de Safras", description: "Métricas de rendimento de colheita por fazenda.", iconKey: "Layers", relatedFields: [], relatedMetrics: [], order: 1, visible: true },
      { id: "talhoes", name: "Gestão de Talhões", description: "Acompanhamento de insumos por área produtiva.", iconKey: "Sprout", relatedFields: [], relatedMetrics: [], order: 2, visible: true }
    ]
  },
  {
    id: "industria",
    name: "Método de Eficiência Industrial (OEE)",
    description: "Foco em linhas de produção, tempos de parada, eficiência, custos industriais e OEE.",
    iconKey: "Settings",
    terminology: {
      people: "Operadores",
      department: "Linha de Produção",
      branch: "Fábrica",
      commission: "Prêmio de Produtividade",
      dashboard: "Painel de Eficiência",
      report: "Relatório de OEE",
      presentation: "Status de Manutenção"
    },
    visualIdentity: {
      theme: "orbital",
      primaryColor: "#1c1917",
      secondaryColor: "#292524",
      accentColor: "#f97316"
    },
    businessAreas: [
      { id: "producao", name: "Eficiência Industrial", description: "Cálculo de OEE e análise de gargalos.", iconKey: "Settings", relatedFields: [], relatedMetrics: [], order: 1, visible: true },
      { id: "manutencao", name: "Paradas & Manutenção", description: "Histórico de manutenções preventivas e corretivas.", iconKey: "Wrench", relatedFields: [], relatedMetrics: [], order: 2, visible: true }
    ]
  }
];

export const projectDNAManager = {
  getDNA(workspaceId: string, companyId?: string): ProjectDNA {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(`sauron_dna_${workspaceId}_${companyId || "default"}`) : null;
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        // Fallback below
      }
    }
    return this.createDefaultDNA(workspaceId, companyId);
  },

  saveDNA(dna: ProjectDNA): void {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(`sauron_dna_${dna.projectId}`, JSON.stringify(dna));
    // Sincronizar com ConsultingModel
    try {
      const parts = dna.projectId.split("_");
      const workspaceId = parts[0] || "workspace_default";
      const companyId = parts.slice(1).join("_") || undefined;
      const modelKey = `sauron_consulting_model_${workspaceId}_${companyId || "group_default"}`;
      let existingConfig: any = null;
      try {
        const rawExisting = localStorage.getItem(modelKey);
        if (rawExisting) existingConfig = JSON.parse(rawExisting);
      } catch (e) {}

      const modelConfig = {
        workspaceId,
        companyId,
        groupId: "grupo_default",
        enabledModules: dna.businessAreas.map(b => b.id),
        businessAreas: dna.businessAreas,
        customMetrics: dna.customMetrics,
        displayDictionary: dna.terminology,
        selectedFields: existingConfig?.selectedFields || {},
        navigationPreferences: existingConfig?.navigationPreferences,
        createdAt: existingConfig?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(modelKey, JSON.stringify(modelConfig));
      localStorage.setItem("sauron_active_consulting_config", JSON.stringify(modelConfig));
      window.dispatchEvent(new CustomEvent("sauron:config-updated", { detail: modelConfig }));
    } catch (e) {
      console.error("[ProjectDNAManager] Failed to sync with ConsultingModel:", e);
    }
  },

  createDefaultDNA(workspaceId: string, companyId?: string): ProjectDNA {
    const defaultBlueprint = BLUEPRINTS[0]; // Financeiro
    return {
      projectId: `${workspaceId}_${companyId || "default"}`,
      consultingMethod: defaultBlueprint.name,
      terminology: defaultBlueprint.terminology,
      visualIdentity: defaultBlueprint.visualIdentity,
      businessAreas: defaultBlueprint.businessAreas,
      presentationStyle: "clean",
      meetingStyle: "formal",
      permissions: ["READ", "WRITE"],
      customMetrics: [],
      customDashboards: [],
      customReports: [],
      aiBehavior: "analytical"
    };
  }
};
