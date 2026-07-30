# Legacy Inventory

Date: 2026-07-24
Scope: Sprint 15, cleanup of duplicate product paths and unused production code.

## Method

The inventory was produced from production imports, route registrations, component
references, store references and compatibility allowlists. A file is considered
legacy when it has no production consumer, duplicates a canonical flow, or
contains a compatibility state/persistence path that is not the owner of the
current contract.

## Canonical Responsibilities

| Responsibility | Current owner | Status |
| --- | --- | --- |
| Spreadsheet import | `ImportService` + `SimpleSpreadsheetImporter` | Keep |
| Physical storage | `SpreadsheetStoragePort` / IndexedDB | Keep |
| Workbook library | `src/core/workbook-library/WorkbookRepository.ts` | Keep |
| Active source metadata | `ActiveDatasetStore` + `DataActivation` | Keep |
| Structure confirmation | `ChaosProfilingPanel` + `chaos-data-profiling` | Keep |
| Business metrics | `BusinessIntelligenceEngine` + `MetricRegistry` | Keep |
| Dashboard blocks | `ExecutiveDashboardEngine` | Keep |
| Company/group/unit registry | `EnterpriseRepository` + `EnterpriseContextStore` | Keep |
| Navigation | `NavigationRegistry` + `consultingFlowStructure` | Keep |
| Executive presentation | `PresentationBuilderPage` + `ExecutivePresentationEngine` | Keep |
| Executive session | `MeetingModePage` + `useExecutiveSessionState` | Keep |

## Component Inventory

| Area | Components | Consumers | Replacement | Action |
| --- | --- | --- | --- | --- |
| Source entry | `CentralDadosTab`, `CentralDadosDrawer`, `DatabaseConnector`, `SimpleSpreadsheetImporter` | App and data navigation | ActiveDataset/DataActivation boundary | Keep at boundary; migrate database facade incrementally |
| Canonical result | `DashboardPage`, `ActiveDatasetRawPreview`, `ChaosProfilingPanel` | App dashboard | DatasetView and dashboard engines | Keep |
| Canonical modules | `FinanceiroTab`, `ComercialTab`, `IntelligentDRETab`, `PeopleIntelligenceTab`, `CommissionClosingPanel` | App routes | Business/BI/Dashboard engines | Keep; mapping panel is a confirmation control inside the module |
| Workbook management | `WorkbookLibraryTab` | App data navigation | WorkbookRepository | Keep |
| Executive output | `PresentationBuilderPage`, `MeetingPrepTab`, `MeetingModePage`, `ReportsPage` | App routes | Executive engines and certified metrics | Keep |
| Removed duplicate UI | `MvpDataFirstPanel`, `SmartConfigurationPanel`, old spreadsheet viewers/diagnostics, old filters/charts/KPI cards, `ApresentacoesTab` | No canonical consumer after cleanup | Chaos profiling and current presentation builder | Remove |
| Removed case shell | `CaseHub`, `ExecutiveWorkspace`, `Case*Panel` components | Only the former no-dataset shell | `EnterpriseCenter` for setup, `DashboardPage` after activation | Remove |
| Removed labs/specialized shell | `SDLStudio`, `EnterpriseDigitalTwinTab` | Lab/legacy route only | SDK remains internal; `EnterpriseCenter` owns organization setup | Remove |
| Removed story path | `ExecutiveStoryTab` and `src/core/story/*` | Story route/tests only | `PresentationBuilderPage` + `ExecutivePresentationEngine` | Remove |
| Removed compensation path | `CompensationEngine`, `ExecutivePeopleService` | Test/type-only path | `sellerStatement` and commission closing using mapped data | Remove |

## Substitution Matrix

