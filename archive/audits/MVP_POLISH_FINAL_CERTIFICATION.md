# MVP Polish Final Certification

Data: 2026-07-20
Escopo: MVP Polish & Legacy Behavior Purge. F21 não foi iniciado.

## Estado entregue

- importação compartilhada mantém o nome do arquivo visível antes da ativação;
- entrega de arquivos compartilhados para a rota de importação não depende mais
  de um evento único: a fila recebe também a prop persistida enquanto a rota
  monta;
- Dashboard não renderiza KPIs, rankings ou pendências inferidos sem escolha;
- todas as colunas físicas são exibidas;
- nome original é preservado e o consultor pode definir seu rótulo;
- uso da coluna é explícito;
- indicador, gráfico e tabela começam vazios e usam somente dados reais;
- Dashboard, módulos sem mapeamento e VPN mostram estados honestos;
- `ApplicationContextResolver` fornece uma composição única para o Dashboard;
- `ActiveDatasetStore` reidrata somente metadata/prévia na primeira leitura e o
  hook de fonte sincroniza o dataset após o evento de reload;
- fonte sem vínculo empresarial não é descartada durante o primeiro refresh de
  contexto; empresas/unidades explícitas sem vínculo continuam sem fonte;
- `LegacyLocalStateRepairService` é idempotente e não apaga dados físicos;
- Centro de Dados oferece verificação de dados locais;
- apresentação e reunião continuam usando a configuração MVP existente.

## Evidências

Baseline antes das alterações: typecheck, Vitest (82 arquivos/410 testes) e
build aprovados; Playwright isolado registrou 52 aprovados e 2 flaky na
confirmação visual do nome do arquivo. A causa foi a entrega por evento único
antes da montagem da rota. O contrato foi corrigido com entrega por prop,
reidratação síncrona de metadata e sincronização explícita do hook.

Também foi atualizado o teste RC-3 legado para validar a regra data-first:
linhas reais e isolamento C/D/E, sem exigir KPI automático proibido nesta
etapa.

| Verificação | Resultado final |
| --- | --- |
| `npm run typecheck` | aprovado |
| `npx vitest run` | 82 arquivos / 410 testes aprovados em 100,23 s |
| `npm run build` | aprovado; bundle principal 2.064,88 kB; alerta conhecido de chunk > 500 kB |
| Playwright completo | 55/55 aprovados em 1,9 min, 1 worker, servidor de produção local |
| `mvp-core-delivery.spec.ts` | aprovado dentro da suíte completa |
| `mvp-polish-core-flow.spec.ts` | aprovado dentro da suíte completa |
| upload/reload F19 repetido | 3/3 aprovados após a correção |
| `git diff --check` | aprovado |

## UX

- O primeiro contato com uma fonte mostra o arquivo, dimensões, abas e as
  colunas físicas sem exigir conhecimento técnico.
- “Editar informações” abre a escolha de rótulo e uso da coluna, mantendo o
  nome original visível.
- Indicador, gráfico e tabela começam sem conteúdo imposto; cada um é criado
  somente por ação explícita do consultor.
- Estados sem fonte usam “Nenhuma fonte de dados ativa.”; estados sem escolha
  usam “Configuração pendente”.
- O fluxo de apresentação, reunião, ata e reload foi percorrido pela suíte
  existente sem tela branca ou ação sem resposta detectada.

## Consistência dos dados

| Cadeia | Resultado |
| --- | --- |
| Arquivo → prévia | colunas e linhas reais preservadas |
| Coluna física → rótulo | `physicalName` não é alterado; rótulo do consultor é opcional |
| Escolha → indicador | somente a coluna e operação escolhidas são calculadas |
| Escolha → gráfico/tabela | somente configurações salvas são exibidas |
| Reload → configuração | rótulo, uso, indicador e gráfico persistem no fluxo MVP |
| Grupo C/D/E | preview real isolado; DRE sem mapeamento permanece pendente, sem inventar valor |

O fluxo não declara reconciliação financeira narrativa zero-diferença, porque
essa integração pertence a uma etapa posterior e não foi criada nesta rodada.

## Performance

- Playwright completo: 55 testes em 1,9 min, um worker, sem retries.
- Vitest: 410 testes em 100,23 s.
- Build: bundle principal 2.064,88 kB, com alerta não bloqueante de chunk
  acima de 500 kB.
- A reidratação restaura apenas metadata e prévia limitada; linhas completas
  continuam sob demanda no IndexedDB.
- O risco conhecido de bundle permanece registrado, sem iniciar otimização de
  arquitetura nesta etapa.

## Bugs corrigidos

| Causa | Impacto | Correção | Evidência |
| --- | --- | --- | --- |
| Dashboard montava blocos executivos inferidos antes da escolha do consultor. | KPIs e conceitos apareciam impostos. | Home passou a usar preview bruto e configuração data-first. | MVP Polish E2E e Playwright 55/55. |
| Configuração persistida podia ocultar colunas físicas novas. | Parte da planilha desaparecia após reload. | Configuração é reconciliada com as colunas atuais do dataset. | Vitest e fluxo MVP Polish. |
| Arquivo compartilhado era entregue por evento único antes da rota estar pronta. | Upload podia fechar sem processar e deixar a fonte vazia. | `sharedFiles` é passado ao `CentralDadosTab`, mantendo o evento compatível. | Upload/reload repetido 3/3. |
| Reidratação ocorria depois da primeira leitura do hook. | Biblioteca podia exibir “Nenhuma fonte” temporariamente ou perder a fonte. | Store carrega metadata/prévia na primeira leitura e `refreshDataSource` sincroniza o estado. | F19 upload/reload e suíte completa. |
| Refresh de contexto vazio limpava workbook sem vínculo empresarial. | Fonte importada antes do cadastro de empresa sumia após reload. | Workbook sem contexto organizacional explícito é preservado; escopos explícitos seguem isolados. | F19 e testes multiempresa. |
| Teste RC-3 exigia o KPI automático removido nesta etapa. | Certificação antiga ficava incompatível com a regra data-first. | Contrato do teste passou a validar linhas reais, isolamento e pendência do DRE. | RC-3 focado aprovado; suíte completa aprovada. |

## Validação manual solicitada

O consultor deve repetir a jornada completa no navegador, incluindo ativação
pela Biblioteca, troca de empresa, edição de informações, apresentação,
reunião, ata, reload e login novamente. O parecer final abaixo só é alterado
após a suíte automatizada e essa validação manual.

## Parecer

❌ REPROVADO

Motivo exato: a implementação e a suíte automatizada estão concluídas, mas a
validação manual do consultor ainda está pendente. A etapa para aqui, sem
avançar para F21.

## Itens restantes

- validação manual pelo consultor no navegador;
- eventual redução futura do bundle principal;
- nenhuma atividade de F21 foi iniciada ou incluída nesta certificação.
