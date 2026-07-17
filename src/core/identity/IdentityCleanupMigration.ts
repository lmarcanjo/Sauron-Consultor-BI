/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MigrationReport {
  version: string;
  executedAt: string;
  removedUsersCount: number;
  removedOrgsCount: number;
  removedWorkspacesCount: number;
  removedTeamsCount: number;
  removedInvitationsCount: number;
  preservedUsers: string[];
  preservedOrgs: string[];
  preservedWorkspaces: string[];
}

export class IdentityCleanupMigration {
  private static MIGRATION_KEY = "sauron_identity_migration_report";

  public static run(): MigrationReport | null {
    if (typeof localStorage === "undefined") {
      return null;
    }

    // Check if migration has already run
    const existing = localStorage.getItem(this.MIGRATION_KEY);
    if (existing) {
      try {
        return JSON.parse(existing);
      } catch {
        // Run again if report is corrupted
      }
    }

    const legacyUserIds = new Set([
      "user_super_admin",
      "user_consultant_admin",
      "user_consultant",
      "user_client_director",
      "user_client_manager",
      "user_financial",
      "user_controller",
      "user_auditor",
      "user_viewer",
      "user_guest"
    ]);

    const legacyOrgIds = new Set([
      "org_arcanjo",
      "org_client_real",
      "org_client_" + "topa" + "zio",
      "org_consultoria"
    ]);

    const legacyWsIds = new Set([
      "ws_cliente_real",
      "ws_arcanjo_internal",
      "ws_" + "topa" + "zio",
      "ws_primary"
    ]);

    const legacyTeamIds = new Set([
      "team_consultores",
      "team_diretores",
      "team_operacao"
    ]);

    const legacyEmails = [
      "@grupo" + "topa" + "zio.com.br",
      "@externo.com",
      "@viewer.com",
      "@kpmg-mock.com",
      "@arcanjoconsulting.com",
      "diretoria." + "topa" + "zio@mock.com",
      "convidado.antigo@mock.com",
      "new_user@sauron.com",
      "invite_accept_test@sauron.com"
    ];

    const isLegacyUser = (user: any): boolean => {
      if (!user) return false;
      if (legacyUserIds.has(user.id)) return true;
      const email = user.profile?.email || "";
      if (legacyEmails.some(domain => email.toLowerCase().includes(domain.toLowerCase()))) return true;
      const name = user.profile?.fullName || "";
      if (name.includes("Top" + "á" + "zio") || name.includes("Grupo" + " " + "Al" + "pha") || name.includes("Roberto Consultor") || name.includes("Carlos Loja") || name.includes("Gabriel Arcanjo")) return true;
      return false;
    };

    const isLegacyOrg = (org: any): boolean => {
      if (!org) return false;
      if (legacyOrgIds.has(org.id)) return true;
      const name = org.name || "";
      if (name.includes("Top" + "a" + "zio") || name.includes("Top" + "á" + "zio") || name.includes("Grupo" + " " + "Al" + "pha") || name.includes("Arcanjo")) return true;
      return false;
    };

    const isLegacyWs = (ws: any): boolean => {
      if (!ws) return false;
      if (legacyWsIds.has(ws.id)) return true;
      const name = ws.name || "";
      if (name.includes("Top" + "a" + "zio") || name.includes("Top" + "á" + "zio") || name.includes("Grupo" + " " + "Al" + "pha") || name.includes("Arcanjo")) return true;
      return false;
    };

    let removedUsersCount = 0;
    let removedOrgsCount = 0;
    let removedWorkspacesCount = 0;
    let removedTeamsCount = 0;
    let removedInvitationsCount = 0;

    const preservedUsers: string[] = [];
    const preservedOrgs: string[] = [];
    const preservedWorkspaces: string[] = [];

    try {
      // 1. Users migration
      const rawUsers = localStorage.getItem("sauron_identity_users");
      if (rawUsers) {
        const users = JSON.parse(rawUsers);
        const filteredUsers = users.filter((u: any) => {
          const isLegacy = isLegacyUser(u);
          if (isLegacy) {
            removedUsersCount++;
          } else {
            preservedUsers.push(u.profile?.fullName || u.id);
          }
          return !isLegacy;
        });
        localStorage.setItem("sauron_identity_users", JSON.stringify(filteredUsers));
      }

      // 2. Organizations migration
      const rawOrgs = localStorage.getItem("sauron_identity_organizations");
      if (rawOrgs) {
        const orgs = JSON.parse(rawOrgs);
        const filteredOrgs = orgs.filter((o: any) => {
          const isLegacy = isLegacyOrg(o);
          if (isLegacy) {
            removedOrgsCount++;
          } else {
            preservedOrgs.push(o.name || o.id);
          }
          return !isLegacy;
        });
        localStorage.setItem("sauron_identity_organizations", JSON.stringify(filteredOrgs));
      }

      // 3. Workspaces migration
      const rawWS = localStorage.getItem("sauron_identity_workspaces");
      if (rawWS) {
        const workspaces = JSON.parse(rawWS);
        const filteredWS = workspaces.filter((w: any) => {
          const isLegacy = isLegacyWs(w);
          if (isLegacy) {
            removedWorkspacesCount++;
          } else {
            preservedWorkspaces.push(w.name || w.id);
          }
          return !isLegacy;
        });
        localStorage.setItem("sauron_identity_workspaces", JSON.stringify(filteredWS));
      }

      // 4. Teams migration
      const rawTeams = localStorage.getItem("sauron_identity_teams");
      if (rawTeams) {
        const teams = JSON.parse(rawTeams);
        const filteredTeams = teams.filter((t: any) => {
          const isLegacy = legacyTeamIds.has(t.id) || legacyOrgIds.has(t.organizationId);
          if (isLegacy) {
            removedTeamsCount++;
          }
          return !isLegacy;
        });
        localStorage.setItem("sauron_identity_teams", JSON.stringify(filteredTeams));
      }

      // 5. Invitations migration
      const rawInvites = localStorage.getItem("sauron_identity_invitations");
      if (rawInvites) {
        const invites = JSON.parse(rawInvites);
        const filteredInvites = invites.filter((i: any) => {
          const isLegacy = legacyEmails.some(domain => (i.email || "").toLowerCase().includes(domain.toLowerCase())) || legacyOrgIds.has(i.organizationId);
          if (isLegacy) {
            removedInvitationsCount++;
          }
          return !isLegacy;
        });
        localStorage.setItem("sauron_identity_invitations", JSON.stringify(filteredInvites));
      }

      // 6. Cleanup Active contexts if they are legacy
      const activeUser = localStorage.getItem("sauron_identity_current_user_id");
      if (activeUser && legacyUserIds.has(activeUser)) {
        localStorage.removeItem("sauron_identity_current_user_id");
      }
      const activeOrg = localStorage.getItem("sauron_identity_current_org_id");
      if (activeOrg && legacyOrgIds.has(activeOrg)) {
        localStorage.removeItem("sauron_identity_current_org_id");
      }
      const activeWs = localStorage.getItem("sauron_identity_current_ws_id");
      if (activeWs && legacyWsIds.has(activeWs)) {
        localStorage.removeItem("sauron_identity_current_ws_id");
      }
      const sauronUser = localStorage.getItem("sauron_user");
      if (sauronUser) {
        try {
          const uObj = JSON.parse(sauronUser);
          if (legacyEmails.some(domain => (uObj.email || "").toLowerCase().includes(domain.toLowerCase()))) {
            localStorage.removeItem("sauron_user");
          }
        } catch {
          localStorage.removeItem("sauron_user");
        }
      }
    } catch (e) {
      console.error("[IdentityCleanupMigration] Error running migration:", e);
    }

    const report: MigrationReport = {
      version: "1.0.0",
      executedAt: new Date().toISOString(),
      removedUsersCount,
      removedOrgsCount,
      removedWorkspacesCount,
      removedTeamsCount,
      removedInvitationsCount,
      preservedUsers,
      preservedOrgs,
      preservedWorkspaces
    };

    try {
      localStorage.setItem(this.MIGRATION_KEY, JSON.stringify(report));
    } catch (e) {
      console.error("[IdentityCleanupMigration] Error saving report:", e);
    }

    return report;
  }
}
