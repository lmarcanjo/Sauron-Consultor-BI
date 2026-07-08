# FOUNDATION F1 — SAURON IDENTITY PLATFORM
## ARCHITECTURE & SPECS SHEET — SAURON ENTERPRISE OPERATING PLATFORM

---

## 1. MISSION & SCOPE

This document establishes the definitive enterprise-grade architectural blueprint for the **Sauron Identity Platform (F1 Foundation)**. 

The primary goal of F1 is to provide a decoupled, multi-tenant, policy-driven security system. It models full enterprise corporate hierarchies and implements both **Role-Based Access Control (RBAC)** and **Attribute-Based Access Control (ABAC)**, eliminating hardcoded role checks from UI components. It also supports temporary, fully audited Consultant Impersonation and calculates real-time security posture indicators (Security Maturity Score).

---

## 2. DOMAIN MODEL (F1-A)

Sauron's multi-tenant domain models are defined as clean, strongly typed TypeScript interfaces in `src/core/identity/types.ts`.

```
                  ┌──────────────────────────────────────────┐
                  │                PLATFORM                  │
                  └────────────────────┬─────────────────────┘
                                       │
                  ┌────────────────────▼─────────────────────┐
                  │                 TENANT                   │
                  └────────────────────┬─────────────────────┘
                                       │
                  ┌────────────────────▼─────────────────────┐
                  │              ORGANIZATION                │
                  └────────────────────┬─────────────────────┘
                                       │
                  ┌────────────────────▼─────────────────────┐
                  │             BUSINESS GROUP               │
                  └────────────────────┬─────────────────────┘
                                       │
                  ┌────────────────────▼─────────────────────┐
                  │                COMPANY                   │
                  └──────────┬─────────────────────┬─────────┘
                             │                     │
                  ┌──────────▼─────────┐ ┌─────────▼─────────┐
                  │       BRANCH       │ │    COST CENTER    │
                  └──────────┬─────────┘ └───────────────────┘
                             │
                  ┌──────────▼─────────┐
                  │     DEPARTMENT     │
                  └──────────┬─────────┘
                             │
                  ┌──────────▼─────────┐
                  │        TEAM        │
                  └────────────────────┘
```

### Entity Schema Dictionary

#### 1. Platform
The global SaaS orchestrator instance managing overall subscriptions, licensing plans, and global security policies.
```typescript
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
```

#### 2. Tenant
A dedicated customer sandbox representing a single corporate subscriber contract.
```typescript
export interface Tenant {
  id: string;
  name: string;
  domain: string;
  status: "active" | "suspended" | "pending";
  subscriptionPlan: "trial" | "professional" | "enterprise";
  createdAt: string;
}
```

#### 3. Organization
The logical security boundary representing a firm (e.g., the consulting firm itself or a major client holding group).
```typescript
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
```

#### 4. Business Group
A grouping of related corporate companies representing an industrial conglomerate or retail holding.
```typescript
export interface BusinessGroup {
  id: string;
  tenantId: string;
  name: string;
  companies: string[]; // companyIds
  createdAt: string;
}
```

#### 5. Company
The legal corporate entity (e.g. holding or individual dealer group), containing its CNPJ registration.
```typescript
export interface Company {
  id: string;
  groupId: string;
  name: string;
  cnpj: string;
  branches: string[]; // branchIds
  createdAt: string;
}
```

#### 6. Branch
A physical subsidiary, store, dealer location, or distribution center.
```typescript
export interface Branch {
  id: string;
  companyId: string;
  name: string;
  storeCode?: string;
  departments: string[]; // departmentIds
  createdAt: string;
}
```

#### 7. Department
A specialized workplace division (e.g., Financial, Controller, Sales, HR).
```typescript
export interface Department {
  id: string;
  branchId: string;
  name: string;
  costCenterId?: string;
  parentDepartmentId?: string; // supports hierarchical structures
  teams: string[]; // teamIds
  createdAt: string;
}
```

#### 8. Employee
Detailed employee profiles linked to Platform users containing management structures and baseline compensation.
```typescript
export interface Employee {
  id: string;
  userId: string;
  tenantId: string;
  departmentId: string;
  managerUserId?: string; // direct supervisor
  title: string;
  compensationBase: number;
  status: "active" | "on_leave" | "terminated";
  joinedAt: string;
}
```

#### 9. PlatformUser
The digital user profile holding authentication roles and platform-wide statuses.
```typescript
export interface PlatformUser {
  id: string;
  profile: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl?: string;
  };
  role: Role;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}
```

