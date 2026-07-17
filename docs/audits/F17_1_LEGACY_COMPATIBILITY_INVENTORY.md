# F17.1 Legacy Compatibility Inventory

Data: 2026-07-15  
Escopo: resíduos mantidos para compatibilidade, eventos, chaves persistidas,
módulos legados, mock/demo e vocabulário de domínio.

## Inventário

| Arquivo / linha | Símbolo | Consumidor atual | Classificação | Decisão |
| --- | --- | --- | --- | --- |
| `src/core/data/DataSourceManager.ts:93` | `DataSourceManager` | `App`, `useDataSourceManager`, diagnósticos e componentes antigos | A. Necessário temporariamente | Manter como facade de compatibilidade; `ActiveDatasetStore` continua sendo a fonte ativa. Migrar consumidores restantes para leitura paginada antes de remover. |
| `src/services/dataSourceManager.ts:1` | reexport do manager | Testes e módulos antigos | A. Necessário temporariamente | Manter sem adicionar consumidores. |
| `src/services/spreadsheetWorkspaceManager.ts:4` | `SpreadsheetWorkspaceManager` | testes de compatibilidade; nenhum fluxo principal encontrado | C/F | Não remover nesta RC para não quebrar testes/integrações antigas; candidato a remoção após migração dos consumidores de `DataSourceManager`. |
| `src/components/spreadsheet/BatchImportReview.tsx` | wrapper de revisão | caminhos de importação em lote | A. Necessário temporariamente | Manter como adaptador; não parseia nem persiste por conta própria. |
| `src/core/migrations/LegacyCompatibilityMigration.ts:1` | migração v1 | inicialização de `App` e `EnterpriseContextStore` | A. Necessário temporariamente | Manter versionada e idempotente. Migra apenas metadata válida, remove chaves antigas e nunca toca no IndexedDB. |
| `src/core/migrations/LegacyCompatibilityMigration.ts:5-10` | `sauron_active_dataset`, `active_dataset`, IDs antigos de contexto | somente migração | B. Pode ser migrado | Detectar, copiar para contratos canônicos, remover depois da confirmação. Coberto por `LegacyCompatibilityMigration.test.ts`. |
| `src/core/migrations/LegacyCompatibilityMigration.ts:63-71` | chaves `up_file_*` | somente fila antiga | B. Pode ser migrado | Limpeza limitada a entradas órfãs de fila; dados de workbook e IndexedDB preservados. |
| `src/core/events/PlatformEvents.ts:2` | `PLATFORM_EVENTS` | stores, contexto, mapeamento e UI | A. Necessário | Fonte única de eventos cross-module; payload continua tipado pelo consumidor. |
| `src/core/data/DataSourceManager.ts:1066` | `triggerUpdateEvent` | manager e adapter legado | D. Duplicado substituído | Evento string `sauron_datasource_updated` removido; agora publica `DATA_SOURCE_STATE_CHANGED`. |
| `src/core/data/ActiveDatasetStore.ts:41-79` | `setActiveDataset` | ativação e preview | A. Necessário | Manter metadata e no máximo 100 linhas de preview; nunca reidratar o workbook completo. |
| `src/core/data/DataSourceManager.ts:27` | `assertNoMockDataWhenRealSource` | leitura defensiva do manager e testes de integridade | A. Necessário | Manter como barreira de integridade; não é fallback nem fonte de dados. |
| `src/core/data/DataSourceManager.ts` (removido nesta rodada) | `isDemoMode` | nenhum consumidor atual | D. Duplicado removido | API morta de compatibilidade eliminada; testes antigos foram ajustados para o contrato real. |
| `src/core/workspace-intelligence/WorkspaceDNAEngine.ts:19` | `WorkspaceDNAEngine` | `CaseHub`, `CaseOverview`, painéis de contexto | A. Necessário temporariamente | Manter para compatibilidade do caso consultivo; não deve criar dataset ou métrica. |
| `src/core/compensation/CompensationEngine.ts:76` | `CompensationEngine` | `ExecutivePeopleService` e Pessoas | A. Necessário | Manter; regras reais de comissão devem vir de mapping/regra configurada. |
| `src/components/EnterpriseDigitalTwinTab.tsx:22` | `EnterpriseDigitalTwinTab` | rota de Gêmeo Digital | A. Necessário | Manter como visão estrutural real; defaults visuais neutralizados. |
| `src/components/SDLStudio.tsx:58` | `SDLStudio` | somente Super Admin com `?lab=true` | D/MOVE_TO_LAB | Removido da navegação normal; laboratório explícito, sem papel no fluxo comercial. |
| `src/core/story/StoryEngine.ts:11` | `StoryEngine` | `ExecutiveStoryTab` e testes | A. Necessário | Seeds limitados a `NODE_ENV=test`; fluxo real usa histórias persistidas. |
| `src/components/MeetingModePage.tsx:90` | Sessão Executiva | jornada de apresentação/reunião/ata | A. Necessário | Manter; finalização via `Sincronizar e Concluir` foi validada após Sessão e Ata. |
| `src/core/identity/IdentityCleanupMigration.ts:220` | limpeza histórica de identidade | migração de dados antigos | A. Necessário temporariamente | Manter isolada como migração; não é caminho de dados nem UI. |
| `src/core/story/StoryExportEngine.ts:115` | exportação estruturada de slides | exportação de Story | A. Necessário | Comentário legado de mock removido; payload é estrutura para adapter de exportação. |
| `src/core/identity/SecurityScoreEngine.ts:35` | cálculo de MFA | segurança | B. Pode ser migrado | Removida linguagem de simulação; ainda depende do contrato de identidade atual até existir flag MFA explícita. |

## Resíduos de Mock/Demo

Os tokens `DEMO_DATA`, `demoData`, `generateDemo`, `mockRows`, `Grupo Alpha`,
`Topázio` e `MOCK DATA` não podem aparecer em módulos de produção. O teste
`src/core/quality/productionSanity.test.ts` varre `src`, exclui somente testes e
Domain Packs, e falha se qualquer token voltar.

As referências de dados fictícios nos testes e fixtures permanecem isoladas em
testes. A barreira `assertNoMockDataWhenRealSource` é uma proteção, não um
fornecedor de dados.

## Eventos e Listeners

O fluxo de estado usa `PlatformEvents` para `ACTIVE_DATASET_CHANGED`,
`ENTERPRISE_CONTEXT_CHANGED`, `DOMAIN_CONTEXT_CHANGED`, `SOURCE_CONFIGURED`,
`DATA_SOURCE_STATE_CHANGED` e demais mudanças canônicas. Os listeners migrados
usam unsubscribe no cleanup. A string antiga `sauron_datasource_updated` não é
mais emitida nem consumida.

## Veredito do Inventário

O legado removível nesta rodada foi eliminado ou retirado da navegação normal.
Os managers e engines ainda utilizados permanecem como compatibilidade explícita
e não como fonte alternativa de importação. A remoção completa de
`DataSourceManager`, `SpreadsheetWorkspaceManager` e `WorkspaceDNAEngine` exige
migração de consumidores fora do fluxo principal e fica registrada como dívida,
não ocultada como concluída.
