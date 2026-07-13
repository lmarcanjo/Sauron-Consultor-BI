import { BusinessMeetingTemplate } from "../BusinessDomainTypes";

export const meeting: BusinessMeetingTemplate = {
  subjectOrder: ["Passagem de Oficina", "Faturamento de Veículos", "Absorção de Pós-Venda", "Margem de F&I", "Planos de Ação"],
  mandatoryKpis: ["VEICULOS_REVENUE", "POS_VENDA_REVENUE", "TICKET_MEDIO"],
  optionalKpis: ["PECAS_REVENUE", "GARANTIA_REVENUE", "COMISSAO_PAGUES"],
  suggestedQuestions: [
    "A passagem de oficina atingiu a meta diária?",
    "Qual o ticket médio de acessórios por veículo vendido?",
    "Como está a taxa de penetração de F&I no estoque de seminovos?"
  ],
  riscos: ["Baixa absorção de pós-venda em relação às despesas da concessionária", "Redução de margem pela montadora nos novos"],
  acoes: ["Campanha de revisão programada para veículos com mais de 3 anos", "Incentivo em vendas combinadas de veículo com F&I"]
};
