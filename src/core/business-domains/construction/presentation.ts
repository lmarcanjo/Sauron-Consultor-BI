import { BusinessPresentationTemplate } from "../BusinessDomainTypes";

export const presentation: BusinessPresentationTemplate = {
  cards: ["SCHEDULE_DAYS", "BUDGET_VARIANCE", "ACTUAL_COST"],
  charts: ["Curva S de Avanço da Obra", "Distribuição de Custos por Categoria"],
  rankings: ["Obras com Menor Desvio Orçamentário", "Etapas Mais Atrasadas"],
  narrativeTemplate: "A obra acumulou custo real de {ACTUAL_COST} com desvio orçamentário de {BUDGET_VARIANCE}% em relação ao plano.",
  minutesTemplate: "Concluiu-se que o atraso de {SCHEDULE_DAYS} dias decorre de gargalos de medição, elevando o custo para {ACTUAL_COST}.",
  slides: [
    { title: "Status Físico-Financeiro das Obras", type: "cover", layout: "default", elements: [] },
    { title: "Gestão de Prazos & Custos", type: "kpis", layout: "grid", elements: ["SCHEDULE_DAYS", "BUDGET_VARIANCE", "ACTUAL_COST"] }
  ]
};
