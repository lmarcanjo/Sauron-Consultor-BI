import { BusinessMeetingTemplate } from "../BusinessDomainTypes";

export const meeting: BusinessMeetingTemplate = {
  subjectOrder: ["Disponibilidade das Máquinas", "Indicadores de Qualidade e Refugo", "Desempenho de OEE por Linha", "Análise de Paradas e Manutenção"],
  mandatoryKpis: ["OEE", "PRODUCTION_QTY", "SCRAP_QTY"],
  optionalKpis: ["EFFICIENCY"],
  suggestedQuestions: [
    "Quais os motivos principais para as paradas não programadas da linha?",
    "A taxa de refugo reduziu após a calibração do maquinário?",
    "A eficiência real de produção está de acordo com a velocidade teórica definida?"
  ],
  riscos: ["Quebra mecânica catastrófica de equipamento gargalo", "Lote inteiro rejeitado por desvio de calibração"],
  acoes: ["Reestruturação do plano de manutenção preventiva semanal", "Implementação de controle estatístico de processo (CEP) em tempo real"]
};
