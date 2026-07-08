/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeAll } from "vitest";

// Polyfill localStorage in test environment
beforeAll(() => {
  if (typeof globalThis.localStorage === "undefined") {
    const store = new Map<string, string>();
    globalThis.localStorage = {
      getItem: (key: string) => store.get(key) || null,
      setItem: (key: string, value: string) => { store.set(key, value); },
      removeItem: (key: string) => { store.delete(key); },
      clear: () => { store.clear(); },
      key: (index: number) => Array.from(store.keys())[index] || null,
      length: store.size,
    } as any;
  }
});

import { eventBus } from "./events/EventBus";
import { featureFlagEngine } from "./feature-flags/FeatureFlagEngine";
import { widgetRegistry } from "./widgets/WidgetEngine";
import { layoutEngine } from "./layout/LayoutEngine";
import { searchEngine } from "./search/SearchEngine";
import { pluginSDK, SauronPlugin } from "./plugins/PluginSDK";
import { DesignSystem } from "../design-system";

describe("Sauron Platform Excellence Suite (Sprint Ω)", () => {
  
  // 1. EVENT BUS TESTS
  describe("Event Bus Unit Tests", () => {
    it("subscribes and publishes events correctly", () => {
      let fired = false;
      let payloadReceived: any = null;

      const unsub = eventBus.subscribe("DatabaseSynced", (payload) => {
        fired = true;
        payloadReceived = payload;
      });

      eventBus.publish("DatabaseSynced", { sourceName: "Cloud PostgreSQL", count: 125 });

      expect(fired).toBe(true);
      expect(payloadReceived).not.toBeNull();
      expect(payloadReceived.sourceName).toBe("Cloud PostgreSQL");
      expect(payloadReceived.count).toBe(125);

      // Unsubscribe test
      unsub();
      fired = false;
      eventBus.publish("DatabaseSynced", { sourceName: "Cloud PostgreSQL", count: 50 });
      expect(fired).toBe(false);
    });
  });

  // 2. FEATURE FLAGS TESTS
  describe("Feature Flag Engine Unit Tests", () => {
    it("reads default flags and allows setting values", () => {
      expect(featureFlagEngine.isEnabled("peopleIntelligence")).toBe(true);
      
      // Toggle a flag
      featureFlagEngine.setFlag("copilot", true);
      expect(featureFlagEngine.isEnabled("copilot")).toBe(true);

      featureFlagEngine.setFlag("copilot", false);
      expect(featureFlagEngine.isEnabled("copilot")).toBe(false);
    });
  });

  // 3. WIDGET ENGINE TESTS
  describe("Widget Engine Unit Tests", () => {
    it("correctly registers and queries widgets", () => {
      const mockWidget: any = {
        id: "test_widget_alpha",
        title: "Test Widget Alpha",
        category: "analytics" as const,
        defaultSize: "md" as const,
        component: () => null
      };

      widgetRegistry.registerWidget(mockWidget);
      const retrieved = widgetRegistry.getWidget("test_widget_alpha");
      expect(retrieved).not.toBeUndefined();
      expect(retrieved?.title).toBe("Test Widget Alpha");

      const analyticsWidgets = widgetRegistry.getWidgetsByCategory("analytics");
      expect(analyticsWidgets.some(w => w.id === "test_widget_alpha")).toBe(true);

      // Cleanup
      widgetRegistry.unregisterWidget("test_widget_alpha");
      expect(widgetRegistry.getWidget("test_widget_alpha")).toBeUndefined();
    });
  });

  // 4. LAYOUT ENGINE TESTS
  describe("Layout Engine Unit Tests", () => {
    it("resolves default presets and allows custom configuration", () => {
      expect(layoutEngine.getActivePresetName()).toBe("Diretoria");

      const activeLayout = layoutEngine.getActiveLayout();
      expect(activeLayout).not.toBeUndefined();
      expect(activeLayout.enabledWidgets).toContain("executive_brief");

      // Switch preset
      layoutEngine.setActivePreset("Financeiro");
      expect(layoutEngine.getActivePresetName()).toBe("Financeiro");

      // Switch back
      layoutEngine.setActivePreset("Diretoria");
    });
  });

  // 5. GLOBAL SEARCH ENGINE TESTS
  describe("Global Search Engine Unit Tests", () => {
    it("searches matching clients, tasks and plans across registered index providers", () => {
      const results = searchEngine.search("Topázio");
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.title.includes("Topázio"))).toBe(true);
    });
  });

  // 6. PLUGIN SDK TESTS
  describe("Plugin SDK Unit Tests", () => {
    it("registers and initializes custom plugins, mapping widgets dynamically", () => {
      let initCalled = false;
      const mockPlugin: SauronPlugin = {
        metadata: {
          id: "crm_insights",
          name: "CRM Insights",
          version: "1.0.0",
          description: "Tracks client funnel conversions.",
          author: "Sauron Core"
        },
        initialize() {
          initCalled = true;
        },
        getExtensions() {
          return {
            widgets: [
              {
                id: "crm_funnel",
                title: "CRM Funnel",
                category: "analytics",
                defaultSize: "md",
                component: () => null
              }
            ]
          };
        }
      };

      pluginSDK.registerAndLoad(mockPlugin);
      expect(initCalled).toBe(true);
      expect(pluginSDK.getLoadedPlugins().some(p => p.metadata.id === "crm_insights")).toBe(true);
    });
  });

  // 7. DESIGN SYSTEM TOKENS TESTS
  describe("Design System Tokens Unit Tests", () => {
    it("verifies style dictionary class generation", () => {
      const filledBtn = DesignSystem.Button.build("filled", "md");
      expect(filledBtn).toContain("bg-blue-600");
      expect(filledBtn).toContain("text-white");

      const badge = DesignSystem.Badge.build("success");
      expect(badge).toContain("emerald"); // Contains emerald color indicators
    });
  });
});
