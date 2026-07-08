import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");
const COMPONENTS_DIR = path.join(ROOT, "components");
const CORE_DIR = path.join(ROOT, "core");

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

  it("keeps consolidated dashboards on ExecutiveDashboardEngine outputs", () => {
    const dashboardSurfaces = [
      "components/pages/DashboardPage.tsx",
      "components/ComercialTab.tsx",
      "components/FinanceiroTab.tsx",
      "components/IntelligentDRETab.tsx",
      "components/PeopleIntelligenceTab.tsx",
    ];

    dashboardSurfaces.forEach(relativePath => {
      const content = read(relativePath);
      expect(content).toContain("../core/dashboard-engine");
      expect(content).toContain("DashboardBlocksRenderer");
    });

    expect(read("components/pages/DashboardPage.tsx")).toContain("buildExecutiveDashboard");
    ["ComercialTab.tsx", "FinanceiroTab.tsx", "IntelligentDRETab.tsx", "PeopleIntelligenceTab.tsx"].forEach(fileName => {
      expect(read(`components/${fileName}`)).toContain("buildModuleDashboard");
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
