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

---

## 3. ASYNC BACKGROUND WORKER

The `apps/worker/` microservice runs off-thread to execute long-running strategic operations without degrading API performance.

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
