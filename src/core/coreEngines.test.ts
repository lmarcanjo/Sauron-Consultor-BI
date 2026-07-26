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
  // Test 1: PluginEngine loads automotive plugin correctly
  it("PluginEngine loads automotive plugin", () => {
    const automotivePlg = pluginEngine.getPlugin("especializado");
    expect(automotivePlg).not.toBeNull();
    expect(automotivePlg?.getSegmentName()).toBe("especializado");
  });

  // Test 2: Specialized plugin contains neutral cost centers
  it("AutomotivePlugin contains neutralized cost centers", () => {
    const centers = pluginEngine.getSegmentCostCenters("especializado");
    expect(centers.some(c => c.name === "Financeiro")).toBe(true);
    expect(centers.some(c => c.name === "Categorias Adicionais")).toBe(true);
    expect(centers.some(c => c.name === "Linha Comercial")).toBe(true);
    expect(centers.some(c => c.name === "Itens")).toBe(true);
  });

  // Test 3: PresentationManager saves and recovers slide decks
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

  // Test 4: AnalyticsEngine triggers warnings on low margins
  it("AnalyticsEngine generates warning alerts on low operational margins", () => {
    const highExpenseData: LancamentoFinanceiro[] = [
      { Grupo: "Loja A", CNPJ: "111", Marca: "Bandeira", Empresa: "Loja A", Receita: 1000, Custo: 700, Despesa: 280, Lucro: 20, Margem: 2, Mês: "Janeiro", Razão: "Outros", Categoria: "Geral" } // Net profit is 20, margin is 2%, below safety 5%
    ];
    const result = analyticsEngine.analyze(highExpenseData);
    expect(result.insights.some(i => i.type === "warning" && i.title.includes("Margem"))).toBe(true);
  });

  // Test 5: SecurityEngine correctly blocklists destructive statements
  it("SecurityEngine blocks query containing drop, truncate, or delete", () => {
    const badQuery = "DROP TABLE Lancamentos;";
    const safeQuery = "SELECT * FROM public.lancamentos WHERE valor > 100";
    expect(securityEngine.isSqlStatementSafe(badQuery)).toBe(false);
    expect(securityEngine.isSqlStatementSafe(safeQuery)).toBe(true);
  });

  // Test 6: AuditEngine successfully registers and queries events
  it("AuditEngine successfully registers and queries events in the ledger", () => {
    const auditLog = auditEngine.logEvent("DATA_IMPORT", "Importação de planilha teste", "INFO", { count: 15 });
    expect(auditLog.type).toBe("DATA_IMPORT");
    expect(auditLog.count).toBe(15);
    
    const logs = auditEngine.getLogs();
    expect(logs.some(l => l.id === auditLog.id)).toBe(true);
  });
});
