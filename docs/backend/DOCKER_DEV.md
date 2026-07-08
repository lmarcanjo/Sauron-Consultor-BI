# SAURON BACKEND — CONTAINER ORCHESTRATION DEV GUIDE

This guide details running Sauron's container topology in a local development context.

---

## 1. TOPOLOGY SUMMARY

Sauron's cluster is defined in `infrastructure/docker-compose.dev.yml`:
- **`postgres`**: Exposes port `5432` for raw SQL and transaction tracking.
- **`redis`**: Exposes port `6379` for BullMQ jobs and state persistence.
- **`api`**: Core business API listening on port `3001`.
- **`worker`**: Queue listener executing background operations.
- **`web`**: Single-page application bundle listening on port `3000`.

---

## 2. COMMON COMMANDS

### Spin Up Postgres and Redis (Recommended Core)
```bash
sudo docker compose -f infrastructure/docker-compose.dev.yml up postgres redis
```

### Spin Up API and Worker Only
```bash
sudo docker compose -f infrastructure/docker-compose.dev.yml up api worker
```

### Spin Up the Whole Cluster (including web profile if specified)
```bash
sudo docker compose -f infrastructure/docker-compose.dev.yml up
```

### View Real-time Container Logs
```bash
sudo docker compose -f infrastructure/docker-compose.dev.yml logs -f
```

### Shutdown Containers and Purge Volumes
```bash
sudo docker compose -f infrastructure/docker-compose.dev.yml down -v
```

---

## 3. INTEGRITY ASSURANCE

- **Healthy Probes**: The `api` container waits for PostgreSQL to pass the liveness check before launching to avoid startup crashes.
- **Prisma Synchronization**: After starting Postgres, always remember to push current schema state:
  ```bash
  npx prisma db push --schema=apps/api/prisma/schema.prisma
  ```
