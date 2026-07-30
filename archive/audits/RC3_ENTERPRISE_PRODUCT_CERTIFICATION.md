# RC-3 Enterprise Product Certification

Data: 2026-07-16  
Escopo: consolidacao incremental dos engines F8, confiabilidade da jornada
executiva, fronteiras de compatibilidade e saneamento de dados demonstrativos.

## Estado Atual

O fluxo canonico permanece:

```text
UI -> SimpleSpreadsheetImporter -> ImportService -> WorkbookRepository
   -> SpreadsheetStoragePort/IndexedDB -> DataActivation -> ActiveDatasetStore
   -> Workbook/Reverse/Graph/Rule/BI/Dashboard Engines -> UI executiva
```

O importador pesado nao foi reescrito. O `ActiveDatasetStore` continua
persistindo metadata e preview, enquanto as linhas completas permanecem no
IndexedDB e sao consultadas sob demanda.

Nesta rodada foram consolidados o `MetricRegistry`, a linhagem financeira
tipada, o `FinancialConsistencyOrchestrator`, os produtores de Dashboard e
Apresentacao e a leitura de metricas na Sessao Executiva. Tambem foi corrigido
um loop de renderizacao que bloqueava a navegacao para a Sessao quando uma
fonte real estava ativa.

## Bugs Encontrados e Corrigidos

| Causa | Impacto | Correcao | Evidencia |
| --- | --- | --- | --- |
| `MeetingModePage` dependia de referencias de arrays recriadas durante a sincronizacao local. | A troca para Sessao Executiva podia entrar em rerenders sucessivos e o clique expirava. | Dependencias passaram a usar assinatura de dataset, linhas amostradas e mappings; calculo de metricas foi adiado para depois do primeiro paint. | Jornada isolada com dois arquivos reais chegou a Sessao; Playwright 25/25 serial. |
| A rota de Preparacao nao estava renderizada no `App.tsx`. | O menu podia trocar de estado sem montar a tela de Preparacao. | Rota canonica adicionada com `MeetingErrorBoundary`. | `executive-journey-certification.spec.ts` verde. |
| Preparacao iniciava analise estrutural pesada na navegacao. | O primeiro clique podia competir com Reverse Engineering/Grafo/Rule Engine. | Analise estrutural foi marcada como opcional nessa entrada; BI continua real e a analise estrutural nao foi removida. | Jornada F17.1 e `rc3-enterprise-certification.spec.ts` verdes. |
| Sessao possuia participantes, consultor, mes e percentuais fixos. | A apresentacao podia parecer demonstrativa mesmo sem dado configurado. | Defaults fixos foram removidos; labels neutros e configuracao pendente passaram a ser usados. | Busca da Sessao sem nomes/percentuais demonstrativos; E2E completo verde. |

## Compatibilidade Legada

| Modulo | Uso atual | Estado RC-3 | Risco restante |
| --- | --- | --- | --- |
| `DataSourceManager` | Facade usada por App, hook e tabs antigas | Marcada como deprecated, allowlist explicita e sem novos imports | Ainda possui estado/cache proprio; nao pode ser removida nesta rodada |
| `SpreadsheetWorkspaceManager` | Wrapper e suite historica | Marcado como deprecated; fluxo principal usa ImportService/WorkbookRepository | Consumidores e persistencia legados ainda existem |
| `WorkspaceDNAEngine` | Nenhum consumidor de UI encontrado | Fronteira marcada; telas de caso usam `WorkspaceSuggestions`/Domain Packs | Arquivo e testes permanecem para migracao coordenada |
| `CompensationEngine` | Mantido por compatibilidade e testes | Removido do fluxo de People Intelligence; nenhum valor salarial ficticio e exibido | Motor legado ainda existe fora do fluxo principal |
| `EnterpriseDigitalTwinTab` | Rota legada acessivel | Mantida para nao quebrar jornada existente | Ainda nao foi migrada integralmente para os engines F8 |
| `ExecutiveSession` e Story Engine | Rotas executivas existentes | Sessao consome valores do BI; Story permanece compatibilidade | Ata, Plano e Story ainda nao sao produtores canonicos de consistencia |

Os testes `compatibilityArchitecture` e `legacyAdapterSanity` falham quando
um consumidor novo atravessa a fronteira sem justificativa. A remocao completa
dos adapters nao foi declarada concluida.

## Dados e Metric Registry

O `MetricRegistry` fornece chaves estaveis para total vendido, receita, custo,
despesa, resultado, comissao, vendedores, clientes, produtos, ticket e margem.
Aliases legados permanecem controlados no registry, sem duplicar calculo.

Os produtores principais agora sao:

| Produtor | Estado |
| --- | --- |
| Business Intelligence Engine | Canonico para metricas reais e linhagem |
| Executive Dashboard Engine | Usa BI e emite blocos com consistencia |
| Presentation Builder/Engine | Usa BI e `metricKey`; expoe consistencia |
| Meeting Prep | Usa BI; analise estrutural opcional na entrada |
| Meeting Mode/Session | Usa valores produzidos pelo BI para a sessao |
| Ata e Plano | Ainda consumidores legados; sem snapshot canonico de consistencia |

