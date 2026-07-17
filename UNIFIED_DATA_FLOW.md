# Sauron F17 — Unified Data Flow

Status: auditoria concluída e primeira consolidação aplicada em 2026-07-15.

## 1. Origem oficial desejada

```text
Arquivo
  -> ImportService
  -> WorkbookRepository (biblioteca e versões)
  -> Dataset persistido no IndexedDB
  -> DataActivation
  -> ActiveDatasetStore
  -> evento DATASET_ACTIVATED
  -> módulos React e engines de análise
```

O `ActiveDatasetStore` é a origem oficial do dataset atualmente selecionado. O
`DataSourceManager` ainda mantém uma cópia compatível do dataset e de registros
legados; essa cópia é um resíduo arquitetural e não deve ser usada para criar um
segundo dataset ativo.

## 2. Fluxos encontrados

### 2.1 Importação principal

```text
CentralDadosTab
  -> SimpleSpreadsheetImporter
  -> createImportService()
  -> LocalImportService ou ApiImportService
  -> IndexedSpreadsheetStorage (modo local)
  -> WorkbookLibraryRepository
  -> DataActivation.activateImportedSources()
  -> ActiveDatasetStore.setActiveDataset()
```

`SimpleSpreadsheetImporter` é o caminho principal atual. Ele usa o contrato
`ImportService`, mantém fila de arquivos e chama `activateImportedSources` após
o `activateImport` do serviço.

### 2.2 Biblioteca de workbooks

```text
WorkbookLibraryTab
  -> workbook-library/WorkbookRepository
  -> selectWorkbook()
  -> DataActivation.activateImportedSources()
  -> ActiveDatasetStore
```

É o caminho correto para alternar entre workbooks já persistidos. A biblioteca
também executa arquivamento, restauração, exclusão e vínculo organizacional.

### 2.3 Upload legado em `App.tsx`

`App.tsx` ainda possui `handleFileUpload`, que lê XLSX diretamente no componente,
normaliza linhas, cria um `virtualFile` e chama
`dataSourceManager.addSpreadsheetFile(..., "REPLACE")`. Esse caminho não usa
`ImportService`, não gera o mesmo catálogo de abas e pode sobrescrever o estado
legado. Deve ser removido do fluxo visual ou convertido em delegação ao
`SimpleSpreadsheetImporter`.

### 2.4 Revisão em lote

`BatchImportReview` implementa um segundo caminho de leitura e persistência:
parseia arquivos, grava metadata/linhas no IndexedDB e chama
`activateImportedSources` diretamente. A ativação é compartilhada, mas o
processamento anterior não é. Esse componente deve ser tratado como adaptador
de UI até ser migrado para `ImportService`.

### 2.5 Central de Dados

`CentralDadosTab` contém o modal do `SimpleSpreadsheetImporter`, mas também
possui ações diretas de ativação, arquivamento, exclusão, vínculo e chamadas ao
`DataSourceManager`. O modal é o importador compartilhado; as ações da biblioteca
devem continuar delegando ativação apenas a `DataActivation`.

### 2.6 Conector de banco

`DatabaseConnector` entrega registros financeiros por callback para `App.tsx` e
é um fluxo de fonte de banco separado. Ele não deve misturar esses registros
com um dataset de planilha ativo. A proteção atual em `App.tsx` bloqueia a dupla
ingestão de planilha, mas a origem e o contrato ainda são legados.

## 3. Persistência e repositórios

| Serviço | Responsabilidade observada | Persistência |
| --- | --- | --- |
| `workbook-library/WorkbookRepository` | biblioteca, versões, seleção, status e comparação | `localStorage` |
| `workbook/WorkbookRepository` | catálogos do Workbook Engine | `localStorage` |
| `EnterpriseRepository` | grupo, empresa e unidade | `PersistenceManager` |
| `IndexedSpreadsheetStorage` | metadata e linhas por workbook/aba | IndexedDB |
| `ActiveDatasetStore` | dataset selecionado e preview | memória + metadata truncada em `localStorage` |
| `DataSourceManager` | workspace/arquivos/registros da camada legada | `localStorage` + IndexedDB legado |
| `ActiveSourceSelectionStore` | seleção de fontes por workspace | persistência própria |
| `EnterpriseContextStore` | contexto organizacional ativo | `localStorage` |
| `moduleMapping` | configuração semântica por módulo/dataset/projeto | `localStorage` |

