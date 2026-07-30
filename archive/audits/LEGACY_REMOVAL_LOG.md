# Legacy Removal Log

Date: 2026-07-24

## Sprint 17 UX Consolidation

The current visible journey is now:

Empresas e Grupos -> Fontes de Dados -> Análise da fonte
  -> Visão Executiva -> Resultados disponíveis
  -> Apresentações -> Reunião -> Plano e Histórico

`WorkbookLibraryTab` and `VpnGatewayTab` were removed. Source setup is owned by
`CentralDadosTab`; field confirmation is owned by its Analysis mode. Result
modules no longer render `ModuleFieldMappingPanel` and point to the source
analysis action when information is missing.

## Removed

- Duplicate MVP dashboard configuration and smart configuration panel from the Dashboard.
- Old spreadsheet viewers, field selectors, diagnostics, filters, charts and KPI card.
- Historical `SpreadsheetWorkspaceManager` and its tests.
- Historical `DataEngine`, `DataCatalog`, `DataQuality` and `DataLineage` facades and tests.
- `WorkspaceDNAEngine`.
- `CompensationEngine` and `ExecutivePeopleService`, including their default dossier data.
- Digital Twin engine and tab.
- SDL Studio route and component.
- CaseHub/ExecutiveWorkspace shell and its case-only panels.
- Story Builder route, component and story engine family.
- Stale compatibility allowlist entries and tests for removed files.

## Consolidated

- No-dataset `Centro de Comando` now renders `EnterpriseCenter`.
- Dataset configuration on Dashboard is represented by `ChaosProfilingPanel` and confirmed `DatasetView`.
- Executive output uses `PresentationBuilderPage` and `ExecutivePresentationEngine`.
- People types are data-only types in `src/core/data/peopleTypes.ts`; no default people are created.
- Navigation routes are registered only in `NavigationRegistry` and the consultant flow structure.

## Deliberately Retained

`DataSourceManager`, its hook and its service re-export still have consumers in
the App and compatibility boundaries. They are not a second import flow by
choice; they are a migration boundary. New code must not import them. Their
removal is a separate safe step after the remaining consumers are migrated.

## Measurable Result

The current source tree has 60 top-level component files, 46 registered static
route definitions and no files under the removed `src/core/story` family. The
working-tree cleanup contains 52 deleted tracked source/test artifacts outside
the generated `dist` output. That deletion count is cumulative with earlier
uncommitted cleanup work in this checkout; it is not presented as an isolated
benchmark for this sprint.

## Historical Documentation

Previous sprint reports and technical records remain immutable evidence. They
are not current architecture contracts. The five current contracts are the
architecture, system flow, domain model, consultant flow and this removal log.
Future updates must point to these documents instead of extending superseded
flow descriptions.

## Before and After

Before the previous cleanup, the same consultant journey could enter through parallel
Dashboard configuration, spreadsheet viewers, workspace wrappers, a case shell,
Story Builder, Digital Twin and SDL showcase routes. Several of those paths
also carried their own state or default records.

After Sprint 17, the product path is:

```text
Empresas e Grupos -> Fontes de Dados -> ImportService/DataActivation
  -> WorkbookRepository/ActiveDatasetStore -> Análise da fonte
  -> Visão Executiva e Resultados disponíveis -> Apresentação e reunião
```

Each removed surface now has one explicit destination in the substitution
matrix. No removed route is registered in the production navigation, and no
removed component is imported by production code.

## Final Validation

| Check | Result |
| --- | --- |
| Typecheck | Passed (`npm run typecheck`) |
| Lint contract | Passed (`npm run lint`, repository script is TypeScript check) |
| Build | Passed with the existing chunk-size warning; main bundle 1,793.57 kB |
| Focused architecture sanity | 7 files, 26 tests passed |
| Vitest | 85 files, 420 tests passed in 105.50 s |
| Playwright | 59/59 passed with one worker in 2.3 min |
| Diff hygiene | `git diff --check` passed |
| Production legacy scan | Removed engines/routes have no production references |
| Mock/demo flow scan | Production anti-mock sanity passed; test fixtures remain test-only |

The E2E run covered onboarding, import, raw source preview, structure review,
context navigation, presentation pending state, session flow, reload and the
existing multi-company journeys. The cleanup did not change the importer,
database drivers, VPN or source data.

## Impact

- Fewer competing entry points for source setup and executive output.
- One structural confirmation flow through Chaos profiling and DatasetView.
- No default people dossier, compensation policy or simulated dashboard path.
- First access now uses the enterprise center rather than a legacy case shell.
- Navigation no longer advertises removed laboratory, story or digital-twin
  routes.

## Residual Risks

- Several specialized result components remain internal destinations because
  existing presentation and domain-area flows still use them. They are no
  longer permanent menu entries and do not own source configuration.
- The main bundle remains above the 500 kB advisory threshold.
- Historical sprint documents remain under their existing folders as immutable
  audit evidence; current contracts are listed in `docs/archive/README.md`.

## Recommendations

1. Migrate the remaining `DataSourceManager` consumers to canonical metadata
   and paginated storage, then delete the facade, hook and re-export together.
2. Address bundle splitting only after the compatibility boundary is removed.
3. Keep the inventory and substitution matrix as a required part of every new
   sprint review.

## Sprint Result

Sprint 15 cleanup is complete for the audited legacy paths. No new product
feature was introduced; the remaining compatibility facade and bundle warning
are recorded rather than hidden.

## Sprint 18 Stabilization Addendum

No legacy component or flow was removed in this stabilization sprint. One
reproduced technical ambiguity was corrected locally: the App header source
button keeps the established `btn-open-data-center` contract and the sidebar
uses `btn-sidebar-open-data-center`. The canonical source action,
`CentralDadosTab`, `ImportService`,
`ActiveDatasetStore` and paginated storage were preserved.

The production API import 404 and unavailable VPN were recorded as open
integration/validation items rather than hidden behind a compatibility fallback.
No importer, driver, VPN, database or original workbook was changed.
