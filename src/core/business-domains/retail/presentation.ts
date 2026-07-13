import { BusinessPresentationTemplate } from "../BusinessDomainTypes";

export const presentation: BusinessPresentationTemplate = {
  cards: ["SELL_OUT", "CONVERSION_RATE", "RETAIL_TICKET"],
  charts: ["Faturamento do PDV por Hora", "Participação de SKU nas Vendas"],
  rankings: ["Melhores Lojas por Faturamento", "Melhores SKUs por Margem"],
  narrativeTemplate: "O sell-out geral somou {SELL_OUT} com conversão de {CONVERSION_RATE}% e ticket médio de {RETAIL_TICKET}.",
  minutesTemplate: "Verificou-se que a meta de sell-out de {SELL_OUT} foi superada devido ao ticket médio de {RETAIL_TICKET}.",
  slides: [
    { title: "Desempenho Comercial de Lojas", type: "cover", layout: "default", elements: [] },
    { title: "Métricas de Conversão de PDV", type: "kpis", layout: "grid", elements: ["SELL_OUT", "CONVERSION_RATE", "RETAIL_TICKET"] }
  ]
};
