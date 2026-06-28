/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HealthStatus } from "../../../../packages/shared-types";

export interface WorkerHealthReport {
  status: HealthStatus;
  redisConnected: boolean;
  activeJobs: number;
  quarantinedJobsCount: number;
  uptimeSeconds: number;
  timestamp: string;
}

/**
 * Worker node observability metrics tracker.
 */
export class WorkerHealthMonitor {
  private startTime = Date.now();

  constructor(private redisUrl: string) {}

  public getHealthReport(activeJobs: number, quarantinedCount: number): WorkerHealthReport {
    // Basic connectivity simulation
    const redisConnected = this.redisUrl.startsWith("redis://");
    const status: HealthStatus = redisConnected ? "OK" : "ERROR";

    return {
      status,
      redisConnected,
      activeJobs,
      quarantinedJobsCount: quarantinedCount,
      uptimeSeconds: parseFloat(((Date.now() - this.startTime) / 1000).toFixed(2)),
      timestamp: new Date().toISOString(),
    };
  }
}
