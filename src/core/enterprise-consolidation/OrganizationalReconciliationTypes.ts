/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ReconciliationStatus =
  | "GENERATED"
  | "UNDER_REVIEW"
  | "PARTIALLY_ACCEPTED"
  | "ACCEPTED"
  | "REJECTED"
  | "SUPERSEDED";

export type ReconciliationScope = "GROUP" | "COMPANY" | "UNIT" | "UNRECONCILED";

export interface MatchEvidence {
  matchingMethod: "CNPJ" | "NAME_EXACT" | "NAME_NORMALIZED" | "RECURRENT_PATTERN" | "UNIT_CODE";
  confidence: number;
  description: string;
  matchedRecordsEstimate: number;
  conflicts: string[];
}

export interface ProposedEntityCreation {
  id: string;
  type: "GROUP" | "COMPANY" | "UNIT";
  suggestedName: string;
  parentGroupId?: string | null;
  parentCompanyId?: string | null;
  evidence: MatchEvidence;
  status: "PROPOSED" | "ACCEPTED" | "REJECTED" | "EDITED";
  editedName?: string;
}

export interface ProposedAssociation {
  id: string;
  sourceEnterpriseName: string;
  targetCompanyId?: string | null;
  targetGroupId?: string | null;
  scope: ReconciliationScope;
  evidence: MatchEvidence;
  status: "PROPOSED" | "ACCEPTED" | "REJECTED";
}

export interface OrganizationalReconciliationProposal {
  reconciliationId: string;
  sourceId: string;
  sourceName: string;
  currentContext: {
    groupId: string | null;   // null if independent company or no group
    companyId: string | null;
    unitId: string | null;
  };
  registeredOrganization: {
    groupsCount: number;
    companiesCount: number;
    unitsCount: number;
  };
  discoveredOrganization: {
    discoveredCompanies: string[];
    discoveredUnits: string[];
    discoveredGroups: string[];
  };
  proposedCreations: ProposedEntityCreation[];
  proposedAssociations: ProposedAssociation[];
  conflicts: string[];
  unresolvedItems: string[];
  overallConfidence: number;
  status: ReconciliationStatus;
  version: number;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}
