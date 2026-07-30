# SAURON OS — NAVIGATION COHERENCE & PRODUCT UNIFICATION (SPRINT Ω+1.1)

## Overview
As part of **Sprint Ω+1.1 — Navigation Cleanup & Product Coherence**, the navigation layout of Sauron OS was refactored to eliminate redundancy, align with the **Método Sauron**, and consolidate scattered management screens into logical, single-home components. This transition turns Sauron from a standard dashboard into an operating system for business consultants.

---

## 1. The 9 Consulting Flow Groups (Método Sauron)

The sidebar and core navigation now center around **9 sequential, value-adding stages** instead of duplicate tool lists:

| Stage / Group | Sidebar Group | Purpose | Key Sub-Items |
|---|---|---|---|
| **0. Centro de Comando** | `centro_comando` | Entry point of active projects and client workspace. | Executive Workspace |
| **1. Conhecer Cliente** | `conhecer_cliente` | structural-relacional mapping and client dossiers. | Gêmeo Digital, Projetos de Consultoria |
| **2. Conectar Dados** | `conectar_dados` | Consolidation of all raw and technical data integration. | Central de Dados, Banco de Dados, VPN, APIs, LGPD, Sincronização, Fonte Ativa, Validação |
| **3. Diagnosticar Negócio** | `diagnosticar_negocio` | Domain specific analytics and KPIs. | Diagnóstico Executivo, KPIs Comerciais, KPIs Pós-Vendas, Peças & Acessórios, Gestão de Estoque, KPIs Financeiros, DRE Inteligente, Benchmarks, Diagnóstico de Anomalias, Recomendações de IA, Dossiês Executivos |
| **4. Preparar Decisão** | `preparar_decisao` | Packaging data into narratives and stories for board meetings. | Narrativa Executiva, Deck de Apresentações, Story Builder, Templates, Insights Selecionados |
| **5. Conduzir Sessão** | `conduzir_sessao` | Boardroom interactive meeting mode. | Sessão Executiva, Ata da Reunião, Decisões Estratégicas, Perguntas de Negócio, Notas e Transcrições |
| **6. Executar Plano** | `executar_plano` | Tracking project deliverables, task assignees, and financial status. | Plano Executivo, Responsáveis, Prazos e Metas, Pendências de Caixa, Follow-up Semanal |
| **7. Evoluir Resultado** | `evoluir_resultado` | Post-meeting comparison, close-outs, and commissions. | Histórico Executivo, Resultados Consolidados, Comparativos Mensais, Evolução Mensal, **People Intelligence** |
| **8. Administração** | `administracao` | User management, auditing, and twin organization compliance. | Usuários, Organizações, Permissões, Convites, Compartilhamentos, Configurações, Auditoria, Segurança |

---

## 2. Consolidation of People Intelligence & HR Analytics

Following the **uniqueness rule**, `ComissoesTab` was expanded and refactored into the unified `PeopleIntelligenceTab`. HR, commission parameters, and team metrics now exist in a single place:
1. **Collaborators Directory**: Core headcount ledger with custom metrics.
2. **Performance Dashboard**: Real-time sales rankings and active task completion.
3. **Commissions & Rules**: Financial rule engine parameters and CNPJ-by-CNPJ payout details.
4. **Employee Dossiers**: Dedicated individual files with cognitive summaries.
5. **Dossier Impressions**: qualitative performance notes, feedback logs, and tactical backups.

---

## 3. Role-Based Permissions Access Control Matrix

Permissions are enforced dynamically at both the Group and Sub-Item levels using the `AccessControlEngine` and the sidebar helpers:

| Role | Centro de Comando | Conhecer Cliente | Conectar Dados | Diagnosticar Negócio | Preparar Decisão | Conduzir Sessão | Executar Plano | Evoluir Resultado | Administração |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Super Admin** / **Consultor** | Full | Full | Full | Full | Full | Full | Full | Full | Full |
| **Client Director** / **Controller** | View | Full | Denied | Full | Limited | Full | Full | Full | Denied |
| **Client Manager** | View | Denied | Denied | Limited | Denied | Limited | Limited | Limited | Denied |
| **Financial User** | View | Denied | Denied | Limited | Denied | Limited | Denied | Limited | Denied |
| **Auditor** | View | View | View (Read) | View (Read) | Denied | Denied | Denied | View (Read) | View (Logs) |
| **Guest** / **Viewer** | View | Denied | Denied | View (Resumo) | Denied | Denied | Denied | Denied | Denied |

---

## 4. Automated Navigation Integrity Tests
To prevent regression or accidental duplicate layouts, we created `/src/components/navigationCoherence.test.ts` checking:
* **Duplicate Sub-Item IDs**: Guarantees that every logical page/tab has a unique `routeId`.
* **Duplicate Menu Labels**: Ensures no redundant titles or labels disrupt the sidebar.
* **People Intelligence Uniqueness**: Asserts that People Intelligence is declared exactly once in the entire ecosystem.
* **Technical Consolidation**: Confirms that technical database, VPN, and ETL pipelines are strictly consolidated under the "Conectar Dados" group.
