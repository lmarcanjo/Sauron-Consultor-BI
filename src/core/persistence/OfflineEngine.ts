/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { IPersistenceProvider } from "./IPersistenceProvider";
import { platformLogger } from "../platform/PlatformLogger";

/**
 * Standard conflict resolution strategy types.
 */
export type ConflictStrategy =
  | "LAST_WRITE_WINS"  // Overwrite server record with local values
  | "MERGE"             // Merge properties (local edits win on identical keys)
  | "MANUAL_REVIEW"     // Quarantine record for manual intervention
  | "VERSION_COMPARE";  // Apply update only if local version > server version

/**
 * An operation cached locally while offline.
 */
export interface OfflineOperation {
  id: string;
  action: "CREATE" | "UPDATE" | "DELETE";
  collection: string;
  recordId: string;
  payload: any;
  timestamp: number;
  version?: number;
}

/**
 * Synchronization result summarizing processed operations.
 */
export interface SyncReport {
  syncedOpsCount: number;
  conflictsDetected: number;
  resolvedOpsCount: number;
  quarantinedOpsCount: number;
  failedOpsCount: number;
}

/**
 * F4-F & F4-G: OFFLINE PERSISTENCE AND CONFLICT RESOLUTION ENGINE
 * 
 * Manages client operations when network connectivity drops, preserving data in 
 * the local provider queue and synchronizing changes smoothly once back online.
 */
export class OfflineEngine {
  private offlineQueue: OfflineOperation[] = [];
  private isOnlineStatus = true;
  private quarantinedRecords = new Map<string, { local: any; server: any; reason: string }>();

  constructor(private localProvider: IPersistenceProvider) {}

  /**
   * Tracks user modification offline when the server is unreachable.
   */
  public async queueOperation(op: Omit<OfflineOperation, "id" | "timestamp">): Promise<void> {
    const fullOp: OfflineOperation = {
      ...op,
      id: `off_op_${crypto.randomUUID().substring(0, 8)}`,
      timestamp: Date.now(),
    };

    this.offlineQueue.push(fullOp);
    
    // Backup offline queue to local persistence provider so it survives browser reloads
    await this.localProvider.setItem(
      `offline_queue:${fullOp.collection}:${fullOp.recordId}`,
      JSON.stringify(fullOp)
    );
  }

  /**
   * Evaluates network state or sets offline mode.
   */
  public setOnline(status: boolean): void {
    this.isOnlineStatus = status;
      platformLogger.info(`[OfflineEngine] Network connection status changed: ${status ? "ONLINE" : "OFFLINE"}`);
  }

  public isOnline(): boolean {
    return this.isOnlineStatus;
  }

  public getQueueLength(): number {
    return this.offlineQueue.length;
  }

  public getQuarantinedRecords() {
    return this.quarantinedRecords;
  }

  /**
   * Main synchronization loop executed when network is restored.
   */
  public async synchronize(
    serverProvider: IPersistenceProvider,
    strategy: ConflictStrategy = "LAST_WRITE_WINS"
  ): Promise<SyncReport> {
    const report: SyncReport = {
      syncedOpsCount: 0,
      conflictsDetected: 0,
      resolvedOpsCount: 0,
      quarantinedOpsCount: 0,
      failedOpsCount: 0,
    };

    if (!this.isOnlineStatus) {
      console.warn("[OfflineEngine] Sync aborted: Client is currently offline.");
      return report;
    }

    const opsToProcess = [...this.offlineQueue];
    this.offlineQueue = []; // Clear current queue to prevent double-processing

    for (const op of opsToProcess) {
      try {
        const key = `${op.collection}:${op.recordId}`;
        const serverRecordRaw = await serverProvider.getItem(key);

        if (!serverRecordRaw) {
          // No conflict: server does not have this record yet, simply save
          await serverProvider.setItem(key, JSON.stringify(op.payload));
          report.syncedOpsCount++;
        } else {
          // Conflict detected: record exists on both local and server
          report.conflictsDetected++;
          const serverRecord = JSON.parse(serverRecordRaw);
          
          const resolvedData = this.resolveConflict(op.payload, serverRecord, op, strategy);
          
          if (resolvedData) {
            await serverProvider.setItem(key, JSON.stringify(resolvedData));
            report.resolvedOpsCount++;
            report.syncedOpsCount++;
          } else {
            // Quarantined due to MANUAL_REVIEW
            this.quarantinedRecords.set(key, {
              local: op.payload,
              server: serverRecord,
              reason: "Conflict strategy resolved to MANUAL_REVIEW quarantine.",
            });
            report.quarantinedOpsCount++;
          }
        }

        // Clean up from local storage offline queue backup
        await this.localProvider.removeItem(`offline_queue:${op.collection}:${op.recordId}`);
      } catch (err) {
        console.error(`[OfflineEngine] Failed to sync operation ${op.id}`, err);
        // Put back in queue to retry later
        this.offlineQueue.push(op);
        report.failedOpsCount++;
      }
    }

    return report;
  }

  /**
   * Resolves concurrent edits using specified strategies.
   */
  private resolveConflict(
    local: any,
    server: any,
    op: OfflineOperation,
    strategy: ConflictStrategy
  ): any | null {
    switch (strategy) {
      case "LAST_WRITE_WINS":
        // Last edit overrides completely
        return local;

      case "MERGE":
        // Combine records properties. Local edits overwrite server on conflicts.
        return {
          ...server,
          ...local,
          updatedAt: Date.now(),
        };

      case "VERSION_COMPARE":
        // Apply only if local version strictly exceeds server version (Optimistic Lock)
        const localVer = op.version || local.version || 0;
        const serverVer = server.version || 0;
        if (localVer > serverVer) {
          return { ...local, version: localVer };
        } else {
          // Reject local edit, keep server state intact
          return server;
        }

      case "MANUAL_REVIEW":
        // Quarantine the conflict, return null to pause write operation
        return null;

      default:
        // Default fallback to Last Write Wins
        return local;
    }
  }
}
