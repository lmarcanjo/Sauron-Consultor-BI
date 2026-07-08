# FOUNDATION F5 — SAURON BACKEND BOOTSTRAP
## ENTERPRISE CLIENT-SERVER TRANSITION SPECIFICATION

---

## 1. BACKEND PLATFORM MISSION

The **Sauron Backend Platform (F5 Foundation)** implements the transition of Sauron from a browser-bound, offline-first application into an enterprise-grade client-server SaaS architecture.

By establishing a modular API backbone using NestJS, a dedicated BullMQ background processor worker, and a robust Prisma multi-tenant PostgreSQL schema, Sauron is prepared for extreme scale, secure tenancy isolation, and heavy async task execution (like multi-branch spreadsheet audits and automated payroll calculations).

---

## 2. API STACK ARCHITECTURE

```
                      ┌──────────────────────┐
                      │    Sauron Client     │
                      └──────────┬───────────┘
                                 │ HTTP/JSON
                                 ▼
                      ┌──────────────────────┐
                      │      NestJS API      │
                      └──────────┬───────────┘
                                 │ Prisma ORM
                                 ▼
                      ┌──────────────────────┐
                      │   PostgreSQL DB      │
                      └──────────────────────┘
```

The `apps/api/` stack utilizes **NestJS** and **TypeScript** to power our REST interface, configured with:
1. **Request Correlation ID Interceptor**: Injects trace UUIDs to associate every request with audit logs and system logs.
2. **Global Exception Filter**: Sanitizes all unexpected engine errors into safe, standard API error response structures.
3. **Multi-Tenant Context Guard**: Inspects and validates `x-tenant-id` context headers before executing database commands.
4. **DevOps Health Probes**: Exposes standard endpoints (`/api/v1/health`, `/api/v1/readiness`, `/api/v1/version`) for Kubernetes or Cloud Run orchestration.

### Executable Files Created:
- **`apps/api/package.json`**: Standard build/start scripts for NestJS.
- **`apps/api/src/main.ts`**: Express-platform bootstrap listener.
- **`apps/api/src/app.module.ts`**: Root module with nested domains.
- **`apps/api/src/health/health.controller.ts` & `health.module.ts`**: Handles system status checking.
- **`apps/api/src/version/version.controller.ts` & `version.module.ts`**: Serves metadata version checking.
- **`apps/api/tsconfig.json` & `tsconfig.build.json`**: Decorator-aware compilations.
- **`apps/api/Dockerfile.dev`**: Multi-stage/lightweight Alpine development image.

---

## 3. ASYNC BACKGROUND WORKER

The `apps/worker/` microservice runs off-thread to execute long-running strategic operations without degrading API performance.

### Executable Files Created:
- **`apps/worker/package.json`**: Worker script definitions and manifests.
- **`apps/worker/src/main.ts`**: Worker loop main entry point.
- **`apps/worker/Dockerfile.dev`**: Fast multi-platform container build target.

### Job Routing Directory:
- **`spreadsheet.import`**: Extracts, audits, and ingests multi-branch sheets.
- **`story.export`**: Compiles narratives and financial charts into PDFs or executive sheets.
- **`compensation.generate`**: Runs heavy payroll formulas across thousands of staff nodes.
- **`meeting.summary`**: Synthesizes transcript summaries.
- **`data.sync`**: Refreshes data sources.

### Resiliency Policies:
- **Linear Backoff Retries**: Automatically retries failed jobs (maximum 3 attempts) with incremental waiting.
- **Dead-Letter Queue (DLQ)**: Isolates terminally corrupt jobs under the `QUARANTINED` status to prevent infinite loops.

---

## 4. RELATIONAL DATABASE & MULTI-TENANCY

Our PostgreSQL schema, mapped via **Prisma**, models our core operational and tenant boundaries:
- **`Tenant`**: Root tenant workspace.
- **`Organization`**: Multi-branch physical companies.
- **`Role` / `Permission`**: Granular security policies matching our policy engine.
- **`User`**: Secure auth records linked to tenants and organizations.
- **`Workspace`**: Project directory workspaces.
- **`ConsultingCase`**: Individual active cases.
- **`AuditLog`**: Tamper-proof, transaction-correlated compliance logs.

---

## 5. DOCKER BOOTSTRAP VERIFICATION SUITE

Sauron's CI pipeline enforces that the Docker dev orchestration config remains valid. The suite includes:
- Verification of obsolete properties (e.g. `version` must be omitted).
- Verification of existing files referenced in docker-compose contexts.
- Automated validation that package files are structurally compliant.
