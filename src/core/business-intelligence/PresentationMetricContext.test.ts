import { describe, expect, it } from "vitest";
import { buildPresentationPeriodChanges, getPresentationPeriods } from "./PresentationMetricContext";
import { ModuleFieldMapping } from "../data/moduleMapping";

const mapping: ModuleFieldMapping = {
  projectId: "project-1",
  datasetId: "dataset-1",
  moduleName: "Comercial",
  sheetName: "Vendas",
  selectedColumns: ["Vendedor", "Valor", "Mês"],
  semanticRoles: {
    seller: "Vendedor",
    revenue: "Valor",
    period: "Mês",
  },
  updatedAt: "2026-07-16T00:00:00.000Z",
};

describe("presentation metric context", () => {
  it("uses mapped periods and parses Brazilian thousands values without recalculating the global total", () => {
    const rows = [
      { Vendedor: "Amanda", Valor: "38,073", Mês: "2026-05" },
      { Vendedor: "Amanda", Valor: "1,904", Mês: "2026-06" },
    ];

    expect(getPresentationPeriods(rows, [mapping])).toEqual(["2026-05", "2026-06"]);

    const changes = buildPresentationPeriodChanges({
      rows,
      mappings: [mapping],
      metrics: [],
      currentPeriod: "2026-06",
      previousPeriod: "2026-05",
    });

    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({
      id: "change_receita",
      currentValue: 1904,
      previousValue: 38073,
      direction: "down",
    });
  });

  it("does not manufacture a comparison when a previous period is unavailable", () => {
    expect(buildPresentationPeriodChanges({
      rows: [{ Valor: "1,904", Mês: "2026-06" }],
      mappings: [mapping],
      metrics: [],
      currentPeriod: "2026-06",
      previousPeriod: null,
    })).toEqual([]);
  });
});
