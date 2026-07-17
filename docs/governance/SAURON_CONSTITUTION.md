# Sauron Constitution

Version: 1.0  
Status: Official Product Constitution

## Product Positioning

Sauron is the Consulting Intelligence Operating System. It is an intelligence
layer that connects spreadsheets, ERPs, CRMs, APIs, databases, documents and
external data so a consultant can understand a company and make decisions.
It is not an ERP, CRM, traditional BI, accounting system or chatbot.

## Official Flow

```text
Group -> Company -> Unit -> Workspace -> Import -> Library
-> Smart Configuration -> Validation -> Activation -> Dataset -> KPIs
-> Dashboards -> Narrative -> Presentation -> Meeting -> Minutes
-> Action Plan -> History
```

The product must not silently skip a stage. Configuration should be inferred
where possible and presented for consultant validation; a consultant must not
be forced to build a semantic dictionary from zero.

## Data Integrity

- Production flows never use mock, demo, seed, fictitious fallback or invented
  numbers.
- Missing data is represented by `Configuracao pendente.`.
- Dashboards and executive artifacts must reflect the source exactly.
- `FinancialConsistencyEngine` is the permanent contract for reconciling
  Source -> Dataset -> KPIs -> Dashboard -> Narrative -> Presentation ->
  Meeting -> Minutes -> Action Plan with zero difference.

## Domain Isolation

Domain-specific vocabulary belongs in Domain Packs. Core contracts remain
neutral and consume a selected pack through its public interfaces.

## Consultant Experience

The interface must be simple, corporate, consultative and understandable
without developer training. Tests must exercise the interface, including
invalid input, cancellation, reload, authentication recovery, context
switching, multiple imports, archive, restore and deletion flows.

## Release Gate

A sprint is complete only when typecheck, build, unit tests, UI E2E,
exploratory validation, persistence, reload, login recovery, financial
reconciliation, zero differences, zero errors, zero warnings, zero mocks and
zero blank screens have been evidenced.

## RC-3 Governance Addendum

- `ActiveDatasetStore` remains the only active dataset selection contract;
  physical storage is accessed by import/library boundaries and paged engine
  providers.
- `DataSourceManager`, `SpreadsheetWorkspaceManager`, and `WorkspaceDNAEngine`
  are compatibility debt. New production consumers are prohibited and every
  existing consumer must be listed in the compatibility allowlist.
- `MetricRegistry` owns stable metric keys. Labels and domain terminology are
  presentation concerns.
- `FinancialConsistencyEngine` compares producer outputs and blocks invalid or
  divergent values. `NaN` is an inconsistency, `null` is absence, and zero is
  valid.
- Domain vocabulary CI checks are mandatory. A legacy baseline is a migration
  queue, never a source for new UI copy.
