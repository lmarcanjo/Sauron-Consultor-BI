# FOUNDATION F2 — SAURON API PLATFORM
## ARCHITECTURE & CONTRACT SPECS — SAURON ENTERPRISE WEB LAYER

---

## 1. ARCHITECTURAL OVERVIEW

The **Sauron API Platform (F2 Foundation)** establishes the application-layer architectural boundary of our enterprise SaaS consulting system. 

By separating **Domain Logic** (contained entirely inside the stateless Core Engines) from **Infrastructure Concerns** (transports, databases, validation, and security), we guarantee a scalable, stable system designed to survive multi-year feature expansions.

```
       [ React Client App ] <─── HTTPS / WS ───> [ API Gateway v1 ]
                                                      │
                                                      ▼
                                           [ Application Services ]
                                           (CQRS Command/Query Bus)
                                                      │
                            ┌─────────────────────────┴────────────────────────┐
                            ▼                                                  ▼
                 [ Command Handlers ]                                [ Query Handlers ]
              (Orchestrates Core Engines,                          (Bypasses Engines,
               Repositories, Auditing, Events)                      Queries Read Replicas)
                            │                                                  │
                            ▼                                                  ▼
                  [ Write Database ]                                 [ Read-Only Database ]
```

---

## 2. APPLICATION SERVICE ORCHESTRATION (F2-A)

The Application Layer acts as a stateless coordinator. It is responsible for orchestrating:
1. **Security Verification**: Querying the `AccessControlEngine` to check RBAC and ABAC policies.
2. **Data Coordination (Repositories)**: Injecting Database persistence layers.
3. **Domain Engine Invocation**: Delegating mathematical or analytical calculations to Core Engines (such as `BusinessEngine` or `AnalyticsEngine`).
4. **Audit Dispatch**: Logging state mutations securely via `AuditEngine`.
5. **Event Emission**: Dispatched to the `EventBus` for side-effect processors and asynchronous workers.

### Core Port/Adapter Service Contract
```typescript
export interface ApplicationServiceContext {
  userId: string;
  tenantId: string;
  correlationId: string;
}

export abstract class BaseApplicationService {
  protected async authorize(
    ctx: ApplicationServiceContext,
    permission: string,
    resourceId?: string
  ): Promise<void> {
    // Queries the AccessControlEngine to enforce policies before execution begins
  }

  protected async audit(
    ctx: ApplicationServiceContext,
    action: string,
    details: string,
    metadata?: any
  ): Promise<void> {
    // Ensures persistent audit trails via the AuditEngine
  }
}
```

---

## 3. LIGHTWEIGHT CQRS PATTERN (F2-B, F2-C)

We separate state-mutating requests (Commands) from raw visual data fetches (Queries) to maximize database throughput, enabling clean optimization of read-replicas.

### Command Handlers (Write Operations)
Commands encapsulate a single business mutation. They do not return complex entities—instead, they return execution receipts and/or transaction track-hashes.

#### Command Signatures
```typescript
export interface Command<TPayload> {
  id: string;
  timestamp: string;
  correlationId: string;
  payload: TPayload;
}

export interface CommandResult {
  success: boolean;
  resourceId?: string;
  transactionHash?: string;
  message?: string;
}

export interface ICommandHandler<TCommand extends Command<any>> {
  handle(command: TCommand, ctx: ApplicationServiceContext): Promise<CommandResult>;
}
```

