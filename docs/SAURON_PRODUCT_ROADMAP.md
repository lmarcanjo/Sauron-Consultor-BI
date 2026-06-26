# SAURON PRODUCT ROADMAP
## O Planejamento Estratégico de Evolução da Plataforma

---

### 1. Visão de Produto
O **Sauron** é uma plataforma operacional de consultoria empresarial assistida por inteligência analítica profunda. Ele foi desenhado para atuar como o sistema operacional oficial do consultor de negócios. 

**O Sauron não é apenas um BI, um dashboard solto ou uma mera ferramenta de relatórios de uso pontual.** Ele é uma plataforma de governança de dados, inteligência consultiva determinística e planejamento estratégico que transforma transações brutas em decisões acionáveis e apresentações executivas auditáveis.

---

### 2. Posicionamento
O Sauron se posiciona estrategicamente no mercado B2B como:
- **Plataforma de Consultoria de Nível Enterprise**: Centraliza toda a jornada e metodologias da consultoria em um único fluxo de trabalho unificado.
- **Consultant Workspace**: Espaço de trabalho digital inteligente onde o consultor gerencia múltiplos projetos, clientes, filiais e planos de ação.
- **Motor de Análise Empresarial Avançado**: Substitui planilhas fragmentadas por motores determinísticos capazes de isolar anomalias, tendências e comparar a performance real do negócio.
- **Gerador de Apresentações Executivas Integrado**: Reduz o tempo de preparação de reuniões de fechamento de dias para minutos, garantindo rastreabilidade do dado.
- **Sistema de Governança de Dados**: Oferece uma infraestrutura resiliente de ingestão protegida de banco de dados e planilhas, mantendo integridade e auditoria.
- **Base Futura para AI Advisor**: Arquitetura pronta para acoplar Large Language Models (LLMs) de forma segura sobre diagnósticos numéricos determinísticos já validados.

---

### 3. Público-Alvo
- **Consultores Independentes e Empresas de Consultoria**: Focadas em finanças, controladoria, reestruturação e produtividade.
- **Controladores e Diretores de Finanças (CFOs)**: Que gerenciam holding de multiempresas.
- **Redes de Varejo e Franquias**: Necessitando comparar filiais, marcas e vendedores de forma padronizada.
- **Concessionárias e Redes de Distribuição**: Com métricas operacionais muito específicas por departamento.
- **Agroindústrias e Indústrias de Manufatura**: Com alta complexidade de centros de custo.

---

### 4. Proposta de Valor
A proposta de valor do Sauron centra-se em capacitar o consultor a:
1. **Importar Dados com Facilidade**: Via planilhas (mapeadas uma única vez) ou conexões diretas seguras com bancos de ERPs.
2. **Organizar e Padronizar a Informação**: Consolidando dados de diferentes origens em formatos homogêneos (DRE, KPIs, Balanço).
3. **Analisar com Precisão Técnica**: Aplicando motores que detectam oscilações de margem, faturamento e desvios de despesas operacionais de forma autônoma.
4. **Identificar Alertas e Anomalias**: Antecipando pontos críticos e despesas fora do padrão antes da reunião de resultados.
5. **Gerar Recomendações Prescritivas**: Associando causas prováveis e planos de ação técnicos aos desvios numéricos.
6. **Preparar Reuniões de Fechamento**: Criando slides estruturados baseados nas informações reais.
7. **Conduzir Apresentações com "Data Lineage"**: Demonstrando a origem exata de cada número apresentado na tela em tempo real, gerando confiança absoluta para o cliente final.
8. **Acompanhar a Execução**: Controlando metas, atas e prazos de planos de ação decorrentes das decisões tomadas.

---

### 5. Releases

```
┌────────────────────────────────────────────────────────┐
│               Sauron Evolution Timeline                │
├─────────────┬─────────────┬─────────────┬──────────────┤
│    v0.5     │    v0.6     │    v0.7     │ v0.8 a v1.0  │
│    Core     │  Workspace  │Presentation │Intelligence  │
│ (CONCLUÍDO) │(EM ANDAMEN.)│  (PRÓXIMO)  │   & SaaS     │
└─────────────┴─────────────┴─────────────┴──────────────┘
```

