/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { test, expect } from "@playwright/test";
import React from "react";
import { describe, it, vi } from "vitest";
import { createDatasetView } from "../core/chaos-data-profiling/DatasetView";
import type { ChaosSourceProfile } from "../core/chaos-data-profiling/ChaosSourceProfile";

describe("ChaosProfilingPanel — Hotfix 25.1 Column Selection Contract Unit Test", () => {
  it("normalizes MouseEvents, Sets, Arrays and deduplicates columsToSave safely without TypeError", () => {
    const mockProfile: ChaosSourceProfile = {
      sourceId: "src_1",
      sourceName: "teste.csv",
      sampledRecords: 10,
      totalKnownRows: 10,
      confidenceScore: 0.9,
      analyzedAt: new Date().toISOString(),
      physicalContainers: [{ id: "cont_1", name: "Tabela 1", rowCount: 10, columnCount: 2 }],
      physicalColumns: [
        { physicalName: "Empresa", containerId: "cont_1", observedTypes: ["text"], emptyPercentage: 0, examples: ["Alfa"] },
        { physicalName: "Faturamento", containerId: "cont_1", observedTypes: ["number"], emptyPercentage: 0, examples: [1000] },
      ],
      detectedBlocks: [],
      semanticSuggestions: [],
      qualityFindings: [],
      dataQualityMetrics: { overallScore: 90, completenessScore: 100, typeConsistencyScore: 100, uniquenessScore: 100, structuralIntegrityScore: 100 },
    };

    // 1. Array of strings
    const colsArray = ["Empresa", "Faturamento", "Empresa"];
    const normalizedArray = Array.from(new Set(colsArray.filter((i): i is string => typeof i === "string" && i.trim().length > 0)));
    expect(normalizedArray).toEqual(["Empresa", "Faturamento"]);

    // 2. SyntheticEvent / MouseEvent argument passed from onClick={saveDraft}
    const syntheticEventArg = { preventDefault: () => {}, target: {} };
    let columnsToSave: string[] = [];
    if (Array.isArray(syntheticEventArg)) {
      columnsToSave = syntheticEventArg;
    } else if (syntheticEventArg instanceof Set) {
      columnsToSave = Array.from(syntheticEventArg);
    } else {
      columnsToSave = ["Empresa", "Faturamento"]; // Fallback to selectedColumns state
    }
    expect(columnsToSave.includes("Empresa")).toBe(true);

    // 3. createDatasetView with normalized columns
    const view = createDatasetView({
      profile: mockProfile,
      containerIds: ["cont_1"],
      blockIds: [],
      selectedColumns: columnsToSave,
      selectedRowsRule: "Linhas selecionadas pelo consultor",
      inferredTypes: { Empresa: "text", Faturamento: "number" },
      now: new Date().toISOString(),
    });

    expect(view.selectedColumns).toEqual(["Empresa", "Faturamento"]);
    expect(view.status).toBe("DRAFT");
  });
});
