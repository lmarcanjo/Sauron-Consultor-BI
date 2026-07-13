/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PlatformUser, Role } from "./types";
import { auditEngine } from "../audit/AuditEngine";

// Simple robust sychronous hash to avoid plain text storage
export function hashPassword(password: string): string {
  if (password.length === 0) return "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
  const salt = "sauron_salt_secure_2026";
  const str = password + salt;
  let h1 = 0x6a09e667, h2 = 0xbb67ae85, h3 = 0x3c6ef372, h4 = 0xa54ff53a;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    h1 = (h1 + char) ^ (h2 << 5);
    h2 = (h2 + char) ^ (h3 << 3);
    h3 = (h3 + char) ^ (h4 << 7);
    h4 = (h4 + char) ^ (h1 << 4);
  }
  return [h1, h2, h3, h4].map(h => Math.abs(h).toString(16).padStart(8, '0')).join('');
}

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
    this.users = [];
    this.saveToStorage();
  }

  public saveToStorage() {
    if (typeof localStorage !== "undefined") {
      try {
        localStorage.setItem("sauron_identity_users", JSON.stringify(this.users));
      } catch (e) {
        console.error("[UserManager] Error saving users:", e);
      }
    }
  }

  public getUsers(): PlatformUser[] {
    return this.users;
  }

  public getUser(id: string): PlatformUser | undefined {
    return this.users.find(u => u.id === id);
  }

  public getUserByEmail(email: string): PlatformUser | undefined {
    return this.users.find(u => u.profile.email.toLowerCase() === email.toLowerCase());
  }

  public createUser(user: Omit<PlatformUser, "createdAt" | "updatedAt"> & { password?: string }): PlatformUser {
    const now = new Date().toISOString();
    const { password, ...userFields } = user;
    const newUser: PlatformUser = {
      ...userFields,
      createdAt: now,
      updatedAt: now
    };
    this.users.push(newUser);
    this.saveToStorage();

    if (password) {
      this.saveUserPassword(newUser.id, password);
    }
    
    auditEngine.logEvent("USER_INVITED", `Usuário cadastrado com sucesso: ${newUser.profile.fullName} (${newUser.role})`, "INFO", {
      user: "System"
    });
    
    return newUser;
  }

  public updateUser(id: string, updates: Partial<Omit<PlatformUser, "id" | "createdAt" | "updatedAt">> & { password?: string }): PlatformUser {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) {
      throw new Error(`User with ID ${id} not found.`);
    }
    const current = this.users[index];
    const { password, ...fields } = updates;
    const updated: PlatformUser = {
      ...current,
      ...fields,
      profile: {
        ...current.profile,
        ...(fields.profile || {})
      },
      updatedAt: new Date().toISOString()
    };
    
    this.users[index] = updated;
    this.saveToStorage();

    if (password) {
      this.saveUserPassword(id, password);
    }

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
    this.deleteUserPassword(id);
    if (user) {
      auditEngine.logEvent("USER_ACCESS_REVOKED", `Acesso do usuário revogado: ${user.profile.fullName}`, "CRITICAL", {
        user: "System"
      });
    }
  }

  // --- PASSWORD HASH STORAGE ---
  
  public saveUserPassword(userId: string, password: string): void {
    if (typeof localStorage === "undefined") return;
    try {
      const saved = localStorage.getItem("sauron_identity_passwords");
      const passwords = saved ? JSON.parse(saved) : {};
      passwords[userId] = hashPassword(password);
      localStorage.setItem("sauron_identity_passwords", JSON.stringify(passwords));
    } catch (e) {
      console.error("[UserManager] Error saving password hash:", e);
    }
  }

  private deleteUserPassword(userId: string): void {
    if (typeof localStorage === "undefined") return;
    try {
      const saved = localStorage.getItem("sauron_identity_passwords");
      if (saved) {
        const passwords = JSON.parse(saved);
        delete passwords[userId];
        localStorage.setItem("sauron_identity_passwords", JSON.stringify(passwords));
      }
    } catch (e) {
      console.error("[UserManager] Error deleting password hash:", e);
    }
  }

  public verifyPassword(userId: string, password: string): boolean {
    if (typeof localStorage === "undefined") return false;
    try {
      const saved = localStorage.getItem("sauron_identity_passwords");
      if (!saved) return false;
      const passwords = JSON.parse(saved);
      const hash = passwords[userId];
      if (!hash) return false;
      return hash === hashPassword(password);
    } catch (e) {
      console.error("[UserManager] Error verifying password:", e);
      return false;
    }
  }

  // Helper method for test environment to inject seeds dynamically
  public injectTestUsers(testUsers: PlatformUser[]): void {
    this.users = [...testUsers];
    this.saveToStorage();
  }
}

export const userManager = UserManager.getInstance();
export default userManager;
