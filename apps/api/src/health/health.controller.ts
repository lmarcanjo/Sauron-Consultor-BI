/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Controller, Get, HttpCode, HttpStatus } from "@nestjs/common";

@Controller("api/v1")
export class HealthController {
  @Get("health")
  @HttpCode(HttpStatus.OK)
  getHealth(): { status: string; service: string; version: string; timestamp: string } {
    return {
      status: "ok",
      service: "sauron-api",
      version: "1.0.0",
      timestamp: new Date().toISOString()
    };
  }

  @Get("ready")
  @HttpCode(HttpStatus.OK)
  getReady(): { status: string; service: string; version: string; timestamp: string } {
    return {
      status: "ok",
      service: "sauron-api",
      version: "1.0.0",
      timestamp: new Date().toISOString()
    };
  }
}
