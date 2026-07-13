import { BusinessDomainRule } from "../BusinessDomainTypes";

export const rules: BusinessDomainRule[] = [
  {
    id: "positive_revenue",
    name: "Receita Positiva",
    description: "Garante que a receita não seja menor que zero.",
    validate: (records: any[]) => records.map((r, idx) => {
      const val = Number(r.Receita || 0);
      return {
        valid: val >= 0,
        message: val < 0 ? `Linha ${idx + 1}: Receita negativa detectada (${val})` : undefined
      };
    })
  }
];