#### Seven Standard Enterprise Commands
```typescript
// 1. CreateStoryCommand: Persists a new narrative plan
export interface CreateStoryPayload {
  title: string;
  objective: string;
  workspaceId: string;
  initialChapters: { title: string; order: number }[];
}

// 2. ApproveStoryCommand: Formalizes a strategic plan
export interface ApproveStoryPayload {
  storyId: string;
  approverComments: string;
}

// 3. GenerateCompensationCommand: Recalculates team baseline parameters
export interface GenerateCompensationPayload {
  departmentId: string;
  fiscalPeriod: string; // e.g., "2026-Q2"
  adjustments: { employeeId: string; delta: number }[];
}

// 4. CreateMeetingCommand: Hosts a digital presentation board session
export interface CreateMeetingPayload {
  workspaceId: string;
  scheduledTime: string;
  attendees: string[];
}

// 5. CloseMeetingCommand: Finalizes discussions and locks decisions
export interface CloseMeetingPayload {
  meetingId: string;
  resolutions: string[];
}

// 6. ImportSpreadsheetCommand: Initiates a multi-step background parser
export interface ImportSpreadsheetPayload {
  fileKey: string; // Cloud Storage S3/GCS bucket pointer
  targetCompanyId: string;
  importType: "DRE" | "BALANCE_SHEET" | "CUSTOM_LEDGER";
}

// 7. GenerateExecutiveReportCommand: Generates dynamic presentations
export interface GenerateExecutiveReportPayload {
  workspaceId: string;
  includeAuditTrail: boolean;
  formats: ("PDF" | "PPTX" | "JSON")[];
}
```

### Query Handlers (Read Operations)
Queries represent screen-optimized reads. They skip complex domain transformations and query normalized database tables directly, supporting pagination and full-text searches.

```typescript
export interface Query<TFilters> {
  correlationId: string;
  filters: TFilters;
  pagination: {
    page: number;
    limit: number;
  };
}

export interface QueryResult<TData> {
  data: TData[];
  meta: {
    totalRecords: number;
    currentPage: number;
    totalPages: number;
  };
}

export interface IQueryHandler<TQuery extends Query<any>, TResult> {
  execute(query: TQuery, ctx: ApplicationServiceContext): Promise<QueryResult<TResult>>;
}
```

---

## 4. SCHEMA BOUNDARIES: DTO ARCHITECTURE (F2-D)

Sauron prevents database schemas or core structures from leaking over HTTP boundaries. Every endpoint utilizes specialized, strongly typed Data Transfer Objects.

```
       [ Raw Network Request ]
                 │
                 ▼
          ┌─────────────┐
          │  Input DTO  │ ──► Type enforcement, Schema validation (Zod)
          └─────────────┘
                 │
                 ▼
          [ Domain Engine ] ──► Core logical operation (Business Layer)
                 │
                 ▼
          ┌─────────────┐
          │ Output DTO  │ ──► Internal structured database mapping
          └─────────────┘
                 │
                 ▼
          ┌─────────────┐
          │Response DTO │ ──► Cleaned, filtered, role-sanitized client response
          └─────────────┘
```

### DTO Code Contract Examples
```typescript
// Input DTO: Enforces strict data ingestion
export interface CreateStoryInputDTO {
  title: string;          // Required, minLength: 3
  objective: string;      // Required, minLength: 10
  workspaceId: string;    // Valid UUID format
  initialChapters: Array<{
    title: string;
    order: number;
  }>;
}

// Output DTO: Represents internal data storage structure
export interface StoryOutputDTO {
  id: string;
  title: string;
  objective: string;
  status: "draft" | "approved" | "archived";
  workspaceId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Response DTO: Sanitizes sensitive details based on active context
export interface StoryResponseDTO {
  id: string;
  title: string;
  objective: string;
  status: "draft" | "approved" | "archived";
  formattedDate: string; // Transformed from createdAt
}
```

---

## 5. TYPE-SAFE VALIDATION & MAPPING PIPELINE (F2-E)

Input validation is executed at the edge of the application layer. Data flows through a series of dedicated utility steps:

```
[ Ingest ] ──► [ Validator ] ──► [ Mapper ] ──► [ Core Engine ] ──► [ Serializer ]
```

- **Validators**: Assert that parameters match expected structures (e.g., checking if email forms, CNPJ strings, or UUID formatting are correct).
- **Mappers**: Cast unstructured, validated payloads into typed domain aggregates or internal service entities.
- **Transformers/Serializers**: Strip highly restricted values (such as salt, password hashes, or internal compensation base metrics) before final JSON delivery.

### Mapper Blueprint Interface
```typescript
export interface IMapper<TSource, TTarget> {
  toDomain(source: TSource): TTarget;
  toDTO(domain: TTarget): TSource;
}
```

---

## 6. API GATEWAY RESPONSIBILITIES (F2-F)