#### v0.5 — Core Infrastructure (Status: Concluída)
- **Objetivo**: Estabelecer as bases técnicas, motores de cálculo puristas e a estrutura inicial de arquivos e rotas.
- **Principais Módulos**:
  - Core Engines (`BusinessEngine`, `DataEngine`, `SecurityEngine`, `AuditEngine`, `PluginEngine`).
  - `DataSourceManager` e ingestão segura de planilhas locais.
  - `DatabaseConnectionManager` robusto e conexões simuladas de banco de dados.
  - Workspace inicial do consultor focado em projetos e visualizações piloto.

#### v0.6 — Consultant Platform (Status: Em Andamento / Sprint Atual)
- **Objetivo**: Transformar o Sauron em um ambiente de trabalho operacional completo.
- **Principais Módulos**:
  - `ConsultantWorkspaceManager` expandido, controlando projetos persistentes.
  - Armazenamento com versionamento de schema no local storage.
  - Isolamento de filtros contextuais complexos por projeto ativo (empresa, CNPJ, marcas, período).
  - Lógica e fluxo para registrar reuniões (`Meeting`) e persistência de planos de ação (`ActionPlan`).

#### v0.7 — Presentation Studio (Objetivo: Próxima Release)
- **Objetivo**: Permitir que os achados e análises se transformem em apresentações executivas.
- **Principais Módulos**:
  - **Story Builder**: Interface para ordenação de slides analíticos de fechamento.
  - Biblioteca rica de gráficos nativos alimentados pelo `DataEngine`.
  - Slides dotados de rastreabilidade completa ("Data Lineage") voltando às planilhas originais.
  - **Modo Reunião**: Interface imersiva para o consultor projetar os slides, colher observações de atas e registrar pendências em tempo real.

#### v0.8 — Intelligence Layer (Objetivo: Planejado)
- **Objetivo**: Fornecer análises determinísticas maduras e pavimentar o Advisor inteligente.
- **Principais Módulos**:
  - `AnalyticsEngine` avançado integrando sub-motores refinados (`TrendEngine`, `AnomalyEngine`, `BenchmarkEngine`, `RecommendationEngine`, `NarrativeEngine`).
  - Geração de diagnósticos específicos do segmento parametrizados via PluginEngine.
  - Narrativa executiva automatizada em linguagem natural determinística (sem IA).
  - Infraestrutura de segurança pronta para receber o primeiro AI Advisor via APIs.

#### v0.9 — SaaS Foundation (Objetivo: Planejado)
- **Objetivo**: Converter a arquitetura standalone para um modelo multi-tenant escalável.
- **Principais Módulos**:
  - Multi-tenant nativo com isolamento rigoroso de bases de dados.
  - Autenticação federada e controle fino de permissões de usuários (Consultores vs. Clientes Finais).
  - Backend integrado em nuvem (Sincronização com Cloud Run, Firestore ou Cloud SQL).
  - Event Bus centralizado e Feature Flags nativas no sistema.

#### v1.0 — First Client Release (Objetivo: Planejado)
- **Objetivo**: Versão madura para implantação em clientes piloto.
- **Principais Módulos**:
  - Onboarding automatizado para novos consultores e escritórios de consultoria.
  - Ciclo completo estável: Ingestão de dados -> Diagnóstico Autônomo -> Apresentação Executiva -> Reunião Operacional -> Plano de Ação em Execução.
  - Segurança enterprise certificada, auditoria integral de acessos, e APIs públicas.

---

### 6. Critérios de Pronto (Definition of Done) por Release

| Release | Critérios Técnicos | Critérios de Produto | Critérios de QA & Aceite |
| :--- | :--- | :--- | :--- |
| **v0.5** | Código tipado sem `any`; sem `Math.random` em lógicas centrais. | Telas piloto funcionais carregando dados corretamente. | Build limpo; testes unitários cobrindo cálculos financeiros críticos. |
| **v0.6** | Persistência resiliente de projetos; versionamento do schema local. | Consultor cria, edita, arquiva e muda entre múltiplos projetos sem perder dados. | Testes em Vitest cobrindo o `ConsultantWorkspaceManager`. |
| **v0.7** | Renderização sem gargalos do modo de projeção; rastreamento reativo dos KPIs. | Fluxo para montar e ordenar slides e fechar a ata em reuniões integrado. | Cobertura de testes na montagem e seleção dos blocos de slides. |
| **v0.8** | Motores analíticos desacoplados de UI; zero IA generativa nos cálculos. | Narrativa fluída e didática em português; diagnósticos precisos por segmento. | Testes complexos de cenário de estresse financeiro simulando desvios. |
| **v0.9** | Integração segura com bancos de nuvem; tabelas multi-tenant protegidas. | Convite de usuários com diferentes papéis operacionais. | Testes de integração de segurança; auditoria de chamadas de API. |
| **v1.0** | Infraestrutura com alta performance, baixo consumo de cold starts. | Onboarding intuitivo; exportação profissional em PDF/Planilhas. | Validação ponta a ponta com um cliente piloto real em ambiente de produção. |

