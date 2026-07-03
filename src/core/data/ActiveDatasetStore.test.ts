/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { activeDatasetStore, ActiveDatasetStore } from "./ActiveDatasetStore";
import { ActiveDataset } from "../../types/dataSource";

// Standard key-value storage mock for Node.js headless testing
let store: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => store[key] || null,
  setItem: (key: string, value: string) => { store[key] = value.toString(); },
  clear: () => { store = {}; },
  removeItem: (key: string) => { delete store[key]; }
};

vi.stubGlobal("localStorage", localStorageMock);

describe("Sauron Active Dataset Store (F6 Bus) Test Suite", () => {
  beforeEach(() => {
    localStorage.clear();
    activeDatasetStore.clearActiveDataset();
  });

  it("should enforce a unique singleton instance", () => {
    const instanceA = ActiveDatasetStore.getInstance();
    const instanceB = ActiveDatasetStore.getInstance();
    expect(instanceA).toBe(instanceB);
    expect(instanceA).toBe(activeDatasetStore);
  });

  it("should successfully set an active dataset and notify subscribers", () => {
    const mockDataset: ActiveDataset = {
      datasetId: "ds_123",
      sourceType: "SPREADSHEET_DATA",
      sourceName: "Financeiro_Maio.xlsx",
      rowCount: 10,
      columnCount: 5,
      importedAt: new Date().toISOString(),
      sheets: ["Aba_Principal"],
      activeSheet: "Aba_Principal",
      previewRows: [
        { 
          raw: { Receita: 1000, Mês: "Maio" },
          metadata: { rowIndex: 0, sheetName: "Aba_Principal", fileName: "Financeiro_Maio.xlsx" }
        }
      ],
      columnProfiles: [],
      importProfile: null,
      rawStorageRef: "ref_123",
      status: "ACTIVE"
    };

    let receivedEvent: any = null;
    const unsubscribe = activeDatasetStore.subscribe((event) => {
      receivedEvent = event;
    });

    activeDatasetStore.setActiveDataset(mockDataset);

    expect(receivedEvent).not.toBeNull();
    expect(receivedEvent.type).toBe("DATASET_ACTIVATED");
    expect(receivedEvent.payload.datasetId).toBe("ds_123");
    expect(activeDatasetStore.getActiveDataset()).toBe(mockDataset);
    expect(activeDatasetStore.getActiveRows().length).toBe(1);

    unsubscribe();
  });

  it("should handle removing/clearing active datasets", () => {
    const mockDataset: ActiveDataset = {
      datasetId: "ds_123",
      sourceType: "SPREADSHEET_DATA",
      sourceName: "Financeiro_Maio.xlsx",
      rowCount: 10,
      columnCount: 5,
      importedAt: new Date().toISOString(),
      sheets: ["Aba_Principal"],
      activeSheet: "Aba_Principal",
      previewRows: [
        { 
          raw: { Receita: 1000, Mês: "Maio" },
          metadata: { rowIndex: 0, sheetName: "Aba_Principal", fileName: "Financeiro_Maio.xlsx" }
        }
      ],
      columnProfiles: [],
      importProfile: null,
      rawStorageRef: "ref_123",
      status: "ACTIVE"
    };

    activeDatasetStore.setActiveDataset(mockDataset);
    expect(activeDatasetStore.getActiveDataset()).not.toBeNull();

    let receivedEvent: any = null;
    activeDatasetStore.subscribe((event) => {
      receivedEvent = event;
    });

    activeDatasetStore.clearActiveDataset();

    expect(activeDatasetStore.getActiveDataset()).toBeNull();
    expect(activeDatasetStore.getActiveRows().length).toBe(0);
    expect(receivedEvent).not.toBeNull();
    expect(receivedEvent.type).toBe("DATASET_REMOVED");
  });

  it("should persist active dataset metadata and rehydrate successfully", async () => {
    const mockDataset: ActiveDataset = {
      datasetId: "ds_789",
      sourceType: "SPREADSHEET_DATA",
      sourceName: "Financeiro_Anual.csv",
      rowCount: 1500,
      columnCount: 12,
      importedAt: new Date().toISOString(),
      sheets: ["Sheet1"],
      activeSheet: "Sheet1",
      previewRows: [
        { 
          raw: { Receita: 50000, Mês: "Janeiro" },
          metadata: { rowIndex: 0, sheetName: "Sheet1", fileName: "Financeiro_Anual.csv" }
        }
      ],
      columnProfiles: [],
      importProfile: null,
      rawStorageRef: "ref_789",
      status: "ACTIVE"
    };

    activeDatasetStore.setActiveDataset(mockDataset);

    // Verify localStorage item has been set
    const saved = localStorage.getItem("sauron_ds_active_dataset");
    expect(saved).not.toBeNull();
    expect(JSON.parse(saved!).datasetId).toBe("ds_789");

    // Clear memory reference to test rehydration without clearing localStorage
    activeDatasetStore.clearActiveDataset();
    expect(activeDatasetStore.getActiveDataset()).toBeNull();

    // Re-inject into localStorage (since clearActiveDataset removed it) to simulate fresh page load
    localStorage.setItem("sauron_ds_active_dataset", JSON.stringify(mockDataset));

    // Trigger rehydration
    const rehydrated = await activeDatasetStore.rehydrateFromStorage();
    expect(rehydrated).not.toBeNull();
    expect(rehydrated!.datasetId).toBe("ds_789");
    expect(activeDatasetStore.getActiveDataset()!.datasetId).toBe("ds_789");
  });
});
