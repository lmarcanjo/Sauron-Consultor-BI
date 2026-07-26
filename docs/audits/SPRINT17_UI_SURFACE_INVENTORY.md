# Sprint 17 — Inventário da Superfície UX

Data: 2026-07-24

## Critério

O inventário considera a estrutura visível produzida por
`getConsultingFlowStructure` e a resolução canônica de rotas. Componentes que
continuam existindo para renderização interna não são destinos de navegação.

| Item visível | Rota | Responsabilidade | Fonte canônica | Classificação |
| --- | --- | --- | --- | --- |
| Empresas e Grupos | `enterprise_center` | contexto organizacional | `EnterpriseRepository` + `EnterpriseContextStore` | KEEP |
| Projeto de Consultoria | `area_consultor` | áreas e plano do projeto | configuração do projeto | KEEP |
| Modelo Consultivo | `modelo_consultivo` | habilitação de áreas do projeto | configuração do projeto | CONDITIONAL |
| Fontes de Dados | `central_dados` | importar, conectar, ativar, arquivar e consultar fontes | `ImportService`, `WorkbookRepository`, `ActiveDatasetStore` | KEEP |
| Análise da fonte | `analise_estrutura` | profiling, confirmação e campos usados pelos resultados | `ChaosProfilingRepository` + `DatasetView` + `moduleMapping` | KEEP |
| Visão Executiva | `resumo` | visão geral da fonte selecionada | `ExecutiveDashboardEngine` | KEEP |
| Financeiro | `financeiro` | resultado financeiro confirmado | `BusinessIntelligenceEngine` + dashboard engine | CONDITIONAL |
| Comercial | `comercial` | resultado comercial confirmado | BI/dashboard + mapeamento Comercial | CONDITIONAL |
| Pessoas | `comissoes` | pessoas, vendedores e fechamento | BI/dashboard + mapeamento Pessoas/Comissão | CONDITIONAL |
| Anomalias | `obstaculos` | sinais de atenção com dados suficientes | engines existentes | CONDITIONAL |
| Recomendações | `consultor_ia` | recomendações disponíveis para a fonte | saídas confirmadas | CONDITIONAL |
| Apresentações | `apresentacoes` | preparar material executivo | apresentação e snapshots | KEEP |
| Preparação da Reunião | `preparacao_reuniao` | preparar a conversa | preparação existente | KEEP |
| Sessão Executiva | `modo_reuniao` | conduzir a reunião | sessão existente | KEEP |
| Ata e Decisões | `reuniao_ata` | registrar decisões e próximos passos | sessão/ata existentes | KEEP |
| Plano Executivo | `plano_executivo` | acompanhar ações | plano existente | KEEP |
| Histórico | `historico_executivo` | consultar evolução registrada | histórico existente | CONDITIONAL |
| Evolução | `fechamento_mensal` | comparar períodos disponíveis | evolução existente | CONDITIONAL |
| Usuários | `usuarios_twin` | administração autorizada | repositório de identidade | KEEP |
| Organizações | `organizacao_twin` | administração autorizada | repositório organizacional | KEEP |
| Permissões | `permissoes_twin` | administração autorizada | controle de acesso | KEEP |
| Configurações | `perfis` | administração autorizada | preferências e modelo consultivo | KEEP |
| Auditoria | `auditoria_logs` | administração autorizada | auditoria | KEEP |
| Segurança | `admin_security` | administração autorizada | segurança | KEEP |

## Superfícies absorvidas

- `WorkbookLibraryTab` foi absorvida por `CentralDadosTab`; a biblioteca não é
  mais uma tela concorrente.
- `VpnGatewayTab` foi absorvida pela entrada Fontes de Dados; a conexão de
  banco é aberta dentro da Central de Fontes.
- `ReportsPage` deixou de calcular agregações e virou catálogo de resultados
  com estado DISPONÍVEL, REQUER INFORMAÇÃO ou NÃO APLICÁVEL.
- `ModuleFieldMappingPanel` deixou de ser renderizado em Financeiro,
  Comercial, DRE, Pessoas e Fechamento de Comissões. A configuração fica em
  Análise da fonte.

## Destinos internos

Rotas especializadas como DRE, Vendedores, Contábil, Itens, Estoque, Dossiês,
templates e subtelas da reunião continuam registradas somente quando são
necessárias como resultado interno de uma área. Elas não ocupam o menu
principal e não iniciam uma configuração independente.

## Redução observada

| Medida | Antes | Depois |
| --- | ---: | ---: |
| Grupos consultivos visíveis | 9 | 8 |
| Entradas visíveis no fluxo principal | 32 | 24 |
| Telas paralelas de fontes | 3+ | 1 |
| Telas de confirmação de campos | uma por módulo | 1 em Análise da fonte |
| Componentes de tela removidos | — | 2 (`WorkbookLibraryTab`, `VpnGatewayTab`) |
