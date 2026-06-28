# ADR-007: SAURON PLATFORM ENTERPRISE BACKEND BOOTSTRAP

## Status
Accepted

## Context
Sauron is expanding from a high-integrity, local-first application to an enterprise client-server Operating System. We need a modern, scalable, and secure backend architecture that isolates client-side presentation components from high-volume database operations, background tasks, and multi-tenant security enforcements.

This foundation establishes the backbone for database modeling, security structures, asynchronous queues, and shared client-server API types.

## Decision
We establish:
1. **NestJS API Microservice Structure (`apps/api/`)**: Built with TypeScript and NestJS. Standardizes request tracing (Correlation ID), exception containment filters, liveness/readiness diagnostics, and multi-tenant isolation contexts.
2. **Prisma Schema & Multitenancy Foundation**: Defines our relational storage structures (`Tenant`, `Organization`, `User`, `Role`, `Permission`, `Workspace`, `ConsultingCase`, `AuditLog`). Generates native multi-tenant links (`tenantId`) across all domain tables.
3. **BullMQ Background Processor (`apps/worker/`)**: Decouples heavy execution contexts (bulk file parsing, payroll iterations, PDF compiles) into off-thread queues, providing linear backoff retries and quarantined Dead-Letter Queue (DLQ) support.
4. **Unified API client preparation**: Creates a client-side `ApiClient`, `ApiProvider`, and `ApiPersistenceProvider` to allow the frontend to seamlessly migrate to remote operations in future sprints.
5. **Shared Type Contracts (`packages/shared-types/`)**: Bridges frontend and backend definitions with single-source-of-truth types.
6. **Docker Orchestration (`infrastructure/docker-compose.dev.yml`)**: Coordinates Postgres, Redis, Api, Worker, and Web services.
7. **Sauron Doctor Diagnostics (`scripts/sauron-doctor.ts`)**: An automated script to assert node engines, packages, configuration states, and container health.

## Consequences
- **Positive**: Clear separation of concerns; server-side execution of heavy analytics; multi-tenant row-level security boundaries; background task execution reliability; and structured API communication contracts.
- **Negative**: Adds a development stack (NestJS/Prisma/PostgreSQL), but this microservice separation provides massive enterprise stability, complete auditability, and production-ready scale.
