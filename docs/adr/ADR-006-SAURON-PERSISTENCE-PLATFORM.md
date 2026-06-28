# ADR-006-SAURON-PERSISTENCE-PLATFORM: Decoupled Persistence Layer, Repositories, Unit of Work, and Offline Sync

## Status
Accepted

## Context
Sauron needs a reliable database foundation to support enterprise consultants. Direct references to standard browser APIs like `localStorage` inside core engines reduce testability, prevent server-side execution, and make it difficult to migrate to robust databases like PostgreSQL in the future.

We need a flexible, enterprise-grade, and completely decoupled **Persistence Platform** where domain logic is isolated from low-level database operations.

## Decision
1. **Low-Level Persistence Providers (`IPersistenceProvider`)**: Decouple physical I/O operations into an interface supporting key-value and structured queries. Implement four providers:
   - `LocalProvider` for client-side storage.
   - `ApiProvider` for proxying requests over REST.
   - `PostgresProvider` for server-side SQL operations.
   - `MemoryProvider` for unit testing.
2. **Domain Repositories (`IRepository`)**: Abstract database queries into domain-specific repositories (`Workspace`, `Story`, `Meeting`, `People`, `Analytics`, `Compensation`, `ActionPlan`).
3. **Unit of Work Pattern (`IUnitOfWork`)**: Coordinate multi-repository writes atomically inside a single transaction context, providing robust rollback recovery to restore previous states on failure.
4. **Transaction Manager (`ITransactionManager`)**: Manage transaction boundaries and propagation rules (e.g., `REQUIRED`, `REQUIRES_NEW`, `NEVER`) programmatically.
5. **Layered Cache (`DomainCache`)**: Implement a TTL-expiring, LRU-evicting cache to reduce read traffic, utilizing a logical sequence counter to avoid timestamp-related race conditions.
6. **Offline-First Synchronization (`OfflineEngine`)**: Buffer mutations in local storage when offline, and synchronize once connection is restored, supporting standard conflict resolution strategies:
   - `Last Write Wins`
   - `Merge`
   - `Version Compare`
   - `Manual Review`
7. **Snapshot Engine (`SnapshotEngine`)**: Capture state snapshots of domain models to support chronological replay timelines and rollback operations.
8. **Observability Metrics**: Track read/write latencies, cache hit/miss rates, rollback occurrences, and sync counts to support system monitoring.

## Consequences
- **Positive**: Complete encapsulation of storage technologies; domain logic is fully testable in memory; and the database backend can be swapped out with zero impact on the core engines.
- **Negative**: Domain updates must be registered through the Unit of Work, but this structured approach provides high operational stability and transactional safety.
