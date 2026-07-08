/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PersistenceMetrics {
  totalReadOps: number;
  totalWriteOps: number;
  averageReadLatencyMs: number;
  averageWriteLatencyMs: number;
  cacheHits: number;
  cacheMisses: number;
  rollbacksTriggered: number;
  retriesAttempted: number;
  syncJobsExecuted: number;
}

/**
 * F4-I: PERSISTENCE TELEMETRY & OBSERVABILITY ENGINE
 * 
 * Records precise microseconds of I/O operations, providing comprehensive health metrics.
 */
export class PersistenceObservability {
  private readLatencies: number[] = [];
  private writeLatencies: number[] = [];
  
  private cacheHits = 0;
  private cacheMisses = 0;
  private rollbacks = 0;
  private retries = 0;
  private syncJobs = 0;
  private readCount = 0;
  private writeCount = 0;

  /**
   * Tracks latency of a low-level query or retrieval operation.
   */
  public recordRead(latencyMs: number): void {
    this.readCount++;
    this.readLatencies.push(latencyMs);
    // Maintain rolling buffer of last 500 samples
    if (this.readLatencies.length > 500) {
      this.readLatencies.shift();
    }
  }

  /**
   * Tracks latency of a write or database commit operation.
   */
  public recordWrite(latencyMs: number): void {
    this.writeCount++;
    this.writeLatencies.push(latencyMs);
    if (this.writeLatencies.length > 500) {
      this.writeLatencies.shift();
    }
  }

  public recordCacheHit(): void {
    this.cacheHits++;
  }

  public recordCacheMiss(): void {
    this.cacheMisses++;
  }

  public recordRollback(): void {
    this.rollbacks++;
  }

  public recordRetry(): void {
    this.retries++;
  }

  public recordSyncJob(): void {
    this.syncJobs++;
  }

  /**
   * Returns compiled health indicators for observatory visualizations.
   */
  public getMetrics(): PersistenceMetrics {
    const avgRead = this.readLatencies.length > 0 
      ? this.readLatencies.reduce((a, b) => a + b, 0) / this.readLatencies.length 
      : 0;

    const avgWrite = this.writeLatencies.length > 0 
      ? this.writeLatencies.reduce((a, b) => a + b, 0) / this.writeLatencies.length 
      : 0;

    return {
      totalReadOps: this.readCount,
      totalWriteOps: this.writeCount,
      averageReadLatencyMs: parseFloat(avgRead.toFixed(2)),
      averageWriteLatencyMs: parseFloat(avgWrite.toFixed(2)),
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
      rollbacksTriggered: this.rollbacks,
      retriesAttempted: this.retries,
      syncJobsExecuted: this.syncJobs,
    };
  }

  public clear(): void {
    this.readLatencies = [];
    this.writeLatencies = [];
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.rollbacks = 0;
    this.retries = 0;
    this.syncJobs = 0;
    this.readCount = 0;
    this.writeCount = 0;
  }
}

export const persistenceObservability = new PersistenceObservability();
export default persistenceObservability;
