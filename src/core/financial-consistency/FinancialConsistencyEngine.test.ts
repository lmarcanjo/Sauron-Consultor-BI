import { describe, expect, it } from "vitest";
import {
  createStageSnapshot,
  FinancialConsistencyEngine,
  reconcileFinancialConsistency,
  snapshotFromMetricRecords,
} from "./index";

const stages = ["source", "dataset", "kpis", "dashboard"] as const;

describe("FinancialConsistencyEngine", () => {
  it("approves a complete chain with exact equality", () => {
    const report = reconcileFinancialConsistency({
      reportId: "exact-chain",
      requiredStages: [...stages],
      stages: stages.map(stage => createStageSnapshot(stage, { totalVendido: 38073, totalComissao: 1904 })),
    });

    expect(report.status).toBe("consistent");
    expect(report.differences).toEqual([]);
    expect(report.diagnostics.at(-1)).toContain("zero difference");
  });

  it("reports the exact difference instead of hiding a mismatch", () => {
    const report = reconcileFinancialConsistency({
      requiredStages: [...stages],
      stages: [
        createStageSnapshot("source", { totalVendido: 38073 }),
        createStageSnapshot("dataset", { totalVendido: 38073 }),
        createStageSnapshot("kpis", { totalVendido: 38073 }),
        createStageSnapshot("dashboard", { totalVendido: 38072 }),
      ],
    });

    expect(report.status).toBe("inconsistent");
    expect(report.differences).toEqual([
      expect.objectContaining({
        metricId: "totalVendido",
        expectedValue: 38073,
        actualValue: 38072,
        difference: -1,
        actualStage: "dashboard",
      }),
    ]);
  });

  it("keeps zero as a valid value and marks absent stages pending", () => {
    const report = reconcileFinancialConsistency({
      requiredStages: [...stages],
      stages: [
        createStageSnapshot("source", { margem: 0 }),
        createStageSnapshot("dataset", { margem: 0 }),
      ],
    });

    expect(report.status).toBe("pending");
    expect(report.metrics[0].expectedValue).toBe(0);
    expect(report.missingStages).toEqual(["kpis", "dashboard"]);
  });

  it("builds a stage from existing metric outputs without recalculating them", () => {
    const snapshot = snapshotFromMetricRecords("kpis", [
      { id: "totalVendido", value: 38073 },
      { id: "totalComissao", value: 1904 },
      { id: "ticketMedio", value: null },
    ]);

    expect(snapshot.values).toEqual({ totalVendido: 38073, totalComissao: 1904, ticketMedio: null });
  });

  it("rejects a negative or non-finite tolerance", () => {
    const engine = new FinancialConsistencyEngine();
    expect(() => engine.reconcile({ stages: [], tolerance: -1 })).toThrow();
    expect(() => engine.reconcile({ stages: [], tolerance: Number.NaN })).toThrow();
  });

  it("marks a metric with NaN as inconsistent instead of pending or zero", () => {
    const report = reconcileFinancialConsistency({
      requiredStages: [...stages],
      stages: stages.map(stage => createStageSnapshot(stage, { totalVendido: stage === "dashboard" ? Number.NaN : 38073 })),
    });

    expect(report.status).toBe("inconsistent");
    expect(report.metrics[0].status).toBe("inconsistent");
    expect(report.invalidValues).toEqual([{ metricId: "totalVendido", stage: "dashboard" }]);
  });
});
