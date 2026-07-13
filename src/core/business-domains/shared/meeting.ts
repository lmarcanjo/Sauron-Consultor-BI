import { BusinessMeetingTemplate } from "../BusinessDomainTypes";

export const meeting: BusinessMeetingTemplate = {
  subjectOrder: ["Resultados Financeiros", "Desempenho por Unidade", "Produtividade de Vendas", "Plano de Ação"],
  mandatoryKpis: ["REVENUE", "PROFIT", "MARGIN"],
  optionalKpis: ["EXPENSE", "COMMISSION"],
  suggestedQuestions: [
    "A receita líquida está alinhada com a meta orçamentária?",
    "Quais despesas operacionais apresentaram maior desvio?",
    "Como está a rentabilidade média das principais filiais?"
  ],
  riscos: ["Aumento descontrolado de despesas fixas", "Queda brusca na margem operacional por guerra de preços"],
  acoes: ["Revisão detalhada do orçamento de despesas", "Implementação de tabela de descontos máximos permitidos"]
};
