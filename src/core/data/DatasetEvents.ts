export type DatasetEventType =
  | "DATASET_IMPORTED"
  | "DATASET_ACTIVATED"
  | "DATASET_REMOVED"
  | "DATASET_REHYDRATED";

export interface DatasetEventPayload {
  datasetId: string;
  sourceType: string;
  sourceName: string;
  rowCount: number;
  columnCount: number;
  timestamp: string;
  metadata: Record<string, any>;
}

export interface DatasetEvent {
  type: DatasetEventType;
  payload: DatasetEventPayload;
}