The **Sauron API Gateway** sits at the entry point of our cluster, routing traffic to `/api/v1/` routes. It implements these fundamental infrastructure requirements:

1. **Authentication Gate**: Parses the incoming Authorization bearer token (JWT) or session cookie, validating MFA state.
2. **Access Policy Evaluator**: Invokes the `AccessControlEngine` to check context-dependent ABAC and RBAC boundaries before letting the request proceed.
3. **Rate Limiting**: Enforces tenant-based API limits (e.g., 1,000 requests/minute for Enterprise; 100 requests/minute for Trial) to protect infrastructure from DDoS or script loops.
4. **Audit and Distributed Tracing**: Auto-injects a unique tracking header (`X-Correlation-Id`), writing structured logs to our central log drain (Google Cloud Logging).
5. **Health Checks**: Exposes a standardized ping route `/api/health` checking database connections, Redis caches, and memory heap safety.

---

## 7. VERSIONED REST & OPENAPI SPECS (F2-G)

To guarantee backwards compatibility, all Sauron APIs are versioned under `/api/v1/`. Below is the OpenAPI-compliant REST router structure.

```
GET     /api/v1/health                  - Dynamic gateway readiness probe
GET     /api/v1/stories                 - Paginated Query of strategic narratives
POST    /api/v1/stories                 - Dispatches CreateStoryCommand
PUT     /api/v1/stories/:id/approve     - Dispatches ApproveStoryCommand
GET     /api/v1/compensation/recalc     - Previews salary baseline impact
POST    /api/v1/compensation/generate   - Dispatches GenerateCompensationCommand
POST    /api/v1/meetings                - Dispatches CreateMeetingCommand
POST    /api/v1/meetings/:id/close      - Dispatches CloseMeetingCommand
POST    /api/v1/spreadsheets/import     - Dispatches ImportSpreadsheetCommand
POST    /api/v1/reports/executive       - Dispatches GenerateExecutiveReportCommand
```

---

## 8. DECOUPLED ASYNCHRONOUS BACKGROUND JOBS (F2-H)

Heavy computational or I/O-bound processes are offloaded to background job processors. This prevents Node's main event-loop thread from blocking, ensuring responsive client interactions.

### Job Engine Structure
```typescript
export interface BackgroundJob<TPayload> {
  id: string;
  queue: "imports" | "exports" | "calculations" | "notifications";
  status: "queued" | "processing" | "completed" | "failed";
  payload: TPayload;
  progress: number; // 0 - 100
  errorMessage?: string;
  createdAt: string;
}
```

### Standard Job Queues:
- **`imports`**: Manages Excel/CSV ingestion, mapping data into relational storage.
- **`exports`**: Handles complex PDF reports and PowerPoint dynamic presentation assembly.
- **`calculations`**: Recalculates historical metrics and compensation models across multi-store holdings.
- **`notifications`**: Dispatches batch Slack hooks, SMS alerts, and email campaigns.

---

## 9. BIDIRECTIONAL WEBSOCKET PLATFORM (F2-I)

Real-time interactions are routed over secure WebSockets (`wss://`). The system organizes connections into distinct namespace rooms.

### Real-Time Channels & Broadcast Scopes
```typescript
export type SocketNamespace =
  | "meeting"       // Broadcasts active presentations & synchronized slide changes
  | "story"         // Pushes real-time block editing & comments
  | "notifications" // Delivers targeted system alerts directly to active users
  | "jobs"          // Streams background file import progress bars (0-100%)
  | "presence";     // Tracks active board participants and active consultant sessions
```

### WebSocket Event Protocol Envelope
```typescript
export interface WebSocketPacket<TData> {
  event: string;
  namespace: SocketNamespace;
  room: string; // e.g., "org_arcanjo_ws_pearl"
  senderId: string;
  payload: TData;
  sentAt: string;
}
```

---

## 10. SYSTEM MATURITY COMPLIANCE

By implementing this clear separation between **API endpoints**, **Application Services**, **Queries**, and **Commands**, the Sauron Platform is structurally prepared for Phase 2 and 3 deployment schedules. Individual engineering sub-groups can build, scale, and test these interfaces independently, ensuring zero performance regression in Core Engines.
