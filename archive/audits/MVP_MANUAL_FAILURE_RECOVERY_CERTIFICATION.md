# MVP Manual Failure Recovery Certification

Data: 2026-07-21  
Escopo: recuperação do MVP orientada pelo vídeo de homologação e pela tabela
manual. F21 não foi iniciado.

## Estado Atual

O fluxo local agora trata o contexto, o vínculo canônico e o storage legado
antes de carregar qualquer análise. O ActiveDataset continua limitado a
metadata e preview; linhas completas permanecem sob demanda no IndexedDB.

## Bugs Corrigidos

| Causa | Correção | Evidência |
| --- | --- | --- |
| Contexto com grupo ausente, empresa/unidade válidas e projeto antigo | reparo idempotente do contexto e validação de invariantes | E2E confirma grupo, empresa e versão 2 |
| Binding procurado por identidade diferente | repositório compara sourceId, workbookId e datasetId e deduplica | ativação pela Biblioteca passou |
| Ponteiro `up_file_*` em estado antigo | filtragem centralizada e limpeza sem apagar dados físicos | fixture e scanner de produção |
| Seleção global podia contaminar escopo | seleção por chave contextual e troca limpa o ActiveDataset anterior | E2E multiempresa existente + recovery |
| Módulos derivados apareciam sem confirmação | menu e engines dependem de configuração salva | Financeiro/Comercial/DRE ficam fora antes da configuração |
| Inferência de campos na apresentação/reunião | somente mapeamentos e conteúdo MVP selecionados são aceitos | apresentação e reunião passaram |
| Coluna não numérica aceita em indicador/gráfico | validação explícita e mensagem de configuração | E2E valida total R$ 39.977,00 e gráfico |
| Navegação bloqueada após reload da reunião | sidebar permanece acessível durante a sessão | E2E navega após reload |
| Sessão mostrava contexto vazio | projeto da sessão resolve empresa/grupo/fonte ativos | E2E confirma empresa no root e ausência de contexto vazio |
| POST 404 de banco no caminho de planilha | inicialização de banco restrita ao modo de banco/API | auditoria de rede local |

## Validação Técnica

Resultados finais desta rodada, em servidor de produção isolado, com um worker:

- typecheck: aprovado;
- Vitest: 82 arquivos e 410 testes aprovados;
- testes focados `mvp-manual-failure-recovery`, `f19-2`, `f20-2` e `executive-journey-certification`: 4/4 aprovados;
- E2E `mvp-manual-failure-recovery.spec.ts`: 1/1 aprovado, incluindo reparo,
  configuração, ativação, apresentação, reunião, ata e reload;
- build local: aprovado; bundle principal de 2.078,07 kB, com alerta conhecido
  de chunk grande;
- Playwright completo: 56/56 aprovados em 2,2 minutos, um worker, sem retry;
- `git diff --check`: aprovado;
- scanner de produção para `DEMO_DATA`, `demoData`, `generateDemo`, `mockRows`
  e nomes demonstrativos: sem ocorrências;
- validação manual Firefox Dev com storage histórico: pendente.

## Itens Que Não Foram Alterados

O importador pesado, backend, IndexedDB físico e engines F8 não foram
reescritos. Nenhuma funcionalidade de F21 foi criada.

## Parecer Final

## ❌ MVP REPROVADO

Motivo exato: toda a validação automatizada está verde, mas a nova validação
manual exigida no Firefox Dev com o perfil histórico ainda não foi realizada.
Sem essa evidência, não é possível certificar que o reparo funciona sobre o
storage real usado na homologação. Aguardar a validação manual do consultor;
nenhuma etapa de F21 deve ser iniciada.
