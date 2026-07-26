# Data-First Configuration

## Objetivo

Permitir que o consultor use uma planilha sem adaptar seus nomes ao Sauron.
Depois que uma fonte é ativada, o Dashboard mostra as colunas físicas da aba
ativa e permite escolher o que será utilizado na tabela, nos indicadores e no
gráfico.

## Contrato

`src/core/data/mvpDataConfiguration.ts` mantém, por `datasetId`:

- `sheetName`;
- colunas físicas e seus estados;
- nome exibido editável;
- colunas escolhidas para a tabela;
- indicadores e operação;
- gráficos e operação;
- data da última alteração.

O nome físico permanece imutável. O nome exibido é apenas uma configuração de
apresentação e não altera a planilha original.

## Fluxo do consultor

1. Ativar uma planilha pela Biblioteca ou pela importação.
2. Abrir o Dashboard.
3. Editar a configuração e, quando necessário, alterar o nome exibido.
4. Escolher colunas para a tabela.
5. Criar um indicador por soma, média, contagem, distintos, mínimo ou máximo.
6. Criar um gráfico simples agrupado por uma coluna textual.
7. Salvar a configuração.

## Dados

Os cálculos simples usam somente linhas reais da aba ativa. A leitura é feita
pela função existente `getSheetRows`, com limite de prévia, sem colocar o
arquivo inteiro no estado do React. Valores numéricos são interpretados pela
rotina compartilhada de parsing numérico.

## Apresentação

Quando existem indicadores, gráficos ou colunas de tabela salvos, a
apresentação MVP usa esses mesmos objetos para gerar seus blocos. Assim, o
valor exibido no Dashboard e na apresentação vem da mesma configuração do
dataset.
