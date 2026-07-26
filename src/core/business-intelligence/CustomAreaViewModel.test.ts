/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from "vitest";
import { buildCustomAreaViewModel } from "./CustomAreaViewModel";
import { ConsultingModelConfiguration } from "./ConsultingModelRepository";
import { LancamentoFinanceiro } from "../../types";

function makeConfig(overrides: Partial<ConsultingModelConfiguration> = {}): ConsultingModelConfiguration {
  return {
    workspaceId: "ws_test",
    groupId: "group_test",
    companyId: "comp_test",
    enabledModules: [],
    businessAreas: [
      {
        id: "resultados_gerais",
        name: "Resultados Gerais",
        description: "Visão consolidada de receita",
        iconKey: "BarChart3",
        relatedFields: ["Receita", "Centro"],
        relatedMetrics: [],
        order: 1,
        visible: true,
      },
    ],
    selectedFields: {
      Receita: {
        fieldId: "Receita", physicalName: "Receita", sheetName: "Sheet1", detectedType: "number",
        use: "show_indicator", displayLabel: "Receita", consultantLabel: "Total Recebido", visible: true,
      },
      Centro: {
        fieldId: "Centro", physicalName: "Centro", sheetName: "Sheet1", detectedType: "text",
        use: "group_results", displayLabel: "Centro", visible: true,
      },
    },
    customMetrics: [
      { id: "m1", name: "Total Recebido", fieldId: "Receita", operation: "sum", format: "currency", visibleIn: ["resultados_gerais"] },
    ],
    displayDictionary: {},
    createdAt: "",
    updatedAt: "",
    ...overrides,
  };
}

const rows: LancamentoFinanceiro[] = [
  { Receita: 100, Centro: "A" } as any,
  { Receita: 200, Centro: "B" } as any,
  { Receita: 300, Centro: "A" } as any,
];

describe("CustomAreaViewModel — Block 4: bounded custom area contract", () => {
  it("returns null when the area does not exist in the active DNA", () => {
    expect(buildCustomAreaViewModel("does_not_exist", makeConfig(), rows)).toBeNull();
  });

  it("returns null when there is no active configuration at all", () => {
    expect(buildCustomAreaViewModel("resultados_gerais", null, rows)).toBeNull();
  });

  it("only exposes visible, non do_not_use selected fields with consultant labels", () => {
    const vm = buildCustomAreaViewModel("resultados_gerais", makeConfig(), rows)!;
    expect(vm.fields.map(f => f.physicalName)).toEqual(["Receita", "Centro"]);
    expect(vm.fields[0].label).toBe("Total Recebido");
    expect(vm.fields[0].isNumeric).toBe(true);
    expect(vm.fields[1].isNumeric).toBe(false);
  });

  it("excludes fields explicitly marked do_not_use or invisible", () => {
    const config = makeConfig();
    config.selectedFields.Centro.use = "do_not_use";
    const vm = buildCustomAreaViewModel("resultados_gerais", config, rows)!;
    expect(vm.fields.map(f => f.physicalName)).toEqual(["Receita"]);
  });

  it("computes only consultant-certified metrics scoped to this area (never generic auto-stats)", () => {
    const vm = buildCustomAreaViewModel("resultados_gerais", makeConfig(), rows)!;
    expect(vm.metrics).toHaveLength(1);
    expect(vm.metrics[0].name).toBe("Total Recebido");
    expect(vm.metrics[0].value).toBe(600);
    expect(vm.metrics[0].format).toBe("currency");
  });

  it("does not leak metrics scoped to a different area", () => {
    const config = makeConfig();
    config.customMetrics[0].visibleIn = ["outra_area"];
    const vm = buildCustomAreaViewModel("resultados_gerais", config, rows)!;
    expect(vm.metrics).toHaveLength(0);
  });

  it("reports NOT_CONFIGURED readiness when no fields are selected yet", () => {
    const config = makeConfig();
    config.businessAreas[0].relatedFields = [];
    config.selectedFields = {};
    const vm = buildCustomAreaViewModel("resultados_gerais", config, rows)!;
    expect(vm.readiness).toBe("NOT_CONFIGURED");
    expect(vm.consistency).toBe("MISSING_FIELDS");
  });

  it("reports PARTIALLY_CONFIGURED readiness when fields exist but no metric is defined", () => {
    const config = makeConfig();
    config.customMetrics = [];
    const vm = buildCustomAreaViewModel("resultados_gerais", config, rows)!;
    expect(vm.readiness).toBe("PARTIALLY_CONFIGURED");
  });

  it("reports NO_DATA consistency when there are no active rows", () => {
    const vm = buildCustomAreaViewModel("resultados_gerais", makeConfig(), [])!;
    expect(vm.consistency).toBe("NO_DATA");
    expect(vm.summary.totalRecords).toBe(0);
  });

  it("bounds the records preview to the given limit regardless of dataset size", () => {
    const bigRows: LancamentoFinanceiro[] = Array.from({ length: 500 }, (_, i) => ({ Receita: i, Centro: "A" } as any));
    const vm = buildCustomAreaViewModel("resultados_gerais", makeConfig(), bigRows, 10)!;
    expect(vm.summary.totalRecords).toBe(500);
    expect(vm.summary.previewCount).toBe(10);
    expect(vm.recordsPreview).toHaveLength(10);
  });
});
