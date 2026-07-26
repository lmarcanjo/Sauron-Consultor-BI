# MVP Recovery Baseline

Data: 2026-07-20  
Escopo: recuperação do fluxo MVP até `mvp-core-delivery.spec.ts`.

## Estado antes da correção

- A importação local concluía, mas o `ActiveDataset` ativado não expunha de
  forma confiável os cabeçalhos físicos da planilha.
- `columnProfiles` podia permanecer vazio e as telas de apresentação recebiam
  arrays de dados filtrados vazios.
- O consultor não tinha uma configuração simples para escolher colunas,
  criar um indicador ou criar um gráfico a partir da fonte ativa.
- A finalização da reunião podia permanecer na tela quando um registro
  auxiliar de histórico local falhava.

## Causa observada

O contrato de metadata da importação local não carregava as colunas da aba no
`SheetMetadata` nem produzia perfis físicos para o `ActiveDataset`. A camada
de apresentação também não tinha uma origem explícita para a configuração
MVP salva por dataset. Na sessão, o histórico narrativo era uma operação
auxiliar dentro do mesmo bloco de conclusão da ata.

## Correções do MVP

- Metadata local agora preserva as colunas físicas da aba e cria
  `columnProfiles` básicos.
- `MvpDataFirstPanel` lista as colunas reais, preserva o nome físico e permite
  editar apenas o nome exibido.
- A configuração é salva por `datasetId` em
  `sauron_mvp_data_configuration_v1`.
- Indicadores, gráficos e tabela usam linhas reais lidas sob demanda pela
  camada existente de dados.
- Apresentações recebem a configuração MVP e uma prévia real quando não há
  dados filtrados suficientes.
- A gravação auxiliar do histórico não impede a conclusão local da ata.

## Baseline técnico executado

- `npm run typecheck`: passou.
- `npx vitest run --reporter=dot`: 82 arquivos e 409 testes passaram.
- `npm run build`: passou; bundle principal aproximado de 2.042,86 kB, com
  alerta não bloqueante de chunk grande.
- `git diff --check`: passou.
- Playwright completo não foi usado como critério desta rodada: a execução de
  baseline não iniciou por colisão com a porta 3000 já ocupada no ambiente.

## Limites mantidos

O importador pesado, IndexedDB, `ActiveDatasetStore`, engines F8 e backend não
foram reescritos. A prévia MVP permanece limitada e a leitura completa segue
fora do React, pela camada de linhas sob demanda já existente.
