import { BusinessDomainRule } from "../BusinessDomainTypes";

export const rules: BusinessDomainRule[] = [
  {
    id: "hours_positive",
    name: "Horas Positivas",
    description: "Verifica se o lançamento de horas do projeto é maior ou igual a zero.",
    validate: (records: any[]) => records.map((r, idx) => {
      const hours = Number(r.Horas || r.ProjectHours || 0);
      return {
        valid: hours >= 0,
        message: hours < 0 ? `Linha ${idx + 1}: Lançamento de horas negativo detectado (${hours} horas)` : undefined
      };
    })
  }
];
