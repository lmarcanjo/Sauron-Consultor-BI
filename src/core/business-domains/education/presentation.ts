import { BusinessPresentationTemplate } from "../BusinessDomainTypes";

export const presentation: BusinessPresentationTemplate = {
  cards: ["ENROLLMENTS", "APPROVAL_RATE", "ATTENDANCE_RATE"],
  charts: ["Evolução de Novas Matrículas", "Evasão por Curso"],
  rankings: ["Cursos com Maior Aprovação", "Turmas com Melhor Frequência"],
  narrativeTemplate: "A instituição registrou {ENROLLMENTS} matrículas ativas, com aprovação pedagógica de {APPROVAL_RATE}% e frequência de {ATTENDANCE_RATE}%.",
  minutesTemplate: "Concluiu-se o comitê acadêmico avaliando {ENROLLMENTS} alunos e taxa de aprovação de {APPROVAL_RATE}%.",
  slides: [
    { title: "Status Pedagógico e de Matrículas", type: "cover", layout: "default", elements: [] },
    { title: "Métricas de Performance Estudantil", type: "kpis", layout: "grid", elements: ["ENROLLMENTS", "APPROVAL_RATE", "ATTENDANCE_RATE"] }
  ]
};
