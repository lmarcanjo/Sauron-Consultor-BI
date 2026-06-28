/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { IUnitOfWork } from "./UnitOfWork";

/**
 * Standard transaction isolation rules supported by Sauron DB adapters.
 */
export type TransactionIsolationLevel =
  | "READ_UNCOMMITTED"
  | "READ_COMMITTED"
  | "REPEATABLE_READ"
  | "SERIALIZABLE";

/**
 * Transaction propagation options to handle nested or required operations.
 */
export type TransactionPropagation =
  | "REQUIRED"       // Join active transaction if exists, create new one if not
  | "REQUIRES_NEW"   // Always spawn a brand new isolated transaction
  | "SUPPORTS"       // Execute without transaction if none exists, else join
  | "NEVER";         // Explicitly error if called inside an active transaction

/**
 * Metadata configuration for spawning transactions.
 */
export interface TransactionOptions {
  isolationLevel?: TransactionIsolationLevel;
  propagation?: TransactionPropagation;
  timeoutMs?: number;
  readOnly?: boolean;
}

/**
 * F4-D: TRANSACTION MANAGER SPECIFICATION
 * 
 * Provides structural abstractions for managing atomic database boundaries.
 * Isolates business services from native SQL 'BEGIN'/'COMMIT' syntax.
 */
export interface ITransactionManager {
  /**
   * Executes a block of operations safely within an atomic transaction context.
   * Auto-commits on successful completion, and auto-rolls back on throws.
   */
  executeInTransaction<T>(
    operation: (uow: IUnitOfWork) => Promise<T>,
    options?: TransactionOptions
  ): Promise<T>;

  /**
   * Returns the current active transaction context or active Unit of Work.
   */
  getCurrentUnitOfWork(): IUnitOfWork | null;
}

/**
 * Abstract realization of the Transaction Orchestrator.
 */
export class TransactionManager implements ITransactionManager {
  constructor(private defaultUow: IUnitOfWork) {}

  public async executeInTransaction<T>(
    operation: (uow: IUnitOfWork) => Promise<T>,
    options: TransactionOptions = { propagation: "REQUIRED", isolationLevel: "READ_COMMITTED" }
  ): Promise<T> {
    const uow = this.defaultUow;
    const isAlreadyActive = uow.isTransactionActive();

    console.log(
      `[TransactionManager] Initiating transaction boundary. Propagation: ${options.propagation}, Isolation: ${options.isolationLevel}`
    );

    if (options.propagation === "NEVER" && isAlreadyActive) {
      throw new Error("TransactionManager error: Active transaction detected under PROPAGATION=NEVER.");
    }

    // Determine if we should begin a new transaction or reuse the active one
    const shouldSpawnNew = !isAlreadyActive || options.propagation === "REQUIRES_NEW";

    if (shouldSpawnNew) {
      await uow.begin();
    }

    try {
      // Execute the callback passing the UoW unit
      const result = await operation(uow);

      if (shouldSpawnNew) {
        await uow.commit({ userId: "system_tx", correlationId: "tx_managed" });
      }

      return result;
    } catch (err) {
      if (shouldSpawnNew) {
        console.warn("[TransactionManager] Rollback cascade triggered inside managed transaction.");
        await uow.rollback();
      }
      throw err;
    }
  }

  public getCurrentUnitOfWork(): IUnitOfWork | null {
    return this.defaultUow.isTransactionActive() ? this.defaultUow : null;
  }
}
