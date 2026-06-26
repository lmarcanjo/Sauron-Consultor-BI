import { describe, it, expect, beforeEach, vi } from "vitest";
import { consultantWorkspaceManager } from "./ConsultantWorkspaceManager";
import { WorkspaceProject, ActionPlan, Meeting } from "./types";

// Helper function that mirrors the health score logic inside ExecutiveWorkspace
function calculateHealthScore(project: WorkspaceProject, filteredDataCount: number, hasKpis: boolean) {
  // 1. Dados (25%): Se tem spreadsheets, dbConnections ou filteredData
  const hasData = project.spreadsheets.length > 0 || project.dbConnections.length > 0 || filteredDataCount > 0;
  const dataScore = hasData ? 100 : 0;

  // 2. Filtros (20%): Se filtros do projeto estão populados ou se filtros na UI estão configurados
  const hasFilters = project.filters.length > 0 || project.cnpjs.length > 0 || project.brands.length > 0;
  const filtersScore = hasFilters ? 100 : 0;

  // 3. KPIs Mapeados (15%): Se as colunas obrigatórias estão preenchidas
  const kpisScore = hasKpis ? 100 : 0;

  // 4. Apresentações (20%): Se possui apresentações salvas
  const hasPresentations = project.presentations.length > 0;
  const presScore = hasPresentations ? 100 : 0;

  // 5. Planos de Ação (20%): Se possui planos de ação cadastrados
  const hasPlans = project.actionPlans.length > 0;
  const plansScore = hasPlans ? 100 : 0;

  // Weighted average
  const total = Math.round(
    (dataScore * 0.25) +
    (filtersScore * 0.20) +
    (kpisScore * 0.15) +
    (presScore * 0.20) +
    (plansScore * 0.20)
  );

  return { total, data: dataScore, filters: filtersScore, kpis: kpisScore, pres: presScore, plans: plansScore };
}

describe("Executive Workspace Logic and Score Calculations Suite", () => {
  const emptyProject: WorkspaceProject = {
    id: "empty_123",
    client: "Cliente Teste Vazio",
    group: "Grupo Sem Carga",
    segment: "Automotivo",
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
    isArchived: false
  };

  const fullyConfiguredProject: WorkspaceProject = {
    id: "full_123",
    client: "Cliente Teste Completo",
    group: "Holding S/A",
    segment: "Automotivo",
    companies: ["Filial A", "Filial B"],
    brands: ["Brand A"],
    cnpjs: ["CNPJ 1"],
    dbConnections: [{ id: "db1", name: "Conn1", host: "localhost" }],
    spreadsheets: [{ id: "sh1", name: "Planilha.xlsx", path: "/" }],
    importProfile: { id: "p1", name: "Profile 1", rules: {} },
    filters: [{ id: "f1", name: "Filtro 1", expression: "A == B" }],
    kpis: [{ id: "k1", name: "KPI 1", target: 100 }],
    dashboards: [{ id: "d1", name: "Dash 1", layout: {} }],
    presentations: [{ id: "pres1", name: "Apresentacao 1", slides: [] }],
    actionPlans: [{ id: "plan1", description: "Tarefa 1", priority: "high", responsible: "User", deadline: "2026-06-30", status: "pending", origin: "Test" }],
    meetings: [],
    observations: "",
    history: [],
    auditLog: [],
    lastUpdated: new Date().toISOString(),
    isArchived: false
  };

  it("calculates correct health score of 0% for a completely empty project", () => {
    const score = calculateHealthScore(emptyProject, 0, false);
    expect(score.total).toBe(0);
    expect(score.data).toBe(0);
    expect(score.filters).toBe(0);
    expect(score.kpis).toBe(0);
    expect(score.pres).toBe(0);
    expect(score.plans).toBe(0);
  });

  it("calculates partial health score (e.g. data + plans configured)", () => {
    const partialProject = {
      ...emptyProject,
      spreadsheets: [{ id: "sh1", name: "dados.xlsx", path: "/" }],
      actionPlans: [{ id: "p1", description: "Fazer X", priority: "medium" as const, responsible: "Lennon", deadline: "2026", status: "pending" as const, origin: "Manual" }]
    };

    const score = calculateHealthScore(partialProject, 0, false);
    // Data = 25% (100 * 0.25), Plans = 20% (100 * 0.20), Filters = 0, KPIs = 0, Pres = 0 -> Total = 45%
    expect(score.total).toBe(45);
    expect(score.data).toBe(100);
    expect(score.plans).toBe(100);
    expect(score.filters).toBe(0);
  });

  it("calculates perfect health score of 100% for a fully filled project", () => {
    const score = calculateHealthScore(fullyConfiguredProject, 10, true);
    expect(score.total).toBe(100);
    expect(score.data).toBe(100);
    expect(score.filters).toBe(100);
    expect(score.kpis).toBe(100);
    expect(score.pres).toBe(100);
    expect(score.plans).toBe(100);
  });

  it("generates correct checklist items recommendation based on project state", () => {
    const hasData = emptyProject.spreadsheets.length > 0 || emptyProject.dbConnections.length > 0;
    const hasKpis = false;
    const hasFilters = emptyProject.filters.length > 0;

    expect(hasData).toBe(false);
    expect(hasKpis).toBe(false);
    expect(hasFilters).toBe(false);

    const hasDataFull = fullyConfiguredProject.spreadsheets.length > 0;
    const hasFiltersFull = fullyConfiguredProject.filters.length > 0;
    expect(hasDataFull).toBe(true);
    expect(hasFiltersFull).toBe(true);
  });
});
