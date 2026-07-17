# Canonical Source Identity

Status: RC-3 incremental contract.

## Contract

`SourceIdentity` is the identity envelope attached to an imported dataset:

```text
sourceId
workbookId
datasetId
importJobId?
fingerprint
fileName
storageMetadataKey
storageRowsKey
tenantId?
workspaceId?
groupId?
companyId?
unitId?
```

`workbookId` is generated once by `workbook-library/WorkbookRepository` and is
the canonical identity used by the library, bindings, activation and lifecycle
operations. File names are display values only.

`src/core/data/sourceIdentity.ts` rejects empty or temporary `up_file_*` values
at the repository boundary. The only remaining references to that prefix are
the compatibility detector and the idempotent legacy migration; new records
cannot use it.

## Migration

Legacy arrays are read by `EnterpriseRepository.listSourceBindings()` only to
create canonical bindings. The migration is idempotent, removes temporary IDs
from mirrors, keeps physical workbook and row storage, and normalizes repeated
references to one owner. Unresolved data is preserved for diagnosis instead of
being deleted.

## Storage

Metadata and previews remain in local persistence. Complete rows remain in
IndexedDB and are read by page. The active store never rehydrates a workbook in
full after reload.

## Guardrails

- `WorkbookRepository.createWorkbook` validates supplied IDs.
- Production sanity fails when a production module introduces a new
  `up_file_*` reference outside compatibility code.
- React components receive canonical workbook/dataset metadata and do not
  generate source IDs.
