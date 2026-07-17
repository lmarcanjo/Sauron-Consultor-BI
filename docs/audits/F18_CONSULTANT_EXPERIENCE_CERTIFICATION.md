# F18 - Certificacao da Experiencia do Consultor

Data: 2026-07-15  
Escopo: experiencia do consultor do primeiro acesso ao dashboard, fontes,
diagnostico, apresentacao e recuperacao.

## Estado Atual

O fluxo certificado ficou mais direto na camada visivel:

```text
Login -> Empresas e Grupos -> Biblioteca de Planilhas -> Importar
-> Confirmar sugestoes -> Diagnostico -> Apresentacao -> Reuniao
```

A fonte continua sendo real, o `ActiveDatasetStore` permanece responsavel pelo
contexto ativo e os contratos de importacao, IndexedDB e engines F8 nao foram
reescritos nesta sprint. Estados sem fonte continuam mostrando `Nenhuma fonte de
dados ativa.` e estados sem interpretacao mostram pendencia, sem dados
demonstrativos.

Auditoria de base: [F18_CONSULTANT_UX_AUDIT.md](./F18_CONSULTANT_UX_AUDIT.md).

## Bugs Encontrados e Corrigidos

| Causa | Impacto | Correcao | Evidencia |
| --- | --- | --- | --- |
| A Central de Dados apresentava fonte, segmento, banco, VPN, APIs, logs e governanca no mesmo primeiro painel. | O consultor nao sabia qual acao vinha primeiro. | Reordenacao para fonte ativa, contexto do cliente, adicionar dados, integracoes avancadas e saude da fonte. | Screenshot da Biblioteca e Playwright F18. |
| O mapeamento expunha aba, papel semantico e configuracao como linguagem principal. | A configuracao parecia uma tarefa de TI. | Textos empresariais: `Confirmar dados desta area`, `Campos encontrados` e `Confirmar selecao`. | `f18-consultant-personas.spec.ts` 6/6. |
| Dashboard, pipeline e biblioteca exibiam `GROUP SCOPE`, `Lineage`, `Readiness Score`, workbook e dataset. | A interface exigia conhecimento interno. | Labels substituidos por contexto, origem dos dados, progresso, planilha e fonte. | Jornada F18 e screenshot. |
| `App.tsx` mantinha um bloco morto com numeros fixos de unidades, pessoas e departamentos. | Residuos de dados ficticios podiam reaparecer no Core. | Bloco removido sem substituir por valores inventados. | Busca de producao e testes E2E sem tokens de demo. |
| O onboarding tinha texto secundario com classe de cor sem contraste suficiente. | As opcoes de importacao e banco pareciam desabilitadas ou ilegiveis. | Contraste ajustado e estado bloqueado mantido explicito. | Screenshot `F18-01-primeiro-passo.png`. |
| Helpers Playwright dependiam de elementos transitórios e do primeiro `aside` do DOM. | Reload e execucao paralela produziam falsos negativos. | Navegacao pelo papel semantico `complementary`; importacao confirmada pelo assistente fechado e fonte ativa. | Suíte completa 24/24. |

## Melhorias de UX

- Menu `Conectar Dados` agora separa `Importar Planilhas` e `Biblioteca de Planilhas`.
- Biblioteca usa linguagem de arquivo empresarial: nome, empresa, fonte ativa,
  status e acao `Usar esta planilha`.
- O painel de sugestoes permanece aberto apos aceitar campos e informa o que foi
  confirmado, evitando uma tela que desaparece sem explicacao.
- Dashboard mostra `Contexto do cliente`, `Visao consolidada` e `Origem` em vez
  de termos de engenharia.
- O primeiro acesso informa o proximo passo: cadastrar grupo/empresa antes de
  importar.
- A jornada continua permitindo configuracao manual somente quando a descoberta
  automatica nao e suficiente.
- Nenhum valor foi criado para preencher estados vazios.

Evidencias visuais:

- [Primeiro passo](./evidence/F18-01-primeiro-passo.png)
- [Biblioteca de fontes](./evidence/F18-02-biblioteca-fontes.png)

## Personas

