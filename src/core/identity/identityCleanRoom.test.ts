/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";

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

import { userManager } from "./UserManager";
import { organizationManager } from "./OrganizationManager";
import { identityEngine } from "./IdentityEngine";
import { IdentityCleanupMigration } from "./IdentityCleanupMigration";
import { accessControlEngine } from "./AccessControlEngine";

describe("F15.2 — Login & Identity Clean Room Tests Suite", () => {
  beforeEach(() => {
    localStorage.clear();
    identityEngine.disableTestFallback(true);
    // Re-initialize lists to simulate empty boot
    userManager.injectTestUsers([]);
    organizationManager.injectTestStructure([], [], []);
  });

  afterAll(() => {
    identityEngine.disableTestFallback(false);
  });

  // 1. Primeiro boot sem usuários
  it("starts with zero users on first boot", () => {
    expect(userManager.getUsers().length).toBe(0);
  });

  // 2. Tela de inicialização do primeiro Super Admin (API check) & 3. Criação do primeiro Super Admin
  it("allows creating the first Super Admin when empty", () => {
    const admin = userManager.createUser({
      id: "admin_123",
      profile: {
        id: "admin_123",
        fullName: "Lennon Administrador",
        email: "lennon@consultoria.com"
      },
      role: "SUPER_ADMIN",
      organizationId: "org_123",
      password: "secretpassword"
    });

    expect(admin.role).toBe("SUPER_ADMIN");
    expect(userManager.getUsers().length).toBe(1);
    expect(userManager.getUser("admin_123")).toBeDefined();
  });

  // 4. Login com usuário real & 5. Login inválido
  it("performs login checks correctly based on password hashes", () => {
    // Register user
    userManager.createUser({
      id: "user_test",
      profile: { id: "user_test", fullName: "User Test", email: "test@sauron.com" },
      role: "CONSULTANT",
      organizationId: "org_123",
      password: "password123"
    });

    // Valid login
    const logged = identityEngine.login("test@sauron.com", "password123");
    expect(logged).not.toBeNull();
    expect(logged?.profile.email).toBe("test@sauron.com");
    expect(identityEngine.getCurrentUser().id).toBe("user_test");

    // Invalid login
    const failed = identityEngine.login("test@sauron.com", "wrong_password");
    expect(failed).toBeNull();
  });

  // 6. Nenhum usuário Topázio, 7. Nenhuma organização Topázio, 8. Nenhum workspace Alpha/Topázio
  it("contains no Topazio/Alpha fakes in clean boot", () => {
    expect(userManager.getUsers().some(u => u.profile.email.includes("topazio"))).toBe(false);
    expect(organizationManager.getOrganizations().some(o => o.name.includes("Topazio"))).toBe(false);
    expect(organizationManager.getWorkspaces().some(w => w.name.includes("Topazio") || w.name.includes("Alpha"))).toBe(false);
  });

  // 9. Apenas SUPER_ADMIN e CONSULTANT como papéis-base
  it("authorizes only SUPER_ADMIN and CONSULTANT roles in clean boot", () => {
    // Create new users with the restricted roles
    const admin = userManager.createUser({
      id: "admin_base",
      profile: { id: "admin_base", fullName: "Admin Base", email: "admin.base@sauron.com" },
      role: "SUPER_ADMIN",
      organizationId: "org_base"
    });
    const consultant = userManager.createUser({
      id: "consultant_base",
      profile: { id: "consultant_base", fullName: "Consultant Base", email: "consultant.base@sauron.com" },
      role: "CONSULTANT",
      organizationId: "org_base"
    });

    expect(admin.role).toBe("SUPER_ADMIN");
    expect(consultant.role).toBe("CONSULTANT");
  });

  // 10. Consultor vê apenas workspaces permitidos
  it("restricts consultant visibility to allowed workspaces only", () => {
    const ws1 = organizationManager.createWorkspace({
      id: "ws_1",
      name: "Workspace Permitido",
      organizationId: "org_base",
      clientId: "client_1",
      companies: ["Empresa A"],
      brands: [],
      stores: [],
      costCenters: [],
      allowedUsers: ["consultant_user"],
      allowedTeams: [],
      accessPolicies: [
        { id: "pol_1", role: "CONSULTANT", permission: "workspace.view", scope: "workspace" }
      ],
      dataSources: [],
      presentations: [],
      meetings: [],
      actionPlans: [],
      auditTrail: []
    });

    const ws2 = organizationManager.createWorkspace({
      id: "ws_2",
      name: "Workspace Oculto",
      organizationId: "org_base",
      clientId: "client_1",
      companies: ["Empresa B"],
      brands: [],
      stores: [],
      costCenters: [],
      allowedUsers: ["other_user"],
      allowedTeams: [],
      accessPolicies: [
        { id: "pol_2", role: "CONSULTANT", permission: "workspace.view", scope: "workspace" }
      ],
      dataSources: [],
      presentations: [],
      meetings: [],
      actionPlans: [],
      auditTrail: []
    });

    const consultant = {
      id: "consultant_user",
      profile: { id: "consultant_user", fullName: "Consultor A", email: "consultor@sauron.com" },
      role: "CONSULTANT" as any,
      organizationId: "org_base",
      createdAt: "",
      updatedAt: ""
    };

    const visibleWorkspaces = accessControlEngine.getVisibleWorkspacesForUser(consultant);
    expect(visibleWorkspaces.map(w => w.id)).toContain("ws_1");
    expect(visibleWorkspaces.map(w => w.id)).not.toContain("ws_2");
  });

  // 11. Migração remove legado & 12. Migração preserva usuários reais
  it("runs cleanup migration correctly removing legacy seeds while preserving post-created data", () => {
    // Simulate legacy records saved in localStorage
    const legacyUsers = [
      { id: "user_client_manager", profile: { fullName: "Carlos Loja Nissan", email: "carlos.nissan@grupotopazio.com.br" } },
      { id: "real_user_created_later", profile: { fullName: "Consultor Real", email: "real@consultor.com" } }
    ];
    localStorage.setItem("sauron_identity_users", JSON.stringify(legacyUsers));

    const legacyOrgs = [
      { id: "org_client_topazio", name: "Grupo Topazio" },
      { id: "real_org_created_later", name: "Holding Real S/A" }
    ];
    localStorage.setItem("sauron_identity_organizations", JSON.stringify(legacyOrgs));

    const legacyWS = [
      { id: "ws_topazio", name: "Workspace Topazio" },
      { id: "real_ws_created_later", name: "Workspace Real" }
    ];
    localStorage.setItem("sauron_identity_workspaces", JSON.stringify(legacyWS));

    // Run migration
    const report = IdentityCleanupMigration.run();
    expect(report).not.toBeNull();
    expect(report?.removedUsersCount).toBe(1);
    expect(report?.removedOrgsCount).toBe(1);
    expect(report?.removedWorkspacesCount).toBe(1);

    // Verify localStorage has only preserved real records
    const users = JSON.parse(localStorage.getItem("sauron_identity_users") || "[]");
    expect(users.length).toBe(1);
    expect(users[0].id).toBe("real_user_created_later");

    const orgs = JSON.parse(localStorage.getItem("sauron_identity_organizations") || "[]");
    expect(orgs.length).toBe(1);
    expect(orgs[0].id).toBe("real_org_created_later");

    const workspaces = JSON.parse(localStorage.getItem("sauron_identity_workspaces") || "[]");
    expect(workspaces.length).toBe(1);
    expect(workspaces[0].id).toBe("real_ws_created_later");
  });

  // 13. Senha não fica em texto puro
  it("never saves passwords in plain text", () => {
    userManager.createUser({
      id: "plain_test",
      profile: { id: "plain_test", fullName: "Plain Test", email: "plain@sauron.com" },
      role: "CONSULTANT",
      organizationId: "org_base",
      password: "secret_password"
    });

    const savedPasswords = JSON.parse(localStorage.getItem("sauron_identity_passwords") || "{}");
    const hash = savedPasswords["plain_test"];
    expect(hash).toBeDefined();
    expect(hash).not.toBe("secret_password");
    expect(hash.length).toBe(32); // Hex digest length of 32 characters
  });

  // 14. QA mode não persiste identidades
  it("does not persist QA identities in permanent localStorage", () => {
    const qaUser = {
      id: "qa_super_admin",
      profile: { id: "qa_super_admin", fullName: "QA Super Admin", email: "qa@sauron.com" },
      role: "SUPER_ADMIN" as any,
      organizationId: "org_base",
      createdAt: "",
      updatedAt: ""
    };

    identityEngine.setQaUserOverride(qaUser);
    expect(identityEngine.getCurrentUser().id).toBe("qa_super_admin");
    
    // Should NOT be stored in sauron_identity_users
    const users = JSON.parse(localStorage.getItem("sauron_identity_users") || "[]");
    expect(users.some((u: any) => u.id === "qa_super_admin")).toBe(false);

    // Disable override
    identityEngine.setQaUserOverride(null);
  });

  // 15. Falha do módulo não gera tela branca
  it("gracefully returns null instead of throwing errors when session is absent", () => {
    expect(identityEngine.getCurrentUser()).toBeNull();
  });

  // 16. Reload mantém sessão válida & 17. Logout limpa sessão
  it("keeps session valid after page reload simulation and clears it on logout", () => {
    const user = userManager.createUser({
      id: "session_user",
      profile: { id: "session_user", fullName: "Session User", email: "session@sauron.com" },
      role: "CONSULTANT",
      organizationId: "org_base",
      password: "password1"
    });

    // Login
    identityEngine.login("session@sauron.com", "password1");
    expect(identityEngine.getCurrentUser()?.id).toBe("session_user");

    // Reload simulation
    identityEngine.restoreSession();
    expect(identityEngine.getCurrentUser()?.id).toBe("session_user");

    // Logout
    identityEngine.logout();
    expect(identityEngine.getCurrentUser()).toBeNull();
  });

  // 18. Testes adicionais do Hotfix de Estados do AuthState
  describe("Hotfix - AuthState verification tests", () => {
    it("detects BOOTSTRAP state on first boot (no users)", () => {
      userManager.injectTestUsers([]);
      expect(identityEngine.getAuthState()).toBe("BOOTSTRAP");
    });

    it("detects UNAUTHENTICATED state when users exist but no session is active", () => {
      userManager.createUser({
        id: "user_exist",
        profile: { id: "user_exist", fullName: "Existing User", email: "exist@sauron.com" },
        role: "CONSULTANT",
        organizationId: "org_base",
        password: "pwd"
      });
      expect(identityEngine.getAuthState()).toBe("UNAUTHENTICATED");
    });

    it("detects AUTHENTICATED state when a valid user is logged in", () => {
      userManager.createUser({
        id: "user_exist",
        profile: { id: "user_exist", fullName: "Existing User", email: "exist@sauron.com" },
        role: "CONSULTANT",
        organizationId: "org_base",
        password: "pwd"
      });
      identityEngine.login("exist@sauron.com", "pwd");
      expect(identityEngine.getAuthState()).toBe("AUTHENTICATED");
    });

    it("detects UNAUTHENTICATED after a successful logout", () => {
      userManager.createUser({
        id: "user_exist",
        profile: { id: "user_exist", fullName: "Existing User", email: "exist@sauron.com" },
        role: "CONSULTANT",
        organizationId: "org_base",
        password: "pwd"
      });
      identityEngine.login("exist@sauron.com", "pwd");
      expect(identityEngine.getAuthState()).toBe("AUTHENTICATED");

      identityEngine.logout();
      expect(identityEngine.getAuthState()).toBe("UNAUTHENTICATED");
    });

    it("detects SESSION_EXPIRED when session token points to a non-existing user", () => {
      userManager.createUser({
        id: "user_temp",
        profile: { id: "user_temp", fullName: "Temp User", email: "temp@sauron.com" },
        role: "CONSULTANT",
        organizationId: "org_base",
        password: "pwd"
      });
      identityEngine.login("temp@sauron.com", "pwd");
      expect(identityEngine.getAuthState()).toBe("AUTHENTICATED");

      // Simular que outro usuário foi cadastrado, mas o atual deletado
      userManager.injectTestUsers([]);
      userManager.createUser({
        id: "other_user",
        profile: { id: "other_user", fullName: "Other User", email: "other@sauron.com" },
        role: "CONSULTANT",
        organizationId: "org_base",
        password: "pwd"
      });
      expect(identityEngine.getAuthState()).toBe("SESSION_EXPIRED");
    });
  });
});
