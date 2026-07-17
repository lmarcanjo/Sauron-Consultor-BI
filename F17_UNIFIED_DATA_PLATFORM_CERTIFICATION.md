# Sauron F17 — Unified Data Platform & Consultant Certification

Data da certificação: 2026-07-15  
Escopo: consolidação do fluxo de dados local, importação real, ativação,
rehidratação e navegação principal.

## Estado Atual

O caminho de planilha validado nesta sprint é:

```text
Arquivo
  -> SimpleSpreadsheetImporter
  -> ImportService
  -> LocalImportService / ApiImportService
  -> WorkbookRepository
  -> IndexedSpreadsheetStorage (metadata + linhas por aba)
  -> DataActivation (prepare / validate / commit)
  -> ActiveDatasetStore
  -> DATASET_ACTIVATED
  -> Dashboard, DRE, Financeiro, Comercial, Pessoas e engines
```

O `ActiveDatasetStore` representa somente o workbook selecionado. Ele mantém
metadata e preview limitado; as linhas completas permanecem no IndexedDB e
são consultadas sob demanda. O estado ativo preserva `sourceDatasetIds` e
`sourceWorkbookIds`, evitando que módulos precisem inferir novamente a origem.

O documento de auditoria do fluxo está em
[`UNIFIED_DATA_FLOW.md`](./UNIFIED_DATA_FLOW.md).

## Bugs Encontrados e Correções

| Problema | Impacto | Correção aplicada | Evidência |
| --- | --- | --- | --- |
| `App.tsx` tinha caminho próprio de leitura XLSX e criava arquivo virtual | Importação pelo cabeçalho podia divergir do modal e substituir estado legado | O cabeçalho encaminha os arquivos ao `SimpleSpreadsheetImporter`; `App.tsx` não parseia mais XLSX | teste arquitetural `unifiedDataFlow.test.ts` |
| `BatchImportReview` mantinha parser/persistência paralelos | Modal e página podiam gerar workbooks diferentes | Componente virou adaptador para o importador compartilhado | suíte Vitest e E2E de importação |
| `DataActivation` materializava todas as linhas e injetava defaults | Consumo elevado de memória e alteração de dados ausentes | Ativação usa metadata e preview limitado; defaults sintéticos foram removidos | teste Honda + reload |
| `ActiveDatasetStore` reidratava todas as linhas no reload | F5 podia bloquear o navegador em planilhas grandes | Reload restaura metadata/preview; linhas são lidas sob demanda do IndexedDB | teste Honda: 14.995 linhas ativas, 5 em preview após reload |
| evento `DATASET_ACTIVATED` era disparado pelo store e novamente pela ativação | Módulos podiam recarregar duas vezes | emissão canônica ficou no `ActiveDatasetStore` | teste arquitetural de evento |
| ID temporário da fila era trocado antes de a fila ser atualizada | Importação externa podia ficar presa como `PROCESSING` | atualização final é atômica, mantendo o ID temporário até a confirmação | E2E active-dataset-reflection |
| corrida entre reidratação do store e persistência do manager | Reload podia apagar metadata ativa | `DataSourceManager.saveToStorage` usa o store como fallback defensivo | E2E de reload |
| `PosVendasTab` apresentava números fixos | Dashboard podia exibir indicadores sem origem real | Componente agora mostra estado vazio/configuração pendente sem números inventados | E2E de estado sem fonte |

## Módulos Legados

| Módulo | Uso atual | Situação | Ação nesta sprint |
| --- | --- | --- | --- |
| `SDLStudio` | Acessado pelo workspace executivo | Ainda é uma tela compatível, fora do pipeline de importação | Mantido; não participa da fonte de dados |
| `WorkspaceDNAEngine` | Usado por `CaseHub` e painéis de caso | Compatibilidade de contexto, não dono de dataset | Mantido sem criar fonte paralela |
| `CompensationEngine` | Usado por People/compensação | Regra de domínio existente, recebe contexto real quando disponível | Mantido; sem dados de demonstração no caminho de importação |
| `EnterpriseDigitalTwinTab` | Menu legado de estrutura empresarial | Consome APIs compatíveis do manager | Mantido como adaptador; não ativa dataset |
| `ExecutiveSession` | Fluxo de reunião e apresentação | Depende do contexto persistido | Mantido; não parseia planilha |
| `StoryEngine` | Narrativas e exportação | Fora da ativação do workbook | Mantido; não é fonte de dados |
| `DataSourceManager` | Compatibilidade para módulos antigos | Ainda possui APIs legadas de registros e filtros | Não é mais dono de importação; migração completa permanece pendente |
| `SpreadsheetWorkspaceManager` | Compatibilidade de workspace | Caminho alternativo legado | Não recebe uploads do fluxo canônico |

Nenhum desses módulos foi removido nesta sprint porque a remoção poderia
quebrar os fluxos executivos existentes. O isolamento foi aplicado no caminho
principal; os limites de compatibilidade continuam explicitados acima.

## UX e Fluxo do Consultor

O fluxo de planilha validado ficou unificado entre o seletor do cabeçalho, a
Central de Dados e a revisão em lote. Todos encaminham para o mesmo
`SimpleSpreadsheetImporter`, que acompanha a fila e ativa pelo mesmo
`DataActivation`.

