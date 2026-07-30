# Chaos Data Profiling: Fluxo Canônico

Status: ACTIVE  
Escopo: MVP de profiling não destrutivo para banco e planilhas  
Data: 2026-07-23

## Objetivo

O profiling organiza sinais de fontes empresariais desestruturadas sem impor um
significado aos dados. O mesmo pipeline recebe uma amostra de tabela, coleção,
aba ou arquivo e devolve perfil físico, classificação estrutural, sugestões e
achados de qualidade.

O módulo está em `src/core/chaos-data-profiling`. Ele não substitui o
`WorkbookEngine`, o `ActiveDataset`, o `SpreadsheetStoragePort`, o
`SourceEnterpriseBinding` ou o `DatabaseConnectionManager`.

## Operação na interface

`ChaosProfilingPanel` aparece no Dashboard e na Central de Dados sempre que há
uma fonte ativa. A ação `Analisar estrutura` é explícita e não é disparada ao
importar ou recarregar. Ela lê uma amostra limitada, mostra progresso e permite
cancelamento. O painel identifica a fonte pelo `sourceId` canônico, mostra
contagem conhecida versus amostrada, blocos, cabeçalhos sugeridos, tipos,
preenchimento e exemplos físicos.

O consultor pode selecionar todas as colunas físicas, inclusive colunas fora da
janela virtualizada, revisar sugestões e labels de exibição, salvar um
rascunho e confirmar uma `DatasetView`. A tabela estruturada só é liberada
depois da confirmação e lê a página selecionada por `readDatasetViewRows`; o
componente React não acessa IndexedDB diretamente.

## Fluxo

```text
Fonte original somente leitura
  -> amostra limitada / preview paginado
  -> RawZoneReference imutável
  -> ChaosSourceProfile
       -> PhysicalColumnProfile
       -> classificação de linhas
       -> DetectedBlock
       -> SemanticSuggestion
       -> QualityFinding
  -> revisão do consultor
  -> DatasetView DRAFT
  -> confirmação explícita
  -> DatasetView CONFIRMED
  -> módulos que consumam a view confirmada
```

Nenhum relatório, indicador ou gráfico é gerado a partir de uma fonte apenas
perfilada. Uma view não confirmada é exploratória e permanece em `DRAFT`.

## Contrato unificado

`ChaosSourceInput` identifica a fonte por `sourceId`, nome, tipo e contexto
canônico (`groupId`, com `companyId` opcional). Seus `physicalContainers`
representam tabela, aba, coleção ou arquivo e carregam apenas uma amostra
limitada de `PhysicalRecord`.

`ChaosSourceProfile` registra:

- contêineres e colunas físicas;
- tipos observados e percentuais de preenchimento;
- cardinalidade, repetição, exemplos, padrões e limites;
- papéis prováveis, sempre com confiança e evidência;
- linhas `TITLE`, `HEADER`, `DATA`, `TOTAL`, `EMPTY`, `FORMULA_ROW` e demais
  classificações possíveis;
- blocos sugeridos sem remover ou reordenar linhas;
- achados de qualidade;
- referência da Raw Zone e versão do profiling.

Números em `Grupo`, `Revenda`, `Marca`, `Filial` ou `id` são valores válidos.
Eles podem receber uma sugestão de código ou identificador, mas nunca são
convertidos em nomes. Uma coluna numérica também não vira métrica sem seleção
explícita.

## Raw Zone interna

Para planilhas, o `ActiveDataset` continua sendo a porta de metadata/preview e
o `SpreadsheetStoragePort` é lido por páginas. O profiler guarda a referência
física (`rawStorageRef`, hash quando disponível, aba, linha e colunas), não uma
segunda cópia completa no React.

Para banco, o profiler recebe amostras de uma consulta previamente validada.
`assertReadOnlyProfilingQuery` permite uma única `SELECT` com `LIMIT` ou uma
consulta de metadata `SHOW`, `DESCRIBE`/`DESC` ou `EXPLAIN`. Antes disso o
`SecurityEngine` também é chamado. O profiler não abre conexão e não escreve
resultado no banco.

A origem permanece imutável. Hashes, amostras e referências são evidência do que
foi lido, não autorização para alterar o arquivo ou a base.

