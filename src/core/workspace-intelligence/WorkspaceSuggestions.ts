import { businessDomainEngine } from "../business-domains/BusinessDomainEngine";
import { getBusinessDomainLabel } from "./BusinessDomainClassifier";
import { BusinessDomain } from "./WorkspaceIntelligenceTypes";
import { WorkspaceContext } from "./types";

export interface WorkspaceSuggestionKpi {
  name: string;
  target: string;
  description: string;
}

export interface WorkspaceSuggestions {
  segmentName: string;
  widgets: string[];
  contextTabs: { id: string; label: string; icon?: string }[];
  kpis: WorkspaceSuggestionKpi[];
  rituais: { name: string; description: string; frequency: string }[];
  alertas: { title: string; description: string; priority: "low" | "medium" | "high" }[];
  acoesRecomendadas: { label: string; description: string; actionType: string }[];
}

/**
 * Supplies the case shell with domain-pack metadata only. It deliberately
 * does not invent targets, alerts, or operational results.
 */
export function buildWorkspaceSuggestions(context: WorkspaceContext): WorkspaceSuggestions {
  const domainId = businessDomainEngine.getActiveDomainId() as BusinessDomain;
  const domainName = getBusinessDomainLabel(domainId);
  const domainKpis = businessDomainEngine.getKPIs(domainId);

  return {
    segmentName: domainName === "Indefinido" ? context.segmento || "Operação geral" : domainName,
    widgets: [],
    contextTabs: [],
    kpis: domainKpis.map(kpi => ({
      name: kpi.name,
      target: "Não configurado",
      description: kpi.description || "Indicador disponível após configurar os campos da fonte.",
    })),
    rituais: [],
    alertas: [{
      title: "Nenhum alerta calculado",
      description: "Configure os campos da fonte para gerar alertas baseados em dados reais.",
      priority: "low",
    }],
    acoesRecomendadas: [{
      label: "Configurar campos da análise",
      description: "Escolha as colunas da fonte que alimentam este contexto.",
      actionType: "configure_mapping",
    }],
  };
}