O teste [f18-consultant-personas.spec.ts](../../tests/e2e/f18-consultant-personas.spec.ts)
usa a interface real e validou:

| Persona | Jornada validada | Resultado |
| --- | --- | --- |
| Consultor iniciante | encontra cadastro e primeiro passo | aprovado |
| Consultor tradicional | importa fonte real e confirma somente o necessario | aprovado |
| Consultor senior | navega na biblioteca, abre diagnostico e recarrega | aprovado |
| Cliente | encontra estado claro quando nao ha fonte ativa | aprovado |
| Diretor | consulta KPIs/DRE real ou pendente | aprovado |
| CEO | abre apresentacao sem tokens de mock/demo | aprovado |

## Playwright

Resultado final: **24/24 testes aprovados em 36,0 s**.

Cobertura relevante:

- onboarding e sessao;
- importacao real e importacao em lote;
- biblioteca, ativacao e troca de fonte;
- configuracao assistida;
- Dashboard, Financeiro, Comercial, Pessoas e DRE;
- apresentacao, reuniao, ata, plano e historico;
- reload, logout/login e recuperacao;
- ausencia de tela branca, erro de pagina, erro de console, warning de browser
  e falha de requisicao nos testes.

O runner Node emitiu o aviso externo `NO_COLOR` versus `FORCE_COLOR`. Ele nao
veio do navegador nem da aplicacao e nao foi capturado como warning de pagina.

## Vitest

`npx vitest run`: **338/338 testes aprovados**, 69 arquivos, 168,73 s.

## Typecheck

`npm run typecheck`: aprovado.

`git diff --check`: aprovado.

## Build

`npm run build`: aprovado.

- bundle principal: 1.844,18 kB;
- bundle XLSX: 429,53 kB;
- CSS: 159,19 kB;
- servidor: 85,8 kB.

Permanece o aviso nao bloqueante de chunk maior que 500 kB. Nenhuma otimizacao
de arquitetura ou processamento foi introduzida nesta sprint.

## Performance

Sem alteracao de processamento pesado. O baseline anterior continua valido em
[ENGINE_PERFORMANCE_BASELINE.md](./ENGINE_PERFORMANCE_BASELINE.md): o Knowledge
Graph permanece o maior risco de memoria para workbooks grandes e o processamento
completo deve continuar fora do navegador em producao.

## Consistencia dos Dados

- A camada F18 nao altera linhas, formulas, ActiveDataset ou calculos financeiros.
- Os testes de importacao continuam observando valores reais do fixture.
- A interface nao usa mock/demo para preencher dashboard, biblioteca ou estados
  sem fonte.
- O `FinancialConsistencyEngine` existe como contrato e comparador, mas a
  reconciliacao automatica entre metricas, narrativa, apresentacao, ata e plano
  ainda nao esta conectada em todos os produtores.

## Itens Restantes

1. Adapters legados como `DataSourceManager` e `SpreadsheetWorkspaceManager`
   ainda possuem consumidores e nao podem ser removidos sem migracao coordenada.
2. A limpeza de vocabulario fora dos Domain Packs ainda precisa de uma varredura
   ampla em telas administrativas e artefatos legados.
3. A reconciliacao zero-diferenca end-to-end ainda precisa ligar todos os
   produtores narrativos ao `FinancialConsistencyEngine`.
4. A Biblioteca ainda pode receber uma rodada posterior de reducao de controles
   avancados; nesta sprint eles foram retirados do primeiro passo, nao apagados.

## Parecer Final

## Reprovado

O fluxo de experiencia do consultor certificado esta verde: as seis personas,
as jornadas de importacao e recuperacao e a navegacao principal passaram sem
erro de browser, mock ou tela quebrada. Ainda assim, o parecer formal F18 fica
**Reprovado** para certificacao Enterprise integral porque os tres bloqueios
herdados registrados na F17.1 continuam reais: adapters legados, varredura
completa de vocabulario fora de Domain Packs e reconciliacao matematica
zero-diferenca conectada do dado ate narrativa, apresentacao, ata e plano.

Isso delimita a entrega: a experiencia foi simplificada e validada sem mascarar
as pendencias estruturais que ainda precisam ser resolvidas antes de um parecer
Enterprise definitivo.
