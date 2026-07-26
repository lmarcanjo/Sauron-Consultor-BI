# Local Storage Repair

## Escopo desta rodada

O MVP não introduz uma migração geral do armazenamento local. A recuperação
realizada foi limitada ao contrato de configuração data-first e aos testes que
iniciam em um ambiente local limpo.

## Chave nova do MVP

`MvpDataConfiguration` usa:

```text
sauron_mvp_data_configuration_v1
```

O valor é um objeto indexado por `datasetId`. Cada entrada contém somente
preferências de apresentação e análise simples: colunas, nomes exibidos,
indicadores, gráficos e tabela escolhida.

## Proteções

- Nenhum dado físico da planilha é sobrescrito.
- O nome físico das colunas é preservado.
- Configurações de outro dataset não são reutilizadas por nome de arquivo.
- Colunas inexistentes são descartadas ao salvar uma configuração.
- A prévia é lida sob demanda e limitada.

## Estado pendente

Uma limpeza ampla de chaves históricas, migração de IDs legados e reparo de
armazenamento fora do contrato MVP não foi executada nesta fase. Ela permanece
fora do escopo solicitado e não deve ser iniciada antes da validação manual do
MVP.
