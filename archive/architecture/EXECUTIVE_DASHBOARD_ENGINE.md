# F8.5 — Executive Dashboard Engine

## Objetivo

O Executive Dashboard Engine transforma métricas auditáveis do `BusinessIntelligenceEngine` em blocos executivos reutilizáveis. Componentes React devem apenas solicitar blocos e renderizá-los, sem calcular métricas de negócio dentro da interface.

## Entradas

- `ActiveDataset`: fonte real ativa, metadados, preview e referência de armazenamento.
- `moduleMapping`: abas, colunas e papéis semânticos escolhidos por módulo.
- `WorkbookCatalog`: catálogo estrutural do workbook quando disponível.
- `EnterpriseKnowledgeGraph`: nós e arestas de linhagem quando disponível.
- `RuleEngine`: regras candidatas parseadas e explicáveis quando disponível.
- `BusinessIntelligenceEngine`: cálculo auditável de métricas.

## Módulo

Arquivos em `src/core/dashboard-engine/`:

- `DashboardTypes.ts`: tipos de blocos, dashboard, diagnóstico e linhagem.
- `DashboardBlockBuilder.ts`: cria blocos a partir de métricas, rankings, tabelas e pendências.
- `ExecutiveDashboardEngine.ts`: orquestra métricas, rankings e previews por módulo.
- `DashboardDiagnostics.ts`: consolida avisos, erros, confiança e pendências.
- `DashboardLineage.ts`: conecta cada bloco às métricas, abas, colunas, regras e leitura de linhas.
- `index.ts`: API pública.

## Blocos

- `MetricCard`: card de métrica calculada pelo `BusinessIntelligenceEngine`.
- `RankingBlock`: ranking real por coluna mapeada, calculado no core.
- `TableBlock`: prévia tabular real da aba mapeada.
- `PendingConfigBlock`: orientação quando falta mapeamento ou coluna.
- `InsightBlock`: aviso auditável derivado de diagnóstico de métrica.

Cada bloco possui:

- `id`
- `title`
- `type`
- `status`
- `data`
- `sourceMetrics`
- `lineage`
- `diagnostics`

## APIs

```ts
buildExecutiveDashboard(context)
buildModuleDashboard(moduleName, context)
explainDashboardBlock(blockId)
getDashboardLineage(blockId)
```

## Regras

- Nenhum cálculo executivo fica em componente React.
- Componentes renderizam somente blocos.
- Se faltar mapeamento, o bloco retorna `pending`.
- Se faltar dado, o bloco retorna `insufficient_data` ou `empty`.
- Se houver dado real, o bloco preserva aba, colunas, estratégia de leitura e métricas de origem.
- Dados originais não são alterados.

## Uso Atual

- `DashboardPage`: usa `buildExecutiveDashboard`.
- `ComercialTab`: usa `buildModuleDashboard("Comercial")`.
- `FinanceiroTab`: usa `buildModuleDashboard("Financeiro")`.
- `PeopleIntelligenceTab`: usa `buildModuleDashboard("Pessoas")` e preserva os fluxos reais de vendedores e fechamento.

## Resultado Esperado com a Planilha Honda

- Dashboard exibe cards de total vendido, comissão, vendedores e ticket médio quando mapeados.
- Comercial exibe rankings reais de vendedores, produtos/itens e clientes quando as colunas existem.
- Financeiro exibe métricas reais ou configuração pendente.
- Pessoas exibe quantidade real e rankings quando há mapeamento.
- Cada bloco possui linhagem consultável.
