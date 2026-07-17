# Financial Consistency Integration

Status: RC-3 incremental integration  
Data: 2026-07-16

## Contrato

`FinancialConsistencyEngine` continua sendo um comparador. Ele nao executa
formula, nao acessa React, nao le IndexedDB e nao altera workbook original.

O `FinancialConsistencyOrchestrator` coleta `ConsistencyMetric` por contexto e
converte os valores produzidos em snapshots das etapas:

```text
Source -> Dataset -> KPIs -> Dashboard -> Narrative -> Presentation
       -> Meeting -> Minutes -> Action Plan
```

Cada observacao possui `metricKey`, tolerancia e lineage com dataset/workbook,
aba, coluna fisica, papel semantico, mapping, contexto, periodo, produtor e
instante de calculo.

## Estados

- `Dados conferidos`: todas as etapas aplicaveis possuem igualdade exata ou a
  tolerancia documentada;
- `Dados aguardando confirmação`: falta fonte, etapa ou valor;
- `Encontramos uma diferença`: a publicacao fica bloqueada para divergencia ou
  `NaN`.

Nulo e ausencia. Zero e valor valido. `NaN` e erro. A comparacao nao converte
esses estados entre si.

## Niveis de prontidao

| Nivel | Etapas minimas | Uso |
| --- | --- | --- |
| `READY_FOR_ANALYSIS` | source, dataset, kpis, dashboard | liberar analise |
| `READY_FOR_PRESENTATION` | analysis + narrative + presentation | liberar apresentacao |
| `READY_FOR_MEETING` | presentation, meeting, minutes e actionPlan quando aplicavel | liberar sessao |

O orchestrator recebe as etapas aplicaveis explicitamente. Assim, um modulo
nao aplicavel nao reduz o status de outro contexto.

## Integracao atual

O Executive Dashboard Engine gera `consistency` a partir das métricas
canônicas produzidas sobre as linhas reais selecionadas. Para cada métrica
pronta, o valor da etapa `source` é registrado junto com a origem física da
leitura; zero permanece válido e pendências continuam pendências.

`ExecutivePresentationEngine` já consome `BusinessMetric` por `metricKey` e
expõe o relatório de consistência nos fluxos de apresentação e preparação de
reunião. O estágio de apresentação não recalcula receita, custo, despesa ou
comissão. Sessão, ata e plano ainda permanecem consumidores legados e estão
explicitamente pendentes de integração; portanto não são declarados prontos
para publicação financeira nesta RC.

## Uso

```ts
const result = financialConsistencyOrchestrator.reconcile({
  contextId: "company-1",
  requiredStages: ["source", "dataset", "kpis", "dashboard"],
  metrics: [metricProducedByEngine],
});

if (!result.canPublish) {
  // A UI mostra uma mensagem simples e oferece revisão da configuração.
}
```

## Testes

`FinancialConsistencyOrchestrator.test.ts` cobre cadeia consistente,
divergência em Dashboard/apresentação/ata/plano, zero legítimo, ausencia,
arredondamento, percentual, múltiplos contextos, fonte desativada, período
ausente, mapping alterado e `NaN`.
