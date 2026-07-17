# Source Enterprise Binding

## Single source of truth

`EnterpriseRepository` persists `SourceEnterpriseBinding` under
`sauron_source_enterprise_bindings_v1`:

```text
bindingId, sourceId, workbookId, datasetId, tenantId, workspaceId,
groupId?, companyId?, unitId?, status, createdAt, updatedAt
```

There is one active organizational owner for a source. `bindSource()` replaces
the previous relation instead of appending a second relation. Removing a
binding does not remove the workbook or its physical rows.

Legacy `workbookIds` arrays are compatibility mirrors. They are normalized from
the binding collection and are never the source used by consolidation.

## Resolution rules

```text
GROUP   -> active sources bound to child companies or units
COMPANY -> sources bound to that company or its own units
UNIT    -> sources bound to that unit
```

Sibling companies are never included in a company scope. Group resolution
deduplicates by canonical workbook ID before reading pages.

## Lifecycle

Workbook lifecycle is limited to `ACTIVE`, `ARCHIVED`, and `DELETED`.
Readiness (`READY`, pending mapping, storage health) belongs to
`WorkbookReadinessService` and cannot be written into lifecycle status.

Archiving excludes the workbook from active resolution; restoring makes the
same binding available again. Deleting a binding or workbook is explicit and
does not operate on temporary IDs.
