# Financial Consistency Engine

Status: constitutional core contract.

O `FinancialConsistencyEngine` valida a cadeia financeira do SAURON sem
recalcular planilhas, executar formulas ou alterar dados originais:

```text
Source -> Dataset -> KPIs -> Dashboard -> Narrative -> Presentation
       -> Meeting -> Minutes -> Action Plan
```

## Contrato

O engine recebe snapshots de valores produzidos por cada etapa. Para cada
indicador, a etapa `source` e a referencia. O valor esperado e comparado com
as etapas seguintes usando tolerancia zero por padrao. Zero e um valor valido;
ausencia de valor nao e convertida em zero.

O resultado possui tres estados:

- `consistent`: todas as etapas obrigatorias possuem valores iguais a fonte;
- `inconsistent`: existe ao menos uma diferenca numerica, registrada com
  etapa, valor esperado, valor atual e diferenca;
- `pending`: a fonte, um indicador ou uma etapa obrigatoria ainda nao foi
  fornecida.

Um `NaN` nao e ausencia nem zero: e um valor invalido produzido por uma etapa
e reprova a reconciliacao como `inconsistent`, com a etapa e o indicador
registrados em `invalidValues`.

O `FinancialConsistencyOrchestrator` tambem calcula a prontidao do contexto:
`READY_FOR_ANALYSIS`, `READY_FOR_PRESENTATION`, `READY_FOR_MEETING`, `PENDING`
ou `BLOCKED`. Cada produtor declara as etapas aplicaveis; etapas ainda nao
integradas permanecem pendentes e nunca recebem um valor artificial.

## Uso

```ts
import {
  createStageSnapshot,
  reconcileFinancialConsistency,
} from "../../src/core/financial-consistency";

const report = reconcileFinancialConsistency({
  requiredStages: ["source", "dataset", "kpis", "dashboard"],
  stages: [
    createStageSnapshot("source", { totalVendido: 38073 }),
    createStageSnapshot("dataset", { totalVendido: 38073 }),
    createStageSnapshot("kpis", { totalVendido: 38073 }),
    createStageSnapshot("dashboard", { totalVendido: 38073 }),
  ],
});
```

O modulo nao acessa React, IndexedDB ou APIs. Cada produtor de output deve
fornecer seus valores e sua origem; componentes de interface apenas exibem o
relatorio.

Na integracao RC-3, o Dashboard e a Apresentacao ja fornecem metricas
canonicas e lineage. Preparacao exibe a prontidao da apresentacao. Sessao,
ata e plano ainda sao adapters legados e nao devem ser tratados como
financeiramente reconciliados ate receberem seus snapshots proprios.

## Governanca

Nenhum dashboard, narrativa, apresentacao, ata ou plano deve mascarar uma
diferenca. Sem dados suficientes, o produto deve exibir `Configuracao
pendente.` e solicitar validacao do consultor.
