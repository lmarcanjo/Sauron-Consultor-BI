/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from "vitest";
import { buildSourceDrivenAnalysis, migrateLegacyMapping } from "./SourceDrivenInterpretationEngine";
import type { ChaosSourceProfile } from "./ChaosDataTypes";

describe("SourceDrivenInterpretationEngine", () => {
  it("starts directly from physicalName and builds a non-destructive interpretation", () => {
    const mockProfile: ChaosSourceProfile = {
      profileId: "prof_source_1",
      sourceId: "src_source_1",
      groupId: "grp_1",
      companyId: "comp_1",
      sourceName: "faturamento_real.csv",
      sourceHash: "hash_source",
      totalKnownRows: 5000,
      sampledRecords: 500,
      confidenceScore: 0.92,
      physicalContainers: [
        { id: "cont_1", name: "TabelaVendas", type: "sheet", rowCount: 5000, records: [] }
      ],
      physicalColumns: [
        {
          containerId: "cont_1",
          physicalName: "VLR_TOT",
          observedTypes: ["number"],
          probableRole: "metric",
          emptyPercentage: 0.0,
          examples: [1200.50, 4500.00],
        },
        {
          containerId: "cont_1",
          physicalName: "COD_VEND",
          observedTypes: ["text"],
          probableRole: "code",
          emptyPercentage: 0.02,
          examples: ["V001", "V002"],
        },
      ],
      detectedBlocks: [],
      semanticSuggestions: [
        {
          id: "sug_1",
          physicalColumns: ["VLR_TOT"],
          suggestedRole: "metric",
          suggestedLabel: "Valor Total da Venda",
          confidence: 0.94,
          evidence: ["Formato numérico", "Preenchimento 100%"],
          warnings: [],
          status: "SUGGESTED",
        },
      ],
      qualityFindings: [],
      updatedAt: "2026-07-25T12:00:00.000Z",
    };

    const analysis = buildSourceDrivenAnalysis(mockProfile);

    expect(analysis.sourceId).toBe("src_source_1");
    expect(analysis.totalFields).toBe(2);

    // Verify physicalName is preserved and immutable
    const vlrField = analysis.interpretations.find(i => i.physicalName === "VLR_TOT");
    expect(vlrField).toBeDefined();
    expect(vlrField?.physicalName).toBe("VLR_TOT");
    expect(vlrField?.suggestedLabel).toBe("Valor Total da Venda");
    expect(vlrField?.confidence).toBe(0.94);
  });

  it("converts legacy mapping without silent confirmed status", () => {
    const legacy = migrateLegacyMapping("COST", "Valor_Pagamento", "src_legacy_1");

    expect(legacy.physicalName).toBe("Valor_Pagamento");
    expect(legacy.suggestedMeaning).toBe("Mapeamento legado: COST");
    expect(legacy.status).toBe("NEEDS_REVIEW"); // NEVER silent confirmed
  });
});
