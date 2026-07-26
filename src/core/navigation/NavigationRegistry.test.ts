/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  navigationRegistry,
  resolveNavigationTarget,
  checkNavigationPermission,
  checkAreaPermission,
  classifyMissingBusinessAreaRoute,
  __setArchivedAreaIdsForTesting,
} from "./NavigationRegistry";
import type { BusinessAreaConfig } from "../business-intelligence/ConsultingModelRepository";

function makeArea(overrides: Partial<BusinessAreaConfig> = {}): BusinessAreaConfig {
  return {
    id: "resultados_gerais",
    name: "Resultados Gerais",
    description: "Visão consolidada",
    iconKey: "BarChart3",
    relatedFields: ["Receita"],
    relatedMetrics: [],
    order: 1,
    visible: true,
    ...overrides,
  };
}

describe("NavigationRegistry — Block 1: canonical registry", () => {
  beforeEach(() => {
    navigationRegistry.clearDynamic();
  });

  it("registers static routes at module load and resolves them by id", () => {
    const item = navigationRegistry.resolve("enterprise_center");
    expect(item).not.toBeNull();
    expect(item?.type).toBe("STATIC");
    expect(item?.source).toBe("STATIC");
  });

  it("returns null for an unregistered route", () => {
    expect(navigationRegistry.resolve("does_not_exist")).toBeNull();
  });

  it("registers Business Areas from ProjectDNA under the custom_area_ id and BUSINESS_AREA type", () => {
    navigationRegistry.registerFromDNA([makeArea({ id: "comercial" })]);
    const item = navigationRegistry.resolve("custom_area_comercial");
    expect(item).not.toBeNull();
    expect(item?.type).toBe("BUSINESS_AREA");
    expect(item?.source).toBe("DNA");
    expect(item?.label).toBe("Resultados Gerais");
  });

  it("isolates Business Areas between two different companies (Block 5)", () => {
    // Empresa C
    navigationRegistry.registerFromDNA([makeArea({ id: "resultados_gerais", name: "Resultados Gerais" })]);
    expect(navigationRegistry.resolve("custom_area_resultados_gerais")).not.toBeNull();

    // Switch context to Empresa D — registerFromDNA must clear Empresa C's areas
    navigationRegistry.registerFromDNA([makeArea({ id: "operacao_tecnica", name: "Operação Técnica" })]);
    expect(navigationRegistry.resolve("custom_area_resultados_gerais")).toBeNull();
    expect(navigationRegistry.resolve("custom_area_operacao_tecnica")).not.toBeNull();
  });

  it("never clears STATIC items when re-registering DNA areas", () => {
    navigationRegistry.registerFromDNA([makeArea()]);
    expect(navigationRegistry.resolve("enterprise_center")).not.toBeNull();
    navigationRegistry.registerFromDNA([]);
    expect(navigationRegistry.resolve("enterprise_center")).not.toBeNull();
  });
});

describe("NavigationRegistry — Block 2: resolveNavigationTarget", () => {
  beforeEach(() => {
    navigationRegistry.clearDynamic();
  });

  const baseContext = { userRole: "CONSULTANT", userPermissions: [] as string[], hasActiveDataset: true, isApproved: true };

  it("returns NOT_FOUND for an unknown route and provides a fallback", () => {
    const result = resolveNavigationTarget("totally_unknown_tab", baseContext);
    expect(result.status).toBe("NOT_FOUND");
    expect(result.fallbackRouteKey).toBe("enterprise_center");
  });

  it("keeps the canonical sources route available without a dataset", () => {
    const item = navigationRegistry.resolve("central_dados");
    expect(item?.label).toBe("Central de Dados");
    expect(resolveNavigationTarget("central_dados", { ...baseContext, hasActiveDataset: false }).status).toBe("ALLOWED");
  });

  it("returns ALLOWED for a static route requiring no dataset", () => {
    const result = resolveNavigationTarget("central_dados", baseContext);
    expect(result.status).toBe("ALLOWED");
  });

  it("returns NOT_AUTHORIZED for an admin-only route when role is not SUPER_ADMIN", () => {
    const result = resolveNavigationTarget("usuarios_twin", baseContext);
    expect(result.status).toBe("NOT_AUTHORIZED");
  });

  it("returns ALLOWED for an admin-only route when role is SUPER_ADMIN", () => {
    const result = resolveNavigationTarget("usuarios_twin", { ...baseContext, userRole: "SUPER_ADMIN" });
    expect(result.status).toBe("ALLOWED");
  });

  it("returns PENDING_CONFIGURATION for a data-dependent route without an active dataset", () => {
    const result = resolveNavigationTarget("resumo", { ...baseContext, hasActiveDataset: false });
    expect(result.status).toBe("PENDING_CONFIGURATION");
  });

  it("returns NOT_APPLICABLE for a registered but invisible (disabled) Business Area", () => {
    navigationRegistry.registerFromDNA([makeArea({ id: "arquivada", visible: false })]);
    const result = resolveNavigationTarget("custom_area_arquivada", baseContext);
    expect(result.status).toBe("NOT_APPLICABLE");
  });

  it("enforces per-area permission for dynamic Business Areas", () => {
    navigationRegistry.registerFromDNA([makeArea({ id: "restrita" })]);

    const denied = resolveNavigationTarget("custom_area_restrita", baseContext);
    expect(denied.status).toBe("NOT_AUTHORIZED");

    const allowed = resolveNavigationTarget("custom_area_restrita", {
      ...baseContext,
      userPermissions: ["VIEW_AREA:restrita"],
    });
    expect(allowed.status).toBe("ALLOWED");
  });

  it("SUPER_ADMIN always resolves Business Areas without explicit permission entries", () => {
    navigationRegistry.registerFromDNA([makeArea({ id: "qualquer" })]);
    const result = resolveNavigationTarget("custom_area_qualquer", { ...baseContext, userRole: "SUPER_ADMIN" });
    expect(result.status).toBe("ALLOWED");
  });

  it("distinguishes an archived dynamic route from an unknown route", () => {
    __setArchivedAreaIdsForTesting(["area_archived"]);
    expect(classifyMissingBusinessAreaRoute("custom_area_area_archived")).toBe("ARCHIVED");
    expect(classifyMissingBusinessAreaRoute("custom_area_never_seen")).toBe("NEVER_EXISTED");
    expect(classifyMissingBusinessAreaRoute("resumo")).toBe("NOT_A_BUSINESS_AREA_ROUTE");
    __setArchivedAreaIdsForTesting([]);
  });
});

describe("checkNavigationPermission / checkAreaPermission", () => {
  it("checkAreaPermission grants SUPER_ADMIN unconditionally", () => {
    expect(checkAreaPermission("comercial", "EDIT", "SUPER_ADMIN", [])).toBe(true);
  });

  it("checkAreaPermission requires an explicit action+area permission for other roles", () => {
    expect(checkAreaPermission("comercial", "EDIT", "CONSULTANT", [])).toBe(false);
    expect(checkAreaPermission("comercial", "EDIT", "CONSULTANT", ["EDIT_AREA:comercial"])).toBe(true);
  });

  it("checkNavigationPermission respects wildcard VIEW_AREA:* permission", () => {
    navigationRegistry.registerFromDNA([makeArea({ id: "coringa" })]);
    const item = navigationRegistry.resolve("custom_area_coringa")!;
    expect(checkNavigationPermission(item, "CONSULTANT", ["VIEW_AREA:*"])).toBe(true);
  });
});
