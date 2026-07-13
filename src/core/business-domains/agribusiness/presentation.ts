import { BusinessPresentationTemplate } from "../BusinessDomainTypes";

export const presentation: BusinessPresentationTemplate = {
  cards: ["PRODUCTION", "PRODUCTIVITY", "COST_HECTARE"],
  charts: ["Produtividade Histórica", "Custo Unitário de Produção"],
  rankings: ["Melhores Fazendas por Produtividade", "Rendimento de Talhões"],
  narrativeTemplate: "A produção consolidada atingiu {PRODUCTION} com uma produtividade média de {PRODUCTIVITY} por hectare.",
  minutesTemplate: "Durante o comitê agrícola, reportou-se uma produção de {PRODUCTION} e o plano para mitigar o custo/hectare de {COST_HECTARE}.",
  slides: [
    { title: "Desempenho da Safra Atual", type: "cover", layout: "default", elements: [] },
    { title: "Rendimento e Produtividade Física", type: "kpis", layout: "grid", elements: ["PRODUCTION", "PRODUCTIVITY", "COST_HECTARE"] }
  ]
};
