# Contextual Active Source Selection

## Key

Selections are persisted by:

```text
tenantId + workspaceId + scopeType + scopeId
```

Supported scopes are `GROUP`, `COMPANY`, and `UNIT`. Each key stores a
deduplicated list of source IDs. A workspace-level pointer remains only as a
read-compatible record for older sessions; contextual code reads the full
scope key.

`ActiveSourceSelectionStore` is not a global dataset switch. When context
changes, `EnterpriseContextStore` emits the context event and the registered
consolidation resolver rebuilds the bounded `ActiveDataset` preview for that
scope. Complete rows are read from IndexedDB on demand.

## Race protection

Context refreshes are asynchronous because preview pages may be read from
IndexedDB. `EnterpriseConsolidationService` increments a refresh sequence and
an older request cannot publish after a newer context has been selected. This
prevents a previous unit from reappearing while a group or company is loading.

## UI behavior

During a switch, the previous resolved workbook IDs are cleared from the
context. The dashboard and DRE therefore cannot continue to display the old
scope as if it were current. The new bounded metadata and preview are then
published through `ActiveDatasetStore`.
