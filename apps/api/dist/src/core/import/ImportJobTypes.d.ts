import { ActiveDataset } from "../../types/dataSource";
export type ImportJobStatus = "PENDING" | "UPLOADING" | "PROCESSING" | "EXTRACTING_METADATA" | "SAVING_ROWS" | "READY" | "FAILED" | "CANCELLED";
export interface ImportJobProgress {
    status: ImportJobStatus;
    step: string;
    message: string;
    percent: number;
}
export interface ImportError {
    code: string;
    message: string;
    details?: unknown;
    recoverable?: boolean;
}
export interface UploadedSheetMetadata {
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
    sheets: UploadedSheetMetadata[];
    importedAt?: string;
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
export interface ImportJob {
    jobId: string;
    fileName: string;
    fileSize: number;
    status: ImportJobStatus;
    progress: ImportJobProgress;
    metadata?: UploadedWorkbookMetadata;
    activeDataset?: ActiveDataset;
    error?: ImportError;
    createdAt: string;
    updatedAt: string;
    mode: "local" | "api";
}
