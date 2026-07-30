# RC-3 Final Enterprise Certification

Date: 2026-07-16  
Scope: enterprise closure, multi-company isolation, contextual source
selection, recovery and trust evidence.

## Executive Summary

The principal multi-company defects were reproduced and corrected. A source
now has one canonical workbook/dataset identity and one organizational binding.
Group, company and unit views resolve their own sources without copying links
between entities. The active dataset remains metadata plus preview after reload;
rows continue to be read from IndexedDB on demand.

## Root Causes And Corrections

| Finding | Root cause | Correction | Evidence |
| --- | --- | --- | --- |
| Cross-company visibility | Company resolution included every unit in the group. | Company resolution now includes only its own units and canonical bindings. | RC-3 multi-company E2E |
| DRE did not change reliably | IndexedDB refreshes could complete out of order. | Context refresh sequence ignores stale results and publishes one bounded dataset. | Company switch and DRE assertions |
| C, D and E became nested | New company creation used the selected company as parent. | New companies resolve to the selected or first group; units resolve to their company. | RC-3 setup and hierarchy |
| Unlinked source disappeared on reload | Import persisted `GROUP` without `groupId`. | An import without an organization is persisted as `WORKBOOK` scope. | Active dataset reflection E2E |
| Fresh source appeared archived | Import readiness was written into lifecycle status. | Lifecycle remains `ACTIVE`; readiness is computed separately. | Import and library journeys |
| Vite destabilized long E2E runs | Runtime writes to `system_db.json` triggered HMR reloads. | Operational files are ignored by the Vite watcher. | Full Playwright run |
| Presentation could reuse previous context rows | An empty scoped query fell back to caller-provided rows. | Explicit enterprise contexts now keep the empty scoped result and show pending state. | Typecheck, engine tests and RC-3 journeys |
| Consultant persona test raced one-step import | The importer closed the transient queue before the filename assertion. | The existing test accepts the durable active-source signal. | F18 focused journey 6/6 |

## Canonical Identity And Binding

The implemented contracts are documented in:

- `docs/architecture/SOURCE_IDENTITY_CANONICAL.md`
- `docs/architecture/SOURCE_ENTERPRISE_BINDING.md`
- `docs/architecture/CONTEXTUAL_ACTIVE_SOURCE_SELECTION.md`

The canonical binding is stored by `EnterpriseRepository`. Legacy entity
arrays are normalized as compatibility mirrors and are not used to resolve the
certified company/group views. Temporary `up_file_*` identifiers are rejected
by the production identity guard and covered by the production sanity test.

## Multi-Company Evidence

The UI-only journey
`tests/e2e/rc3-final-multi-company-enterprise.spec.ts` creates a group, three
companies and three units, imports one source per company, switches contexts,
reloads, archives and restores a source.

```text
Empresa C                 100
Empresa D                 200
Empresa E                 300
Grupo A                   600
Grupo A after archive D   400
Grupo A after restore D   600
```

The same journey confirms that C does not see D/E, D does not see C/E, E does
not see C/D, and the body contains no `up_file_*`. The focused run passed 1/1
in 33.4 seconds with no browser error or warning.

## Recovery And Consultant Journey

`tests/e2e/executive-journey-certification.spec.ts` passed 1/1 with:

1. context registration;
2. group, company and unit creation;
3. source import and activation;
4. module configuration and executive navigation;
5. archive and restore;
6. reload;
7. logout and login;
8. mock/demo vocabulary assertion.

An unlinked import also persists after reload through `WORKBOOK` scope. This
prevents a valid source from being cleared merely because the consultant has
not assigned it to a company yet.

## Validation Results

| Check | Result |
| --- | --- |
| Typecheck | passed |
| Vitest | 369/369 passed in 76 files |
| Build | passed; main bundle remains about 1.94 MB, with a non-blocking chunk warning |
| Playwright complete | 26/26 passed, one worker, `DISABLE_HMR=true`, no retries |
| F18 consultant personas | 6/6 passed without retry |
| Focused F17 journey | 1/1 passed |
| Focused RC-3 multi-company journey | 1/1 passed |
| `git diff --check` | passed |
| Production identity/mock sanity | passed |

## Trust And Snapshot State

`CertifiedMetricSnapshot` is attached to Dashboard Engine outputs and receives
the canonical context type/id, dataset version, metric values and lineage.
`certifiedMetricSnapshotStore` merges metric contributions for the same
context/version. Presentation and Meeting Prep now contribute to that same
envelope, and completed meetings/action plans retain its `snapshotId` when the
session is started from certified preparation. The implementation is described in
`docs/architecture/CERTIFIED_METRIC_SNAPSHOT.md`.

The consistency contract remains zero-tolerance and is described in
`docs/architecture/EXECUTIVE_ARTIFACT_CONSISTENCY.md`. Dashboard and readiness
outputs are covered, and the active preparation-to-session path now carries a
shared snapshot reference. Historical Narrative/Presentation/Session/Minutes/
Action Plan/History records are not yet all reconciled by snapshot ID, so the
chain must not be considered mathematically certified end to end until that
historical integration exists.

## Legacy, Vocabulary And Accessibility

`DataSourceManager` and `SpreadsheetWorkspaceManager` remain passive
compatibility facades because older screens still consume them. `WorkspaceDNA`
and `CompensationEngine` are classified for migration; they are outside the
certified multi-company path but have not been physically removed.

Domain-specific vocabulary is isolated through Domain Packs for the certified
journey. A broader source audit still finds allowed legacy/domain-pack files.

The WCAG report remains pending formal axe automation, focus-return coverage,
200% zoom review and complete keyboard evidence:
`docs/audits/WCAG_ACCESSIBILITY_AUDIT.md`.

## Remaining Enterprise Gates

- persist and reconcile shared snapshot references for historical Narrative,
  Presentation, Session, Minutes, Action Plan and History records;
- complete formal WCAG/axe audit and CI gate;
- finish migration/removal of compatibility consumers;
- reduce the production bundle and move heavy workbook analysis off the
  browser for large workbooks.

## Parecer Final

## ❌ REPROVADO

The multi-company functional blockers are closed and the complete local UI
suite is green. Enterprise certification is still rejected because formal
WCAG evidence is pending, legacy adapters still have consumers, and the full
Narrative -> Presentation -> Session -> Minutes -> Action Plan chain does not
yet persist and reconcile one certified snapshot end to end. Approving now
would overstate the evidence.
