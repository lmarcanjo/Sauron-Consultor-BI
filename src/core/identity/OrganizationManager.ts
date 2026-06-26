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
    this.seedDefaultStructure();
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

  private seedDefaultStructure() {
    const now = new Date().toISOString();

    // 1. Teams
    this.teams = [
      {
        id: "team_consultores",
        organizationId: "org_arcanjo",
        name: "Consultores Juniores & Seniores",
        members: ["user_super_admin", "user_consultant_admin", "user_consultant"],
        createdAt: now
      },
      {
        id: "team_diretores",
        organizationId: "org_client_topazio",
        name: "Conselho Diretor",
        members: ["user_super_admin", "user_client_director", "user_controller"],
        createdAt: now
      },
      {
        id: "team_operacao",
        organizationId: "org_client_topazio",
        name: "Time de Finanças & Operações",
        members: ["user_client_manager", "user_financial"],
        createdAt: now
      }
    ];

    // 2. Default Access Policies for Workspace (seeded defaults)
    const defaultPolicies: AccessPolicy[] = [
      { id: "p1", role: "Super Admin", permission: "workspace.view", scope: "global" },
      { id: "p2", role: "Super Admin", permission: "workspace.manage", scope: "global" },
      { id: "p3", role: "Consultant Admin", permission: "workspace.view", scope: "organization" },
      { id: "p4", role: "Consultant Admin", permission: "workspace.manage", scope: "organization" },
      { id: "p5", role: "Consultant", permission: "workspace.view", scope: "workspace" },
      { id: "p6", role: "Consultant", permission: "data.view", scope: "workspace" },
      { id: "p7", role: "Consultant", permission: "data.import", scope: "workspace" },
      { id: "p8", role: "Consultant", permission: "analytics.view", scope: "workspace" },
      { id: "p9", role: "Client Director", permission: "workspace.view", scope: "group" },
      { id: "p10", role: "Client Director", permission: "analytics.view", scope: "group" },
      { id: "p11", role: "Client Manager", permission: "workspace.view", scope: "store", resourceId: "Loja Nissan Feira" },
      { id: "p12", role: "Client Manager", permission: "data.view", scope: "store", resourceId: "Loja Nissan Feira" },
      { id: "p13", role: "Financial User", permission: "data.view", scope: "costCenter", resourceId: "Administração" },
      { id: "p14", role: "Financial User", permission: "data.import", scope: "costCenter", resourceId: "Administração" },
      { id: "p15", role: "Auditor", permission: "audit.view", scope: "workspace" },
      { id: "p16", role: "Viewer", permission: "workspace.view", scope: "workspace" },
      { id: "p17", role: "Guest", permission: "presentation.view", scope: "presentation" }
    ];

    // 3. Workspaces
    this.workspaces = [
      {
        id: "ws_topazio",
        name: "Workspace Grupo Topázio",
        organizationId: "org_client_topazio",
        clientId: "client_1",
        groupId: "group_topazio",
        companies: ["Grupo Topázio", "Empresa Real", "Loja Nissan Feira"],
        brands: ["Nissan", "Fiat"],
        stores: ["Loja Nissan Feira", "Loja Fiat Centro"],
        costCenters: ["Veículos Novos", "Peças", "Oficina", "F&I/FNA", "Acessórios", "Administração"],
        allowedUsers: [
          "user_super_admin",
          "user_consultant_admin",
          "user_consultant",
          "user_client_director",
          "user_client_manager",
          "user_financial",
          "user_controller",
          "user_auditor",
          "user_viewer"
        ],
        allowedTeams: ["team_consultores", "team_diretores", "team_operacao"],
        accessPolicies: defaultPolicies,
        dataSources: ["ERP_PROD_SQL", "Planilha_Sincronizada.xlsx"],
        presentations: ["pres_test_deck"],
        meetings: [],
        actionPlans: [],
        auditTrail: [],
        createdAt: now,
        updatedAt: now
      },
      {
        id: "ws_arcanjo_internal",
        name: "Planejamento Arcanjo S/A",
        organizationId: "org_arcanjo",
        clientId: "client_arcanjo",
        companies: ["Arcanjo Holding"],
        brands: ["Arcanjo"],
        stores: ["Matriz Salvador"],
        costCenters: ["Marketing", "Tech", "Consultoria Geral"],
        allowedUsers: ["user_super_admin", "user_consultant_admin", "user_consultant"],
        allowedTeams: ["team_consultores"],
        accessPolicies: defaultPolicies.filter(p => p.role.includes("Admin") || p.role === "Consultant" || p.role === "Super Admin"),
        dataSources: ["Internal_Billing_Sheets"],
        presentations: [],
        meetings: [],
        actionPlans: [],
        auditTrail: [],
        createdAt: now,
        updatedAt: now
      }
    ];

    // 4. Organizations
    this.organizations = [
      {
        id: "org_arcanjo",
        name: "Consultoria Arcanjo",
        type: "consulting_firm",
        ownerUserId: "user_consultant_admin",
        members: ["user_super_admin", "user_consultant_admin", "user_consultant"],
        teams: ["team_consultores"],
        workspaces: ["ws_arcanjo_internal", "ws_topazio"],
        createdAt: now,
        updatedAt: now
      },
      {
        id: "org_client_topazio",
        name: "Grupo Topázio",
        type: "client_group",
        ownerUserId: "user_client_director",
        members: [
          "user_super_admin",
          "user_client_director",
          "user_client_manager",
          "user_financial",
          "user_controller",
          "user_auditor",
          "user_viewer",
          "user_guest"
        ],
        teams: ["team_diretores", "team_operacao"],
        workspaces: ["ws_topazio"],
        createdAt: now,
        updatedAt: now
      }
    ];

    this.saveToStorage();
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
}

export const organizationManager = OrganizationManager.getInstance();
