import { describe, expect, it } from "vitest";
import type { PreliminaryFinancialAnalysisArtifact } from "../preliminary-analysis/PreliminaryFinancialAnalysisContracts";
import type { ExecutivePresentation } from "../business-intelligence/ExecutivePresentationEngine";
import type { WorkspaceProject } from "../../modules/consultant-workspace/types";
import { buildExportFileName, sanitizeExportPart } from "./ExportFileName";
import { buildExecutivePdfBytes, buildExecutivePdfPages } from "./ExecutivePdfExportService";
import { buildPptxEntries, createStoredZip } from "./PptxPackage";
import { ExecutiveSnapshotService } from "./ExecutiveSnapshotService";

function artifact(overrides: Partial<PreliminaryFinancialAnalysisArtifact> = {}): PreliminaryFinancialAnalysisArtifact {
  return {
    artifactId: "artifact_export_1", artifactVersion: 1, analysisMode: "PRELIMINARY", clientId: "client_1", engagementId: "engagement_1", organizationalScope: { scopeType: "COMPANY", targetId: "company_1" }, dataSourceId: "source_1", workbookId: "workbook_1", containerId: "Dados", sourceFileName: "Consulta Financeiro Topp.xls", sourceFingerprint: "source_fp", schemaVersionNumber: 1,
    physicalRowCount: 205, headerRowCount: 1, dataRowCount: 205, validRowCount: 205, partiallyValidRowCount: 0, excludedRowCount: 0, emptyRowCount: 0, columnCount: 6,
    physicalFields: [{ physicalName: "Valor", physicalColumnIndex: 0, displayName: "Valor", usageStatus: "USED", semanticRole: "VALUE" }], fieldUsages: { value: "Valor" },
    metrics: [
      { metricId: "m1", code: "VALUE_TOTAL", label: "Valor Total", value: 8668993.62, unit: "BRL", validInputCount: 205, excludedInputCount: 0, limitations: [], provenance: { sourceId: "source_1", workbookId: "workbook_1", containerId: "Dados", sheetName: "Dados" } },
      { metricId: "m2", code: "PAID_VALUE_TOTAL", label: "Valor Pago", value: 32479.07, unit: "BRL", validInputCount: 205, excludedInputCount: 0, limitations: [], provenance: { sourceId: "source_1", workbookId: "workbook_1", containerId: "Dados", sheetName: "Dados" } },
      { metricId: "m3", code: "BALANCE_TOTAL", label: "Saldo", value: 8636514.55, unit: "BRL", validInputCount: 205, excludedInputCount: 0, limitations: [], provenance: { sourceId: "source_1", workbookId: "workbook_1", containerId: "Dados", sheetName: "Dados" } },
    ],
    groupings: [{ dimensionCode: "SITUATION", dimensionLabel: "Situação", sourcePhysicalName: "Situação", totalGroupCount: 1, includedGroupCount: 1, truncated: false, items: [{ physicalValue: "Aberto", displayName: "Aberto", recordCount: 205, valueTotal: 8668993.62, paidValueTotal: 32479.07, balanceTotal: 8636514.55, sourceRecordIdentities: [], limitations: [] }] }],
    temporalSeries: [{ seriesCode: "EMISSION_MONTH", seriesLabel: "Evolução", sourcePhysicalName: "Emissão", items: [{ periodKey: "2026-07", recordCount: 205, valueTotal: 8668993.62, paidValueTotal: 32479.07, balanceTotal: 8636514.55 }] }], qualityFindings: [], limitations: [], policyId: "p", policyVersion: "1", policyFingerprint: "p_fp", engineVersion: "1", provenance: { generatedAt: "2026-08-11T00:00:00.000Z", generatedByUserId: "user_a", algorithm: "test" }, fingerprint: "artifact_fp", generatedAt: "2026-08-11T00:00:00.000Z", generatedByUserId: "user_a", status: "COMPLETED", ...overrides,
  };
}

