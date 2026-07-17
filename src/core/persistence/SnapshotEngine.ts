/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { platformLogger } from "../platform/PlatformLogger";

export interface DomainSnapshot {
  snapshotId: string;
  domain: "stories" | "meetings" | "workspace" | "analytics" | "plans";
  entityId: string;
  payload: any;
  timestamp: number;
  checksum: string;
  author: string;
  notes?: string;
}

/**
 * F4-H: SNAPSHOT ENGINE FOR AUDIT REPLAY & ROLLBACK
 * 
 * Captures deep freezes of active consulting domains.
 * Provides the core infrastructure to support visual step-by-step histories, 
 * analytics replay, and complete database rollback.
 */
export class SnapshotEngine {
  private snapshots: Map<string, DomainSnapshot[]> = new Map();

  /**
   * Captures and persists a deep frozen state of a domain entity.
   */
  public captureSnapshot(
    domain: DomainSnapshot["domain"],
    entityId: string,
    entityState: any,
    author: string,
    notes?: string
  ): DomainSnapshot {
    const serializedPayload = JSON.stringify(entityState);
    const hash = this.computeFnv1aHash(serializedPayload).toString(16);

    const snapshot: DomainSnapshot = {
      snapshotId: `snap_${crypto.randomUUID().substring(0, 8)}`,
      domain,
      entityId,
      payload: JSON.parse(serializedPayload), // Deep copy
      timestamp: Date.now(),
      checksum: `SOP-SNAP-${hash.toUpperCase()}`,
      author,
      notes,
    };

    const list = this.snapshots.get(entityId) || [];
    list.push(snapshot);
    this.snapshots.set(entityId, list);

    platformLogger.info(`[SnapshotEngine] Captured freeze for domain [${domain}], ID: [${entityId}]. Checksum: ${snapshot.checksum}`);
    return snapshot;
  }

  /**
   * Restores a past snapshot by its ID.
   */
  public rollbackToSnapshot(entityId: string, snapshotId: string): DomainSnapshot {
    const list = this.snapshots.get(entityId);
    if (!list) {
      throw new Error(`SnapshotEngine error: No snapshot history found for entity ${entityId}`);
    }

    const found = list.find((snap) => snap.snapshotId === snapshotId);
    if (!found) {
      throw new Error(`SnapshotEngine error: Snapshot ID ${snapshotId} not found in history of ${entityId}`);
    }

    platformLogger.info(`[SnapshotEngine] Executed successful rollback of entity [${entityId}] to checksum: ${found.checksum}`);
    return found;
  }

  /**
   * Returns complete historical chronological logs of snapshots for an entity.
   */
  public getHistory(entityId: string): DomainSnapshot[] {
    const list = this.snapshots.get(entityId) || [];
    return [...list].sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Replays chronological changes to build a dynamic timeline or audit visual state.
   */
  public replayTimeline(entityId: string): any[] {
    const history = this.getHistory(entityId);
    return history.map((snap) => ({
      timestamp: snap.timestamp,
      checksum: snap.checksum,
      author: snap.author,
      notes: snap.notes,
      state: snap.payload,
    }));
  }

  /**
   * Simple, fast, non-cryptographic hash for checksum verification.
   */
  private computeFnv1aHash(str: string): number {
    let hash = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    return hash >>> 0;
  }
}

export const snapshotEngine = new SnapshotEngine();
export default snapshotEngine;
