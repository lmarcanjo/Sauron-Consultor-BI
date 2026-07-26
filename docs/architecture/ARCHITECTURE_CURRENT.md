# Current Architecture

## Boundary

```text
Consultant UI
  -> NavigationRegistry / App shell
  -> ImportService or database boundary
  -> DataActivation
  -> WorkbookRepository + SpreadsheetStoragePort
  -> ActiveDatasetStore (metadata + preview)
  -> Chaos profiling and confirmed DatasetView
  -> BusinessIntelligenceEngine / ExecutiveDashboardEngine
  -> module results and executive artifacts
```

The browser keeps metadata, a bounded preview and confirmed selections. Full
rows remain in the storage adapter and are read on demand.

## Single Owners

- `EnterpriseRepository` owns group, company and unit records.
- `EnterpriseContextStore` owns the selected organizational context.
- `WorkbookRepository` owns workbook and version records.
- `ActiveDatasetStore` owns the active dataset projection.
- `ChaosProfilingRepository` owns structural analysis and DatasetView state.
- `BusinessIntelligenceEngine` owns audit-able metrics.
- `ExecutiveDashboardEngine` owns dashboard blocks.
- `PlatformEvents` owns cross-module notifications.
- `NavigationRegistry` and `consultingFlowStructure` expose the single
  consultant-facing navigation surface.

## Cleanup Result

The old case shell, story builder, digital twin, SDL showcase, compensation
policy defaults, historical catalog/quality facades and duplicate MVP dashboard
configuration are no longer production routes or consumers.

## Known Boundary

The source screen composes importer, database connection, persisted source
selection and structural analysis, while the canonical services retain their
separate ownership boundaries underneath. The consultant sees one source
surface; storage, activation and analysis are not duplicated.
