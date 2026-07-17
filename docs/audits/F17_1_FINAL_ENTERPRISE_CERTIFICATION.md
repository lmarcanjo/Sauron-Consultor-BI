# F17.1 Final Enterprise Certification

Data: 2026-07-15  
Escopo: purge incremental de legado, eventos canônicos, vocabulário, jornada
executiva e recuperação local.

## Estado Atual

O fluxo principal local permanece:

```text
UI -> SimpleSpreadsheetImporter -> ImportService -> IndexedDB/WorkbookRepository
   -> DataActivation -> ActiveDatasetStore(metadata + preview)
   -> Dashboard/Financeiro/Comercial/Pessoas/DRE/Presentation/Session
```

O `ActiveDatasetStore` não carrega todas as linhas no reload. Linhas completas
continuam no IndexedDB e views/engines leem sob demanda. Nenhuma alteração de
importador pesado, backend ou engines F8 foi feita nesta rodada.

## Bugs Encontrados e Corrigidos

| Causa | Impacto | Correção | Evidência |
| --- | --- | --- | --- |
| A rota de Biblioteca era renderizada também pelo fluxo duplicado da Central. | O consultor podia cair em uma tela diferente e não ver workbooks persistidos. | App usa `WorkbookLibraryTab` como rota canônica; Central mantém entrada de dados. | Jornada F17.1 verde; dois CSVs aparecem na biblioteca. |
| Seleção de arquivo compartilhada era disparada antes do importer montar. | Arquivo selecionado podia não chegar ao modal. | App enfileira arquivos e despacha após a rota `importacao` montar. | `executive-journey-certification.spec.ts` importa dois arquivos pela UI. |
| Ata abria novamente `MeetingModePage` sem finalizar sessão. | Logout ficava bloqueado pela tela cheia de reunião. | Jornada fecha e sincroniza após Sessão e após Ata. | E2E passa logout/login ao final. |
| Eventos do DataSourceManager usavam string legada separada do bus. | Reações duplicadas e contrato espalhado. | `DATA_SOURCE_STATE_CHANGED` centralizado em `PlatformEvents`; listeners com cleanup. | Busca de produção sem `sauron_datasource_updated`; testes de sanidade. |
| Contexto ainda expunha `modoDemoReal`. | Resíduo semântico de modo demo no Core. | Contrato renomeado para `dataMode: "real"`. | Typecheck e Vitest. |
| SDL Studio aparecia como ação normal de Super Admin apesar de conter amostras de UI. | Laboratório podia ser confundido com fluxo comercial. | Visível somente com `?lab=true`. | Inventário e inspeção da navegação. |
| Logs de instrumentação usavam `console.log` direto. | Console de produção podia ser poluído. | Componentes e engines migrados para `platformLogger`; info/debug ficam desligados por padrão. | `rg console.log src` sem resultados. |
| Logs de teste emitiram warning de `vi.mock` aninhado. | Validação ficava ruidosa e incompatível com futuro Vitest. | Mock movido ao topo de `DatabaseConnectionManager.test.ts`. | Execução unitária sem esse warning. |

## UX e Navegação

O menu mantém estados de módulo pendente sem esconder a ação aplicável. A
Biblioteca de Workbooks lista fontes persistidas mesmo quando uma associação
hierárquica antiga está incompleta. O cadastro e a importação são acessíveis
pela jornada `Empresas e Grupos` -> `Central de Dados` -> `Biblioteca`.

O laboratório SDL foi retirado do fluxo normal. Estados sem fonte continuam
mostrando `Nenhuma fonte de dados ativa.`; estados sem mapeamento mostram
`Configuração pendente`, sem valores demonstrativos.

## Vocabulário

Labels de domínio dos componentes genéricos passaram a ser resolvidos por
`src/core/business-domains/DomainDisplay.ts`, usando os manifestos dos Domain
Packs. O Core não cria um fallback de segmento específico; o `CaseHub` usa
`neutral` quando não existe contexto.

O scanner de produção bloqueia tokens explícitos de mock/demo. Ainda existem
termos de domínio em integrações e artefatos legados que precisam permanecer
em Domain Packs ou migrações até uma limpeza posterior; eles não são exibidos
pela jornada certificada.

## Jornada Executiva Realizada

`tests/e2e/executive-journey-certification.spec.ts` usa somente a UI, contexto
isolado e dois CSVs gerados como arquivos de entrada. A jornada passou:

1. primeiro acesso e sessão do consultor;
2. criação de grupo, duas empresas e duas unidades;
3. importação de dois arquivos;
4. Biblioteca, configuração e ativação;
5. Dashboard, Financeiro, Comercial, Pessoas, DRE e Diagnóstico;
6. Apresentações, Preparação, Sessão Executiva e Ata;
7. Plano, Histórico, arquivar/restaurar;
8. reload, Dashboard, logout e login;
9. ausência de `pageerror`, `console.error`, `console.warn` e tokens de demo na UI.

Resultado observado: `1 passed` em 17,1 s no teste focado; suíte completa
posterior: `18 passed` em 1,9 min.

## Comparativos

`resolveComparison` formaliza o estado sem comparação: um período, uma empresa,
uma unidade ou lado direito ausente não gera variação nem acessa propriedade de
`undefined`. `VendedoresTab` usa esse estado, e há testes para comparação
completa e parcial.

## Consistência de Dados

| Cadeia | Resultado |
| --- | --- |
| Arquivo -> ActiveDataset | validado na jornada e no fluxo Honda anterior |
| ActiveDataset -> Dashboard | metadata/preview e blocos reais; sem fallback demonstrativo |
| Dashboard -> módulos principais | Financeiro, Comercial, Pessoas e DRE abrem com real/pendente |
| Dashboard -> apresentação/sessão/ata/plano | jornada abre e finaliza; nenhum valor artificial foi injetado |
| Reload -> fonte/contexto | fonte real permanece ativa e login retorna à aplicação |

Reconciliação numérica zero-diferença entre cada métrica da planilha Honda e
todos os artefatos narrativos não foi instrumentada nesta rodada. O contrato
permanente agora existe em `src/core/financial-consistency`, com comparação
exata, diferença por etapa e estado pendente; a integração dos produtores de
narrativa, apresentação, ata e plano ainda não foi concluída. Quando o
mapeamento não existe, o sistema mostra pendência em vez de comparar valores
inventados.

## Validação Técnica

| Verificação | Resultado |
| --- | --- |
| `npm run typecheck` | aprovado após correções |
| testes novos de migração, comparação, capacidade e sanidade | 7/7 aprovados |
| jornada focada F17.1 | 1/1 aprovado; sem erros/warnings do browser |
| `npx vitest run` | 333/333 testes aprovados em 68 arquivos, execução serial em 180,20 s |
| `npm run build` | aprovado; bundle principal 1.845,09 kB, com alerta não bloqueante de chunk > 500 kB |
| `git diff --check` | aprovado |
| Playwright completo | 18/18 aprovados em 1,9 min com 1 worker |

## Performance

Baseline Honda disponível em
[`docs/audits/ENGINE_PERFORMANCE_BASELINE.md`](./ENGINE_PERFORMANCE_BASELINE.md):
21 abas, 38.179 linhas catalogadas, 194.143 fórmulas e 1,8 MB. O maior risco
continua sendo Knowledge Graph, com 1.141.322 arestas e heap aproximado de
874,7 MB de delta. Isso reforça que o processamento completo deve permanecer
fora do browser em produção; o ajuste desta sprint não altera esse limite.

## Itens Restantes

- `DataSourceManager` e `SpreadsheetWorkspaceManager` ainda são adapters
  compatíveis e não podem ser removidos sem migrar consumidores antigos.
- Há componentes legados fora da jornada F8 que ainda calculam visões próprias;
  não foram reescritos nesta sprint.
- O `FinancialConsistencyEngine` foi criado como contrato independente; ainda
  falta conectá-lo aos produtores de narrativa, apresentação, ata e plano para
  a reconciliação automatizada end-to-end.
- O benchmark F8 continua recomendando worker/backend para catálogos grandes.

## Parecer Final

## ❌ REPROVADO

Motivo exato: a jornada executiva e a recuperação passaram, mas a certificação
Enterprise exige também remoção completa dos adapters legados, scanner amplo de
todo vocabulário específico fora de Domain Packs e reconciliação matemática
zero-diferença entre planilha, narrativa, apresentação, plano e ata. Esses três
itens ainda não têm evidência completa nesta rodada. O fluxo demonstrável local
está estável, porém não atende o limiar formal de piloto Enterprise sem ressalvas.