Estados sem fonte exibem uma mensagem de ausência de dados, em vez de um
dataset de demonstração. Estados sem interpretação suficiente exibem preview
real ou configuração pendente. A importação de arquivo grande mantém a UI
responsiva e informa que o processamento completo deve ocorrer em segundo
plano em produção.

O fluxo completo de criação de empresa, grupo, unidade, configuração,
apresentação e ata não foi certificado nesta execução com a mesma profundidade
da importação e navegação principal. Isso é uma limitação explícita deste
parecer, não uma suposição de sucesso.

## Importação Honda

Arquivo testado:

`/home/natalicorreia/Downloads/Teste_Automação_Peças Honda Faberge Mogi~06.26 Veiculo ativou.xlsx`

Resultado observado no fluxo real:

| Verificação | Resultado |
| --- | --- |
| ativação | concluída |
| fonte ativa | nome do arquivo Honda |
| linhas ativas | 14.995 |
| colunas | 180 |
| preview | 5 linhas reais |
| reload | metadata e preview restaurados |
| estado vazio após reload | não exibido |
| carregamento completo no store | não realizado |

O número de 14.995 corresponde ao dataset ativo da importação validada. O
catálogo completo usado na baseline dos engines possui 21 abas, 38.179 linhas
catalogadas e 194.143 fórmulas; são escopos diferentes e não devem ser
confundidos.

## Consistência e Integridade

- O dataset ativo é definido uma vez por `ActiveDatasetStore`.
- A ativação não injeta grupo, empresa, CNPJ, vendedor, receita ou outros
  valores que não existam na origem.
- O preview renderizado é lido da origem persistida, com limite explícito.
- O `businessViews` usa páginas do IndexedDB para dados de abas.
- A suíte de sanidade impede parser XLSX em `App.tsx` e componentes React e
  impede a reintrodução dos identificadores de demo conhecidos.

Ainda não há evidência nesta sprint de uma reconciliação matemática completa
entre todos os valores da planilha, Dashboard, narrativa, apresentação, plano
e ata. Por isso a certificação de consistência executiva permanece aberta.

## Testes Executados

| Verificação | Resultado |
| --- | --- |
| TypeScript (`npm run typecheck`) | aprovado |
| Vitest | 327 testes aprovados em 64 arquivos |
| Playwright | 17 testes aprovados |
| `git diff --check` | aprovado |
| Build Vite + servidor | aprovado |
| Sanidade anti-parser/anti-demo | aprovado |
| Honda real + reload | aprovado |

A suíte Playwright final cobriu carga inicial, estado sem fonte, navegação
principal, ativação, reload, importação real, importação em lote, proteção
contra duplo clique, timeout controlado para arquivo grande e catálogo do
workbook real.

## Performance

Baseline existente para o workbook Honda de 1,8 MB:

| Engine | Tempo | Heap delta |
| --- | ---: | ---: |
| Workbook Engine | 9.454,4 ms | +192,8 MB |
| Reverse Engineering | 423,3 ms | +26,0 MB |
| Knowledge Graph | 13.961,8 ms | +874,7 MB |
| Rule Engine | 9.942,6 ms | +76,3 MB |
| Business Intelligence | 3.056,2 ms | +490,0 MB |
| Executive Dashboard | 8.239,3 ms | -524,4 MB |

Essa baseline confirma que o processamento completo dos engines não deve ser
executado no navegador em produção. O caminho de importação local foi
limitado a metadata/preview no store, mas `DataSourceManager` ainda mantém
APIs de compatibilidade e o serviço de consolidação pode fazer leituras
transitórias de páginas para métricas de contexto. Worker/backend e cache por
aba continuam necessários antes de uma certificação online plena.

## Itens Restantes

1. Remover ou encapsular definitivamente os identificadores históricos de
   compatibilidade relacionados a demo/mocks em migrações e diagnósticos.
2. Mover vocabulário específico de segmentos para Domain Packs; ainda existem
   mapas de terminologia em `BusinessDomainEngine` e no classificador de
   workspace.
3. Completar a migração dos consumidores de `DataSourceManager` para páginas
   do dataset ativo.
4. Certificar todos os cenários F17 de empresa, grupo, unidade, permissões,
   logout/login, arquivamento, restauração, exclusão, comparativo e fechamento
   do navegador.
5. Executar reconciliação matemática zero-diferença entre todos os artefatos
   executivos.
6. Reduzir chunks de produção acima de 500 kB e eliminar o warning de
   `vi.mock("pg")` aninhado no teste existente.

## Parecer Final

## ❌ Reprovado

A consolidação do caminho principal de importação e ativação foi validada com
sucesso, inclusive com a planilha Honda real, reload e 17 cenários Playwright.
Entretanto, a Sprint F17 exige zero resíduos de domínio no Core, zero
duplicidade completa, certificação de todos os fluxos do consultor e
consistência matemática entre todos os artefatos. Ainda há fronteiras legadas,
vocabulário de domínio fora dos Domain Packs e cenários executivos não
certificados nesta rodada. O produto está apto para a demonstração do fluxo
de importação local, mas não para declarar certificação Enterprise F17
completa.
