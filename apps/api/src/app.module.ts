/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Module } from "@nestjs/common";
import { HealthModule } from "./health/health.module";
import { VersionModule } from "./version/version.module";
import { IdentityModule } from "./modules/identity/identity.module";
import { TenantsModule } from "./modules/tenants/tenants.module";
import { OrganizationsModule } from "./modules/organizations/organizations.module";
import { CasesModule } from "./modules/cases/cases.module";
import { AuditModule } from "./modules/audit/audit.module";
import { JobsModule } from "./modules/jobs/jobs.module";

/**
 * F5-II: CENTRAL APPMODULE
 * 
 * Roots the entire NestJS dependency graph, preparing configuration registers
 * and registering standard business domains.
 */
@Module({
  imports: [
    HealthModule,
    VersionModule,
    IdentityModule,
    TenantsModule,
    OrganizationsModule,
    CasesModule,
    AuditModule,
    JobsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
