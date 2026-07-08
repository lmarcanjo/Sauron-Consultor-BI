/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

/**
 * Interceptor that appends a unique request Correlation ID (UUID style) 
 * to incoming request headers and outgoing response structures for observability.
 */
@Injectable()
export class CorrelationIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Standard correlation ID checking/generation
    const timestamp = Date.now();
    const pidSuffix = typeof process !== "undefined" ? process.pid : 1;
    const correlationId = request.headers["x-correlation-id"] || `sauron-tx-${timestamp}-${pidSuffix}-${Math.floor(Date.now() % 100000)}`;
    
    // Inject into request object to make it accessible to controllers/services
    request.correlationId = correlationId;
    
    // Set response header
    if (response && typeof response.setHeader === "function") {
      response.setHeader("x-correlation-id", correlationId);
    }

    return next.handle().pipe(
      map((data) => {
        // Automatically inject correlationId into envelope if it returns an object
        if (data && typeof data === "object" && !Array.isArray(data)) {
          return {
            ...data,
            correlationId,
          };
        }
        return data;
      })
    );
  }
}
