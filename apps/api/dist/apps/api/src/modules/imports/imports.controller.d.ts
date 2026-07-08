import { ImportsService } from "./imports.service";
export declare class ImportsController {
    private readonly importsService;
    constructor(importsService: ImportsService);
    startSpreadsheetImport(fileNameHeader?: string, fileSizeHeader?: string): import("./imports.service").ImportJob;
    getImportJob(jobId: string): import("./imports.service").ImportJob;
    getImportPreview(jobId: string, sheetName?: string, page?: string, pageSize?: string): import("./imports.service").ImportPreviewPage;
    activateImport(jobId: string, selectedSheets?: string[]): import("./imports.service").ApiActiveDataset;
    cancelImport(jobId: string): {
        ok: boolean;
    };
}
