/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * AreaPermissionRepository — F20.3 Final Closure, Bloco 8
 *
 * Grants per-Business-Area permissions to specific users. This is the single
 * place `AreaPermission` records are stored and read — `AccessControlEngine`
 * queries this repository; nothing else should read/write the storage key
 * directly.
 */

export type AreaAction = "VIEW" | "EDIT" | "CONFIGURE" | "ARCHIVE" | "DELETE" | "EXPORT";

export interface AreaPermission {
  userId: string;
  groupId?: string;
  companyId?: string;
  areaId: string;
  actions: AreaAction[];
}

export interface AreaPermissionContext {
  groupId?: string;
  companyId?: string;
}

const STORAGE_KEY = "sauron_area_permissions";

class AreaPermissionRepositoryImpl {
  private read(): AreaPermission[] {
    if (typeof localStorage === "undefined") return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private write(grants: AreaPermission[]): void {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(grants));
    if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
      window.dispatchEvent(new CustomEvent("sauron:area-permissions-updated"));
    }
  }

  public getAll(): AreaPermission[] {
    return this.read();
  }

  private matchesContext(grant: AreaPermission, context?: AreaPermissionContext): boolean {
    if (!context) return true;
    if (grant.groupId && grant.groupId !== context.groupId) return false;
    if (grant.companyId && grant.companyId !== context.companyId) return false;
    return true;
  }

  private sameContext(grant: AreaPermission, context?: AreaPermissionContext): boolean {
    return (grant.groupId || undefined) === (context?.groupId || undefined)
      && (grant.companyId || undefined) === (context?.companyId || undefined);
  }

  public getGrantsForUser(userId: string, context?: AreaPermissionContext): AreaPermission[] {
    return this.read().filter(g => g.userId === userId && this.matchesContext(g, context));
  }

  public getGrantsForArea(areaId: string, context?: AreaPermissionContext): AreaPermission[] {
    return this.read().filter(g => g.areaId === areaId && this.matchesContext(g, context));
  }

  /** Grants (or extends) actions for a user on a specific area. Idempotent. */
  public grant(userId: string, areaId: string, actions: AreaAction[], context?: AreaPermissionContext): AreaPermission {
    const grants = this.read();
    const existing = grants.find(g => g.userId === userId && g.areaId === areaId && this.sameContext(g, context));
    if (existing) {
      const merged = Array.from(new Set([...existing.actions, ...actions]));
      existing.actions = merged;
      this.write(grants);
      return existing;
    }
    const created: AreaPermission = { userId, areaId, actions: [...actions], ...context };
    grants.push(created);
    this.write(grants);
    return created;
  }

  /** Replaces the complete grant for a user and area in one context-safe write. */
  public set(userId: string, areaId: string, actions: AreaAction[], context?: AreaPermissionContext): void {
    const grants = this.read();
    const idx = grants.findIndex(g => g.userId === userId && g.areaId === areaId && this.sameContext(g, context));
    if (actions.length === 0) {
      if (idx >= 0) grants.splice(idx, 1);
      this.write(grants);
      return;
    }
    const next: AreaPermission = { userId, areaId, actions: Array.from(new Set(actions)), ...context };
    if (idx >= 0) grants[idx] = next;
    else grants.push(next);
    this.write(grants);
  }

  /** Revokes one action, or the entire grant when `action` is omitted. */
  public revoke(userId: string, areaId: string, action?: AreaAction, context?: AreaPermissionContext): void {
    const grants = this.read();
    const idx = grants.findIndex(g => g.userId === userId && g.areaId === areaId && this.sameContext(g, context));
    if (idx < 0) return;
    if (!action) {
      grants.splice(idx, 1);
    } else {
      grants[idx].actions = grants[idx].actions.filter(a => a !== action);
      if (grants[idx].actions.length === 0) grants.splice(idx, 1);
    }
    this.write(grants);
  }

  /** Removes every grant referencing an area (call when an area is permanently deleted). */
  public revokeAllForArea(areaId: string, context?: AreaPermissionContext): void {
    const grants = this.read().filter(g => g.areaId !== areaId || (context && !this.matchesContext(g, context)));
    this.write(grants);
  }

  /**
   * Flattens a user's grants into `NavigationRegistry`-compatible permission
   * strings (`"VIEW_AREA:<id>"`, etc.) for `checkNavigationPermission`.
   */
  public toPermissionStrings(userId: string, context?: AreaPermissionContext): string[] {
    return this.getGrantsForUser(userId, context).flatMap(g => g.actions.map(action => `${action}_AREA:${g.areaId}`));
  }
}

export const areaPermissionRepository = new AreaPermissionRepositoryImpl();
