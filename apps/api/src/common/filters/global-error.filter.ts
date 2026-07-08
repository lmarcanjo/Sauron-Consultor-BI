/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from "@nestjs/common";
import { ErrorResponse } from "../../../../../packages/shared-types";

/**
 * F5-II: GLOBAL EXCEPTION FILTER & ERROR HANDLER
 * 
 * Intercepts all system-wide errors and unhandled exceptions to prevent database leak
 * and return standard, sanitized error structures to Sauron clients.
 */
@Catch()
export class GlobalErrorFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = exception instanceof HttpException
      ? exception.message
      : "Internal server error occurred. Please contact Sauron Platform Administrator.";

    const correlationId = request.correlationId || "system-root";

    const errorResponse: ErrorResponse = {
      success: false,
      statusCode: status,
      message,
      error: exception?.response?.error || exception?.name || "InternalError",
      timestamp: new Date().toISOString(),
      path: request.url,
      correlationId,
    };

    // Prevent critical infrastructure leaks in production logs
    console.error(`[Sauron Global Error Filter] [TxId: ${correlationId}] Status: ${status}, Path: ${request.url}`, exception);

    if (response && typeof response.status === "function") {
      response.status(status).json(errorResponse);
    }
  }
}
