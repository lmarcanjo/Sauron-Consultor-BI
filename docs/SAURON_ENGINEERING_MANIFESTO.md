# SAURON ENGINEERING MANIFESTO
## A Constituição Técnica e Estratégica da Plataforma Sauron

---

### 1. Visão do Produto
O **Sauron** é uma plataforma operacional de consultoria corporativa de nível enterprise, desenhada para se transformar em um produto SaaS altamente escalável, robusto e modular. O foco do Sauron é capacitar consultores de negócios com inteligência analítica profunda, integrando dados financeiros, operacionais e mercadológicos em diagnósticos precisos, planos de ação robustos, apresentações e reuniões operacionais de alto impacto.

---

### 2. O que o Sauron É
- Um **Operating System para Consultores**: Um ambiente centralizado para gerenciar múltiplos projetos de consultoria estruturados.
- Um **Motor Analítico Determinístico**: Um sistema focado em consistência de dados, que traduz KPIs, DREs e transações brutas em diagnósticos e recomendações técnicas claras de negócios.
- Uma **Plataforma Extensível por Plugins**: Um ecossistema modular onde regras específicas de segmentos de mercado (e.g., concessionárias de veículos, varejo, manufatura) são isoladas em plugins.
- Um **Software de Classe Enterprise**: Uma arquitetura robusta, totalmente tipada em TypeScript, coberta por testes, auditável e com linhagem de dados clara.

---

### 3. O que o Sauron NÃO É
- **Não é um simples dashboard ou ferramenta de BI descartável**: O Sauron não foi feito para exibir gráficos soltos e desconexos ou mockar métricas arbitrárias.
- **Não é uma ferramenta de "Tech-Larping" ou "AI Slop"**: Não exibimos logs falsos de terminal, pings fictícios de rede ou dados de telemetria desnecessários que não geram valor de negócios real para o consultor ou seu cliente.
- **Não é um gerador de apresentações aleatórias**: O Presentation Studio do Sauron constrói materiais diretamente conectados aos dados e diagnósticos validados pelo consultor.
- **Não é uma ferramenta de manipulação de dados destrutiva**: O Sauron atua como uma ferramenta analítica de leitura e governança, preservando as fontes transacionais originais.

---

### 4. Princípios Arquiteturais
- **Separação Estrita de Responsabilidades**:
  - **Visual (React)**: Responsável exclusivamente por renderizar dados, emitir ações de usuário e gerenciar transições suaves de estado de UI. Totalmente livre de regras de negócios complexas.
  - **Motores (Engines)**: Lógica computacional purista e puramente funcional. Não dependem do React ou de estados voláteis da UI.
  - **Gerenciadores (Managers)**: Orquestradores de estado e persistência local/em nuvem.
- **Não Duplicação de Estado**: O estado operacional ou financeiro deve ter uma única fonte de verdade confiável.
- **Robustez de Tipagem**: Proibido o uso indiscriminado de `any`. Toda entidade relevante deve ser modelada com interfaces fortemente tipadas.
- **Orientação a Testes (TDD / Test-Driven)**: Cada engine ou serviço crítico deve conter testes unitários determinísticos automatizados em Vitest.

---

### 5. Core Engines
Os **Core Engines** formam a fundação computacional do Sauron e operam de forma totalmente isolada das tecnologias de UI:
- **BusinessEngine**: Executa as regras de negócios gerais e fórmulas financeiras (DRE, Margem Operacional, EBITDA, etc.).
- **DataEngine**: Cuida da ingestão, processamento de snapshots, qualidade de dados e data lineage de planilhas e integrações de banco de dados.
- **AnalyticsEngine**: Orquestra diagnósticos consolidados a partir de sub-engines dedicados (`TrendEngine`, `AnomalyEngine`, `BenchmarkEngine`, `RecommendationEngine`, `NarrativeEngine`).
- **PluginEngine**: Gerencia o ciclo de vida e a injeção de regras de negócios específicas de segmentos industriais.
- **SecurityEngine & AuditEngine**: Fornecem camadas de validação, segurança contra injeção e gravação detalhada de histórico operacional.

---

### 6. Managers e Services
- **ConsultantWorkspaceManager**: Centraliza a navegação, histórico, planos de ação, atas de reuniões e configurações do projeto ativo do consultor.
- **PresentationManager**: Orquestra os slides estruturados de reuniões e assembleias a partir de KPIs analíticos consolidados.
- **ClientFilterManager**: Garante o isolamento e aplicação precisa de contextos (empresa, CNPJ, marcas, centros de custo) de forma segura.

---

### 7. Consultant Workspace
O **Consultant Workspace** é o coração da operação do consultor no Sauron.
- Ele unifica o ciclo de vida do cliente sob a entidade `WorkspaceProject`.
- Permite gerenciar fontes de dados vinculadas (planilhas, credenciais de banco de dados read-only), filtros de contexto persistentes, reuniões integradas (`Meeting`) e planos de ação operacionais (`ActionPlan`).
- O projeto ativo (`activeProjectId`) é persistido localmente via `localStorage` de forma transparente, permitindo a restauração imediata do workspace após um reload involuntário da página.

