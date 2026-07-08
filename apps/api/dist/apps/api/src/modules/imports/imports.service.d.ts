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
export declare class ImportsService {
    private readonly jobs;
    createSpreadsheetJob(fileName: string, fileSize: number): ImportJob;
    getJob(jobId: string): ImportJob;
    getPreview(jobId: string, sheetName: string, page: number, pageSize: number): ImportPreviewPage;
    activate(jobId: string, selectedSheets: string[]): ApiActiveDataset;
    cancel(jobId: string): void;
}
