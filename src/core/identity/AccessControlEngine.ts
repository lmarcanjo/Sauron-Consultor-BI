/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PlatformUser, Permission, Role, Workspace, AccessPolicy, PermissionScope } from "./types";
import { permissionManager } from "./PermissionManager";
import { organizationManager } from "./OrganizationManager";
import { auditEngine } from "../audit/AuditEngine";
import { areaPermissionRepository, AreaAction, AreaPermissionContext } from "./AreaPermissionRepository";

// Roles treated as full-trust internal operators for Business Area access —
// consistent with how the rest of this engine already treats them (see
// getVisibleCompaniesForUser below).
const AREA_FULL_TRUST_ROLES: Role[] = ["SUPER_ADMIN", "CONSULTANT", "Consultant Admin", "Consultant"];

export class AccessControlEngine {
  private static instance: AccessControlEngine;

  private constructor() {}

  public static getInstance(): AccessControlEngine {
    if (!AccessControlEngine.instance) {
      AccessControlEngine.instance = new AccessControlEngine();
    }
    return AccessControlEngine.instance;
  }

  /**
   * Primary evaluation function.
   * Returns true if the user is authorized to perform the action on the resource, false otherwise.
   */
  public can(
    user: PlatformUser | null | undefined,
    permission: Permission,
    resource?: any
  ): boolean {
    if (!user) {
      // Allow Guest role to view presentations if resource is shared
      if (permission === "presentation.view" && resource?.isShared) {
        return true;
      }
      return false;
    }

    const { role, organizationId } = user;

    // 1. SUPER_ADMIN is always authorized for everything
    if (role === "SUPER_ADMIN") {
      return true;
    }

    // 2. Check if the user's role has the permission by default
    const hasDefault = permissionManager.roleHasDefaultPermission(role, permission);
    if (!hasDefault) {
      // Check for custom/manual policy grants in the active workspace
      const hasPolicyGrant = this.checkCustomPolicies(user, permission, resource);
      if (!hasPolicyGrant) {
        this.logPermissionDenied(user, permission, resource, "Sem permissão padrão para o papel.");
        return false;
      }
      return true;
    }

    // 3. User has the permission, but let's evaluate context scopes and boundaries
    // If no resource is provided, we default to authorizing standard actions
    if (!resource) {
      return true;
    }

    // Is the resource an organization check?
    if (resource.type === "organization" || resource.organizationId) {
      const resourceOrgId = resource.organizationId || resource.id;
      if (resourceOrgId && resourceOrgId !== organizationId) {
        // Different organizations must be isolated, except for Super Admins
        this.logPermissionDenied(user, permission, resource, "Tentativa de acessar organização diferente.");
        return false;
      }
    }

    // Is the resource a Workspace?
    if (resource.companies && resource.allowedUsers) {
      const ws = resource as Workspace;
      // Is the user specifically allowed in this workspace?
      const isAllowedUser = ws.allowedUsers.includes(user.id);
      const isAllowedTeam = ws.allowedTeams.some(teamId => {
        const team = organizationManager.getTeams().find(t => t.id === teamId);
        return team?.members.includes(user.id);
      });

      if (!isAllowedUser && !isAllowedTeam && !["SUPER_ADMIN"].includes(role)) {
        this.logPermissionDenied(user, permission, resource, "Usuário ou Time não autorizado no workspace.");
        return false;
      }
    }

    // 4. Detailed Scope Evaluation (e.g. Client Manager restricted to their Store)
    const policies = this.getUserPoliciesForPermission(user, permission, resource);
    if (policies.length > 0) {
      // If there are explicit limiting scopes, the resource must match at least one authorized scope
      const passAny = policies.some(policy => this.evaluatePolicyScope(policy, resource));
      if (!passAny) {
        this.logPermissionDenied(user, permission, resource, "Falha na avaliação do escopo da política.");
        return false;
      }
    }

    return true;
  }

  private checkCustomPolicies(user: PlatformUser, permission: Permission, resource?: any): boolean {
    const activeWorkspace = this.resolveWorkspace(resource);
    if (!activeWorkspace) return false;

    // Search workspace-level access policies for an explicit policy matching user role & permission
    const matchingPolicies = activeWorkspace.accessPolicies.filter(
      p => p.role === user.role && p.permission === permission
    );

    if (matchingPolicies.length === 0) return false;

    return matchingPolicies.some(policy => this.evaluatePolicyScope(policy, resource));
  }

  private getUserPoliciesForPermission(user: PlatformUser, permission: Permission, resource?: any): AccessPolicy[] {
    const activeWorkspace = this.resolveWorkspace(resource);
    if (!activeWorkspace) return [];

    // Filter policies for the user's role and permission
    return activeWorkspace.accessPolicies.filter(
      p => p.role === user.role && p.permission === permission
    );
  }

