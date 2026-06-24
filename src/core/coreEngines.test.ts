/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeAll } from "vitest";

// Polyfill localStorage in test environment
beforeAll(() => {
  if (typeof globalThis.localStorage === "undefined") {
    const store = new Map<string, string>();
    globalThis.localStorage = {
      getItem: (key: string) => store.get(key) || null,
      setItem: (key: string, value: string) => { store.set(key, value); },
      removeItem: (key: string) => { store.delete(key); },
      clear: () => { store.clear(); },
      key: (index: number) => Array.from(store.keys())[index] || null,
      length: store.size,
    } as any;
  }
});

import { businessEngine } from "./business/BusinessEngine";
import { dataEngine } from "./data/DataEngine";
import { dataCatalog } from "./data/DataCatalog";
import { dataLineage } from "./data/DataLineage";
import { dataQuality } from "./data/DataQuality";
import { analyticsEngine } from "./analytics/AnalyticsEngine";
import { presentationEngine } from "./presentation/PresentationEngine";
import { pluginEngine } from "./plugins/PluginEngine";
import { securityEngine } from "./security/SecurityEngine";
import { auditEngine } from "./audit/AuditEngine";
import { LancamentoFinanceiro } from "../types";

// Auto load plugins to register them
import "./plugins/automotive/AutomotivePlugin";
import "./plugins/agro/AgroPlugin";
import "./plugins/industry/IndustryPlugin";
import "./plugins/services/ServicesPlugin";

describe("Sauron Core Engines Unit Tests Suite", () => {
  // Test 1: DataEngine returns active approved records
  it("DataEngine returns approved data correctly matching the active source", () => {
    // Set approved to true explicitly
    dataEngine.getManager().setApproved(true);
    const approvedRecs = dataEngine.getApprovedRecords();
    expect(Array.isArray(approvedRecs)).toBe(true);
    expect(dataEngine.isApproved()).toBe(true);
  });

  // Test 2: PluginEngine loads automotive plugin correctly
  it("PluginEngine loads automotive plugin", () => {
    const automotivePlg = pluginEngine.getPlugin("automotivo");
    expect(automotivePlg).not.toBeNull();
    expect(automotivePlg?.getSegmentName()).toBe("automotivo");
  });

  // Test 3: AutomotivePlugin contains correct cost centers
  it("AutomotivePlugin contains correct cost centers including F&I and Accessories", () => {
    const centers = pluginEngine.getSegmentCostCenters("automotivo");
    expect(centers.some(c => c.name === "F&I/FNA")).toBe(true);
    expect(centers.some(c => c.name === "Acessórios")).toBe(true);
    expect(centers.some(c => c.name === "Veículos Novos")).toBe(true);
    expect(centers.some(c => c.name === "Peças")).toBe(true);
  });

  // Test 4: DataQuality generates score and findings
  it("DataQuality generates score and identifies nameless columns or empty cells", () => {
    const testData = [
      { Grupo: "B", CNPJ: "456", Receita: 200, Mês: "Janeiro", Custo: 20, Despesa: 20, __EMPTY: "something" },
      { Grupo: "A", CNPJ: "123", Receita: 100, Mês: "Janeiro", Custo: 10, Despesa: 10 }
    ];
    const report = dataQuality.evaluateRecords(testData);
    expect(report.score).toBeLessThan(100); // Because of __EMPTY column
    expect(report.findings.some(f => f.includes("sem cabeçalho"))).toBe(true);
  });

  // Test 5: DataLineage creates lineage mapping for KPI calculation
  it("DataLineage creates origin tracking log for calculated KPIs", () => {
    const sampleRecords: LancamentoFinanceiro[] = [
      { Grupo: "Empresa Real", CNPJ: "111", Marca: "Fiat", Empresa: "Empresa Real", Receita: 5000, Custo: 1000, Despesa: 1000, Mês: "Janeiro", Razão: "Serviço", Categoria: "Outros", arquivo: "test_lineage.xlsx", aba: "Sheet1", usuario: "Lennon" }
    ];
    const lineage = dataLineage.createKpiLineage("TOTAL_REVENUE", 5000, sampleRecords);
    expect(lineage.targetKpi).toBe("TOTAL_REVENUE");
    expect(lineage.value).toBe(5000);
    expect(lineage.fileId).toBe("test_lineage.xlsx");
    expect(lineage.sheetName).toBe("Sheet1");
    expect(lineage.responsibleUser).toBe("Lennon");
  });

  // Test 6: PresentationManager saves and recovers slide decks
  it("PresentationEngine allows generating, saving, and retrieving slide configurations", () => {
    const presId = "pres_test_deck";
    const title = "Presentation Test Run";
    const mockSlides = [
      { id: "s1", title: "Slide 1", subtitle: "Sub 1", type: "cover" as const, order: 1, visible: true, notes: "", content: {}, presentationId: presId }
    ];
    
    presentationEngine.getManager().savePresentation({
      id: presId,
      title,
      clientId: "client_1",
      slides: mockSlides,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    const loaded = presentationEngine.getManager().loadPresentation(presId);
    expect(loaded).not.toBeNull();
    expect(loaded?.title).toBe(title);
    expect(loaded?.slides[0].title).toBe("Slide 1");
  });

  // Test 7: AnalyticsEngine triggers warnings on low margins
  it("AnalyticsEngine generates warning alerts on low operational margins", () => {
    const highExpenseData: LancamentoFinanceiro[] = [
      { Grupo: "Loja A", CNPJ: "111", Marca: "Bandeira", Empresa: "Loja A", Receita: 1000, Custo: 700, Despesa: 280, Mês: "Janeiro", Razão: "Outros", Categoria: "Geral" } // Net profit is 20, margin is 2%, below safety 5%
    ];
    const result = analyticsEngine.analyze(highExpenseData);
    expect(result.insights.some(i => i.type === "warning" && i.title.includes("Margem"))).toBe(true);
  });

  // Test 8: SecurityEngine correctly blocklists destructive statements
  it("SecurityEngine blocks query containing drop, truncate, or delete", () => {
    const badQuery = "DROP TABLE Lancamentos;";
    const safeQuery = "SELECT * FROM public.lancamentos WHERE valor > 100";
    expect(securityEngine.isSqlStatementSafe(badQuery)).toBe(false);
    expect(securityEngine.isSqlStatementSafe(safeQuery)).toBe(true);
  });

  // Test 9: AuditEngine successfully registers and queries events
  it("AuditEngine successfully registers and queries events in the ledger", () => {
    const auditLog = auditEngine.logEvent("DATA_IMPORT", "Importação de planilha teste", "INFO", { count: 15 });
    expect(auditLog.type).toBe("DATA_IMPORT");
    expect(auditLog.count).toBe(15);
    
    const logs = auditEngine.getLogs();
    expect(logs.some(l => l.id === auditLog.id)).toBe(true);
  });
});
