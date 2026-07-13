import { BusinessKpi } from "../BusinessDomainTypes";

export const kpis: BusinessKpi[] = [
  { code: "PROJECT_HOURS", name: "Horas de Projeto", unit: "hours", description: "Total de horas reportadas/trabalhadas no projeto." },
  { code: "BILLABLE_REVENUE", name: "Receita Faturável", unit: "currency", description: "Valor total faturado/recebido pelos serviços prestados." },
  { code: "SERVICES_MARGIN", name: "Margem do Projeto", unit: "percentage", description: "Margem operacional obtida pela dedução de custos de consultores." }
];
