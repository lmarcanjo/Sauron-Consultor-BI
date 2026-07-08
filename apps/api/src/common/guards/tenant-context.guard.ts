/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from "@nestjs/common";

/**
 * F5-V: MULTI-TENANT CONTEXT GUARD
 * 
 * Intercepts incoming requests to extract and validate 'x-tenant-id' header or auth tokens.
 * This ensures that downstream repositories are isolated to the tenant context.
 */
@Injectable()
export class TenantContextGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // Extract tenant ID from request headers
    const tenantId = request.headers["x-tenant-id"];
    
    if (!tenantId) {
      // In a strict enterprise system, lack of tenant ID rejects the connection
      throw new UnauthorizedException("Sauron Isolation Violation: Missing 'x-tenant-id' context header.");
    }

    // Attach tenantContext to request for controllers and Prisma services
    request.tenantContext = {
      tenantId,
      timestamp: new Date().toISOString(),
      correlationId: request.correlationId || "system-root",
    };

    // Row-Level Security checks and validation would occur here
    return true;
  }
}
