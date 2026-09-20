/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PreliminaryDatasetSnapshot {
  columns: string[];
  rows: any[];
  fileName: string;
  fingerprint: string;
  rowCount: number;
  columnCount: number;
}

export interface PreliminaryDatasetReader {
  readDataset(input: {
    workbookId: string;
    containerId: string;
    dataSourceId: string;
  }): Promise<PreliminaryDatasetSnapshot>;
}
