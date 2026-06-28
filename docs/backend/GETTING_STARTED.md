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
docker-compose -f infrastructure/docker-compose.dev.yml up -d postgres redis
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

### To Run the API:
```bash
cd apps/api
npm run start:dev
```

### To Run the Worker:
```bash
cd apps/worker
npm run start:dev
```