---

### 8. Data Governance
- Toda alteração nas estruturas ou no catálogo de dados deve ser devidamente logada.
- O Sauron garante que dados brutos importados não sofram "contaminações silenciosas".
- Cada snapshot ou lote de dados carregado possui metadados associados contendo a origem exata do dado, volume de linhas, data de ingestão e hash de integridade.

---

### 9. Data Source Manager
- O `DataSourceManager` controla o registro de conexões com bancos de dados de ERPs e arquivos Excel/CSV importados.
- Ele valida os formatos esperados, realiza o parse e limpa os dados brutos de forma segura.
- Oferece proteção estrita contra falhas de conexão de VPNs e credenciais incompletas.

---

### 10. Regras de DEMO_DATA versus Dados Reais
- **Isolamento de Demonstrações**: Dados demonstrativos (`DEMO_DATA`) devem residir estritamente na camada de demonstração de dados (`src/data/demoData.ts`).
- **Proibição de Misturas**: Jamais misture lógicas de dados mockados com fontes reais de importação de planilhas ou de banco de dados do cliente.
- **Sem Fallbacks Ocultos**: Se uma fonte real falhar ou estiver vazia, o sistema deve emitir um alerta visual nítido sobre o erro de dados em vez de falhar silenciosamente com mockages substitutas no motor principal.

---

### 11. Segurança de Banco Read-Only
- O acesso do Sauron a bancos de dados externos de clientes (e.g., PostgreSQL, SQL Server via conexões diretas ou VPNs) é estruturado de forma **estritamente read-only**.
- É **expressamente proibido** gerar, compilar ou aceitar a execução de queries SQL destrutivas (DML/DDL como `INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`).
- Todas as queries devem passar por validações severas de nomes de tabelas, identificadores e prevenção ativa contra injeções de SQL no backend.

---

### 12. Importação de Planilhas
- O sistema aceita a importação de planilhas financeiras estruturadas (XLSX, CSV) com mapeamento flexível de colunas.
- O mapeamento é persistido em um perfil de importação (`WorkspaceImportProfile`) no projeto ativo para automatizar as próximas importações das mesmas fontes.
- Linhas com erros de parse ou formatações inconsistentes são isoladas e reportadas ao consultor, sem interromper ou quebrar o processo geral de ingestão.

---

### 13. Data Lineage (Linhagem de Dados)
- O Sauron rastreia a origem de cada indicador ou dado contido em uma apresentação ou gráfico.
- É possível rastrear um KPI exibido em um slide de reunião de volta até o lote da planilha importada ou snapshot do banco de dados correspondente.
- Isso assegura a confiabilidade total dos diagnósticos perante o cliente final do consultor.

---

### 14. Analytics Engine
O motor analítico atua em alto nível utilizando inteligência analítica de negócios por meio de engines especialistas puramente funcionais:
- **TrendEngine**: Executa cálculos precisos de variações percentuais ($((Atual - Anterior) / Anterior) \times 100$) e absolutas, analisando estabilidade, crescimento e retrações anuais, trimestrais e mensais.
- **AnomalyEngine**: Identifica anomalias de custos crescendo mais rápido do que receitas, lojas com margem negativa crônica, ou contas contábeis sem movimentação.
- **BenchmarkEngine**: Compara e ranqueia filiais, vendedores, marcas ou centros de custo, extraindo o melhor/pior desempenho, distância em relação à média geral do grupo econômico e identificando outliers estatísticos.
- **RecommendationEngine**: Converte desvios (como queda drástica de margem e aumento de despesas administrativas) em recomendações prescritivas precisas de otimização de contratos e estoques de giro.
- **NarrativeEngine**: Converte todos os diagnósticos técnicos em uma síntese de narrativa executiva didática em português fluído, perfeita para consumo direto por presidentes e diretores de empresas.

---

### 15. Presentation Studio
- O Presentation Studio permite ao consultor criar slides de apresentações baseados nas análises determinísticas geradas pela plataforma.
- Ele monta de forma automática blocos dinâmicos para a apresentação, contendo o resumo executivo, alertas de anomalias críticas, rankings de benchmarks e o plano de ação sugerido.
- O consultor pode associar notas, observações operacionais e atas de decisões diretamente ao histórico de cada apresentação realizada (`Meeting`).

---

### 16. Plugin Engine e Segmentos de Mercado
- Lógicas e KPIs de setores específicos (e.g., Margem de Peças Balcão e Passagem de Oficina para Concessionárias de Veículos) são isolados e implementados exclusivamente via **Plugins**.
- O Core do Sauron mantém-se neutro e focado em finanças corporativas transversais (receitas, despesas, caixa e margens globais).
- O `PluginEngine` é encarregado de ler o segmento do projeto ativo e carregar de forma transparente as validações de KPIs e dashboards específicos para aquela indústria.

---

### 17. Padrões de TypeScript
- **Forte Tipagem**: Evitar o tipo `any` sempre que possível. Prefira o uso de tipos e interfaces explícitos e bem segmentados.
- **Enumerações**: Usar apenas `enum` padrão e explícito. Nunca utilizar `const enum`.
- **Imports de Tipos**: Declarar imports de tipos e valores no topo do arquivo. Nunca use `import type` para importar valores de enums ou construtores de classe, pois isso causa quebras na transpilação.

