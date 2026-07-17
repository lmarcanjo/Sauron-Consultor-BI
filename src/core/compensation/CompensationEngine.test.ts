/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from "vitest";
import { compensationEngine, CollaboratorPerformance } from "./CompensationEngine";
import { executivePeopleService } from "./ExecutivePeopleService";

describe("Sauron Compensation Engine Unit Tests", () => {
  it("calculates standard compensation for premium policy correctly", () => {
    const performance: CollaboratorPerformance = {
      collaboratorId: "test_senior",
      totalSales: 680000,
      accessoriesSales: 120000,
      partsSales: 45000,
      csat: 4.8,
      cancellationRate: 0.02,
      campaignParticipated: ["campanha_periodo", "linha_alta_margem"],
      lineage: {
        totalSalesCell: "B10",
        accessoriesSalesCell: "C10",
        partsSalesCell: "D10",
        csatCell: "E10",
        cancellationRateCell: "F10",
      },
    };

    const result = compensationEngine.calculate(performance, "standard_performance", 3200);

    // Assertions
    expect(result.baseSalary).toBe(3200);
    expect(result.rawCommission).toBe(680000 * 0.015); // 10200
    expect(result.accessoriesCommission).toBe(120000 * 0.02); // 2400
    expect(result.partsCommission).toBe(45000 * 0.01); // 450
    expect(result.thresholdBonus).toBe(3000); // threshold is 600k -> 3000
    expect(result.multiplierBonus).toBe(Math.round(10200 * 0.2)); // 2040 (20% extra since sales > 500k)
    expect(result.campaignBonus).toBe(1200 + 800); // campanha_periodo (1200) + linha_alta_margem (800) = 2000
    expect(result.penaltyDeductions).toBe(0); // high csat, low cancellation

    const expectedTotalEarnings = 3200 + (10200 + 2400 + 450 + 3000 + 2040 + 2000 - 0);
    expect(result.totalEarnings).toBe(expectedTotalEarnings);

    // Trace checks
    expect(result.trace.length).toBeGreaterThan(5);
    const salesTrace = result.trace.find((t) => t.name === "Comissão de Vendas Geral");
    expect(salesTrace).toBeDefined();
    expect(salesTrace?.lineage?.sourceCell).toBe("B10");
    expect(salesTrace?.lineage?.sheetName).toBe("FATURAMENTO");
  });

  it("applies penalty deductions when CSAT or cancellation metrics are out of bounds", () => {
    const poorPerformance: CollaboratorPerformance = {
      collaboratorId: "test_junior_poor",
      totalSales: 350000,
      accessoriesSales: 15000,
      partsSales: 5000,
      csat: 3.9, // below 4.2 limit for premium policy
      cancellationRate: 0.06, // above 0.05 limit
      campaignParticipated: [],
      lineage: {
        totalSalesCell: "B12",
        accessoriesSalesCell: "C12",
        partsSalesCell: "D12",
        csatCell: "E12",
        cancellationRateCell: "F12",
      },
    };

    const result = compensationEngine.calculate(poorPerformance, "standard_performance", 3200);

    // Under premium policy:
    // CSAT limit < 4.2 -> -500
    // Cancellation limit > 0.05 -> -1000
    // Total penalties = 1500
    expect(result.penaltyDeductions).toBe(1500);

    const penaltyTrace = result.trace.find((t) => t.name === "Penalidades Aplicadas");
    expect(penaltyTrace).toBeDefined();
    expect(penaltyTrace?.result).toBe(-1500);
    expect(penaltyTrace?.lineage?.sourceCell).toBe("N15");
  });

  it("successfully integrates with ExecutivePeopleService to retrieve and compute real dossiers", () => {
    const joaoDossier = executivePeopleService.getCollaboratorDossier("colab_joao_silva");
    expect(joaoDossier).toBeDefined();
    expect(joaoDossier?.name).toBe("João Silva");

    const calculation = executivePeopleService.calculateCompensation("colab_joao_silva", "standard_performance");
    expect(calculation).toBeDefined();
    expect(calculation?.totalEarnings).toBeGreaterThan(15000); // João is highly profitable!
  });
});
