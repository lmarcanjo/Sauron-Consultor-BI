import { BusinessKpi } from "../BusinessDomainTypes";

export const kpis: BusinessKpi[] = [
  { code: "ENROLLMENTS", name: "Matrículas", unit: "numeric", description: "Número total de alunos ativamente matriculados." },
  { code: "APPROVAL_RATE", name: "Aprovação", unit: "percentage", description: "Percentual de alunos aprovados nas disciplinas." },
  { code: "ATTENDANCE_RATE", name: "Frequência", unit: "percentage", description: "Índice médio de presença dos alunos nas aulas." }
];
