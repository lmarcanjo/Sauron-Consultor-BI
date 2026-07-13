import { BusinessDomainRule } from "../BusinessDomainTypes";

export const rules: BusinessDomainRule[] = [
  {
    id: "attendance_range",
    name: "Frequência Escolar Coerente",
    description: "Verifica se o índice de presença escolar está entre 0% e 100%.",
    validate: (records: any[]) => records.map((r, idx) => {
      const freq = Number(r.Frequencia || r.AttendanceRate || 0);
      return {
        valid: freq >= 0 && freq <= 100,
        message: (freq < 0 || freq > 100) ? `Linha ${idx + 1}: Frequência fora do intervalo (${freq}%)` : undefined
      };
    })
  }
];
