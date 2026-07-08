import { ActiveDataset } from "../../types/dataSource";
import type { ImportService } from "./ImportService";
import { ImportError, ImportJob, ImportPreviewPage } from "./ImportJobTypes";

function apiBaseUrl() {
  return String(((import.meta as any).env || {}).VITE_IMPORT_API_BASE_URL || "").replace(/\/$/, "");
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const apiError = payload?.error as ImportError | undefined;
    throw new Error(apiError?.message || payload?.message || `Import API request failed with HTTP ${response.status}`);
  }
  return payload as T;
}

export class ApiImportService implements ImportService {
  async startSpreadsheetImport(file: File): Promise<ImportJob> {
    const form = new FormData();
    form.append("file", file);

    const response = await fetch(`${apiBaseUrl()}/api/v1/imports/spreadsheets`, {
      method: "POST",
      headers: {
        "X-Sauron-File-Name": file.name,
        "X-Sauron-File-Size": String(file.size),
      },
      body: form,
    });

    return parseJsonResponse<ImportJob>(response);
  }

  async getImportJob(jobId: string): Promise<ImportJob> {
    const response = await fetch(`${apiBaseUrl()}/api/v1/imports/${encodeURIComponent(jobId)}`);
    return parseJsonResponse<ImportJob>(response);
  }

  async getImportPreview(jobId: string, sheetName: string, page: number, pageSize: number): Promise<ImportPreviewPage> {
    const params = new URLSearchParams({
      sheetName,
      page: String(page),
      pageSize: String(pageSize),
    });
    const response = await fetch(`${apiBaseUrl()}/api/v1/imports/${encodeURIComponent(jobId)}/preview?${params.toString()}`);
    return parseJsonResponse<ImportPreviewPage>(response);
  }

  async activateImport(jobId: string, selectedSheets: string[]): Promise<ActiveDataset> {
    const response = await fetch(`${apiBaseUrl()}/api/v1/imports/${encodeURIComponent(jobId)}/activate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selectedSheets }),
    });
    return parseJsonResponse<ActiveDataset>(response);
  }

  async cancelImport(jobId: string): Promise<void> {
    const response = await fetch(`${apiBaseUrl()}/api/v1/imports/${encodeURIComponent(jobId)}/cancel`, {
      method: "POST",
    });
    await parseJsonResponse<{ ok: boolean }>(response);
  }
}
