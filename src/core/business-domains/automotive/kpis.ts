import { BusinessKpi } from "../BusinessDomainTypes";

export const kpis: BusinessKpi[] = [
  { code: "TICKET_MEDIO", name: "Ticket Médio", unit: "currency", description: "Valor médio faturado por transação/veículo." },
  { code: "PECAS_REVENUE", name: "Faturamento de Peças", unit: "currency", description: "Valor total das vendas de autopeças." },
  { code: "GARANTIA_REVENUE", name: "Receita de Garantia", unit: "currency", description: "Faturamento decorrente de serviços cobertos pela garantia da montadora." },
  { code: "VEICULOS_REVENUE", name: "Venda de Veículos", unit: "currency", description: "Receita proveniente de vendas de veículos novos e seminovos." },
  { code: "COMISSAO_PAGUES", name: "Comissão do Consultor", unit: "currency", description: "Comissão paga aos vendedores de veículos ou serviços." },
  { code: "POS_VENDA_REVENUE", name: "Faturamento de Pós-venda", unit: "currency", description: "Faturamento somado da oficina, peças e serviços técnicos." }
];
