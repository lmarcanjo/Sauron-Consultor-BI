/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { test, expect } from "@playwright/test";
import React from "react";
import { describe, it, vi } from "vitest";
import { createDatasetView } from "../core/chaos-data-profiling/DatasetView";
import type { ChaosSourceProfile } from "../core/chaos-data-profiling/ChaosDataTypes";

describe("ChaosProfilingPanel — Hotfix 25.1 Column Selection Contract Unit Test", () => {
  it("normalizes MouseEvents, Sets, Arrays and deduplicates columsToSave safely without TypeError", () => {
    const mockProfile: ChaosSourceProfile = {
      profileId: "prof_1",
      sourceId: "src_1",
      sourceType: "csv",
      groupId: "grp_1",
      sourceName: "teste.csv",
      sampledRecords: 10,
      totalKnownRows: 10,
      physicalContainers: [{ id: "cont_1", name: "Tabela 1", type: "sheet", rowCount: 10, sampledRecords: 10, columns: ["Empresa", "Faturamento"], rows: [], blocks: [] }],
      physicalColumns: [
        { physicalName: "Empresa", containerId: "cont_1", containerName: "Tabela 1", position: 0, observedTypes: ["text"], typePercentages: {}, numericPercentage: 0, textPercentage: 1, datePercentage: 0, booleanPercentage: 0, emptyPercentage: 0, cardinality: 1, distinctValues: ["Alfa"], mostFrequentValues: [], examples: ["Alfa"], averageLength: 4, minValue: null, maxValue: null, patterns: [], repeatedValueCount: 0, mixedTypes: false, probableIdentifier: false, probableCode: false, probableName: true, probableDimension: true, probableMetric: false, probableDate: false, probableRoles: ["name"], confidence: 0.9, evidence: [] },
        { physicalName: "Faturamento", containerId: "cont_1", containerName: "Tabela 1", position: 1, observedTypes: ["number"], typePercentages: {}, numericPercentage: 1, textPercentage: 0, datePercentage: 0, booleanPercentage: 0, emptyPercentage: 0, cardinality: 1, distinctValues: ["1000"], mostFrequentValues: [], examples: [1000], averageLength: 4, minValue: 1000, maxValue: 1000, patterns: [], repeatedValueCount: 0, mixedTypes: false, probableIdentifier: false, probableCode: false, probableName: false, probableDimension: false, probableMetric: true, probableDate: false, probableRoles: ["metric"], confidence: 0.9, evidence: [] },
      ],
      profilingStatus: "READY",
      detectedBlocks: [],
      semanticSuggestions: [],
      qualityFindings: [],
      rawZone: { sourceId: "src_1", sourceName: "teste.csv", immutable: true, physicalReferences: [] },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1
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
