import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { PreliminaryFinancialAnalysisArtifact } from "../preliminary-analysis/PreliminaryFinancialAnalysisContracts";
import { ExecutiveDeliverablesService } from "./ExecutiveDeliverablesService";
import { ExecutivePresentationComposer } from "./ExecutivePresentationComposer";

function artifact(overrides: Partial<PreliminaryFinancialAnalysisArtifact> = {}): PreliminaryFinancialAnalysisArtifact {
  return {
    artifactId: "artifact_mvp3_1",
    artifactVersion: 1,
    analysisMode: "PRELIMINARY",
    clientId: "client_1",
    engagementId: "engagement_1",
    organizationalScope: { scopeType: "COMPANY", targetId: "company_1" },
    dataSourceId: "source_1",
    workbookId: "workbook_1",
    containerId: "Dados",
    sourceFileName: "Consulta Financeiro.xls",
    sourceFingerprint: "source_fp_1",
    schemaVersionNumber: 1,
    physicalRowCount: 12,
    headerRowCount: 1,
    dataRowCount: 11,
    validRowCount: 10,
    partiallyValidRowCount: 1,
    excludedRowCount: 1,
    emptyRowCount: 0,
    columnCount: 8,
    physicalFields: [
      { physicalName: "Valor", physicalColumnIndex: 0, displayName: "Valor", usageStatus: "USED", semanticRole: "VALUE" },
    ],
    fieldUsages: { value: "Valor" },
    metrics: [
      { metricId: "m1", code: "VALUE_TOTAL", label: "Valor Total", value: 1000, unit: "BRL", sourcePhysicalName: "Valor", validInputCount: 10, excludedInputCount: 1, limitations: [], provenance: { sourceId: "source_1", workbookId: "workbook_1", containerId: "Dados", sheetName: "Dados" } },
      { metricId: "m2", code: "PAID_VALUE_TOTAL", label: "Valor Pago", value: 400, unit: "BRL", sourcePhysicalName: "Valor Pago", validInputCount: 10, excludedInputCount: 1, limitations: [], provenance: { sourceId: "source_1", workbookId: "workbook_1", containerId: "Dados", sheetName: "Dados" } },
      { metricId: "m3", code: "BALANCE_TOTAL", label: "Saldo", value: 600, unit: "BRL", sourcePhysicalName: "Saldo", validInputCount: 10, excludedInputCount: 1, limitations: [], provenance: { sourceId: "source_1", workbookId: "workbook_1", containerId: "Dados", sheetName: "Dados" } },
    ],
    groupings: [{ dimensionCode: "SITUATION", dimensionLabel: "Situação", sourcePhysicalName: "Situação", totalGroupCount: 1, includedGroupCount: 1, truncated: false, items: [{ physicalValue: "Aberto", displayName: "Aberto", recordCount: 10, valueTotal: 1000, paidValueTotal: 400, balanceTotal: 600, sourceRecordIdentities: [], limitations: [] }] }],
    temporalSeries: [{ seriesCode: "EMISSION_MONTH", seriesLabel: "Evolução", sourcePhysicalName: "Emissão", items: [{ periodKey: "2026-01", recordCount: 10, valueTotal: 1000, paidValueTotal: 400, balanceTotal: 600 }] }],
    qualityFindings: [],
    limitations: [],
    policyId: "policy_1",
    policyVersion: "1",
    policyFingerprint: "policy_fp_1",
    engineVersion: "1",
    provenance: { generatedAt: "2026-01-01T00:00:00.000Z", generatedByUserId: "user_1", algorithm: "test" },
    fingerprint: "artifact_fp_1",
    generatedAt: "2026-01-01T00:00:00.000Z",
    generatedByUserId: "user_1",
    status: "COMPLETED",
    ...overrides,
  };
}

describe("MVP-3 executive deliverables", () => {
  it("projects the summary, financial dashboard, quality and inventory as available", () => {
    const projection = new ExecutiveDeliverablesService().buildProjection({ artifact: artifact(), moduleProjections: [] });
    expect(projection.deliverables.map(item => item.type)).toEqual(expect.arrayContaining([
      "EXECUTIVE_SUMMARY", "FINANCIAL_DASHBOARD", "DATA_QUALITY_REPORT", "SOURCE_INVENTORY", "EXECUTIVE_PRESENTATION",
    ]));
    expect(projection.deliverables.find(item => item.type === "EXECUTIVE_SUMMARY")?.status).toBe("AVAILABLE");
  });

  it("blocks deliverables from an invalidated artifact without replacing its history", () => {
    const projection = new ExecutiveDeliverablesService().buildProjection({ artifact: artifact({ status: "INVALIDATED" }) });
    expect(projection.deliverables.every(item => item.status === "BLOCKED")).toBe(true);
    expect(projection.deliverables[0].action).toBe("REANALYZE");
  });

  it("composes eight factual slides from the artifact", () => {
    const result = new ExecutivePresentationComposer().compose({ artifact: artifact(), project: { client: "Cliente Um", id: "engagement_1" } as any });
    expect(result.presentation.slides).toHaveLength(8);
    expect(result.presentation.origin).toBe("MVP3_EXECUTIVE_DELIVERABLES");
    expect(result.presentation.slides[1].content.points?.[0]).toContain("R$");
  });

  it("keeps business calculations out of the executive React projections", () => {
    const source = readFileSync(resolve(process.cwd(), "src/components/ExecutiveDashboardPage.tsx"), "utf8");
    expect(source).not.toContain("PreliminaryMetricsCalculator");
    expect(source).not.toContain("allRows");
    expect(source).not.toContain("filteredData");
  });
});
