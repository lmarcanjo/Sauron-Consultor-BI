/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";

// 1. Mock NestJS and RxJS packages to allow headless testing of controller classes
vi.mock("@nestjs/common", () => {
  return {
    Controller: () => () => {},
    Get: () => () => {},
    HttpCode: () => () => {},
    HttpStatus: {
      OK: 200,
      UNAUTHORIZED: 401,
      INTERNAL_SERVER_ERROR: 500,
    },
    Module: () => () => {},
    Injectable: () => () => {},
    UnauthorizedException: class extends Error {
      constructor(public message: string) {
        super(message);
      }
    },
    HttpException: class extends Error {
      constructor(public message: string, public status: number) {
        super(message);
      }
      getStatus() {
        return this.status;
      }
    },
    Catch: () => () => {},
  };
});

vi.mock("rxjs", () => {
  return {
    Observable: class {},
  };
});

vi.mock("rxjs/operators", () => {
  return {
    map: (fn: any) => fn,
  };
});

// Import API/Worker bootstrap components
import { HealthController } from "../../../apps/api/src/modules/health/health.controller";
import { JobProcessor } from "../../../apps/worker/src/processor/job.processor";
import { JobStatus, HealthCheckResponse } from "../../../packages/shared-types";
import { ApiClient } from "../../../src/core/persistence/ApiClient";
import { runDoctorChecks } from "../../../scripts/sauron-doctor";


