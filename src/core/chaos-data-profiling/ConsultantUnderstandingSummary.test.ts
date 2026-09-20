/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from "vitest";
import { buildConsultantUnderstandingSummary } from "./ConsultantUnderstandingSummary";
import type { ChaosSourceProfile } from "./ChaosDataTypes";
import type { SourceDrivenAnalysis } from "./SourceDrivenTypes";

describe("ConsultantUnderstandingSummary", () => {
  it("builds an evidence-backed narrative and summary without hallucinating data", () => {
    const mockProfile: ChaosSourceProfile = {
      profileId: "prof_ccx_1",
      sourceId: "src_ccx_1",
      groupId: "grp_ccx",
      companyId: "comp_ccx",
      sourceName: "vendas_fevereiro.xlsx",
      sourceHash: "hash_ccx",
      totalKnownRows: 1200,
      sampledRecords: 500,
      confidenceScore: 0.95,
      physicalContainers: [
        { id: "c1", name: "AbaVendas", type: "sheet", rowCount: 1200, records: [] }
      ],
      physicalColumns: [
        {
          containerId: "c1",
          physicalName: "VALOR_BRUTO",
          observedTypes: ["number"],
          probableRole: "metric",
          emptyPercentage: 0.0,
          examples: [100, 250],
        },
      ],
      detectedBlocks: [],
      semanticSuggestions: [],
      qualityFindings: [],
      updatedAt: "2026-07-26T00:00:00.000Z",
    };

    const mockSourceDriven: SourceDrivenAnalysis = {
      sourceId: "src_ccx_1",
      sourceName: "vendas_fevereiro.xlsx",
      generatedAt: "2026-07-26T00:00:00.000Z",
      totalRecords: 1200,
      totalFields: 1,
      structures: [],
      interpretations: [
        {
          fieldId: "f1",
          sourceId: "src_ccx_1",
          containerId: "c1",
          scope: "container",
          physicalName: "VALOR_BRUTO",
          originalType: "number",
          sampleValues: [100, 250],
          inferredType: "number",
          suggestedLabel: "Valor Bruto",
          suggestedMeaning: "Métrica financeira de venda",
          suggestedDomain: "Financeiro",
          confidence: 0.95,
          coverage: 1.0,
          evidence: ["Formato numérico", "Valores numéricos positivos"],
          status: "PROPOSED",
          updatedAt: "2026-07-26T00:00:00.000Z",
        },
      ],
      unresolvedMaterialQuestions: [],
    };

    const summary = buildConsultantUnderstandingSummary(mockProfile, mockSourceDriven);

    expect(summary.sourceName).toBe("vendas_fevereiro.xlsx");
    expect(summary.discovery.totalRecords).toBe(1200);
    expect(summary.discovery.overallQualityScore).toBe(95);
    expect(summary.foundDomains).toHaveLength(1);
    expect(summary.foundDomains[0].domainName).toBe("Financeiro");
    expect(summary.narrative).toContain("Pelos dados encontrados na fonte 'vendas_fevereiro.xlsx'");
    expect(summary.narrative).not.toContain("Dataset");
    expect(summary.narrative).not.toContain("Profiling");
  });
});
