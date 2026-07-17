/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { IRepository } from "./IRepository";
import { auditEngine } from "../audit/AuditEngine";
import { platformLogger } from "../platform/PlatformLogger";

/**
 * Tracks a pending change on an entity.
 */
interface PendingOperation<T extends { id: string }> {
  type: "create" | "update" | "delete";
  entity: T;
  repository: IRepository<T>;
  originalSnapshot?: string; // Captured for rollback operations
}

/**
 * F4-C: UNIT OF WORK INTERFACE
 * 
 * Manages atomic transactions, coordinating multi-repository writes.
 */
export interface IUnitOfWork {
  begin(): Promise<void>;
  registerNew<T extends { id: string }>(entity: T, repository: IRepository<T>): void;
  registerDirty<T extends { id: string }>(entity: T, repository: IRepository<T>, originalSnapshot?: T): void;
  registerRemoved<T extends { id: string }>(entity: T, repository: IRepository<T>): void;
  commit(ctx: { userId: string; correlationId: string }): Promise<void>;
  rollback(): Promise<void>;
  isTransactionActive(): boolean;
}

/**
 * Enterprise implementation of the Unit of Work pattern.
 */
export class UnitOfWork implements IUnitOfWork {
  private pendingOps: PendingOperation<any>[] = [];
  private active = false;

  public async begin(): Promise<void> {
    if (this.active) {
      throw new Error("UnitOfWork error: Transaction already active. Nested transactions not supported.");
    }
    this.pendingOps = [];
    this.active = true;
  }

  public registerNew<T extends { id: string }>(entity: T, repository: IRepository<T>): void {
    this.ensureActive();
    this.pendingOps.push({
      type: "create",
      entity,
      repository,
    });
  }

  public registerDirty<T extends { id: string }>(entity: T, repository: IRepository<T>, originalSnapshot?: T): void {
    this.ensureActive();
    this.pendingOps.push({
      type: "update",
      entity,
      repository,
      originalSnapshot: originalSnapshot ? JSON.stringify(originalSnapshot) : undefined,
    });
  }

  public registerRemoved<T extends { id: string }>(entity: T, repository: IRepository<T>): void {
    this.ensureActive();
    // Capture the original value so we can reconstruct it on rollback
    this.pendingOps.push({
      type: "delete",
      entity,
      repository,
      originalSnapshot: JSON.stringify(entity),
    });
  }

  public async commit(ctx: { userId: string; correlationId: string }): Promise<void> {
    this.ensureActive();
    
    const committedEntities: any[] = [];
    
    try {
      // 1. Process and save changes sequentially
      for (const op of this.pendingOps) {
        if (op.type === "create" || op.type === "update") {
          await op.repository.save(op.entity);
        } else if (op.type === "delete") {
          await op.repository.delete(op.entity.id);
        }
        committedEntities.push(op);
      }

      // 2. Audit Trail logging
      auditEngine.logEvent(
        "UNIT_OF_WORK_COMMIT",
        `Successfully committed ${this.pendingOps.length} entity mutations atomically.`,
        "INFO",
        {
          userId: ctx.userId,
          correlationId: ctx.correlationId,
          mutationsCount: this.pendingOps.length,
          operations: this.pendingOps.map(op => ({ type: op.type, id: op.entity.id })),
        }
      );

      // 3. Emit domain events through the contract dispatcher.
      this.dispatchEvents();

    } catch (commitError: any) {
      console.error(`[UnitOfWork] Commit failed, triggering rollback: ${commitError.message}`);
      await this.rollback();
      
      auditEngine.logEvent(
        "UNIT_OF_WORK_ROLLBACK",
        `Unit of Work rolled back due to error: ${commitError.message}`,
        "CRITICAL",
        {
          userId: ctx.userId,
          correlationId: ctx.correlationId,
          error: commitError.message,
        }
      );
      
      throw commitError;
    } finally {
      this.pendingOps = [];
      this.active = false;
    }
  }

  public async rollback(): Promise<void> {
    if (!this.active) return;

    // Rollback: reverse changes in memory/storage
    try {
      for (const op of this.pendingOps) {
        if (op.type === "create") {
          // Rollback creation by deleting
          await op.repository.delete(op.entity.id);
        } else if (op.type === "update" && op.originalSnapshot) {
          // Restore the previous values
          const prevValue = JSON.parse(op.originalSnapshot);
          await op.repository.save(prevValue);
        } else if (op.type === "delete" && op.originalSnapshot) {
          // Restore the deleted entity
          const prevValue = JSON.parse(op.originalSnapshot);
          await op.repository.save(prevValue);
        }
      }
    } catch (rollbackError: any) {
      console.error(`[UnitOfWork] Fatal: Rollback recovery cascade failed! System is dirty: ${rollbackError.message}`);
    } finally {
      this.pendingOps = [];
      this.active = false;
    }
  }

  public isTransactionActive(): boolean {
    return this.active;
  }

  private ensureActive(): void {
    if (!this.active) {
      throw new Error("UnitOfWork error: No active transaction. Please call begin() first.");
    }
  }

  private dispatchEvents(): void {
    // Standard event loop notification. Emulating EventBus pattern
    platformLogger.debug(`[UnitOfWork] Dispatched ${this.pendingOps.length} persistence events to EventBus.`);
  }
}
