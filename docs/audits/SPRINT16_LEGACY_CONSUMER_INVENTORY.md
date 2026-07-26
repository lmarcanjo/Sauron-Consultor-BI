# Sprint 16 Legacy Consumer Inventory

Data: 2026-07-24  
Escopo: inventário prévio à remoção de `DataSourceManager`.

## Regra de migração

Este inventário foi fechado antes da remoção da família legada. A fonte
canônica para metadata é `ActiveDatasetStore`; linhas completas permanecem no
adapter de armazenamento e são lidas por página. Nenhum item abaixo deve ser
apagado antes de seu consumidor estar migrado e validado.

## Família legada

| Arquivo | Responsabilidade atual | Consumidores | Substituto canônico | Estratégia | Risco |
| --- | --- | --- | --- | --- | --- |
| `src/core/data/DataSourceManager.ts` | Fachada de fonte ativa, aprovação, filtros, histórico e cache de registros | `App`, `CentralDadosTab`, `MeetingPrepTab`, `EnterpriseCenter`, `GlobalContextBar`, `ConsultorAreaTab`, `DataFlowDebugPanel`, telas auxiliares | `ActiveDatasetStore`, `ActiveSourceSelectionStore`, `WorkbookRepository`, `SpreadsheetStoragePort`, `SourceEnterpriseBinding` | Migrar cada método para o contrato responsável; eliminar estado e singleton | Alto: reúne metadata, filtros e linhas em uma API ambígua |
| `src/hooks/useDataSourceManager.ts` | Hook React que espelha o singleton e expõe `activeRecords` | `App`, `CentralDadosTab`, `MeetingPrepTab`, `EnterpriseCenter`, `GlobalContextBar` | Assinatura direta ao `ActiveDatasetStore` e consultas paginadas | Remover hook após os consumidores deixarem de depender dele | Alto: mantém uma segunda cópia e reidrata fachada legada |
| `src/services/dataSourceManager.ts` | Re-export de compatibilidade | Componentes e testes que importam o serviço | Imports diretos dos contratos canônicos | Remover re-export e seu teste exclusivo | Médio: mascara a origem real do estado |

## Consumidores de produção

| Arquivo | Uso legado | Substituto | Migração | Risco |
| --- | --- | --- | --- | --- |
| `src/App.tsx` | Hook, `activeRecords`, aprovação, sync e fonte ativa | `ActiveDatasetStore`, `DataActivation`, `SpreadsheetStoragePort`, contexto empresarial | Separar metadata de preview e manter consultas SQL/planilha no storage | Alto: shell ainda repassa arrays a vários componentes |
| `src/components/CentralDadosTab.tsx` | Hook, `activeRecords`, refresh e exclusão pelo manager | Store, `WorkbookRepository`, `SpreadsheetStoragePort`, bindings | Usar `rowCount`/`columnCount` e IDs canônicos; apagar pela biblioteca | Alto: é o ponto operacional de fontes |
| `src/components/MeetingPrepTab.tsx` | Hook e passagem de `activeRecords` integral para relatórios | `ActiveDatasetStore` + leitura paginada no serviço de preparação | Trocar array integral por contexto de dataset e amostra limitada | Alto: risco de materialização em React |
| `src/components/EnterpriseCenter.tsx` | Hook, períodos e `scopedRecords` derivados de todos os registros | `ActiveDatasetStore`, views/engines e consultas paginadas | Remover varredura em render e delegar leitura ao storage | Alto: apresentação e métricas podem duplicar dados |
| `src/components/GlobalContextBar.tsx` | Hook, contagem e períodos derivados de `activeRecords` | Metadata ativa + valores distintos paginados | Trocar contagem por metadata e consulta limitada de filtros | Médio |
| `src/components/ConsultorAreaTab.tsx` | Busca de todos os registros no manager | `dataOrigem` limitado ou view paginada | Receber somente preview/resultado de view | Médio |
| `src/components/DataFlowDebugPanel.tsx` | Fonte e filtros pelo manager | `ActiveDatasetStore` e perfis da metadata | Remover service e limitar inspeção à metadata/preview | Baixo, rota diagnóstica |
| `src/components/ComissoesTab.tsx` | Teste de tipo de fonte pelo manager | `activeDatasetStore.getActiveDataset()` | Substituir guarda de origem | Baixo |
| `src/components/ContabilTab.tsx` | Teste de tipo de fonte pelo manager | `ActiveDatasetStore` | Substituir guarda de origem | Baixo |
| `src/components/DiagnosticoObstaculosTab.tsx` | Teste de tipo de fonte pelo manager | `ActiveDatasetStore` | Substituir guarda de origem | Baixo |
| `src/components/EstoqueTab.tsx` | Teste de tipo de fonte pelo manager | `ActiveDatasetStore` | Substituir guarda de origem | Baixo |
| `src/components/ItensTab.tsx` | Teste de tipo de fonte pelo manager | `ActiveDatasetStore` | Substituir guarda de origem | Baixo |
| `src/components/PosVendasTab.tsx` | Teste de tipo de fonte pelo manager | `ActiveDatasetStore` | Substituir guarda de origem | Baixo |
| `src/components/VendedoresTab.tsx` | Teste de tipo de fonte pelo manager | `ActiveDatasetStore` | Substituir guarda de origem | Baixo |
| `src/components/PresentationBuilderPage.tsx` | Import de serviço sem necessidade após migração | `ActiveDatasetStore` e engines | Remover import morto | Baixo |
| `src/components/ProductQAConsole.tsx` | Workspace/fonte pelo manager | `IdentityEngine`, `ActiveDatasetStore` | Substituir somente leitura de contexto | Baixo, console interno |

