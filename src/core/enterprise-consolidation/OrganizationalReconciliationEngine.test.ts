/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from "vitest";
import { generateReconciliationProposal } from "./OrganizationalReconciliationEngine";
import type { ChaosSourceProfile } from "../chaos-data-profiling";
import type { EnterpriseModel } from "./EnterpriseDiscoveryTypes";

describe("OrganizationalReconciliationEngine", () => {
  it("supports independent company without group (groupId = null)", () => {
    const mockProfile: ChaosSourceProfile = {
      profileId: "p1",
      sourceId: "src_indep_1",
      groupId: "",
      companyId: "comp_indep",
      sourceName: "empresa_topp.csv",
      sourceHash: "hash1",
      totalKnownRows: 500,
      sampledRecords: 500,
      confidenceScore: 0.90,
      physicalContainers: [],
      physicalColumns: [],
      detectedBlocks: [],
      semanticSuggestions: [],
      qualityFindings: [],
      updatedAt: "2026-07-26T00:00:00.000Z",
    };

    const mockModel: EnterpriseModel = {
      companyId: "comp_indep",
      discoveredAt: "2026-07-26T00:00:00.000Z",
      areas: [],
      processes: [],
      entities: [],
      relationships: [],
      gaps: [],
      executiveNarrative: "Empresa Topp sem grupo associado.",
    };

    const proposal = generateReconciliationProposal(mockProfile, mockModel, {
      groupId: null, // INDEPENDENT COMPANY
      companyId: "comp_indep",
      unitId: null,
    });

    expect(proposal.currentContext.groupId).toBeNull();
    expect(proposal.proposedAssociations[0].scope).toBe("COMPANY");
  });

  it("detects explicit group conflict without auto-creating entities", () => {
    const mockProfile: ChaosSourceProfile = {
      profileId: "p2",
      sourceId: "src_conflict_1",
      groupId: "GrupoFaberge",
      companyId: "comp_1",
      sourceName: "honda_vendas.xlsx",
      sourceHash: "hash2",
      totalKnownRows: 1000,
      sampledRecords: 500,
      confidenceScore: 0.90,
      physicalContainers: [],
      physicalColumns: [
        {
          containerId: "c1",
          physicalName: "GRUPO_EMPRESA",
          observedTypes: ["text"],
          probableRole: "name",
          emptyPercentage: 0.0,
          examples: ["Grupo Honda Brasil"],
          uniquenessScore: 0.1,
        },
      ],
      detectedBlocks: [],
      semanticSuggestions: [],
      qualityFindings: [],
      updatedAt: "2026-07-26T00:00:00.000Z",
    };

    const mockModel: EnterpriseModel = {
      companyId: "comp_1",
      discoveredAt: "2026-07-26T00:00:00.000Z",
      areas: [],
      processes: [],
      entities: [],
      relationships: [],
      gaps: [],
      executiveNarrative: "Divergência de grupo observada.",
    };

    const proposal = generateReconciliationProposal(mockProfile, mockModel, {
      groupId: "GrupoFaberge",
      companyId: "comp_1",
      unitId: null,
    });

    expect(proposal.conflicts.length).toBeGreaterThan(0);
    expect(proposal.conflicts[0]).toContain("Grupo Honda Brasil");
    expect(proposal.status).toBe("GENERATED");
  });
});
