import { BusinessDomainRule } from "../BusinessDomainTypes";

export const rules: BusinessDomainRule[] = [
  {
    id: "oee_range",
    name: "OEE Coerente",
    description: "Verifica se o OEE reportado está entre 0% e 100%.",
    validate: (records: any[]) => records.map((r, idx) => {
      const oee = Number(r.OEE || 0);
      return {
        valid: oee >= 0 && oee <= 100,
        message: (oee < 0 || oee > 100) ? `Linha ${idx + 1}: OEE fora dos limites (${oee}%)` : undefined
      };
    })
  }
];
