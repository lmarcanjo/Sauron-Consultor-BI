import { BusinessPresentationTemplate } from "../BusinessDomainTypes";

export const presentation: BusinessPresentationTemplate = {
  cards: ["OCCUPANCY_RATE", "AVERAGE_STAY", "HEALTH_REVENUE"],
  charts: ["Evolução Mensal da Ocupação", "Glosas por Convênio"],
  rankings: ["Unidades com Melhor Giro de Leitos", "Médicos por Volume de Procedimentos"],
  narrativeTemplate: "A taxa de ocupação hospitalar foi de {OCCUPANCY_RATE}% com tempo médio de internação de {AVERAGE_STAY} dias.",
  minutesTemplate: "Concluiu-se que o tempo médio de internação de {AVERAGE_STAY} dias gerou receita de {HEALTH_REVENUE}.",
  slides: [
    { title: "Desempenho Operacional e Clínico", type: "cover", layout: "default", elements: [] },
    { title: "Gargalos de Leitos & Glosas", type: "kpis", layout: "grid", elements: ["OCCUPANCY_RATE", "AVERAGE_STAY", "HEALTH_REVENUE"] }
  ]
};
