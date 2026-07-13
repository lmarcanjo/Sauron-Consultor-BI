import { BusinessDomainRule } from "../BusinessDomainTypes";

export const rules: BusinessDomainRule[] = [
  {
    id: "occupancy_range",
    name: "Taxa de Ocupação Válida",
    description: "Verifica se a taxa de ocupação está entre 0% e 100%.",
    validate: (records: any[]) => records.map((r, idx) => {
      const occ = Number(r.TaxaDeOcupacao || r.OccupancyRate || 0);
      return {
        valid: occ >= 0 && occ <= 100,
        message: (occ < 0 || occ > 100) ? `Linha ${idx + 1}: Taxa de ocupação fora do intervalo (${occ}%)` : undefined
      };
    })
  }
];