O `FinancialConsistencyEngine` distingue nulo, zero e `NaN`, bloqueia
divergencias e possui estados `READY_FOR_ANALYSIS`,
`READY_FOR_PRESENTATION` e `READY_FOR_MEETING`. A integracao efetiva cobre
Dashboard e Apresentacao/Preparacao. A cadeia completa
`Source -> Dataset -> KPI -> Dashboard -> Narrative -> Presentation -> Meeting
-> Minutes -> Action Plan` ainda nao esta conectada em todos os produtores.

## Vocabulário e Mock/Demo

O scanner de vocabulario de dominio e o scanner anti-demo foram adicionados ao
CI. O teste de producao nao encontrou novos tokens nao autorizados: ocorrencias
restantes estao na baseline explicita, Domain Packs, plugins ou migracoes. Isso
nao equivale a uma purga historica completa; a divida permanece registrada.

O fluxo principal nao usa `DEMO_DATA`, `demoData`, `generateDemo`, `mockRows`,
`Grupo Alpha`, `Topázio` ou `MOCK DATA`. Fixtures e testes continuam contendo
dados sinteticos apenas fora da producao.

## Jornada do Consultor

Validada pela UI:

1. Primeiro acesso e sessao do consultor.
2. Cadastro de grupo, empresas e unidades.
3. Importacao de fontes reais.
4. Biblioteca, configuracao e ativacao.
5. Dashboard, Financeiro, Comercial, Pessoas e DRE.
6. Apresentacao, Preparacao e Sessao Executiva.
7. Ata, Plano, Historico e recuperacao por reload.

Resultado oficial: `25 passed` em `npx playwright test --workers=1`, incluindo
`active-dataset-reflection`, `executive-journey-certification` e
`rc3-enterprise-certification`. Execucoes paralelas anteriores tiveram falhas
intermitentes de contenção durante imports simultaneos; a certificacao foi
repetida serialmente contra servidor limpo para obter evidência deterministica.

## Validacao Tecnica

| Verificacao | Resultado final |
| --- | --- |
| `npm run typecheck` | aprovado |
| `npm run test -- --pool=threads --maxWorkers=1 --reporter=dot` | 367/367 testes, 76 arquivos, aprovado |
| `npm run build` | aprovado; bundle principal 1.923,53 kB, gzip 510,55 kB |
| `npx playwright test --workers=1` | 25/25, aprovado em aproximadamente 2,5 min |
| `git diff --check` | aprovado |
| scanners de qualidade/compatibilidade | aprovados dentro da baseline autorizada |

O build ainda emite alerta de chunk acima de 500 kB. Isso e risco de
performance, nao falha funcional desta rodada.

## Performance

O baseline existente em
[`ENGINE_PERFORMANCE_BASELINE.md`](./ENGINE_PERFORMANCE_BASELINE.md) registra:

- 21 abas;
- 38.179 linhas catalogadas;
- 194.143 formulas;
- workbook de aproximadamente 1,8 MB;
- Knowledge Graph com 1.141.322 arestas;
- delta de heap estimado de aproximadamente 874,7 MB no pior engine.

O processamento estrutural completo continua inadequado para o thread
principal de um navegador em producao. A arquitetura de worker/backend e o
plano correto, mas nao foi implementada como parte desta consolidacao.

## Acessibilidade e UX

A jornada nao apresentou tela branca, erro de pagina, erro de console ou
warning de navegador nos cenarios Playwright aprovados. Foram corrigidos o
bloqueio de navegacao da Sessao e os residuos demonstrativos visiveis.

Nao foi executada nesta rodada uma varredura automatica WCAG/axe nem uma
certificacao completa de teclado. Portanto acessibilidade formal permanece
pendente.

## Itens Restantes

- Remover `DataSourceManager` e `SpreadsheetWorkspaceManager` apos migracao de
  todos os consumidores e chaves persistidas.
- Retirar `WorkspaceDNAEngine` e `CompensationEngine` quando os adapters e
  testes historicos nao tiverem consumidores.
- Mover toda ocorrencia de vocabulario generico ainda permitida pela baseline
  para Domain Packs, em vez de apenas manter allowlist.
- Conectar `FinancialConsistencyOrchestrator` aos produtores de Narrativa,
  Ata, Plano e Historico, com evidencia numerica zero-diferenca end-to-end.
- Executar auditoria automatica de acessibilidade e reduzir o chunk principal.
- Manter Reverse Engineering, Knowledge Graph e Rule Engine fora do navegador
  para workbooks grandes.

## Parecer Final

## ❌ REPROVADO

Motivo exato: a jornada demonstravel local, os engines principais e a suite de
testes estao estaveis, mas a certificacao Enterprise RC-3 exige consolidacao
completa. Ainda existem adapters legados ativos, vocabulario residual fora de
uma migracao definitiva e a reconciliacao financeira nao esta ligada a todos
os produtores de Narrativa, Ata e Plano. Tambem nao ha evidencia formal de
acessibilidade WCAG. O produto esta apto para validacao tecnica incremental,
mas nao atende o limiar Enterprise final sem essas pendencias.
