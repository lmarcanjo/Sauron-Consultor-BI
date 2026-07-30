# Executive Artifact Consistency

## Canonical chain

```text
Source -> Dataset -> KPI -> Dashboard -> Narrative -> Presentation
       -> Session -> Minutes -> Action Plan -> History
```

`FinancialConsistencyOrchestrator` is the only comparison contract. The
source value is the reference and the default tolerance is zero. Missing
stages are pending; differences block publication; zero is a valid value and
is never converted to missing.

The Dashboard Engine creates a `CertifiedMetricSnapshot` from its metric
outputs. Presentation and meeting preparation contribute to the same envelope.
A session started from certified preparation passes the snapshot to its meeting
record and to action plans created inside that session. Historical Narrative,
Minutes and History records still need explicit snapshot persistence and
reconciliation before enterprise certification can be approved.

No artifact may invent Receita, Custo, Despesa or Comissao. When a mapping is
missing, the consultant sees `Configuracao pendente` and the applicable source
columns.

## Acceptance evidence

The RC-3 UI journey proves zero-difference totals for a synthetic three-company
context after field confirmation: C=100, D=200, E=300 and Group=600. The
remaining end-to-end artifact reconciliation is listed explicitly in the
final certification report.
