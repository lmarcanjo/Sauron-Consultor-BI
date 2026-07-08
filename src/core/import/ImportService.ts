import { ActiveDataset } from "../../types/dataSource";
import { ImportJob, ImportPreviewPage } from "./ImportJobTypes";
import { ApiImportService } from "./ApiImportService";
import { LocalImportService } from "./LocalImportService";

export interface ImportService {
  startSpreadsheetImport(file: File): Promise<ImportJob>;
  getImportJob(jobId: string): Promise<ImportJob>;
  getImportPreview(jobId: string, sheetName: string, page: number, pageSize: number): Promise<ImportPreviewPage>;
  activateImport(jobId: string, selectedSheets: string[]): Promise<ActiveDataset>;
  cancelImport(jobId: string): Promise<void>;
}

export function resolveImportMode(): "local" | "api" {
  const env = (import.meta as any).env || {};
  const configuredMode = String(env.VITE_IMPORT_MODE || "").toLowerCase();

  if (configuredMode === "api") return "api";
  if (configuredMode === "local") return "local";
  return env.PROD ? "api" : "local";
}

export function createImportService(): ImportService {
  return resolveImportMode() === "api" ? new ApiImportService() : new LocalImportService();
}
