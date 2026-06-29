/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Module } from "@nestjs/common";
import { VersionController } from "./version.controller";

@Module({
  controllers: [VersionController],
  exports: [VersionController],
})
export class VersionModule {}
