import { ActiveDataset } from "../../types/dataSource";
import { DatasetEvent, DatasetEventType, DatasetEventPayload } from "./DatasetEvents";
import { IndexedSpreadsheetStorage } from "../storage/IndexedSpreadsheetStorage";

export class ActiveDatasetStore {
  private static instance: ActiveDatasetStore;
  private activeDataset: ActiveDataset | null = null;
  private activeRows: any[] = [];
  private subscribers: ((event: DatasetEvent) => void)[] = [];
  private eventHistory: DatasetEvent[] = [];

  private constructor() {
    // Private constructor for singleton
  }

  public static getInstance(): ActiveDatasetStore {
    if (!ActiveDatasetStore.instance) {
      ActiveDatasetStore.instance = new ActiveDatasetStore();
    }
    return ActiveDatasetStore.instance;
  }

  public getSubscribersCount(): number {
    return this.subscribers.length;
  }

  public getEventHistory(): DatasetEvent[] {
    return this.eventHistory;
  }

  public getActiveDataset(): ActiveDataset | null {
    return this.activeDataset;
  }

  public getActiveRows(): any[] {
    return this.activeRows;
  }

  public setActiveDataset(dataset: ActiveDataset | null, rawRows?: any[]) {
    this.activeDataset = dataset;
    if (rawRows) {
      this.activeRows = rawRows;
      if (typeof window !== "undefined") {
        IndexedSpreadsheetStorage.saveRows("__active_consolidated_rows__", rawRows).catch(err => {
          console.error("Failed to save active rows to IndexedDB:", err);
        });
      }
    } else if (dataset) {
      this.activeRows = dataset.previewRows.map(r => r.raw);
      if (typeof window !== "undefined") {
        IndexedSpreadsheetStorage.saveRows("__active_consolidated_rows__", this.activeRows).catch(err => {
          console.error("Failed to save active rows to IndexedDB:", err);
        });
      }
    } else {
      this.activeRows = [];
      if (typeof window !== "undefined") {
        IndexedSpreadsheetStorage.deleteRows("__active_consolidated_rows__").catch(err => {
          console.error("Failed to delete active rows from IndexedDB:", err);
        });
      }
    }

    console.log(`[Sauron Instrumentation] ACTIVE_DATASET_STORE_SET - datasetId: ${dataset ? dataset.datasetId : "null"}, sourceName: ${dataset ? dataset.sourceName : "null"}, rowCount: ${this.activeRows.length}, columnCount: ${dataset ? dataset.columnCount : 0}, sourceType: ${dataset ? dataset.sourceType : "null"}`);

    // Persist to localStorage (with truncated previewRows and safe try/catch)
    if (typeof localStorage !== "undefined") {
      if (dataset) {
        try {
          const truncatedDataset = {
            ...dataset,
            previewRows: dataset.previewRows ? dataset.previewRows.slice(0, 5) : []
          };
          localStorage.setItem("sauron_ds_active_dataset", JSON.stringify(truncatedDataset));
        } catch (err) {
          console.warn("[ActiveDatasetStore] LocalStorage quota exceeded. Falling back to in-memory active dataset.", err);
        }
      } else {
        localStorage.removeItem("sauron_ds_active_dataset");
      }
    }

    const eventType: DatasetEventType = dataset ? "DATASET_ACTIVATED" : "DATASET_REMOVED";
    const event = this.createEvent(eventType, dataset);
    this.notify(event);
  }

  public clearActiveDataset() {
    this.setActiveDataset(null);
  }

  public async rehydrateFromStorage(): Promise<ActiveDataset | null> {
    if (typeof localStorage === "undefined") return null;

    const savedDatasetStr = localStorage.getItem("sauron_ds_active_dataset");
    if (!savedDatasetStr) {
      this.activeDataset = null;
      this.activeRows = [];
      return null;
    }

    try {
      const dataset: ActiveDataset = JSON.parse(savedDatasetStr);
      
      // Load consolidated rows from IndexedDB
      const dbRows = await IndexedSpreadsheetStorage.getRows("__active_consolidated_rows__");

      this.activeDataset = dataset;
      if (dbRows && dbRows.length > 0) {
        this.activeRows = dbRows;
      } else {
        this.activeRows = dataset.previewRows.map(r => r.raw);
      }
      
      console.log(`[ActiveDatasetStore] Rehydrated dataset metadata and ${this.activeRows.length} rows.`);

      const event = this.createEvent("DATASET_REHYDRATED", dataset);
      this.notify(event);
      return dataset;
    } catch (err) {
      console.error("[ActiveDatasetStore] Failed to rehydrate from storage:", err);
      return null;
    }
  }

  public subscribe(listener: (event: DatasetEvent) => void): () => void {
    this.subscribers.push(listener);
    return () => {
      this.subscribers = this.subscribers.filter(s => s !== listener);
    };
  }

  public notify(event: DatasetEvent) {
    console.log(`[ActiveDatasetStore] Dispatching event: ${event.type}`, event.payload);
    
    if (event.type === "DATASET_ACTIVATED" || event.type === "DATASET_REHYDRATED") {
      console.log(`[Sauron Instrumentation] DATASET_ACTIVATED_EMITTED - datasetId: ${event.payload.datasetId || "null"}, sourceName: ${event.payload.sourceName || "null"}, rowCount: ${event.payload.rowCount || 0}, columnCount: ${event.payload.columnCount || 0}, sourceType: ${event.payload.sourceType || "null"}`);
    }

    // Save to diagnostic event history
    this.eventHistory.push(event);
    if (this.eventHistory.length > 20) {
      this.eventHistory.shift();
    }

    // Notify in-memory subscribers
    this.subscribers.forEach(listener => {
      try {
        listener(event);
      } catch (e) {
        console.error("[ActiveDatasetStore] Listener error:", e);
      }
    });

    // Notify window system if in browser
    if (typeof window !== "undefined") {
      const customEvent = new CustomEvent(event.type, { detail: event.payload });
      window.dispatchEvent(customEvent);
      
      // Backward compatibility trigger
      if (event.type === "DATASET_ACTIVATED" || event.type === "DATASET_REHYDRATED") {
        window.dispatchEvent(new CustomEvent("DATASET_ACTIVATED_COMPAT", { detail: event.payload }));
      }
    }
  }

  private createEvent(type: DatasetEventType, dataset: ActiveDataset | null): DatasetEvent {
    if (!dataset) {
      return {
        type,
        payload: {
          datasetId: "",
          sourceType: "",
          sourceName: "",
          rowCount: 0,
          columnCount: 0,
          timestamp: new Date().toISOString(),
          metadata: {}
        }
      };
    }

    return {
      type,
      payload: {
        datasetId: dataset.datasetId,
        sourceType: dataset.sourceType,
        sourceName: dataset.sourceName,
        rowCount: dataset.rowCount,
        columnCount: dataset.columnCount,
        timestamp: new Date().toISOString(),
        metadata: {
          sheets: dataset.sheets,
          activeSheet: dataset.activeSheet,
          previewRows: dataset.previewRows,
          columnProfiles: dataset.columnProfiles,
          importProfile: dataset.importProfile,
          rawStorageRef: dataset.rawStorageRef,
          status: dataset.status,
          importedAt: dataset.importedAt
        }
      }
    };
  }
}

export const activeDatasetStore = ActiveDatasetStore.getInstance();
