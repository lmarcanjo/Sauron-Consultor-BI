/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { sqlSafety, SqlSafety } from "./sqlSafety";

export interface UserSession {
  username: string;
  role: "CONSULTANT" | "CLIENT" | "ADMIN";
}

export class SecurityEngine {
  private static instance: SecurityEngine;

  private constructor() {}

  public static getInstance(): SecurityEngine {
    if (!SecurityEngine.instance) {
      SecurityEngine.instance = new SecurityEngine();
    }
    return SecurityEngine.instance;
  }

  public getSqlSafety(): SqlSafety {
    return sqlSafety;
  }

  /**
   * Evaluates if a given session is permitted to alter metadata or approve datasets.
   */
  public hasOverlayPermission(session: UserSession): boolean {
    return session.role === "CONSULTANT" || session.role === "ADMIN";
  }

  /**
   * Asserts if a raw SQL statement is safe for read-only executions.
   */
  public isSqlStatementSafe(query: string): boolean {
    try {
      this.assertReadOnlyQuery(query);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Asserts if a raw SQL statement is safe for read-only executions. Throws an error if unsafe.
   */
  public assertReadOnlyQuery(query: string): void {
    if (!query) return;
    const q = query.trim().toUpperCase();
    const blockedKeywords = ["INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "CREATE", "TRUNCATE", "MERGE", "EXEC", "CALL"];
    for (const keyword of blockedKeywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, "i");
      if (regex.test(q)) {
        throw new Error(`[Security Error] Bloqueio de Consulta: Tentativa de alteração ou execução de instrução destrutiva '${keyword}' rejeitada.`);
      }
    }
  }
}

export const securityEngine = SecurityEngine.getInstance();
export default securityEngine;
