import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");
const COMPONENTS_DIR = path.join(ROOT, "components");
const CORE_DIR = path.join(ROOT, "core");
const MVP2_MODULE_WRAPPERS = [
  "components/FinanceiroTab.tsx",
  "components/ComercialTab.tsx",
  "components/EstoqueTab.tsx",
  "components/ItensTab.tsx",
  "components/PosVendasTab.tsx",
] as const;

function walk(dir: string): string[] {
  return fs.readdirSync(dir).flatMap(entry => {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) return walk(fullPath);
    if (/\.(ts|tsx)$/.test(entry) && !/\.(test|spec)\.(ts|tsx)$/.test(entry)) return [fullPath];
    return [];
  });
}

function read(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

describe("Platform engine consolidation sanity", () => {
  it("prevents React components from importing RuleEngine directly", () => {
    const violations = walk(COMPONENTS_DIR).filter(file => {
      const content = fs.readFileSync(file, "utf8");
      return /from\s+["'][^"']*rule-engine/.test(content) || /\bRuleEngine\b/.test(content);
    });

    expect(violations.map(file => path.relative(ROOT, file))).toEqual([]);
  });

  it("prevents React components from importing demo or mock data modules", () => {
    const violations = walk(COMPONENTS_DIR).filter(file => {
      const content = fs.readFileSync(file, "utf8");
      return /from\s+["'][^"']*(demoData|mockRows|mockData|sampleData|generateDemo)[^"']*["']/.test(content);
    });

    expect(violations.map(file => path.relative(ROOT, file))).toEqual([]);
  });

  it("keeps module dashboards on engine outputs while the MVP home remains data-first", () => {
    const legacyDashboardSurfaces = [
      "components/IntelligentDRETab.tsx",
      "components/PeopleIntelligenceTab.tsx",
    ];

    legacyDashboardSurfaces.forEach(relativePath => {
      const content = read(relativePath);
      expect(content).toContain("../core/dashboard-engine");
      expect(content).toContain("DashboardBlocksRenderer");
    });

    ["IntelligentDRETab.tsx", "PeopleIntelligenceTab.tsx"].forEach(fileName => {
      expect(read(`components/${fileName}`)).toContain("buildModuleDashboard");
    });

    // MVP-2 source-driven modules use the shared activation projection. The
    // projection delegates artifact rendering to the existing financial view;
    // wrappers must not reintroduce the retired dashboard calculation path.
    ["ComercialTab.tsx", "FinanceiroTab.tsx"].forEach(fileName => {
      expect(read(`components/${fileName}`)).toContain("ModuleActivationView");
    });
  });

  it("enforces the canonical MVP-2 ModuleActivationView wrapper contract", () => {
    const forbiddenPatterns = [
      /\bPreliminaryMetricsCalculator\b/,
      /from\s+["'][^"']*Repository(?:["']|\/)/,
      /\bPersistenceManager\b/,
      /\blocalStorage\b/,
      /DashboardBlocksRenderer/,
      /buildModuleDashboard/,
      /onClick=\{\(\)\s*=>\s*\{\s*\}\}/,
      /onClick=\{\(\)\s*=>\s*undefined\}/,
      /console\.log\s*\(/,
      /TODO/,
      /Configura[cç][aã]o\s+pendente/i,
      /\bmetrics\s*\./,
      /\.reduce\s*\(/,
    ];

    MVP2_MODULE_WRAPPERS.forEach(relativePath => {
      const content = read(relativePath);
      expect(content, `${relativePath} must delegate to ModuleActivationView`).toContain("ModuleActivationView");
      forbiddenPatterns.forEach(pattern => {
        expect(content, `${relativePath} violates canonical wrapper guard: ${pattern}`).not.toMatch(pattern);
      });
    });
  });

  it("keeps financial metric math out of consolidated React dashboard surfaces", () => {
    const dashboardSurfaces = [
      "components/pages/DashboardPage.tsx",
      "components/ComercialTab.tsx",
      "components/FinanceiroTab.tsx",
      "components/IntelligentDRETab.tsx",
      "components/DashboardBlocksRenderer.tsx",
    ];
    const forbidden = [
      /\.reduce\s*\(/,
      /\bmetrics\./,
      /\breceitaTotal\b/,
      /\bdespesaTotal\b/,
      /\bcustoTotal\b/,
      /\btotalReceitas\b/,
      /\btotalDespesas\b/,
      /\btotalCustos\b/,
      /\blucroTotal\b/,
      /\bmargem\s*=/,
      /\bticketMedio\b/,
    ];

    const violations = dashboardSurfaces.flatMap(relativePath => {
      const content = read(relativePath);
      return forbidden
        .filter(pattern => pattern.test(content))
        .map(pattern => `${relativePath}: ${pattern}`);
    });

    expect(violations).toEqual([]);
  });

  it("keeps metrics, rules, workbook analysis and dashboards in their engines", () => {
    expect(read("core/dashboard-engine/ExecutiveDashboardEngine.ts")).toContain("BusinessIntelligenceEngine");
    expect(read("core/business-intelligence/BusinessIntelligenceEngine.ts")).toContain("calculateMetric");
    expect(read("core/rule-engine/RuleEngine.ts")).toContain("class RuleEngine");
    expect(read("core/workbook/WorkbookEngine.ts")).toContain("class WorkbookEngine");
    expect(read("core/workbook-reverse/WorkbookReverseEngineer.ts")).toContain("WorkbookCatalog");
    expect(read("core/knowledge-graph/KnowledgeGraphBuilder.ts")).toContain("workbookCatalog");

    const dashboardEngine = read("core/dashboard-engine/ExecutiveDashboardEngine.ts");
    expect(dashboardEngine).toContain("buildExecutiveDashboard");
    expect(dashboardEngine).toContain("buildModuleDashboard");
  });
});
