# Dynamic Navigation Registry

Status: **Partially implemented (F20.3)**. This document describes the canonical
navigation model introduced in F20.2 and consolidated in F20.3.

## Problem this replaces

Before F20.3, three independent things "knew" about routing:

1. `VALID_TABS` — a hardcoded array of static tab ids in `App.tsx`.
2. `activeTab.startsWith("custom_area_")` — scattered in three places in
   `App.tsx` and once in `AppSidebar.tsx`, used as a stand-in for "is this a
   dynamic Business Area route?".
3. `AppSidebar.tsx` manually re-derived sidebar entries from
   `activeConfig.businessAreas` on every render, independent of what `App.tsx`
   used to validate the route.

This is exactly the "second registry" failure mode: two components computing
the same thing (which routes exist / which are dynamic) with different code
paths that could silently drift.

## Canonical model

`src/core/navigation/NavigationRegistry.ts` is the **only** place that knows
about routes. It is a singleton (`navigationRegistry`) holding a
`Map<string, NavigationItemDefinition>`.

```ts
interface NavigationItemDefinition {
  id: string;                 // route key (activeTab value)
  type: "STATIC" | "BUSINESS_AREA" | "SYSTEM" | "LAB";
  source: "STATIC" | "DNA" | "SYSTEM";
  label: string;
  iconKey: string;
  group: string;
  order: number;
  visible: boolean;
  canRenderWithoutDataset: boolean;
  requiresDataset: boolean;
  requiresApproval: boolean;
  requiresConfiguredFields: boolean;
  requiredPermission?: string;   // e.g. "VIEW_AREA:comercial"
  adminOnly?: boolean;
}
```

- **Static routes** (`enterprise_center`, `resumo`, `financeiro`, …) are
  registered once at module load from a data table (`STATIC_NAV_ITEMS`).
  `VALID_TABS` still exists in `App.tsx` **only** as human-readable
  documentation of that static surface — it is no longer read by any
  authorization or rendering logic.
- **Business Areas** are registered from the active Project DNA
  (`ConsultingModelConfiguration.businessAreas`) via
  `navigationRegistry.registerFromDNA(areas)`. Each area becomes
  `custom_area_<areaId>` with `type: "BUSINESS_AREA"`, `source: "DNA"`.

## Self-syncing, not externally wired

`registerFromDNA` always clears every previously-registered `DNA` item before
re-registering. The registry keeps itself in sync with the active DNA by
listening for the `sauron:config-updated` window event (dispatched by
`setActiveConsultingModelConfigSync`, which now fires on **every** write —
manual save, Blueprint apply, or company/context switch). No other module
needs to call `registerFromDNA` directly; `App.tsx` and `AppSidebar.tsx` only
**read** the registry.

This closes a real bug found during this phase: `GlobalContextBar.tsx` called
`setActiveConsultingModelConfigSync(config)` directly on company switch
without dispatching any event, so the sidebar and `App.tsx`'s `activeConfig`
state never updated in the same tab — the previous company's Business Areas
stayed visible until a hard reload. Fixed by making
`setActiveConsultingModelConfigSync` always dispatch `sauron:config-updated`.

## Canonical resolution — `resolveNavigationTarget`

```ts
resolveNavigationTarget(requestedTab, context, fallbackRouteKey?)
  → { status, item, fallbackRouteKey }
```

`status` is one of `ALLOWED | NOT_FOUND | DISABLED | NOT_AUTHORIZED |
NOT_APPLICABLE | PENDING_CONFIGURATION`. `App.tsx`'s `resolveSafeActiveTab`
calls this instead of checking `VALID_TABS`/prefixes; only
`NOT_FOUND` / `NOT_AUTHORIZED` / `NOT_APPLICABLE` cause a redirect —
`PENDING_CONFIGURATION` keeps the route active so an in-page gate can render
the correct empty/pending state.

## What is NOT yet finished

- The two large "no dataset" / "not homologated" empty-state gates in
  `App.tsx` still enumerate an explicit exempt-tab array rather than deriving
  their condition purely from `resolveNavigationTarget`. Only the
  `custom_area_` prefix check inside those conditions was replaced
  (`isBusinessAreaRoute`). Fully collapsing those two blocks into a single
  capability-driven gate is tracked as follow-up work — see
  `F20_3_DYNAMIC_PLATFORM_CERTIFICATION.md`.
- Icon resolution for Business Areas in the sidebar still hardcodes the
  `Layers` icon rather than mapping `iconKey` to a component.
