# Project Reality Audit

Data: 2026-07-04

Objetivo: separar o Sauron que sustenta dados reais do Sauron que ainda funciona como demonstrador. Esta auditoria percorreu `src`, `tests`, `docs`, os fluxos de importação e os módulos críticos de DRE, Pessoas, Comercial, Financeiro e Central de Dados.

## Classificação Executiva

| Arquivo / grupo | Função | Importância | Risco | Ação recomendada |
|---|---|---:|---|---|
| `src/components/spreadsheet/SimpleSpreadsheetImporter.tsx` | Entrada local de workbook, detecção de abas, parsing e ativação | Essencial agora | Alto: se carregar tudo em React derruba navegador/produção | Manter como fallback local; migrar parsing pesado para backend/worker |
| `src/core/data/ActiveDatasetStore.ts` | Fonte oficial do dataset ativo e eventos | Essencial agora | Alto: estado global pode divergir de `DataSourceManager` | Manter singleton; limitar a metadados + preview; nunca armazenar workbook completo |
| `src/core/storage/IndexedSpreadsheetStorage.ts` | Persistência local paginável por aba | Essencial agora | Médio: IndexedDB não substitui storage/banco de produção | Manter fallback local; backend deve assumir produção |
| `src/core/data/DataSourceManager.ts` | Bridge legado de fonte ativa, workspace e registros | Essencial agora / dívida | Alto: ainda contém acesso a `demoData` e compatibilidade antiga | Isolar demo em rota interna; reduzir responsabilidade após ActiveDataset virar fonte única |
| `src/App.tsx` | Orquestra navegação, filtros e renderização de módulos | Essencial agora / muito grande | Alto: concentra regras de dados, UI e fonte ativa | Manter correções mínimas; depois fatiar em rotas/contextos |
| `src/components/ActiveDatasetRawPreview.tsx` | Prova visual do dataset real ativo por aba | Essencial agora | Baixo: depende de IndexedDB local | Manter; trocar origem para API paginada em produção |
| `src/components/CentralDadosTab.tsx` | Central de fontes e importação | Essencial agora | Alto: ainda há opções e textos demo no arquivo | Manter importação real; ocultar/remover demo do fluxo normal |
| `src/components/pages/DashboardPage.tsx` | Dashboard resumo | Essencial agora | Médio: gráficos dependem de campos financeiros canônicos | Mostrar dados reais ou pendente; nunca inventar |
| `src/components/IntelligentDRETab.tsx` | DRE analítica | Essencial agora | Alto: DRE errada causa decisão errada | Exigir mapeamento explícito: receita, custo/despesa/imposto, período |
| `src/components/PeopleIntelligenceTab.tsx` | Pessoas, vendedores e performance | Essencial agora | Alto: usava dossiês demo se não detectasse configuração | Detectar colunas reais de pessoas; listar reais; pendente quando ausente |
| `src/components/VendedoresTab.tsx` | Ranking/detalhe de vendedores | Essencial agora | Alto: antes tinha lista fictícia de vendedores | Usar vendedores reais do dataset ou pendente |
| `src/components/ComercialTab.tsx` | Comercial/vendas | Essencial agora | Alto: cálculos sintéticos se liberado sem mapeamento | Manter pendente até mapear produto/peça/venda/vendedor/cliente |
| `src/components/FinanceiroTab.tsx` | Financeiro/recebíveis | Essencial agora | Alto: métricas hardcoded se liberado sem mapeamento | Manter pendente até mapear valores, custos, datas e margens |
| `src/components/PecasTab.tsx` | Peças | Essencial agora | Alto: continha giro/SKUs fixos | Bloquear com pendente enquanto não houver engine de peças |
| `src/components/PosVendasTab.tsx` | Oficina/pós-vendas | Futuro próximo | Alto: mecânicos/OS fictícios | Bloquear com pendente para dataset real |
| `src/components/EstoqueTab.tsx` | Estoque | Futuro próximo | Alto: ageing e valores simulados | Bloquear com pendente para dataset real |
| `src/components/ComissoesTab.tsx` | Regras de comissão | Essencial depois de Pessoas | Alto: remuneração não pode ser simulada | Bloquear com pendente para dataset real até regra formal |
| `src/data/demoData.ts` | Gerador oficial de dados demo | Mock/demo | Alto se acessível no fluxo principal | Manter apenas para rota interna `/__internal/demo` ou remover de produção |
| `src/core/data/moduleDataRequirements.ts` | Detecção mínima de colunas por módulo | Essencial agora | Baixo: heurístico, não substitui mapeamento | Usar como barreira provisória; evoluir para perfil de importação |
| `src/workers/spreadsheetParser.worker.ts` | Worker browser existente | Futuro/não prioritário | Médio: ainda processa no cliente | Referência para worker backend, não solução final |
| `src/components/DatabaseConnector.tsx` / `VpnGatewayTab.tsx` | Conexões banco/VPN | Futuro | Médio: parte simulatória | Separar demo de conexão real; não misturar com planilha |
| `src/core/backend-bootstrap/*` | Bootstrap backend/testes | Futuro prioritário | Médio | Usar como base para jobs reais de importação |
| `src/core/persistence/*` | API/offline/snapshot | Futuro | Médio | Reaproveitar para metadados e status de jobs |
| `src/core/compensation/*` | Motor de remuneração | Futuro prioritário | Médio | Conectar somente após mapear comissão real |
| `src/core/analytics/*` | Engines analíticas | Futuro | Médio | Alimentar apenas com views normalizadas reais |
| `src/core/story/*`, `ExecutiveStoryTab.tsx`, apresentações | Futuro/não prioritário | Médio | Não mexer até dados reais dos módulos estabilizarem |
| `src/modules/consultant-workspace/*`, `ExecutiveWorkspace.tsx` | Workspace consultivo | Legado/duplicado parcial | Alto: contém narrativa demo no home | Não renderizar com dataset real até consumir ActiveDataset |
| `src/core/identity/*`, digital twin | Futuro/não prioritário | Médio: nomes demo Topázio/Alpha | Separar ambiente demo de ambiente real |
| `src/sauron-sdk/*`, `src/design-system/*` | UI/design system | Essencial infra | Baixo | Manter; não misturar dados de negócio |
| `tests/fixtures/spreadsheets/*` | CSVs de teste | Mock/demo | Baixo fora produção | Manter para testes, mas nomes fictícios não devem aparecer no fluxo real |
| `tests/e2e/*`, `*.test.ts` | Validação automatizada | Essencial qualidade | Médio: alguns testes esperam demo | Atualizar para cenário real/pending |

