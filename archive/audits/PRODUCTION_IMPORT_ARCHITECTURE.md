# Production Import Architecture

Problema: planilhas como `Teste_Automação_Peças Honda Faberge Mogi~06.26 Veiculo ativou.xlsx` têm dezenas de milhares de linhas, centenas de colunas e mais de 180 mil fórmulas. O navegador não deve processar isso em produção.

## Arquitetura Alvo

```
Upload -> Storage -> ImportJob -> Worker -> Parser -> Banco/Storage -> ActiveDataset -> Frontend
```

## Fluxo

1. Frontend envia arquivo para endpoint de upload.
2. Backend grava arquivo bruto em storage versionado.
3. Backend cria `ImportJob` assíncrono com status `queued`.
4. Worker lê o arquivo do storage e extrai metadados, abas, fórmulas, cabeçalhos e páginas.
5. Parser classifica abas em entrada, cadastro, relatório, cálculo e referência.
6. Dados brutos vão para banco/storage colunar ou tabelas normalizadas por aba.
7. Backend salva `ActiveDataset` com metadados, lineage, schema, row counts e preview.
8. Frontend recebe somente metadados e páginas via API.
9. Módulos consomem views normalizadas ou exibem “Configuração pendente”.

## Responsabilidades

| Camada | Responsabilidade |
|---|---|
| Frontend | Upload, status do job, preview paginado, seleção de mapeamento |
| API | Autorização, criação de job, endpoints de dataset/preview |
| Storage | Arquivo original, versões, auditoria |
| Worker | Parsing pesado, fórmulas, detecção de cabeçalho, validação |
| Banco | Dados por aba, schemas, mapeamentos, views normalizadas |
| ActiveDataset | Metadados oficiais do dataset ativo |

## Regras de Escala

- Planilha grande nunca deve entrar inteira no estado React.
- `localStorage` guarda somente metadados pequenos.
- IndexedDB é fallback local/offline, não produção.
- Preview deve ser paginado.
- Tabelas grandes precisam virtualização.
- Fórmulas devem ser registradas e auditadas, não executadas silenciosamente no browser.
- Jobs precisam status: `queued`, `processing`, `parsed`, `mapping_required`, `active`, `failed`.

## Modelo de Dados Mínimo

| Entidade | Campos essenciais |
|---|---|
| `import_jobs` | id, tenantId, fileName, status, progress, error, createdBy, createdAt |
| `datasets` | id, sourceName, sourceType, rowCount, sheetCount, activeSheet, status |
| `dataset_sheets` | datasetId, sheetName, rowCount, columnCount, formulaCount, classification |
| `dataset_columns` | datasetId, sheetName, columnName, inferredType, semanticRole |
| `dataset_rows` | datasetId, sheetName, rowNumber, rawJson ou storage pointer |
| `module_mappings` | datasetId, module, sourceColumn, semanticField, required |

## Migração do Estado Atual

1. Manter `SimpleSpreadsheetImporter` apenas para desenvolvimento/local fallback.
2. Trocar `IndexedSpreadsheetStorage` por API paginada quando backend estiver disponível.
3. Preservar `ActiveDatasetRawPreview`, mas sua origem passa a ser `GET /datasets/:id/sheets/:sheet/rows?page=1`.
4. Converter `moduleDataRequirements.ts` em contrato de mapeamento persistente.
5. Remover `demoData.ts` do bundle de produção ou condicionar a rota interna.

