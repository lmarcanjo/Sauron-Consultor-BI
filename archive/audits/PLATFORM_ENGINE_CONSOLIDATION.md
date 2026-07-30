# Platform Engine Consolidation Sprint

Data: 2026-07-08

Escopo: consolidar os motores F8.1 a F8.5 antes de criar novos engines. Este relatório não propõe novas telas, dashboards ou funcionalidades.

## Diagrama Textual Atual

```text
Arquivo XLSX real
  -> WorkbookEngine
      -> WorkbookCatalog
          -> WorkbookReverseEngineer
              -> WorkbookReverseEngineeringReport
          -> KnowledgeGraphBuilder
              -> EnterpriseKnowledgeGraph
          -> RuleEngine
              -> BusinessRule[]

ActiveDataset + moduleMapping
  -> BusinessIntelligenceEngine
      -> BusinessMetric[]
          -> ExecutiveDashboardEngine
              -> DashboardBlock[]
                  -> React components renderizam blocos

ActiveDataset + IndexedDB/API preview
  -> businessViews / moduleMapping / sellerStatement / commissionClosing
      -> fluxos operacionais ainda existentes
```

## Quem Depende de Quem

| Camada | Depende de | Saída | Observação |
|---|---|---|---|
| Workbook Engine | XLSX/CSV/buffer | `WorkbookCatalog` | Base estrutural. Não executa fórmula. |
| Reverse Engineering | `WorkbookCatalog` | `WorkbookReverseEngineeringReport` | Classifica abas, padrões, riscos e candidatos. |
| Knowledge Graph | `WorkbookCatalog`, `ReverseReport`, `ActiveDataset`, `moduleMapping` | `EnterpriseKnowledgeGraph` | Explica relações, dependências e módulos alimentados. |
| Rule Engine | `WorkbookCatalog`, `ReverseReport`, `KnowledgeGraph` | `BusinessRule[]` | Parseia/classifica fórmulas e regras candidatas; não executa fórmulas. |
| Business Intelligence Engine | `ActiveDataset`, `moduleMapping`, catálogo/grafo/regras opcionais | `BusinessMetric[]` | Calcula métricas auditáveis com linhagem. |
| Executive Dashboard Engine | `BusinessIntelligenceEngine`, `ActiveDataset`, `moduleMapping` | `DashboardBlock[]` | Converte métricas, rankings e previews em blocos renderizáveis. |
| React components principais | `ExecutiveDashboardEngine`, `ModuleFieldMappingPanel` | UI | Devem renderizar outputs, não calcular regra. |

## Fluxo Consolidado F8

Componentes já consolidados para renderizar blocos do Executive Dashboard Engine:

- `DashboardPage`
- `ComercialTab`
- `FinanceiroTab`
- `IntelligentDRETab`
- `PeopleIntelligenceTab`

O renderer comum é `DashboardBlocksRenderer`. Ele não calcula métrica; apenas apresenta dados já calculados no engine.

## Correções Aplicadas Nesta Rodada

- `IntelligentDRETab` deixou de calcular DRE heurístico no React e passou a renderizar blocos de `buildModuleDashboard("DRE")`.
- `CommissionClosingPanel` deixou de somar totais de vendedores selecionados no componente; os totais agora vêm de `calculateCommissionSellerTotals` no core.
- Criado teste de sanidade `src/core/platformConsolidationSanity.test.ts`.

## Riscos

| Risco | Impacto | Ação Recomendada |
|---|---:|---|
| `KnowledgeGraph` cria mais de 195 mil nós e 1,1 milhão de arestas com a planilha Honda. | Alto em memória e tempo no browser. | Mover construção completa para backend/worker; frontend deve consumir grafo paginado/resumido. |
| `RuleEngine` processa muitas fórmulas críticas em memória local. | Alto para produção online. | Persistir catálogo de fórmulas e extrair regras em job assíncrono. |
| `BusinessIntelligenceEngine` e `DashboardEngine` podem reler linhas por métrica/bloco. | Médio/alto em datasets grandes. | Introduzir cache de leitura por aba no contexto do engine, com limite por métrica. |
| `businessViews.ts` ainda duplica heurísticas que também existem em BI/Dashboard Engine. | Médio. | Migrar gradualmente consumidores restantes para Dashboard/BI Engine. |
| Componentes legados ainda têm cálculos e textos analíticos próprios. | Médio. | Colocar sob backlog de consolidação antes de reativar como fluxo principal. |

## Duplicidades

