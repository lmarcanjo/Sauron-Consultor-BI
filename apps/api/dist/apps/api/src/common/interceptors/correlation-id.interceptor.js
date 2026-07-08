"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CorrelationIdInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
let CorrelationIdInterceptor = class CorrelationIdInterceptor {
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        const timestamp = Date.now();
        const pidSuffix = typeof process !== "undefined" ? process.pid : 1;
        const correlationId = request.headers["x-correlation-id"] || `sauron-tx-${timestamp}-${pidSuffix}-${Math.floor(Date.now() % 100000)}`;
        request.correlationId = correlationId;
        if (response && typeof response.setHeader === "function") {
            response.setHeader("x-correlation-id", correlationId);
        }
        return next.handle().pipe((0, operators_1.map)((data) => {
            if (data && typeof data === "object" && !Array.isArray(data)) {
                return {
                    ...data,
                    correlationId,
                };
            }
            return data;
        }));
    }
};
exports.CorrelationIdInterceptor = CorrelationIdInterceptor;
exports.CorrelationIdInterceptor = CorrelationIdInterceptor = __decorate([
    (0, common_1.Injectable)()
], CorrelationIdInterceptor);
//# sourceMappingURL=correlation-id.interceptor.js.map