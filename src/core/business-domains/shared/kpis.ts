import { BusinessKpi } from "../BusinessDomainTypes";

export const kpis: BusinessKpi[] = [
  { code: "REVENUE", name: "Receita Total", unit: "currency", description: "Soma de todas as receitas brutas." },
  { code: "EXPENSE", name: "Despesa Total", unit: "currency", description: "Soma de todas as despesas operacionais." },
  { code: "PROFIT", name: "Lucro Líquido", unit: "currency", description: "Receita total deduzida de custos e despesas." },
  { code: "MARGIN", name: "Margem Operacional", unit: "percentage", description: "Lucro Líquido dividido pela Receita Total." },
  { code: "COMMISSION", name: "Comissão Total", unit: "currency", description: "Soma das comissões pagas aos vendedores." }
];
