import { BusinessMeetingTemplate } from "../BusinessDomainTypes";

export const meeting: BusinessMeetingTemplate = {
  subjectOrder: ["Fluxo de Loja e Conversão", "Venda Diária (Sell-out)", "Giro de Estoque e SKU", "Ações Promocionais"],
  mandatoryKpis: ["RETAIL_TICKET", "CONVERSION_RATE", "SELL_OUT"],
  optionalKpis: ["RETAIL_MARGIN"],
  suggestedQuestions: [
    "Qual a taxa de conversão média no final de semana?",
    "Quais SKUs estão com giro abaixo do esperado e gerando estoque obsoleto?",
    "O ticket médio variou significativamente após a nova campanha de marketing?"
  ],
  riscos: ["Ruptura de estoque de SKUs de curva A", "Queda de margem por excesso de descontos promocionais"],
  acoes: ["Automação de ressuprimento de estoque mínimo", "Limitação de cupons de descontos para produtos selecionados"]
};
