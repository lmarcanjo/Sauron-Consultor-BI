/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ChaosSourceProfile } from "../chaos-data-profiling";
import type { EnterpriseModel } from "./EnterpriseDiscoveryTypes";
import type {
  OrganizationalReconciliationProposal,
  ProposedAssociation,
  ProposedEntityCreation,
} from "./OrganizationalReconciliationTypes";

export function generateReconciliationProposal(
  profile: ChaosSourceProfile,
  enterpriseModel: EnterpriseModel,
  currentContext: { groupId: string | null; companyId: string | null; unitId: string | null }
): OrganizationalReconciliationProposal {
  const sourceId = profile.sourceId;
  const sourceName = profile.sourceName;

  const discoveredCompanies = Array.from(
    new Set(
      profile.physicalColumns
        .filter(c => c.physicalName.toUpperCase().includes("EMPRESA") || c.physicalName.toUpperCase().includes("LOJA"))
        .flatMap(c => c.examples.map(v => String(v)))
    )
  );

  const discoveredUnits = Array.from(
    new Set(
      profile.physicalColumns
        .filter(c => c.physicalName.toUpperCase().includes("UNIDADE") || c.physicalName.toUpperCase().includes("FILIAL"))
        .flatMap(c => c.examples.map(v => String(v)))
    )
  );

  const discoveredGroups = Array.from(
    new Set(
      profile.physicalColumns
        .filter(c => c.physicalName.toUpperCase().includes("GRUPO"))
        .flatMap(c => c.examples.map(v => String(v)))
    )
  );

  const proposedCreations: ProposedEntityCreation[] = [];
  const proposedAssociations: ProposedAssociation[] = [];
  const conflicts: string[] = [];

  // 1. Evaluate Discovered Companies
  discoveredCompanies.forEach((compName, idx) => {
    proposedCreations.push({
      id: `prop_comp_${idx}`,
      type: "COMPANY",
      suggestedName: compName,
      parentGroupId: currentContext.groupId || null,
      evidence: {
        matchingMethod: "NAME_NORMALIZED",
        confidence: 0.85,
        description: `Encontrado como valor frequente na coluna da fonte.`,
        matchedRecordsEstimate: Math.round((profile.totalKnownRows || 100) / (discoveredCompanies.length || 1)),
        conflicts: [],
      },
      status: "PROPOSED",
    });
  });

  // 2. Conflict check (if current group is Faberge but source has another group)
  if (currentContext.groupId && discoveredGroups.length > 0) {
    const hasDifferentGroup = discoveredGroups.some(g => !g.toLowerCase().includes(currentContext.groupId!.toLowerCase()));
    if (hasDifferentGroup) {
      conflicts.push(`A fonte sugere associação ao grupo '${discoveredGroups.join(", ")}', que difere do grupo atual.`);
    }
  }

  // 3. Proposed Associations
  proposedAssociations.push({
    id: `assoc_src_1`,
    sourceEnterpriseName: sourceName,
    targetCompanyId: currentContext.companyId || null,
    targetGroupId: currentContext.groupId || null,
    scope: currentContext.groupId ? "GROUP" : currentContext.companyId ? "COMPANY" : "UNRECONCILED",
    evidence: {
      matchingMethod: "RECURRENT_PATTERN",
      confidence: 0.90,
      description: `Fonte associada ao contexto ativo (${currentContext.groupId ? "Grupo" : currentContext.companyId ? "Empresa" : "Não Conciliada"}).`,
      matchedRecordsEstimate: profile.totalKnownRows || profile.sampledRecords,
      conflicts,
    },
    status: "PROPOSED",
  });

  return {
    reconciliationId: `recon_${sourceId}_v1`,
    sourceId,
    sourceName,
    currentContext: {
      groupId: currentContext.groupId || null,
      companyId: currentContext.companyId || null,
      unitId: currentContext.unitId || null,
    },
    registeredOrganization: {
      groupsCount: currentContext.groupId ? 1 : 0,
      companiesCount: currentContext.companyId ? 1 : 0,
      unitsCount: currentContext.unitId ? 1 : 0,
    },
    discoveredOrganization: {
      discoveredCompanies,
      discoveredUnits,
      discoveredGroups,
    },
    proposedCreations,
    proposedAssociations,
    conflicts,
    unresolvedItems: conflicts,
    overallConfidence: conflicts.length > 0 ? 0.70 : 0.92,
    status: "GENERATED",
    version: 1,
    createdAt: new Date().toISOString(),
  };
}
