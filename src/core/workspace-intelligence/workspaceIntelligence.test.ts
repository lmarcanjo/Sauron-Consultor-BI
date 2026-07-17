/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeAll, beforeEach } from "vitest";

// Polyfill localStorage in test environment
beforeAll(() => {
  if (typeof globalThis.localStorage === "undefined") {
    const store = new Map<string, string>();
    globalThis.localStorage = {
      getItem: (key: string) => store.get(key) || null,
      setItem: (key: string, value: string) => { store.set(key, value); },
      removeItem: (key: string) => { store.delete(key); },
      clear: () => { store.clear(); },
      key: (index: number) => Array.from(store.keys())[index] || null,
      length: store.size,
    } as any;
  }
});

import { workspaceIntelligenceEngine } from "./WorkspaceIntelligenceEngine";
import { userManager } from "../identity/UserManager";
import { organizationManager } from "../identity/OrganizationManager";
import { PlatformUser, Organization, Workspace } from "../identity/types";

describe("Sauron Sprint ΩΩΩ — Workspace Intelligence Engine Tests Suite", () => {
  const now = "2026-07-14T00:00:00.000Z";
  const testUser: PlatformUser = {
    id: "user_super_admin",
    profile: {
      id: "user_super_admin",
      fullName: "Usuário Teste",
      email: "usuario.teste@sauron.local",
      avatarUrl: "",
    },
    role: "Super Admin",
    organizationId: "org_arcanjo",
    createdAt: now,
    updatedAt: now,
  };
  const testOrganization: Organization = {
    id: "org_arcanjo",
    name: "Organização Teste",
    type: "consulting_firm",
    ownerUserId: testUser.id,
    members: [testUser.id],
    teams: [],
    workspaces: ["workspace_certification"],
    createdAt: now,
    updatedAt: now,
  };
  const testWorkspace: Workspace = {
    id: "workspace_certification",
    name: "Workspace Teste",
    organizationId: testOrganization.id,
    clientId: "client_test",
    companies: [],
    brands: [],
    stores: [],
    costCenters: [],
    allowedUsers: [testUser.id],
    allowedTeams: [],
    accessPolicies: [],
    dataSources: [],
    presentations: [],
    meetings: [],
    actionPlans: [],
    auditTrail: [],
    createdAt: now,
    updatedAt: now,
  };

  beforeEach(() => {
    localStorage.clear();
    userManager.injectTestUsers([testUser]);
    organizationManager.injectTestStructure([testOrganization], [testWorkspace], []);
    localStorage.setItem("sauron_identity_current_user_id", testUser.id);
    localStorage.setItem("sauron_identity_current_org_id", testOrganization.id);
    localStorage.setItem("sauron_identity_current_ws_id", testWorkspace.id);
    localStorage.setItem("sauron_auth_session", JSON.stringify({
      userId: testUser.id,
      role: testUser.role,
      organizationId: testOrganization.id,
      workspaceIds: [testWorkspace.id],
      companyIds: [],
      authenticatedAt: now,
    }));
  });
  
  it("creates and initializes a valid WorkspaceContext", async () => {
    // Bootstrap defaults
    const activeFilters = { marcas: ["Nissan"] };
    const context = await workspaceIntelligenceEngine.initializeDefaultContext("SPREADSHEET_DATA", activeFilters);
    
    expect(context).toBeDefined();
    expect(context.currentUser).toBeDefined();
    expect(context.currentUser.id).toBe("user_super_admin");
    expect(context.dataMode).toBe("real");
    expect(context.filtrosAtivos.marcas).toContain("Nissan");
  });

  it("updates the context when selecting an organization or case", async () => {
    const context = await workspaceIntelligenceEngine.initializeDefaultContext("SPREADSHEET_DATA", {});
    
    // Switch case project
    workspaceIntelligenceEngine.switchCase("case_real", "Caso Cliente Real");
    const updated = workspaceIntelligenceEngine.contextManager.getContext();
    
    expect(updated).not.toBeNull();
    expect(updated?.currentCase?.id).toBe("case_real");
    expect(updated?.currentCase?.name).toBe("Caso Cliente Real");
  });

  it("updates the context and scopes access when selecting a company entity", async () => {
    await workspaceIntelligenceEngine.initializeDefaultContext("SPREADSHEET_DATA", {});
    
    // Switch to Nissan company
    workspaceIntelligenceEngine.switchEntity({
      id: "company_alpha_nissan",
      type: "company",
      name: "Alpha Nissan"
    });
    
    const context = workspaceIntelligenceEngine.contextManager.getContext();
    expect(context?.entidadeSelecionada?.type).toBe("company");
    expect(context?.entidadeSelecionada?.name).toBe("Alpha Nissan");
    expect(context?.empresa).toBe("Alpha Nissan");
  });

  it("updates the context and scopes access when selecting a seller/vendedor placeholder", async () => {
    await workspaceIntelligenceEngine.initializeDefaultContext("SPREADSHEET_DATA", {});
    
    // Switch to seller placeholder Carlos Silva
    workspaceIntelligenceEngine.switchEntity({
      id: "vendedor_1",
      type: "vendedor",
      name: "Carlos Silva",
      metadata: { role: "Consultor Alta Performance", store: "Alpha Nissan Feira" }
    });
    
    const context = workspaceIntelligenceEngine.contextManager.getContext();
    expect(context?.vendedor).not.toBeNull();
    expect(context?.vendedor?.id).toBe("vendedor_1");
    expect(context?.vendedor?.name).toBe("Carlos Silva");
    expect(context?.loja).toBe("Alpha Nissan Feira");
  });

  it("generates correct navigation tabs based on context selected entity", async () => {
    await workspaceIntelligenceEngine.initializeDefaultContext("SPREADSHEET_DATA", {});
    
    // Company selection
    workspaceIntelligenceEngine.switchEntity({
      id: "company_alpha_nissan",
      type: "company",
      name: "Alpha Nissan"
    });
    
    let context = workspaceIntelligenceEngine.contextManager.getContext()!;
    let tabs = workspaceIntelligenceEngine.tabs.getTabsForContext(context);
    expect(tabs.some(t => t.id === "financeiro")).toBe(true);

    // Vendedor selection
    workspaceIntelligenceEngine.switchEntity({
      id: "vendedor_1",
      type: "vendedor",
      name: "Carlos Silva"
    });
    
    context = workspaceIntelligenceEngine.contextManager.getContext()!;
    tabs = workspaceIntelligenceEngine.tabs.getTabsForContext(context);
    expect(tabs.some(t => t.id === "vendedor_performance")).toBe(true);
  });

  it("calculates secure contextual action items for Unified Create Menu based on role permissions", async () => {
    // Lennon Marcanjo is Super Admin (has all default permissions)
    const context = await workspaceIntelligenceEngine.initializeDefaultContext("SPREADSHEET_DATA", {});
    const actions = workspaceIntelligenceEngine.actions.getActionsForContext(context);
    
    expect(actions.length).toBeGreaterThan(0);
    expect(actions.some(a => a.actionType === "create_case")).toBe(true);
  });

  it("filters context-driven activity feeds accordingly", async () => {
    const context = await workspaceIntelligenceEngine.initializeDefaultContext("SPREADSHEET_DATA", {});
    
    // Log an activity
    workspaceIntelligenceEngine.activities.logActivity(
      "Dossiê Exportado",
      "Dossiê do colaborador Carlos Silva exportado com sucesso.",
      "dossier_generated",
      "Lennon Marcanjo",
      { orgId: "org_arcanjo", vendedorId: "vendedor_1" }
    );

    // Filter by vendedor selected context
    workspaceIntelligenceEngine.switchEntity({
      id: "vendedor_1",
      type: "vendedor",
      name: "Carlos Silva"
    });
    
    const updatedContext = workspaceIntelligenceEngine.contextManager.getContext()!;
    const filtered = workspaceIntelligenceEngine.activities.getFilteredActivities(updatedContext);
    
    expect(filtered.some(a => a.category === "dossier_generated")).toBe(true);
  });
});
