/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ShareLink, Permission } from "./types";
import { auditEngine } from "../audit/AuditEngine";

export class ShareLinkManager {
  private static instance: ShareLinkManager;
  private shareLinks: ShareLink[] = [];

  private constructor() {
    this.loadFromStorage();
  }

  public static getInstance(): ShareLinkManager {
    if (!ShareLinkManager.instance) {
      ShareLinkManager.instance = new ShareLinkManager();
    }
    return ShareLinkManager.instance;
  }

  private loadFromStorage() {
    if (typeof localStorage !== "undefined") {
      try {
        const saved = localStorage.getItem("sauron_identity_share_links");
        if (saved) {
          this.shareLinks = JSON.parse(saved);
          return;
        }
      } catch (e) {
        console.error("[ShareLinkManager] Error loading share links:", e);
      }
    }
    this.seedDefaultShareLinks();
  }

  private saveToStorage() {
    if (typeof localStorage !== "undefined") {
      try {
        localStorage.setItem("sauron_identity_share_links", JSON.stringify(this.shareLinks));
      } catch (e) {
        console.error("[ShareLinkManager] Error saving share links:", e);
      }
    }
  }

  private seedDefaultShareLinks() {
    const now = new Date();
    this.shareLinks = [
      {
        id: "share_1",
        resourceId: "pres_test_deck",
        resourceType: "presentation",
        permissions: ["presentation.view"],
        createdBy: "user_consultant",
        createdAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        readOnly: true,
        revoked: false,
        token: "tok_pres_active"
      },
      {
        id: "share_revoked",
        resourceId: "pres_test_deck",
        resourceType: "presentation",
        permissions: ["presentation.view"],
        createdBy: "user_consultant",
        createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        readOnly: true,
        revoked: true,
        token: "tok_pres_revoked"
      },
      {
        id: "share_expired",
        resourceId: "action_1",
        resourceType: "actionPlan",
        permissions: ["action.view"],
        createdBy: "user_consultant",
        createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), // expired yesterday
        readOnly: true,
        revoked: false,
        token: "tok_action_expired"
      }
    ];
    this.saveToStorage();
  }

  public getShareLinks(): ShareLink[] {
    return this.shareLinks;
  }

  public getShareLink(id: string): ShareLink | undefined {
    return this.shareLinks.find(s => s.id === id);
  }

  public getShareLinkByToken(token: string): ShareLink | undefined {
    return this.shareLinks.find(s => s.token === token);
  }

  public createShareLink(
    resourceId: string,
    resourceType: "presentation" | "report" | "meeting" | "actionPlan",
    createdBy: string,
    permissions: Permission[] = ["presentation.view"],
    durationHours: number = 24,
    readOnly: boolean = true
  ): ShareLink {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + durationHours * 60 * 60 * 1000);
    const token = `tok_${resourceType}_${crypto.randomUUID().substring(0, 12)}`;

    const link: ShareLink = {
      id: `share_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`,
      resourceId,
      resourceType,
      permissions,
      createdBy,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      readOnly,
      revoked: false,
      token
    };

    this.shareLinks.push(link);
    this.saveToStorage();

    auditEngine.logEvent("SHARE_LINK_CREATED", `Link temporário de compartilhamento criado para ${resourceType}:${resourceId}`, "INFO", {
      user: createdBy
    });

    return link;
  }

  public revokeShareLink(id: string, revokedBy: string): void {
    const link = this.shareLinks.find(s => s.id === id);
    if (!link) throw new Error("Share link not found");

    link.revoked = true;
    this.saveToStorage();

    auditEngine.logEvent("SHARE_LINK_REVOKED", `Link de compartilhamento de ${link.resourceType} revogado`, "WARNING", {
      user: revokedBy
    });
  }

  public validateShareLink(token: string): { isValid: boolean; error?: string; shareLink?: ShareLink } {
    const link = this.getShareLinkByToken(token);
    if (!link) {
      return { isValid: false, error: "Link de compartilhamento inexistente ou inválido." };
    }

    if (link.revoked) {
      return { isValid: false, error: "Link de compartilhamento revogado pelo administrador." };
    }

    const now = new Date().toISOString();
    if (link.expiresAt < now) {
      return { isValid: false, error: "Link de compartilhamento expirou." };
    }

    return { isValid: true, shareLink: link };
  }
}

export const shareLinkManager = ShareLinkManager.getInstance();
export default shareLinkManager;
