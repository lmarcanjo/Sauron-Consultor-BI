# Workbook Engine F8.1

## Objetivo

O Workbook Engine cataloga a estrutura real de uma planilha importada sem transformar, normalizar, apagar, calcular ou interpretar dados de negócio. Ele é a base técnica para fases futuras que vão mapear módulos do Sauron para abas, colunas, fórmulas e regras existentes no arquivo original.

F8.1 não cria dashboards, KPIs, BI, DRE, comissão, IA ou telas novas.

## Localização

- `src/core/workbook/WorkbookTypes.ts`: contratos do catálogo técnico.
- `src/core/workbook/WorkbookEngine.ts`: fachada principal para catalogar arquivos.
- `src/core/workbook/WorkbookParser.ts`: parser estrutural de workbook.
- `src/core/workbook/WorkbookService.ts`: serviço de aplicação para catalogar e persistir.
- `src/core/workbook/WorkbookRepository.ts`: persistência do catálogo, sem linhas brutas.
- `src/core/workbook/WorkbookInspector.ts`: consultas somente leitura sobre o catálogo.
- `src/core/workbook/index.ts`: export público.

## Contrato Principal

O catálogo produzido é um `WorkbookCatalog`:

- `id`
- `metadata`
- `sheets`
- `tables`
- `namedRanges`
- `formulas`
- `pivotTables`
- `charts`
- `hiddenRows`
- `hiddenColumns`
- `freezePanes`
- `mergedCells`
- `conditionalFormatting`
- `dataValidation`
- `dependencies`
- `diagnostics`
- `createdAt`

## Metadata

O engine captura:

- nome do arquivo;
- extensão;
- data de importação;
- hash;
- tamanho do arquivo;
- autor;
- empresa;
- data de modificação;
- versão Office/LibreOffice quando disponível;
- idioma;
- contagem de abas;
- contagem de linhas;
- maior quantidade de colunas;
- contagem estimada de células por `usedRange`.

## Abas

Cada aba recebe:

- id, nome e índice;
- visibilidade: `visible`, `hidden`, `veryHidden`;
- total de linhas e colunas pelo `usedRange`;
- range usado;
- preview técnico limitado;
- flags para fórmulas, gráficos, pivôs, tabelas/regiões, células mescladas, formatação condicional, nomes definidos e linhas/colunas ocultas.

## Tabelas e Regiões

F8.1 detecta:

- structured tables presentes nos XMLs do XLSX;
- regiões contínuas de células preenchidas;
- header row provável como início do range.

Essa detecção não classifica o significado de negócio da tabela. Ela só descreve estrutura.

## Perfil de Colunas

Para cada coluna do `usedRange`, o engine cataloga:

- nome original detectado;
- alias vazio;
- tipo inferido: `empty`, `text`, `number`, `date`, `boolean`, `mixed`;
- quantidade de valores;
- vazios;
- únicos;
- duplicados;
- percentual de preenchimento;
- mínimo/máximo quando aplicável;
- exemplos;
- padrão textual e numérico;
- possíveis datas, CPF, CNPJ, telefone, CEP, códigos e IDs.

O limite `profileRowsPerSheetLimit` permite perfilar apenas uma janela da aba. O preview nunca representa carregamento completo na UI.

## Fórmulas

O catálogo registra fórmulas sem executar cálculo. Tipos detectados:

- `SOMA`
- `SE`
- `SEERRO`
- `PROCV`
- `XLOOKUP`
- `ÍNDICE` / `INDICE`
- `CORRESP`
- `SOMASE`
- `SOMASES`
- `CONT.SE`
- `CONT.SES`
- `DESLOC`
- `INDIRETO`
- `MÉDIA` / `MEDIA`
- `ARRED`
- `SUBTOTAL`
- `AGREGAR`
- `OUTRA`

Para cada fórmula:

- aba;
- célula;
- texto original;
- tipo detectado;
- dependências extraídas por referência.

O engine não resolve fórmula, não recalcula e não substitui valores.

## Objetos Estruturais

O engine cataloga quando disponível no workbook:

- gráficos;
- tabelas dinâmicas;
- nomes definidos;
- validações de dados;
- formatações condicionais;
- células mescladas;
- linhas/colunas ocultas;
- congelamento de painéis;
- grafo de dependências simples entre fórmulas, abas e nomes definidos.

## Diagnósticos

O catálogo inclui:

- contagens estruturais;
- colunas vazias;
- cabeçalhos duplicados;
- colunas com tipos mistos;
- mudanças de padrão textual;
- problemas estruturais;
- flags de performance.

## Persistência

`WorkbookRepository` persiste apenas o catálogo técnico em `localStorage` quando disponível e usa memória como fallback. Linhas brutas da planilha não são gravadas no `localStorage` por esta camada.

## Performance

F8.1 evita que qualquer consumidor de UI precise ler a planilha inteira:

- consumidores devem usar `WorkbookCatalog`, previews e perfis;
- o engine aceita limite de perfil por aba;
- dados brutos continuam responsabilidade do armazenamento paginado existente ou de backend/worker em produção;
- F8.1 não substitui IndexedDB nem o modo local já aprovado.

Limitação atual: a biblioteca `xlsx` ainda precisa abrir o arquivo para catalogar sua estrutura no modo local. Para produção, a execução deve migrar para backend/worker, mantendo o mesmo contrato `WorkbookCatalog`.

## Fronteiras

O Workbook Engine não deve conhecer:

- Dashboard;
- DRE;
- Comercial;
- Pessoas;
- Financeiro;
- Comissão;
- IA;
- mapeamentos semânticos de negócio.

Essas camadas podem consultar o catálogo na F8.2, mas não devem contaminar o engine com regras de negócio.

## Recomendações para F8.2

- Persistir `WorkbookCatalog` junto ao `ActiveDataset` importado.
- Exibir um “Mapa da Planilha” baseado no catálogo.
- Criar mapeamento assistido usando sheets, columns, named ranges e formulas.
- Mover o parser para backend/worker em produção.
- Associar structured tables ao nome real da aba usando relationships XML.
- Enriquecer detecção de gráficos e pivôs com posição da aba.
- Criar leitura paginada por aba conectada ao mesmo `workbookId`.