| Old flow | New flow | Destination | Decision | Justification |
| --- | --- | --- | --- | --- |
| MVP dashboard configuration | Chaos profiling -> confirmed DatasetView | `ChaosProfilingPanel` | REMOVE | Both asked the consultant to select source fields; the DatasetView is the confirmed source interpretation. |
| Smart configuration card on Dashboard | Chaos semantic suggestions | `chaos-data-profiling` | REMOVE | Suggestions belong beside the structural review, not in a second Dashboard wizard. |
| SpreadsheetWorkspaceManager | ImportService -> WorkbookRepository -> DataActivation | canonical import boundary | REMOVE | The wrapper could persist and activate through a competing manager. |
| DataEngine/DataCatalog/DataQuality | Workbook/Chaos/BI engines | canonical engines | REMOVE | No production consumer remained. |
| WorkspaceDNAEngine | WorkspaceIntelligenceEngine | workspace intelligence | REMOVE | Two engines represented the same workspace decision. |
| CompensationEngine defaults | mapped seller statement and commission closing | people/commission data views | REMOVE | Default policies could produce values without a configured source rule. |
| Digital Twin screen | EnterpriseCenter + EnterpriseRepository | organization setup | REMOVE | Separate organization state duplicated group/company/unit management. |
| CaseHub/ExecutiveWorkspace | EnterpriseCenter without a source, Dashboard with a source | App shell | ABSORB | The shell still needs a destination for first setup; the canonical center now owns it. |
| Story Builder | PresentationBuilderPage | executive preparation | REMOVE | Presentation was the active output path; the story route was a parallel product surface. |
| DataSourceManager family | ActiveDatasetStore/DataActivation/storage port | data state | KEEP TEMPORARILY | Existing boundary consumers make immediate removal unsafe; no new use is permitted. |

## Core/Service Inventory

| Legacy item | Function | Replacement | Importance/risk | Action |
| --- | --- | --- | --- | --- |
| `src/core/data/DataSourceManager.ts` | Historical facade, filters, active records and compatibility persistence | `ActiveDatasetStore`, `DataActivation`, `SpreadsheetStoragePort` | High risk: still has production consumers and can materialize old records | Keep temporarily; migrate consumers before deletion |
| `src/hooks/useDataSourceManager.ts` | React facade over the historical manager | Active dataset/context hooks | Medium/high risk: used by boundary and meeting compatibility screens | Keep temporarily; no new consumers |
| `src/services/dataSourceManager.ts` | Re-export of the historical facade | Canonical data contracts | Medium risk: App and boundary components still import it | Keep temporarily; no new consumers |
| `WorkspaceIntelligenceEngine` | Workspace/domain decision and import context | F10 workspace intelligence | Current owner of workspace decisions | Keep |
| `DataCatalog`, `DataQuality`, `DataEngine`, `DataLineage` | Unused historical data engine facade | Workbook/Chaos/BI engines | No production consumers after cleanup | Removed |
| `SpreadsheetWorkspaceManager` | Alternative spreadsheet CRUD/activation API | ImportService + WorkbookRepository + DataActivation | Could create a second source of truth | Removed |
| `WorkspaceDNAEngine` | Previous workspace heuristics | WorkspaceIntelligenceEngine | Duplicate domain decision logic | Removed |
| `CompensationEngine` | Default policy and synthetic dossier calculation | Mapped seller statement/commission closing | Could expose unconfigured values | Removed |
| `DigitalTwinEngine` | Separate organization representation | EnterpriseRepository/context | Duplicate enterprise state | Removed |
| `src/core/story/*` | Versioned story builder and replay | Executive presentation/session flow | Duplicate executive output path | Removed |

## Stores and Repositories

The active canonical stores are `ActiveDatasetStore`, `ActiveSourceSelectionStore`,
`EnterpriseContextStore`, `EnterpriseRepository`, `WorkbookRepository`,
`ChaosProfilingRepository`, `moduleMapping`, `certifiedMetricSnapshotStore`,
and `PlatformEvents`. The historical `DataSourceManager` family remains only as
an explicitly documented migration boundary; it is not allowed to gain new
features or new consumers.

## Residual Risk

The App shell and a few database/meeting compatibility components still read
the historical facade. Removing it in this sprint would reintroduce a second
migration rather than reduce risk. The next cleanup must migrate those exact
consumers and then delete the facade, hook and re-export together.
