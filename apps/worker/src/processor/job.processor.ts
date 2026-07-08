/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { JobStatus } from "../../../../packages/shared-types";
import { JobContract } from "../contracts/job.contracts";
import { SpreadsheetImportHandler } from "../handlers/spreadsheet-import.handler";

/**
 * F5-III: BACKGROUND JOB PROCESSOR ENGINE
 * 
 * Simulates standard BullMQ job execution loops, handling retry count evaluation,
 * linear backoffs, and dead-letter queue (DLQ) isolation.
 */
export class JobProcessor {
  private deadLetterQueue: JobContract[] = [];
  private readonly spreadsheetImportHandler = new SpreadsheetImportHandler();
  
  // Enterprise default retry limits
  private readonly defaultMaxAttempts = 3;
  private readonly defaultBackoffDelayMs = 1000;

  /**
   * Router representing the routing logic of workers.
   */
  public async processJob(job: JobContract): Promise<JobContract> {
    const { name } = job;
    console.log(`[Sauron Worker] Processing job [${job.metadata.jobId}] of type '${name}' (Attempt ${job.metadata.attempt}/${this.defaultMaxAttempts})`);

    try {
      job.status = JobStatus.PROCESSING;

      // Routing placeholders
      switch (name) {
        case "spreadsheet.import":
          job.result = await this.spreadsheetImportHandler.handle(job as any);
          break;
        case "story.export":
          job.result = { downloadUrl: "https://sauron.com/exports/story_777.pdf", fileSizeInBytes: 154200 };
          break;
        case "compensation.generate":
          job.result = { payoutsCalculatedCount: 15, totalVolumeLocalCurrency: 450000.0 };
          break;
        case "meeting.summary":
          job.result = { summaryParagraph: "Alinhamento concluído sobre redução de headcount.", keyActionItemsCount: 3 };
          break;
        case "data.sync":
          job.result = { syncedKeys: ["tenant_1", "workspace_A"], durationMs: 230 };
          break;
        default:
          throw new Error(`Unsupported job contract target: ${name}`);
      }

      job.status = JobStatus.COMPLETED;
      console.log(`[Sauron Worker] Job [${job.metadata.jobId}] completed successfully.`);
      return job;

    } catch (err: any) {
      console.error(`[Sauron Worker] Job [${job.metadata.jobId}] failed during attempt ${job.metadata.attempt}: ${err.message}`);
      
      // Check for retry limit
      if (job.metadata.attempt < this.defaultMaxAttempts) {
        job.metadata.attempt++;
        // Apply backoff wait
        const backoffTime = this.defaultBackoffDelayMs * Math.pow(2, job.metadata.attempt - 2);
        console.log(`[Sauron Worker] Scheduling retry in ${backoffTime}ms...`);
        job.status = JobStatus.PENDING;
        return this.processJob(job);
      } else {
        // Terminal failure: send to DLQ
        job.status = JobStatus.FAILED;
        job.error = err.message || "Terminal failure";
        this.quarantineJob(job);
        return job;
      }
    }
  }

  private quarantineJob(job: JobContract): void {
    console.error(`[CRITICAL DLQ] Job [${job.metadata.jobId}] exceeded maximum attempts. Quarantined in Dead-Letter Queue.`);
    job.status = JobStatus.QUARANTINED;
    this.deadLetterQueue.push(job);
  }

  public getQuarantinedJobs(): JobContract[] {
    return this.deadLetterQueue;
  }

  public clearDLQ(): void {
    this.deadLetterQueue = [];
  }
}
