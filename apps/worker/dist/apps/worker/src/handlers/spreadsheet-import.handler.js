"use strict";
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpreadsheetImportHandler = void 0;
class SpreadsheetImportHandler {
    async handle(job) {
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
exports.SpreadsheetImportHandler = SpreadsheetImportHandler;
//# sourceMappingURL=spreadsheet-import.handler.js.map