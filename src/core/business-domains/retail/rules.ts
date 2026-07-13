import { BusinessDomainRule } from "../BusinessDomainTypes";

export const rules: BusinessDomainRule[] = [
  {
    id: "conversion_rate_range",
    name: "Taxa de Conversão Coerente",
    description: "Garante que a taxa de conversão esteja entre 0% e 100%.",
    validate: (records: any[]) => records.map((r, idx) => {
      const conv = Number(r.Conversao || r.ConversionRate || 0);
      return {
        valid: conv >= 0 && conv <= 100,
        message: (conv < 0 || conv > 100) ? `Linha ${idx + 1}: Taxa de conversão inválida (${conv}%)` : undefined
      };
    })
  }
];
