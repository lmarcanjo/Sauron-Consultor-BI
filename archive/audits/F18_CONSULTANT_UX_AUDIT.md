# F18 Consultant UX Audit

Data: 2026-07-15  
Escopo: jornada do consultor do primeiro acesso ate o dashboard, reuniao e
historico.

## Metodo

A auditoria combinou leitura dos componentes visiveis, estrutura de navegacao,
estados sem fonte, fluxo de importacao/configuracao e os testes Playwright
existentes. O foco foi identificar o que um consultor precisa decidir, o que o
sistema poderia descobrir e quais textos pertencem ao Core, mas chegam a tela.

## Jornada Atual

```text
Login -> Centro de Comando -> Empresas e Grupos -> Central de Dados
-> Importacao -> Biblioteca de Workbooks -> Configuracao por modulo
-> Diagnostico -> Apresentacao -> Preparacao -> Sessao -> Ata
-> Plano -> Historico
```

A jornada funciona e esta coberta por E2E, mas exige que o consultor conheca a
ordem dos grupos e reconheca termos internos como Workbook, dataset, scope,
lineage e mapeamento.

## Problemas Priorizados

| Prioridade | Arquivo / evidencia | Problema | Impacto consultivo | Acao F18 |
| --- | --- | --- | --- | --- |
| P0 | `src/components/CentralDadosDrawer.tsx:68-260` | A Central mistura fonte, segmento, banco, VPN, APIs, governanca e logs tecnicos no mesmo painel. | O consultor nao sabe qual e o proximo passo e pode entrar em infraestrutura sem necessidade. | Reorganizar a superficie visivel em fonte, biblioteca e proximo passo; manter integracoes tecnicas fora do caminho principal. |
| P0 | `src/components/ModuleFieldMappingPanel.tsx:182-264` | O fallback de configuracao fala em aba, colunas, papel semantico e quantidade de colunas. | Parece uma ferramenta para desenvolvedor e contradiz configuracao assistida. | Exibir confirmacao empresarial; manter inferencia automatica e pedir somente a duvida necessaria. |
| P0 | `src/App.tsx:1890-1969` | Bloco morto contem unidades, headcount, departamentos e numeros fixos. | E resíduo de dados ficticios no Core e pode voltar por acidente. | Remover o bloco morto sem substituir por dados inventados. |
| P0 | `src/App.tsx:1202` e `src/App.tsx:431` | `console.warn` e `console.error` diretos no caminho de producao. | Viola o criterio de zero warnings/errors e polui demonstracoes. | Usar `platformLogger` com mensagem empresarial na UI quando houver acao bloqueada. |
| P1 | `src/components/pages/DashboardPage.tsx:123-132,156-162` | Exibe `Contexto Analitico Ativo`, `GROUP SCOPE` e `Lineage`. | Linguagem interna dificulta leitura executiva. | Trocar por contexto do cliente, visao selecionada e origem dos dados. |
| P1 | `src/components/SmartConfigurationPanel.tsx:89-92` | Mostra dominio provavel e confianca em uma frase tecnica. | O consultor precisa entender o que confirmar, nao o algoritmo. | Mostrar “Encontramos estes campos” e confiança como apoio, sem expor internals. |
| P1 | `src/components/ConsultingPipelineWidget.tsx:248-279` | Mostra `Readiness Score`, `mapeamento ok` e “Pendente Segmento”. | A jornada parece um painel de engenharia. | Usar progresso da jornada e ações em linguagem empresarial. |
| P1 | `src/components/WorkbookLibraryTab.tsx:124-150` | Toasts dizem workbook e dataset ativo; menu chama Biblioteca de Workbooks. | A fonte parece conceito técnico, não arquivo da empresa. | Usar Biblioteca de Planilhas na camada visível; IDs e contratos permanecem internos. |
| P1 | `src/components/EnterpriseCenter.tsx:707-714,850-900` | A Home combina pipeline, checklist, consolidação, mercado e fontes. | Há muitas decisões na primeira tela e ações redundantes. | Priorizar estrutura, fonte ativa e próxima ação; deixar detalhes sob demanda. |
| P2 | `src/components/CentralDadosDrawer.tsx:119-220` | Segmento, banco, VPN e APIs aparecem antes de o consultor confirmar a planilha. | A ordem visual não acompanha o fluxo oficial. | Fonte real primeiro; configurações avançadas somente quando solicitadas. |
| P2 | `src/components/EnterpriseCenter.tsx:1112-1139` | O tipo permite Fazenda e Loja no Core. | Vocabulário de domínio fica espalhado e pode confundir empresas de outros contextos. | Manter tipos de negócio em Domain Packs; cadastro base usa Grupo, Empresa e Unidade. |

## O Que Deve Ser Descoberto Automaticamente

- nome da fonte, abas, linhas, colunas e periodo;
- colunas candidatas a receita, custo, despesa, vendedor, cliente, produto,
  quantidade, valor e comissao;
- prontidao de cada modulo e origem dos dados;
- existencia de configuracao anterior no workspace.

Quando houver ambiguidade, a interface deve apresentar uma pergunta curta com
uma sugestao e uma escolha clara. A configuracao manual continua como fallback,
mas nao pode ser o primeiro caminho.

## Proposta Incremental

1. Tornar a Biblioteca de Planilhas e a fonte ativa a entrada principal para
   dados; preservar IDs, rotas e repositorios internos.
2. Reduzir a Central visivel a importacao, fontes ativas e proximo passo; nao
   remover conectores, apenas retirar sua presenca do fluxo inicial.
3. Substituir linguagem tecnica visivel por mensagens empresariais sem alterar
   contratos ou nomes de tipos no Core.
4. Remover codigo morto e logs diretos do caminho de producao.
5. Adicionar personas UI para consultor senior, tradicional e iniciante,
   cobrindo caminho feliz, erro, cancelamento, reload e troca de contexto.
6. Validar a jornada completa com Playwright e guardar evidencias de tela,
   console e persistencia.

## Impacto Tecnico

- baixo: alteracoes concentradas em labels, ordenacao de blocos e estados
  vazios;
- medio: remover o bloco morto de `App.tsx` e trocar logs diretos;
- nenhum: importador pesado, IndexedDB, ActiveDatasetStore, engines F8 e
  contratos de persistencia nao precisam ser reescritos;
- testes E2E que dependem de textos de navegacao precisarao acompanhar os
  novos nomes empresariais.

## Plano de Execucao

| Etapa | Resultado |
| --- | --- |
| Auditoria | Este documento, com problemas e evidencia no codigo. |
| UX base | Biblioteca, Central, Dashboard e cadastro com proximo passo claro. |
| Integridade | Sem dados mortos, mocks, demos, console.error ou console.warn em producao. |
| Personas | Fluxos UI para tres perfis de consultor e cenarios de erro. |
| Certificacao | Relatorio F18 com typecheck, build, Vitest, Playwright, screenshots e pendencias honestas. |

## Riscos Mantidos

- adapters legados ainda existem e nao devem ser removidos sem migracao;
- reconciliacao end-to-end ainda depende da integracao dos produtores de
  narrativa, apresentacao, ata e plano ao `FinancialConsistencyEngine`;
- conectores de banco permanecem disponiveis, mas nao devem dominar o primeiro
  caminho do consultor.
