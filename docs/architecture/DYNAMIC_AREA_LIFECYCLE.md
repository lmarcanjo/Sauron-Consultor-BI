# Dynamic Area Lifecycle

## Contract

Business Areas are configuration records owned by the active consulting model.
They are never removed from the physical workbook. The lifecycle is:

```text
ACTIVE -> ARCHIVED -> TRASHED -> DELETED
             |           |
             +-----------+
                 RESTORE -> ACTIVE
```

`BusinessAreaLifecycleService` is the only application service allowed to
transition these states. It uses the existing `TrashRepository`; no second
area repository or shadow state is created.

## Transitions

- `archiveArea`: stores an immutable area snapshot, records dependencies and
  removes the area from the active configuration.
- `moveAreaToTrash`: changes the existing trash item to `TRASH` and updates the
  snapshot lifecycle without changing its id.
- `restoreArea`: restores the original id, name, fields, metrics, order and
  visibility. Repeated restore is idempotent.
- `permanentlyDeleteArea`: requires the exact display name, removes the trash
  item, clears dangling area references and revokes scoped permissions.

`getImpactReport` is shown before archive and reports linked metrics,
presentation/meeting references, permissions and blueprint references.
`validateDependencies` blocks invalid transitions and keeps non-blocking
impact information separate from errors.

## Identity and scope

The trash entity id is namespaced as
`bizarea::<workspace>::<company-or-group>::<areaId>`. This prevents a restored
area from colliding with an area from another company and prevents a stale
deep link from being interpreted in the wrong context.

Active navigation is rebuilt from the persisted configuration. Archived and
trashed areas are indexed by `NavigationRegistry` only to classify a stale
route as archived; they are never rendered as active navigation entries.

## Recovery guarantees

No lifecycle operation changes source rows. A failed confirmation or missing
entity leaves the source and configuration untouched. Restore uses the
snapshot rather than generating a new area id, so saved mappings and links
remain addressable.
