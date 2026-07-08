# SAURON ARCHITECTURE DECISION LOG (ADR)
## Registro Oficial de Decisões de Arquitetura do Projeto Sauron

Este log documenta as decisões arquiteturais fundamentais tomadas pela equipe sênior do **Sauron**, seus contextos motivadores, decisões tomadas e consequências resultantes para o ecossistema.

---

### Mapeamento dos Registros (ADR)

- **ADR-001**: `DataSourceManager` como Fonte de Ingestão e Validação Única
- **ADR-002**: Desacoplamento Estrito: Componentes React Devem Apenas Renderizar
- **ADR-003**: Segurança Enterprise: Acesso a Bancos de Dados Externos Estritamente Read-Only
- **ADR-004**: Extensibilidade Modular por `PluginEngine` de Segmentos
- **ADR-005**: Gestão Unificada de Estado do Workspace via `ConsultantWorkspaceManager`
- **ADR-006**: Motor de Diagnósticos Baseado em `AnalyticsEngine` 100% Determinístico

---

### Detalhamento das Decisões (ADRs)

#### ADR-001: `DataSourceManager` como Fonte de Ingestão e Validação Única
- **Data**: 2026-06-21
- **Status**: **APROVADO**
- **Contexto**: A plataforma ingere relatórios de fontes variadas. Sem uma barreira central de validação, os motores de cálculo financeiro poderiam processar dados corrompidos ou, pior, exibir simulações fictícias de demonstração misturadas com dados reais corporativos dos clientes da consultoria.
- **Decisão**: Toda e qualquer fonte de dados carregada na aplicação (planilhas carregadas manualmente, conexões diretas ou arquivos CSV) deve passar obrigatoriamente pelas rotinas de registro, limpeza e conferência de hash do `DataSourceManager`. Ele é a autoridade máxima em proveniência de dados.
- **Consequências**:
  - *Positivas*: Segurança de integridade absoluta; impossibilidade física de misturar dados mockados com dados de produção; isolamento de auditoria unificado.
  - *Negativas*: Requer o mapeamento prévio de colunas e colagem estruturada antes que os dados se tornem visíveis nas telas.

#### ADR-002: Desacoplamento Estrito: Componentes React Devem Apenas Renderizar
- **Data**: 2026-06-22
- **Status**: **APROVADO**
- **Contexto**: Em aplicações tradicionais de dashboard, é comum acoplar cálculos matemáticos complexos (médias aritméticas ponderadas, projeções lineares de despesas, validações tributárias) diretamente em manipuladores de eventos em botões ou renderizações de gráficos dentro do React. Isso impede a cobertura por testes unitários e inviabiliza a refatoração do produto.
- **Decisão**: Componentes de UI do React no Sauron devem agir apenas como cascas de apresentação reativas. Qualquer processamento analítico, agregação de dados ou auditoria de logs deve ocorrer inteiramente fora dos arquivos `.tsx`, em engines especialistas ou classes de serviço isoladas.
- **Consequências**:
  - *Positivas*: Altíssima testabilidade de regras usando Vitest; facilidade para portar a UI para outras plataformas (como React Native para mobile); código visual limpo.
  - *Negativas*: Requer a criação de mais arquivos e interfaces de transferência de dados (`types.ts`).

#### ADR-003: Segurança Enterprise: Acesso a Bancos de Dados Externos Estritamente Read-Only
- **Data**: 2026-06-23
- **Status**: **APROVADO**
- **Contexto**: Para alimentar os relatórios, os consultores precisam conectar o Sauron a bancos de ERPs das empresas dos clientes. Qualquer risco ou brecha que permita alterações no banco corporativo inviabilizaria a venda e contratação do software por compliance de segurança das grandes empresas.
- **Decisão**: O Sauron é uma ferramenta estritamente de diagnóstico de leitura e inteligência analítica. O backend Express e seus drivers de conexões são blindados para executar única e exclusivamente queries `SELECT`. Queries que alterem estruturas (`INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`) são rejeitadas de forma ativa e os incidentes são logados na auditoria.
- **Consequências**:
  - *Positivas*: Facilidade extrema de vendas corporativas devido ao baixo risco de segurança; integridade dos dados dos ERPs do cliente blindada de forma definitiva.
  - *Negativas*: Planos de ação tomados na ferramenta não alteram o ERP original de forma direta; o consultor deve imputar conclusões de metas na plataforma Sauron manualmente.

#### ADR-004: Extensibilidade Modular por `PluginEngine` de Segmentos
- **Data**: 2026-06-24
- **Status**: **APROVADO**
- **Contexto**: Diferentes setores de mercado possuem regras e KPIs muito particulares (e.g., concessionárias analisam passagens de oficina, enquanto redes de franquia analisam taxas de royalties e quebra de estoque). Incluir essas rotinas no core financeiro causaria complexidade excessiva e gargalos de manutenção de código.
- **Decisão**: Isolar todas as particularidades de nichos em Plugins independentes carregados pelo `PluginEngine`. O Core do Sauron mantém-se neutro e focado em finanças corporativas transversais (receitas, despesas, caixa e margens globais).
- **Consequências**:
  - *Positivas*: Core do sistema imutável e extremamente limpo; facilidade para criar novos nichos de vendas de software agregados de forma ágil.
  - *Negativas*: Exige maior cuidado na injeção de tipos e no mapeamento de dados brutos para que as colunas setoriais sejam detectadas pelo plugin correspondente.

#### ADR-005: Gestão Unificada de Estado do Workspace via `ConsultantWorkspaceManager`
- **Data**: 2026-06-24
- **Status**: **APROVADO**
- **Contexto**: Perder o projeto em exibição ativa ao recarregar a página acidentalmente no browser quebra a experiência do usuário, especialmente se o consultor estiver no meio de uma apresentação para a diretoria de um cliente.
- **Decisão**: O `ConsultantWorkspaceManager` gerencia de forma unificada as referências de projeto ativo, planos de ação correspondentes e atas de reuniões. A transição e histórico de projetos ativos é persistida de forma automática e reativa no local storage do navegador.
- **Consequências**:
  - *Positivas*: Excelente estabilidade operacional; o consultor retorna exatamente de onde parou em caso de crash do navegador ou recarga involuntária de abas.
  - *Negativas*: Requer rotinas preventivas de migração de dados de schema do local storage ao introduzir novas propriedades em tipos estruturais.

#### ADR-006: Motor de Diagnósticos Baseado em `AnalyticsEngine` 100% Determinístico
- **Data**: 2026-06-25
- **Status**: **APROVADO**
- **Contexto**: A introdução de IA e modelos generativos (como LLMs) causa riscos de alucinações matemáticas absurdas, quebras de sigilo contratual de dados e diagnósticos desconexos que minam a reputação técnica da consultoria.
- **Decisão**: O núcleo analítico do Sauron é inteiramente governado por fórmulas matemáticas determinísticas consolidadas nos motores `TrendEngine`, `AnomalyEngine`, `BenchmarkEngine` e `RecommendationEngine`. A IA generativa só entra na camada de refinamento textual do `NarrativeEngine` para polimento de relatórios executivos finais após a verificação determinística e aprovação do consultor.
- **Consequências**:
  - *Positivas*: Zero risco de alucinação de indicadores financeiros básicos; reprodutibilidade perfeita de diagnósticos matemáticos.
  - *Negativas*: Requer maior esforço inicial de engenharia de software para mapear regras, limites e árvores lógicas de diagnóstico determinísticas na plataforma.