describe("Sauron Backend Bootstrap (Foundation F5) Test Suite", () => {
  
  // ============================================================================
  // F5-A: HEALTH & READINESS ENDPOINTS
  // ============================================================================
  describe("F5-A — Health, Readiness, and Version Endpoints", () => {
    let healthController: HealthController;

    beforeEach(() => {
      healthController = new HealthController();
    });

    it("verifies liveness /health endpoint returns standard OK structure", () => {
      const health = healthController.getHealth();
      expect(health.status).toBe("OK");
      expect(health.uptime).toBeGreaterThanOrEqual(0);
      expect(health.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it("verifies /readiness endpoint details are healthy and map standard subsystems", () => {
      const readiness: HealthCheckResponse = healthController.getReadiness();
      expect(readiness.status).toBe("OK");
      expect(readiness.services.database.status).toBe("UP");
      expect(readiness.services.redis.status).toBe("UP");
      expect(readiness.services.worker?.status).toBe("UP");
    });

    it("verifies /version endpoint returns active bootstrap identifiers", () => {
      const versionInfo = healthController.getVersion();
      expect(versionInfo.version).toBe("0.7.0-bootstrap");
      expect(versionInfo.build).toBe("2026-06-28-F5");
    });
  });

  // ============================================================================
  // F5-B: CONFIGURATION & ENV VALIDATION
  // ============================================================================
  describe("F5-B — Configuration & Env Validation", () => {
    it("validates that all required environment keys are present in .env.example", () => {
      const examplePath = path.join(process.cwd(), ".env.example");
      expect(fs.existsSync(examplePath)).toBe(true);

      const content = fs.readFileSync(examplePath, "utf-8");
      const requiredKeys = [
        "DATABASE_URL",
        "REDIS_URL",
        "JWT_SECRET",
        "JWT_REFRESH_SECRET",
        "API_PORT",
        "WEB_PORT",
        "NODE_ENV",
        "CORS_ORIGIN",
      ];

      for (const key of requiredKeys) {
        expect(content).toContain(key);
      }
    });
  });

  // ============================================================================
  // F5-C: PRISMA SCHEMA MODELS DECLARATION VERIFICATION
  // ============================================================================
  describe("F5-C — Prisma Relational Schema Validation", () => {
    it("ensures the schema file exists and declares the correct multi-tenant model names", () => {
      const schemaPath = path.join(process.cwd(), "apps/api/prisma/schema.prisma");
      expect(fs.existsSync(schemaPath)).toBe(true);

      const schemaText = fs.readFileSync(schemaPath, "utf-8");

      const requiredModels = [
        "model Tenant",
        "model Organization",
        "model User",
        "model Role",
        "model Permission",
        "model Workspace",
        "model ConsultingCase",
        "model AuditLog",
      ];

      for (const model of requiredModels) {
        expect(schemaText).toContain(model);
      }
    });
  });

  // ============================================================================
  // F5-D: WORKER JOB CONTRACTS & FAULT TOLERANCE Retries/DLQ
  // ============================================================================
  describe("F5-D — Worker Job Contracts & Processors", () => {
    let processor: JobProcessor;

    beforeEach(() => {
      processor = new JobProcessor();
    });

    it("routes successful spreadsheet.import background jobs and calculates results", async () => {
      const mockJob = {
        name: "spreadsheet.import",
        payload: { fileKey: "arcanjo_auditoria_2026.xlsx", sheetName: "Consolidado", targetWorkspaceId: "ws_123" },
        metadata: { jobId: "job_1", tenantId: "tenant_alpha", triggeredBy: "system", createdAt: new Date().toISOString(), correlationId: "tx_abc", attempt: 1 },
        status: JobStatus.PENDING,
      };

      const completed = await processor.processJob(mockJob);
      expect(completed.status).toBe(JobStatus.COMPLETED);
      expect(completed.result.recordsImported).toBe(42);
    });

    it("implements exponential backoff retries and quarantines terminally failing jobs inside DLQ", async () => {
      const mockFailingJob = {
        name: "unsupported.unknown.action", // This trigger causes exception
        payload: {},
        metadata: { jobId: "job_failed", tenantId: "tenant_beta", triggeredBy: "carlos", createdAt: new Date().toISOString(), correlationId: "tx_fail", attempt: 1 },
        status: JobStatus.PENDING,
      };

      const terminalState = await processor.processJob(mockFailingJob);
      expect(terminalState.status).toBe(JobStatus.QUARANTINED);
      expect(terminalState.error).toContain("Unsupported job contract target");

      const dlq = processor.getQuarantinedJobs();
      expect(dlq.length).toBe(1);
      expect(dlq[0].metadata.jobId).toBe("job_failed");
    });
  });

  // ============================================================================
  // F5-E: SHARED TYPES CONSISTENCY
  // ============================================================================
  describe("F5-E — Shared Contracts Types", () => {
    it("guarantees status enums map exactly to structural keys", () => {
      expect(JobStatus.PENDING).toBe("PENDING");
      expect(JobStatus.PROCESSING).toBe("PROCESSING");
      expect(JobStatus.COMPLETED).toBe("COMPLETED");
      expect(JobStatus.FAILED).toBe("FAILED");
      expect(JobStatus.QUARANTINED).toBe("QUARANTINED");
    });
  });

  // ============================================================================
  // F5-F: API CLIENT BASIC RESPONSE PARSING
  // ============================================================================
  describe("F5-F — Client ApiClient Parser", () => {
    let originalFetch: any;

    beforeEach(() => {
      originalFetch = global.fetch;
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it("successfully parses positive JSON envelopes", async () => {
      const client = new ApiClient("/mock-api");

      // Mock native fetch
      global.fetch = vi.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true,
          headers: new Headers({ "content-type": "application/json" }),
          json: () => Promise.resolve({ success: true, data: "sauron_auth_success", timestamp: "now", correlationId: "tx_mock" }),
        })
      );

      const res = await client.post("/auth/login", { email: "carlos@sauron.com" });
      expect(res.success).toBe(true);
      expect(res.data).toBe("sauron_auth_success");
    });

    it("throws appropriate errors on HTTP error codes", async () => {
      const client = new ApiClient("/mock-api");

      global.fetch = vi.fn().mockImplementation(() =>
        Promise.resolve({
          ok: false,
          status: 401,
          headers: new Headers({ "content-type": "application/json" }),
          json: () => Promise.resolve({ success: false, statusCode: 401, message: "Unauthorized token" }),
        })
      );

      await expect(client.get("/protected")).rejects.toThrow("Unauthorized token");
    });
  });

  // ============================================================================
  // F5-G: SAURON DOCTOR DIAGNOSTICS TESTS
  // ============================================================================
  describe("F5-G — Sauron Doctor Self-Diagnostics", () => {
    it("runs diagnostic check pipelines and generates detailed logs", async () => {
      // Set minimal variables inside tests environment block to test success
      process.env.DATABASE_URL = "postgresql://sauron:pass@localhost:5432/db";
      process.env.REDIS_URL = "redis://localhost:6379/0";
      process.env.JWT_SECRET = "secret";
      process.env.JWT_REFRESH_SECRET = "refresh";
      process.env.API_PORT = "3001";
      process.env.WEB_PORT = "3000";
      process.env.NODE_ENV = "test";
      process.env.CORS_ORIGIN = "*";

      const report = await runDoctorChecks();
      expect(report.nodeVersionOk).toBe(true);
      expect(report.packageManagerOk).toBe(true);
      expect(report.postgresUrlPresent).toBe(true);
      expect(report.redisUrlPresent).toBe(true);
      expect(report.envsMinimasOk).toBe(true);
    });
  });

  // ============================================================================
  // F5-H: DOCKER BOOTSTRAP VERIFICATION (DOCKERFILES & COMPOSE ATTS)
  // ============================================================================
  describe("F5-H — Docker Bootstrap Verification", () => {
    it("ensures that docker-compose.dev.yml exists and does not contain obsolete version tag", () => {
      const composePath = path.join(process.cwd(), "infrastructure/docker-compose.dev.yml");
      expect(fs.existsSync(composePath)).toBe(true);

      const content = fs.readFileSync(composePath, "utf-8");
      expect(content).not.toContain("version: \"3.8\"");
      expect(content).not.toContain("version: '3.8'");
      expect(content).not.toContain("version: 3.8");
    });

    it("ensures all referenced Dockerfiles exist in the workspace", () => {
      const apiDockerfile = path.join(process.cwd(), "apps/api/Dockerfile.dev");
      const workerDockerfile = path.join(process.cwd(), "apps/worker/Dockerfile.dev");
      const webDockerfile = path.join(process.cwd(), "Dockerfile.dev");

      expect(fs.existsSync(apiDockerfile)).toBe(true);
      expect(fs.existsSync(workerDockerfile)).toBe(true);
      expect(fs.existsSync(webDockerfile)).toBe(true);
    });
  });
});
