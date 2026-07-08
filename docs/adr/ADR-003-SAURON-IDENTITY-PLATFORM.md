# ADR-003-SAURON-IDENTITY-PLATFORM: Enterprise Multi-Tenant Identity, Policy Engine and Security Audit Platform

## Status
Accepted

## Context
As the Sauron Platform scales into an enterprise-level multi-tenant Consulting Operating Platform (SaaS), visual components must be decoupled from hardcoded Role checks. We need a flexible, auditable, and secure access management framework capable of representing complex corporate hierarchies (multi-group, multi-company, multi-branch, cost centers, departments) and enforcing Role-Based Access Control (RBAC) paired with Attribute-Based Access Control (ABAC) dynamically.

Additionally, to assist enterprise clients, consultants require temporary, audited session impersonation. Finally, platform administrators need a unified metric (Security Score) to gauge tenant safety policies (MFA, passwords, inactive users, excessive admins).

## Decision
1. **Domain Model Mapping (`src/core/identity/types.ts`)**: Designed comprehensive TypeScript interfaces representing Platform, Tenant, Organization, Business Group, Company, Branch, Department, Employee, Delegation, Session, and SecurityScore to handle all enterprise entities.
2. **Policy Engine (`src/core/identity/AccessControlEngine.ts`)**: Built a robust authorization system resolving access through `Policy -> Permission -> Context`, replacing primitive Role-based UI guards.
3. **Identity SDK Helpers**: Added defensive SDK methods to `AccessControlEngine.ts`:
   - `can()` & `cannot()`: Reversibility for binary checks.
   - `hasPermission()` & `hasRole()`: Direct permission/role verification.
   - `withinScope()`: Evaluates resource-specific attribute constraints (ABAC).
   - `evaluatePolicy()`: Exposes raw policy scope evaluation.
4. **Official Organization Tree**: Standardized hierarchical entity resolution supporting nested Business Groups down to cost centers, physical stores, and teams.
5. **Audited Consultant Impersonation (`src/core/identity/IdentityEngine.ts`)**: Implemented safe, temporary session switching that captures the original auditor ID, the target user, the explicit reason, and duration.
6. **Unified Security Score Engine (`src/core/identity/SecurityScoreEngine.ts`)**: Created a dynamic maturity score based on MFA adoption, inactive accounts, admin-to-user ratios, SSO status, password policies, and audit logging volume.
7. **Identity Timeline Auditing**: Added new system audit scopes (`"IMPERSONATION_STARTED"`, `"IMPERSONATION_ENDED"`) managed under the central `AuditEngine`.

## Consequences
- **Positive**: Complete multi-tenant isolation, decoupling of security logic from visual components, bulletproof audit trails, and automated compliance checking.
- **Negative**: Visual components are strictly forbidden from checking `user.role === "SomeRole"`. All components must execute permission checks through the official Identity SDK helpers.
