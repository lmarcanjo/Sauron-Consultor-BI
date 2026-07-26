# Sprint 18 — Product Baseline

Data: 2026-07-25  
Momento: antes de qualquer correção específica da Sprint 18.

## Escopo Observado

O baseline considera a implementação consolidada da Sprint 17. Nenhum código
foi alterado para criar este registro.

## Navegação

O menu canônico possui 8 grupos e 24 entradas visíveis:

```text
Cliente -> Projeto -> Fontes -> Análise -> Decisão -> Reunião
-> Acompanhamento -> Administração
```

As duas superfícies centrais são:

- `Fontes de Dados`: importação, conexão, fontes persistidas, ativação e
  configuração inicial;
- `Análise da fonte`: profiling, visão estrutural, seleção e confirmação.

Rotas antigas de biblioteca, VPN e drawer não aparecem no menu canônico.

## Telas de Configuração

Foram identificadas duas etapas de configuração no fluxo:

1. configuração dos campos por módulo em Fontes de Dados;
2. análise/profiling e confirmação da visão em Análise da fonte.

Os módulos de resultado não exibem o painel de mapeamento novamente.

## Ações e Botões

O inventário estático dos componentes principais auditados encontrou 188
declarações de controles (`button`, `select`, `input`, `textarea` e handlers).
Esse número é de código, não de elementos simultaneamente visíveis.

Principais ações visíveis no fluxo:

- cadastrar grupo, empresa e unidade;
- importar planilha;
- conectar banco;
- ativar, abrir preview, vincular, arquivar, restaurar e excluir fonte;
- revisar análise;
- criar/confirmar visão;
- abrir resultados, apresentação, preparação, sessão, ata e plano.

Não foi encontrado botão principal sem ação na smoke suite. A validação
detalhada das ações de análise permanece parte da jornada Sprint 18.

## Performance Inicial

O baseline automatizado de `tests/e2e/app.spec.ts` passou 6/6 em 8,5s com um
worker. Esse é o tempo da suíte focada, não uma medição isolada de primeira
renderização. O bundle existente apresenta:

| Artefato | Tamanho aproximado |
| --- | ---: |
| Bundle principal | 1,7 MB |
| Chunk XLSX | 420 kB |
| CSS | 136 kB |

O build mantém o alerta não bloqueante de chunk acima de 500 kB.

## Console e Estado Inicial

| Item | Resultado |
| --- | --- |
| Smoke Playwright | 6/6 aprovado |
| Erro de página na smoke | nenhum observado |
| Warning de aplicação na smoke | nenhum observado |
| Fonte ativa em contexto limpo | nenhuma |
| Estado esperado sem fonte | `Nenhuma fonte de dados ativa.` |
| Resultado sem fonte | pendência acionável, sem valor demonstrativo |

Warnings do processo Node sobre `NO_COLOR` pertencem ao runner da validação e
não ao navegador do consultor.

## Cliques Observados

Em uma sessão já autenticada, abrir um resultado pelo menu exige:

1. expandir o grupo;
2. selecionar a entrada.

Logo, o caminho mínimo até uma visão executiva é de 2 cliques de navegação.
Importação, análise e confirmação de fonte são etapas adicionais e serão
medidas na jornada real da Sprint 18.

## Riscos para Reprodução Manual

- validação SQL real depende de VPN ativa e credenciais fornecidas fora do
  código;
- ainda não há evidência manual deste navegador para a jornada completa;
- grandes volumes precisam ser medidos durante profiling real;
- logs de erro em camadas internas devem ser distinguidos de erros visíveis,
  sem supressão.

## Evidência

- `npm run typecheck`: aprovado;
- `git diff --check`: aprovado;
- `tests/e2e/app.spec.ts`: 6/6 aprovado em 8,5s.

## Atualização após a reprodução

Em 25/07/2026, a jornada de navegador com a planilha do consultor foi
repetida em servidor local de produção com o modo de importação local. O fluxo
contextual foi iniciado por um grupo e uma empresa criados na própria jornada.
O seletor duplicado `btn-open-data-center` foi reproduzido e corrigido com um
`data-testid` exclusivo no botão da barra lateral; o contrato do cabeçalho,
ação e layout não mudaram.

O caminho de importação em modo API também foi observado: o servidor local
respondeu `404` para `/api/v1/imports/spreadsheets`. Como esse endpoint pertence
à integração de produção e a Sprint 18 proíbe alterar importador ou backend,
esse bloqueio permanece registrado no relatório de defeitos.

## Validação técnica final

- `npm run typecheck`: aprovado;
- `npm run lint`: aprovado;
- `npm run build`: aprovado, com o alerta não bloqueante de chunk acima de
  500 kB;
- `npx vitest run`: 87 arquivos e 418 testes aprovados em 104,64 s;
- Playwright smoke: 6/6 aprovados;
- Playwright completo: 59/59 aprovados em 2,1 min, um worker;
- `git diff --check`: aprovado.
