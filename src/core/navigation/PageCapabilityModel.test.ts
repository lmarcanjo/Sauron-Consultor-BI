/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from "vitest";
import { navigationRegistry } from "./NavigationRegistry";
import { getPageCapability, isBusinessAreaRoute, extractBusinessAreaId } from "./PageCapabilityModel";

describe("PageCapabilityModel — Block 3: capability-driven gates", () => {
  beforeEach(() => {
    navigationRegistry.clearDynamic();
  });

  it("returns a fully-restricted, unregistered capability for unknown routes", () => {
    const cap = getPageCapability("route_that_does_not_exist");
    expect(cap.isRegistered).toBe(false);
    expect(cap.canRenderWithoutDataset).toBe(false);
    expect(cap.isBusinessArea).toBe(false);
  });

  it("exposes the same capability flags declared on the registry item", () => {
    const cap = getPageCapability("resumo");
    expect(cap.isRegistered).toBe(true);
    expect(cap.requiresActiveDataset).toBe(true);
    expect(cap.requiresCertifiedSnapshot).toBe(true);
    expect(cap.isBusinessArea).toBe(false);
  });

  it("identifies Business Area routes without any prefix string checks by the caller", () => {
    navigationRegistry.registerFromDNA([
      { id: "operacao", name: "Operação", description: "", iconKey: "Layers", relatedFields: [], relatedMetrics: [], order: 1, visible: true },
    ]);
    expect(isBusinessAreaRoute("custom_area_operacao")).toBe(true);
    expect(isBusinessAreaRoute("resumo")).toBe(false);
    expect(isBusinessAreaRoute("unknown_route")).toBe(false);
  });

  it("extracts the business area id only for registered BUSINESS_AREA routes", () => {
    navigationRegistry.registerFromDNA([
      { id: "operacao", name: "Operação", description: "", iconKey: "Layers", relatedFields: [], relatedMetrics: [], order: 1, visible: true },
    ]);
    expect(extractBusinessAreaId("custom_area_operacao")).toBe("operacao");
    expect(extractBusinessAreaId("resumo")).toBeNull();
    expect(extractBusinessAreaId("custom_area_never_registered")).toBeNull();
  });
});
