import { BusinessPresentationTemplate } from "../BusinessDomainTypes";

export const presentation: BusinessPresentationTemplate = {
  cards: ["OEE", "PRODUCTION_QTY", "SCRAP_QTY"],
  charts: ["Evolução Mensal do OEE", "Pareto de Causas de Parada de Linha"],
  rankings: ["Linhas de Produção Mais Eficientes", "Maiores Fontes de Refugo"],
  narrativeTemplate: "A fábrica registrou um OEE médio de {OEE}%, produzindo {PRODUCTION_QTY} unidades com refugo de {SCRAP_QTY} unidades.",
  minutesTemplate: "O OEE médio foi reportado em {OEE}% com volume de refugo em {SCRAP_QTY}.",
  slides: [
    { title: "Desempenho da Planta Industrial", type: "cover", layout: "default", elements: [] },
    { title: "Eficiência Geral de Equipamentos (OEE)", type: "kpis", layout: "grid", elements: ["OEE", "PRODUCTION_QTY", "SCRAP_QTY"] }
  ]
};
