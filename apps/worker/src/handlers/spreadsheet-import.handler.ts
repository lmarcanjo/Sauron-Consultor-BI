/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { JobContract, SpreadsheetImportPayload, SpreadsheetImportResult } from "../contracts/job.contracts";

export class SpreadsheetImportHandler {
  async handle(job: JobContract<SpreadsheetImportPayload, SpreadsheetImportResult>): Promise<SpreadsheetImportResult> {
    console.log(`[Sauron Worker] spreadsheet.import skeleton received fileKey=${job.payload.fileKey}`);

    return {
      recordsImported: 0,
      metadataExtracted: false,
      previewGenerated: false,
      chunksSaved: 0,
      formulaCount: 0,
      warnings: [
        "Worker skeleton ready: extraction, chunk persistence, preview generation and formula registry are pending infrastructure wiring.",
      ],
    };
  }
}
