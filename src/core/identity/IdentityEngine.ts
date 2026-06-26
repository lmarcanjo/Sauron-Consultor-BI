/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PlatformUser, Organization, Workspace } from "./types";
import { userManager } from "./UserManager";
import { organizationManager } from "./OrganizationManager";
import { accessControlEngine } from "./AccessControlEngine";
import { auditEngine } from "../audit/AuditEngine";

export class IdentityEngine {
  private static instance: IdentityEngine;

  private CURRENT_USER_KEY = "sauron_identity_current_user_id";
  private CURRENT_ORG_KEY = "sauron_identity_current_org_id";
  private CURRENT_WS_KEY = "sauron_identity_current_ws_id";

  private constructor() {
    this.initializeDefaultContext();
  }

  public static getInstance(): IdentityEngine {
    if (!IdentityEngine.instance) {
      IdentityEngine.instance = new IdentityEngine();
    }
    return IdentityEngine.instance;
  }

  private initializeDefaultContext() {
    if (typeof localStorage !== "undefined") {
      try {
        const userId = localStorage.getItem(this.CURRENT_USER_KEY);
        if (!userId) {
          // Default to Lennon Marcanjo (Super Admin) for first-time boot
          localStorage.setItem(this.CURRENT_USER_KEY, "user_super_admin");
          localStorage.setItem(this.CURRENT_ORG_KEY, "org_arcanjo");
          localStorage.setItem(this.CURRENT_WS_KEY, "ws_topazio");
        }
      } catch (e) {
        console.error("[IdentityEngine] Failed initializing storage context:", e);
      }
    }
  }

  public getCurrentUser(): PlatformUser {
    let userId = "user_super_admin";
    if (typeof localStorage !== "undefined") {
      userId = localStorage.getItem(this.CURRENT_USER_KEY) || "user_super_admin";
    }
    const user = userManager.getUser(userId);
    if (!user) {
      // Fallback in case user was deleted
      return userManager.getUsers()[0];
    }
    return user;
  }

  public getCurrentOrganization(): Organization {
    const user = this.getCurrentUser();
    let orgId = user.organizationId;

    if (typeof localStorage !== "undefined") {
      orgId = localStorage.getItem(this.CURRENT_ORG_KEY) || user.organizationId;
    }

    const org = organizationManager.getOrganization(orgId);
    if (!org) {
      return organizationManager.getOrganization(user.organizationId) || organizationManager.getOrganizations()[0];
    }
    return org;
  }

  public getCurrentWorkspace(): Workspace | null {
    let wsId = "";
    if (typeof localStorage !== "undefined") {
      wsId = localStorage.getItem(this.CURRENT_WS_KEY) || "";
    }

    if (!wsId) {
      const workspaces = this.getVisibleWorkspaces();
      if (workspaces.length > 0) {
        this.switchWorkspace(workspaces[0].id);
        return workspaces[0];
      }
      return null;
    }

    const ws = organizationManager.getWorkspace(wsId);
    if (!ws || !accessControlEngine.can(this.getCurrentUser(), "workspace.view", ws)) {
      const workspaces = this.getVisibleWorkspaces();
      if (workspaces.length > 0) {
        this.switchWorkspace(workspaces[0].id);
        return workspaces[0];
      }
      return null;
    }

    return ws;
  }

  /**
   * Switches the logged in simulation context user.
   */
  public switchUser(userId: string): PlatformUser {
    const user = userManager.getUser(userId);
    if (!user) {
      throw new Error(`Simulated user with ID ${userId} does not exist.`);
    }

    if (typeof localStorage !== "undefined") {
      localStorage.setItem(this.CURRENT_USER_KEY, user.id);
      localStorage.setItem(this.CURRENT_ORG_KEY, user.organizationId);

      // Auto-assign first visible workspace
      const visibleWS = organizationManager.getWorkspaces().filter(ws =>
        accessControlEngine.can(user, "workspace.view", ws)
      );
      if (visibleWS.length > 0) {
        localStorage.setItem(this.CURRENT_WS_KEY, visibleWS[0].id);
      } else {
        localStorage.removeItem(this.CURRENT_WS_KEY);
      }
    }

    auditEngine.logEvent("WORKSPACE_ACCESSED", `Iniciou simulação de sessão como usuário: ${user.profile.fullName} (${user.role})`, "INFO", {
      user: user.profile.fullName,
      organizationId: user.organizationId
    });

    return user;
  }

  /**
   * Switches the active organization context.
   */
  public switchOrganization(orgId: string): void {
    const user = this.getCurrentUser();
    const org = organizationManager.getOrganization(orgId);
    if (!org) throw new Error("Organization not found.");

    // Enforce membership check (except Super Admin)
    if (user.role !== "Super Admin" && !org.members.includes(user.id)) {
      throw new Error("User is not a member of this organization.");
    }

    if (typeof localStorage !== "undefined") {
      localStorage.setItem(this.CURRENT_ORG_KEY, orgId);

      const orgWorkspaces = org.workspaces
        .map(id => organizationManager.getWorkspace(id))
        .filter((w): w is Workspace => !!w && accessControlEngine.can(user, "workspace.view", w));

      if (orgWorkspaces.length > 0) {
        localStorage.setItem(this.CURRENT_WS_KEY, orgWorkspaces[0].id);
      } else {
        localStorage.removeItem(this.CURRENT_WS_KEY);
      }
    }
  }

  /**
   * Switches the active workspace.
   */
  public switchWorkspace(wsId: string): void {
    const user = this.getCurrentUser();
    const ws = organizationManager.getWorkspace(wsId);
    if (!ws) throw new Error("Workspace not found.");

    accessControlEngine.requirePermission(user, "workspace.view", ws);

    if (typeof localStorage !== "undefined") {
      localStorage.setItem(this.CURRENT_WS_KEY, wsId);
    }

    auditEngine.logEvent("WORKSPACE_ACCESSED", `Workspace selecionado: ${ws.name}`, "INFO", {
      user: user.profile.fullName,
      organizationId: user.organizationId,
      workspaceId: wsId
    });
  }

  // List of workspaces accessible by the current user
  public getVisibleWorkspaces(): Workspace[] {
    return accessControlEngine.getVisibleWorkspacesForUser(this.getCurrentUser());
  }

  // List of organizations accessible by the current user
  public getVisibleOrganizations(): Organization[] {
    const user = this.getCurrentUser();
    const orgs = organizationManager.getOrganizations();
    if (user.role === "Super Admin") {
      return orgs;
    }
    return orgs.filter(o => o.members.includes(user.id));
  }
}

export const identityEngine = IdentityEngine.getInstance();
export default identityEngine;
