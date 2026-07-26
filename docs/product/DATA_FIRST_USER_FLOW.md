# Data-First User Flow

Data: 2026-07-20

## Jornada MVP

```text
Entrar -> escolher empresa -> importar -> ativar
  -> conferir todas as colunas -> Editar informações
  -> escolher tabela/indicador/gráfico -> salvar
  -> Dashboard -> Apresentação -> Reunião -> Ata -> reload/login
```

## Regras visíveis

- todas as colunas físicas da aba ativa aparecem;
- `physicalName` é somente leitura e não é alterado;
- o consultor pode definir `consultantLabel`, que tem prioridade na tela;
- cada coluna pode ser marcada para tabela, indicador, agrupamento, filtro,
  detalhe ou permanecer sem uso;
- nenhum indicador ou gráfico nasce antes da confirmação;
- o estado inicial informa `Nenhum indicador criado.`, `Nenhum gráfico criado.`
  e `Nenhuma tabela configurada.`;
- valores vêm das linhas reais, lidas pela camada paginada existente;
- configuração é salva por `datasetId`.

Sugestões automáticas permanecem opcionais e não substituem a escolha do
consultor.
