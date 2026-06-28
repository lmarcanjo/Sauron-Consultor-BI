/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { CorrelationIdInterceptor } from "./common/interceptors/correlation-id.interceptor";
import { GlobalErrorFilter } from "./common/filters/global-error.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for frontend integration
  app.enableCors();
  
  // Register global interceptors & filters
  app.useGlobalInterceptors(new CorrelationIdInterceptor());
  app.useGlobalFilters(new GlobalErrorFilter());

  const port = process.env.PORT || 3001;
  await app.listen(port, "0.0.0.0");
  console.log(`[Sauron API] NestJS service running on http://0.0.0.0:${port}`);
}

bootstrap().catch((err) => {
  console.error("[Sauron API] Critical startup failure:", err);
  process.exit(1);
});
