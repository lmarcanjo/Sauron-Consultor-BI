import { describe, expect, it } from "vitest";
import { calculateClosingTotals } from "./commissionClosing";
import { SellerStatement } from "./sellerStatement";

function statement(partial: Partial<SellerStatement>): SellerStatement {
  return {
    generatedAt: "2026-07-07T00:00:00.000Z",
    sellerName: "Vendedor",
    cpf: null,
    registration: null,
    department: null,
    store: null,
    period: null,
    totalSold: 0,
    recordCount: 1,
    commission: {
      configured: true,
      value: 0,
      calculation: "amount_column",
      message: "Comissão calculada com dados reais mapeados.",
    },
    managerName: null,
    observations: [],
    source: {
      fileName: "planilha-real.xlsx",
      datasetId: "dataset-1",
      peopleSheetName: "Pessoas",
      commissionSheetName: "Comissão",
      columnsUsed: [],
      rowsRead: 1,
    },
    ...partial,
  };
}

describe("commissionClosing", () => {
  it("calculates closing totals from generated seller statements", () => {
    const totals = calculateClosingTotals([
      statement({ sellerName: "A", totalSold: 38073, commission: { configured: true, value: 1904, calculation: "amount_column", message: "ok" } }),
      statement({ sellerName: "B", totalSold: null, commission: { configured: false, value: null, calculation: "not_configured", message: "Comissão não configurada" }, observations: ["Total vendido não configurado."] }),
    ]);

    expect(totals).toEqual({
      sellerCount: 2,
      totalSold: 38073,
      totalCommission: 1904,
      sellersWithoutRule: 1,
      sellersWithIncompleteData: 1,
    });
  });
});

