/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PreliminaryDatasetReader, PreliminaryDatasetSnapshot } from "../../core/preliminary-analysis/PreliminaryDatasetReader";
import { spreadsheetStorageAdapter } from "../../core/storage/IndexedSpreadsheetStorageAdapter";

export class SpreadsheetPreliminaryDatasetReader implements PreliminaryDatasetReader {
  public async readDataset(input: {
    workbookId: string;
    containerId: string;
    dataSourceId: string;
  }): Promise<PreliminaryDatasetSnapshot> {
    const metadata = await spreadsheetStorageAdapter.getMetadata(input.workbookId);
    if (!metadata) {
      throw new Error(`Planilha metadata com ID ${input.workbookId} não encontrada.`);
    }

    const sheetMeta = metadata.sheets.find(s => s.sheetName === input.containerId);
    if (!sheetMeta) {
      throw new Error(`Aba ${input.containerId} não encontrada na planilha.`);
    }

    // Fetch all rows for the sheet
    const rows = await spreadsheetStorageAdapter.getRowsPaged(input.workbookId, input.containerId, 0, 999999);

    const columns = sheetMeta.columns && sheetMeta.columns.length > 0
      ? sheetMeta.columns
      : (rows.length > 0 ? Object.keys(rows[0]).filter(k => !k.startsWith("__")) : []);

    return {
      columns,
      rows,
      fileName: metadata.fileName,
      fingerprint: `${metadata.fileName}_${metadata.uploadedAt}`,
      rowCount: sheetMeta.rowCount || 0,
      columnCount: columns.length,
    };
  }
}
