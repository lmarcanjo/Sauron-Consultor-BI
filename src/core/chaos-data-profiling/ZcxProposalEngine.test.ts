/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from "vitest";
import { generateZcxProposal, determineConfidenceTier } from "./ZcxProposalEngine";
import type { ChaosSourceProfile } from "./ChaosDataTypes";

describe("ZcxProposalEngine", () => {
  it("correctly determines confidence tiers", () => {
    expect(determineConfidenceTier(0.95)).toBe("HIGH");
    expect(determineConfidenceTier(0.85)).toBe("HIGH");
    expect(determineConfidenceTier(0.84)).toBe("MEDIUM");
    expect(determineConfidenceTier(0.60)).toBe("MEDIUM");
    expect(determineConfidenceTier(0.59)).toBe("LOW");
    expect(determineConfidenceTier(0.10)).toBe("LOW");
  });

  it("generates an explainable ZcxProposal from a ChaosSourceProfile without inventing data", () => {
    const mockProfile: ChaosSourceProfile = {
      profileId: "prof_test_123",
      sourceId: "src_test_123",
      groupId: "grp_1",
      companyId: "comp_1",
      sourceName: "vendas_2026.csv",
      sourceHash: "hash123",
      totalKnownRows: 1000,
      sampledRecords: 500,
      confidenceScore: 0.90,
      physicalContainers: [
        { id: "c1", name: "Sheet1", type: "sheet", rowCount: 1000, columns: ["Data", "Valor", "Vendedor", "VazioCol"], records: [] }
      ],
      physicalColumns: [
        {
          containerId: "c1",
          physicalName: "Data",
          observedTypes: ["date"],
          probableRole: "date",
          emptyPercentage: 0.01,
          examples: ["2026-01-01", "2026-01-02"],
        },
        {
          containerId: "c1",
          physicalName: "Valor",
          observedTypes: ["number"],
          probableRole: "metric",
          emptyPercentage: 0.0,
          examples: [150.5, 300.0],
        },
        {
          containerId: "c1",
          physicalName: "Vendedor",
          observedTypes: ["text"],
          probableRole: "name",
          emptyPercentage: 0.05,
          examples: ["Ana", "Bruno"],
        },
        {
          containerId: "c1",
          physicalName: "VazioCol",
          observedTypes: ["unknown"],
          probableRole: "unknown",
          emptyPercentage: 0.98,
          examples: [],
        },
      ],
      detectedBlocks: [],
      semanticSuggestions: [
        {
          id: "sug_1",
          physicalColumns: ["Data"],
          suggestedRole: "date",
          suggestedLabel: "Data da Venda",
          confidence: 0.95,
          evidence: ["Data no formato ISO"],
          warnings: [],
          status: "SUGGESTED",
        },
        {
          id: "sug_2",
          physicalColumns: ["Valor"],
          suggestedRole: "metric",
          suggestedLabel: "Faturamento",
          confidence: 0.92,
          evidence: ["Valores numéricos positivos"],
          warnings: [],
          status: "SUGGESTED",
        },
      ],
      qualityFindings: [],
      updatedAt: "2026-07-25T12:00:00.000Z",
    };

    const proposal = generateZcxProposal(mockProfile);

    expect(proposal.sourceId).toBe("src_test_123");
    expect(proposal.status).toBe("GENERATED");
    expect(proposal.fieldProposals).toHaveLength(4);

    // High confidence autoSelected
    const dataField = proposal.fieldProposals.find(f => f.physicalName === "Data");
    expect(dataField?.confidenceTier).toBe("HIGH");
    expect(dataField?.autoSelected).toBe(true);
    expect(dataField?.suggestedLabel).toBe("Data da Venda");

    // Empty field categorized properly and not autoSelected
    const emptyField = proposal.fieldProposals.find(f => f.physicalName === "VazioCol");
    expect(emptyField?.category).toBe("empty");
    expect(emptyField?.autoSelected).toBe(false);

    // Capability evaluations
    const finCap = proposal.capabilityProposals.find(c => c.moduleName === "Financeiro");
    expect(finCap?.status).toBe("AVAILABLE");
    expect(finCap?.evidence[0]).toContain("Datas e métricas financeiras");
  });
});
