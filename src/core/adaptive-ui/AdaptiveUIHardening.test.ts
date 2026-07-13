/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { workspaceDictionaryRepository } from "./WorkspaceDictionaryRepository";
import { adaptiveTerminologyEngine } from "./AdaptiveTerminologyEngine";
import { adaptiveUILabelEngine } from "./AdaptiveUILabelEngine";
import { adaptiveIconEngine } from "./AdaptiveIconEngine";
import { adaptiveThemeEngine } from "./AdaptiveThemeEngine";
import { identityEngine } from "../identity/IdentityEngine";

vi.mock("../identity/IdentityEngine", () => {
  return {
    identityEngine: {
      getCurrentWorkspace: vi.fn(),
    },
  };
});

describe("Adaptive UX Hardening & Certification Tests", () => {
  const wsAgroId = "ws_agro_test";
  const wsAutoId = "ws_auto_test";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Contract Validation (Canonical vs Display)", () => {
    it("should preserve stable canonicalKey and only modify displayLabel", () => {
      const agroDict = workspaceDictionaryRepository.createDefaultDictionary(wsAgroId, "agro");
      const term = agroDict.terms.people;
      
      expect(term).toBeDefined();
      expect(term!.canonicalKey).toBe("people");
      expect(term!.displayLabel).toBe("Produtor");
      expect(term!.displayPlural).toBe("Produtores");
      expect(term!.workspaceId).toBe(wsAgroId);
    });
  });

  describe("Workspace Isolation", () => {
    it("should isolate dictionaries between different workspaces", () => {
      const agroDict = workspaceDictionaryRepository.createDefaultDictionary(wsAgroId, "agro");
      const autoDict = workspaceDictionaryRepository.createDefaultDictionary(wsAutoId, "auto");
      
      workspaceDictionaryRepository.saveDictionary(agroDict);
      workspaceDictionaryRepository.saveDictionary(autoDict);

      // Workspace 1 (Agro)
      vi.spyOn(identityEngine, "getCurrentWorkspace").mockReturnValue({ id: wsAgroId } as any);
      expect(adaptiveTerminologyEngine.getLabel("people", true)).toBe("Produtores");

      // Workspace 2 (Automotive)
      vi.spyOn(identityEngine, "getCurrentWorkspace").mockReturnValue({ id: wsAutoId } as any);
      expect(adaptiveTerminologyEngine.getLabel("people", true)).toBe("Consultores");
    });
  });

  describe("Strict Translation Boundary Filters", () => {
    beforeEach(() => {
      vi.spyOn(identityEngine, "getCurrentWorkspace").mockReturnValue({ id: wsAgroId } as any);
      const agroDict = workspaceDictionaryRepository.createDefaultDictionary(wsAgroId, "agro");
      workspaceDictionaryRepository.saveDictionary(agroDict);
    });

    it("should translate 'pessoas' to 'produtores' but leave real names unchanged", () => {
      const text = "As pessoas na reunião eram John Doe e Maria Silva.";
      const result = adaptiveUILabelEngine.translateNarrativeText(text);
      
      expect(result).toContain("produtores");
      expect(result).toContain("John Doe");
      expect(result).toContain("Maria Silva");
    });

    it("should translate 'clientes' to 'compradores' but leave company names unchanged", () => {
      const text = "Nossos clientes incluem a empresa Google Inc. e a holding Alpha Group.";
      const result = adaptiveUILabelEngine.translateNarrativeText(text);

      expect(result).toContain("compradores");
      expect(result).toContain("Google Inc.");
      expect(result).toContain("Alpha Group");
    });

    it("should avoid translating inside URLs and emails", () => {
      const text = "Acesse http://www.sauron-clientes.com/vendedores ou envie e-mail para suporte-clientes@empresa.com.";
      const result = adaptiveUILabelEngine.translateNarrativeText(text);

      expect(result).toContain("http://www.sauron-clientes.com/vendedores");
      expect(result).toContain("suporte-clientes@empresa.com");
    });

    it("should avoid translating physical files and filenames", () => {
      const text = "O arquivo de auditoria-clientes.xlsx foi processado.";
      const result = adaptiveUILabelEngine.translateNarrativeText(text);

      expect(result).toContain("auditoria-clientes.xlsx");
    });

    it("should prevent translating lineage and raw mapping brackets", () => {
      const text = "Total de comissões pagas aos vendedores [Linha de Dados: Coluna Comissão de Vendedores em Faturamento.xlsx]";
      const result = adaptiveUILabelEngine.translateNarrativeText(text);

      // Translated part:
      // comissões -> prêmios de safra
      // vendedores -> representantes
      expect(result).toContain("Total de prêmios de safra pagas aos representantes");
      // Untranslated lineage block:
      expect(result).toContain("[Linha de Dados: Coluna Comissão de Vendedores em Faturamento.xlsx]");
    });

    it("should prevent partial matches or replacements inside larger words", () => {
      const text = "subclientes e supervendedores.";
      const result = adaptiveUILabelEngine.translateNarrativeText(text);

      expect(result).toBe("subclientes e supervendedores.");
    });
  });

  describe("Icon Engine Runtime Resolution", () => {
    it("should fall back to HelpCircle when iconKey is invalid or not registered in Lucide", () => {
      vi.spyOn(identityEngine, "getCurrentWorkspace").mockReturnValue({ id: wsAgroId } as any);
      const customDict = workspaceDictionaryRepository.createDefaultDictionary(wsAgroId, "agro");
      if (customDict.terms.people) {
        customDict.terms.people.iconKey = "InvalidNonExistentIconKeyName123";
      }
      workspaceDictionaryRepository.saveDictionary(customDict);

      const component = adaptiveIconEngine.getIconComponent("people");
      expect(component).toBeDefined();
    });
  });

  describe("Accessibility Verification (WCAG AA)", () => {
    it("should calculate WCAG AA contrast ratio correctly", () => {
      // White contrast ratio (#ffffff) against black (#000000)
      const ratio = adaptiveThemeEngine.getContrastRatio("#ffffff", "#000000");
      expect(ratio).toBeCloseTo(21.0, 1);
    });

    it("should fallback to safe accessible color if configured color fails WCAG AA", () => {
      // Extremely low contrast light gray accent color against white background
      const unsafeColor = "#f1f1f1";
      const isSafe = adaptiveThemeEngine.validateAccentColor(unsafeColor, "#ffffff");
      expect(isSafe).toBe(false);

      const safeColor = adaptiveThemeEngine.getSafeAccentColor(unsafeColor, "#ffffff");
      expect(safeColor).toBe("#0f172a"); // Fallback dark slate
    });

    it("should return correct accessible foreground text color based on background", () => {
      // Dark background should get white foreground text
      const fg1 = adaptiveThemeEngine.getAccessibleForeground("#0f172a");
      expect(fg1).toBe("#ffffff");

      // Light background should get dark foreground text
      const fg2 = adaptiveThemeEngine.getAccessibleForeground("#f8fafc");
      expect(fg2).toBe("#0f172a");
    });
  });
});
