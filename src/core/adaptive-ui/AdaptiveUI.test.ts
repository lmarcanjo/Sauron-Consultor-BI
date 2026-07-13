/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { workspaceDictionaryRepository } from "./WorkspaceDictionaryRepository";
import { adaptiveTerminologyEngine } from "./AdaptiveTerminologyEngine";
import { adaptiveUILabelEngine } from "./AdaptiveUILabelEngine";
import { adaptiveNavigationEngine } from "./AdaptiveNavigationEngine";
import { adaptivePresentationEngine } from "./AdaptivePresentationEngine";
import { identityEngine } from "../identity/IdentityEngine";

vi.mock("../identity/IdentityEngine", () => {
  return {
    identityEngine: {
      getCurrentWorkspace: vi.fn(),
    },
  };
});

describe("Adaptive UX Platform Tests", () => {
  const mockWorkspaceId = "ws_test_adaptive";

  beforeEach(() => {
    vi.clearAllMocks();
    if (typeof localStorage !== "undefined") {
      localStorage.clear();
    }
  });

  describe("WorkspaceDictionaryRepository & Presets", () => {
    it("should generate default Agribusiness dictionary correctly", () => {
      const dict = workspaceDictionaryRepository.createDefaultDictionary(mockWorkspaceId, "Agribusiness");
      expect(dict.workspaceId).toBe(mockWorkspaceId);
      expect(dict.terms.people?.displayLabel).toBe("Produtor");
      expect(dict.terms.branch?.displayLabel).toBe("Fazenda");
      expect(dict.terms.customer?.displayLabel).toBe("Comprador");
    });

    it("should generate default Automotive dictionary correctly", () => {
      const dict = workspaceDictionaryRepository.createDefaultDictionary(mockWorkspaceId, "Automotive");
      expect(dict.terms.people?.displayLabel).toBe("Consultor");
      expect(dict.terms.branch?.displayLabel).toBe("Loja");
      expect(dict.terms.department?.displayLabel).toBe("Oficina");
    });

    it("should save and retrieve dictionary from localStorage", () => {
      const originalDict = workspaceDictionaryRepository.createDefaultDictionary(mockWorkspaceId, "automotive");
      // Edit a term
      if (originalDict.terms.customer) {
        originalDict.terms.customer.displayLabel = "Comprador de Carro";
      }

      workspaceDictionaryRepository.saveDictionary(originalDict);

      const retrieved = workspaceDictionaryRepository.getDictionary(mockWorkspaceId, "automotive");
      expect(retrieved.terms.customer?.displayLabel).toBe("Comprador de Carro");
    });
  });

  describe("AdaptiveTerminologyEngine", () => {
    it("should return fallback values if dictionary is empty or unavailable", () => {
      vi.spyOn(identityEngine, "getCurrentWorkspace").mockReturnValue({ id: "non_existent" } as any);
      
      const term = adaptiveTerminologyEngine.getTerm("people");
      expect(term.displayLabel).toBe("Pessoas");
    });

    it("should return the customized labels when configured", () => {
      vi.spyOn(identityEngine, "getCurrentWorkspace").mockReturnValue({ id: mockWorkspaceId } as any);

      const customDict = workspaceDictionaryRepository.createDefaultDictionary(mockWorkspaceId, "agro");
      workspaceDictionaryRepository.saveDictionary(customDict);

      const labelSingular = adaptiveTerminologyEngine.getLabel("people", false);
      const labelPlural = adaptiveTerminologyEngine.getLabel("people", true);

      expect(labelSingular).toBe("Produtor");
      expect(labelPlural).toBe("Produtores");
    });
  });

  describe("AdaptiveUILabelEngine", () => {
    it("should translate keys directly", () => {
      vi.spyOn(identityEngine, "getCurrentWorkspace").mockReturnValue({ id: mockWorkspaceId } as any);
      const customDict = workspaceDictionaryRepository.createDefaultDictionary(mockWorkspaceId, "agro");
      workspaceDictionaryRepository.saveDictionary(customDict);

      const val = adaptiveUILabelEngine.translate("people", { plural: true });
      expect(val).toBe("Produtores");
    });

    it("should replace static terms in compound strings with case preservation", () => {
      vi.spyOn(identityEngine, "getCurrentWorkspace").mockReturnValue({ id: mockWorkspaceId } as any);
      const customDict = workspaceDictionaryRepository.createDefaultDictionary(mockWorkspaceId, "agro");
      workspaceDictionaryRepository.saveDictionary(customDict);

      const originalText = "O relatório de comissões dos vendedores e clientes está pronto.";
      const adaptedText = adaptiveUILabelEngine.replaceStaticTerms(originalText);

      // Agro terms mapping:
      // comissões -> prêmios de safra
      // vendedores (seller plural) -> representantes
      // clientes (customer plural) -> compradores
      expect(adaptedText).toContain("prêmios de safra");
      expect(adaptedText).toContain("representantes");
      expect(adaptedText).toContain("compradores");
    });

    it("should respect uppercase and capitalization in case preservation", () => {
      vi.spyOn(identityEngine, "getCurrentWorkspace").mockReturnValue({ id: mockWorkspaceId } as any);
      const customDict = workspaceDictionaryRepository.createDefaultDictionary(mockWorkspaceId, "agro");
      workspaceDictionaryRepository.saveDictionary(customDict);

      const originalText = "CLIENTES e Vendedores da Cooperativa.";
      const adaptedText = adaptiveUILabelEngine.replaceStaticTerms(originalText);

      expect(adaptedText).toContain("COMPRADORES");
      expect(adaptedText).toContain("Representantes");
    });
  });

  describe("AdaptiveNavigationEngine", () => {
    it("should translate titles in menu structure objects", () => {
      vi.spyOn(identityEngine, "getCurrentWorkspace").mockReturnValue({ id: mockWorkspaceId } as any);
      const customDict = workspaceDictionaryRepository.createDefaultDictionary(mockWorkspaceId, "agro");
      workspaceDictionaryRepository.saveDictionary(customDict);

      const menu = [
        {
          groupKey: "vendas",
          title: "Vendedores & Comissões",
          subItems: [
            { title: "Relatório de Clientes", id: "rel_clientes" }
          ]
        }
      ];

      const adapted = adaptiveNavigationEngine.adaptMenuStructure(menu);
      expect(adapted[0].title).toBe("Representantes & Prêmios de Safra");
      expect(adapted[0].subItems[0].title).toBe("Relatório de Colheita de Compradores");
    });
  });

  describe("AdaptivePresentationEngine", () => {
    it("should translate deck slide texts and arrays", () => {
      vi.spyOn(identityEngine, "getCurrentWorkspace").mockReturnValue({ id: mockWorkspaceId } as any);
      const customDict = workspaceDictionaryRepository.createDefaultDictionary(mockWorkspaceId, "agro");
      workspaceDictionaryRepository.saveDictionary(customDict);

      const slide = {
        title: "Visão Geral de Clientes",
        content: [
          "O total de comissão pago aos vendedores no período.",
          { label: "Vendedores Ativos", value: "10 pessoas" }
        ]
      };

      const adapted = adaptivePresentationEngine.adaptSlide(slide);
      expect(adapted.title).toBe("Visão Geral de Compradores");
      expect(adapted.content[0]).toBe("O total de prêmio de safra pago aos representantes no período.");
      expect(adapted.content[1].label).toBe("Representantes Ativos");
      expect(adapted.content[1].value).toBe("10 produtores");
    });
  });
});
