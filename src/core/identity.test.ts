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
      organizationId: "org_client_topazio"
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
    const workspace = organizationManager.getWorkspace("ws_topazio")!;
    
    const directorCos = accessControlEngine.getVisibleCompaniesForUser(director, workspace);
    const managerCos = accessControlEngine.getVisibleCompaniesForUser(manager, workspace);
    
    expect(directorCos.length).toBe(workspace.companies.length);
    expect(managerCos.length).toBeLessThanOrEqual(workspace.companies.length);
  });

  // 8. Criar convite
  it("creates user invitations with correct details", () => {
    const invite = invitationManager.createInvitation(
      "new_user@sauron.com",
      "org_client_topazio",
      "Financial User",
      "costCenter",
      "user_consultant_admin",
      "ws_topazio"
    );
    expect(invite.email).toBe("new_user@sauron.com");
    expect(invite.status).toBe("pending");
  });

  // 9. Aceitar convite
  it("assigns user to organization and workspace upon accepting an invite", () => {
    const invite = invitationManager.createInvitation(
      "invite_accept_test@sauron.com",
      "org_client_topazio",
      "Financial User",
      "costCenter",
      "user_consultant_admin",
      "ws_topazio"
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
      organizationId: "org_client_topazio"
    });
    
    invitationManager.acceptInvitation(invite.id, "user_accept_test");
    
    const updatedUser = userManager.getUser("user_accept_test")!;
    expect(updatedUser.role).toBe("Financial User");
    
    const ws = organizationManager.getWorkspace("ws_topazio")!;
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
    expect(twin.id).toBe("group_topazio");
    expect(twin.companies.length).toBeGreaterThan(0);
    
    const company = twin.companies[0];
    expect(company.stores.some(s => s.id === "store_nissan_feira")).toBe(true);
  });

  // 15. Usuário gerente vê apenas loja permitida
  it("restricts Client Manager to their specific allowed store", () => {
    const manager = userManager.getUser("user_client_manager")!; // Carlos Loja Nissan
    const workspace = organizationManager.getWorkspace("ws_topazio")!;
    
    // carlos.nissan has a policy restricting him to "Loja Nissan Feira"
    const visibleCompanies = accessControlEngine.getVisibleCompaniesForUser(manager, workspace);
    expect(visibleCompanies.every(c => c === "Loja Nissan Feira" || c === "Grupo Topázio")).toBe(true);
  });

  // 16. Diretor vê todo grupo
  it("allows Client Director to see all companies in the group", () => {
    const director = userManager.getUser("user_client_director")!;
    const workspace = organizationManager.getWorkspace("ws_topazio")!;
    
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
});
