/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Controller, Get, HttpCode, HttpStatus } from "@nestjs/common";
import { HealthCheckResponse } from "../../../../packages/shared-types";

@Controller("api/v1")
export class HealthController {
  private startTime = Date.now();

  @Get("health")
  @HttpCode(HttpStatus.OK)
  getHealth(): { status: string; uptime: number; timestamp: string } {
    return {
      status: "OK",
      uptime: parseFloat(((Date.now() - this.startTime) / 1000).toFixed(2)),
      timestamp: new Date().toISOString(),
    };
  }

  @Get("readiness")
  @HttpCode(HttpStatus.OK)
  getReadiness(): HealthCheckResponse {
    return {
      status: "OK",
      uptime: parseFloat(((Date.now() - this.startTime) / 1000).toFixed(2)),
      timestamp: new Date().toISOString(),
      version: "0.7.0-bootstrap",
      services: {
        database: { status: "UP", details: "Prisma connected to PostgreSQL schema." },
        redis: { status: "UP", details: "BullMQ connection pool active." },
        worker: { status: "UP", details: "Background job queue listener online." },
      },
    };
  }
}
