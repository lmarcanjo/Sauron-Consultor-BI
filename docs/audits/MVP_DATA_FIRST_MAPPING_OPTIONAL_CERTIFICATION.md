# MVP Data-First: Mapeamento Opcional

Data: 2026-07-22  
Escopo: hotfix de continuidade para planilhas e banco, sem alteração de VPN,
driver MySQL ou importador pesado.

## Bloqueio encontrado

O `DatabaseConnector.loadData` interrompia a carga quando uma lista fixa de
campos semânticos não estava preenchida. A origem exata era a validação de
`Grupo`, `CNPJ`, `Marca`, `Empresa`, `Mês`, `Razão`, `Receita`, `Custo` e
`Despesa` antes do `POST /api/db/fetch`.

No fluxo de planilhas, `WorkbookReadinessService` devolvia
`PENDING_CONFIG` quando não havia mapeamento ou módulo habilitado, mesmo com
storage, aba selecionada e vínculo válidos.

Também havia dois caminhos de perda/invenção de dados: a normalização do banco
descartava colunas físicas sem mapeamento, e o parser CSV criava valores
semânticos padrão para campos ausentes.

## Correções aplicadas

- Removida a validação bloqueante de campos semânticos no `DatabaseConnector`.
- Ativação de workbook passou a depender de storage, aba selecionada e vínculo;
  mapeamento e módulos continuam opcionais.
- `ModuleFieldMappingPanel` aceita e persiste seleção vazia.
- Colunas físicas do banco são preservadas com zero mapeamentos.
- Mapeamento parcial adiciona somente aliases explicitamente escolhidos, sem
  criar `0`, `Lucro` ou `Margem` derivados.
- `parseCSV` preserva cabeçalhos físicos e não cria valores de negócio padrão.
- A Central mostra o total de colunas físicas também para fonte SQL.
- Mensagens da interface passaram a indicar configuração opcional e
  `0 campos personalizados`.
- Descoberta de tabela no banco não aplica sugestões sem confirmação; os
  campos permanecem ignorados até escolha explícita.

Arquivos principais:

- `src/components/DatabaseConnector.tsx`
- `src/core/connections/DatabaseConnectionManager.ts`
- `src/core/workbook-library/WorkbookReadinessService.ts`
- `src/components/ModuleFieldMappingPanel.tsx`
- `src/components/CentralDadosTab.tsx`
- `src/App.tsx`
- `src/utils/csvParser.ts`

## Testes adicionados

- Carga de banco com colunas arbitrárias e zero mapeamentos.
- Carga de banco com mapeamento parcial sem campos inventados.
- Persistência de mapeamento vazio.
- Parser CSV data-first.
- E2E de planilha: `A001`, `B002`, `C003`, nenhum mapeamento, dashboard sem
  indicadores/gráficos automáticos, tabela com `A001/B002` e reload.
- E2E de banco: conexão técnica mockada no teste, tabela arbitrária, zero
  mapeamentos, continuidade e leitura das colunas físicas.

## Validação automatizada

| Verificação | Resultado |
| --- | --- |
| Testes focados | 28/28 |
| Vitest completo | 83 arquivos, 431 testes |
| Typecheck | passou |
| Build | passou; alerta existente de bundle > 500 kB |
| E2E data-first planilha + banco | 2/2 |
| E2E MVP core | 1/1 |
| `git diff --check` | passou |

Os testes E2E de banco usam mocks apenas no nível técnico do teste, conforme
permitido pelo escopo. Nenhuma simulação foi adicionada ao produto.

## Validação manual obrigatória

Não executada nesta rodada. Ainda é necessário validar com:

1. VPN ativa, MySQL real, database `consultoria` e uma tabela real sem mapear
   campos semânticos;
2. planilha real, aba selecionada, zero mapeamentos, tabela física escolhida e
   persistência após reload.

Essa validação deve confirmar também que nenhum dado físico foi alterado e que
as configurações opcionais permanecem após recarregar.

## Parecer

## ❌ REPROVADO

Motivo exato: as validações automatizadas passaram, mas a certificação exigida
depende de uma execução manual com VPN/MySQL real e com a planilha real. Essa
evidência não foi obtida nesta sessão; portanto não é permitido declarar
`DATA-FIRST APROVADO`.
