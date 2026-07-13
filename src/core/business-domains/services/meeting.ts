import { BusinessMeetingTemplate } from "../BusinessDomainTypes";

export const meeting: BusinessMeetingTemplate = {
  subjectOrder: ["Status de Entregas e Cronograma", "Aproveitamento de Consultores e Horas", "Faturamento e Receita de Projetos", "Margem e Custos de Alocação"],
  mandatoryKpis: ["PROJECT_HOURS", "BILLABLE_REVENUE"],
  optionalKpis: ["SERVICES_MARGIN"],
  suggestedQuestions: [
    "Há consultores sobrecarregados ou subalocados na equipe?",
    "O número de horas consumidas está coerente com o progresso do escopo?",
    "Quais projetos estão operando com margem abaixo do limite aceitável de 20%?"
  ],
  riscos: ["Estouro de escopo e horas não faturadas (scope creep)", "Perda repentina de consultor-chave no meio do projeto"],
  acoes: ["Revisão semanal de timesheets e renegociação de aditivos de escopo", "Registro e compartilhamento de documentação técnica do projeto"]
};
