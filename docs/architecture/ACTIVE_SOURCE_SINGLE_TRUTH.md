# Active Source Single Truth

## Contrato mantido

O fluxo MVP continua usando uma única fonte ativa:

```text
ImportService
  -> WorkbookRepository / IndexedDB
  -> DataActivation
  -> ActiveDatasetStore
  -> Dashboard, configuração MVP e módulos
```

`ActiveDatasetStore.getActiveDataset()` é a referência da fonte atualmente
selecionada. O objeto contém metadata, preview e referências de armazenamento;
as linhas completas continuam sendo lidas sob demanda.

## Consumo no MVP

- `ActiveDatasetRawPreview` exibe nome, aba, linhas, colunas e primeiras linhas
  da fonte ativa.
- `DashboardPage` lê o dataset ativo e monta `MvpDataFirstPanel` no topo.
- `MvpDataFirstPanel` salva configurações indexadas pelo `datasetId`.
- A Biblioteca ativa um workbook existente pelo fluxo canônico de ativação.
- A troca de fonte provoca a leitura da configuração correspondente ao novo
  `datasetId`, sem misturar indicadores ou colunas de outro arquivo.

## Reidratação

No reload, o store reidrata metadata e preview. A configuração MVP é lida do
armazenamento local pelo identificador da fonte e as linhas da prévia são
buscadas pela camada de dados existente. Não há cópia do arquivo completo em
`localStorage` nem no estado do componente.

## Regra do escopo

Esta entrega não cria um novo store, repositório ou importador. Ela apenas
conecta a configuração data-first à fonte ativa já existente.
