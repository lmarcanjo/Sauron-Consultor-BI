"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const correlation_id_interceptor_1 = require("./common/interceptors/correlation-id.interceptor");
const global_error_filter_1 = require("./common/filters/global-error.filter");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors();
    app.useGlobalInterceptors(new correlation_id_interceptor_1.CorrelationIdInterceptor());
    app.useGlobalFilters(new global_error_filter_1.GlobalErrorFilter());
    const port = process.env.PORT || 3001;
    await app.listen(port, "0.0.0.0");
    console.log(`[Sauron API] NestJS service running on http://0.0.0.0:${port}`);
}
bootstrap().catch((err) => {
    console.error("[Sauron API] Critical startup failure:", err);
    process.exit(1);
});
//# sourceMappingURL=main.js.map