---

### 7. Riscos Estratégicos e Mitigações
1. **Contaminação de Relatórios por Dados Demo**:
   - *Risco*: Dados do demonstrativo corporativo vazarem ou se misturarem com planilhas de clientes reais.
   - *Mitigação*: Barreira de isolamento físico no `DataSourceManager` lançando erros críticos em auditoria se dados mockados forem identificados em transações sob contextos de dados reais.
2. **Acoplamento entre UI e Regras de Negócio**:
   - *Risco*: Perda de manutenibilidade ao longo de novas sprints.
   - *Mitigação*: Auditorias contínuas de linter e revisões do manifesto de desenvolvimento impedindo cálculos de margem ou diagnósticos acoplados em componentes React.
3. **Ausência de Multi-Tenant Inicial**:
   - *Risco*: Vazamento acidental de dados de clientes entre diferentes consultores após migração para nuvem.
   - *Mitigação*: Planejar a persistência do `WorkspaceProject` desde o primeiro dia com identificadores claros do criador e da organização proprietária.

---

### 8. Roadmap Arquitetural Técnico
- **SauronEventBus**: Barramento de eventos desacoplado para notificações internas reativas (e.g., "DRE importada com sucesso" -> "Disparar recálculo do AnalyticsEngine").
- **FeatureFlagManager**: Controle de liberação progressiva de ferramentas novas (como modo reunião avançado ou relatórios customizados).
- **Multi-Tenant Core**: Configuração estruturada da infraestrutura de dados para segregação segura a nível de banco de dados e aplicação.
- **AI Advisor Gateway**: Gateway específico e isolado no backend com controle rígido de tokens para interagir com a API do Google Gemini, enriquecendo as análises determinísticas validadas.

---

### 9. Priorização
```
┌──────────────────────────────────────────────────────────────────┐
│   1. Confiabilidade dos Dados (Qualidade & Lineage)              │
│   2. Workspace Operacional do Consultor (Projetos & Ações)       │
│   3. Apresentações e Fechamento Executivo (Story Builder & Atas) │
│   4. Analytics Consultivo Determinístico                         │
│   5. Governança e Auditoria Rigorosa                             │
│   6. SaaS Scalability & Multi-Tenancy                            │
│   7. Inteligência Artificial Assistida (AI Advisor)              │
└──────────────────────────────────────────────────────────────────┘
```

---

### 10. Regras de Decisão para Introduzir Recursos
Antes de planejar ou codificar qualquer funcionalidade, a equipe técnica e de produto deve responder de forma unânime:
- *Isto ajuda diretamente o consultor no trabalho de campo ou na geração de relatórios?*
- *Isto aumenta a confiança do cliente final nas métricas apresentadas?*
- *Isto respeita as responsabilidades dos Core Engines existentes no manifesto?*
- *Isto diminui a dívida técnica do projeto em uma visão de 3 a 5 anos?*
- *Isso está previsto no escopo e no roadmap estratégico da release atual em desenvolvimento?*

---

### 11. Métricas de Sucesso do Produto
- **Time to Report**: Redução do tempo necessário para que o consultor importe os dados brutos e monte o deck de reuniões de fechamento.
- **Engajamento no Modo Reunião**: Frequência e número de atas e planos de ação lavrados e acompanhados diretamente através da plataforma.
- **Rastreabilidade de Dados (Lineage Trust)**: Baixo volume de incongruências financeiras apontadas pelos clientes finais devido à facilidade de auditar os números na tela.
- **Churn de Projetos**: Percentual de consultores que continuam gerenciando ativamente as reuniões mensais de seus clientes no Sauron após 6 meses de onboarding.

---

### 12. Próxima Release Recomendada
A próxima release técnica em foco prioritário é a **v0.7 — Presentation Studio**, visando dotar a plataforma da capacidade de fechar reuniões estratégicas com base nas análises executivas já consolidadas pelas Sprints Delta e Épsilon.

> *Nota: Este roadmap estratégico deve ser continuamente validado pelo PO (Product Owner) e CTO antes do pontapé inicial de codificação das próximas sprints.*
