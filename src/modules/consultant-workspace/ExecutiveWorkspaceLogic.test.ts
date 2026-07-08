import { describe, it, expect } from "vitest";
import { WorkspaceProject, ActionPlan, Meeting } from "./types";

// Helper function that mirrors the health score logic inside ExecutiveWorkspace
function calculateHealthScore(project: WorkspaceProject, filteredDataCount: number, hasKpis: boolean) {
  const hasData = project.spreadsheets.length > 0 || project.dbConnections.length > 0 || filteredDataCount > 0;
  const dataScore = hasData ? 100 : 0;

  const hasFilters = project.filters.length > 0 || project.cnpjs.length > 0 || project.brands.length > 0;
  const filtersScore = hasFilters ? 100 : 0;

  const kpisScore = hasKpis ? 100 : 0;

  const hasPresentations = project.presentations.length > 0;
  const presScore = hasPresentations ? 100 : 0;

  const hasPlans = project.actionPlans.length > 0;
  const plansScore = hasPlans ? 100 : 0;

  const total = Math.round(
    (dataScore * 0.25) +
    (filtersScore * 0.20) +
    (kpisScore * 0.15) +
    (presScore * 0.20) +
    (plansScore * 0.20)
  );

  return { total, data: dataScore, filters: filtersScore, kpis: kpisScore, pres: presScore, plans: plansScore };
}

// Helper function matching the visibility rules in the layout feature
function getVisiblePanels(layout: string) {
  const allPanels = {
    dailyBrief: true,
    checklist: true,
    connections: true,
    timeline: true,
    healthScoreDetails: true,
    actionKanban: true,
    meetings: true
  };

  switch (layout) {
    case "fechamento_mensal":
      return {
        ...allPanels,
        actionKanban: false,
        meetings: false
      };
    case "diretoria":
      return {
        ...allPanels,
        connections: false,
        checklist: false
      };
    case "comercial":
      return {
        ...allPanels,
        connections: false,
        meetings: false,
        healthScoreDetails: false
      };
    case "financeiro":
      return {
        ...allPanels,
        timeline: false,
        meetings: false
      };
    case "auditoria":
      return {
        ...allPanels,
        dailyBrief: false,
        checklist: false,
        actionKanban: false,
        meetings: false
      };
    case "personalizado":
    default:
      return allPanels;
  }
}

// Helper function matching the rule-based daily brief builder
function generateDailyBriefBulletins(project: WorkspaceProject, filteredDataCount: number, hasKpis: boolean) {
  const hasData = project.spreadsheets.length > 0 || project.dbConnections.length > 0 || filteredDataCount > 0;
  const pendingPresCount = project.presentations.length === 0 ? 1 : 0;
  const pendingActions = project.actionPlans.filter(p => p.status === "pending" || p.status === "in-progress").length;
  const nextMeeting = project.meetings[0];

  const bulletins = [];

  if (hasData) {
    bulletins.push({ type: "success", text: "Dados operacionais sincronizados com o ERP" });
  } else {
    bulletins.push({ type: "warning", text: "Sincronização de dados pendente ou sem carga ativa" });
  }

  if (hasKpis) {
    bulletins.push({ type: "success", text: "KPIs e mapeamentos contábeis atualizados" });
  } else {
    bulletins.push({ type: "warning", text: "Mapeamento estrutural de colunas não validado" });
  }

  if (pendingPresCount > 0) {
    bulletins.push({ type: "warning", text: "Nenhuma apresentação estratégica salva para este ciclo" });
  } else {
    bulletins.push({ type: "success", text: `${project.presentations.length} apresentação executiva disponível` });
  }

  if (pendingActions > 0) {
    bulletins.push({ type: "warning", text: `${pendingActions} ação(ões) operacional(ais) pendente(s) no Kanban` });
  } else {
    bulletins.push({ type: "success", text: "Todos os planos de ação concluídos" });
  }

  if (nextMeeting) {
    bulletins.push({ type: "success", text: `Próxima reunião de conselho agendada com ${nextMeeting.responsible}` });
  } else {
    bulletins.push({ type: "warning", text: "Sem reuniões ou rituais cadastrados no período" });
  }

  return bulletins;
}

describe("Executive Workspace Premium Logic, Layouts and Dynamic Rules Suite", () => {
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
    meetings: [{ id: "meet1", presentationId: "pres1", selectedCharts: [], observations: "Assembleia", decisions: "S/A", actionPlans: [], responsible: "Carlos", pendingItems: [] }],
    observations: "",
    history: [],
    auditLog: [],
    lastUpdated: new Date().toISOString(),
    isArchived: false
  };

  // --- HEALTH SCORE TESTS ---
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
    expect(score.total).toBe(45); // 25 (data) + 20 (plans)
    expect(score.data).toBe(100);
    expect(score.plans).toBe(100);
  });

  it("calculates perfect health score of 100% for a fully filled project", () => {
    const score = calculateHealthScore(fullyConfiguredProject, 10, true);
    expect(score.total).toBe(100);
  });

  // --- WORKSPACE LAYOUTS TESTS ---
  it("returns correct visible panels for Fechamento Mensal layout", () => {
    const panels = getVisiblePanels("fechamento_mensal");
    expect(panels.dailyBrief).toBe(true);
    expect(panels.checklist).toBe(true);
    expect(panels.connections).toBe(true);
    expect(panels.actionKanban).toBe(false);
    expect(panels.meetings).toBe(false);
  });

  it("returns correct visible panels for Conselho de Diretoria layout", () => {
    const panels = getVisiblePanels("diretoria");
    expect(panels.dailyBrief).toBe(true);
    expect(panels.checklist).toBe(false);
    expect(panels.connections).toBe(false);
    expect(panels.actionKanban).toBe(true);
    expect(panels.meetings).toBe(true);
  });

  it("returns correct visible panels for Comercial & Vendas layout", () => {
    const panels = getVisiblePanels("comercial");
    expect(panels.actionKanban).toBe(true);
    expect(panels.connections).toBe(false);
    expect(panels.meetings).toBe(false);
    expect(panels.healthScoreDetails).toBe(false);
  });

  it("returns correct visible panels for Auditoria layout", () => {
    const panels = getVisiblePanels("auditoria");
    expect(panels.timeline).toBe(true);
    expect(panels.connections).toBe(true);
    expect(panels.dailyBrief).toBe(false);
    expect(panels.checklist).toBe(false);
  });

  // --- DAILY BRIEF BULLETIN RULES TESTS ---
  it("generates warning bulletins for empty projects", () => {
    const bulletins = generateDailyBriefBulletins(emptyProject, 0, false);
    expect(bulletins.length).toBe(5);
    expect(bulletins[0].type).toBe("warning"); // Sync data warning
    expect(bulletins[1].type).toBe("warning"); // KPIs warning
    expect(bulletins[2].type).toBe("warning"); // Presentations warning
    expect(bulletins[3].type).toBe("success"); // Zero pending plans -> success!
    expect(bulletins[4].type).toBe("warning"); // Meetings warning
  });

  it("generates success bulletins for fully configured projects", () => {
    const bulletins = generateDailyBriefBulletins(fullyConfiguredProject, 5, true);
    expect(bulletins.length).toBe(5);
    expect(bulletins[0].type).toBe("success"); // Sync success
    expect(bulletins[1].type).toBe("success"); // KPIs success
    expect(bulletins[2].type).toBe("success"); // Presentations success
    expect(bulletins[3].type).toBe("warning"); // One pending task -> warning
    expect(bulletins[4].type).toBe("success"); // Meeting success
  });
});
