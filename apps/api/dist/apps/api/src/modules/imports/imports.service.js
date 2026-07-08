"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportsService = void 0;
const common_1 = require("@nestjs/common");
let ImportsService = class ImportsService {
    jobs = new Map();
    createSpreadsheetJob(fileName, fileSize) {
        const now = new Date().toISOString();
        const jobId = `api_import_${crypto.randomUUID()}`;
        const metadata = {
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
        const job = {
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
    getJob(jobId) {
        const job = this.jobs.get(jobId);
        if (!job)
            throw new common_1.NotFoundException(`Import job not found: ${jobId}`);
        return job;
    }
    getPreview(jobId, sheetName, page, pageSize) {
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
    activate(jobId, selectedSheets) {
        const job = this.getJob(jobId);
        const now = new Date().toISOString();
        const activeSheet = selectedSheets[0] || job.metadata?.activeSheet || "";
        const dataset = {
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
    cancel(jobId) {
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
};
exports.ImportsService = ImportsService;
exports.ImportsService = ImportsService = __decorate([
    (0, common_1.Injectable)()
], ImportsService);
//# sourceMappingURL=imports.service.js.map