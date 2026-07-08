/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Injectable, NotFoundException } from "@nestjs/common";

export type ImportJobStatus = "PENDING" | "UPLOADING" | "PROCESSING" | "EXTRACTING_METADATA" | "SAVING_ROWS" | "READY" | "FAILED" | "CANCELLED";

export interface ApiSheetMetadata {
  sheetName: string;
  rowCount: number;
  columnCount: number;
  formulaCount: number;
  storageRef: string;
  classification: "Base de dados" | "Cadastro" | "Relatório" | "Cálculo/Fórmulas" | "Configuração" | "Vazia" | "Não classificada";
  selectedForImport: boolean;
}

export interface UploadedWorkbookMetadata {
  workbookId: string;
  fileName: string;
  fileSize: number;
  sheetCount: number;
  totalRows: number;
  totalColumns: number;
  formulaCount: number;
  activeSheet: string;
  sheets: ApiSheetMetadata[];
  importedAt?: string;
}

export interface ImportJob {
  jobId: string;
  fileName: string;
  fileSize: number;
  status: ImportJobStatus;
  progress: {
    status: ImportJobStatus;
    step: string;
    message: string;
    percent: number;
  };
  metadata?: UploadedWorkbookMetadata;
  activeDataset?: ApiActiveDataset;
  createdAt: string;
  updatedAt: string;
  mode: "api";
}

export interface ImportPreviewPage {
  jobId: string;
  sheetName: string;
  page: number;
  pageSize: number;
  totalRows: number;
  columns: string[];
  rows: Record<string, unknown>[];
}

export interface ApiActiveDataset {
  datasetId: string;
  sourceType: "SPREADSHEET_DATA";
  sourceName: string;
  importedAt: string;
  rowCount: number;
  columnCount: number;
  sheets: ApiSheetMetadata[];
  activeSheet: string;
  previewRows: any[];
  columnProfiles: any[];
  importProfile: null;
  rawStorageRef: string;
  status: "ACTIVE";
}

@Injectable()
export class ImportsService {
  private readonly jobs = new Map<string, ImportJob>();

  createSpreadsheetJob(fileName: string, fileSize: number): ImportJob {
    const now = new Date().toISOString();
    const jobId = `api_import_${crypto.randomUUID()}`;
    const metadata: UploadedWorkbookMetadata = {
      workbookId: jobId,
      fileName,
      fileSize,
      sheetCount: 0,
      totalRows: 0,
      totalColumns: 0,
      formulaCount: 0,
      activeSheet: "",
      sheets: [],
      importedAt: now,
    };

    const job: ImportJob = {
      jobId,
      fileName,
      fileSize,
      status: "PENDING",
      progress: {
        status: "PENDING",
        step: "Aguardando worker",
        message: "Arquivo recebido. O processamento em segundo plano será conectado ao worker.",
        percent: 5,
      },
      metadata,
      createdAt: now,
      updatedAt: now,
      mode: "api",
    };

    this.jobs.set(jobId, job);
    return job;
  }

  getJob(jobId: string): ImportJob {
    const job = this.jobs.get(jobId);
    if (!job) throw new NotFoundException(`Import job not found: ${jobId}`);
    return job;
  }

  getPreview(jobId: string, sheetName: string, page: number, pageSize: number): ImportPreviewPage {
    this.getJob(jobId);
    return {
      jobId,
      sheetName,
      page,
      pageSize,
      totalRows: 0,
      columns: [],
      rows: [],
    };
  }

  activate(jobId: string, selectedSheets: string[]): ApiActiveDataset {
    const job = this.getJob(jobId);
    const now = new Date().toISOString();
    const activeSheet = selectedSheets[0] || job.metadata?.activeSheet || "";

    const dataset: ApiActiveDataset = {
      datasetId: jobId,
      sourceType: "SPREADSHEET_DATA",
      sourceName: job.fileName,
      importedAt: now,
      rowCount: job.metadata?.totalRows || 0,
      columnCount: job.metadata?.totalColumns || 0,
      sheets: (job.metadata?.sheets || []).map(sheet => ({
        sheetName: sheet.sheetName,
        rowCount: sheet.rowCount,
        columnCount: sheet.columnCount,
        formulaCount: sheet.formulaCount,
        storageRef: sheet.storageRef,
        classification: sheet.classification,
        selectedForImport: selectedSheets.includes(sheet.sheetName),
      })),
      activeSheet,
      previewRows: [],
      columnProfiles: [],
      importProfile: null,
      rawStorageRef: `api:${jobId}`,
      status: "ACTIVE",
    };

    job.status = "READY";
    job.progress = {
      status: "READY",
      step: "Pronto",
      message: "Dataset ativado a partir do job de importação.",
      percent: 100,
    };
    job.activeDataset = dataset;
    job.updatedAt = now;
    this.jobs.set(jobId, job);

    return dataset;
  }

  cancel(jobId: string): void {
    const job = this.getJob(jobId);
    job.status = "CANCELLED";
    job.progress = {
      status: "CANCELLED",
      step: "Cancelado",
      message: "Importação cancelada.",
      percent: 100,
    };
    job.updatedAt = new Date().toISOString();
    this.jobs.set(jobId, job);
  }
}
