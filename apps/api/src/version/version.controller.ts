/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Controller, Get, HttpCode, HttpStatus } from "@nestjs/common";

@Controller("api/v1")
export class VersionController {
  @Get("version")
  @HttpCode(HttpStatus.OK)
  getVersion(): { version: string; build: string; environment: string } {
    return {
      version: "1.0.0",
      build: "2026-06-28-F5",
      environment: process.env.NODE_ENV || "development"
    };
  }
}
