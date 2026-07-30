# FOUNDATION F3 — SAURON INTEGRATION PLATFORM
## ARCHITECTURE & SPECS SHEET — SAURON ENTERPRISE INTEGRATION LAYER

---

## 1. INTEGRATION PLATFORM MISSION

The **Sauron Integration Platform (F3 Foundation)** establishes the definitive, highly extensible, and auditable data connection layer for the Sauron Enterprise ecosystem.

Sauron's primary analytical capabilities depend on importing large-scale operational and accounting data (revenues, cost of goods sold, profit and loss logs, commissions, cost centers). F3 defines a formal boundary preventing the Core Business and Analytics Engines from directly interacting with external database drivers, ERP REST endpoints, file systems, or proprietary protocols. This guarantees complete decouple-ability and permits any connector to be registered, evolved, or retired with zero risk to Sauron core logic.

---

## 2. CONNECTOR SDK & LIFECYCLE (F3-A)

All integration adapters (ERP systems, database synchronizers, file loaders, SFTP pollers) must implement the unified `ISauronConnector` contract. This SDK structures execution into deterministic stages, which allows the central runtime to schedule, supervise, and control execution.

```
       [ Idle / Registered ]
                 │
                 │ (Triggered Job)
                 ▼
          ┌─────────────┐
          │ Authenticate│ ──► Handshake, obtain OAuth/JWT tokens or sessions
          └──────┬──────┘
                 │ (Success)
                 ▼
          ┌─────────────┐
          │  Discover   │ ──► Query endpoints, tables, cataloging fields
          └──────┬──────┘
                 │ (Metadata Ready)
                 ▼
          ┌─────────────┐
          │  Validate   │ ──► Structural validation of schemas, requirements
          └──────┬──────┘
                 │ (Valid)
                 ▼
          ┌─────────────┐
          │    Sync     │ ──► Start stream, extract batches (Incremental/Complete)
          └──────┬──────┘
                 │ (Data Finished / Error)
                 ▼
          ┌─────────────┐
          │ Disconnect  │ ──► Safely terminate connections, sockets, VM tunnels
          └─────────────┘
```

### Connector Lifecycle Stages:
1. **`authenticate()`**: Initiates high-security validation, parsing vault tokens to establish encrypted socket tunnels (SSH) or exchanging credentials for stateless JWT bearers.
2. **`discover()`**: Probes the external engine to map its metadata structures, extracting fields and estimated volumes. This enables Sauron to notice structural changes on remote schemas automatically.
3. **`validate()`**: Verifies that the source schema matches active mapping expectations (such as checking if essential tax, department, or CNPJ columns exist) prior to starting a heavy download.
4. **`sync()`**: Generates streaming batches of unstructured raw payloads. Leverages TypeScript async generators (`AsyncGenerator`) to yield batches, keeping memory footprints highly constrained.
5. **`disconnect()`**: The mandatory cleanup boundary. Safely ends pooling structures, invalidates session tokens, and dismantles any local SSH tunnel socket servers.
6. **`health()`**: Diagnostics endpoint. Quickly checks system availability and network latency, writing metrics back to the Observability ledger.

---

## 3. CONNECTOR RUNTIME RUNWAY (F3-B)

Connectors execute within a managed runtime that enforces safety parameters:

- **Strict Sandbox Isolation**: All database drivers are loaded dynamically inside highly controlled, ephemeral Node contexts.
- **Strict Execution Timeouts**: Handshakes are limited to 30 seconds; schema discovery to 60 seconds; and individual batch streaming is hard-capped at 30 minutes, automatically halting runaway requests.
- **Concurrent Execution Control**: Limits parallel integrations to a maximum of 4 concurrent operations per corporate tenant to prevent target ERP systems from triggering rate limits or suffering CPU exhaustion.
- **Fault Tolerance & Safety Shutdowns**: Any unhandled rejection inside a connector is caught safely by the job executor, closing active sockets and logging failure reason to avoid system crashes.

---

## 4. STANDARDIZED INGESTION PIPELINE (F3-C)

To guarantee absolute data consistency, quality, and complete auditability, **no connector may bypass any step in the Ingestion Pipeline**. Every synchronizer operates inside this immutable, single-direction sequential loop:

```
┌───────────┐     ┌───────────┐     ┌───────────┐     ┌───────────┐
│ Download  │ ──► │ Validate  │ ──► │ Transform │ ──► │ Normalize │
└───────────┘     └───────────┘     └───────────┘     └───────────┘
                                                            │
┌───────────┐     ┌───────────┐     ┌───────────┐           │
│  Notify   │ ◄── │  Persist  │ ◄── │Lineage/DQ │ ◄─────────┘
└───────────┘     └───────────┘     └───────────┘
```

