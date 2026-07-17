import { describe, expect, it } from "vitest";
import { getModuleCapabilityState, shouldExposeModule } from "./moduleCapabilities";

describe("module capabilities", () => {
  it("keeps data modules visible with a pending configuration state", () => {
    expect(getModuleCapabilityState("financeiro", { hasActiveDataset: true, hasMapping: false })).toBe("AVAILABLE");
    expect(shouldExposeModule("PENDING_CONFIGURATION")).toBe(true);
  });

  it("does not expose disabled or experimental modules", () => {
    expect(getModuleCapabilityState("financeiro", { hasActiveDataset: false, permissionGranted: false })).toBe("DISABLED");
    expect(shouldExposeModule("EXPERIMENTAL")).toBe(false);
  });
});
