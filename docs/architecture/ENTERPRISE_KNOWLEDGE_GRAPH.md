# Enterprise Knowledge Graph F8.2

## Objetivo

F8.2 transforma a estrutura técnica da planilha, o relatório de reverse engineering, o `ActiveDataset` e os mapeamentos de módulo em um grafo empresarial consultável.

Esta fase não cria dashboards, não executa fórmulas, não altera dados e não mexe no importador.

## Localização

- `src/core/knowledge-graph/KnowledgeGraphTypes.ts`
- `src/core/knowledge-graph/EnterpriseKnowledgeGraph.ts`
- `src/core/knowledge-graph/KnowledgeGraphBuilder.ts`
- `src/core/knowledge-graph/WorkbookToKnowledgeGraphMapper.ts`
- `src/core/knowledge-graph/ModuleMappingGraphMapper.ts`
- `src/core/knowledge-graph/KnowledgeGraphQuery.ts`
- `src/core/knowledge-graph/KnowledgeGraphDiagnostics.ts`
- `src/core/knowledge-graph/index.ts`

## Entradas

`buildKnowledgeGraph(input)` recebe:

- `WorkbookCatalog`;
- `WorkbookReverseEngineeringReport`;
- `ActiveDataset` opcional;
- `ModuleFieldMapping[]` opcional.

Nenhuma linha bruta é necessária para montar o grafo.

## Saída

```ts
EnterpriseKnowledgeGraph {
  graphId
  nodes
  edges
  diagnostics
  createdAt
}
```

## Nós

O grafo representa:

- `Workbook`
- `Sheet`
- `Table`
- `Column`
- `Formula`
- `NamedRange`
- `BusinessRuleCandidate`
- `KpiCandidate`
- `ModuleMapping`
- `Seller`
- `Product`
- `Customer`
- `Branch`
- `Department`
- `Revenue`
- `Cost`
- `Commission`
- `DRECandidate`

Os nós `Seller`, `Product`, `Customer`, `Branch`, `Department`, `Revenue`, `Cost`, `Commission` e `DRECandidate` são conceitos empresariais derivados de mapeamentos e candidatos, não registros individuais carregados da planilha.

## Arestas

Tipos suportados:

- `CONTAINS`
- `DEPENDS_ON`
- `MAPS_TO`
- `FEEDS_MODULE`
- `CANDIDATE_FOR`
- `CALCULATED_BY`
- `BELONGS_TO`
- `DERIVED_FROM`

Exemplos:

- Workbook `CONTAINS` Sheet.
- Sheet `CONTAINS` Column.
- Sheet `CONTAINS` Formula.
- Formula `DEPENDS_ON` Sheet/Column.
- Column `CALCULATED_BY` Formula.
- BusinessRuleCandidate `DERIVED_FROM` Sheet/Column.
- KpiCandidate `CANDIDATE_FOR` Revenue/Commission/DRECandidate.
- Column `FEEDS_MODULE` ModuleMapping.

## APIs

- `buildKnowledgeGraph(input)`
- `findNodesByType(graph, type)`
- `findDependencies(graph, nodeId)`
- `findConsumers(graph, nodeId)`
- `findModuleInputs(graph, moduleName)`
- `findRiskyNodes(graph)`
- `explainNode(graph, nodeId)`

## Perguntas Respondidas

### De onde vem a comissão?

Consultar nós do tipo `Commission` e usar `explainNode`. O grafo mostra candidatos, mapeamentos, colunas, abas e regras que alimentam comissão.

### Quais abas alimentam Pessoas?

Usar `findModuleInputs(graph, "Pessoas")`. A resposta inclui abas, colunas, conceitos semânticos e arestas de mapeamento.

### Quais colunas alimentam Comercial?

Usar `findModuleInputs(graph, "Comercial")` e ler `columns`.

### Quais fórmulas dependem de IMP_VENDAS?

Localizar o nó `Sheet` de `IMP_VENDAS` e usar `findConsumers`. Fórmulas com aresta `DEPENDS_ON` para essa aba aparecem como consumidoras.

## Diagnósticos

`KnowledgeGraphDiagnostics` registra:

- total de nós;
- total de arestas;
- contagem por tipo de nó;
- contagem por tipo de aresta;
- nós órfãos;
- nós arriscados;
- duplicidades mescladas;
- avisos.

Workbooks grandes, como a planilha Honda, geram grafos grandes. Consumidores de UI devem usar consultas e paginação; não devem renderizar tudo de uma vez.

## Limites

- O grafo não executa fórmulas.
- O grafo não calcula KPIs.
- O grafo não cria mapeamento automaticamente.
- O grafo não altera `ActiveDataset`.
- O grafo não resolve a veracidade de uma regra; ele aponta evidências e dependências.

## Próxima Fase Recomendada

F8.3 deve criar uma camada de confirmação humana para o consultor validar:

- quais candidatos viram regras;
- quais conceitos viram entidades;
- quais fórmulas são exceções;
- quais módulos recebem quais fontes;
- quais riscos precisam de correção antes da produção.
