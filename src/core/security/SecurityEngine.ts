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
    return sqlSafety.isReadOnly(query);
  }
}

export const securityEngine = SecurityEngine.getInstance();
export default securityEngine;
