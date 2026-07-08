"use strict";
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerHealthMonitor = void 0;
/**
 * Worker node observability metrics tracker.
 */
class WorkerHealthMonitor {
    redisUrl;
    startTime = Date.now();
    constructor(redisUrl) {
        this.redisUrl = redisUrl;
    }
    getHealthReport(activeJobs, quarantinedCount) {
        // Basic connectivity simulation
        const redisConnected = this.redisUrl.startsWith("redis://");
        const status = redisConnected ? "OK" : "ERROR";
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
exports.WorkerHealthMonitor = WorkerHealthMonitor;
//# sourceMappingURL=worker-health.js.map