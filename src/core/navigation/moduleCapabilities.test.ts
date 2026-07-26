import { describe, expect, it } from "vitest";
import { getModuleCapabilityState, resolveResultModuleCapability, shouldExposeModule } from "./moduleCapabilities";

describe("module capabilities", () => {
  it("keeps data modules visible with a pending configuration state", () => {
    expect(getModuleCapabilityState("financeiro", { hasActiveDataset: true, hasMapping: false })).toBe("AVAILABLE");
    expect(shouldExposeModule("PENDING_CONFIGURATION")).toBe(true);
  });

  it("does not expose disabled or experimental modules", () => {
    expect(getModuleCapabilityState("financeiro", { hasActiveDataset: false, permissionGranted: false })).toBe("DISABLED");
    expect(shouldExposeModule("EXPERIMENTAL")).toBe(false);
  });

  it("keeps the executive view available while withholding results before confirmation", () => {
    const context = { hasActiveDataset: true, hasConfirmedDatasetView: false, numericColumns: ["Valor"] };
    expect(resolveResultModuleCapability("resumo", context)).toBe("AVAILABLE");
    expect(resolveResultModuleCapability("financeiro", context)).toBe("NOT_APPLICABLE");
  });

  it("exposes only results supported by the confirmed source", () => {
    const context = {
      hasActiveDataset: true,
      hasConfirmedDatasetView: true,
      confirmedColumns: ["Vendedor", "Produto", "Valor"],
      numericColumns: ["Valor"],
      textColumns: ["Vendedor", "Produto"],
      mappings: [{ moduleName: "Comercial", selectedColumns: ["Vendedor", "Produto", "Valor"], semanticRoles: {} }],
    };
    expect(resolveResultModuleCapability("comercial", context)).toBe("AVAILABLE");
    expect(resolveResultModuleCapability("comissoes", context)).toBe("AVAILABLE");
    expect(resolveResultModuleCapability("dre_inteligente", context)).toBe("NOT_APPLICABLE");
  });
});
