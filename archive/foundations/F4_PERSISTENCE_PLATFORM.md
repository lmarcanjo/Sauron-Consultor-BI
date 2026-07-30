# FOUNDATION F4 — SAURON PERSISTENCE PLATFORM
## ARCHITECTURE & DECOUPLED PERSISTENCE SPECIFICATION

---

## 1. PERSISTENCE PLATFORM MISSION

The **Sauron Persistence Platform (F4 Foundation)** establishes a high-integrity, completely decoupled storage abstraction layer. 

Sauron's domain logic (e.g., margins, stories, action plans, compensations) is strictly protected from low-level database operations. By establishing standardized Providers, Repositories, and the Unit of Work pattern, Sauron can transition seamlessly between LocalStorage, stateless proxy REST APIs, serverless databases, or high-capacity relational instances (like Cloud PostgreSQL) with **zero modifications** to the core engines or business rules.

---

## 2. LOW-LEVEL PERSISTENCE PROVIDER (F4-A)

All hardware-specific or database-specific storage drivers implement the `IPersistenceProvider` contract. This exposes standardized key-value and structured document queries.

```
                  ┌──────────────────────┐
                  │ IPersistenceProvider │
                  └──────────┬───────────┘
                             │
       ┌──────────────┬──────┴───────┬──────────────┐
       ▼              ▼              ▼              ▼
┌─────────────┐┌─────────────┐┌─────────────┐┌─────────────┐
│LocalProvider││ ApiProvider ││  Postgres   ││   Memory    │
│(LocalStorage)│(Rest Proxy) ││  Provider  ││  Provider   │
└─────────────┘└─────────────┘└─────────────┘└─────────────┘
```

### Supported Providers:
1. **`LocalProvider`**: Direct interface to client-side `localStorage`, providing transient state persistence for fast, browser-only prototyping.
2. **`ApiProvider`**: Maps standard store requests into stateless HTTP/JSON fetch calls dispatched to backend API controllers.
3. **`PostgresProvider`**: Relational server-side database driver mapping entities into robust SQL structures (represented in memory for modular, safe fallback execution).
4. **`MemoryProvider`**: Ephemeral fast memory `Map` storage context optimized for CI/CD runs and Unit Testing pipelines.

---

## 3. DOMAIN REPOSITORIES (F4-B)

Core business engines are strictly prohibited from referencing Providers or executing low-level storage commands directly. All operations are gated by strongly typed Domain Repositories conforming to the `IRepository<T>` contract.

- **`WorkspaceRepository`**: Manages metadata, tenant associations, and scope limits of consultant projects.
- **`StoryRepository`**: Restricts, persists, and tracks chronological consulting stories and chapters.
- **`MeetingRepository`**: Saves active meetings, attendance data, and logs of active sessions.
- **`PeopleRepository`**: Persists staff databases, branch roles, and cost center assignments.
- **`AnalyticsRepository`**: Aggregates historic data snapshots and fiscal period records.
- **`CompensationRepository`**: Secures payroll histories, commission targets, and payouts.
- **`ActionPlanRepository`**: Traverses assignments, tasks, deadlines, and completion flags.

---

## 4. UNIT OF WORK (F4-C)

The **`UnitOfWork`** manages state mutations across multiple repositories within a single execution cycle. Instead of committing changes instantly to physical storage, mutations are queued inside a virtual session.

### The Lifecycle Loop:
- **`Begin`**: Allocates empty transactional queues for new, dirty, and removed models.
- **`Register`**: Gathers operations inside memory:
  - `registerNew()`: Track new insertions.
  - `registerDirty()`: Track updates, preserving previous value backups.
  - `registerRemoved()`: Track deletions, storing full object copies.
  - **`Commit`**: Iterates through tracking queues to persist mutations sequentially. On completion, triggers Audit Trail events and dispatches notifications to the central EventBus.
  - **`Rollback`**: In the event of a commit failure or verification violation, the transaction is aborted, and previous state snapshots are restored to revert partial database writes.

---

## 5. TRANSACTION MANAGER (F4-D)

The **`TransactionManager`** coordinates multiple Units of Work, automating propagation constraints and isolation boundaries. It decouples business services from native database-specific transaction management.

### Propagation Modalities:
- **`REQUIRED`**: Joins an active transaction if one exists, otherwise spawns a new one.
- **`REQUIRES_NEW`**: Always boots an isolated new transaction, suspending active ones.
- **`NEVER`**: Explicitly throws an error if invoked inside an active transaction.

---

## 6. DOMAIN CACHE LAYER (F4-E)

To shield backend database servers from heavy read traffic, the platform includes a layered **Domain Cache** implementing Least Recently Used (LRU) evictions and strict Time-To-Live (TTL) expiration rules.

### Specialized Cache Segments:
- **`Session Cache`**: Highly secure cache for active tokens and permissions (TTL: 5 minutes).
- **`Analytics Cache`**: Caches compiled strategic charts and heavy metrics (TTL: 30 minutes).
- **`Story Cache`**: Speeds up access to approved active stories (TTL: 15 minutes).
- **`Metadata Cache`**: Slow-changing system mappings (TTL: 24 hours).

---

## 7. OFFLINE ENGINE & CONFLICT RESOLUTION (F4-F, F4-G)

Sauron's **`OfflineEngine`** enables consultants to execute actions during off-site field visits with spotty internet connectivity.

1. **Deferred Queuing**: When connectivity drops, operations are stored in a local persistent queue (`offline_queue:*`).
2. **Synchronization**: When internet is restored, the client pushes queued changes to the server.
3. **Conflict Resolution**: On concurrent modifications, conflict strategies are applied:
   - **`Last Write Wins` (LWW)**: Overwrites the server record with local values.
   - **`Merge`**: Combines properties dynamically (local fields overwrite matching server fields).
   - **`Version Compare`**: Accepts local changes only if the local version number is strictly greater than the server's version.
   - **`Manual Review`**: Quarantines conflicting records in a dedicated buffer for manual resolution by a consultant.

---

## 8. SNAPSHOT ENGINE (F4-H)

The **`SnapshotEngine`** captures serialized "deep freezes" of critical domain records (`Stories`, `Meetings`, `Workspace`, `Analytics`, `Plans`).

- **Version Checksums**: Generates unique identifiers (e.g., `SOP-SNAP-XXXX`) based on serialized FNV-1a hashes.
- **Chronological Replay**: Chains snapshots to build step-by-step visual historical timelines.
- **Rollback Recovery**: Allows consultants to restore any previous historical snapshot of an entity, restoring past states instantly.

---

## 9. PERSISTENCE OBSERVABILITY (F4-I)

All storage activities report metrics to the centralized telemetry system:

- **Read/Write Latency**: Monitors average I/O times in milliseconds.
- **Cache Hit / Cache Miss**: Measures cache efficiency and memory size.
- **Rollback & Retry Counters**: Signals database transaction degradation.
- **Sync Jobs**: Records total synchronization loops completed.
