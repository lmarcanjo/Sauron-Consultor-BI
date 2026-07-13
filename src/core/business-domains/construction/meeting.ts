import { BusinessMeetingTemplate } from "../BusinessDomainTypes";

export const meeting: BusinessMeetingTemplate = {
  subjectOrder: ["Avanço Físico e Cronograma", "Medição e Faturamento de Empreiteiros", "Orçado vs Realizado de Custos", "Gestão de Suprimentos e Estoques", "Plano de Segurança"],
  mandatoryKpis: ["SCHEDULE_DAYS", "BUDGET_VARIANCE", "ACTUAL_COST"],
  optionalKpis: ["CONSTR_MARGIN"],
  suggestedQuestions: [
    "O avanço físico está de acordo com a última medição aprovada?",
    "Qual o desvio financeiro acumulado na etapa de fundação/estrutura?",
    "Os suprimentos críticos estão com entrega garantida para o próximo mês?"
  ],
  riscos: ["Embargo de obra por desconformidade regulatória", "Aumento substancial no preço do aço ou cimento"],
  acoes: ["Auditoria periódica de segurança e EPIs", "Negociação de contratos de longo prazo com fornecedores de insumos chave"]
};
