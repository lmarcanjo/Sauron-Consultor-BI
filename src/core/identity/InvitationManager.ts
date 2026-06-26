/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Invitation, Role, PermissionScope } from "./types";
import { userManager } from "./UserManager";
import { organizationManager } from "./OrganizationManager";
import { auditEngine } from "../audit/AuditEngine";

export class InvitationManager {
  private static instance: InvitationManager;
  private invitations: Invitation[] = [];

  private constructor() {
    this.loadFromStorage();
  }

  public static getInstance(): InvitationManager {
    if (!InvitationManager.instance) {
      InvitationManager.instance = new InvitationManager();
    }
    return InvitationManager.instance;
  }

  private loadFromStorage() {
    if (typeof localStorage !== "undefined") {
      try {
        const saved = localStorage.getItem("sauron_identity_invitations");
        if (saved) {
          this.invitations = JSON.parse(saved);
          this.checkExpirations();
          return;
        }
      } catch (e) {
        console.error("[InvitationManager] Error loading invitations:", e);
      }
    }
    this.seedDefaultInvitations();
  }

  private saveToStorage() {
    if (typeof localStorage !== "undefined") {
      try {
        localStorage.setItem("sauron_identity_invitations", JSON.stringify(this.invitations));
      } catch (e) {
        console.error("[InvitationManager] Error saving invitations:", e);
      }
    }
  }

  private seedDefaultInvitations() {
    const now = new Date();
    const future = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    
    this.invitations = [
      {
        id: "invite_1",
        email: "diretoria.topazio@mock.com",
        organizationId: "org_client_topazio",
        role: "Client Director",
        scope: "group",
        targetWorkspaceId: "ws_topazio",
        invitedBy: "user_consultant_admin",
        status: "pending",
        createdAt: now.toISOString(),
        expiresAt: future.toISOString()
      },
      {
        id: "invite_expired",
        email: "convidado.antigo@mock.com",
        organizationId: "org_client_topazio",
        role: "Guest",
        scope: "presentation",
        targetWorkspaceId: "ws_topazio",
        invitedBy: "user_consultant",
        status: "expired",
        createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    this.saveToStorage();
  }

  private checkExpirations() {
    let changed = false;
    const now = new Date().toISOString();
    this.invitations = this.invitations.map(invite => {
      if (invite.status === "pending" && invite.expiresAt < now) {
        changed = true;
        return { ...invite, status: "expired" };
      }
      return invite;
    });
    if (changed) this.saveToStorage();
  }

  public getInvitations(): Invitation[] {
    this.checkExpirations();
    return this.invitations;
  }

  public getInvitation(id: string): Invitation | undefined {
    return this.invitations.find(i => i.id === id);
  }

  public createInvitation(
    email: string,
    organizationId: string,
    role: Role,
    scope: PermissionScope,
    invitedBy: string,
    targetWorkspaceId?: string,
    durationDays: number = 7
  ): Invitation {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    const invite: Invitation = {
      id: `invite_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`,
      email,
      organizationId,
      role,
      scope,
      targetWorkspaceId,
      invitedBy,
      status: "pending",
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString()
    };

    this.invitations.push(invite);
    this.saveToStorage();

    auditEngine.logEvent("USER_INVITED", `Convite criado para ${email} com o papel de ${role} na Organização ${organizationId}`, "INFO", {
      user: invitedBy
    });

    return invite;
  }

  public cancelInvitation(id: string, cancelledBy: string): void {
    const invite = this.invitations.find(i => i.id === id);
    if (!invite) throw new Error("Invite not found");
    if (invite.status !== "pending") throw new Error("Only pending invites can be cancelled");

    invite.status = "cancelled";
    this.saveToStorage();

    auditEngine.logEvent("USER_ACCESS_REVOKED", `Convite para ${invite.email} foi cancelado`, "WARNING", {
      user: cancelledBy
    });
  }

  public acceptInvitation(id: string, acceptedByUserId: string): void {
    this.checkExpirations();
    const invite = this.invitations.find(i => i.id === id);
    if (!invite) throw new Error("Invite not found");
    if (invite.status !== "pending") throw new Error(`Cannot accept an invite that is ${invite.status}`);

    invite.status = "accepted";
    this.saveToStorage();

    // 1. Add user to the organization
    organizationManager.addMemberToOrganization(invite.organizationId, acceptedByUserId);

    // 2. Link Workspace policies if relevant
    if (invite.targetWorkspaceId) {
      const ws = organizationManager.getWorkspace(invite.targetWorkspaceId);
      if (ws) {
        if (!ws.allowedUsers.includes(acceptedByUserId)) {
          ws.allowedUsers.push(acceptedByUserId);
        }
        // Create an access policy for the user's role on the workspace
        ws.accessPolicies.push({
          id: `pol_${Date.now()}`,
          role: invite.role,
          permission: "workspace.view",
          scope: invite.scope,
          resourceId: invite.targetWorkspaceId
        });
        organizationManager.saveToStorage();
      }
    }

    // 3. Update User profile role & active organization
    userManager.updateUser(acceptedByUserId, {
      role: invite.role,
      organizationId: invite.organizationId
    });

    auditEngine.logEvent("USER_ACCESS_GRANTED", `Convite aceito por ${acceptedByUserId}. Vinculado à Organização ${invite.organizationId} como ${invite.role}`, "INFO", {
      user: acceptedByUserId
    });
  }

  public expireInvitation(id: string): void {
    const invite = this.invitations.find(i => i.id === id);
    if (invite && invite.status === "pending") {
      invite.status = "expired";
      this.saveToStorage();
    }
  }
}

export const invitationManager = InvitationManager.getInstance();
export default invitationManager;
