import { SpreadsheetStoragePort } from "./SpreadsheetStoragePort";
import { IndexedSpreadsheetStorage, DatasetMetadata } from "./IndexedSpreadsheetStorage";

export class IndexedSpreadsheetStorageAdapter implements SpreadsheetStoragePort {
  async getMetadata(datasetId: string): Promise<DatasetMetadata | null> {
    return IndexedSpreadsheetStorage.getMetadata(datasetId);
  }

  async getRowsPaged(datasetId: string, sheetName: string, page: number, pageSize: number): Promise<any[]> {
    return IndexedSpreadsheetStorage.getRowsPaged(datasetId, sheetName, page, pageSize);
  }

  async getRows(datasetId: string): Promise<any[]> {
    return IndexedSpreadsheetStorage.getRows(datasetId);
  }

  async saveRows(datasetId: string, rows: any[]): Promise<void> {
    return IndexedSpreadsheetStorage.saveRows(datasetId, rows);
  }

  async deleteRows(datasetId: string): Promise<void> {
    return IndexedSpreadsheetStorage.deleteRows(datasetId);
  }

  async deleteMetadata(datasetId: string): Promise<void> {
    return IndexedSpreadsheetStorage.deleteMetadata(datasetId);
  }

  async hasMetadata(datasetId: string): Promise<boolean> {
    const meta = await IndexedSpreadsheetStorage.getMetadata(datasetId);
    return meta !== null;
  }

  async hasRows(datasetId: string, sheetName: string): Promise<boolean> {
    const preview = await IndexedSpreadsheetStorage.getRowsPaged(datasetId, sheetName, 0, 1);
    return preview && preview.length > 0;
  }

  async getRowCount(datasetId: string): Promise<number> {
    const meta = await IndexedSpreadsheetStorage.getMetadata(datasetId);
    if (!meta || !meta.sheets) return 0;
    return meta.sheets.reduce((sum, s) => sum + (s.rowCount || 0), 0);
  }

  async getPreviewPaged(datasetId: string, sheetName: string, pageSize: number = 1): Promise<any[]> {
    return IndexedSpreadsheetStorage.getRowsPaged(datasetId, sheetName, 0, pageSize);
  }
}

export const spreadsheetStorageAdapter: SpreadsheetStoragePort = new IndexedSpreadsheetStorageAdapter();
