# SAURON BACKEND — GETTING STARTED GUIDE

---

## 1. PRE-REQUISITES

To run the Sauron Backend platform, ensure your environment has:
- **Node.js**: Version `18.x` or greater.
- **Docker**: For running Postgres and Redis easily.
- **Package Manager**: `npm` (pre-configured with workspace templates).

---

## 2. SETTING UP ENVIRONMENT

Copy the environment example template to configure your local variables:
```bash
cp .env.example .env
```

Review the values, especially:
- `DATABASE_URL`: Connection string pointing to your PostgreSQL instance.
- `REDIS_URL`: Connection string pointing to your Redis server.

---

## 3. SPINNING UP DATABASE & CACHE

Run the standard Docker Compose configuration to boot local Postgres and Redis:
```bash
sudo docker compose -f infrastructure/docker-compose.dev.yml up postgres redis -d
```

Once running, push the Prisma relational schema:
```bash
npx prisma db push --schema=apps/api/prisma/schema.prisma
```

---

## 4. SYSTEM DIAGNOSTICS (SAURON DOCTOR)

Verify your environment setup using the automated Sauron Doctor script:
```bash
npx tsx scripts/sauron-doctor.ts
```

It will confirm whether Node versions, lock files, variables, and schema connectivity are fully aligned.

---

## 5. STARTING THE SERVICES

### Option A: Local Execution (For active development)

#### Installing and running the API:
```bash
cd apps/api
npm install
npm run start:dev
```

This starts the NestJS API server on http://localhost:3001.

#### Installing and running the Worker:
```bash
cd apps/worker
npm install
npm run start:dev
```

This starts the worker processing BullMQ jobs in real time.

### Option B: Docker Compose Full Cluster Execution

To spin up Postgres, Redis, NestJS API, and Worker altogether in the background:
```bash
sudo docker compose -f infrastructure/docker-compose.dev.yml up api worker -d
```

To include the Optional Frontend Web service:
```bash
sudo docker compose --profile web -f infrastructure/docker-compose.dev.yml up
```

---

## 6. TESTING ENDPOINTS

Verify that the NestJS API has successfully booted and is answering health probes:

```bash
# Health Check (General status and uptime)
curl -i http://localhost:3001/api/v1/health

# Readiness Probe (Database and Redis connectivity status)
curl -i http://localhost:3001/api/v1/readiness

# System Version Details
curl -i http://localhost:3001/api/v1/version
```
