"use strict";
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.bootstrapWorker = bootstrapWorker;
const worker_health_1 = require("./health/worker-health");
const job_processor_1 = require("./processor/job.processor");
/**
 * Main worker loop bootstrapper.
 */
async function bootstrapWorker() {
    console.log("[Sauron Worker] Initializing BullMQ background listeners...");
    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379/0";
    const monitor = new worker_health_1.WorkerHealthMonitor(redisUrl);
    const processor = new job_processor_1.JobProcessor();
    console.log(`[Sauron Worker] Connected to Redis instance: ${redisUrl}`);
    console.log("[Sauron Worker] Listening for background queues: spreadsheet.import, story.export, compensation.generate, meeting.summary, data.sync");
    return { monitor, processor };
}
// Support executing directly via CLI (tsx apps/worker/src/main.ts)
if (typeof require !== "undefined" && require.main === module) {
    bootstrapWorker().catch((err) => {
        console.error("[Sauron Worker] Critical worker failure:", err);
        process.exit(1);
    });
}
//# sourceMappingURL=main.js.map