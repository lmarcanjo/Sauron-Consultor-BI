/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ActiveDataSource, ColumnProfile, ImportProfile } from "../../types/dataSource";

export interface ActiveDatasetRow {
  raw: Record<string, any>;
  normalized?: Record<string, any>;
  metadata: {
    rowIndex: number;
    sheetName: string;
    fileName: string;
  };
}

export interface ActiveDataset {
  datasetId: string;
  sourceType: ActiveDataSource;
  sourceName: string;
  importedAt: string;
  rowCount: number;
  columnCount: number;
  sheets: string[];
  activeSheet: string;
  previewRows: ActiveDatasetRow[];
  columnProfiles: ColumnProfile[];
  importProfile: ImportProfile | null;
  rawStorageRef: string;
  status: "ACTIVE" | "PENDING";
}
