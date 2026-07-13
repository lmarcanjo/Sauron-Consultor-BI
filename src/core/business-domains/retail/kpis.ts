import { BusinessKpi } from "../BusinessDomainTypes";

export const kpis: BusinessKpi[] = [
  { code: "RETAIL_TICKET", name: "Ticket Médio", unit: "currency", description: "Valor médio faturado por cupom fiscal emitido." },
  { code: "CONVERSION_RATE", name: "Taxa de Conversão", unit: "percentage", description: "Percentual de visitantes que realizaram uma compra." },
  { code: "RETAIL_MARGIN", name: "Margem de Contribuição", unit: "percentage", description: "Lucro bruto dividido pela receita de vendas." },
  { code: "SELL_OUT", name: "Sell-out", unit: "currency", description: "Vendas diretas aos consumidores finais no PDV." }
];
