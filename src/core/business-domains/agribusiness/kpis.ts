import { BusinessKpi } from "../BusinessDomainTypes";

export const kpis: BusinessKpi[] = [
  { code: "PRODUCTION", name: "Produção Total", unit: "numeric", description: "Volume total colhido (ex: em toneladas ou sacas)." },
  { code: "PRODUCTIVITY", name: "Produtividade", unit: "ratio", description: "Volume colhido por unidade de área (ex: sacas/hectare)." },
  { code: "COST_HECTARE", name: "Custo por Hectare", unit: "currency", description: "Custo operacional total dividido pela área plantada." },
  { code: "AGRO_REVENUE", name: "Receita Agrícola", unit: "currency", description: "Faturamento obtido com a venda de commodities/produtos agrícolas." },
  { code: "AGRO_MARGIN", name: "Margem da Safra", unit: "percentage", description: "Rentabilidade percentual líquida das culturas." },
  { code: "EXPORT", name: "Volume de Exportação", unit: "numeric", description: "Quantidade total de produtos exportados para outros mercados." },
  { code: "HARVEST", name: "Progresso de Colheita", unit: "percentage", description: "Percentual da área total cultivada que já foi colhida." }
];
