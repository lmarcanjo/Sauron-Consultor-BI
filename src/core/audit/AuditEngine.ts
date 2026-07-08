/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AuditLog {
  id: string;
  timestamp: string;
  type: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  message: string;
  dataSource?: string;
  count?: number;
  user?: string;
}

export class AuditEngine {
  private static instance: AuditEngine;

  private constructor() {}

  public static getInstance(): AuditEngine {
    if (!AuditEngine.instance) {
      AuditEngine.instance = new AuditEngine();
    }
    return AuditEngine.instance;
  }

  /**
   * Registers a brand new event into the platform audit ledger.
   */
  public logEvent(
    type: string,
    message: string,
    severity: "INFO" | "WARNING" | "CRITICAL" = "INFO",
    metadata: Record<string, any> = {}
  ): AuditLog {
    const hasLocalStorage = typeof localStorage !== "undefined";
    const log: AuditLog = {
      id: `audit_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`,
      timestamp: new Date().toISOString(),
      type,
      severity,
      message,
      dataSource: metadata.dataSource,
      count: metadata.count,
      user: metadata.user || "Lennon Marcanjo"
    };

    if (hasLocalStorage) {
      try {
        const saved = localStorage.getItem("sauron_audit_logs");
        const logs: AuditLog[] = saved ? JSON.parse(saved) : [];
        logs.push(log);
        localStorage.setItem("sauron_audit_logs", JSON.stringify(logs.slice(-200))); // keep latest 200 logs to fit quota
      } catch (e) {
        console.error("[Sauron Audit] Falha ao gravar log de auditoria no localStorage:", e);
      }
    }

    return log;
  }

  /**
   * Queries the platform audit ledger.
   */
  public getLogs(): AuditLog[] {
    if (typeof localStorage === "undefined") return [];
    try {
      const saved = localStorage.getItem("sauron_audit_logs");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  }
}

export const auditEngine = AuditEngine.getInstance();
export default auditEngine;
