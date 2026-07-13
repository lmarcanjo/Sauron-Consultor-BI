/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Organization, Workspace, Team, AccessPolicy } from "./types";
import { auditEngine } from "../audit/AuditEngine";

export class OrganizationManager {
  private static instance: OrganizationManager;
  private organizations: Organization[] = [];
  private workspaces: Workspace[] = [];
  private teams: Team[] = [];

  private constructor() {
    this.loadFromStorage();
  }

  public static getInstance(): OrganizationManager {
    if (!OrganizationManager.instance) {
      OrganizationManager.instance = new OrganizationManager();
    }
    return OrganizationManager.instance;
  }

  private loadFromStorage() {
    if (typeof localStorage !== "undefined") {
      try {
        const savedOrgs = localStorage.getItem("sauron_identity_organizations");
        const savedWS = localStorage.getItem("sauron_identity_workspaces");
        const savedTeams = localStorage.getItem("sauron_identity_teams");

        if (savedOrgs && savedWS && savedTeams) {
          this.organizations = JSON.parse(savedOrgs);
          this.workspaces = JSON.parse(savedWS);
          this.teams = JSON.parse(savedTeams);
          return;
        }
      } catch (e) {
        console.error("[OrganizationManager] Error loading organization details:", e);
      }
    }
    this.organizations = [];
    this.workspaces = [];
    this.teams = [];
    this.saveToStorage();
  }

  public saveToStorage() {
    if (typeof localStorage !== "undefined") {
      try {
        localStorage.setItem("sauron_identity_organizations", JSON.stringify(this.organizations));
        localStorage.setItem("sauron_identity_workspaces", JSON.stringify(this.workspaces));
        localStorage.setItem("sauron_identity_teams", JSON.stringify(this.teams));
      } catch (e) {
        console.error("[OrganizationManager] Error saving organization details:", e);
      }
    }
  }

  public getOrganizations(): Organization[] {
    return this.organizations;
  }

  public getOrganization(id: string): Organization | undefined {
    return this.organizations.find(o => o.id === id);
  }

  public getWorkspaces(): Workspace[] {
    return this.workspaces;
  }

  public getWorkspace(id: string): Workspace | undefined {
    return this.workspaces.find(w => w.id === id);
  }

  public getTeams(): Team[] {
    return this.teams;
  }

  public createOrganization(org: Omit<Organization, "createdAt" | "updatedAt">): Organization {
    const now = new Date().toISOString();
    const newOrg: Organization = {
      ...org,
      createdAt: now,
      updatedAt: now
    };
    this.organizations.push(newOrg);
    this.saveToStorage();

    auditEngine.logEvent("USER_ACCESS_GRANTED", `Nova Organização criada: ${newOrg.name}`, "INFO", {
      user: "System"
    });

    return newOrg;
  }

  public createWorkspace(ws: Omit<Workspace, "createdAt" | "updatedAt">): Workspace {
    const now = new Date().toISOString();
    const newWS: Workspace = {
      ...ws,
      createdAt: now,
      updatedAt: now
    };
    this.workspaces.push(newWS);
    this.saveToStorage();

    // Link workspace in parent organization
    const org = this.organizations.find(o => o.id === newWS.organizationId);
    if (org) {
      if (!org.workspaces.includes(newWS.id)) {
        org.workspaces.push(newWS.id);
        org.updatedAt = now;
      }
    }
    this.saveToStorage();

    auditEngine.logEvent("USER_ACCESS_GRANTED", `Novo Workspace criado: ${newWS.name}`, "INFO", {
      user: "System"
    });

    return newWS;
  }

  public updateWorkspace(id: string, updates: Partial<Omit<Workspace, "id" | "createdAt" | "updatedAt">>): Workspace {
    const index = this.workspaces.findIndex(w => w.id === id);
    if (index === -1) {
      throw new Error(`Workspace with ID ${id} not found.`);
    }
    const current = this.workspaces[index];
    const updated: Workspace = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.workspaces[index] = updated;
    this.saveToStorage();
    return updated;
  }

  public addMemberToOrganization(orgId: string, userId: string) {
    const org = this.organizations.find(o => o.id === orgId);
    if (org) {
      if (!org.members.includes(userId)) {
        org.members.push(userId);
        org.updatedAt = new Date().toISOString();
        this.saveToStorage();
        auditEngine.logEvent("USER_ACCESS_GRANTED", `Usuário ${userId} adicionado à organização ${org.name}`, "INFO", {
          user: "System"
        });
      }
    }
  }

  public removeMemberFromOrganization(orgId: string, userId: string) {
    const org = this.organizations.find(o => o.id === orgId);
    if (org) {
      org.members = org.members.filter(id => id !== userId);
      org.updatedAt = new Date().toISOString();
      this.saveToStorage();
      auditEngine.logEvent("USER_ACCESS_REVOKED", `Usuário ${userId} removido da organização ${org.name}`, "WARNING", {
        user: "System"
      });
    }
  }

  // Helper method for test environment to inject seeds dynamically
  public injectTestStructure(orgs: Organization[], ws: Workspace[], teams: Team[]): void {
    this.organizations = [...orgs];
    this.workspaces = [...ws];
    this.teams = [...teams];
    this.saveToStorage();
  }
}

export const organizationManager = OrganizationManager.getInstance();
export default organizationManager;
