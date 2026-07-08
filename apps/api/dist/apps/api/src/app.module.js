"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const health_module_1 = require("./health/health.module");
const version_module_1 = require("./version/version.module");
const identity_module_1 = require("./modules/identity/identity.module");
const tenants_module_1 = require("./modules/tenants/tenants.module");
const organizations_module_1 = require("./modules/organizations/organizations.module");
const cases_module_1 = require("./modules/cases/cases.module");
const audit_module_1 = require("./modules/audit/audit.module");
const jobs_module_1 = require("./modules/jobs/jobs.module");
const imports_module_1 = require("./modules/imports/imports.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            health_module_1.HealthModule,
            version_module_1.VersionModule,
            identity_module_1.IdentityModule,
            tenants_module_1.TenantsModule,
            organizations_module_1.OrganizationsModule,
            cases_module_1.CasesModule,
            audit_module_1.AuditModule,
            jobs_module_1.JobsModule,
            imports_module_1.ImportsModule,
        ],
        controllers: [],
        providers: [],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map