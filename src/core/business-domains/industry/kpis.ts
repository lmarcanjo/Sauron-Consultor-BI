import { BusinessKpi } from "../BusinessDomainTypes";

export const kpis: BusinessKpi[] = [
  { code: "OEE", name: "OEE", unit: "percentage", description: "Overall Equipment Effectiveness (Eficiência Global do Equipamento)." },
  { code: "PRODUCTION_QTY", name: "Produção", unit: "numeric", description: "Quantidade física de itens produzidos." },
  { code: "SCRAP_QTY", name: "Refugo", unit: "numeric", description: "Quantidade física de itens descartados/defeituosos." },
  { code: "EFFICIENCY", name: "Eficiência", unit: "percentage", description: "Percentual da produção real em relação à capacidade nominal da linha." }
];
