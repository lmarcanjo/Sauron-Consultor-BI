# Custom Area Data Contract

Status: **Implemented (F20.3).** `CustomAreaTab` no longer renders raw dataset
rows or invents generic per-column statistics.

## The contract

`src/core/business-intelligence/CustomAreaViewModel.ts` exposes
`buildCustomAreaViewModel(areaId, config, dataOrigem, previewLimit?)`:

```ts
interface CustomAreaViewModel {
  areaId: string;
  areaName: string;
  areaDescription: string;
  readiness: "NOT_CONFIGURED" | "PARTIALLY_CONFIGURED" | "READY";
  consistency: "OK" | "NO_DATA" | "MISSING_FIELDS";
  fields: { physicalName: string; label: string; isNumeric: boolean }[];
  metrics: { id: string; name: string; value: number; format: "currency" | "number" | "percentage" }[];
  summary: { totalRecords: number; previewCount: number };
  recordsPreview: Record<string, string | number>[];
}
```

Returns `null` when the area id does not exist in the active DNA — the caller
renders a distinct "not found / inactive" state instead of an empty
dashboard.

## Rules enforced

- **Only selected, visible fields are shown.** A field is included only if
  it has a `SelectedFieldConfig` entry with `use !== "do_not_use"` and
  `visible === true`. Areas created before per-field configuration existed
  still fall back to their raw `relatedFields` list so they are not left
  empty during the migration window.
- **Only certified, consultant-defined metrics are computed** —
  `config.customMetrics` filtered by `visibleIn.includes(areaId)`. No
  generic "sum every numeric column" behavior remains (this is what the
  previous `CustomAreaTab` implementation did; it has been removed).
- **Bounded preview.** `recordsPreview` is capped at `previewLimit` (default
  50) regardless of dataset size; `summary.totalRecords` still reports the
  true row count so the UI can say "prévia limitada a 50 de 1.240 registros".
- **Explicit readiness, never a silent empty screen.**
  `NOT_CONFIGURED` (no fields selected) and `PARTIALLY_CONFIGURED` (fields
  selected, no metric defined yet) are surfaced as a visible banner in
  `CustomAreaTab`, with the exact next action ("acesse o Modelo Consultivo").
- **Explicit consistency signal.** `NO_DATA` vs `MISSING_FIELDS` vs `OK`,
  shown independently from readiness so a consultant can tell "my area is
  configured but there is no data yet" apart from "my area is not
  configured."

## Known gap

The view model still receives the entire in-memory `dataOrigem` array (the
same array every other tab in the app already operates on) and filters/
aggregates it synchronously on the client. It does **not** stream from
IndexedDB or paginate server-side. For the current app architecture (fully
client-side, dataset already resident in memory for every other module) this
is consistent with the rest of the codebase, but it does not fully satisfy
the "não carregar workbook completo no React" instruction if read literally
as "never hold the full dataset in memory." Addressing that would require a
broader data-layer change (windowed/streamed reads) affecting every tab, not
just Custom Areas, and is out of scope for this phase.
