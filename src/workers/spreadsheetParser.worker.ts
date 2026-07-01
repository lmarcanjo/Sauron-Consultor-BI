/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as XLSX from "xlsx";

// Simple IndexedDB implementation inside the worker to avoid import bundling issues
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("SauronSpreadsheetDB", 2);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("dataset_rows")) {
        db.createObjectStore("dataset_rows");
      }
      if (!db.objectStoreNames.contains("dataset_metadata")) {
        db.createObjectStore("dataset_metadata");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function saveSheetRowsInIndexedDB(db: IDBDatabase, fileId: string, sheetName: string, rows: any[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("dataset_rows", "readwrite");
    const store = tx.objectStore("dataset_rows");
    
    rows.forEach((row, idx) => {
      const key = `${fileId}::${sheetName}::${idx}`;
      store.put(row, key);
    });

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function saveMetadataInIndexedDB(db: IDBDatabase, fileId: string, metadata: any): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("dataset_metadata", "readwrite");
    const store = tx.objectStore("dataset_metadata");
    store.put(metadata, fileId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

self.onmessage = async (e: MessageEvent) => {
  const { arrayBuffer, fileName, fileId } = e.data;

  try {
    // 1. Lendo arquivo
    self.postMessage({ status: "progress", message: "Lendo arquivo", percent: 10 });
    
    let processedBuffer = arrayBuffer;
    if (fileName.toLowerCase().endsWith(".csv")) {
      const text = new TextDecoder("utf-8").decode(arrayBuffer);
      if (text.includes(";") && !text.includes(",")) {
        const replaced = text.replace(/;/g, ",");
        processedBuffer = new TextEncoder().encode(replaced).buffer;
      }
    }

    const workbook = XLSX.read(processedBuffer, { type: "array" });
    
    // 2. Detectando colunas
    self.postMessage({ status: "progress", message: "Detectando colunas", percent: 30 });

    const db = await openDatabase();
    
    const sheetsMetadata: any[] = [];
    const allCleanedRows: any[] = [];
    
    for (let sIdx = 0; sIdx < workbook.SheetNames.length; sIdx++) {
      const sheetName = workbook.SheetNames[sIdx];
      const worksheet = workbook.Sheets[sheetName];
      const rawJson = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

      if (rawJson.length === 0) continue;

      // Extract unique columns
      const keysSet = new Set<string>();
      rawJson.forEach((row: any) => {
        Object.keys(row).forEach(k => keysSet.add(k));
      });
      const columns = Array.from(keysSet);

      // Clean and standardise rows
      const cleanedRows: any[] = [];
      
      const getNum = (v: any) => {
        if (v === undefined || v === null || v === "") return 0;
        if (typeof v === "number") return v;
        const sanit = String(v).replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, "");
        const parsed = parseFloat(sanit);
        return isNaN(parsed) ? 0 : parsed;
      };

      // 3. Salvando dados
      const totalRows = rawJson.length;
      self.postMessage({ 
        status: "progress", 
        message: `Processando ${sheetName} (${totalRows} linhas)`, 
        percent: 45 
      });

      rawJson.forEach((row: any, rIdx: number) => {
        const cleanRow: any = {
          id: `up_row_${Date.now()}_${sIdx}_${rIdx}`,
          arquivo: fileName,
          aba: sheetName,
          linha: rIdx + 2,
          coluna: columns.length,
          dataImportacao: new Date().toISOString(),
          usuario: "Lennon Marcanjo",
          ...row
        };
        cleanedRows.push(cleanRow);
      });

      allCleanedRows.push(...cleanedRows);

      self.postMessage({ 
        status: "progress", 
        message: `Salvando ${sheetName} no IndexedDB`, 
        percent: 60 + Math.round((sIdx / workbook.SheetNames.length) * 20) 
      });

      // Save to IndexedDB
      await saveSheetRowsInIndexedDB(db, fileId, sheetName, cleanedRows);

      // Create preview (first 100 lines)
      const previewRows = cleanedRows.slice(0, 100);

      sheetsMetadata.push({
        sheetName,
        rowCount: totalRows,
        columns,
        previewRows
      });
    }

    // 4. Gerando prévia
    self.postMessage({ status: "progress", message: "Gerando prévia", percent: 90 });

    const metadata = {
      id: fileId,
      fileName,
      sheets: sheetsMetadata,
      uploadedAt: new Date().toISOString()
    };

    await saveMetadataInIndexedDB(db, fileId, metadata);

    // 5. Concluído
    self.postMessage({ 
      status: "progress", 
      message: "Concluído", 
      percent: 100 
    });

    self.postMessage({
      status: "success",
      metadata,
      fullRows: allCleanedRows
    });

  } catch (error: any) {
    self.postMessage({
      status: "error",
      error: error.message || String(error)
    });
  }
};
