# System Flow

## Consultant Flow

```text
Empresas e Grupos
  -> Fontes de Dados
  -> Análise da fonte
  -> Confirmar informações
  -> Ativar fonte
  -> Visão Executiva
  -> Resultados disponíveis
  -> Apresentação
  -> Preparação da Reunião
  -> Sessão e Ata
```

## Data Flow

1. The importer receives the file and delegates persistence to `ImportService`.
2. `DataActivation` creates or activates the dataset projection.
3. `ActiveDatasetStore` publishes metadata and preview to the shell.
4. `ChaosProfilingPanel` samples the stored source and saves a draft view.
5. The consultant confirms the selected columns; the original source is never changed.
6. Module mappings are confirmed only in `Análise da fonte`.
7. Business and dashboard engines consume the active source and confirmed mappings.
8. Executive artifacts read certified metric snapshots or show pending configuration.

## Empty and Pending States

Without a source the UI says `Nenhuma fonte de dados ativa.`. With a source but
without enough interpretation, the relevant module says `Configuração pendente`.
No compatibility path may create an artificial result.

## Sprint 18 Runtime Evidence

The spreadsheet path was revalidated with the real Honda workbook using the
existing `ImportService` local implementation and the existing paginated
storage path. Profiling exposed a bounded sample, and the confirmed view,
results, reload and executive artifacts retained the selected group and
company context.

The production API path is selected only when the build resolves
`VITE_IMPORT_MODE=api`; it requires `/api/v1/imports/spreadsheets`. A local
server without that endpoint returns `404` and is not evidence of a successful
production import. VPN/MySQL validation remains an external prerequisite and
does not alter the spreadsheet path.
