import { BusinessKpi } from "../BusinessDomainTypes";

export const kpis: BusinessKpi[] = [
  { code: "OCCUPANCY_RATE", name: "Taxa de Ocupação", unit: "percentage", description: "Percentual de leitos hospitalares ocupados no período." },
  { code: "AVERAGE_STAY", name: "Tempo Médio de Internação", unit: "days", description: "Média de dias que um paciente permanece internado." },
  { code: "HEALTH_REVENUE", name: "Receita de Saúde", unit: "currency", description: "Faturamento gerado por consultas, diárias e procedimentos." },
  { code: "HEALTH_COST", name: "Custos Médicos", unit: "currency", description: "Gastos com insumos, OPME, honorários e manutenção hospitalar." }
];