#### 10. Role & Permission
Predefined structural security roles and granular permission strings.
```typescript
export type Role =
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
  | "workspace.view" | "workspace.manage"
  | "data.view" | "data.import" | "data.sync" | "data.approve"
  | "analytics.view" | "analytics.manage"
  | "presentation.view" | "presentation.create" | "presentation.edit" | "presentation.approve"
  | "meeting.view" | "meeting.host" | "meeting.comment"
  | "action.view" | "action.create" | "action.assign" | "action.complete"
  | "users.invite" | "users.manage"
  | "settings.manage"
  | "audit.view";
```

#### 11. Policy & Scope
Dynamic policies binding a role, permission, and specific dimensional scope constraints (ABAC).
```typescript
export type PermissionScope =
  | "global" | "organization" | "workspace" | "group" | "company"
  | "cnpj" | "brand" | "store" | "department" | "costCenter"
  | "report" | "presentation" | "slide" | "kpi" | "actionPlan";

export interface AccessPolicy {
  id: string;
  role: Role;
  permission: Permission;
  scope: PermissionScope;
  resourceId?: string; // Target specific ID for fine-grained locks
}
```

#### 12. Invitation
Secure, revocable, and expiring user registration invitations.
```typescript
export interface Invitation {
  id: string;
  email: string;
  organizationId: string;
  role: Role;
  scope: PermissionScope;
  targetWorkspaceId?: string;
  invitedBy: string;
  status: "pending" | "accepted" | "cancelled" | "expired";
  createdAt: string;
  expiresAt: string;
}
```

#### 13. Delegation
Temporary, supervisor-approved privilege delegation of specific permissions from one user to another.
```typescript
export interface Delegation {
  id: string;
  tenantId: string;
  fromUserId: string;
  toUserId: string;
  permissions: Permission[];
  purpose: string;
  durationMinutes: number;
  expiresAt: string;
  approvedBy: string; // Supervisor UserId
  status: "active" | "expired" | "revoked";
  createdAt: string;
}
```

#### 14. Session
An active user interaction session, indicating authentication metadata and impersonation flags.
```typescript
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
  impersonatedBy?: string; // original consultant admin user ID
}
```

---

## 3. POLICY ENGINE (F1-B)

Sauron's access control is driven by the central **`AccessControlEngine`** (`src/core/identity/AccessControlEngine.ts`). This architecture decouples access rules from roles and routes evaluations dynamically.

```
                      ┌────────────────────────┐
                      │    ACCESS REQUEST      │
                      │  (User, Perm, Object)  │
                      └───────────┬────────────┘
                                  │
                                  ▼
                     /─────────────────────────\
                    <   Is user Super Admin?    >───[YES]──► ALLOW
                     \─────────────────────────/
                                  │
                                 [NO]
                                  │
                                  ▼
                     /─────────────────────────\
                    <   Does Role have default  >───[YES]──► Check Context Attributes
                    <        permission?       >             and Scopes (ABAC)
                     \─────────────────────────/
                                  │
                                 [NO]
                                  │
                                  ▼
                     /─────────────────────────\
                    <    Is custom Workspace    >───[YES]──► Check Custom Policy (ABAC)
                    <      Policy granted?     >
                     \─────────────────────────/
                                  │
                                 [NO]
                                  │
                                  ▼
                                DENY
```

### ABAC + RBAC Resolution Logic
1. **Implicit Overrides**: Super Admins bypass all checks.
2. **Role Mapping (RBAC)**: Resolves whether the role carries the default permission (defined in `PermissionManager`).
3. **Workspace Access List Controls**: Verifies if the user or their active teams have been granted entry inside the active Workspace sandbox.
4. **Context Attribute Evaluation (ABAC)**: Evaluates dynamic fields inside the resource object (such as `companyId`, `storeId`, or `costCenter`) against active scoped policies.

---

## 4. ORGANIZATION TREE ARCHITECTURE (F1-C)

Sauron operates a fully normalized corporate hierarchy tree:
- **Tenant**: Subscription root.
- **Organization**: Boundary of enterprise (e.g. "Grupo CarMais", "Arcanjo Consulting").
- **Business Group**: Conglomerate grouping.
- **Company**: Juridical entity holding its CNPJ and centralized financial data.
- **Branch**: Stores or distribution outlets.
- **Cost Center / Departments**: Core cost reporting channels.
- **Teams / Employees**: Operational groups and workers.

This model is reflected in both the **`OrganizationManager`** and the **`DigitalTwinEngine`** (`src/core/identity/digitalTwin/DigitalTwinEngine.ts`), allowing users to represent multi-entity organizational units dynamically.

---

## 5. IDENTITY TIMELINE & AUDITING (F1-D)

Sauron enforces deep logging of all identity-altering operations. The standard `AuditEngine` processes and securely persists events into local storage, providing high-visibility logs.

