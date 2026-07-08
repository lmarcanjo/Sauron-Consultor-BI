# SAURON BACKEND — ENVIRONMENT VARIABLES MANUAL

This manual maps the environment parameters requested for API, Worker, and Client execution.

---

## 1. ENVIRONMENTAL MATRIX

| Variable Name | Category | Scope | Default Value (Dev) | Description |
| :--- | :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Security / DB | API / Worker | `postgresql://...` | Connection URI pointing to relational PostgreSQL database. |
| `REDIS_URL` | Queue / Cache | API / Worker | `redis://localhost:6379/0` | Connection URI pointing to Redis service. |
| `JWT_SECRET` | Security / Auth | API | `sauron_super_secret...` | High-entropy signature key for user tokens. |
| `JWT_REFRESH_SECRET` | Security / Auth | API | `sauron_super_secret...` | High-entropy key for renewing sessions. |
| `API_PORT` | Networking | API | `3001` | Ingress listening port for backend API. |
| `WEB_PORT` | Networking | Client | `3000` | Listening port for client frontend. |
| `NODE_ENV` | Diagnostics | All | `development` | Operating context flags: `development`, `production`. |
| `CORS_ORIGIN` | Security | API | `http://localhost:3000` | Authorized client request origins. |

---

## 2. KEY ROTATION & SECURITY BOUNDARIES

- **Secret Masking**: Do not commit actual credentials, database passwords, or JWT keys into repository commits.
- **Production Injection**: Production containers receive environment variables mapped inside Cloud Run settings or Kubernetes Secrets.
- **Diagnostics Verification**: Use `npx tsx scripts/sauron-doctor.ts` to identify misconfigured variables in local environments.
