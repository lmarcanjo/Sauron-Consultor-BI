/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { JobStatus } from "../../../../packages/shared-types";

export interface JobMetadata {
  jobId: string;
  tenantId: string;
  triggeredBy: string;
  createdAt: string;
  correlationId: string;
  attempt: number;
}

export interface JobContract<TPayload = any, TResult = any> {
  name: string;
  payload: TPayload;
  metadata: JobMetadata;
  status: JobStatus;
  result?: TResult;
  error?: string;
}

// 1. spreadsheet.import
export interface SpreadsheetImportPayload {
  fileKey: string;
  sheetName: string;
  targetWorkspaceId: string;
}

export interface SpreadsheetImportResult {
  recordsImported: number;
  metadataExtracted: boolean;
  previewGenerated: boolean;
  chunksSaved: number;
  formulaCount: number;
  warnings: string[];
}

// 2. story.export
export interface StoryExportPayload {
  storyId: string;
  format: "pdf" | "xlsx" | "json";
}

export interface StoryExportResult {
  downloadUrl: string;
  fileSizeInBytes: number;
}

// 3. compensation.generate
export interface CompensationGeneratePayload {
  periodId: string;
  targetRoleIds: string[];
}

export interface CompensationGenerateResult {
  payoutsCalculatedCount: number;
  totalVolumeLocalCurrency: number;
}

// 4. meeting.summary
export interface MeetingSummaryPayload {
  meetingId: string;
  includeTranscripts: boolean;
}

export interface MeetingSummaryResult {
  summaryParagraph: string;
  keyActionItemsCount: number;
}

// 5. data.sync
export interface DataSyncPayload {
  syncScope: "metadata" | "all";
  forceFullReload: boolean;
}

export interface DataSyncResult {
  syncedKeys: string[];
  durationMs: number;
}
