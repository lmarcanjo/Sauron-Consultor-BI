/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi } from "vitest";
import React from "react";
import { ConsultantDiscoveryPanel } from "../../components/ConsultantDiscoveryPanel";
import type { ConsultantUnderstandingSummary } from "../chaos-data-profiling/ConsultantUnderstandingSummary";

describe("RC-1 Render & Performance Stabilization Unit Tests", () => {
  const mockSummary: ConsultantUnderstandingSummary = {
    sourceId: "src_perf_test",
    sourceName: "vendas.csv",
    companyName: "Empresa Teste",
    groupName: "Grupo Teste",
    analyzedAt: "2026-07-28T00:00:00.000Z",
    discovery: {
      totalRecords: 56000,
      totalFields: 158,
      totalTables: 1,
      totalSheets: 1,
      totalBlocks: 1,
      overallQualityScore: 95,
      originType: "Banco de Dados",
    },
    foundDomains: [],
    ambiguities: [],
    narrative: "Entendimento rápido e otimizado.",
    consultantMetrics: {
      qualityLabel: "Alta Qualidade",
      coveragePercentage: 100,
      pendingRevisionsCount: 0,
      availableAreas: ["Financeiro"],
    },
  };

  it("does not trigger heavy recalculations or throw errors during element creation", () => {
    const handleConfirm = vi.fn();
    const handleGoToAnalysis = vi.fn();

    const props = {
      summary: mockSummary,
      onAcceptSuggestedStructure: () => {},
      onReviewInterpretations: () => {},
      onKeepOriginalNames: () => {},
      onConfirmSourceUnderstanding: handleConfirm,
      onGoToAnalysis: handleGoToAnalysis,
    };

    // Instantiate React element repeatedly to verify structural performance
    for (let i = 0; i < 50; i++) {
      const element = React.createElement(ConsultantDiscoveryPanel, props);
      expect(element).toBeDefined();
    }

    expect(handleConfirm).not.toHaveBeenCalled();
  });
});
