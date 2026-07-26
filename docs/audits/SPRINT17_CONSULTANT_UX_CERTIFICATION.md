# Sprint 17 — Consultant UX Certification

Data: 2026-07-25  
Escopo: consolidação incremental da experiência do consultor.

## Estado Atual

O fluxo visível foi consolidado para:

```text
Cliente -> Projeto -> Fontes -> Análise -> Decisão -> Reunião -> Acompanhamento -> Administração
```

Há uma única entrada visível para fontes: **Fontes de Dados**. Ela reúne
importação, conexão, fontes persistidas, ativação, preview e configuração dos
campos. A análise estrutural ocorre em **Análise da fonte**. Os módulos de
resultado aparecem somente quando a fonte e os pré-requisitos correspondentes
estão disponíveis; caso contrário, o consultor recebe uma pendência acionável.

O fluxo continua data-first: `ActiveDatasetStore` mantém metadata e preview;
linhas completas permanecem no storage paginado e não são carregadas pelo
React para decidir se existe uma fonte.

## Auditoria e Remoções

| Área | Resultado |
| --- | --- |
| Menu | 8 grupos e 24 entradas visíveis no fluxo canônico |
| Fonte | `CentralDadosTab` absorve importação, fontes persistidas e conexão |
| Análise | `analise_estrutura` concentra profiling, visão e configuração |
| Resultado | Financeiro, Comercial, Pessoas e DRE não exibem painel de configuração duplicado |
| Relatórios | `ReportsPage` usa estados dinâmicos: disponível, requer informação ou não aplicável |
| Vazios | Estados sem fonte mostram `Nenhuma fonte de dados ativa.` |
| Legado visual | `WorkbookLibraryTab`, `VpnGatewayTab` e `CentralDadosDrawer` removidos do fluxo de produção |
| Duplicidade | Ativação por fonte usa a linha persistida e chave canônica da fonte |
| Contexto | Abrir uma fonte resolve seu vínculo de grupo/empresa/unidade antes de ativar |

Os nomes internos de repositórios e workbooks continuam nos contratos de código
onde são necessários. Eles não são apresentados como instrução ao consultor.
Aliases de acessibilidade antigos permanecem somente como ponte para testes e
consumidores legados; não representam telas ou rotas adicionais.

## Bugs Encontrados e Corrigidos

| Causa | Impacto | Correção | Evidência |
| --- | --- | --- | --- |
| Testes procuravam cards da biblioteca removida (`h4`) e a ação antiga `Usar esta planilha`. | Jornadas existentes não encontravam fontes persistidas. | Seletores passaram a usar a linha da fonte e `Abrir como fonte única`. | Playwright completo verde. |
| Navegação de teste ainda acessava `Notas` e outras entradas absorvidas. | O teste falhava em uma entrada que não existe mais no menu canônico. | Jornada atualizada para as entradas visíveis de Cliente a Acompanhamento. | `full-navigation-runtime.spec.ts` verde. |
| Filtros/checkbox/input da tela única não tinham nomes acessíveis no build executado. | Axe apontava violações críticas e sérias. | Labels explícitos, `id`/`htmlFor`, `aria-label` e contraste do estado vazio. | F19.1 e suíte completa verdes. |
| Abrir uma fonte vinculada à empresa A mantinha a empresa B no contexto ativo. | Sessão e módulos poderiam misturar fonte e empresa. | A ativação resolve o `SourceEnterpriseBinding` da fonte antes de publicar o contexto. | `mvp-manual-failure-recovery` e RC-3 multiempresa verdes. |
| Teste SQL esperava texto de card da tela antiga. | O teste não reconhecia a tabela persistida atual. | Asserção passou a validar a linha da fonte e a quantidade de colunas físicas. | MVP data-first verde. |

## UX Certificada por Automação

- primeiro acesso e sessão do consultor;
- cadastro de empresas e grupos;
- importação e ativação de planilhas;
- conexão SQL simulada pelo contrato de teste existente;
- fontes persistidas e seleção contextual;
- análise da fonte e estados pendentes;
- Dashboard, Financeiro, Comercial, Pessoas e DRE;
- apresentações, reunião, ata, plano e reload;
- recuperação após troca de contexto;
- teclado, foco, zoom e axe/WCAG nas telas cobertas;
- ausência de tela branca, erro de página e warning de aplicação nos cenários certificados.

## Validação Técnica

| Verificação | Resultado |
| --- | --- |
| Typecheck | aprovado |
| Lint | aprovado; script executa `tsc --noEmit` |
| Vitest | 87/87 arquivos; 418/418 testes |
| Playwright completo | 59/59 testes, 1 worker, 2,1 min |
| Playwright focado UX/WCAG | 29/29 testes |
| Build | aprovado |
| `git diff --check` | aprovado |

O build gerou aproximadamente 1.716,60 kB no bundle principal, 138,90 kB de
CSS e 429,53 kB no chunk XLSX. O alerta de chunk acima de 500 kB permanece
como risco de performance conhecido e não foi ampliado nesta Sprint.

## Evidência de Dados

As jornadas reais verificaram preview, cabeçalhos, persistência no reload,
ativação da fonte e mudança de contexto. O cenário de fixture real reportou,
entre outras métricas, 60 linhas e 13 colunas, sem fallback demonstrativo.
O cenário multiempresa validou isolamento e consolidação de fontes já
existentes, sem alterar o importador ou os dados físicos.

## Validação Manual Pendente

Ainda falta a confirmação manual do consultor no navegador, usando o checklist:

1. Entrar pela primeira vez e encontrar **Cliente → Empresas e Grupos**.
2. Criar grupo, empresa e unidade.
3. Abrir **Fontes → Fontes de Dados** e importar uma planilha.
4. Confirmar a fonte e abrir **Análise → Análise da fonte**.
5. Confirmar uma configuração e abrir os resultados disponíveis.
6. Abrir apresentação, preparação, sessão, ata, plano e histórico.
7. Recarregar e confirmar fonte, contexto e resultado.
8. Trocar empresa e confirmar que a fonte anterior não permanece visível.

## Itens Restantes

- confirmação manual ainda não foi realizada nesta execução;
- o bundle principal continua acima do limite recomendado;
- aliases acessíveis e adapters internos antigos ainda exigem uma etapa própria
  de retirada quando todos os consumidores externos forem migrados.

## Parecer Final

## ❌ REPROVADO

Motivo exato: a consolidação foi certificada por typecheck, Vitest, build e
Playwright completo, mas a Sprint exige também validação manual do consultor.
Essa confirmação ainda está pendente. Não há falha automatizada bloqueando o
fluxo observado; o parecer permanece reprovado exclusivamente até a validação
manual solicitada.
