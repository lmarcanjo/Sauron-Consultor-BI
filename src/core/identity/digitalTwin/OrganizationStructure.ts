/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface OrganizationStructure {
  organizationId: string;
  name: string;
  totalWorkspaces: number;
  totalUsers: number;
  totalTeams: number;
  dataSources: string[];
  presentations: string[];
  meetings: string[];
  actionPlans: string[];
  lastAuditActivity: string;
}