| Duplicidade | Arquivos | Ação Recomendada |
|---|---|---|
| Detecção de coluna por padrões | `businessViews.ts`, `BusinessMetricCalculator.ts`, `ExecutiveDashboardEngine.ts`, `moduleMapping.ts` | Criar utilitário de inferência semântica único no core. |
| Leitura paginada/preview/API | `businessViews.ts`, `BusinessMetricCalculator.ts`, `ExecutiveDashboardEngine.ts` | Centralizar em `ActiveDatasetRowProvider`. |
| Rankings e totais comerciais/pessoas | `businessViews.ts`, `ExecutiveDashboardEngine.ts` | Manter rankings no Dashboard Engine; transformar `businessViews` em compatibilidade temporária. |
| Totais de comissão | `commissionClosing.ts`, antes também em `CommissionClosingPanel` | Corrigido: componente usa core. |

## Acoplamentos Indevidos

- Componentes ainda acessam `activeDatasetStore` diretamente para reatividade local. Isso é aceitável como ponte temporária, mas o alvo arquitetural é usar um hook/facade de dataset ativo.
- `ModuleFieldMappingPanel` lê `businessViews.getSheetRows` diretamente para sugerir colunas. É aceitável na camada de configuração, mas deveria consumir um `DatasetSchemaService`.
- `PeopleIntelligenceTab` ainda usa `buildPeopleView` para montar a lista operacional do resumo/holerite. Deve migrar para uma view de engine própria ou para blocos/listas do Dashboard Engine quando a experiência de pessoas for consolidada.
- `ActiveDatasetRawPreview` acessa `ActiveDatasetStore` diretamente; é uma exceção de depuração/preview bruto.

## Componentes React Ainda Calculando Regra de Negócio

Fluxo F8 consolidado:

- `DashboardPage`: sem cálculo financeiro no React.
- `ComercialTab`: sem cálculo financeiro no React.
- `FinanceiroTab`: sem cálculo financeiro no React.
- `IntelligentDRETab`: sem cálculo financeiro no React.
- `DashboardBlocksRenderer`: render-only.

Pendências fora do fluxo F8 principal:

- `ChartsGrid`, `CaseHub`, `DiagnosticoObstaculosTab`, `EstoqueTab`, `PosVendasTab`, `VendedoresTab`, `ModeloConsultivoTab` ainda possuem cálculos e heurísticas legadas.
- `ComissoesTab` ainda renderiza resultados de regras antigas recebidas por props.
- `SpreadsheetStructureDiagnostics` calcula diagnósticos visuais no componente; é ferramenta de diagnóstico e deve migrar para core se virar produção.

## Acessos Diretos ao ActiveDataset Fora dos Engines

Permitidos temporariamente:

- `ActiveDatasetRawPreview`: preview bruto.
- `ModuleFieldMappingPanel`: configuração assistida.
- `CentralDadosTab`: inventário/fonte ativa.

Devem migrar ou receber facade:

- `ComissoesTab`, `ContabilTab`, `DiagnosticoObstaculosTab`, `EstoqueTab`, `PecasTab`, `PosVendasTab`, `PresentationBuilderPage`, `VendedoresTab`.

## Pontos a Mover Para Engines

1. `businessViews.ts` deve ser decomposto em providers reutilizáveis:
   - `DatasetSchemaService`
   - `SemanticColumnResolver`
   - `ActiveDatasetRowProvider`
2. Rankings de pessoas/comercial devem permanecer no `ExecutiveDashboardEngine`.
3. Diagnósticos de planilha devem sair de `SpreadsheetStructureDiagnostics` para um engine de data quality.
4. Módulos legados com `metrics.receitaTotal` devem migrar para `BusinessIntelligenceEngine`.
5. Qualquer DRE fechado deve nascer no Rule/BI Engine, nunca no React.

## Testes Criados

- `src/core/platformConsolidationSanity.test.ts`

Cobertura:

- Componentes não importam `RuleEngine` diretamente.
- Componentes não importam módulos demo/mock.
- Dashboards consolidados usam `ExecutiveDashboardEngine`.
- Superfícies consolidadas não calculam métricas financeiras no React.
- BI, Rule, Workbook, Reverse e Knowledge Graph continuam representados pelos engines corretos.

## Estado de Aceite

- Fluxo F8 principal está engine-first.
- DRE foi retirado de heurística React.
- Fechamento de comissões renderiza totais vindos do core.
- Ainda há legado a migrar, mas não foi reativado como fluxo principal desta sprint.
