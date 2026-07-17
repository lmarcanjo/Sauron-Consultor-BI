import { describe, expect, it } from "vitest";
import { buildCertifiedMetricSnapshot, FinancialConsistencyOrchestrator, ConsistencyMetric } from "./index";

function metric(overrides: Partial<ConsistencyMetric> = {}): ConsistencyMetric {
  return {
    metricKey: "revenue",
    displayLabel: "Receita",
    sourceValue: 100,
    datasetValue: 100,
    kpiValue: 100,
    dashboardValue: 100,
    narrativeValue: 100,
    presentationValue: 100,
    meetingValue: 100,
    minutesValue: 100,
    actionPlanValue: 100,
    tolerance: 0,
    lineage: {
      sourceId: "dataset-1",
      workbookId: "workbook-1",
      sheetName: "Vendas",
      physicalColumnName: "Receita",
      semanticRole: "revenue",
      mappingId: "mapping-1",
      contextId: "company-1",
      companyId: "company-1",
      period: "2026-01",
      producer: "fixture",
      calculatedAt: "2026-07-16T00:00:00.000Z",
    },
    ...overrides,
  };
}

const fullStages = ["source", "dataset", "kpis", "dashboard", "narrative", "presentation", "meeting", "minutes", "actionPlan"] as const;
const analysisStages = ["source", "dataset", "kpis", "dashboard"] as const;

describe("FinancialConsistencyOrchestrator", () => {
  it.each([
    ["1. cadeia completa consistente", metric(), fullStages, "READY_FOR_MEETING"],
    ["2. dashboard divergente", metric({ dashboardValue: 99 }), analysisStages, "BLOCKED"],
    ["3. apresentação divergente", metric({ presentationValue: 99 }), ["source", "dataset", "kpis", "dashboard", "narrative", "presentation"], "BLOCKED"],
    ["4. ata com valor antigo", metric({ minutesValue: 98 }), fullStages, "BLOCKED"],
    ["5. plano com métrica incorreta", metric({ actionPlanValue: 97 }), fullStages, "BLOCKED"],
    ["6. zero legítimo", metric({ sourceValue: 0, datasetValue: 0, kpiValue: 0, dashboardValue: 0 }), analysisStages, "READY_FOR_ANALYSIS"],
    ["7. valor ausente", metric({ dashboardValue: null }), analysisStages, "PENDING"],
    ["8. arredondamento documentado", metric({ dashboardValue: 100.005, tolerance: 0.01 }), analysisStages, "READY_FOR_ANALYSIS"],
    ["9. percentual em escala comum", metric({ metricKey: "achievement_rate", displayLabel: "Atingimento", sourceValue: 0.5, datasetValue: 0.5, kpiValue: 0.5, dashboardValue: 0.5 }), analysisStages, "READY_FOR_ANALYSIS"],
    ["10. empresa A isolada", metric({ lineage: { ...metric().lineage, contextId: "company-a", companyId: "company-a" } }), analysisStages, "READY_FOR_ANALYSIS"],
    ["11. visão consolidada", metric({ lineage: { ...metric().lineage, contextId: "group-1", companyId: null } }), analysisStages, "READY_FOR_ANALYSIS"],
    ["12. visão individual", metric({ lineage: { ...metric().lineage, contextId: "company-b", companyId: "company-b" } }), analysisStages, "READY_FOR_ANALYSIS"],
    ["13. fonte desativada", metric({ sourceValue: null }), analysisStages, "PENDING"],
    ["14. período anterior inexistente", metric({ narrativeValue: null, presentationValue: null }), ["source", "dataset", "kpis", "dashboard"], "READY_FOR_ANALYSIS"],
    ["15. mapping alterado depois da apresentação", metric({ presentationValue: 100, lineage: { ...metric().lineage, mappingId: "mapping-2" }, dashboardValue: 101 }), analysisStages, "BLOCKED"],
  ] as Array<[string, ConsistencyMetric, readonly string[], string]>)
  ("classifica %s", (_name, value, requiredStages, expectedReadiness) => {
    const result = new FinancialConsistencyOrchestrator().reconcile({
      contextId: value.lineage.contextId || "context",
      metrics: [value],
      requiredStages: [...requiredStages] as any,
    });

    expect(result.readiness).toBe(expectedReadiness);
  });

  it("preserva lineage e explica divergência em linguagem simples", () => {
    const result = new FinancialConsistencyOrchestrator().reconcile({
      contextId: "company-1",
      metrics: [metric({ dashboardValue: 90 })],
      requiredStages: [...analysisStages],
    });

    expect(result.report.metrics[0].metricId).toBe("revenue");
    expect(result.report.stages.find(stage => stage.stage === "source")?.source?.sheetName).toBe("Vendas");
    expect(result.report.differences[0]).toMatchObject({ expectedValue: 100, actualValue: 90, difference: -10 });
    expect(new FinancialConsistencyOrchestrator().explain(result)).toContain("Revise a configuração");
  });

  it("trata NaN como erro, nunca como zero", () => {
    const result = new FinancialConsistencyOrchestrator().reconcile({
      contextId: "company-1",
      metrics: [metric({ dashboardValue: Number.NaN })],
      requiredStages: [...analysisStages],
    });

    expect(result.status).toBe("inconsistent");
    expect(result.report.invalidValues).toEqual([{ metricId: "revenue", stage: "dashboard" }]);
  });

  it("gera snapshot certificado contextual sem recalcular a metrica", () => {
    const consistency = new FinancialConsistencyOrchestrator().reconcile({
      contextId: "company-1",
      metrics: [metric()],
      requiredStages: [...analysisStages],
    });

    const snapshot = buildCertifiedMetricSnapshot({
      contextType: "COMPANY",
      contextId: "company-1",
      datasetVersion: "dataset-1:2026-07-16",
      metrics: [metric()],
      consistency: consistency.report,
    });

    expect(snapshot.snapshotId).toBe("snapshot:company-1:dataset-1:2026-07-16");
    expect(snapshot.contextId).toBe("company-1");
    expect(snapshot.metrics.revenue).toMatchObject({ value: 100, sourceValue: 100, status: "CONSISTENT" });
    expect(snapshot.consistencyStatus).toBe("CONSISTENT");
  });
});
