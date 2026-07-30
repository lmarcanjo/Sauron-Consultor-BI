# ADR-005-SAURON-INTEGRATION-PLATFORM: Enterprise Integration Platform, Connector SDK, Credential Vault, and Ingestion Pipeline

## Status
Accepted

## Context
Sauron needs to pull accounting, financial, and sales data from dozens of external systems (such as ERPs like SAP, Totvs, Senior, or QuickBooks, and custom databases or SFTP servers) to generate contribution margins, strategic action plans, and boards. However, hardcoding direct database adapters or custom client hooks within the `Core Engines` directly violates our modularity mandates and compromises system maintainability.

We must design an enterprise-grade, extensible, and completely decoupled **Integration Platform** where third-party developers, consulting teams, or enterprise clients can construct, test, and register sandboxed data connectors.

## Decision
1. **Connector SDK (`src/core/connections/ConnectorSDK.ts`)**: Design a strongly typed SDK contract interface requiring every adapter to implement uniform lifecycles:
   - `authenticate()`: Exchange credentials or request API tokens.
   - `discover()`: Enumerate available tables, datasets, or ledger entities.
   - `validate()`: Confirm structural correctness and system constraints before querying.
   - `sync()`: Stream-read incremental or complete records.
   - `disconnect()`: Safely terminate open tunnels, network sockets, or active web sessions.
   - `health()`: Perform micro-probes querying target system latency and availability.
2. **Execution Sandbox Runtime (F3-B)**: Define structural and processing boundaries for connectors, isolating driver execution, enforcing hard-capped execution timeouts, managing back-pressures, and catching runtime connector driver errors safely.
3. **Ingestion Pipeline & Data Lineage (F3-C)**: Formalize a strict, single-direction sequential ingestion loop:
   - `Download` -> `Validate` -> `Transform` -> `Normalize` -> `Data Quality` -> `Data Lineage` -> `Persist` -> `Notify`.
   - Connectors are strictly prohibited from writing to production tables. They stream data into a secure staging layer, where mapping and data-lineage schemas track origins.
4. **Isolated Credential Vault (F3-D)**: Connectors are stateless and never store secrets. Credentials (API Keys, Client Secrets, Private Keys, VPN credentials) must be securely requested from a centralized, encrypted, isolated Vault.
5. **Sync Engine (F3-E)**: Project synchronization modalities (manual, scheduled, complete, incremental) with automated exponential backoff retry algorithms, isolating poisoned messages into a Dead-Letter Queue (DLQ).
6. **Unified Data Contracts (F3-F)**: Establish canonical enterprise data models (Revenue, COGS, Contribution Margin, Cost Centers, Sales Commisions) so core calculations consume standard, predictable payloads rather than raw, vendor-specific database structures.
7. **Observability integration with Sauron Observatory™ (F3-G, F3-H)**: Expose unified health stats (last sync date, average latencies, success ratios, lineage spans) ready to feed the centralized observability board.
8. **Marketplace Ready Architecture (F3-I)**: Decouple connector registration into dynamic modules. This prepares Sauron to load external connectors dynamically as independent packages or plugins in later product phases.

## Consequences
- **Positive**: Complete encapsulation of ERP formats; developers can construct connectors in isolation; 100% data lineage and transparency; safe credential rotation; and zero regression risk in the core business engines.
- **Negative**: Creating new integrations requires writing a mapper file conforming to Sauron's standard schemas, a deliberate choice favoring high analytical stability over quick-and-dirty ad-hoc scripts.

## Permanent Cleanup Rule

Nenhuma Sprint poderá adicionar uma nova funcionalidade sem identificar explicitamente quais componentes, telas, serviços, rotas, testes e documentos se tornaram obsoletos e deverão ser removidos.
