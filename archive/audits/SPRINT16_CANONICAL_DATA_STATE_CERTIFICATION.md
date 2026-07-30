# Sprint 16 — Canonical Data State Certification

Data: 2026-07-24  
Escopo: remoção da família `DataSourceManager` e consolidação do estado ativo.

## Estado antes

O inventário prévio está em
[`SPRINT16_LEGACY_CONSUMER_INVENTORY.md`](./SPRINT16_LEGACY_CONSUMER_INVENTORY.md).

- Havia uma fachada de 1.067 linhas, um hook React, um re-export de serviço e
  uma suite exclusiva de compatibilidade.
- 18 entradas de produção eram autorizadas por allowlist a acessar a família.
- A fachada mantinha estado paralelo para fonte, workspace, filtros, versões,
  ajustes e registros SQL.
- As chaves `sauron_ds_state`, `sauron_ds_workspace`,
  `sauron_ds_adjustments`, `sauron_ds_filters`, `sauron_ds_versions`,
  `sauron_ds_db_data` e `sauron_ds_import_profile` podiam persistir cópias ou
  metadados concorrentes.
- `sauron_ds_active_dataset` já era a chave canônica de metadata bounded e foi
  preservada.

## Correções realizadas

1. `App.tsx`, Central de Dados, Centro Empresarial, barra de contexto e
   Preparação de Reunião passaram a assinar `ActiveDatasetStore` diretamente.
2. Telas auxiliares passaram a verificar a presença da fonte pela metadata
   ativa, sem consultar a fachada.
3. A contagem da fonte usa `rowCount` e `columnCount`; o React recebe somente
   o preview limitado pelo store.
4. Apresentação e preparação recebem uma amostra bounded; análises de fonte
   usam engines/storage e não uma cópia integral no shell.
5. Filtros passaram a suportar leitura de valores distintos por páginas através
   de `getActiveRowsPage` e `getActiveDistinctValues`, com limite e abort.
6. O histórico compatível foi limitado a 100 linhas em memória; a fonte física
   não é duplicada no localStorage.
7. Exclusão de workbook usa a versão e o `datasetId` canônicos para apagar o
   storage correto, sem chamar o manager removido.
8. A migração v3 de `LegacyLocalStateRepairService` remove as sete chaves
   duplicadas após inspeção, mantém metadata canônica e nunca apaga linhas
   físicas.
9. A família foi removida:
   - `src/core/data/DataSourceManager.ts`
   - `src/hooks/useDataSourceManager.ts`
   - `src/services/dataSourceManager.ts`
   - `src/services/dataSourceManager.test.ts`
10. Allowlists, boundary `KEEP_TEMPORARILY` e exceções de scanner foram
    removidos. O scanner agora exige zero consumidores de produção.

## Estado depois

| Medida | Antes | Depois |
| --- | ---: | ---: |
| Arquivos da família legada | 4 | 0 |
| Imports de produção da família | 18 autorizados | 0 |
| Estado paralelo de linhas no manager | 1 fachada | 0 |
| Chaves legadas de dados/configuração | 7 | 0 consumidores; limpeza v3 |
| Chave canônica de metadata ativa | 1 | 1, preservada |
| Testes Vitest | 85 arquivos / 420 testes | 86 arquivos / 413 testes |
| Bundle principal | aproximadamente 1,845 MB no baseline anterior | 1,773 MB no build atual |

A redução de testes é consequência da remoção da suite exclusiva do manager;
foram adicionados testes de migração e sanidade canônica.

## Evidência de armazenamento e memória

- `ActiveDatasetStore.setActiveDataset` mantém no máximo 100 linhas em memória.
- A reidratação restaura metadata e preview, nunca o workbook completo.
- O localStorage canônico persiste somente metadata com preview truncado.
- A migração não copia `sauron_ds_db_data` para outro lugar.
- O scanner não encontra chamadas de produção à API integral antiga.
- Leitura sob demanda usa `SpreadsheetStoragePort`/IndexedDB e `getRowsPaged`.
- Filtros mantêm apenas valores distintos limitados e canceláveis.
- O reload não reprocessa o workbook inteiro.

## Validação automatizada

| Verificação | Resultado |
| --- | --- |
| Testes focados de compatibilidade, migração e store | 7/7 |
| Vitest completo | 86 arquivos, 413/413 testes |
| Typecheck | aprovado |
| Lint (`tsc --noEmit`) | aprovado |
| Build | aprovado; alerta conhecido de chunk grande permanece |
| `git diff --check` | aprovado |
| Scanner de imports legados | 0 consumidores |
| Scanner de persistência legada | 0 consumidores fora da migração |
| Playwright completo | 59/59, 2,2 min, 1 worker |
| E2E focado de recuperação | 1/1 |

O primeiro Playwright em modo dev foi descartado por conflito externo de HMR
na porta 24678. A execução certificadora foi feita em servidor de produção
isolado, com build local (`VITE_IMPORT_MODE=local`), e passou integralmente.

## Jornadas cobertas

A suíte certificadora passou por importação/ativação, Dashboard, DRE,
Financeiro, Comercial, Pessoas, Central de Dados, reload, apresentação,
preparação, sessão, SQL data-first, recuperação de storage legado,
multiempresa, filtros, acessibilidade e workbook real catalogado.

O teste de fixture real registrou linhas e colunas físicas, sem reintroduzir
mock ou fallback demonstrativo. A certificação manual anterior de VPN/MySQL
continua fora do escopo de alteração desta sprint; este trabalho não alterou
driver, conexão, VPN ou o banco do cliente. A suíte cobre o comportamento de
snapshot sem VPN e o sync SQL pelos contratos existentes.

## Riscos remanescentes

- O bundle continua grande e o processamento estrutural pesado deve permanecer
  fora do navegador em produção; esta sprint não alterou splitting.
- A API de ativação SQL ainda recebe o resultado do endpoint existente antes de
  persistir no adapter; o manager removido não participa mais desse caminho.
- `SpreadsheetStoragePort.getRows` permanece disponível no adapter para
  operações internas de armazenamento; não há consumidor de produção da
  família removida usando essa API.

## Parecer final

## ✅ CANONICAL DATA STATE APROVADO

Não resta consumidor de produção dependente da família `DataSourceManager`.
`ActiveDatasetStore` é a única fonte de verdade de metadata ativa, as linhas
completas permanecem no storage, a migração legada é idempotente e a jornada
automatizada completa está verde.