O repositório de biblioteca é o repositório operacional de workbooks. O
repositório do Workbook Engine guarda catálogos analíticos e não deve substituir
o primeiro. A consolidação deve preservar essa separação, mas evitar que ambos
sejam consultados como fontes alternativas de um mesmo dataset sem uma regra
única.

## 4. Eventos e listeners

### Eventos do dataset

`ActiveDatasetStore.notify`:

- notifica subscribers internos;
- dispara `DATASET_ACTIVATED`, `DATASET_REHYDRATED` ou `DATASET_REMOVED` no
  `window`;
- dispara `DATASET_ACTIVATED_COMPAT` para compatibilidade.

`DataActivation` também dispara manualmente `DATASET_ACTIVATED` e
`sauron:data-loaded` depois de `setActiveDataset`. Isso duplica o evento
principal e pode produzir duas recargas em componentes React.

`DataSourceManager` assina o store e dispara `sauron_datasource_updated`; o
hook `useDataSourceManager` escuta esse evento e vários eventos do dataset.

### Eventos de contexto

`EnterpriseContextStore.setEnterpriseContext` persiste o contexto e dispara
`sauron:context-updated`, além de notificar subscribers internos.

### Eventos de compatibilidade

Há listeners para `DATASET_UPDATED`, `DATASET_REHYDRATED` e
`DATASET_ACTIVATED_COMPAT` porque módulos antigos ainda dependem dos contratos
anteriores. Eles devem ser mantidos até a migração, mas o evento canônico deve
ser apenas um por transação de ativação.

## 5. Consumidores

### Consumo canônico

- `ActiveDatasetRawPreview` lê `ActiveDatasetStore` e IndexedDB paginado.
- `businessViews`, seller statement, fechamento e engines F8 recebem o dataset
  selecionado e/ou consultam as páginas da origem persistida.
- `DashboardPage`, `FinanceiroTab`, `ComercialTab`, `PeopleIntelligenceTab` e
  `IntelligentDRETab` reagem à ativação e renderizam resultados dos engines.

### Consumo legado ainda presente

- `useDataSourceManager` expõe `activeRecords` e `workspace.files`.
- `DataSourceManager.getActiveRecords()` pode consultar cache de registros
  normalizados, em vez da origem paginada.
- `SpreadsheetFieldSelectionPanel`, `BatchImportReview`,
  `EnterpriseDigitalTwinTab`, `MeetingPrepTab`, `ConsultorAreaTab` e alguns
  diagnósticos acessam diretamente o manager.
- `App.tsx` calcula normalização financeira durante upload de arquivo e cria
  valores padrão, o que é incompatível com a regra de não alterar a fonte.

## 6. Duplicidades e riscos

1. **Importação duplicada:** upload direto em `App.tsx` e `ImportService`.
2. **Persistência duplicada:** biblioteca de workbooks e estado de arquivos do
   `DataSourceManager`.
3. **Repositórios homônimos:** Workbook Engine e Workbook Library têm APIs e
   chaves distintas.
4. **Ativação duplicada:** seleção da biblioteca e importador chamam a mesma
   ativação, o que é aceitável; componentes não devem chamar `setActiveDataset`
   diretamente.
5. **Evento duplicado:** `DataActivation` repete `DATASET_ACTIVATED` após o
   store já tê-lo emitido.
6. **Cópia em memória:** `DataActivation` lê todas as linhas para montar linhas
   normalizadas/consolidadas, contrariando a leitura sob demanda para arquivos
   grandes.
7. **Defaults sintéticos:** normalização legada injeta valores como grupo,
   empresa, CNPJ, vendedor e financeiros quando a coluna não existe.
