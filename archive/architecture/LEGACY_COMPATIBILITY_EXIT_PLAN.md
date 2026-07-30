# Legacy Compatibility Exit Plan

Status: RC-3 incremental boundary  
Data: 2026-07-16

## Regra

Compatibilidade nao e uma segunda fonte de dados. Os adapters existentes ficam
isolados, sem novos consumidores, sem persistencia nova, sem IDs novos, sem
calculos financeiros e sem eventos paralelos. O contrato oficial continua:

```text
ImportService -> WorkbookRepository -> SpreadsheetStoragePort
-> DataActivation -> ActiveDatasetStore -> Engines
```

## Classificacao

| Simbolo | Classificacao | Contrato substituto | Acao nesta RC |
| --- | --- | --- | --- |
| `DataSourceManager` | KEEP_TEMPORARILY / DEPRECATE | `ActiveDatasetStore`, `DataActivation`, `SpreadsheetStoragePort` | Marcar API, congelar allowlist, migrar consumidores gradualmente |
| `src/services/dataSourceManager.ts` | DEPRECATE | contratos de dados canonicos | Manter somente reexport temporario |
| `SpreadsheetWorkspaceManager` | DEPRECATE | `ImportService` e `WorkbookRepository` | Manter para suites antigas; nenhum fluxo principal novo |
| `WorkspaceDNAEngine` | MIGRATE | `WorkspaceIntelligenceEngine` + Domain Packs | Manter somente para CaseHub e paineis de caso |
| `BatchImportReview` | KEEP_TEMPORARILY | `SimpleSpreadsheetImporter`/`ImportService` | Wrapper de UI, sem parser proprio |
| `LegacyCompatibilityMigration` | KEEP_TEMPORARILY | contratos persistidos atuais | Executar somente migracoes versionadas e idempotentes |

## Consumidores conhecidos

Os consumidores existentes estao registrados em
`src/core/compatibility/legacyImportAllowlist.ts`. A lista e deliberadamente
explicita. O teste `compatibilityArchitecture.test.ts` falha se um arquivo de
producao novo importar os simbolos legados sem uma entrada e justificativa.

Isso permite migracao incremental sem fingir que a remocao completa ja ocorreu.

## Regras de proibicao

Nenhum novo adapter pode:

- ler ou persistir linhas fora do `SpreadsheetStoragePort`;
- criar IDs de dataset/workbook;
- calcular KPI, margem, receita ou comissao;
- emitir evento fora de `PlatformEvents`;
- criar fallback mock/demo;
- substituir o `ActiveDatasetStore` como selecao ativa.

## Sequencia de remocao

1. Migrar `useDataSourceManager` para metadata do `ActiveDatasetStore` e
   provedores paginados.
2. Migrar tabs legadas para os engines de Business Intelligence e Dashboard.
3. Remover chamadas persistentes e de calculo do `DataSourceManager`.
4. Remover o reexport em `src/services/dataSourceManager.ts`.
5. Migrar/remover `SpreadsheetWorkspaceManager` e sua suite historica.
6. Migrar CaseHub e paineis de caso para `WorkspaceIntelligenceEngine`.
7. Remover os arquivos somente quando o scanner e os testes nao encontrarem
   consumidores.

## Criterio de saida

Um adapter pode ser removido quando nao houver import de producao, nao houver
chave persistida exclusiva em uso e a jornada de reload/login permanecer verde.
O prazo de remocao e condicionado a essa evidencia, nao a uma data artificial.
