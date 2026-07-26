# F20.3 Final Certification

Date: 2026-07-19
Scope: dynamic areas lifecycle, Blueprint safety, contextual access control,
multi-company integrity and accessibility.

## Estado atual

The existing NavigationRegistry, Project DNA configuration, ActiveDataset,
IndexedDB-backed row access and F8 engines were preserved. No importer,
repository replacement, mock flow or full-workbook React load was introduced.

## Bloqueadores corrigidos

| Causa | Impacto | Correção | Evidência |
| --- | --- | --- | --- |
| Business Area was removed directly from configuration. | No archive state, impact preview or recovery. | `BusinessAreaLifecycleService` now owns ACTIVE → ARCHIVED → TRASHED → DELETED using namespaced TrashRepository snapshots. | Unit tests and Modelo Consultivo lifecycle controls. |
| Blueprint application shared catalog objects and had no safe rollback. | A model could overwrite configuration or leak mutable references. | `BlueprintDiffService` provides preview buckets, partial selection, explicit conflicts, deep clones and bounded snapshot history/rollback. | 3 Blueprint unit tests, typecheck and build. |
| Area grants were absent from real navigation and data access. | A route could be hidden inconsistently and a direct view could expose data. | Contextual `AreaPermissionRepository`, `AccessControlEngine`, NavigationRegistry, CustomAreaViewModel and presentation filtering now share the same policy path. | 2 permission unit tests, dynamic route E2E and access-denied ViewModel tests. |
| Company and unit scopes inherited sibling/group bindings. | DRE and Dashboard could show another company's source. | Company resolution now accepts only the company's bindings and child-unit bindings; unit resolution accepts only the unit binding. | RC-3 final multi-company E2E: C=100, D=200, E=300, Group=600. |
| Sidebar special handling discarded the filtered static menu. | KPIs/DRE and Comercial disappeared in a persisted configuration. | The canonical filtered item list is preserved while dynamic entries remain registry-driven. | `app.spec.ts` 6/6 and full Playwright. |
| Configuration retained the previous company subtab. | A company switch could open the model in a misleading stale step. | Model configuration resets to its first step when context changes. | F19.2 1/1. |
| Dynamic area route had serious contrast findings. | The route failed the WCAG gate. | Foreground colors were adjusted for the connected state and pending/configuration messages. | F20.3 axe run: zero critical/serious findings. |

## Lifecycle and recovery

Area ids are namespaced by workspace and company/group. Restore preserves the
same id, display name, related fields, related metrics, order, visibility and
context. Permanent deletion requires exact-name confirmation, clears dangling
references and revokes contextual grants. Stale dynamic links are classified
as archived or never existed before safe fallback.

## Blueprint safety

The preview separates additions, updates, unchanged entries and conflicts.
Partial area and metric selection is supported. Existing area names and metric
definitions are not overwritten without explicit confirmation. The active
snapshot pointer is removed after rollback while a bounded audit history is
retained.

## Access and output surfaces

Navigation checks `VIEW_AREA`, the ViewModel strips all protected fields and
rows before rendering, lifecycle handlers check mutation actions, and
presentation generation includes only active, visible, permitted areas in the
current group/company context. Historical artifacts retain their own stored
snapshot and are not recalculated by this closure.

## Accessibility

The focused dynamic-area Playwright scenario runs axe with WCAG 2A/2AA tags.
It passed with zero `critical` and `serious` violations. Dialogs expose modal
semantics and labelled headings; toast feedback is announced through a polite
live region; native controls retain keyboard focus behavior. The existing F19
accessibility suite also ran inside the full browser certification.

## Validation

| Check | Result |
| --- | --- |
| `npm run typecheck` | passed |
| `npx vitest run` | 82 files / 409 tests passed |
| `npm run build` | passed; advisory large-chunk warning only |
| F19.2 controlled model | 1/1 passed |
| RC-3 multi-company isolation | 1/1 passed |
| F20.3 dynamic hardening + axe | 2/2 passed |
| Full Playwright | 53/53 passed, 4.5 minutes, 1 worker |
| `git diff --check` | passed |

## Itens restantes

The main JavaScript bundle remains large and is a performance follow-up for a
later phase. It did not change the bounded dataset contract or cause a test,
typecheck, build, accessibility or browser failure in this closure.

## Parecer final

## ✅ APROVADO COMO PLATAFORMA DINÂMICA
