"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportsController = void 0;
const common_1 = require("@nestjs/common");
const imports_service_1 = require("./imports.service");
let ImportsController = class ImportsController {
    importsService;
    constructor(importsService) {
        this.importsService = importsService;
    }
    startSpreadsheetImport(fileNameHeader, fileSizeHeader) {
        const fileName = fileNameHeader || "workbook.xlsx";
        const fileSize = Number(fileSizeHeader || 0);
        return this.importsService.createSpreadsheetJob(fileName, Number.isFinite(fileSize) ? fileSize : 0);
    }
    getImportJob(jobId) {
        return this.importsService.getJob(jobId);
    }
    getImportPreview(jobId, sheetName = "", page = "1", pageSize = "50") {
        return this.importsService.getPreview(jobId, sheetName, Number(page), Number(pageSize));
    }
    activateImport(jobId, selectedSheets = []) {
        return this.importsService.activate(jobId, selectedSheets);
    }
    cancelImport(jobId) {
        this.importsService.cancel(jobId);
        return { ok: true };
    }
};
exports.ImportsController = ImportsController;
__decorate([
    (0, common_1.Post)("spreadsheets"),
    __param(0, (0, common_1.Headers)("x-sauron-file-name")),
    __param(1, (0, common_1.Headers)("x-sauron-file-size")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ImportsController.prototype, "startSpreadsheetImport", null);
__decorate([
    (0, common_1.Get)(":jobId"),
    __param(0, (0, common_1.Param)("jobId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ImportsController.prototype, "getImportJob", null);
__decorate([
    (0, common_1.Get)(":jobId/preview"),
    __param(0, (0, common_1.Param)("jobId")),
    __param(1, (0, common_1.Query)("sheetName")),
    __param(2, (0, common_1.Query)("page")),
    __param(3, (0, common_1.Query)("pageSize")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, Object]),
    __metadata("design:returntype", void 0)
], ImportsController.prototype, "getImportPreview", null);
__decorate([
    (0, common_1.Post)(":jobId/activate"),
    __param(0, (0, common_1.Param)("jobId")),
    __param(1, (0, common_1.Body)("selectedSheets")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array]),
    __metadata("design:returntype", void 0)
], ImportsController.prototype, "activateImport", null);
__decorate([
    (0, common_1.Post)(":jobId/cancel"),
    __param(0, (0, common_1.Param)("jobId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ImportsController.prototype, "cancelImport", null);
exports.ImportsController = ImportsController = __decorate([
    (0, common_1.Controller)("api/v1/imports"),
    __metadata("design:paramtypes", [imports_service_1.ImportsService])
], ImportsController);
//# sourceMappingURL=imports.controller.js.map