## Duplicações e Dívidas

| Tema | Onde aparece | Risco | Decisão |
|---|---|---|---|
| Fonte ativa duplicada | `ActiveDatasetStore`, `DataSourceManager`, workspace files | Estado inconsistente | `ActiveDatasetStore` deve ser fonte oficial; `DataSourceManager` vira adaptador |
| Importação duplicada | Importador simples, upload legado em `App.tsx`, workspace manager | Dupla ingestão | Manter só `SimpleSpreadsheetImporter` no fluxo normal |
| Demo em produção | `demoData.ts`, identidade Topázio/Alpha, ExecutiveWorkspace | Contaminação visual | Demo somente em rota explícita interna |
| Módulos com cálculos de vitrine | Comercial, Financeiro, Peças, Pós-vendas, Estoque, Comissões | Decisão errada | Mostrar pendente até mapeamento/engine real |
| Processamento no navegador | `SimpleSpreadsheetImporter`, worker browser, IndexedDB | Queda online | Backend job assíncrono obrigatório |

## Ações Imediatas Aplicadas

- Home mostra `ActiveDatasetRawPreview` e não renderiza `ExecutiveWorkspace` demo quando há dataset real.
- `SimpleSpreadsheetImporter` mantém somente metadados + preview em React; dados completos ficam pagináveis.
- Pessoas/Vendedores deixam de usar lista fictícia quando há dataset real.
- Peças, Pós-vendas, Estoque e Comissões ficam em “Configuração pendente” com dataset real.
- Barra de contexto deixa de exibir cliente fictício fixo quando há planilha ativa.