### Monitored Event Types:
- `"USER_INVITED"`: Captured when invitations are created.
- `"USER_ACCESS_GRANTED"`: Captured when an invitation is accepted.
- `"USER_ROLE_CHANGED"`: Logs role promotions or demotions.
- `"USER_ACCESS_REVOKED"`: Fired on user deletion or access removal.
- `"PERMISSION_DENIED"`: Security warning logged on access breaches.
- `"IMPERSONATION_STARTED"`: Logged with reason and duration when a consultant assumes a client session.
- `"IMPERSONATION_ENDED"`: Fired when impersonation finishes and the original consultant session is restored.

---

## 6. SECURITY MATURITY SCORE ENGINE (F1-E)

The **`SecurityScoreEngine`** (`src/core/identity/SecurityScoreEngine.ts`) automatically evaluates a tenant's compliance posture on a scale from `0` to `100`, using a weighted multi-criteria formula.

| Compliance Vector | Metric Description | Weight |
|---|---|---|
| **MFA Adoption Rate** | Percentage of users with multi-factor authentication. | **20%** |
| **Password Complexity** | Enforced baseline password requirements. | **15%** |
| **Active Idle Users** | Penalizes presence of inactive, un-revoked credentials (>90 days). | **15%** |
| **Expired Invitations** | Gauges hygiene of pending invitations. | **10%** |
| **Excessive Admins** | Checks if total Admins exceed 30% of total users. | **10%** |
| **Audit Coverage** | Verifies audit engine ledger activity levels. | **15%** |
| **SSO Integration** | Checks if enterprise Single Sign-on is active. | **15%** |
| **Strict Timeout** | Verifies strict automatic session timeout flags. | **10%** |

---

## 7. DEFENSIVE IDENTITY SDK HELPERS (F1-F)

To protect the architecture against role leaking, components must utilize the strongly typed SDK helper signatures built into `AccessControlEngine`.

```typescript
export class AccessControlEngine {
  /**
   * Primary evaluation function. Check if user is authorized to perform action on resource.
   */
  public can(user: PlatformUser | null | undefined, permission: Permission, resource?: any): boolean;

  /**
   * Helper to evaluate cannot() - the reverse of can()
   */
  public cannot(user: PlatformUser | null | undefined, permission: Permission, resource?: any): boolean;

  /**
   * Evaluates if a user's permission scope covers a specific resource ID
   */
  public withinScope(user: PlatformUser | null | undefined, scope: PermissionScope, resourceId?: string): boolean;

  /**
   * Checks if the user profile carries specific permission on a resource
   */
  public hasPermission(user: PlatformUser | null | undefined, permission: Permission, resource?: any): boolean;

  /**
   * Checks if user has a specific structural Role
   */
  public hasRole(user: PlatformUser | null | undefined, role: Role): boolean;

  /**
   * Exposes raw policy scope evaluation
   */
  public evaluatePolicy(policy: AccessPolicy, resource: any): boolean;
}
```

---

## 8. CONSULTANT IMPERSONATION ENGINE (F1-G)

To allow consultants to troubleshoot and optimize client environments without sharing credentials, Sauron supports **Audited Temporary Session Impersonation** (`src/core/identity/IdentityEngine.ts`).

### Impersonation Lifecycle Sequence
```
Consultant Admin                      IdentityEngine                     AuditEngine
      │                                     │                                 │
      │─── impersonateUser(targetUser) ────►│                                 │
      │    - Specifies target user ID       │                                 │
      │    - Specifies reason & duration    │─── logEvent("IMPERSONATION") ──►│ (Logged with CRITICAL level)
      │                                     │                                 │
      │◄── Returns Target Profile ──────────│                                 │
      │                                     │                                 │
      │   [Acting as Target User]           │                                 │
      │                                     │                                 │
      │─── stopImpersonating() ────────────►│                                 │
      │                                     │─── logEvent("IMPERSONATION") ──►│ (Logged with INFO level)
      │◄── Restores Consultant Profile ─────│                                 │
```

- **Authentication Guard**: Only `"Super Admin"` or `"Consultant Admin"` can execute impersonation.
- **Session Keys**: Keeps track of the original actor in `sauron_identity_impersonator_user_id` inside local storage while the current user context switches.

---

## 9. TECHNOLOGY EVOLUTION MAP

This domain-level design prepares Sauron for the production phases documented in the Infrastructure Roadmap:
1. **Sprint F1 (Done)**: Domain models, policy engine resolution, security score, impersonation and complete test cases.
2. **Phase 2 (Cloud Pilot)**: Sincronização via API Express, persistência relacional Drizzle/Postgres com Row-Level Security (RLS) habilitado.
3. **Phase 3 (Enterprise Multi-Tenant)**: Ativação física de RLS a nível de BD (Tenant ID em todos os esquemas) e integração nativa com Firebase Auth / JWT.
