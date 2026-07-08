/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Body, Controller, Get, Headers, Param, Post, Query } from "@nestjs/common";
import { ImportsService } from "./imports.service";

@Controller("api/v1/imports")
export class ImportsController {
  constructor(private readonly importsService: ImportsService) {}

  @Post("spreadsheets")
  startSpreadsheetImport(
    @Headers("x-sauron-file-name") fileNameHeader?: string,
    @Headers("x-sauron-file-size") fileSizeHeader?: string,
  ) {
    const fileName = fileNameHeader || "workbook.xlsx";
    const fileSize = Number(fileSizeHeader || 0);
    return this.importsService.createSpreadsheetJob(fileName, Number.isFinite(fileSize) ? fileSize : 0);
  }

  @Get(":jobId")
  getImportJob(@Param("jobId") jobId: string) {
    return this.importsService.getJob(jobId);
  }

  @Get(":jobId/preview")
  getImportPreview(
    @Param("jobId") jobId: string,
    @Query("sheetName") sheetName = "",
    @Query("page") page = "1",
    @Query("pageSize") pageSize = "50",
  ) {
    return this.importsService.getPreview(jobId, sheetName, Number(page), Number(pageSize));
  }

  @Post(":jobId/activate")
  activateImport(
    @Param("jobId") jobId: string,
    @Body("selectedSheets") selectedSheets: string[] = [],
  ) {
    return this.importsService.activate(jobId, selectedSheets);
  }

  @Post(":jobId/cancel")
  cancelImport(@Param("jobId") jobId: string) {
    this.importsService.cancel(jobId);
    return { ok: true };
  }
}