const project = { id: "engagement_1", client: "Topázio & Filhos", presentations: [], executiveSnapshots: [] } as unknown as WorkspaceProject;
const presentation: ExecutivePresentation = { id: "presentation_1", title: "Apresentação", targetName: "Cliente", targetType: "COMPANY", status: "ready", slides: [{ id: "slide_1", title: "Título editado", subtitle: "Resumo", type: "cover", content: { summary: "R$ 8.668.993,62" } }] };
const provenance = { engagementId: "engagement_1", clientId: "client_1", dataSourceId: "source_1", preliminaryArtifactId: "artifact_export_1", artifactFingerprint: "artifact_fp", sourceFingerprint: "source_fp", presentationId: "presentation_1", presentationVersion: 1, generatedAt: "2026-08-11T00:00:00.000Z", generatedByUserId: "user_a", exportVersion: "test" };

describe("MVP-4 export services", () => {
  it("sanitizes professional deterministic file names", () => {
    expect(sanitizeExportPart("Topázio / Filhos: Financeiro?", "Cliente")).toBe("Topazio Filhos Financeiro");
    expect(buildExportFileName("Topázio & Filhos", "Resumo_Executivo", new Date("2026-08-11T00:00:00Z"))).toBe("ASTERION_Topazio_Filhos_Resumo_Executivo_2026-08-11");
  });

  it("creates an eight-page PDF with real certified values and provenance", () => {
    const source = artifact();
    const context = { artifact: source, project, presentation, moduleProjections: [] };
    const pages = buildExecutivePdfPages(context);
    const bytes = buildExecutivePdfBytes(context, provenance);
    const text = new TextDecoder().decode(bytes);
    expect(pages).toHaveLength(8);
    expect(bytes.slice(0, 8).toString()).toContain("37,80,68,70");
    expect(text).toContain("8.668.993,62");
    expect(text).toContain("32.479,07");
    expect(text).toContain("8.636.514,55");
    expect(text).toContain("artifact_export_1");
    expect(bytes.length).toBeGreaterThan(1000);
  });

  it("creates a real OOXML package with eight slides and edited title", () => {
    const slides = Array.from({ length: 8 }, (_, index) => ({ title: index === 1 ? "Título editado pelo consultor" : `Slide ${index + 1}`, subtitle: "Material factual", body: ["R$ 8.668.993,62", "R$ 32.479,07", "R$ 8.636.514,55"] }));
    const bytes = createStoredZip(buildPptxEntries(slides, provenance));
    const text = new TextDecoder().decode(bytes);
    expect(text.slice(0, 2)).toBe("PK");
    expect((text.match(/<p:sldId id=/g) || []).length).toBe(8);
    expect(text).toContain("Título editado pelo consultor");
    expect(text).toContain("presentationml");
    expect(bytes.length).toBeGreaterThan(1000);
  });

  it("persists snapshots by engagement and marks the prior artifact outdated", async () => {
    const source = artifact();
    const old = { ...source, artifactId: "old_artifact", fingerprint: "old_fp" };
    let storedProject: WorkspaceProject = { ...project, presentations: [{ id: "presentation_1", name: "Apresentação", slides: [], artifactId: source.artifactId, artifactFingerprint: source.fingerprint }] as any[], executiveSnapshots: [{ snapshotId: "old_snapshot", clientId: "client_1", engagementId: "engagement_1", dataSourceId: "source_1", preliminaryArtifactId: old.artifactId, presentationId: "presentation_old", sourceFingerprint: "old_source", artifactFingerprint: old.fingerprint, createdAt: "2026-08-01T00:00:00.000Z", createdBy: "user_a", status: "CURRENT", label: "Julho", version: 1 }] } as WorkspaceProject;
    const service = new ExecutiveSnapshotService({ getArtifactById: async () => source, getLatestForEngagement: async () => source }, { getActiveProject: async () => storedProject, updateProject: async (next) => { storedProject = next; } });
    const created = await service.createSnapshot({ artifact: source, presentationId: "presentation_1", label: "Agosto" }, { id: "user_a" } as any);
    expect(created.label).toBe("Agosto");
    expect(storedProject.executiveSnapshots?.find(item => item.label === "Julho")?.status).toBe("OUTDATED");
    expect((await service.listSnapshots("engagement_1", { id: "user_a" } as any)).length).toBe(2);
  });
});