  private evaluatePolicyScope(policy: AccessPolicy, resource: any): boolean {
    if (policy.scope === "global" || policy.scope === "organization" || policy.scope === "workspace") {
      return true;
    }

    if (!resource) return false;

    // Check scopes like "store", "company", "costCenter"
    const targetId = policy.resourceId;
    if (!targetId) return true; // Undefined resourceId means broad scope

    // Resource is a string matching the targetId
    if (typeof resource === "string") {
      return resource === targetId;
    }

    // Resource is an object. Resolve matching fields:
    const resourceName = resource.name || resource.id || resource.storeId || resource.company || resource.costCenter;
    if (resourceName === targetId) return true;

    if (policy.scope === "store" && (resource.store === targetId || resource.storeId === targetId)) return true;
    if (policy.scope === "company" && (resource.company === targetId || resource.companyId === targetId)) return true;
    if (policy.scope === "group" && (resource.groupId === targetId || resource.group === targetId)) return true;
    if (policy.scope === "costCenter" && (resource.costCenter === targetId || resource.costCenterId === targetId)) return true;

    return false;
  }

  private resolveWorkspace(resource: any): Workspace | null {
    if (!resource) return organizationManager.getWorkspaces()[0] || null;
    if (resource.companies && resource.allowedUsers) return resource as Workspace; // Resource itself is workspace

    const wsId = resource.workspaceId || resource.targetWorkspaceId;
    if (wsId) {
      return organizationManager.getWorkspace(wsId) || null;
    }
    // Fallback to first workspace in active organization if possible
    return organizationManager.getWorkspaces()[0] || null;
  }

  private logPermissionDenied(user: PlatformUser, permission: Permission, resource: any, reason: string) {
    const details = `Acesso Negado: Usuário '${user.profile.fullName}' (${user.role}) tentou '${permission}' no recurso '${resource?.id || resource?.name || JSON.stringify(resource)}'. Motivo: ${reason}`;
    console.warn(`[AccessControl] ${details}`);
    auditEngine.logEvent("PERMISSION_DENIED", details, "WARNING", {
      user: user.profile.fullName,
      organizationId: user.organizationId
    });
  }

  // --- GUARDS & HELPERS ---

  public requirePermission(user: PlatformUser | null | undefined, permission: Permission, resource?: any): void {
    if (!this.can(user, permission, resource)) {
      throw new Error(`Forbidden: Missing permission '${permission}'`);
    }
  }

  public filterResourcesByAccess<T>(user: PlatformUser | null | undefined, permission: Permission, items: T[]): T[] {
    return items.filter(item => this.can(user, permission, item));
  }

  public getVisibleWorkspacesForUser(user: PlatformUser | null | undefined): Workspace[] {
    if (!user) return [];
    const allWorkspaces = organizationManager.getWorkspaces();
    return allWorkspaces.filter(ws => this.can(user, "workspace.view", ws));
  }

  public getVisibleCompaniesForUser(user: PlatformUser | null | undefined, workspace: Workspace | null): string[] {
    if (!user || !workspace) return [];
    if (user.role === "SUPER_ADMIN" || user.role === "CONSULTANT") {
      return workspace.companies;
    }

    // Filter based on policy scopes
    const policies = this.getUserPoliciesForPermission(user, "workspace.view", workspace);
    const storePolicies = policies.filter(p => p.scope === "store" || p.scope === "company");

    if (storePolicies.length === 0) {
      // By default, if they can see the workspace and have no restrictive sub-scopes, they see all
      return workspace.companies;
    }

    const allowedResourceIds = storePolicies.map(p => p.resourceId).filter(Boolean) as string[];
    // Intersect
    return workspace.companies.filter(c => allowedResourceIds.includes(c) || allowedResourceIds.some(id => c.includes(id)));
  }

  // --- BUSINESS AREA ACCESS (F20.3 Bloco 8) ---
  //
  // Areas are dynamic (defined by the consultant via Project DNA), so they
  // cannot live in the static `Permission` union. Grants are per
  // user+area+action, stored in `AreaPermissionRepository`.

  private hasAreaAction(user: PlatformUser | null | undefined, areaId: string, action: AreaAction, context?: AreaPermissionContext): boolean {
    if (!user) return false;
    if (AREA_FULL_TRUST_ROLES.includes(user.role)) return true;
    return areaPermissionRepository
      .getGrantsForUser(user.id, context)
      .some(g => g.areaId === areaId && g.actions.includes(action));
  }

