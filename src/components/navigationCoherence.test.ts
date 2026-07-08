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

  it("verifies that the 'Conectar Dados' group is compact and contains only Central de Dados", () => {
    [true, false].forEach(isAutomotive => {
      const structure = getConsultingFlowStructure(isAutomotive);
      const connectGroup = structure.find(g => g.groupKey === "conectar_dados");
      expect(connectGroup).toBeDefined();
      
      const subItemIds = connectGroup!.subItems.map(s => s.id);
      expect(subItemIds).toEqual(["importacao"]);
    });
  });

  it("verifies and lists structural elements of the sidebar", () => {
    const structure = getConsultingFlowStructure(false);
    const groupKeys = structure.map(g => g.groupKey);
    
    expect(groupKeys).toContain("centro_comando");
    expect(groupKeys).toContain("conhecer_cliente");
    expect(groupKeys).toContain("conectar_dados");
    expect(groupKeys).toContain("diagnosticar_negocio");
    expect(groupKeys).toContain("preparar_decisao");
    expect(groupKeys).toContain("conduzir_sessao");
    expect(groupKeys).toContain("executar_plano");
    expect(groupKeys).toContain("evoluir_resultado");
    expect(groupKeys).toContain("administracao");
  });
});
