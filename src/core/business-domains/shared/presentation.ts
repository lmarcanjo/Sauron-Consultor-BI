import { BusinessPresentationTemplate } from "../BusinessDomainTypes";

export const presentation: BusinessPresentationTemplate = {
  cards: ["REVENUE", "PROFIT", "MARGIN"],
  charts: ["Faturamento Mensal", "Distribuição de Despesas"],
  rankings: ["Melhores Filiais por Receita", "Melhores Vendedores"],
  narrativeTemplate: "O grupo registrou faturamento de {REVENUE} com margem média de {MARGIN}%.",
  minutesTemplate: "A receita líquida foi de {REVENUE} com lucro de {PROFIT}.",
  slides: [
    { title: "Capa do Resultado", type: "cover", layout: "default", elements: [] },
    { title: "Destaques Financeiros", type: "kpis", layout: "grid", elements: ["REVENUE", "PROFIT", "MARGIN"] }
  ]
};