  public canViewArea(user: PlatformUser | null | undefined, areaId: string, context?: AreaPermissionContext): boolean {
    return this.hasAreaAction(user, areaId, "VIEW", context);
  }

  public canEditArea(user: PlatformUser | null | undefined, areaId: string, context?: AreaPermissionContext): boolean {
    return this.hasAreaAction(user, areaId, "EDIT", context);
  }

  public canConfigureArea(user: PlatformUser | null | undefined, areaId: string, context?: AreaPermissionContext): boolean {
    return this.hasAreaAction(user, areaId, "CONFIGURE", context);
  }

  public canArchiveArea(user: PlatformUser | null | undefined, areaId: string, context?: AreaPermissionContext): boolean {
    return this.hasAreaAction(user, areaId, "ARCHIVE", context);
  }

  public canDeleteArea(user: PlatformUser | null | undefined, areaId: string, context?: AreaPermissionContext): boolean {
    return this.hasAreaAction(user, areaId, "DELETE", context);
  }

  public canExportArea(user: PlatformUser | null | undefined, areaId: string, context?: AreaPermissionContext): boolean {
    return this.hasAreaAction(user, areaId, "EXPORT", context);
  }

  /** Permission strings (`VIEW_AREA:<id>`, …) for NavigationRegistry's `checkNavigationPermission`. */
  public getAreaPermissionStrings(user: PlatformUser | null | undefined, context?: AreaPermissionContext): string[] {
    if (!user) return [];
    if (AREA_FULL_TRUST_ROLES.includes(user.role)) {
      return ["VIEW_AREA:*", "EDIT_AREA:*", "CONFIGURE_AREA:*", "ARCHIVE_AREA:*", "DELETE_AREA:*", "EXPORT_AREA:*"];
    }
    return areaPermissionRepository.toPermissionStrings(user.id, context);
  }

  public getVisibleKPIsForUser(user: PlatformUser | null | undefined, kpis: { id: string; name: string; costCenter?: string }[]): any[] {
    if (!user) return [];
    if (user.role === "SUPER_ADMIN" || user.role === "CONSULTANT") {
      return kpis;
    }

    const workspace = organizationManager.getWorkspaces()[0]; // active default
    const policies = this.getUserPoliciesForPermission(user, "data.view", workspace);
    const ccPolicies = policies.filter(p => p.scope === "costCenter");

    if (ccPolicies.length === 0) return kpis;

    const allowedCCs = ccPolicies.map(p => p.resourceId).filter(Boolean) as string[];
    return kpis.filter(k => !k.costCenter || allowedCCs.includes(k.costCenter));
  }

  public getVisiblePresentationsForUser(user: PlatformUser | null | undefined, presentations: { id: string; title: string; isShared?: boolean }[]): any[] {
    return this.filterResourcesByAccess(user, "presentation.view", presentations);
  }

  // --- DEFENSIVE SDK HELPERS FOR ABAC/RBAC POLICY EVALUATION ---

  /**
   * Helper to evaluate cannot() - the reverse of can()
   */
  public cannot(
    user: PlatformUser | null | undefined,
    permission: Permission,
    resource?: any
  ): boolean {
    return !this.can(user, permission, resource);
  }

  /**
   * Evaluates if a user's permission scope covers a specific resource ID
   */
  public withinScope(
    user: PlatformUser | null | undefined,
    scope: PermissionScope,
    resourceId?: string
  ): boolean {
    if (!user) return false;
    if (user.role === "SUPER_ADMIN") return true;

    const workspace = this.resolveWorkspace(null);
    if (!workspace) return false;

    const policies = workspace.accessPolicies.filter(
      p => p.role === user.role && p.scope === scope
    );

    if (policies.length === 0) {
      return permissionManager.roleHasDefaultPermission(user.role, "workspace.view");
    }

    if (!resourceId) return true;

    return policies.some(policy => !policy.resourceId || policy.resourceId === resourceId);
  }

  /**
   * Checks if the user profile carries specific permission on a resource
   */
  public hasPermission(
    user: PlatformUser | null | undefined,
    permission: Permission,
    resource?: any
  ): boolean {
    return this.can(user, permission, resource);
  }

  /**
   * Checks if user has a specific structural Role
   */
  public hasRole(
    user: PlatformUser | null | undefined,
    role: Role
  ): boolean {
    if (!user) return false;
    return user.role === role;
  }

  /**
   * Exposes raw policy scope evaluation
   */
  public evaluatePolicy(
    policy: AccessPolicy,
    resource: any
  ): boolean {
    return this.evaluatePolicyScope(policy, resource);
  }
}

export const accessControlEngine = AccessControlEngine.getInstance();
export default accessControlEngine;
