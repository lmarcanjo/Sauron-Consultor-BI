# Business Intelligence Engine F8.4

## Objetivo

F8.4 cria métricas auditáveis a partir de dados reais, mapeamentos de módulo e camadas estruturais anteriores do Sauron.

Esta fase não cria dashboard avançado, não mexe no importador, não altera dados originais e não usa mock/demo.

## Localização

- `src/core/business-intelligence/BusinessMetricTypes.ts`
- `src/core/business-intelligence/BusinessMetricBuilder.ts`
- `src/core/business-intelligence/BusinessMetricCalculator.ts`
- `src/core/business-intelligence/BusinessInsightEngine.ts`
- `src/core/business-intelligence/BusinessLineage.ts`
- `src/core/business-intelligence/BusinessIntelligenceEngine.ts`
- `src/core/business-intelligence/index.ts`

## Entradas

`BusinessIntelligenceContext` pode receber:

- `ActiveDataset`;
- `ModuleFieldMapping[]`;
- `WorkbookCatalog`;
- `WorkbookReverseEngineeringReport`;
- `EnterpriseKnowledgeGraph`;
- `BusinessRule[]`;
- `rowProvider` opcional para leitura paginada/sob demanda.

## Métricas Iniciais

- `totalVendido`
- `totalComissao`
- `quantidadeVendedores`
- `quantidadeClientes`
- `quantidadeProdutos`
- `ticketMedio`
- `margemCandidata`
- `receitaCandidata`
- `custoCandidato`

## Contrato da Métrica

Cada métrica retorna:

- `id`
- `name`
- `value`
- `status`: `ready`, `pending`, `insufficient_data`
- `source`
- `sheetName`
- `columnsUsed`
- `rowsSampled`
- `lineage`
- `diagnostics`

## APIs

- `calculateMetric(metricName, context)`
- `calculateModuleMetrics(moduleName, context)`
- `BusinessIntelligenceEngine.calculateMetric(metricName)`
- `BusinessIntelligenceEngine.calculateModuleMetrics(moduleName)`
- `BusinessIntelligenceEngine.explainMetric(metricId)`
- `BusinessIntelligenceEngine.getMetricLineage(metricId)`

## Regras

- Se faltar `ActiveDataset`, a métrica fica `pending`.
- Se faltar mapeamento, a métrica fica `pending`.
- Se houver mapeamento mas não houver linha/coluna/valor suficiente, fica `insufficient_data`.
- Se houver dado real suficiente, fica `ready`.
- Nenhuma métrica é inventada.
- Nenhum mock/demo é usado.

## Linhagem

Cada métrica registra:

- dataset;
- workbook;
- abas de entrada;
- colunas usadas;
- mapeamentos de módulo;
- nós do Knowledge Graph;
- regras relacionadas;
- transformação textual aplicada;
- estratégia de leitura: `rowProvider`, `indexedDB`, `api`, `preview` ou `none`.

## Limites

- F8.4 calcula métricas iniciais simples e auditáveis.
- Não executa fórmulas da planilha.
- Não substitui regras aprovadas por consultor.
- Não renderiza dashboard.
- Em produção, o `rowProvider` deve ler páginas do backend/worker ou storage paginado.

## Próxima Fase Recomendada

F8.5 deve criar validação humana das métricas:

- aprovar coluna oficial de receita;
- aprovar coluna oficial de comissão;
- aprovar período/unidade;
- versionar métricas calculadas;
- expor resultados para UI com paginação e explicação.
