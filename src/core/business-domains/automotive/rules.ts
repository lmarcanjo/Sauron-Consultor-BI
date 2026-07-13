import { BusinessDomainRule } from "../BusinessDomainTypes";

export const rules: BusinessDomainRule[] = [
  {
    id: "fi_penetration_limit",
    name: "Penetração de F&I Coerente",
    description: "Verifica se a receita de F&I não ultrapassa a receita total de veículos.",
    validate: (records: any[]) => records.map((r, idx) => {
      const fiVal = Number(r.FI || r["F&I"] || 0);
      const veiculosVal = Number(r.Veiculos || r.Veiculo || 0);
      return {
        valid: fiVal <= veiculosVal,
        message: fiVal > veiculosVal ? `Linha ${idx + 1}: F&I (${fiVal}) superior a vendas de veículos (${veiculosVal})` : undefined
      };
    })
  }
];
