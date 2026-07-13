/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Role = 
  | "SUPER_ADMIN" 
  | "CONSULTANT"
  | "Super Admin"
  | "Consultant Admin"
  | "Consultant"
  | "Client Director"
  | "Client Manager"
  | "Financial User"
  | "Controller"
  | "Auditor"
  | "Viewer"
  | "Guest";

export type Permission =
  | "workspace.view"
  | "workspace.manage"
  | "data.view"
  | "data.import"
  | "data.sync"
  | "data.approve"
  | "analytics.view"
  | "analytics.manage"
  | "presentation.view"
  | "presentation.create"
  | "presentation.edit"
  | "presentation.approve"
  | "meeting.view"
  | "meeting.host"
  | "meeting.comment"
  | "action.view"
  | "action.create"
  | "action.assign"
  | "action.complete"
  | "users.invite"
  | "users.manage"
  | "settings.manage"
  | "audit.view";

export type PermissionScope =
  | "global"
  | "organization"
  | "workspace"
  | "group"
  | "company"
  | "cnpj"
  | "brand"
  | "store"
  | "department"
  | "costCenter"
  | "report"
  | "presentation"
  | "slide"
  | "kpi"
  | "actionPlan";

export interface AccessPolicy {
  id: string;
  role: Role;
  permission: Permission;
  scope: PermissionScope;
  resourceId?: string; // Optional identifier specifying the exact scope target (e.g., storeId, companyId)
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
}

export interface PlatformUser {
  id: string;
  profile: UserProfile;
  role: Role;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Membership {
  userId: string;
  organizationId: string;
  role: Role;
  joinedAt: string;
}

export interface Team {
  id: string;
  organizationId: string;
  name: string;
  members: string[]; // userIds
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  type: "consulting_firm" | "client_group" | "internal";
  ownerUserId: string;
  members: string[]; // userIds
  teams: string[]; // teamIds
  workspaces: string[]; // workspaceIds
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceAccess {
  workspaceId: string;
  userId: string;
  role: Role;
  policies: AccessPolicy[];
}

export interface Workspace {
  id: string;
  name: string;
  organizationId: string;
  clientId: string; // e.g. "client_1"
  groupId?: string;
  companies: string[];
  brands: string[];
  stores: string[];
  costCenters: string[];
  allowedUsers: string[]; // userIds
  allowedTeams: string[]; // teamIds
  accessPolicies: AccessPolicy[];
  dataSources: string[];
  presentations: string[]; // presentationIds
  meetings: string[]; // meetingIds
  actionPlans: string[]; // actionPlanIds
  auditTrail: string[]; // auditEventIds
  createdAt: string;
  updatedAt: string;
}

export interface Invitation {
  id: string;
  email: string;
  organizationId: string;
  role: Role;
  scope: PermissionScope;
  targetWorkspaceId?: string;
  invitedBy: string; // userId
  status: "pending" | "accepted" | "cancelled" | "expired";
  createdAt: string;
  expiresAt: string;
}

export interface ShareLink {
  id: string;
  resourceId: string;
  resourceType: "presentation" | "report" | "meeting" | "actionPlan";
  permissions: Permission[];
  createdBy: string; // userId
  createdAt: string;
  expiresAt: string;
  readOnly: boolean;
  revoked: boolean;
  token: string;
}

export type AuditAccessType =
  | "USER_INVITED"
  | "USER_ROLE_CHANGED"
  | "USER_ACCESS_GRANTED"
  | "USER_ACCESS_REVOKED"
  | "WORKSPACE_ACCESSED"
  | "SHARE_LINK_CREATED"
  | "SHARE_LINK_REVOKED"
  | "PERMISSION_DENIED"
  | "DIGITAL_TWIN_UPDATED"
  | "IMPERSONATION_STARTED"
  | "IMPERSONATION_ENDED";

export interface AuditAccessEvent {
  id: string;
  timestamp: string;
  userId: string;
  type: AuditAccessType;
  organizationId: string;
  workspaceId?: string;
  resourceId?: string;
  details: string;
  ipAddress?: string;
}

export interface Platform {
  id: string;
  name: string;
  version: string;
  globalSettings: {
    mfaRequired: boolean;
    passwordComplexityPolicy: boolean;
    ssoEnabled: boolean;
    sessionTimeoutMinutes: number;
  };
  tenants: string[]; // tenantIds
}

export interface Tenant {
  id: string;
  name: string;
  domain: string;
  status: "active" | "suspended" | "pending";
  subscriptionPlan: "trial" | "professional" | "enterprise";
  createdAt: string;
}

export interface BusinessGroup {
  id: string;
  tenantId: string;
  name: string;
  companies: string[]; // companyIds
  createdAt: string;
}

export interface Company {
  id: string;
  groupId: string;
  name: string;
  cnpj: string;
  branches: string[]; // branchIds
  createdAt: string;
}

export interface Branch {
  id: string;
  companyId: string;
  name: string;
  storeCode?: string;
  departments: string[]; // departmentIds
  createdAt: string;
}

export interface Department {
  id: string;
  branchId: string;
  name: string;
  costCenterId?: string;
  parentDepartmentId?: string; // hierarchical tree nesting
  teams: string[]; // teamIds
  createdAt: string;
}

export interface Employee {
  id: string;
  userId: string;
  tenantId: string;
  departmentId: string;
  managerUserId?: string;
  title: string;
  compensationBase: number;
  status: "active" | "on_leave" | "terminated";
  joinedAt: string;
}

export interface Delegation {
  id: string;
  tenantId: string;
  fromUserId: string;
  toUserId: string;
  permissions: Permission[];
  purpose: string;
  durationMinutes: number;
  expiresAt: string;
  approvedBy: string; // supervisorId
  status: "active" | "expired" | "revoked";
  createdAt: string;
}

export interface Session {
  id: string;
  userId: string;
  tenantId: string;
  mfaVerified: boolean;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  expiresAt: string;
  lastActiveAt: string;
  isImpersonated: boolean;
  impersonatedBy?: string; // original userId
}

export interface SecurityScore {
  score: number; // 0 - 100
  criteria: {
    mfaAdoptionRate: number; // percentage of active users with MFA
    passwordPolicyEnabled: boolean;
    idleUsersCount: number; // users inactive > 90 days
    expiredInvitationsCount: number;
    adminsCount: number; // total users with Super Admin/Consultant Admin role
    auditActivityRate: number; // ratio of actions captured by AuditEngine
    ssoEnabled: boolean;
    sessionStrictTimeout: boolean;
  };
  lastEvaluatedAt: string;
}

export interface AuthSession {
  userId: string;
  role: Role;
  organizationId: string;
  workspaceIds: string[];
  companyIds: string[];
  authenticatedAt: string;
  expiresAt?: string;
}