### Ingestion Stages Decoded:
1. **Download (Extract)**: Connectors poll external endpoints, databases, or SFTP folders to load raw batches into stateless buffer memory.
2. **Validate (Payload Integrity)**: Confirms that received records contain non-corrupted, parsable JSON structure and valid identification headers.
3. **Transform (Map to Canonical Models)**: Translates the arbitrary raw ERP schema into Sauron’s standard domain-level structures (e.g., converting SAP's `VBAK`/`VBAP` tables or QuickBooks' Sales reports into Sauron's `CanonicalRevenue` contract).
4. **Normalize (Standardize Formats)**: Formats dates into strict ISO 8601 (`YYYY-MM-DD`), numbers to two-decimal float values, and normalizes identification identifiers (CNPJs stripped of non-digit characters).
5. **Data Quality (DQ checks)**: Enforces business-rule integrity. Rejects payloads containing impossible dates (e.g., future entries), negative revenues (unless tagged as accounting returns), or missing mandatory linkages (such as records with blank Cost Center values).
6. **Data Lineage (Traceability)**: Auto-attaches tracing tags (`DataLineageRecord`) correlating the final database rows to their exact parent job, extraction table, and raw message IDs, permitting comprehensive compliance audits.
7. **Persist (Staging write)**: Saves mapped datasets into staging database tables. Data is never written directly to active analytics caches, preventing database corruption during partial connection dropouts.
8. **Notify (Event dispatch)**: Fires state-change notifications onto the central `EventBus` to recalculate active dashboards and update administrators via Slack, WebSockets, or email alerts.

---

## 5. CENTRAL CREDENTIAL VAULT (F3-D)

Sauron prevents connections from leaking or persisting credentials locally. 

- **State Isolation**: Connectors must be fully stateless. They do not maintain a local database, `.env` file references, or configuration stores.
- **Isolated Decryption**: The central **`CredentialVault`** retrieves highly sensitive parameters from secure databases (with values encrypted using AES-256-GCM algorithms). 
- **Decryption at Handshake**: Decrypted parameters are only injected directly into the memory scope of the connector's execution thread immediately before invoking the `authenticate()` stage, leaving no persistent footprint.

---

## 6. ROBUST SYNC ENGINE (F3-E)

Sauron's **`SyncEngine`** handles multiple synchronization modalities and implements defensive retry mechanisms to survive network turbulence.

### Ingestion Modalities:
- **Complete Synchronization**: Completely flushes and rebuilds staging tables. Useful for small datasets or periodic weekend reconciliation.
- **Incremental Synchronization**: Uses persistent cursors (such as checking `updated_at` or tracking incremental `sequence_id` tags) to fetch only records created since the last successful execution.
- **Scheduled Synchronization**: Integrates Cron loops executing at precise business hours (e.g., pulling sales reports every hour, and ledger structures daily at midnight).
- **Manual Triggering**: Allows managers to click "Sync Now" within the active Consultant Workspace, dispatching instant on-demand worker jobs.

### Fault Mitigation & DLQ:
```
                              [ Ingestion Pipeline ]
                                         │
                                   (Sync Failed)
                                         │
                                         ▼
                               /───────────────────\
                              <  Retry < 3 times?   >───[YES]──► Retry with Exponential Backoff
                               \───────────────────/
                                         │
                                        [NO]
                                         │
                                         ▼
                            [ Dead-Letter Queue (DLQ) ]
                            - Flag record as "unresolved"
                            - Store raw payload + stack trace
                            - Dispatch emergency alert to Consultant
```

- **Exponential Backoff**: When a connection drop occurs, the system schedules retries using backoff pacing ($2^{\text{attempt}} \times 2000$ milliseconds), adding jitter to avoid overloading remote servers.
- **Dead-Letter Queue (DLQ)**: If a batch fails 3 consecutive retries or contains uncorrectable schema errors, the raw payload is isolated into the DLQ. This prevents minor formatting errors in a single record from halting a 100,000-row synchronization job.

---

## 7. CANONICAL DATA CONTRACTS (F3-F)

Sauron establishes strict canonical schemas defining the expected attributes for every critical operational entity. Connectors must map their custom source structures into these models, shielding the Core Engines from database-level variations.

### Canonical Domain Model Specifications

#### 1. `CanonicalRevenue` (Net and Gross Sales Ledger)
```typescript
export interface CanonicalRevenue {
  id: string;
  sourceSystem: string;
  companyCnpj: string;
  branchCode: string;
  costCenterId: string;
  fiscalPeriod: string; // Format: YYYY-MM
  grossRevenue: number;
  netRevenue: number;
  deductions: number;
  taxesPaid: number;
  currency: string;
  extractedAt: string;
}
```

#### 2. `CanonicalCOGS` (Cost of Goods Sold & Material Ledger)
```typescript
export interface CanonicalCOGS {
  id: string;
  sourceSystem: string;
  companyCnpj: string;
  branchCode: string;
  costCenterId: string;
  fiscalPeriod: string; // Format: YYYY-MM
  costOfGoodsSold: number;
  rawMaterialsCost: number;
  directLaborCost: number;
  manufacturingOverhead: number;
  currency: string;
  extractedAt: string;
}
```

#### 3. `CanonicalMargin` (Product & Service Profit Margins)
```typescript
export interface CanonicalMargin {
  id: string;
  sourceSystem: string;
  companyCnpj: string;
  branchCode: string;
  costCenterId: string;
  fiscalPeriod: string; // Format: YYYY-MM
  contributionMarginValue: number;
  contributionMarginPercent: number;
  variableExpenses: number;
  extractedAt: string;
}
```

#### 4. `CanonicalCostCenter` (Organizational Structures)
```typescript
export interface CanonicalCostCenter {
  id: string;
  sourceSystem: string;
  code: string;
  name: string;
  managerName?: string;
  parentCostCenterCode?: string;
  departmentName?: string;
  isActive: boolean;
}
```

#### 5. `CanonicalClient` (Accounts Receivable CRM)
```typescript
export interface CanonicalClient {
  id: string;
  sourceSystem: string;
  name: string;
  cnpjOrCpf: string;
  industrySegment?: string;
  region: string;
  creditLimit: number;
  isActive: boolean;
}
```

#### 6. `CanonicalSalesRepresentative` (Commissions Ledger)
```typescript
export interface CanonicalSalesRepresentative {
  id: string;
  sourceSystem: string;
  employeeId?: string;
  fullName: string;
  region: string;
  monthlyTarget: number;
  commissionRate: number;
  totalSalesAchieved: number;
  accruedCommissions: number;
}
```

---

## 8. INTEGRATION HEALTH INDICATORS (F3-G)

To help consultants quickly diagnose issues across multi-store operations, every registered connector reports status metrics:

| Diagnostic Indicator | Metric Description | Compliance Objective |
|---|---|---|
| **Last Successful Sync** | Time elapsed since the last completed ingestion. | Alert if $> 24\text{ hours}$ for active clients. |
| **Average Sync Duration** | Average run-duration of ingestion pipelines. | Flag performance anomalies if execution spikes $> 200\%$. |
| **System Latency (RTT)** | Round-trip request time to target endpoints. | Target $< 500\text{ms}$ during health heartbeats. |
| **Data Quality Rate** | Percentage of records passing quality validations. | Flag if raw failure rate exceeds $2\%$ of batch. |
| **Availability Success Rate** | Ratio of successful jobs vs. total executions over 30 days. | Target SLA: $\ge 99.5\%$. |

---

## 9. SAURON OBSERVATORY™ OBSERVABILITY (F3-H)

All integration metrics flow into our upcoming centralized monitoring platform, the **Sauron Observatory™**.

- **Consolidated Event Stream**: Every step of the integration pipeline emits trace spans (`job_start`, `batch_processed`, `pipeline_ended`).
- **Data Lineage Tracking**: Provides high-visibility mapping diagrams showing exactly which raw CSV, database row, or JSON file generated a specific board chart, guaranteeing complete trust during financial audits.
- **Alert Routing**: High-priority errors (handshake rejections, invalid credentials) are instantly routed to on-duty engineers and supervising consultants.

---

## 10. PLUGGABLE CONNECTOR MARKETPLACE READY (F3-I)

Sauron's integration layer is designed for modular, pluggable expansions:

- **Isolated Modules**: Connectors are bundled and packaged inside standalone directories, strictly decoupling external SDK packages from the Core engines.
- **Dynamic Connection Register**: Connector configurations are loaded dynamically from a global manifest database (`system_db.json`), permitting new connectors to be registered without restarting active servers.
- **Dynamic Class Loading**: The runtime loads connector classes at runtime using standard dynamic `import()` modules based on the registered manifest database:
```typescript
const connectorModule = await import(`../../connectors/${connectorName}`);
const connectorInstance = new connectorModule.DefaultConnector();
```
This cleanly prepares Sauron to easily distribute and install community-built third-party connector packages in future product cycles.
