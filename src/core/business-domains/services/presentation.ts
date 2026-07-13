import { BusinessPresentationTemplate } from "../BusinessDomainTypes";

export const presentation: BusinessPresentationTemplate = {
  cards: ["PROJECT_HOURS", "BILLABLE_REVENUE", "SERVICES_MARGIN"],
  charts: ["Horas Lançadas por Mês", "Margem por Projeto"],
  rankings: ["Consultores com Maior Alocação", "Projetos com Maior Faturamento"],
  narrativeTemplate: "A equipe de serviços registrou faturamento de {BILLABLE_REVENUE} com {PROJECT_HOURS} horas de esforço e margem de {SERVICES_MARGIN}%.",
  minutesTemplate: "Reportou-se faturamento de {BILLABLE_REVENUE} consumindo {PROJECT_HOURS} horas de consultoria.",
  slides: [
    { title: "Desempenho Comercial de Serviços", type: "cover", layout: "default", elements: [] },
    { title: "Alocação Físico-Financeira de Projetos", type: "kpis", layout: "grid", elements: ["PROJECT_HOURS", "BILLABLE_REVENUE", "SERVICES_MARGIN"] }
  ]
};
