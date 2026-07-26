# Page Capability Model

Status: **Implemented as a thin accessor over NavigationRegistry (F20.3).**

## Principle

Gates ask "what can this page do?", never "what is this page called?". The
capability contract for any route — static or a consultant-defined Business
Area — is expressed as:

```ts
interface PageCapability {
  routeKey: string;
  isRegistered: boolean;
  canRenderWithoutDataset: boolean;
  requiresActiveDataset: boolean;
  requiresCertifiedSnapshot: boolean;
  requiresConfiguredFields: boolean;
  isBusinessArea: boolean;
}
```

`src/core/navigation/PageCapabilityModel.ts` exposes:

- `getPageCapability(routeKey)` — safe, never throws; unknown routes resolve
  to a fully-restricted capability object (`isRegistered: false`), so a gate
  fails closed instead of guessing from the route name.
- `isBusinessAreaRoute(routeKey)` — replaces every
  `activeTab.startsWith("custom_area_")` check in the codebase.
- `extractBusinessAreaId(routeKey)` — replaces every
  `activeTab.replace("custom_area_", "")` call.

This module holds **no data of its own** — it is a read-only view over
`NavigationRegistry`, so there is exactly one place capability flags are
declared (`STATIC_NAV_ITEMS` for built-in pages, `registerFromDNA` for
Business Areas).

## Where this is wired in today

- `App.tsx`: the three previous `activeTab.startsWith("custom_area_")` sites
  (two empty-state gates, one component-dispatch check) now call
  `isBusinessAreaRoute` / `extractBusinessAreaId`.
- `CustomAreaTab.tsx` / `CustomAreaViewModel.ts`: consume the resolved area
  directly (see `CUSTOM_AREA_DATA_CONTRACT.md`).

## Known gap

The two large "no dataset" / "not homologated" empty-state gates in
`App.tsx` still carry an explicit array of exempt static tab ids rather than
being expressed purely in terms of `getPageCapability(activeTab)
.canRenderWithoutDataset`. Replacing that array outright changes behavior for
tabs whose registry `requiresDataset` flag does not (yet) match the array
exactly (e.g. `executive_workspace`), and could not be safely verified against
the full Playwright suite within this phase. This is the primary reason F20.3
is **not** certified as fully capability-driven end-to-end — see
`F20_3_DYNAMIC_PLATFORM_CERTIFICATION.md` for the exact remaining diff.