---

### 18. Padrões de React
- **Responsabilidade Visual**: Componentes devem apenas renderizar a interface de usuário baseada nas propriedades recebidas ou do estado local mínimo de interação.
- **Nenhum Cálculo no Componente**: Cálculos complexos, filtragem profunda de dados analíticos ou disparos de eventos de auditoria devem residir inteiramente em suas respectivas classes de serviço ou engines e serem consumidos via custom hooks ou injeções de serviços.
- **Prevenção de Re-renders Infinitos**: Evite arrays de dependências em `useEffect` baseados em referências não primitivas que se recriam a cada render. Estabilize funções e objetos usando `useCallback`, `useMemo` ou referências primitivas nítidas.
- **Icons**: Utilize única e exclusivamente ícones provenientes da biblioteca `lucide-react`.

---

### 19. Padrões de Testes
- Todos os testes unitários e de integração são executados através do **Vitest**.
- Arquivos de teste devem ser localizados adjacentes aos seus módulos correspondentes (utilizando o sufixo `.test.ts`).
- É mandatória a simulação (mock) do `localStorage` ou variáveis globais de ambiente se o código sob teste depender do browser.
- Todo novo engine analítico ou de negócios deve possuir um arquivo de testes contendo validações para cobrir cenários normais e limites de erros de cálculo.

---

### 20. Padrões de Documentação
- Toda alteração estrutural no Sauron deve vir acompanhada da atualização correspondente na pasta `/docs`.
- A arquitetura, diagramas de dados e fluxos de processos de cada módulo devem ser descritos de forma objetiva, didática e clara em arquivos Markdown (`.md`).

---

### 21. Regras de UX (Interface do Usuário)
- **Tema de Alta Elegância**: O Sauron prioriza um tema limpo, baseado em contrastes elegantes (tons de grafite, cinza neutro profundo, off-whites e acentos de cores de status nítidas).
- **Sem Clutter ou Slop**: Evitar layouts poluídos com "telemetria larping". A interface deve ser focada em informações executivas limpas e humanizadas.
- **Targets Confortáveis**: Botões e alvos de cliques devem possuir tamanho adequado para toques e visualizações tanto em desktops quanto em tablets de consultores em campo (mínimo de 44px).
- **Consistência de Espaçamento**: Utilize regras claras de margens e preenchimentos baseadas nas escalas padrão do Tailwind CSS, aplicando ritmo visual dinâmico com variações estéticas propositais.

---

### 22. Regras para Futuras Sprints
- Proteja sempre a arquitetura existente antes de programar novas features.
- Reutilize engines e classes gerenciadoras instaladas em vez de recriar estruturas ou acoplar rotinas de negócios em componentes React novos.
- Nunca adicione bibliotecas externas ou modifique pacotes críticos do `package.json` sem necessidade técnica justificada pelo escopo da tarefa.

---

### 23. Critérios de Aceite para Conclusão de Sprints
Uma sprint é considerada estritamente concluída sob os seguintes critérios:
1. O código compila sem erros via `npm run build` ou `compile_applet`.
2. O linter é executado sem erros ou avisos graves via `npm run lint` ou `lint_applet`.
3. Todos os testes unitários e de integração existentes passam com sucesso.
4. Nenhuma referência residual de debug ou declaração incompleta de tipos (`TODO`, `any`) permanece em código de produção.
5. A documentação relacionada na pasta `docs/` foi devidamente atualizada ou criada.

---

### 24. Roadmap Arquitetural
- **Fase 1 (Sprints Delta & Épsilon)**: Consolidação dos motores locais, persistência robusta do workspace, lógica purista determinística dos engines de análise, e auditoria geral integrada.
- **Fase 2 (Sprints Futuras)**: Integração com provedores em nuvem resilientes (Firestore, Cloud SQL) para sincronização de múltiplos dispositivos e compartilhamento em tempo real.
- **Fase 3 (Sprints de IA Avançada)**: Acoplamento seguro de LLMs baseados na Google Gemini API para enriquecer e personalizar o NarrativeEngine, mantendo o controle determinístico de integridade dos números no Core.

---

### 25. Checklist de Qualidade Antes de Merge
- [ ] O código introduzido foi 100% tipado?
- [ ] O `compile_applet` e o `lint_applet` foram rodados com sucesso?
- [ ] Todos os novos testes unitários foram validados de forma bem-sucedida?
- [ ] O `Math.random()` foi estritamente evitado fora do arquivo de dados demonstrativos (`demoData.ts`)?
- [ ] O manifesto de metadados (`metadata.json`) ou os exemplos de variáveis de ambiente (`.env.example`) foram mantidos atualizados se necessário?
- [ ] Não há códigos ou comportamentos mockados inseridos nas rotinas reais de importação de banco de dados e planilhas?
- [ ] O design do produto se mantém limpo, executivo, profissional e sem poluições de telemetria desnecessárias?
