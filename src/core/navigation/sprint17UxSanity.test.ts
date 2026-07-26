import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getConsultingFlowStructure } from "./consultingFlowStructure";
import { resolveNavigationTarget } from "./NavigationRegistry";

const projectRoot = process.cwd();

describe("Sprint 17 consultant UX boundaries", () => {
  it("keeps one visible source surface and removes absorbed routes", () => {
    const structure = getConsultingFlowStructure(false);
    const items = structure.flatMap(group => group.subItems);

    expect(items.filter(item => item.id === "central_dados")).toHaveLength(1);
    expect(items.map(item => item.id)).not.toEqual(expect.arrayContaining([
      "importacao",
      "biblioteca_workbooks",
      "banco_connector",
      "vpn_gateway",
    ]));
    expect(fs.existsSync(path.join(projectRoot, "src/components/WorkbookLibraryTab.tsx"))).toBe(false);
    expect(fs.existsSync(path.join(projectRoot, "src/components/VpnGatewayTab.tsx"))).toBe(false);
  });

  it("does not expose absorbed routes through the canonical registry", () => {
    for (const route of ["importacao", "biblioteca_workbooks", "banco_connector", "vpn_gateway", "executive_workspace"]) {
      const resolution = resolveNavigationTarget(route, {
        userRole: "SUPER_ADMIN",
        userPermissions: [],
        hasActiveDataset: true,
        isApproved: true,
      }, "enterprise_center");
      expect(resolution.status).toBe("NOT_FOUND");
      expect(resolution.fallbackRouteKey).toBe("enterprise_center");
    }
  });

  it("keeps field configuration in the source analysis surface", () => {
    const resultComponents = [
      "src/components/FinanceiroTab.tsx",
      "src/components/ComercialTab.tsx",
      "src/components/IntelligentDRETab.tsx",
      "src/components/PeopleIntelligenceTab.tsx",
      "src/components/CommissionClosingPanel.tsx",
    ];

    for (const relativePath of resultComponents) {
      const source = fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
      expect(source).not.toContain("ModuleFieldMappingPanel");
    }

    const sourceScreen = fs.readFileSync(path.join(projectRoot, "src/components/CentralDadosTab.tsx"), "utf8");
    expect(sourceScreen).not.toContain("ModuleFieldMappingPanel");
  });
});
