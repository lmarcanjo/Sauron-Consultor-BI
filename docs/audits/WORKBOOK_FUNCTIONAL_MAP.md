# Workbook Functional Map

Arquivo analisado: `/home/natalicorreia/Downloads/Teste_Automação_Peças Honda Faberge Mogi~06.26 Veiculo ativou.xlsx`

Resumo: workbook operacional Honda Faberge Mogi para peças, acessórios, pendências, vendedores, comissões e exportação/importação. Não deve ser tratado como tabela única. Ele combina abas de entrada, cadastros, relatórios calculados e telas de operação.

## Abas

| Aba | Tipo | Linhas físicas | Colunas | Fórmulas | Cabeçalhos / sinais importantes | Papel no Sauron |
|---|---|---:|---:|---:|---|---|
| `Menu` | cadastro/config | 30 | 20 | 3 | Operações da Planilha, status/data | Referência operacional, não fato analítico |
| `instrucoes` | cadastro/config | 56 | 21 | 1 | instruções de uso | Referência |
| `RVD_Pecas` | relatório/cálculo | 141 | 20 | 1651 | Venda, Impostos, Custo, % Lucro Bruto, Lucro Bruto, Projeção, Objetivos | Saída de relatório de peças |
| `RVD_AC` | relatório/cálculo | 257 | 81 | 2743 | Venda, Imposto, Custo, % Lucro Bruto, Lucro Bruto, meses históricos | Saída de relatório de acessórios |
| `AN_Pecas` | relatório/cálculo | 139 | 25 | 1359 | Cod., Vendedor, Função, Venda Bruta, Venda Líquida, Lucro Bruto, Comissão, DSR, Fixo | Remuneração/análise peças |
| `AN_Acessórios` | relatório/cálculo | 117 | 25 | 942 | Promotores, Função, Venda, Venda Líquida, Lucro Bruto, Comissão | Remuneração/análise acessórios |
| `Comissão_Vendedores` | relatório/cálculo | 172 | 25 | 1576 | Cod., Nome, Departamento, Unidade, Carros Vend., Venda Acess., Objetivo, Comissão, DSR, Total | Comissão vendedores |
| `DETALHES_PENDENCIAS` | relatório/cálculo | 533 | 183 | 4205 | Consultor, NRO OS, Data, Dias Abertos, VLR Peças, VLR Serviços, Total OS | Pendências/OS |
| `Cadastros_Funcionários` | cadastro | 82 | 18 | 76 | código, Nome, Função, Departamento, % comissão s/ Venda, % comissão s/ Lucro, salário fixo | Pessoas e regras |
| `Cadastros_Vendedores` | cadastro | 105 | 25 | 101 | código, Nome, Departamento, Unidade | Pessoas/vendedores |
| `cadastro_geral` | cadastro/config | 24 | 18 | 30 | Revenda, marca, pastas, situação, senha | Configuração/referência |
| `EXP_COCKPITWEB` | entrada/base/export | 123 | 30 | 1398 | Empresa, Revenda, Data, Tipo, Departamento, Vendedor, Venda, Impostos, Custo, Lucro Bruto, Objetivos | View exportada para cockpit |
| `IMP_VENDEDORES` | entrada/base | 1125 | 4 | 0 | VENDEDOR, MECANICO, NOME | Base de pessoas/vendedores/mecânicos |
| `IMP_VENDAS` | entrada/base | 5000 | 18 | 14997 | VENDEDOR, DTA_DOCUMENTO, NF, Tipo Transação, TOT_CUSTO_MEDIO, PIS, COFINS, ICMS, TOT_MERCADORIA, Departamento, Custo, Impostos, Venda | Fato de vendas principal |
| `IMP_VENDAS_AT` | entrada/base | 15100 | 19 | 15099 | NRO_NOTA FISCAL, Departamento, Tipo OS, VLR_PEÇAS, VLR_CUSTO, Imposto, Transação, Devolução | Fato acessórios/peças/atendimento |
| `IMP_PENDENCIAS` | entrada/base | 68 | 7 | 0 | Contato, Data Emissão, NRO_OS, Vendedor, Total Peças, Total Serviços | Fato pendências/OS |
| `IMP_VEND_CARROS` | entrada/base | 52 | 3 | 0 | Departamento, Vendedor | Cadastro/ligação vendedores carros |
| `IMP_HISTORICO_PC` | entrada vazia | 1 | 1 | 0 | vazia | Ignorar até haver dados |
| `IMP_HISTORICO_AC` | entrada vazia | 1 | 1 | 0 | vazia | Ignorar até haver dados |
| `Importacao_Detalhada` | base detalhada calculada | 15000 | 180 | 149952 | NF, Série NF, Data, Transação, Depto, Vendedor Agregado, Vendedor, Venda (R$), Imposto (R$), Custo (R$) | Base mais rica para DRE/comercial/financeiro |
| `Config` | cadastro/config | 58 | 24 | 10 | Marcas, pastas, limites, senha | Referência/configuração |

## Alimentação por módulo

| Módulo | Abas prioritárias | Colunas relevantes |
|---|---|---|
| DRE | `Importacao_Detalhada`, `IMP_VENDAS`, `EXP_COCKPITWEB`, relatórios `RVD_*` como conferência | Data, Transação, Depto, Venda, Imposto, Custo, Lucro Bruto |
| Pessoas/Funcionários | `IMP_VENDEDORES`, `Cadastros_Funcionários`, `Cadastros_Vendedores` | Vendedor, Mecânico, Nome, Código, Função, Departamento, Unidade |
| Comissão | `Comissão_Vendedores`, `AN_Pecas`, `AN_Acessórios`, cadastros | Comissão, DSR, Total, Venda Bruta, Venda Líquida, Lucro Bruto, percentual comissão |
| Comercial | `IMP_VENDAS`, `IMP_VENDAS_AT`, `Importacao_Detalhada`, `EXP_COCKPITWEB` | Vendedor, Departamento, Transação, Venda, NF, Tipo OS, Peças |
| Financeiro | `Importacao_Detalhada`, `IMP_VENDAS`, `IMP_VENDAS_AT`, `RVD_*` | Venda, Custo, Imposto, Lucro, Data, Devolução |

## Observações

- O workbook possui muitas fórmulas: `Importacao_Detalhada` concentra a maior carga e não deve ser recalculada no frontend.
- Abas `IMP_*` são candidatas a tabelas fato/cadastro.
- Abas `RVD_*`, `AN_*`, `Comissão_*` são saídas calculadas e devem ser reconstruídas por engines no Sauron, não importadas cegamente como verdade final.
- `Menu`, `instrucoes`, `Config` e `cadastro_geral` são referência/configuração.

