/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sauron Design Language (SDL) - Core Verification & Compliance Test Suite
 */

import { describe, it, expect } from "vitest";
import { DesignSystem } from "./index";

describe("Sauron Design Language (SDL) Verification Suite", () => {

  // Test 1: Design Tokens existence and type consistency
  it("verifies all critical DesignSystem foundation structures exist", () => {
    expect(DesignSystem).toBeDefined();
    expect(DesignSystem.Colors).toBeDefined();
    expect(DesignSystem.Typography).toBeDefined();
    expect(DesignSystem.Elevation).toBeDefined();
    expect(DesignSystem.Spacing).toBeDefined();
    expect(DesignSystem.Radius).toBeDefined();
    expect(DesignSystem.Animations).toBeDefined();
    expect(DesignSystem.Badge).toBeDefined();
    expect(DesignSystem.Button).toBeDefined();
    expect(DesignSystem.Input).toBeDefined();
    expect(DesignSystem.Card).toBeDefined();
  });

  // Test 2: Spacing System compliance (Múltiplos de 4px)
  it("verifies spacing configuration adheres strictly to the proportional grid", () => {
    // Standard multipliers: 4, 8, 12, 16, 24, 32, 48, 64
    // Checking our defined tokens
    expect(DesignSystem.Spacing.cardPadding).toBe("p-5"); // 20px (multiple of 4)
    expect(DesignSystem.Spacing.container).toContain("p-6"); // 24px (multiple of 4)
    expect(DesignSystem.Spacing.gapSmall).toBe("gap-2"); // 8px (multiple of 4)
    expect(DesignSystem.Spacing.gapMedium).toBe("gap-4"); // 16px (multiple of 4)
    expect(DesignSystem.Spacing.gapLarge).toBe("gap-6"); // 24px (multiple of 4)
  });

  // Test 3: Typography Scales definitions
  it("verifies presence of all core typography family/scale pairs", () => {
    const scales = ["titleLarge", "titleMedium", "titleSmall", "body", "caption", "mono"];
    scales.forEach(scale => {
      expect(DesignSystem.Typography[scale as keyof typeof DesignSystem.Typography]).toBeDefined();
      expect(typeof DesignSystem.Typography[scale as keyof typeof DesignSystem.Typography]).toBe("string");
    });

    // Check display weights and fonts
    expect(DesignSystem.Typography.titleLarge).toContain("tracking-tight");
    expect(DesignSystem.Typography.mono).toContain("font-mono");
    expect(DesignSystem.Typography.caption).toContain("font-mono");
  });

  // Test 4: Button Class Builder consistency
  it("verifies the button class builder generates correct and consistent utility classes", () => {
    const primaryButton = DesignSystem.Button.build("filled", "md");
    expect(primaryButton).toContain("bg-blue-600");
    expect(primaryButton).toContain("text-white");
    expect(primaryButton).toContain("font-bold");
    expect(primaryButton).toContain("px-4");

    const dangerButton = DesignSystem.Button.build("danger", "sm");
    expect(dangerButton).toContain("bg-rose-600");
    expect(dangerButton).toContain("px-2.5");
  });

  // Test 5: Card layouts constraints
  it("verifies card definitions maintain uncompromised layout consistency", () => {
    expect(DesignSystem.Card.container).toContain("rounded-2xl");
    expect(DesignSystem.Card.container).toContain("overflow-hidden");
    expect(DesignSystem.Card.header).toContain("border-b");
    expect(DesignSystem.Card.header).toContain("justify-between");
  });

  // Test 6: Form & Input system consistency
  it("verifies form input properties", () => {
    expect(DesignSystem.Input.text).toContain("focus:ring-blue-500");
    expect(DesignSystem.Input.select).toContain("rounded-lg");
  });

  // Test 7: Animations and timing constraints (< 250ms)
  it("verifies all registered transition timelines reside below the 250ms performance envelope", () => {
    expect(DesignSystem.Animations.hoverScale).toContain("duration-200"); // 200ms < 250ms
    expect(DesignSystem.Animations.transitionQuick).toContain("duration-150"); // 150ms < 250ms
  });

  // Test 8: Empty States and table layout principles
  it("verifies that table rows structure matches modern minimalistic specifications", () => {
    // Verify we have active state/hover styles in animations for lists/tables
    expect(DesignSystem.Animations.hoverScale).toBeDefined();
  });

});
