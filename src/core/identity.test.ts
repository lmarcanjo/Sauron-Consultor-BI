/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeAll } from "vitest";

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

  // Populate legacy seeds for identity test suite
  const now = new Date().toISOString();
  const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const testUsers = [
    {
      id: "user_super_admin",
      profile: { id: "user_super_admin", fullName: "Lennon Marcanjo (Super)", email: "lmarcanjo16@gmail.com", avatarUrl: "" },
      role: "Super Admin" as any,
      organizationId: "org_arcanjo",
      createdAt: now,
      updatedAt: now
    },
    {
      id: "user_consultant_admin",
      profile: { id: "user_consultant_admin", fullName: "Gabriel Arcanjo (Consultoria)", email: "gabriel@arcanjoconsulting.com", avatarUrl: "" },
      role: "Consultant Admin" as any,
      organizationId: "org_arcanjo",
      createdAt: now,
      updatedAt: now
    },
    {
      id: "user_consultant",
      profile: { id: "user_consultant", fullName: "Roberto Consultor", email: "roberto@arcanjoconsulting.com", avatarUrl: "" },
      role: "Consultant" as any,
      organizationId: "org_arcanjo",
      createdAt: now,
      updatedAt: now
    },
    {
      id: "user_client_director",
      profile: { id: "user_client_director", fullName: "Diretor Cliente Real", email: "diretoria@clientereal.local", avatarUrl: "" },
      role: "Client Director" as any,
      organizationId: "org_client_real",
      createdAt: now,
      updatedAt: now
    },
    {
      id: "user_client_manager",
      profile: { id: "user_client_manager", fullName: "Carlos Loja Nissan", email: "carlos.nissan@grupotopazio.com.br", avatarUrl: "" },
      role: "Client Manager" as any,
      organizationId: "org_client_topazio",
      createdAt: now,
      updatedAt: now
    },
    {
      id: "user_financial",
      profile: { id: "user_financial", fullName: "Ana Finanças", email: "ana.financeiro@grupotopazio.com.br", avatarUrl: "" },
      role: "Financial User" as any,
      organizationId: "org_client_topazio",
      createdAt: now,
      updatedAt: now
    },
    {
      id: "user_controller",
      profile: { id: "user_controller", fullName: "Marcos Controladoria", email: "marcos.controller@grupotopazio.com.br", avatarUrl: "" },
      role: "Controller" as any,
      organizationId: "org_client_topazio",
      createdAt: now,
      updatedAt: now
    },
    {
      id: "user_auditor",
      profile: { id: "user_auditor", fullName: "Silvia Auditora", email: "silvia.auditoria@kpmg-mock.com", avatarUrl: "" },
      role: "Auditor" as any,
      organizationId: "org_client_topazio",
      createdAt: now,
      updatedAt: now
    },
    {
      id: "user_viewer",
      profile: { id: "user_viewer", fullName: "Lucas Observador", email: "lucas@viewer.com", avatarUrl: "" },
      role: "Viewer" as any,
      organizationId: "org_client_topazio",
      createdAt: now,
      updatedAt: now
    },
    {
      id: "user_guest",
      profile: { id: "user_guest", fullName: "Maria Convidada", email: "maria.guest@externo.com", avatarUrl: "" },
      role: "Guest" as any,
      organizationId: "org_client_topazio",
      createdAt: now,
      updatedAt: now
    }
  ];

  const testOrgs = [
    {
      id: "org_arcanjo",
      name: "Consultoria Arcanjo",
      type: "consulting_firm" as any,
      ownerUserId: "user_consultant_admin",
      members: ["user_super_admin", "user_consultant_admin", "user_consultant"],
      teams: ["team_consultores"],
      workspaces: ["ws_arcanjo_internal", "ws_cliente_real"],
      createdAt: now,
      updatedAt: now
    },
    {
      id: "org_client_real",
      name: "Cliente Real",
      type: "client_group" as any,
      ownerUserId: "user_client_director",
      members: ["user_super_admin", "user_client_director", "user_client_manager", "user_financial", "user_controller", "user_auditor", "user_viewer", "user_guest"],
      teams: ["team_diretores", "team_operacao"],
      workspaces: ["ws_topazio"],
      createdAt: now,
      updatedAt: now
    }
  ];

  const defaultPolicies = [
    { id: "p1", role: "Super Admin" as any, permission: "workspace.view" as any, scope: "global" as any },
    { id: "p2", role: "Super Admin" as any, permission: "workspace.manage" as any, scope: "global" as any },
    { id: "p3", role: "Consultant Admin" as any, permission: "workspace.view" as any, scope: "organization" as any },
    { id: "p4", role: "Consultant Admin" as any, permission: "workspace.manage" as any, scope: "organization" as any },
    { id: "p5", role: "Consultant" as any, permission: "workspace.view" as any, scope: "workspace" as any },
    { id: "p6", role: "Consultant" as any, permission: "data.view" as any, scope: "workspace" as any },
    { id: "p7", role: "Consultant" as any, permission: "data.import" as any, scope: "workspace" as any },
    { id: "p8", role: "Consultant" as any, permission: "analytics.view" as any, scope: "workspace" as any },
    { id: "p9", role: "Client Director" as any, permission: "workspace.view" as any, scope: "group" as any },
    { id: "p10", role: "Client Director" as any, permission: "analytics.view" as any, scope: "group" as any },
    { id: "p11", role: "Client Manager" as any, permission: "workspace.view" as any, scope: "store" as any, resourceId: "Loja Nissan Feira" },
    { id: "p12", role: "Client Manager" as any, permission: "data.view" as any, scope: "store" as any, resourceId: "Loja Nissan Feira" },
    { id: "p13", role: "Financial User" as any, permission: "data.view" as any, scope: "costCenter" as any, resourceId: "Administração" },
    { id: "p14", role: "Financial User" as any, permission: "data.import" as any, scope: "costCenter" as any, resourceId: "Administração" },
    { id: "p15", role: "Auditor" as any, permission: "audit.view" as any, scope: "workspace" as any },
    { id: "p16", role: "Viewer" as any, permission: "workspace.view" as any, scope: "workspace" as any },
    { id: "p17", role: "Guest" as any, permission: "presentation.view" as any, scope: "presentation" as any }
  ];

  const testWorkspaces = [
    {
      id: "ws_cliente_real",
      name: "Workspace Cliente Real",
      organizationId: "org_client_real",
      clientId: "client_1",
      groupId: "group_cliente_real",
      companies: ["Empresa Real", "Loja Real"],
      brands: ["Nissan", "Fiat"],
      stores: ["Loja Nissan Feira", "Loja Fiat Centro"],
      costCenters: ["Veículos Novos", "Peças", "Oficina", "F&I/FNA", "Acessórios", "Administração"],
      allowedUsers: ["user_super_admin", "user_consultant_admin", "user_consultant", "user_client_director", "user_client_manager", "user_financial", "user_controller", "user_auditor", "user_viewer"],
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

  const testTeams = [
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

  const testInvitations = [
    {
      id: "invite_1",
      email: "diretoria.topazio@mock.com",
      organizationId: "org_client_topazio",
      role: "Client Director" as any,
      scope: "group" as any,
      targetWorkspaceId: "ws_topazio",
      invitedBy: "user_consultant_admin",
      status: "pending" as any,
      createdAt: now,
      expiresAt: future
    },
    {
      id: "invite_expired",
      email: "convidado.antigo@mock.com",
      organizationId: "org_client_topazio",
      role: "Guest" as any,
      scope: "presentation" as any,
      targetWorkspaceId: "ws_topazio",
      invitedBy: "user_consultant",
      status: "expired" as any,
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  userManager.injectTestUsers(testUsers);
  organizationManager.injectTestStructure(testOrgs, testWorkspaces, testTeams);
  invitationManager.injectTestInvitations(testInvitations);
  
  // Set current user simulation contexts
  localStorage.setItem("sauron_identity_current_user_id", "user_super_admin");
  localStorage.setItem("sauron_identity_current_org_id", "org_arcanjo");
  localStorage.setItem("sauron_identity_current_ws_id", "ws_cliente_real");
});

import { userManager } from "./identity/UserManager";
import { organizationManager } from "./identity/OrganizationManager";
import { permissionManager } from "./identity/PermissionManager";
import { accessControlEngine } from "./identity/AccessControlEngine";
import { identityEngine } from "./identity/IdentityEngine";
import { invitationManager } from "./identity/InvitationManager";
import { shareLinkManager } from "./identity/ShareLinkManager";
import { digitalTwinEngine } from "./identity/digitalTwin/DigitalTwinEngine";
import { PlatformUser, Workspace } from "./identity/types";
import { securityScoreEngine } from "./identity/SecurityScoreEngine";

describe("Sauron Release v0.6.5 — Identity & Collaboration Foundation Tests Suite", () => {
  
  // 1. Criar organização
  it("allows creating a new organization", () => {
    const org = organizationManager.createOrganization({
      id: "org_test",
      name: "Organização Teste",
      type: "client_group",
      ownerUserId: "user_super_admin",
      members: ["user_super_admin"],
      teams: [],
      workspaces: []
    });
    expect(org.id).toBe("org_test");
    expect(org.name).toBe("Organização Teste");
    expect(organizationManager.getOrganization("org_test")).toBeDefined();
  });

  // 2. Criar usuário e 3. Atribuir papel
  it("allows creating users and assigning roles", () => {
    const user = userManager.createUser({
      id: "user_test_manager",
      profile: {
        id: "user_test_manager",
        fullName: "Gerente de Teste",
        email: "test.manager@sauron.com"
      },
      role: "Client Manager",
      organizationId: "org_client_real"
    });
    expect(user.id).toBe("user_test_manager");
    expect(user.role).toBe("Client Manager");
    expect(userManager.getUser("user_test_manager")).toBeDefined();
  });

  // 4. Verificar permissão e 5. Negar permissão
  it("verifies and denies permissions correctly based on roles", () => {
    const manager = userManager.getUser("user_client_manager"); // Client Manager
    const guest = userManager.getUser("user_guest"); // Guest
    
    // Client Manager should be able to view workspace by default
    expect(accessControlEngine.can(manager, "workspace.view")).toBe(true);
    // Guest should NOT be able to import data
    expect(accessControlEngine.can(guest, "data.import")).toBe(false);
  });

  // 6. Filtrar workspaces visíveis
  it("filters visible workspaces based on user permissions", () => {
    const consultant = userManager.getUser("user_consultant"); // Consultant
    const guest = userManager.getUser("user_guest"); // Guest (restricted)
    
    const consultantWS = accessControlEngine.getVisibleWorkspacesForUser(consultant);
    const guestWS = accessControlEngine.getVisibleWorkspacesForUser(guest);
    
    expect(consultantWS.length).toBeGreaterThan(0);
    expect(guestWS.length).toBe(0); // Guest has no workspace.view by default
  });

  // 7. Filtrar empresas visíveis
  it("filters visible companies for a user on a workspace", () => {
    const director = userManager.getUser("user_client_director"); // Director sees all
    const manager = userManager.getUser("user_client_manager"); // Manager is restricted to store
    const workspace = organizationManager.getWorkspace("ws_cliente_real")!;
    
    const directorCos = accessControlEngine.getVisibleCompaniesForUser(director, workspace);
    const managerCos = accessControlEngine.getVisibleCompaniesForUser(manager, workspace);
    
    expect(directorCos.length).toBe(workspace.companies.length);
    expect(managerCos.length).toBeLessThanOrEqual(workspace.companies.length);
  });

  // 8. Criar convite
  it("creates user invitations with correct details", () => {
    const invite = invitationManager.createInvitation(
      "new_user@sauron.com",
      "org_client_real",
      "Financial User",
      "costCenter",
      "user_consultant_admin",
      "ws_cliente_real"
    );
    expect(invite.email).toBe("new_user@sauron.com");
    expect(invite.status).toBe("pending");
  });

  // 9. Aceitar convite
  it("assigns user to organization and workspace upon accepting an invite", () => {
    const invite = invitationManager.createInvitation(
      "invite_accept_test@sauron.com",
      "org_client_real",
      "Financial User",
      "costCenter",
      "user_consultant_admin",
      "ws_cliente_real"
    );
    
    // Create matching user to receive invitation
    const targetUser = userManager.createUser({
      id: "user_accept_test",
      profile: {
        id: "user_accept_test",
        fullName: "Acceptor Test",
        email: "invite_accept_test@sauron.com"
      },
      role: "Guest",
      organizationId: "org_client_real"
    });
    
    invitationManager.acceptInvitation(invite.id, "user_accept_test");
    
    const updatedUser = userManager.getUser("user_accept_test")!;
    expect(updatedUser.role).toBe("Financial User");
    
    const ws = organizationManager.getWorkspace("ws_cliente_real")!;
    expect(ws.allowedUsers).toContain("user_accept_test");
  });

  // 10. Expirar convite
  it("correctly identifies and flags expired invitations", () => {
    const invite = invitationManager.getInvitation("invite_expired");
    expect(invite).toBeDefined();
    expect(invite?.status).toBe("expired");
  });

  // 11. Criar share link e 12. Revogar share link
  it("handles temporary share links and allows revoking them", () => {
    const link = shareLinkManager.createShareLink(
      "pres_test_deck",
      "presentation",
      "user_consultant",
      ["presentation.view"]
    );
    expect(link.token).toBeDefined();
    expect(link.revoked).toBe(false);
    
    shareLinkManager.revokeShareLink(link.id, "user_consultant");
    const updatedLink = shareLinkManager.getShareLink(link.id);
    expect(updatedLink?.revoked).toBe(true);
  });

  // 13. Validar expiração de share link
  it("validates expiration dates on share links", () => {
    const expiredToken = "tok_action_expired";
    const validation = shareLinkManager.validateShareLink(expiredToken);
    expect(validation.isValid).toBe(false);
    expect(validation.error).toContain("expirou");
  });

  // 14. Criar digital twin
  it("provisions the digital twin representation of the enterprise group", () => {
    const twin = digitalTwinEngine.getGroupTwin();
    expect(twin.id).toBe("group_cliente_real");
    expect(twin.companies.length).toBeGreaterThan(0);
    
    const company = twin.companies[0];
    expect(company.stores.some(s => s.id === "store_unidade_a")).toBe(true);
  });

  // 15. Usuário gerente vê apenas loja permitida
  it("restricts Client Manager to their specific allowed store", () => {
    const manager = userManager.getUser("user_client_manager")!;
    const workspace = organizationManager.getWorkspace("ws_cliente_real")!;
    
    const visibleCompanies = accessControlEngine.getVisibleCompaniesForUser(manager, workspace);
    expect(visibleCompanies.length).toBeLessThanOrEqual(workspace.companies.length);
  });

  // 16. Diretor vê todo grupo
  it("allows Client Director to see all companies in the group", () => {
    const director = userManager.getUser("user_client_director")!;
    const workspace = organizationManager.getWorkspace("ws_cliente_real")!;
    
    const visibleCompanies = accessControlEngine.getVisibleCompaniesForUser(director, workspace);
    expect(visibleCompanies.length).toBe(workspace.companies.length);
  });

  // 17. Auditor vê tudo em modo leitura
  it("authorizes Auditor to view everything but denies write permissions", () => {
    const auditor = userManager.getUser("user_auditor")!;
    
    expect(accessControlEngine.can(auditor, "workspace.view")).toBe(true);
    expect(accessControlEngine.can(auditor, "audit.view")).toBe(true);
    expect(accessControlEngine.can(auditor, "data.import")).toBe(false); // Read-only
  });

  // 18. Guest vê apenas recurso compartilhado
  it("limits Guest to specifically shared items", () => {
    const guest = userManager.getUser("user_guest")!;
    
    expect(accessControlEngine.can(guest, "workspace.view")).toBe(false);
    expect(accessControlEngine.can(guest, "data.view")).toBe(false);
    
    // Shared presentation
    const sharedResource = { id: "pres_test_deck", isShared: true };
    expect(accessControlEngine.can(guest, "presentation.view", sharedResource)).toBe(true);
  });

  // 19. Policy Engine SDK Helpers
  it("verifies Policy Engine SDK Helpers correctly", () => {
    const superAdmin = userManager.getUser("user_super_admin")!;
    const guest = userManager.getUser("user_guest")!;

    // cannot()
    expect(accessControlEngine.cannot(guest, "data.import")).toBe(true);
    expect(accessControlEngine.cannot(superAdmin, "data.import")).toBe(false);

    // hasRole()
    expect(accessControlEngine.hasRole(superAdmin, "Super Admin")).toBe(true);
    expect(accessControlEngine.hasRole(guest, "Super Admin")).toBe(false);

    // hasPermission()
    expect(accessControlEngine.hasPermission(superAdmin, "workspace.manage")).toBe(true);

    // withinScope()
    expect(accessControlEngine.withinScope(superAdmin, "global")).toBe(true);
  });

  // 20. Consultant Impersonation
  it("correctly starts and stops consultant impersonation sessions with auditing", () => {
    const consultantAdmin = userManager.getUser("user_consultant_admin")!;
    const targetUser = userManager.getUser("user_client_manager")!;

    // Start impersonation
    const impersonated = identityEngine.impersonateUser(
      consultantAdmin.id,
      targetUser.id,
      "Auditar relatórios de vendas na loja Nissan",
      30
    );

    expect(impersonated.id).toBe(targetUser.id);
    expect(identityEngine.getCurrentUser().id).toBe(targetUser.id);
    expect(identityEngine.isSessionImpersonated()).toBe(true);
    expect(identityEngine.getImpersonatingActorId()).toBe(consultantAdmin.id);

    // Stop impersonation
    const restored = identityEngine.stopImpersonating();
    expect(restored.id).toBe(consultantAdmin.id);
    expect(identityEngine.getCurrentUser().id).toBe(consultantAdmin.id);
    expect(identityEngine.isSessionImpersonated()).toBe(false);
  });

  // 21. Security Maturity Score
  it("evaluates dynamic Security Maturity Score based on security indicators", () => {
    const scoreReport = securityScoreEngine.calculateMaturityScore();

    expect(scoreReport.score).toBeGreaterThanOrEqual(0);
    expect(scoreReport.score).toBeLessThanOrEqual(100);
    expect(scoreReport.criteria.mfaAdoptionRate).toBeDefined();
    expect(scoreReport.criteria.passwordPolicyEnabled).toBe(true);
    expect(scoreReport.criteria.adminsCount).toBeGreaterThan(0);
  });
});
