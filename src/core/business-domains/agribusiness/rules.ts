import { BusinessDomainRule } from "../BusinessDomainTypes";

export const rules: BusinessDomainRule[] = [
  {
    id: "productivity_positive",
    name: "Produtividade Positiva",
    description: "Verifica se o cálculo de produtividade resulta em valor maior ou igual a zero.",
    validate: (records: any[]) => records.map((r, idx) => {
      const prod = Number(r.Produtividade || r.Producao || 0);
      return {
        valid: prod >= 0,
        message: prod < 0 ? `Linha ${idx + 1}: Produtividade/Produção negativa detectada (${prod})` : undefined
      };
    })
  }
];
