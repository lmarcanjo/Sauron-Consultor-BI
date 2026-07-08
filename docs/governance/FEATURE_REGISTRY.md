# SAURON FEATURE REGISTRY
## Registro Oficial de Funcionalidades e Recursos da Plataforma

Este documento cataloga, mapeia e audita todas as funcionalidades essenciais da plataforma **Sauron**, estabelecendo as conexões de arquivos, testes e documentação.

---

### Mapeamento Geral de Features

| ID | Nome da Funcionalidade | Categoria | Release | Status | Dependências |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **FEAT-001** | Core Business Engine | Core | v0.5 | **CONCLUÍDO** | Nenhuma |
| **FEAT-002** | Core Data Engine | Core | v0.5 | **CONCLUÍDO** | FEAT-001 |
| **FEAT-003** | Ingestão e Data Catalog | Data Governance | v0.5 | **CONCLUÍDO** | FEAT-002 |
| **FEAT-004** | Analytics Engine (Determinístico) | Analytics | v0.6 | **CONCLUÍDO** | FEAT-001, FEAT-002 |
| **FEAT-005** | Consultant Workspace | Workspace | v0.6 | **CONCLUÍDO** | FEAT-003 |
| **FEAT-006** | Trilha de Auditoria Geral | Governance | v0.5 | **CONCLUÍDO** | Nenhuma |
| **FEAT-007** | Plugin Engine (Setores) | Core | v0.5 | **CONCLUÍDO** | FEAT-001 |

---

### Detalhamento das Features

#### FEATURE-ID: FEAT-001
- **Nome**: Core Business Engine
- **Descrição**: Motor puramente funcional para o processamento de regras, operações e cálculos financeiros transversais (estruturação de DREs, cálculos matemáticos de faturamento, custos e margens de contribuição).
- **Categoria**: Core / Financial Calculations
- **Release**: v0.5 (Infrastructure)
- **Status**: **CONCLUÍDO**
- **Dependências**: Nenhuma (isento de dependências de browser ou de frameworks de UI).
- **Arquivos principais**: `src/core/BusinessEngine.ts`
- **Testes**: `src/core/coreEngines.test.ts`
- **Documentação**: `docs/architecture/analytics-engine.md`
- **Observações**: Desenvolvido estritamente para atuar de forma paralela e isenta de acoplamento com o React.

#### FEATURE-ID: FEAT-002
- **Nome**: Core Data Engine
- **Descrição**: Motor de orquestração técnica encarregado de parsear planilhas, mapear snapshots brutos, validar integridade sintática e calcular o hashing de integridade de dados importados.
- **Categoria**: Core / Data Processing
- **Release**: v0.5 (Infrastructure)
- **Status**: **CONCLUÍDO**
- **Dependências**: FEAT-001
- **Arquivos principais**: `src/core/data/DataEngine.ts`, `src/core/data/DataQuality.ts`
- **Testes**: `src/core/coreEngines.test.ts`
- **Documentação**: `docs/architecture/analytics-engine.md`
- **Observações**: Integra-se com o catálogo de dados para prevenir contaminações estruturais.

#### FEATURE-ID: FEAT-003
- **Nome**: Ingestão e Data Catalog
- **Descrição**: Catalogador de metadados das tabelas integradas ou importadas pelo usuário, fornecendo auditoria imediata sobre o volume de linhas e integridade dos snapshots ativos.
- **Categoria**: Data Governance / ETL
- **Release**: v0.5 (Infrastructure)
- **Status**: **CONCLUÍDO**
- **Dependências**: FEAT-002
- **Arquivos principais**: `src/core/data/DataCatalog.ts`, `src/core/data/DataSourceManager.ts`
- **Testes**: `src/services/dataSourceManager.test.ts`
- **Documentação**: `docs/SAURON_ENGINEERING_MANIFESTO.md`
- **Observações**: Contém o isolamento rigoroso de segurança que impede a injeção ou exibição de dados do demonstrativo fictício (`demoData`) quando canais de dados reais estão configurados.

#### FEATURE-ID: FEAT-004
- **Nome**: Analytics Engine (Determinístico)
- **Descrição**: Sistema de motores especialistas para conduzir análises avançadas (Tendências, Anomalias de centros de custo, Comparativos e Benchmarks de filiais e geração automática de recomendações executivas focadas em desvios).
- **Categoria**: Intelligence / Analytics
- **Release**: v0.6 (Consultant Platform)
- **Status**: **CONCLUÍDO**
- **Dependências**: FEAT-001, FEAT-002
- **Arquivos principais**:
  - `src/core/analytics/types.ts`
  - `src/core/analytics/AnomalyEngine.ts`
  - `src/core/analytics/TrendEngine.ts`
  - `src/core/analytics/BenchmarkEngine.ts`
  - `src/core/analytics/RecommendationEngine.ts`
  - `src/core/analytics/NarrativeEngine.ts`
- **Testes**: `src/core/analytics/AnalyticsEngines.test.ts`
- **Documentação**: `docs/architecture/analytics-engine.md`
- **Observações**: O motor possui cobertura completa de testes unitários em Vitest que simulam múltiplos cenários reais.

#### FEATURE-ID: FEAT-005
- **Nome**: Consultant Workspace
- **Descrição**: Console central de orquestração para múltiplos projetos de consultoria, permitindo criar, arquivar, carregar dados customizados, registrar reuniões e planos de ação.
- **Categoria**: Workspace Management
- **Release**: v0.6 (Consultant Platform)
- **Status**: **CONCLUÍDO**
- **Dependências**: FEAT-003
- **Arquivos principais**:
  - `src/modules/consultant-workspace/ConsultantWorkspaceManager.ts`
  - `src/modules/consultant-workspace/types.ts`
  - `src/modules/consultant-workspace/WorkspaceRepository.ts`
- **Testes**: `src/modules/consultant-workspace/ConsultantWorkspaceManager.test.ts`
- **Documentação**: `docs/SAURON_PRODUCT_ROADMAP.md`
- **Observações**: Persiste estados de projeto de forma resiliente no `localStorage` do navegador com versionamento estruturado do schema de dados.

#### FEATURE-ID: FEAT-006
- **Nome**: Trilha de Auditoria Geral
- **Descrição**: Registrador central de incidentes operacionais de integridade de dados, conexões de VPN e alertas de segurança de banco de dados.
- **Categoria**: Security & Governance
- **Release**: v0.5 (Infrastructure)
- **Status**: **CONCLUÍDO**
- **Dependências**: Nenhuma
- **Arquivos principais**: `src/core/audit/AuditEngine.ts`, `server.ts`
- **Testes**: `src/services/dataSourceManager.test.ts`
- **Documentação**: `docs/SAURON_RELEASE_GATES.md`
- **Observações**: Grava violações imediatas de dados com carimbos de data/hora imutáveis e IDs UUID seguros.

#### FEATURE-ID: FEAT-007
- **Nome**: Plugin Engine (Setores)
- **Descrição**: Mecanismo de injeção dinâmica de validações e mapeamentos de KPIs setoriais para o segmentamento selecionado no projeto ativo.
- **Categoria**: Core / Extensibility
- **Release**: v0.5 (Infrastructure)
- **Status**: **CONCLUÍDO**
- **Dependências**: FEAT-001
- **Arquivos principais**: `src/core/data/DataLineage.ts`, `src/App.tsx` (integração visual)
- **Testes**: `src/core/coreEngines.test.ts`
- **Documentação**: `docs/SAURON_ENGINEERING_MANIFESTO.md`
- **Observações**: Protege o Core transversal contra poluição de lógicas financeiras específicas de um único nicho industrial.
