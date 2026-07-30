# SAURON BACKEND — API MICROSERVICE STRUCTURE

---

## 1. DIRECTORY STRUCTURE

The API service follows standard NestJS design patterns:
```
apps/api/
  ├── prisma/
  │    └── schema.prisma         # Prisma relational database models
  └── src/
       ├── main.ts               # Entry point bootstrapper
       ├── app.module.ts         # Central AppModule imports resolver
       ├── common/               # Core shared filters and guards
       │    ├── filters/
       │    │    └── global-error.filter.ts
       │    ├── guards/
       │    │    └── tenant-context.guard.ts
       │    └── interceptors/
       │         └── correlation-id.interceptor.ts
       └── modules/              # Feature modules directory
            ├── health/          # DevOps health probes
            ├── identity/        # JWT structure, permissions, and roles
            ├── tenants/         # Customer spaces and accounts
            ├── organizations/   # Branches and sub-entities
            ├── cases/           # Strategic workspace projects
            ├── audit/           # Centralized security loggers
            └── jobs/            # Job triggers and status probes
```

---

## 2. STANDARD ENDPOINTS

### Liveness Probe
```http
GET /api/v1/health
```
Response:
```json
{
  "status": "OK",
  "uptime": 124.5,
  "timestamp": "2026-06-28T06:15:00.000Z"
}
```

### Readiness Probe
```http
GET /api/v1/readiness
```
Response:
```json
{
  "status": "OK",
  "uptime": 124.5,
  "timestamp": "2026-06-28T06:15:00.000Z",
  "version": "0.7.0-bootstrap",
  "services": {
    "database": { "status": "UP" },
    "redis": { "status": "UP" },
    "worker": { "status": "UP" }
  }
}
```

### Version Info
```http
GET /api/v1/version
```
Response:
```json
{
  "version": "0.7.0-bootstrap",
  "build": "2026-06-28-F5",
  "environment": "development"
}
```

---

## 3. COMPLIANCE & OBSERVABILITY

- **Trace Correlation**: Every response includes `x-correlation-id` headers for end-to-end telemetry auditing.
- **Error Sanitation**: Caught exceptions are transformed into unified JSON outputs matching the `ErrorResponse` shared interface.
- **Tenant Isolation**: Protected routes run through the `TenantContextGuard` to guarantee row-level security.