## Testes e políticas

| Arquivo | Função | Ação |
| --- | --- | --- |
| `src/components/componentsCleanup.test.ts` | Testa o manager como compatibilidade | Remover os casos exclusivos após a migração |
| `src/services/dataSourceManager.test.ts` | Suite exclusiva da fachada | Remover junto com a família |
| `src/core/compatibility/compatibilityArchitecture.test.ts` | Permite a família legada | Atualizar para exigir zero import em produção |
| `src/core/compatibility/legacyImportAllowlist.ts` | Allowlist de consumidores | Esvaziar entradas do manager após scanner verde |
| `src/core/compatibility/CompatibilityPolicy.ts` | Política `KEEP_TEMPORARILY` | Remover boundary da família |
| `src/core/data/productionCodeSanity.test.ts` | Exceção de scan | Remover exceção |
| `src/core/quality/domainVocabularyAllowlist.ts` | Permite nomes legados | Remover entradas quando os arquivos forem apagados |

## Estado e persistência legada

| Chave | Origem | Classificação | Destino |
| --- | --- | --- | --- |
| `sauron_ds_state` | `DataSourceManager` | Estado de compatibilidade | Migrar apenas metadata confirmada, registrar e remover |
| `sauron_ds_workspace` | `DataSourceManager` | Workspace/arquivos duplicados | Resolver por `WorkbookRepository`/contexto; remover após confirmação |
| `sauron_ds_adjustments` | `DataSourceManager` | Preferências/ajustes antigos | Não converter linhas; preservar somente se houver contrato canônico |
| `sauron_ds_filters` | `DataSourceManager`/console QA | Filtros antigos | Substituir por metadata/valores distintos paginados; remover após migração |
| `sauron_ds_versions` | `DataSourceManager` | Versões duplicadas | Resolver por `WorkbookRepository`; remover somente após confirmação |
| `sauron_ds_db_data` | `DataSourceManager` | Cópia integral de SQL | Não migrar linhas para localStorage; manter apenas storage paginado |
| `sauron_ds_active_dataset` | `ActiveDatasetStore` | Metadata canônica limitada | Manter; não é chave legada |

## Tipos e termos encontrados

- `DATABASE_DATA` é um tipo de origem e permanece válido; não representa uma
  segunda fonte de verdade.
- `activeRecords` é legado quando significa o conjunto completo. Preview
  limitado deve ser renomeado ou explicitamente tratado como amostra.
- `databaseRecords` existe dentro da fachada e deve desaparecer com ela.
- `DATABASE_DATA` não deve ser confundido com `sauron_ds_db_data`: o primeiro é
  contrato de origem, o segundo é persistência legada integral.

## Critério para a remoção

A família só pode ser removida quando:

1. `rg` não encontrar imports de produção para os três arquivos;
2. o shell não depender de `activeRecords` integral;
3. filtros e módulos usarem metadata ou storage paginado;
4. a migração versionada registrar o tratamento das chaves antigas;
5. testes de planilha, SQL, reload, apresentação e sessão passarem;
6. allowlists e exceções de compatibilidade forem removidas.

