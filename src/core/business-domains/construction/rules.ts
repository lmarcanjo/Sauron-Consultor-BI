import { BusinessDomainRule } from "../BusinessDomainTypes";

export const rules: BusinessDomainRule[] = [
  {
    id: "schedule_positive",
    name: "Prazo Coerente",
    description: "Verifica se o prazo em dias da obra é positivo.",
    validate: (records: any[]) => records.map((r, idx) => {
      const days = Number(r.Prazo || r.ScheduleDays || 0);
      return {
        valid: days >= 0,
        message: days < 0 ? `Linha ${idx + 1}: Prazo negativo detectado (${days} dias)` : undefined
      };
    })
  }
];
