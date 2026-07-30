# Module Data Requirements

Objetivo: definir quando cada módulo pode usar a planilha real e quando deve parar em “Configuração pendente”. Regra geral: se o módulo não consegue explicar quais colunas usou, ele não pode gerar métrica.

## Requisitos por módulo

| Módulo | Colunas necessárias | Fontes no workbook | Status atual | Comportamento correto |
|---|---|---|---|---|
| Home | nome, linhas, colunas, abas e preview paginado | `ActiveDatasetStore` + storage | Implementado | Mostrar preview real por aba |
| Central de Dados | datasetId, sourceName, rowCount, sheets, status | `ActiveDatasetStore` | Implementado parcial | Mostrar fonte ativa real; não voltar para demo |
| DRE | venda/receita/valor, custo/despesa/imposto, data/período, categoria/transação/departamento | `Importacao_Detalhada`, `IMP_VENDAS`, `EXP_COCKPITWEB` | Pendente sem mapeamento explícito | Mostrar colunas necessárias e pedir mapeamento |
| Pessoas | vendedor/funcionário/mecânico/nome, função/departamento/unidade quando houver | `IMP_VENDEDORES`, `Cadastros_Funcionários`, `Cadastros_Vendedores`, `Importacao_Detalhada` | Detecção mínima aplicada | Listar nomes reais detectados; nunca dossiês demo |
| Vendedores | vendedor/nome, venda/valor, margem/lucro opcional | `IMP_VENDAS`, `Importacao_Detalhada`, `IMP_VENDEDORES` | Detecção mínima aplicada | Ranking real quando houver coluna de vendedor |
| Comercial | venda, produto/peça/departamento/transação, vendedor/cliente | `IMP_VENDAS`, `IMP_VENDAS_AT`, `Importacao_Detalhada` | Pendente sem engine | Não gerar funil ou marcas sintéticas |
| Financeiro | venda/receita, custo, imposto, margem/lucro, data | `Importacao_Detalhada`, `IMP_VENDAS`, `IMP_VENDAS_AT`, `RVD_*` | Pendente sem engine | Não gerar recebíveis/aging sintético |
| Peças | peça/produto, venda, custo, imposto, departamento, período | `RVD_Pecas`, `IMP_VENDAS_AT`, `Importacao_Detalhada` | Bloqueado para real | Pendente até engine de peças |
| Pós-vendas | OS, mecânico/consultor, serviços, peças, valor, data | `DETALHES_PENDENCIAS`, `IMP_PENDENCIAS`, `IMP_VENDAS_AT` | Bloqueado para real | Pendente até engine OS |
| Estoque | item/produto, custo, estoque, giro, idade, período | não há base explícita completa detectada | Bloqueado para real | Pendente |
| Comissões | vendedor, venda, lucro, regra percentual/fixa, comissão, DSR, total | `Comissão_Vendedores`, `AN_Pecas`, `AN_Acessórios`, cadastros | Bloqueado para real | Pendente até engine de remuneração |

## Regras de Consumo

1. Dataset real ativo nunca pode chamar `gerarDadosSimulados` ou `generateDemoSpreadsheetRows`.
2. Módulo sem mapeamento explícito mostra “Configuração pendente”.
3. Módulo que lista entidades reais pode usar detecção heurística, desde que não invente atributos ausentes.
4. Valores ausentes ficam vazios/zero com rótulo de indisponibilidade, não preenchidos por benchmark.
5. Fórmulas do Excel devem virar engines auditáveis antes de substituir relatórios oficiais.

## Correções mínimas aplicadas

- `VendedoresTab` remove lista fictícia e usa coluna real detectada.
- `PeopleIntelligenceTab` detecta coluna de pessoa/vendedor real antes de listar.
- `PecasTab`, `PosVendasTab`, `EstoqueTab` e `ComissoesTab` bloqueiam saída sintética quando há dataset real.
- `App.tsx` evita renderizar `ExecutiveWorkspace` demo com dataset real.

