import { BusinessPresentationTemplate } from "../BusinessDomainTypes";

export const presentation: BusinessPresentationTemplate = {
  cards: ["VEICULOS_REVENUE", "POS_VENDA_REVENUE", "TICKET_MEDIO"],
  charts: ["Margem Bruta por Departamento", "Evolução do F&I"],
  rankings: ["Melhores Concessionárias por Volume", "Ranking de Consultores de Vendas"],
  narrativeTemplate: "A concessionária atingiu faturamento de {VEICULOS_REVENUE} em veículos novos e {POS_VENDA_REVENUE} em serviços, com um ticket médio geral de {TICKET_MEDIO}.",
  minutesTemplate: "Em assembleia geral das concessionárias do grupo, discutiram-se o faturamento de {VEICULOS_REVENUE} e pós-vendas de {POS_VENDA_REVENUE}.",
  slides: [
    { title: "Resultado Consolidado da Rede", type: "cover", layout: "default", elements: [] },
    { title: "Desempenho Comercial & Pós-Venda", type: "kpis", layout: "grid", elements: ["VEICULOS_REVENUE", "POS_VENDA_REVENUE", "TICKET_MEDIO"] }
  ]
};
