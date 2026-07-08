"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalErrorFilter = void 0;
const common_1 = require("@nestjs/common");
let GlobalErrorFilter = class GlobalErrorFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const status = exception instanceof common_1.HttpException
            ? exception.getStatus()
            : common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        const message = exception instanceof common_1.HttpException
            ? exception.message
            : "Internal server error occurred. Please contact Sauron Platform Administrator.";
        const correlationId = request.correlationId || "system-root";
        const errorResponse = {
            success: false,
            statusCode: status,
            message,
            error: exception?.response?.error || exception?.name || "InternalError",
            timestamp: new Date().toISOString(),
            path: request.url,
            correlationId,
        };
        console.error(`[Sauron Global Error Filter] [TxId: ${correlationId}] Status: ${status}, Path: ${request.url}`, exception);
        if (response && typeof response.status === "function") {
            response.status(status).json(errorResponse);
        }
    }
};
exports.GlobalErrorFilter = GlobalErrorFilter;
exports.GlobalErrorFilter = GlobalErrorFilter = __decorate([
    (0, common_1.Catch)()
], GlobalErrorFilter);
//# sourceMappingURL=global-error.filter.js.map