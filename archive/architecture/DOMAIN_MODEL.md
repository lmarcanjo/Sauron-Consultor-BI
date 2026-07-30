# Domain Model

```text
Organization
  -> BusinessGroup
      -> Company
          -> Unit

Workbook
  -> WorkbookVersion
      -> SourceIdentity
          -> SourceEnterpriseBinding

SourceIdentity
  -> ActiveDataset metadata
      -> DatasetView (DRAFT | CONFIRMED)
          -> ModuleMapping
              -> BusinessMetric
                  -> CertifiedMetricSnapshot
                      -> Dashboard / Presentation / Session / Plan
```

Physical column names and source rows are immutable. A DatasetView records the
consultant's confirmed selection; semantic roles and display labels are
interpretations, not mutations of the source.

The context key is organizational and dataset-specific. A module can render a
real value only when its source and required interpretation are available.

## Legacy Exclusion

There is no separate case, digital-twin, story-builder or compensation policy
domain in the current product flow. Historical code was removed rather than
kept as a second source of truth.
