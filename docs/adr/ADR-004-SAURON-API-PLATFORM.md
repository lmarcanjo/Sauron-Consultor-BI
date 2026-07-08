# ADR-004-SAURON-API-PLATFORM: Application Layer Decoupling, CQRS Pattern, DTO Boundaries, and API Gateway Specification

## Status
Accepted

## Context
As the Sauron Platform moves toward an enterprise SaaS model, our existing Core Engines (such as `BusinessEngine`, `AnalyticsEngine`, `StoryEngine`, etc.) must remain clean, highly decoupled domain-only calculators. We need a solid middleware and orchestrator layer—the **Application Layer**—to coordinate data fetching (Repositories), transaction bounds, access validation (Security Policies), event dispatch (EventBus), and deep audit logging. 

Furthermore, to handle dense operations (e.g., parsing massive 100,000-line spreadsheets, generating complex PDFs, or managing real-time Board presentations), we must establish robust contracts for Background Jobs and real-time WebSockets, while preventing raw Database or Domain models from leaking to the network clients (React UI).

## Decision
1. **Application Layer Architecture (F2-A)**: Formally separate the codebase into an orchestrating Application Layer that sits above the Domain layer.
2. **CQRS (Command Query Responsibility Segregation) Pattern (F2-B, F2-C)**:
   - **Commands (Write Path)**: Executed via dedicated `CommandHandler` units (e.g., `CreateStory`, `ApproveStory`, `GenerateCompensation`, `CloseMeeting`) returning status and tracking IDs.
   - **Queries (Read Path)**: Handled via `QueryHandler` units executing lightning-fast, paginated database queries bypassing domain engine overhead where appropriate.
3. **Data Protection & Schema Isolation (F2-D, F2-E)**:
   - **Data Transfer Objects (DTOs)**: Introduce strict physical separation between `InputDTO`, `OutputDTO`, and `ResponseDTO`. Domain Entities are forbidden from crossing the network threshold.
   - **Serialization Pipeline**: Mandate a pipeline of `Validators` (using schemas like Zod), `Mappers` (translators), and `Serializers` (filtering output data per user clearance).
4. **API Gateway Architecture (F2-F, F2-G)**:
   - Route all external client interactions through an **API Gateway** managing rate limits, JWT validation, ABAC evaluation, tracing spans (`X-Correlation-Id`), structured JSON logging, and micro health-checks.
   - Standardize all endpoints under the `/api/v1/` versioned path.
5. **Asynchronous Background Workers (F2-H)**: Use a high-availability job processing queue (BullMQ/Redis) with dedicated handlers for spreadsheet imports, DRE recalculations, PDF generation, and push notifications.
6. **Bidirectional Channel Protocol (F2-I)**: Design an event-driven WebSocket communication system managing persistent rooms (`presence`, `meeting`, `story`, `notifications`, `jobs`).

## Consequences
- **Positive**: Complete encapsulation of business rules; frictionless scalability for database read-replicas; absolute network security; and clear modular contracts enabling parallel engineering teams to implement backend routes without breaking existing core modules.
- **Negative**: Adds a thin layer of mapping code (Mappers/DTOs) between the domain engines and the API, representing a deliberate tradeoff favoring high maintainability over short-term rapid prototyping.