## Profiling e sugestões

As sugestões são escopadas ao contêiner e às colunas físicas. Isso evita que A,
B ou C tenham um significado global quando aparecem em blocos diferentes.

São detectados, entre outros sinais:

- tipos misturados, números/datas recebidos como texto e colunas quase vazias;
- linhas vazias, cabeçalhos repetidos, totais, fórmulas e possíveis erros de
  fórmula;
- duplicidade exata de registros e repetição de possíveis identificadores;
- mudanças de estrutura, padrões extremos e contêineres estruturalmente
  semelhantes;
- relações candidatas código-nome por consistência de ocorrência.

Cada `SemanticSuggestion` contém papel, escopo, confiança, evidência, exemplos,
relações possíveis, alertas e status `SUGGESTED`. Nenhuma sugestão é aplicada
automaticamente.

## DatasetView

`createDatasetView` cria uma view derivada com:

- `selectedRowsRule` explícita;
- colunas físicas selecionadas;
- mapeamento físico-lógico;
- labels de exibição;
- filtros e transformações versionadas e reversíveis.

Ela nasce `DRAFT`. `confirmDatasetView` exige a identificação do consultor,
clona as estruturas e muda o status para `CONFIRMED`. A confirmação não altera
`PhysicalRecord`, workbook, arquivo ou banco.

## Deduplicação e versões

`compareChaosSources` compara hash quando disponível e, na ausência dele,
estrutura de contêineres, colunas e nome. O resultado é `EXACT_COPY`,
`POSSIBLE_NEW_VERSION` ou `DISTINCT`. O módulo apenas sinaliza a situação;
abrir, cancelar, versionar ou importar como cópia exige decisão da camada de
importação/biblioteca.

Nenhuma fonte é sobrescrita pelo profiling.

## Contexto empresarial

`groupId`, `companyId` e `SourceEnterpriseBinding` são a verdade de contexto.
Campos físicos como `Grupo`, `Empresa` e `Revenda` entram somente como sinais e
relações candidatas. Quando uma identidade ou vínculo canônico contradiz o
contexto recebido, o profiler falha de forma explícita antes de produzir o
perfil.

## Grandes volumes

- Planilhas usam `getRowsPaged` com uma página limitada por aba.
- Banco usa `profileDatabasePagedSample` com páginas pequenas e limite total.
- `AbortSignal` cancela profiling entre páginas e durante a análise.
- Nenhum adaptador chama `getRows` para montar o perfil.
- O React não recebe a fonte completa e nenhum engine de negócio é executado.
- A amostra não deve ser interpretada como contagem completa; `rowCount` do
  contêiner, quando conhecido, permanece separado de `sampledRecords`.

## Auditoria e limites do MVP

O perfil mantém evidências suficientes para revisão, mas não afirma a verdade
semântica de uma coluna. Estilos avançados de XLSX, bordas e linhas ocultas
continuam disponíveis no `WorkbookCatalog`; o adaptador de catálogo usa apenas
preview, headers físicos, fórmulas e contagens nesta etapa.

Ainda é necessária validação manual com:

1. banco real conectado pela VPN, confirmando consulta somente leitura;
2. planilha Honda real, comparando hash antes/depois;
3. revisão de blocos e sugestões;
4. criação e confirmação de `DatasetView`;
5. reload da metadata e nova importação para confirmar duplicidade;
6. evidência de que nenhuma origem foi alterada.

## Evidência automatizada desta integração

`tests/e2e/chaos-profiling-operational.spec.ts` cobre uma fonte de teste com
70 colunas físicas de `A` a `BR`, ausência de análise automática, progresso,
seleção total, rascunho, confirmação, tabela baseada na view, reload e
persistência. O SHA-256 do arquivo antes e depois permaneceu idêntico.

Na validação local de 23/07/2026: typecheck, build local, 88 arquivos/446
testes Vitest e o E2E focado passaram. O Playwright completo terminou com 58
passados e um teste flaky preexistente de persistência de fixture; a execução
isolada desse teste passou. Isso não substitui a validação manual real abaixo.

Até essa validação manual, este escopo não recebe parecer de aprovação
operacional, mesmo com typecheck e testes automatizados verdes.
