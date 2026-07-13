import { BusinessMeetingTemplate } from "../BusinessDomainTypes";

export const meeting: BusinessMeetingTemplate = {
  subjectOrder: ["Taxa de Ocupação de Leitos", "Gargalos de Alta e Giro de Leitos", "Repasse e Custos Assistenciais", "Faturamento e Glosas de Convênios"],
  mandatoryKpis: ["OCCUPANCY_RATE", "AVERAGE_STAY"],
  optionalKpis: ["HEALTH_REVENUE", "HEALTH_COST"],
  suggestedQuestions: [
    "A taxa de ocupação de UTI está próxima da capacidade crítica?",
    "Quais convênios apresentaram as maiores taxas de glosa este mês?",
    "Houve aumento no tempo médio de internação devido a infecção hospitalar?"
  ],
  riscos: ["Superlotação do pronto-socorro", "Aumento inesperado de glosas por auditoria de prontuários"],
  acoes: ["Otimização do fluxo de alta médica (alta qualificada)", "Melhoria do preenchimento das guias na recepção e enfermagem"]
};