8. **Falhas parciais:** a transação captura estado anterior e tenta rollback,
   mas gravações de repositórios e IndexedDB ocorrem antes do commit lógico e
   não têm uma unidade transacional comum.
9. **Reload incompleto:** o metadata do `ActiveDatasetStore` é reidratado, mas
   o `DataSourceManager` e seleções antigas também podem disparar atualizações
   independentes.

## 7. Responsabilidades oficiais após F17

| Responsabilidade | Dono oficial | Regra |
| --- | --- | --- |
| ler arquivo | `ImportService` | UI não parseia XLSX |
| persistir workbook/versão | `workbook-library/WorkbookRepository` | nunca substituir importação anterior |
| persistir linhas | `IndexedSpreadsheetStorage` | por dataset e aba |
| validar e ativar | `DataActivation` | prepare/validate/commit/event |
| dataset selecionado | `ActiveDatasetStore` | uma seleção por vez |
| contexto organizacional | `EnterpriseContextStore` | grupo/empresa/unidade/workspace |
| mapping semântico | `moduleMapping` | por dataset/projeto/módulo |
| métricas e regras | engines F8 | sem cálculo em React |
| apresentação da saída | componentes React | renderizar, não criar fonte de dados |

## 8. Ordem segura de consolidação

1. Eliminar a emissão duplicada de `DATASET_ACTIVATED`.
2. Fazer `DataActivation` não carregar todas as linhas para o store ativo;
   manter preview e páginas no IndexedDB.
3. Bloquear o upload legado de `App.tsx` no fluxo de produção e delegar a UI ao
   importador compartilhado.
4. Migrar `BatchImportReview` para `ImportService` sem alterar o contrato da
   fila.
5. Substituir gradualmente leituras de `DataSourceManager.getActiveRecords()`
   por consultas paginadas do dataset ativo.
6. Adicionar testes de sanidade que impeçam novos imports diretos de XLSX em
   componentes e novos writes diretos no `ActiveDatasetStore` fora de
   `DataActivation`/rehydration.

## 9. Escopo desta auditoria

Esta primeira versão não remove módulos ou engines. Ela documenta os caminhos
encontrados e separa os pontos seguros dos pontos que exigem migração gradual.
Nenhum domínio, regra ou dado original deve ser alterado durante a
consolidação.

## 10. F17 implementation status

The first consolidation pass is now applied to the production path:

- `App.tsx` no longer parses spreadsheet files or creates virtual spreadsheet files.
- The shared header selector forwards files to `CentralDadosTab`, which mounts the same `SimpleSpreadsheetImporter` used by the data-center flow.
- `BatchImportReview` is a compatibility wrapper around `SimpleSpreadsheetImporter`; it no longer owns a second XLSX parse/persist pipeline.
- `SimpleSpreadsheetImporter` is the only UI entry point for `ImportService`, `WorkbookRepository` and `DataActivation`.
- `DataActivation` activates metadata and bounded previews only; it no longer injects synthetic columns or materializes the full workbook in `ActiveDatasetStore`.
- `ActiveDatasetStore` persists metadata and a small preview. Full rows remain in IndexedDB and are queried on demand by `businessViews` and other data engines.
- `DATASET_ACTIVATED` is emitted by `ActiveDatasetStore`; `DataActivation` no longer dispatches a duplicate activation event.
- `ActiveDataset` preserves `sourceDatasetIds` and `sourceWorkbookIds` for multi-workbook activation.
- Reload rehydrates the active dataset metadata without loading the complete row set.

Remaining legacy boundaries are intentionally isolated for later work and are not part of the canonical spreadsheet import path:

- `DataSourceManager` still exposes legacy normalized-record APIs for older modules; it mirrors active metadata and is not an import owner.
- `SpreadsheetWorkspaceManager` and database connector code remain compatibility paths. Spreadsheet uploads do not route through them.
- Some legacy components still receive compatibility props from `App.tsx`; the F17 path prevents them from becoming a second source of spreadsheet truth.
