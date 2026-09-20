/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from "vitest";
import { projectConsultingProgress, ConsultingProgressContext } from "./ConsultingProgressProjection";
import { projectMeetingReadiness } from "./MeetingReadinessProjection";

describe("MVP-5 Consulting Journey Projections", () => {
  const baseContext: ConsultingProgressContext = {
    client: null,
    project: null,
    groups: [],
    companies: [],
    units: [],
    activeDataset: null,
    artifact: null,
    moduleProjections: [],
    hasPresentation: false,
    hasPdfOrPptx: false,
    hasSnapshot: false,
    hasConductedMeeting: false,
    hasPendingItems: false,
  };

  it("calcula nextAction = CADASTRAR CLIENTE quando não há cliente", () => {
    const projection = projectConsultingProgress(baseContext);
    expect(projection.clientStatus).toBe("NOT_STARTED");
    expect(projection.nextAction.id).toBe("create_client");
    expect(projection.overallCompletion).toBeLessThan(20);
  });

  it("calcula nextAction = CONFIGURAR ESTRUTURA quando há cliente e engajamento sem estrutura", () => {
    const ctx: ConsultingProgressContext = {
      ...baseContext,
      client: {
        id: "cli-1",
        legalName: "ACME Corp",
        document: "00.000.000/0001-00",
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      project: {
        id: "eng-1",
        client: "ACME Corp",
        clientId: "cli-1",
        group: "Engajamento 1",
        segment: "Serviços",
        companies: [],
        brands: [],
        cnpjs: [],
        dbConnections: [],
        spreadsheets: [],
        importProfile: null,
        filters: [],
        kpis: [],
        dashboards: [],
        presentations: [],
        actionPlans: [],
        meetings: [],
        observations: "",
        history: [],
        auditLog: [],
        lastUpdated: new Date().toISOString(),
        isArchived: false,
      },
    };

    const projection = projectConsultingProgress(ctx);
    expect(projection.clientStatus).toBe("COMPLETED");
    expect(projection.engagementStatus).toBe("COMPLETED");
    expect(projection.organizationStatus).toBe("NOT_STARTED");
    expect(projection.nextAction.id).toBe("configure_structure");
  });

  it("calcula nextAction = ADICIONAR DADOS quando há estrutura mas sem fonte", () => {
    const ctx: ConsultingProgressContext = {
      ...baseContext,
      client: { id: "cli-1", legalName: "ACME", document: "1", status: "ACTIVE", createdAt: "", updatedAt: "" },
      project: { id: "eng-1", client: "ACME", clientId: "cli-1", group: "Eng", segment: "Geral", companies: [], brands: [], cnpjs: [], dbConnections: [], spreadsheets: [], importProfile: null, filters: [], kpis: [], dashboards: [], presentations: [], actionPlans: [], meetings: [], observations: "", history: [], auditLog: [], lastUpdated: "", isArchived: false },
      groups: [{ id: "grp-1", name: "Grupo 1", parentId: "", type: "Grupo" } as any],
      companies: [{ id: "comp-1", name: "Empresa 1", parentId: "grp-1", type: "Empresa" } as any],
    };

    const projection = projectConsultingProgress(ctx);
    expect(projection.organizationStatus).toBe("COMPLETED");
    expect(projection.sourceStatus).toBe("NOT_STARTED");
    expect(projection.nextAction.id).toBe("add_source");
  });

  it("calcula nextAction = ANALISAR DADOS quando há fonte ativa sem análise", () => {
    const ctx: ConsultingProgressContext = {
      ...baseContext,
      client: { id: "cli-1", legalName: "ACME", document: "1", status: "ACTIVE", createdAt: "", updatedAt: "" },
      project: { id: "eng-1", client: "ACME", clientId: "cli-1", group: "Eng", segment: "Geral", companies: [], brands: [], cnpjs: [], dbConnections: [], spreadsheets: [], importProfile: null, filters: [], kpis: [], dashboards: [], presentations: [], actionPlans: [], meetings: [], observations: "", history: [], auditLog: [], lastUpdated: "", isArchived: false },
      groups: [{ id: "grp-1", name: "Grupo 1", parentId: "", type: "Grupo" } as any],
      companies: [{ id: "comp-1", name: "Empresa 1", parentId: "grp-1", type: "Empresa" } as any],
      activeDataset: { datasetId: "ds-1", sourceName: "teste.xls", rowCount: 100, columnCount: 10, importedAt: "", sheets: [] } as any,
    };

    const projection = projectConsultingProgress(ctx);
    expect(projection.sourceStatus).toBe("COMPLETED");
    expect(projection.analysisStatus).toBe("NOT_STARTED");
    expect(projection.nextAction.id).toBe("analyze_source");
  });

  it("avalia Meeting Readiness como NOT_READY quando faltam itens obrigatórios", () => {
    const readiness = projectMeetingReadiness(baseContext);
    expect(readiness.status).toBe("NOT_READY");
    expect(readiness.canStartMeeting).toBe(false);
    expect(readiness.blockers.length).toBeGreaterThan(0);
  });

  it("avalia Meeting Readiness como READY_WITH_LIMITATIONS quando há limitações não-bloqueantes", () => {
    const readyContext: ConsultingProgressContext = {
      ...baseContext,
      client: { id: "cli-1", legalName: "ACME", document: "1", status: "ACTIVE", createdAt: "", updatedAt: "" },
      project: { id: "eng-1", client: "ACME", clientId: "cli-1", group: "Eng", segment: "Geral", companies: [], brands: [], cnpjs: [], dbConnections: [], spreadsheets: [], importProfile: null, filters: [], kpis: [], dashboards: [], presentations: [], actionPlans: [], meetings: [], observations: "", history: [], auditLog: [], lastUpdated: "", isArchived: false },
      groups: [{ id: "grp-1", name: "Grupo 1", parentId: "", type: "Grupo" } as any],
      companies: [{ id: "comp-1", name: "Empresa 1", parentId: "grp-1", type: "Empresa" } as any],
      activeDataset: { datasetId: "ds-1", sourceName: "teste.xls", rowCount: 100, columnCount: 10, importedAt: "", sheets: [] } as any,
      artifact: {
        artifactId: "art-1",
        artifactVersion: 1,
        sourceFileName: "teste.xls",
        generatedAt: "",
        fingerprint: "f1",
        sourceFingerprint: "sf1",
        schemaVersionNumber: 1,
        clientId: "cli-1",
        engagementId: "eng-1",
        dataSourceId: "ds-1",
        containerId: "sheet-0",
        organizationalScope: { scopeType: "COMPANY", targetId: "comp-1" },
        physicalRowCount: 100,
        validRowCount: 100,
        excludedRowCount: 0,
        columnCount: 10,
        physicalFields: [],
        metrics: [],
        temporalSeries: [],
        groupings: [],
        qualityFindings: [],
        limitations: [{ code: "COMMERCIAL_UNAVAILABLE", message: "Módulo Comercial não disponível: campo Produto ausente.", severity: "WARNING" }],
        status: "COMPLETED",
      } as any,
      moduleProjections: [
        { moduleId: "FINANCIAL", status: "ACTIVE", missingRequirements: [], limitations: [] } as any,
        { moduleId: "COMMERCIAL", status: "REQUIRES_CONFIGURATION", missingRequirements: ["Produto"], limitations: ["Coluna Produto ausente"] } as any,
      ],
      hasPresentation: true,
      hasPdfOrPptx: true,
      hasSnapshot: true,
      hasConductedMeeting: false,
      hasPendingItems: false,
    };

    const readiness = projectMeetingReadiness(readyContext);
    expect(readiness.status).toBe("READY_WITH_LIMITATIONS");
    expect(readiness.canStartMeeting).toBe(true);
    expect(readiness.warnings.length).toBeGreaterThan(0);
    expect(readiness.blockers.length).toBe(0);
  });
});
