/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PlatformUser, Permission, Role, Workspace, AccessPolicy } from "./types";
import { permissionManager } from "./PermissionManager";
import { organizationManager } from "./OrganizationManager";
import { auditEngine } from "../audit/AuditEngine";

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

    // 1. Super Admin is always authorized for everything
    if (role === "Super Admin") {
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

      if (!isAllowedUser && !isAllowedTeam && !["Consultant Admin", "Super Admin"].includes(role)) {
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
    if (user.role === "Super Admin" || user.role === "Consultant Admin" || user.role === "Consultant") {
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

  public getVisibleKPIsForUser(user: PlatformUser | null | undefined, kpis: { id: string; name: string; costCenter?: string }[]): any[] {
    if (!user) return [];
    if (user.role === "Super Admin" || user.role === "Consultant Admin" || user.role === "Consultant") {
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
}

export const accessControlEngine = AccessControlEngine.getInstance();
export default accessControlEngine;
