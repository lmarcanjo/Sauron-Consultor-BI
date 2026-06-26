/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PlatformUser, Role } from "./types";
import { auditEngine } from "../audit/AuditEngine";

export class UserManager {
  private static instance: UserManager;
  private users: PlatformUser[] = [];

  private constructor() {
    this.loadFromStorage();
  }

  public static getInstance(): UserManager {
    if (!UserManager.instance) {
      UserManager.instance = new UserManager();
    }
    return UserManager.instance;
  }

  private loadFromStorage() {
    if (typeof localStorage !== "undefined") {
      try {
        const saved = localStorage.getItem("sauron_identity_users");
        if (saved) {
          this.users = JSON.parse(saved);
          return;
        }
      } catch (e) {
        console.error("[UserManager] Error loading users:", e);
      }
    }
    this.seedDefaultUsers();
  }

  private saveToStorage() {
    if (typeof localStorage !== "undefined") {
      try {
        localStorage.setItem("sauron_identity_users", JSON.stringify(this.users));
      } catch (e) {
        console.error("[UserManager] Error saving users:", e);
      }
    }
  }

  private seedDefaultUsers() {
    const now = new Date().toISOString();
    this.users = [
      {
        id: "user_super_admin",
        profile: {
          id: "user_super_admin",
          fullName: "Lennon Marcanjo (Super)",
          email: "lmarcanjo16@gmail.com",
          avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=lennon"
        },
        role: "Super Admin",
        organizationId: "org_arcanjo",
        createdAt: now,
        updatedAt: now
      },
      {
        id: "user_consultant_admin",
        profile: {
          id: "user_consultant_admin",
          fullName: "Gabriel Arcanjo (Consultoria)",
          email: "gabriel@arcanjoconsulting.com",
          avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=gabriel"
        },
        role: "Consultant Admin",
        organizationId: "org_arcanjo",
        createdAt: now,
        updatedAt: now
      },
      {
        id: "user_consultant",
        profile: {
          id: "user_consultant",
          fullName: "Roberto Consultor",
          email: "roberto@arcanjoconsulting.com",
          avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=roberto"
        },
        role: "Consultant",
        organizationId: "org_arcanjo",
        createdAt: now,
        updatedAt: now
      },
      {
        id: "user_client_director",
        profile: {
          id: "user_client_director",
          fullName: "Dr. Roberto Topázio",
          email: "roberto.topazio@grupotopazio.com.br",
          avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=topazio"
        },
        role: "Client Director",
        organizationId: "org_client_topazio",
        createdAt: now,
        updatedAt: now
      },
      {
        id: "user_client_manager",
        profile: {
          id: "user_client_manager",
          fullName: "Carlos Loja Nissan",
          email: "carlos.nissan@grupotopazio.com.br",
          avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=carlos"
        },
        role: "Client Manager",
        organizationId: "org_client_topazio",
        createdAt: now,
        updatedAt: now
      },
      {
        id: "user_financial",
        profile: {
          id: "user_financial",
          fullName: "Ana Finanças",
          email: "ana.financeiro@grupotopazio.com.br",
          avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=ana"
        },
        role: "Financial User",
        organizationId: "org_client_topazio",
        createdAt: now,
        updatedAt: now
      },
      {
        id: "user_controller",
        profile: {
          id: "user_controller",
          fullName: "Marcos Controladoria",
          email: "marcos.controller@grupotopazio.com.br",
          avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=marcos"
        },
        role: "Controller",
        organizationId: "org_client_topazio",
        createdAt: now,
        updatedAt: now
      },
      {
        id: "user_auditor",
        profile: {
          id: "user_auditor",
          fullName: "Silvia Auditora",
          email: "silvia.auditoria@kpmg-mock.com",
          avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=silvia"
        },
        role: "Auditor",
        organizationId: "org_client_topazio",
        createdAt: now,
        updatedAt: now
      },
      {
        id: "user_viewer",
        profile: {
          id: "user_viewer",
          fullName: "Lucas Observador",
          email: "lucas@viewer.com",
          avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=lucas"
        },
        role: "Viewer",
        organizationId: "org_client_topazio",
        createdAt: now,
        updatedAt: now
      },
      {
        id: "user_guest",
        profile: {
          id: "user_guest",
          fullName: "Maria Convidada",
          email: "maria.guest@externo.com",
          avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=maria"
        },
        role: "Guest",
        organizationId: "org_client_topazio",
        createdAt: now,
        updatedAt: now
      }
    ];
    this.saveToStorage();
  }

  public getUsers(): PlatformUser[] {
    return this.users;
  }

  public getUser(id: string): PlatformUser | undefined {
    return this.users.find(u => u.id === id);
  }

  public createUser(user: Omit<PlatformUser, "createdAt" | "updatedAt">): PlatformUser {
    const now = new Date().toISOString();
    const newUser: PlatformUser = {
      ...user,
      createdAt: now,
      updatedAt: now
    };
    this.users.push(newUser);
    this.saveToStorage();
    
    auditEngine.logEvent("USER_INVITED", `Usuário cadastrado com sucesso: ${newUser.profile.fullName} (${newUser.role})`, "INFO", {
      user: "System"
    });
    
    return newUser;
  }

  public updateUser(id: string, updates: Partial<Omit<PlatformUser, "id" | "createdAt" | "updatedAt">>): PlatformUser {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) {
      throw new Error(`User with ID ${id} not found.`);
    }
    const current = this.users[index];
    const updated: PlatformUser = {
      ...current,
      ...updates,
      profile: {
        ...current.profile,
        ...(updates.profile || {})
      },
      updatedAt: new Date().toISOString()
    };
    
    this.users[index] = updated;
    this.saveToStorage();

    if (updates.role && updates.role !== current.role) {
      auditEngine.logEvent("USER_ROLE_CHANGED", `Papel do usuário ${updated.profile.fullName} alterado de ${current.role} para ${updated.role}`, "WARNING", {
        user: "System"
      });
    }

    return updated;
  }

  public deleteUser(id: string): void {
    const user = this.getUser(id);
    this.users = this.users.filter(u => u.id !== id);
    this.saveToStorage();
    if (user) {
      auditEngine.logEvent("USER_ACCESS_REVOKED", `Acesso do usuário revogado: ${user.profile.fullName}`, "CRITICAL", {
        user: "System"
      });
    }
  }
}

export const userManager = UserManager.getInstance();
