import { BusinessMeetingTemplate } from "../BusinessDomainTypes";

export const meeting: BusinessMeetingTemplate = {
  subjectOrder: ["Indicadores de Captação e Novas Matrículas", "Índices de Evasão e Frequência Escolar", "Resultados Pedagógicos (Aprovação)", "Qualificação e Alocação Docente"],
  mandatoryKpis: ["ENROLLMENTS", "APPROVAL_RATE", "ATTENDANCE_RATE"],
  optionalKpis: [],
  suggestedQuestions: [
    "A taxa de evasão escolar reduziu em comparação ao semestre anterior?",
    "Quais turmas apresentam os menores índices de frequência?",
    "Como está o índice de aprovação na disciplina com maior taxa de reprovação histórica?"
  ],
  riscos: ["Aumento da inadimplência escolar", "Evasão de alunos de cursos com alta taxa de reprovação"],
  acoes: ["Programa de acompanhamento e mentoria para alunos com baixa frequência", "Facilidades de negociação de parcelas atrasadas"]
};
