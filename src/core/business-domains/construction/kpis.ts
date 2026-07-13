import { BusinessKpi } from "../BusinessDomainTypes";

export const kpis: BusinessKpi[] = [
  { code: "SCHEDULE_DAYS", name: "Prazo da Obra", unit: "days", description: "Tempo total estimado/decorrido da obra em dias." },
  { code: "BUDGET_VARIANCE", name: "Desvio Orçamentário", unit: "percentage", description: "Percentual de desvio entre o custo orçado e o custo realizado." },
  { code: "ACTUAL_COST", name: "Custo Real", unit: "currency", description: "Soma total dos gastos efetuados na obra até o momento." },
  { code: "CONSTR_MARGIN", name: "Margem Prevista", unit: "percentage", description: "Lucro estimado do empreendimento dividido pelo valor contratual." }
];
