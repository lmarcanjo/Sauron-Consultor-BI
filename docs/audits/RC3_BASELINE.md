# RC-3 Baseline

Data: 2026-07-16  
Escopo: estado tecnico antes das correcoes da RC-3.

## Resultado Tecnico

| Verificacao | Resultado observado |
| --- | --- |
| `npm run typecheck` | aprovado |
| `npx vitest run` | 338/338 testes, 69 arquivos, 95,94 s |
| `npm run build` | aprovado; chunk principal 1.844,18 kB; alerta > 500 kB |
| `npx playwright test` | 24/24 testes, 40,8 s |
| `git diff --check` | aprovado antes da implementacao RC-3 |

O runner Playwright emitiu apenas o warning externo do Node sobre `NO_COLOR` e
`FORCE_COLOR`; a instrumentacao de pagina nao registrou erro ou warning de
navegador nos cenarios aprovados.

## Fluxo Canonico Observado

```text
UI -> ImportService -> WorkbookRepository -> SpreadsheetStoragePort
   -> IndexedDB -> DataActivation -> ActiveDatasetStore
   -> Business/Rule/Dashboard Engines -> artefatos executivos
```

O fluxo principal preserva metadata e preview no `ActiveDatasetStore`; as linhas
completas permanecem no IndexedDB. O baseline nao encontrou necessidade de
alterar o importador pesado ou reidratar todas as linhas.

## Compatibilidade Legada

| Camada | Evidencia | Estado |
| --- | --- | --- |
| `DataSourceManager` | importado por `App`, hook e componentes antigos; tambem possui estado persistido proprio | facade ainda ativa, com risco de fonte paralela |
| `src/services/dataSourceManager.ts` | reexport usado por consumidores antigos | wrapper sem contrato de saida formal |
| `SpreadsheetWorkspaceManager` | usado pelo proprio servico e suite de compatibilidade | candidato a isolamento/remocao futura |
| `WorkspaceDNAEngine` | `CaseHub`, `CaseOverview`, `CaseOverviewPanel` e `CaseDataPanel` | motor legado de contexto, sem papel no pipeline de planilha |

O inventario de imports mostra `DataSourceManager`/`useDataSourceManager` em
mais de 30 arquivos do `src`, incluindo consumidores de UI, engines de dados,
testes e wrappers. Nao e seguro remover nesta etapa sem migracao coordenada.

## Acessos Fora do Contrato

Foram encontrados imports diretos de storage IndexedDB em componentes e engines,
incluindo `CentralDadosTab`, `EnterpriseCenter`, `EnterpriseDigitalTwinTab`,
`SimpleSpreadsheetImporter`, `SpreadsheetFieldSelectionPanel` e engines de
metricas/dashboard. Esses acessos serao classificados e protegidos por scanner;
nao serao apagados cegamente porque alguns sao leitores sob demanda autorizados.

O principal risco remanescente e a leitura de `activeRecords` pelo hook legado,
que pode representar uma copia materializada em vez da consulta paginada do
dataset selecionado.

## Consistencia Financeira

O `FinancialConsistencyEngine` possui contrato e testes unitarios, mas o baseline
encontrou somente referencias dentro de `src/core/financial-consistency`. Nao ha
registro de producao conectando Dashboard, narrativa, apresentacao, sessao, ata
e plano ao mesmo metric key.

Os produtores ainda calculam valores independentes. Evidencias principais:

- `App.tsx` calcula `receitaTotal`, lucro, margem e comissao para o estado legado;
- `ExecutivePresentationEngine.ts` soma Receita, Custo, Despesa e Comissao;
- `MeetingModePage.tsx` agrega receita, meta e custos para os graficos da sessao;
- `MetricEngine.ts` e `BusinessMetricCalculator.ts` possuem calculadores
  paralelos;
- componentes de narrativa/plano consomem dados sem snapshot de consistencia.

Conclusao: a cadeia esta funcional para a demo, mas nao esta reconciliada de
ponta a ponta.

## Metric Registry

Nao havia um registro canonico central. `BusinessMetricName` usa nomes como
`totalVendido`, `totalComissao`, `receitaCandidata` e `custoCandidato`, enquanto
outros produtores usam `receitaTotal`, `faturamento` e `revenue`. A RC-3 precisa
introduzir aliases controlados sem quebrar as APIs atuais e fazer os snapshots
de consistencia usarem `metricKey` estavel.

## Vocabulário Fora dos Packs

O scanner exploratorio case-insensitive encontrou **83 arquivos** TypeScript/
TSX fora de `src/core/business-domains` e fora de testes contendo termos de
dominio ou labels especificos. O resultado inclui componentes legados,
integracoes, migrações e testes de fluxo; portanto esse numero e um inventario,
nao uma lista de violações equivalentes.

Os casos que exigem triagem sao labels visiveis ou fallbacks em componentes
genericos. Termos em Domain Packs, testes especificos e documentacao historica
devem permanecer permitidos.

## Gaps de Governanca

- nao havia scanner dedicado de imports da compatibility layer;
- nao havia scanner amplo de vocabulario com allowlist de Domain Packs;
- CI executa typecheck, build e Playwright, mas nao Vitest, `git diff --check`,
  scanner de dominio ou reconciliação de fixtures;
- nao havia uma orquestracao de niveis `READY_FOR_ANALYSIS`,
  `READY_FOR_PRESENTATION` e `READY_FOR_MEETING`.

## Riscos Prioritarios

1. Remover `DataSourceManager` antes de migrar consumidores pode quebrar telas
   legadas e a recuperação local.
2. Integrar consistencia diretamente em componentes React pode duplicar calculos
   e violar a separacao de responsabilidades.
3. Um scanner sem allowlist classificaria Domain Packs e testes como violações.
4. Corrigir todos os 83 arquivos de uma vez aumentaria o risco e dificultaria
   atribuir regressões.

## Direcao RC-3

1. Isolar e marcar a compatibilidade como facade passiva, com allowlist de
   consumidores existentes e bloqueio para imports novos.
2. Criar Metric Registry estavel e aliases para os produtores atuais.
3. Evoluir o FinancialConsistencyEngine com lineage tipada e um orchestrator
   sem recalculo.
4. Integrar snapshots no nivel dos engines, nao nas telas.
5. Criar scanners e fixtures de consistencia no CI antes da certificacao final.

Este documento e o ponto de comparacao para o relatorio final RC-3.
