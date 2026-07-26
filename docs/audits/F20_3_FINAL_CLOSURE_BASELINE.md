# F20.3 Final Closure Baseline

Date: 2026-07-19

## Baseline before closure fixes

The repository already contained the F20.2 dynamic-area work and a dirty
working tree from the prior sprint. The first validation of this closure found:

- typecheck: passed;
- Vitest: 402 passed and one domain-vocabulary guard failed on terms in the
  new lifecycle/Blueprint comments;
- build: passed;
- Playwright: 43 passed and 10 failed.

The browser failures were concrete regressions, not ignored assertions:

1. the sidebar reconstruction discarded filtered static items, hiding KPIs/DRE
   and Comercial;
2. the model configuration test selected a header context control instead of
   the metric form, then preserved the previous subtab after a company switch;
3. company source resolution inherited sibling sources through the group id,
   so the DRE of one company could show the consolidated dataset;
4. the dynamic route had serious contrast findings in axe.

## Root causes recorded

`EnterpriseConsolidationService.getSourcesForContext` treated a group binding
as valid for every company in that group and a company binding as valid for
every unit under that company. The active dataset was therefore rebuilt with
the wrong source set. Separately, the special sidebar branch used the original
group items instead of the already filtered list.

## Final evidence

After the incremental fixes:

- RC-3 multi-company journey: 1/1, C=100, D=200, E=300, Group=600,
  archive Group=400 and restore Group=600;
- F19.2 configuration and company switching: 1/1;
- F20.3 dynamic route, reload, invalid deep link and axe: 2/2;
- full Playwright: 53/53 in 4.5 minutes with one worker;
- full Vitest: 82 files, 409 tests passed;
- `npm run typecheck`: passed;
- `npm run build`: passed;
- `git diff --check`: passed.

The main production bundle remains above Vite's advisory 500 kB threshold.
This is a known performance follow-up and did not block the F20.3 functional,
security or accessibility gates; no large-workbook processing was moved into
React by this closure.
