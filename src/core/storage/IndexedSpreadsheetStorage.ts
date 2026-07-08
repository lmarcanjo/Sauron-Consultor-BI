/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DatasetMetadata {
  id: string;
  fileName: string;
  sheets: {
    sheetName: string;
    rowCount: number;
    columns: string[];
    previewRows: any[];
  }[];
  uploadedAt: string;
}

export class IndexedSpreadsheetStorage {
  private static DB_NAME = "SauronSpreadsheetDB";
  private static STORE_NAME = "sheetsData"; // Deprecated but kept for safety
  private static ROWS_STORE = "dataset_rows";
  private static METADATA_STORE = "dataset_metadata";
  private static DB_VERSION = 2;

  private static getDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (typeof indexedDB === "undefined") {
        reject(new Error("IndexedDB is not supported in this environment"));
        return;
      }
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
      request.onupgradeneeded = (event) => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME);
        }
        if (!db.objectStoreNames.contains(this.ROWS_STORE)) {
          db.createObjectStore(this.ROWS_STORE);
        }
        if (!db.objectStoreNames.contains(this.METADATA_STORE)) {
          db.createObjectStore(this.METADATA_STORE);
        }
      };
      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // Backward compatibility: Save all rows
  public static async saveRows(fileId: string, rows: any[]): Promise<void> {
    try {
      const db = await this.getDB();
      // Also save in ROWS_STORE individually or in chunks
      const tx = db.transaction([this.ROWS_STORE, this.STORE_NAME], "readwrite");
      
      // Legacy store
      tx.objectStore(this.STORE_NAME).put(rows, fileId);
      
      // New granular rows store
      const rowsStore = tx.objectStore(this.ROWS_STORE);
      
      // Delete existing rows for this fileId first to avoid orphans
      const deleteRange = IDBKeyRange.bound(`${fileId}::`, `${fileId}::\uffff`);
      // We'll delete them sequentially in transaction if we can, or just overwrite since we know the index.
      // To be safe, put each row. We assume rows have 'aba' sheet name.
      rows.forEach((row, index) => {
        const sheetName = row.aba || "Planilha Importada";
        const key = `${fileId}::${sheetName}::${index}`;
        rowsStore.put(row, key);
      });

      return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (err) {
      console.error("[IndexedSpreadsheetStorage] Error saving rows:", err);
      throw err;
    }
  }

  // Save specific sheet rows in chunks/batches
  public static async saveSheetRows(fileId: string, sheetName: string, rows: any[]): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(this.ROWS_STORE, "readwrite");
      const store = tx.objectStore(this.ROWS_STORE);
      
      rows.forEach((row, index) => {
        const key = `${fileId}::${sheetName}::${index}`;
        store.put(row, key);
      });

      return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (err) {
      console.error("[IndexedSpreadsheetStorage] Error saving sheet rows:", err);
      throw err;
    }
  }

  // Get rows for a file id (loads everything matching the prefix)
  public static async getRows(fileId: string): Promise<any[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(this.ROWS_STORE, "readonly");
        const store = tx.objectStore(this.ROWS_STORE);
        const range = IDBKeyRange.bound(`${fileId}::`, `${fileId}::\uffff`);
        const request = store.openCursor(range);
        const results: any[] = [];
        request.onsuccess = () => {
          const cursor = request.result;
          if (cursor) {
            results.push(cursor.value);
            cursor.continue();
          } else {
            resolve(results);
          }
        };
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.error("[IndexedSpreadsheetStorage] Error getting rows:", err);
      return [];
    }
  }

  // Get paged rows for a specific dataset/file and sheet
  public static async getRowsPaged(
    fileId: string,
    sheetName: string,
    offset: number,
    limit: number
  ): Promise<any[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(this.ROWS_STORE, "readonly");
        const store = tx.objectStore(this.ROWS_STORE);
        const range = IDBKeyRange.bound(
          `${fileId}::${sheetName}::0`,
          `${fileId}::${sheetName}::\uffff`
        );
        const request = store.openCursor(range);
        const results: any[] = [];
        let hasSkipped = false;
        let count = 0;

        request.onsuccess = () => {
          const cursor = request.result;
          if (!cursor) {
            resolve(results);
            return;
          }

          if (!hasSkipped && offset > 0) {
            hasSkipped = true;
            cursor.advance(offset);
            return;
          }

          results.push(cursor.value);
          count++;

          if (count < limit) {
            cursor.continue();
          } else {
            resolve(results);
          }
        };
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.error("[IndexedSpreadsheetStorage] Error getting paged rows:", err);
      return [];
    }
  }

  // Count rows in a sheet
  public static async getRowCount(fileId: string, sheetName: string): Promise<number> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(this.ROWS_STORE, "readonly");
        const store = tx.objectStore(this.ROWS_STORE);
        const range = IDBKeyRange.bound(
          `${fileId}::${sheetName}::0`,
          `${fileId}::${sheetName}::\uffff`
        );
        const request = store.count(range);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.error("[IndexedSpreadsheetStorage] Error counting rows:", err);
      return 0;
    }
  }

  // Delete all dataset records
  public static async deleteRows(fileId: string): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction([this.ROWS_STORE, this.STORE_NAME, this.METADATA_STORE], "readwrite");
      
      // Delete legacy
      tx.objectStore(this.STORE_NAME).delete(fileId);
      // Delete metadata
      tx.objectStore(this.METADATA_STORE).delete(fileId);

      // Delete rows matching prefix
      const rowsStore = tx.objectStore(this.ROWS_STORE);
      const range = IDBKeyRange.bound(`${fileId}::`, `${fileId}::\uffff`);
      const cursorRequest = rowsStore.openCursor(range);
      cursorRequest.onsuccess = () => {
        const cursor = cursorRequest.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };

      return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (err) {
      console.error("[IndexedSpreadsheetStorage] Error deleting rows:", err);
    }
  }

  // Save metadata
  public static async saveMetadata(fileId: string, metadata: DatasetMetadata): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(this.METADATA_STORE, "readwrite");
        const store = tx.objectStore(this.METADATA_STORE);
        const request = store.put(metadata, fileId);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.error("[IndexedSpreadsheetStorage] Error saving metadata:", err);
    }
  }

  // Get metadata
  public static async getMetadata(fileId: string): Promise<DatasetMetadata | null> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(this.METADATA_STORE, "readonly");
        const store = tx.objectStore(this.METADATA_STORE);
        const request = store.get(fileId);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.error("[IndexedSpreadsheetStorage] Error getting metadata:", err);
      return null;
    }
  }

  // List all datasets metadata
  public static async listDatasets(): Promise<DatasetMetadata[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(this.METADATA_STORE, "readonly");
        const store = tx.objectStore(this.METADATA_STORE);
        const request = store.openCursor();
        const results: DatasetMetadata[] = [];
        request.onsuccess = () => {
          const cursor = request.result;
          if (cursor) {
            results.push(cursor.value);
            cursor.continue();
          } else {
            resolve(results);
          }
        };
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.error("[IndexedSpreadsheetStorage] Error listing datasets:", err);
      return [];
    }
  }

  public static async clearAll(): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction([this.STORE_NAME, this.ROWS_STORE, this.METADATA_STORE], "readwrite");
        tx.objectStore(this.STORE_NAME).clear();
        tx.objectStore(this.ROWS_STORE).clear();
        tx.objectStore(this.METADATA_STORE).clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (err) {
      console.error("[IndexedSpreadsheetStorage] Error clearing all:", err);
    }
  }
}
