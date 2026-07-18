/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from "vitest";

// Lightweight localStorage mock for Node.js test environment
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => store[key] || null,
  setItem: (key: string, value: string) => { store[key] = value.toString(); },
  removeItem: (key: string) => { delete store[key]; },
  clear: () => { for (const k in store) delete store[k]; },
  length: 0,
  key: (index: number) => null,
};

global.localStorage = localStorageMock;
global.window = {
  localStorage: localStorageMock,
  dispatchEvent: () => true,
  addEventListener: () => {},
  removeEventListener: () => {},
  setTimeout: setTimeout,
} as any;

import { 
  consultingModelRepository, 
  getActiveConsultingModelConfigSync, 
  setActiveConsultingModelConfigSync 
} from "./ConsultingModelRepository";
import { AdaptiveTerminologyEngine } from "../adaptive-ui/AdaptiveTerminologyEngine";
import { ConsultingReadinessService } from "./ConsultingReadinessService";

describe("Consulting Model & F19.2 Analysis Configuration Tests", () => {
  beforeEach(() => {
    setActiveConsultingModelConfigSync(null);
    localStorage.clear();
  });

  it("should successfully create, save and retrieve dynamic consulting configuration", async () => {
    const config = consultingModelRepository.createDefaultConfiguration("ws_test", "group_test", "comp_test");
    expect(config.workspaceId).toBe("ws_test");
    expect(config.enabledModules).toContain("dre");

    await consultingModelRepository.saveConfiguration(config);
    const retrieved = await consultingModelRepository.getConfiguration("ws_test", "comp_test");
    expect(retrieved).not.toBeNull();
    expect(retrieved?.companyId).toBe("comp_test");

    const activeSync = getActiveConsultingModelConfigSync();
    expect(activeSync).not.toBeNull();
    expect(activeSync?.companyId).toBe("comp_test");
  });

  it("should respect physicalName immutability and handle custom display labels", () => {
    const config = consultingModelRepository.createDefaultConfiguration("ws_test", "group_test", "comp_test");
    config.selectedFields["original_field"] = {
      fieldId: "original_field",
      physicalName: "original_field",
      sheetName: "Sheet1",
      detectedType: "number",
      use: "show_indicator",
      displayLabel: "Original Label",
      consultantLabel: "Custom Consultant Label",
      visible: true
    };
    expect(config.selectedFields["original_field"].physicalName).toBe("original_field");
    expect(config.selectedFields["original_field"].consultantLabel).toBe("Custom Consultant Label");
  });

  it("should dynamically override terminology engine labels based on dictionary options", () => {
    const config = consultingModelRepository.createDefaultConfiguration("ws_test", "group_test", "comp_test");
    config.displayDictionary["people"] = "Colaboradores Técnicos";
    setActiveConsultingModelConfigSync(config);

    const terminology = new AdaptiveTerminologyEngine();
    const term = terminology.getTerm("people");
    expect(term.displayLabel).toBe("Colaboradores Técnicos");
  });

  it("should evaluate readiness without penalizing disabled optional modules", async () => {
    const config = consultingModelRepository.createDefaultConfiguration("ws_test", "group_test", "comp_test");
    // Disable DRE module
    config.enabledModules = config.enabledModules.filter(m => m !== "dre");
    setActiveConsultingModelConfigSync(config);

    const readinessService = new ConsultingReadinessService();
    const viewModel = await readinessService.evaluate({
      workspaceId: "ws_test",
      workbookModuleConfigs: {
        "wb_test": { hasDRE: false, hasKPI: false }
      },
      presentationIds: [],
    });

    // Check that DRE dimension score is 100 (not penalized)
    const dreDimension = viewModel.report.dimensions.find(d => d.id === "dre");
    expect(dreDimension?.score).toBe(100);
  });
});
