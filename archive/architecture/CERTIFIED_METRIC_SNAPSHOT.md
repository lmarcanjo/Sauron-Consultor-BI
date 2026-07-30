# Certified Metric Snapshot

`CertifiedMetricSnapshot` is an evidence envelope built from metrics already
produced by the Business Intelligence Engine and reconciled by
`FinancialConsistencyOrchestrator`.

It records:

```text
snapshotId
tenantId
workspaceId
contextType
contextId
datasetVersion
period
generatedAt
metrics
consistencyStatus
lineage
```

The dashboard engine now attaches a snapshot to its output. The snapshot does
not execute formulas, read all rows, or mutate the workbook. A metric is
`CONSISTENT` only when its source and applicable output agree exactly;
missing mappings remain `PENDING`, and differences are `INCONSISTENT`.

`certifiedMetricSnapshotStore` persists the small evidence envelope locally by
context and dataset version. Dashboard, Presentation and Meeting Prep can
contribute metrics to the same envelope; completed sessions and action plans
retain its `snapshotId` when they are created from certified preparation.
Historical artifact reconciliation still requires every producer to persist
and validate that identifier.

The snapshot ID includes the context and dataset version, so a company view
cannot be silently reused as a group view. Historical producers must persist
the snapshot reference together with their artifact instead of recalculating a
new value.
