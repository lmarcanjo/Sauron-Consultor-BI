import { DatasetMetadata } from "./IndexedSpreadsheetStorage";

export interface SpreadsheetStoragePort {
  getMetadata(datasetId: string): Promise<DatasetMetadata | null>;
  getRowsPaged(datasetId: string, sheetName: string, page: number, pageSize: number): Promise<any[]>;
  getRows(datasetId: string): Promise<any[]>;
  saveRows(datasetId: string, rows: any[]): Promise<void>;
  deleteRows(datasetId: string): Promise<void>;
  deleteMetadata(datasetId: string): Promise<void>;
  
  // Lightweight validation methods
  hasMetadata(datasetId: string): Promise<boolean>;
  hasRows(datasetId: string, sheetName: string): Promise<boolean>;
  getRowCount(datasetId: string): Promise<number>;
  getPreviewPaged(datasetId: string, sheetName: string, pageSize?: number): Promise<any[]>;
}
