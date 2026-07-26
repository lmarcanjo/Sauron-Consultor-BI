/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from "vitest";
import { enterpriseDiscoveryEngine } from "./EnterpriseDiscoveryEngine";
import type { ChaosSourceProfile } from "../chaos-data-profiling";

describe("EnterpriseDiscoveryEngine", () => {
  it("discovers business areas, processes, entities, gaps, and evidence without hallucination", () => {
    const mockProfile: ChaosSourceProfile = {
      profileId: "prof_ede_1",
      sourceId: "src_ede_1",
      groupId: "grp_honda",
      companyId: "comp_honda",
      sourceName: "honda_posvendas.xlsx",
      sourceHash: "hash_ede",
      totalKnownRows: 8500,
      sampledRecords: 500,
      confidenceScore: 0.94,
      physicalContainers: [
        { id: "c1", name: "ServicosEPeças", type: "sheet", rowCount: 8500, records: [] }
      ],
      physicalColumns: [
        {
          containerId: "c1",
          physicalName: "VLR_SERVICO",
          observedTypes: ["number"],
          probableRole: "metric",
          emptyPercentage: 0.0,
          examples: [150.0, 320.0],
          uniquenessScore: 0.9,
        },
        {
          containerId: "c1",
          physicalName: "ORDEM_SERVICO",
          observedTypes: ["text"],
          probableRole: "code",
          emptyPercentage: 0.01,
          examples: ["OS1001", "OS1002"],
          uniquenessScore: 0.8,
        },
        {
          containerId: "c1",
          physicalName: "CLIENTE_NOME",
          observedTypes: ["text"],
          probableRole: "name",
          emptyPercentage: 0.02,
          examples: ["Carlos Silva", "Mariana Costa"],
          uniquenessScore: 0.5,
        },
        {
          containerId: "c1",
          physicalName: "COMISSAO_MECANICO",
          observedTypes: ["number"],
          probableRole: "metric",
          emptyPercentage: 0.05,
          examples: [25.0, 40.0],
          uniquenessScore: 0.7,
        },
      ],
      detectedBlocks: [],
      semanticSuggestions: [],
      qualityFindings: [],
      updatedAt: "2026-07-26T00:00:00.000Z",
    };

    const model = enterpriseDiscoveryEngine.discoverOrganization(mockProfile);

    expect(model.companyId).toBe("comp_honda");
    expect(model.areas.length).toBeGreaterThanOrEqual(3);

    // Verify evidence-backed areas
    const financeArea = model.areas.find(a => a.name === "Financeiro");
    expect(financeArea).toBeDefined();
    expect(financeArea?.evidence[0].fieldNames).toContain("VLR_SERVICO");

    const hrArea = model.areas.find(a => a.name === "Recursos Humanos & Comissões");
    expect(hrArea).toBeDefined();
    expect(hrArea?.evidence[0].fieldNames).toContain("COMISSAO_MECANICO");

    // Verify gap detection
    const estoqueGap = model.gaps.find(g => g.areaName === "Estoque e Logística");
    expect(estoqueGap).toBeDefined();

    // Verify executive narrative
    expect(model.executiveNarrative).toContain("honda_posvendas.xlsx");
    expect(model.executiveNarrative).not.toContain("Dataset");
  });
});
