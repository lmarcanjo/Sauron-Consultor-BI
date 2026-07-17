import { ActiveDataset } from "../../types/dataSource";
import { DatasetEvent, DatasetEventType, DatasetEventPayload } from "./DatasetEvents";
import { IndexedSpreadsheetStorage } from "../storage/IndexedSpreadsheetStorage";
import { dispatchPlatformEvent, PLATFORM_EVENTS } from "../events/PlatformEvents";
import { platformLogger } from "../platform/PlatformLogger";

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
    if (dataset) {
      // The active store is a metadata/preview bus. Full rows stay in the
      // dataset's source storage and are read by paginated consumers.
      this.activeRows = rawRows
        ? rawRows.slice(0, 100)
        : (dataset.previewRows || []).slice(0, 100).map(r => r.raw);
    } else {
      this.activeRows = [];
      if (typeof window !== "undefined") {
        IndexedSpreadsheetStorage.deleteRows("__active_consolidated_rows__").catch(err => {
          console.error("Failed to delete active rows from IndexedDB:", err);
        });
      }
    }

    platformLogger.info(`[Sauron Instrumentation] ACTIVE_DATASET_STORE_SET - datasetId: ${dataset ? dataset.datasetId : "null"}, sourceName: ${dataset ? dataset.sourceName : "null"}, rowCount: ${this.activeRows.length}, columnCount: ${dataset ? dataset.columnCount : 0}, sourceType: ${dataset ? dataset.sourceType : "null"}`);

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
      
      this.activeDataset = dataset;
      // Rehydration must never materialize the complete workbook. Consumers
      // use dataset.rawStorageRef and query IndexedDB pages when needed.
      this.activeRows = (dataset.previewRows || []).slice(0, 100).map(r => r.raw);
      
      platformLogger.info(`[ActiveDatasetStore] Rehydrated dataset metadata and ${this.activeRows.length} rows.`);

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
    platformLogger.info(`[ActiveDatasetStore] Dispatching event: ${event.type}`, event.payload);
    
    if (event.type === "DATASET_ACTIVATED" || event.type === "DATASET_REHYDRATED") {
      platformLogger.info(`[Sauron Instrumentation] DATASET_ACTIVATED_EMITTED - datasetId: ${event.payload.datasetId || "null"}, sourceName: ${event.payload.sourceName || "null"}, rowCount: ${event.payload.rowCount || 0}, columnCount: ${event.payload.columnCount || 0}, sourceType: ${event.payload.sourceType || "null"}`);
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
      dispatchPlatformEvent(PLATFORM_EVENTS.ACTIVE_DATASET_CHANGED, event.payload);
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
          sourceDatasetIds: dataset.sourceDatasetIds,
          sourceWorkbookIds: dataset.sourceWorkbookIds,
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
