# RC-3 Final Baseline

Date: 2026-07-16

## Before changes

- `npm run typecheck`: passed.
- Vitest baseline: 76 files and 367 tests passed.
- Build: passed; main bundle approximately 1.9 MB and emitted a non-blocking
  chunk-size warning.
- `git diff --check`: passed.
- Full Playwright baseline: 24 passed, 1 failed (`app.spec.ts`, Dossies
  navigation could not find the header data-center action).

## Reproduction

The first UI reproduction showed that repeated company creation selected the
previous company as the next parent. D and E therefore became descendants of
the previous company instead of siblings in Group A. The context bar then
showed a group while the active dataset still belonged to the last unit.

The source resolution also built the company unit set from the whole group,
which allowed sibling company data into a company scope. Asynchronous IndexedDB
previews could finish out of order and overwrite a newer context.

## Evidence after incremental fixes

`tests/e2e/rc3-final-multi-company-enterprise.spec.ts` uses the UI to create
one group, three sibling companies and three units, import C/D/E, confirm field
suggestions, switch contexts, open DRE, reload, archive D and restore D.

Observed values:

```text
Empresa C = 100
Empresa D = 200
Empresa E = 300
Grupo     = 600
Grupo after archiving D = 400
Grupo after restoring D = 600
```

The focused run passed in 19 seconds with no browser error or warning captured.

## Final validation after the fixes

- `npm run typecheck`: passed.
- `npx vitest run`: 76 files and 369 tests passed.
- `npm run build`: passed; the known main-bundle warning remains.
- `git diff --check`: passed.
- Full Playwright with `CI=1`, `DISABLE_HMR=true`, one worker and an isolated
  Vite server: 26/26 passed. The run had no retries or browser console
  failures and completed in 2.9 minutes.
- Focused F17.1 journey: 1/1 passed.
- Focused RC-3 multi-company journey: 1/1 passed.

The F18 consultant-persona helper now accepts the durable post-import signal
(`Dados Reais Ativos`) when the one-step importer closes its transient modal
before the queue filename is painted. The focused F18 journey passed 6/6
without retry.

Certified metric envelopes are merged by context and dataset version in
`certifiedMetricSnapshotStore`. Dashboard, Presentation and Meeting Prep write
to that envelope; sessions and action plans carry its `snapshotId` when the
consultant starts from certified preparation.

The final runs exclude `system_db.json` and test evidence folders from the Vite
watcher. This prevents runtime persistence writes from restarting HMR during a
long UI journey.
