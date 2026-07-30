/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it, vi } from "vitest";
import { ConsultantDiscoveryPanel } from "./ConsultantDiscoveryPanel";
import type { ConsultantUnderstandingSummary } from "../core/chaos-data-profiling/ConsultantUnderstandingSummary";

describe("ConsultantDiscoveryPanel — Hotfix 24.1", () => {
  const mockSummary: ConsultantUnderstandingSummary = {
    sourceId: "src_test_1",
    sourceName: "faturamento.csv",
    companyName: "Empresa Teste",
    groupName: "Grupo Teste",
    analyzedAt: "2026-07-26T00:00:00.000Z",
    discovery: {
      totalRecords: 1000,
      totalFields: 5,
      totalTables: 1,
      totalSheets: 1,
      totalBlocks: 1,
      overallQualityScore: 90,
      originType: "Planilha",
    },
    foundDomains: [
      {
        domainName: "Financeiro",
        confidence: 0.90,
        coverage: 1.0,
        evidence: ["Métricas financeiras observadas"],
        fieldCount: 5,
      },
    ],
    ambiguities: [],
    narrative: "Análise concluída com alta qualidade.",
    consultantMetrics: {
      qualityLabel: "Alta Qualidade",
      coveragePercentage: 100,
      pendingRevisionsCount: 0,
      availableAreas: ["Financeiro"],
    },
  };

  it("requires onConfirmSourceUnderstanding callback prop and can be instantiated safely", () => {
    const handleConfirm = vi.fn();
    const props = {
      summary: mockSummary,
      onAcceptSuggestedStructure: () => {},
      onReviewInterpretations: () => {},
      onKeepOriginalNames: () => {},
      onConfirmSourceUnderstanding: handleConfirm,
      onGoToAnalysis: () => {},
    };

    expect(props.onConfirmSourceUnderstanding).toBeDefined();
    props.onConfirmSourceUnderstanding();
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });
});
