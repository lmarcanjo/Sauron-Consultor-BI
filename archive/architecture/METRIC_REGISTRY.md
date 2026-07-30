# Metric Registry

Status: RC-3 canonical metric contract  
Data: 2026-07-16

## Objetivo

O registro define a identidade interna de uma métrica. Labels podem ser
traduzidos por Domain Packs, mas produtores e artefatos devem compartilhar o
mesmo `metricKey`.

## Keys

| `metricKey` | Label neutro | Formato | Agregacao |
| --- | --- | --- | --- |
| `revenue` | Receita | BRL, 2 casas | soma |
| `cost` | Custo | BRL, 2 casas | soma |
| `expense` | Despesa | BRL, 2 casas | soma |
| `gross_margin` | Margem bruta | percentual | derivada |
| `net_result` | Resultado liquido | BRL, 2 casas | derivada |
| `quantity` | Quantidade | inteiro | soma |
| `average_ticket` | Ticket medio | BRL, 2 casas | media |
| `commission` | Comissao | BRL, 2 casas | soma |
| `headcount` | Pessoas | inteiro | contagem distinta |
| `seller_count` | Vendedores | inteiro | contagem distinta |
| `customer_count` | Clientes | inteiro | contagem distinta |
| `product_count` | Produtos | inteiro | contagem distinta |
| `target` | Meta | BRL, 2 casas | soma |
| `achievement_rate` | Atingimento | percentual | derivada |

## Compatibilidade

Os nomes historicos de `BusinessMetricName` continuam aceitos nesta transicao,
mas sao aliases controlados em `BUSINESS_METRIC_KEY_ALIASES`:

- `totalVendido` e `receitaCandidata` -> `revenue`;
- `totalComissao` -> `commission`;
- `despesaCandidata` -> `expense`;
- `resultadoLiquido` -> `net_result`;
- `quantidadeVendedores` -> `seller_count`;
- `quantidadeClientes` -> `customer_count`;
- `quantidadeProdutos` -> `product_count`;
- `ticketMedio` -> `average_ticket`;
- `margemCandidata` -> `gross_margin`;
- `custoCandidato` -> `cost`.

Nenhum produtor novo deve criar outro nome para uma dessas identidades.

## Produtores RC-3

`BusinessMetricCalculator` é o produtor oficial das métricas numéricas. A
`ExecutiveDashboardEngine` transforma essas métricas em blocos. A
`ExecutivePresentationEngine` consome o mesmo conjunto via
`calculatePresentationMetricValues`; ele não soma linhas novamente. Quando há
mapeamento salvo, ele é a fonte de papéis e colunas. Sem mapeamento salvo, o
engine usa um mapeamento efêmero inferido apenas para compatibilidade e não o
persiste.

## Lineage obrigatorio

Cada `BusinessMetric` carrega `metricKey`, dataset, workbook, aba, colunas,
mapping, regras, estrategia de leitura, linhas lidas e transformacoes. O
FinancialConsistencyEngine usa o `metricKey` para comparar etapas sem depender
do label exibido.
