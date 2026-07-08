/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { isQueryReadOnly } from "../../utils/calculations";

export class SqlSafety {
  private static instance: SqlSafety;

  private constructor() {}

  public static getInstance(): SqlSafety {
    if (!SqlSafety.instance) {
      SqlSafety.instance = new SqlSafety();
    }
    return SqlSafety.instance;
  }

  /**
   * Safely checks if a SQL query is read-only.
   */
  public isReadOnly(query: string): boolean {
    return isQueryReadOnly(query);
  }

  /**
   * Cleans and sanitizes query input against SQL injection risks.
   */
  public sanitizeQuery(query: string): string {
    return query.replace(/--/g, "").replace(/;/g, "");
  }
}

export const sqlSafety = SqlSafety.getInstance();
