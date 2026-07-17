/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PlatformUser, Organization, Workspace, AuthSession } from "./types";
import { userManager } from "./UserManager";
import { organizationManager } from "./OrganizationManager";
import { accessControlEngine } from "./AccessControlEngine";
import { auditEngine } from "../audit/AuditEngine";
import { IdentityCleanupMigration } from "./IdentityCleanupMigration";

export class IdentityEngine {
  private static instance: IdentityEngine;

  private CURRENT_USER_KEY = "sauron_identity_current_user_id";
  private CURRENT_ORG_KEY = "sauron_identity_current_org_id";
  private CURRENT_WS_KEY = "sauron_identity_current_ws_id";

  private qaUserOverride: PlatformUser | null = null;
  private testFallbackDisabled = false;

  public disableTestFallback(disabled: boolean) {
    this.testFallbackDisabled = disabled;
  }

  public setQaUserOverride(user: PlatformUser | null) {
    this.qaUserOverride = user;
    if (user) {
      auditEngine.logEvent("WORKSPACE_ACCESSED", `Sessão temporária de QA iniciada: ${user.profile.fullName}`, "INFO", {
        user: user.profile.fullName
      });
    }
  }

  public getQaUserOverride(): PlatformUser | null {
    return this.qaUserOverride;
  }

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
    // Run cleanup migration first to eliminate legacy files
    try {
      IdentityCleanupMigration.run();
    } catch (e) {
      console.error("[IdentityEngine] Failed running cleanup migration:", e);
    }
    this.restoreSession();
  }

  public restoreSession(): AuthSession | null {
    if (typeof localStorage === "undefined") return null;
    try {
      const saved = localStorage.getItem("sauron_auth_session");
      if (saved) {
        const session: AuthSession = JSON.parse(saved);
        const user = userManager.getUser(session.userId);
        if (user) {
          localStorage.setItem(this.CURRENT_USER_KEY, user.id);
          localStorage.setItem(this.CURRENT_ORG_KEY, session.organizationId);
          if (session.workspaceIds.length > 0) {
            localStorage.setItem(this.CURRENT_WS_KEY, session.workspaceIds[0]);
          }
          return session;
        } else {
          this.logout();
        }
      }
    } catch (e) {
      console.error("[IdentityEngine] Failed to restore session:", e);
    }
    return null;
  }

  public login(email: string, password: string): PlatformUser | null {
    const user = userManager.getUserByEmail(email);
    if (!user) return null;

    const isValid = userManager.verifyPassword(user.id, password);
    if (!isValid) return null;

    if (typeof localStorage !== "undefined") {
      localStorage.setItem(this.CURRENT_USER_KEY, user.id);
      localStorage.setItem(this.CURRENT_ORG_KEY, user.organizationId);

      const visibleWS = accessControlEngine.getVisibleWorkspacesForUser(user);
      const wsIds = visibleWS.map(w => w.id);
      if (wsIds.length > 0) {
        localStorage.setItem(this.CURRENT_WS_KEY, wsIds[0]);
      } else {
        localStorage.removeItem(this.CURRENT_WS_KEY);
      }

      // Create session
      const session: AuthSession = {
        userId: user.id,
        role: user.role,
        organizationId: user.organizationId,
        workspaceIds: wsIds,
        companyIds: visibleWS.flatMap(w => w.companies),
        authenticatedAt: new Date().toISOString()
      };
      localStorage.setItem("sauron_auth_session", JSON.stringify(session));
    }

    auditEngine.logEvent("SESSÃO_INICIADA" as any, `Usuário autenticado com sucesso: ${user.profile.fullName} (${user.role})`, "INFO", {
      user: user.profile.fullName
    });

    return user;
  }

  public logout(): void {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(this.CURRENT_USER_KEY);
      localStorage.removeItem(this.CURRENT_ORG_KEY);
      localStorage.removeItem(this.CURRENT_WS_KEY);
      localStorage.removeItem("sauron_auth_session");
      localStorage.removeItem("sauron_user");
    }
    auditEngine.logEvent("SESSÃO_ENCERRADA" as any, `Sessão de usuário finalizada pelo logout.`, "INFO", {
      user: "System"
    });
  }

  public getAuthState(): "BOOTSTRAP" | "UNAUTHENTICATED" | "AUTHENTICATED" | "SESSION_EXPIRED" {
    const hasUsers = userManager.getUsers().length > 0;
    if (!hasUsers) {
      return "BOOTSTRAP";
    }

    let userId = "";
    if (typeof localStorage !== "undefined") {
      userId = localStorage.getItem(this.CURRENT_USER_KEY) || "";
    }

    if (!userId) {
      return "UNAUTHENTICATED";
    }

    const user = userManager.getUser(userId);
    if (!user) {
      return "SESSION_EXPIRED";
    }

    return "AUTHENTICATED";
  }

  public getCurrentUser(): PlatformUser | null {
    if (this.qaUserOverride) {
      return this.qaUserOverride;
    }
    let userId = "";
    if (typeof localStorage !== "undefined") {
      userId = localStorage.getItem(this.CURRENT_USER_KEY) || "";
    }
    const user = userManager.getUser(userId);
    if (!user) {
      return null;
    }
    return user;
  }

  public getCurrentOrganization(): Organization | null {
    const user = this.getCurrentUser();
    if (!user) return null;
    let orgId = user.organizationId;

    if (typeof localStorage !== "undefined") {
      orgId = localStorage.getItem(this.CURRENT_ORG_KEY) || user.organizationId;
    }

    const org = organizationManager.getOrganization(orgId);
    return org || null;
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
      throw new Error(`Usuário simulação não encontrado: ${userId}`);
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

      // Re-initialize session for simulation
      const session: AuthSession = {
        userId: user.id,
        role: user.role,
        organizationId: user.organizationId,
        workspaceIds: visibleWS.map(w => w.id),
        companyIds: visibleWS.flatMap(w => w.companies),
        authenticatedAt: new Date().toISOString()
      };
      localStorage.setItem("sauron_auth_session", JSON.stringify(session));
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
    if (!org) throw new Error("Organização não encontrada.");

    // Enforce membership check (except Super Admin)
    if (user.role !== "SUPER_ADMIN" && !org.members.includes(user.id)) {
      throw new Error("Usuário não pertence a esta organização.");
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
    if (!ws) throw new Error("Workspace não encontrado.");

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
    try {
      const user = this.getCurrentUser();
      return accessControlEngine.getVisibleWorkspacesForUser(user);
    } catch {
      return [];
    }
  }

  // List of organizations accessible by the current user
  public getVisibleOrganizations(): Organization[] {
    try {
      const user = this.getCurrentUser();
      const orgs = organizationManager.getOrganizations();
      if (user.role === "SUPER_ADMIN") {
        return orgs;
      }
      return orgs.filter(o => o.members.includes(user.id));
    } catch {
      return [];
    }
  }

  // --- CONSULTANT IMPERSONATION ENGINE (TEMPORARY AUDITED ACCESS) ---

  private IMPERSONATOR_USER_KEY = "sauron_identity_impersonator_user_id";

  /**
   * Performs consultant impersonation of a target user, recording the audit logs.
   */
  public impersonateUser(actorUserId: string, targetUserId: string, reason: string, durationMinutes: number): PlatformUser {
    const actor = userManager.getUser(actorUserId);
    if (!actor) {
      throw new Error(`Actor user with ID ${actorUserId} does not exist.`);
    }

    // Verify actor is authorized to impersonate (must be SUPER_ADMIN or CONSULTANT)
    const isAuthorized = ["SUPER_ADMIN", "CONSULTANT", "Super Admin", "Consultant Admin", "Consultant"].includes(actor.role);
    if (!isAuthorized) {
      throw new Error("Não autorizado: Apenas SUPER_ADMIN ou CONSULTANT podem iniciar impersonação.");
    }

    const target = userManager.getUser(targetUserId);
    if (!target) {
      throw new Error(`Target user with ID ${targetUserId} does not exist.`);
    }

    if (typeof localStorage !== "undefined") {
      localStorage.setItem(this.IMPERSONATOR_USER_KEY, actor.id);
      localStorage.setItem(this.CURRENT_USER_KEY, target.id);
      localStorage.setItem(this.CURRENT_ORG_KEY, target.organizationId);

      // Auto-assign first visible workspace for target
      const visibleWS = organizationManager.getWorkspaces().filter(ws =>
        accessControlEngine.can(target, "workspace.view", ws)
      );
      if (visibleWS.length > 0) {
        localStorage.setItem(this.CURRENT_WS_KEY, visibleWS[0].id);
      } else {
        localStorage.removeItem(this.CURRENT_WS_KEY);
      }
    }

    // Log the IMPERSONATION_STARTED audit event
    auditEngine.logEvent(
      "IMPERSONATION_STARTED" as any,
      `Consultor ${actor.profile.fullName} iniciou impersonação do usuário ${target.profile.fullName}. Motivo: ${reason}. Duração: ${durationMinutes} min.`,
      "WARNING",
      {
        actorUserId: actor.id,
        targetUserId: target.id,
        reason,
        durationMinutes,
        organizationId: target.organizationId
      }
    );

    return target;
  }

  /**
   * Stops active impersonation and restores the original actor's session.
   */
  public stopImpersonating(): PlatformUser {
    if (typeof localStorage === "undefined") {
      throw new Error("Ambiente local indisponível.");
    }

    const actorId = localStorage.getItem(this.IMPERSONATOR_USER_KEY);
    if (!actorId) {
      throw new Error("Nenhuma sessão de impersonação ativa.");
    }

    const actor = userManager.getUser(actorId);
    if (!actor) {
      throw new Error(`Consultor original ${actorId} não existe mais.`);
    }

    const currentUserId = localStorage.getItem(this.CURRENT_USER_KEY) || "";
    const targetUser = userManager.getUser(currentUserId);

    localStorage.removeItem(this.IMPERSONATOR_USER_KEY);
    localStorage.setItem(this.CURRENT_USER_KEY, actor.id);
    localStorage.setItem(this.CURRENT_ORG_KEY, actor.organizationId);

    // Auto-assign first visible workspace for actor
    const visibleWS = organizationManager.getWorkspaces().filter(ws =>
      accessControlEngine.can(actor, "workspace.view", ws)
    );
    if (visibleWS.length > 0) {
      localStorage.setItem(this.CURRENT_WS_KEY, visibleWS[0].id);
    } else {
      localStorage.removeItem(this.CURRENT_WS_KEY);
    }

    // Log the IMPERSONATION_ENDED audit event
    auditEngine.logEvent(
      "IMPERSONATION_ENDED" as any,
      `Impersonação encerrada. Restaurado acesso do consultor ${actor.profile.fullName} (estava acessando como ${targetUser?.profile.fullName || currentUserId}).`,
      "INFO",
      {
        actorUserId: actor.id,
        targetUserId: currentUserId,
        organizationId: actor.organizationId
      }
    );

    return actor;
  }

  /**
   * Check if the current session is an impersonated session
   */
  public isSessionImpersonated(): boolean {
    if (typeof localStorage !== "undefined") {
      return !!localStorage.getItem(this.IMPERSONATOR_USER_KEY);
    }
    return false;
  }

  /**
   * Retrieves the original actor user id if impersonation is active
   */
  public getImpersonatingActorId(): string | null {
    if (typeof localStorage !== "undefined") {
      return localStorage.getItem(this.IMPERSONATOR_USER_KEY);
    }
    return null;
  }
}

export const identityEngine = IdentityEngine.getInstance();
export default identityEngine;
