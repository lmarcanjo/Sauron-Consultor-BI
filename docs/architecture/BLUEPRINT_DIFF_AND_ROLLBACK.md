# Blueprint Diff and Rollback

## Preview before write

`computeBlueprintDiff` compares a blueprint with the active configuration and
returns explicit buckets:

- areas to add, update or leave unchanged;
- areas with a name conflict;
- new and conflicting metrics;
- labels and modules that would change;
- permission suggestions.

The first application may populate the untouched default scaffold. Later
applications treat a changed area name as a conflict. A conflict is never
overwritten without an explicit selection and confirmation.

## Partial application

`applyBlueprintSafely` accepts area and metric selections. It builds the entire
next configuration in memory, applies only selected entries, and commits only
through `commitBlueprintApplication`. Conflicting metrics require
`overwriteMetricConflicts`; otherwise the existing metric is retained.

Blueprint objects, current configuration, areas and metrics are deep-cloned.
The resulting configuration therefore shares no mutable references with the
blueprint catalog or its previous version.

## Rollback

Before each application, a snapshot containing the complete previous
configuration is persisted under a workspace/company key. A bounded history of
20 snapshots is retained for audit. `rollbackBlueprintApplication` validates
the expected snapshot id, restores the exact previous configuration, removes
the active undo pointer and retains the remaining history.

There is no silent overwrite: a caller must preview, choose entries and commit.
If an in-memory operation fails before commit, the repository is not written.
