/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from "vitest";
import { getConsultingFlowStructure } from "./AppSidebar";

describe("Sauron OS — Navigation Coherence & Product Integrity Tests", () => {

  it("verifies there are no duplicate sub-item IDs (routeId) in both automotive and non-automotive modes", () => {
    [true, false].forEach(isAutomotive => {
      const routeIds = new Set<string>();
      const structure = getConsultingFlowStructure(isAutomotive);
      
      structure.forEach(group => {
        group.subItems.forEach(sub => {
          expect(routeIds.has(sub.id)).toBe(false); // Should not have duplicate IDs
          routeIds.add(sub.id);
        });
      });
    });
  });

  it("verifies there are no duplicate menu labels across all sub-items", () => {
    [true, false].forEach(isAutomotive => {
      const labels = new Set<string>();
      const structure = getConsultingFlowStructure(isAutomotive);
      
      structure.forEach(group => {
        group.subItems.forEach(sub => {
          const lowerLabel = sub.title.toLowerCase().trim();
          expect(labels.has(lowerLabel)).toBe(false); 
          labels.add(lowerLabel);
        });
      });
    });
  });

  it("verifies that People Intelligence appears exactly once in the entire structure", () => {
    [true, false].forEach(isAutomotive => {
      let matches = 0;
      const structure = getConsultingFlowStructure(isAutomotive);
      
      structure.forEach(group => {
        group.subItems.forEach(sub => {
          if (sub.title.toLowerCase().includes("people intelligence") || sub.id === "comissoes") {
            matches++;
          }
        });
      });

      expect(matches).toBe(1); // Uniqueness rule: single home for collaborators and commission data
    });
  });

  it("verifies that the 'Conectar Dados' group consolidates all technical actions", () => {
    [true, false].forEach(isAutomotive => {
      const structure = getConsultingFlowStructure(isAutomotive);
      const connectGroup = structure.find(g => g.groupKey === "conectar_dados");
      expect(connectGroup).toBeDefined();
      
      const subItemIds = connectGroup!.subItems.map(s => s.id);
      
      // Tech actions must live in "Conectar Dados"
      expect(subItemIds).toContain("fonte_ativa");
      expect(subItemIds).toContain("banco_connector");
      expect(subItemIds).toContain("vpn_gateway");
      expect(subItemIds).toContain("apis_feed");
      expect(subItemIds).toContain("admin_lgpd");
      expect(subItemIds).toContain("sincronizacao");
      expect(subItemIds).toContain("validacao_dados");
    });
  });

  it("verifies and lists structural elements of the sidebar", () => {
    const autoStructure = getConsultingFlowStructure(true);
    const nonAutoStructure = getConsultingFlowStructure(false);
    
    // Auto structure should have POS VENDAS or ESTOQUE
    const autoIds = autoStructure.flatMap(g => g.subItems.map(s => s.id));
    const nonAutoIds = nonAutoStructure.flatMap(g => g.subItems.map(s => s.id));
    
    expect(autoIds).toContain("posvendas");
    expect(autoIds).toContain("estoque");
    expect(nonAutoIds).not.toContain("posvendas");
    expect(nonAutoIds).not.toContain("estoque");
  });
});
