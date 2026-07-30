# F19.2 — Consultant Control Baseline Report

**Data:** 2026-07-18  
**Autor:** Antigravity (AI Coding Assistant)  
**Status:** Mapeamento de Linha de Base Concluído  

---

## 1. Campos Fixos e Nomes Hardcoded
- **Regras de tradução fixa de termos:** O [`AdaptiveUILabelEngine.ts`](file:///home/natalicorreia/Documentos/Sauron-Consultor-BI-main/src/core/adaptive-ui/AdaptiveUILabelEngine.ts) contém termos estáticos e substituições regex hardcoded para `pessoas`, `funcionários`, `vendedores`, `comissão`, `clientes`, `filiais`, `lojas`, etc.
- **Expressões de Inferência ("Candidatas"):**
  - O [`ColumnRoleSuggestionEngine.ts`](file:///home/natalicorreia/Documentos/Sauron-Consultor-BI-main/src/core/smart-configuration/ColumnRoleSuggestionEngine.ts) define labels fixos como `"Receita candidata"`, `"Despesa candidata"`.
  - O [`BusinessMetricBuilder.ts`](file:///home/natalicorreia/Documentos/Sauron-Consultor-BI-main/src/core/business-intelligence/BusinessMetricBuilder.ts) define chaves de mapeamento e strings contendo `receitaCandidata`, `despesaCandidata` e `margemCandidata`.
  - Mensagens de log e evidências de auditoria no [`BusinessMetricCalculator.ts`](file:///home/natalicorreia/Documentos/Sauron-Consultor-BI-main/src/core/business-intelligence/BusinessMetricCalculator.ts) e [`KnowledgeGraphBuilder.ts`](file:///home/natalicorreia/Documentos/Sauron-Consultor-BI-main/src/core/knowledge-graph/KnowledgeGraphBuilder.ts) expõem termos como `"Custo candidato"`, `"Margem candidata"`, `"Regra candidata"`, `"DRE candidata"`.

---

## 2. Módulos Considerados Obrigatórios
- **Sidebar & Abas Fixas:** O menu lateral ([`AppSidebar.tsx`](file:///home/natalicorreia/Documentos/Sauron-Consultor-BI-main/src/components/AppSidebar.tsx)) e as abas do workspace ([`CaseContextTabs.tsx`](file:///home/natalicorreia/Documentos/Sauron-Consultor-BI-main/src/components/CaseContextTabs.tsx), [`CaseTabs.tsx`](file:///home/natalicorreia/Documentos/Sauron-Consultor-BI-main/src/components/CaseTabs.tsx)) exibem permanentemente atalhos para:
  - **Pessoas / Performance** (vinculado a `PeopleIntelligenceTab`)
  - **Comissões** (vinculado a `ComissoesTab`)
  - **DRE** (vinculado a `IntelligentDRETab`)
  - **Comercial** (vinculado a `ComercialTab`)
- **Readiness Geral:** O [`ConsultingReadinessService.ts`](file:///home/natalicorreia/Documentos/Sauron-Consultor-BI-main/src/core/business-intelligence/ConsultingReadinessService.ts) pontua a prontidão analítica baseado na presença de KPIs e DRE e não flexibiliza a nota caso um projeto não utilize Comissão ou Pessoas (pontua de forma estática as 10 dimensões).

---

## 3. Dependências de "Receita Candidata" (e equivalentes)
- **Cálculo de Margem e Lucro:** [`BusinessMetricCalculator.ts`](file:///home/natalicorreia/Documentos/Sauron-Consultor-BI-main/src/core/business-intelligence/BusinessMetricCalculator.ts) depende internamente de `marginColumn` e `revenueColumn` interpretados como candidatos ou mapeados de forma estrita para inferir valores agregados.
- **Sugestões do Assistente:** O assistente de configuração automática no [`ModuleSuggestionEngine.ts`](file:///home/natalicorreia/Documentos/Sauron-Consultor-BI-main/src/core/smart-configuration/ModuleSuggestionEngine.ts) utiliza termos contendo o sufixo "candidato(a)" ao apresentar o total de colunas detectadas por padrão.

---

## 4. Dependências de "People" (Pessoas)
- **Componentes do Stage:** O [`ExecutiveSessionStage.tsx`](file:///home/natalicorreia/Documentos/Sauron-Consultor-BI-main/src/components/ExecutiveSessionStage.tsx) e o painel lateral [`ExecutiveSessionRightPanel.tsx`](file:///home/natalicorreia/Documentos/Sauron-Consultor-BI-main/src/components/ExecutiveSessionRightPanel.tsx) presumem a existência fixa da seção `"pessoas"`.
- **Filtros e Vendedores:** A aba [`PeopleIntelligenceTab.tsx`](file:///home/natalicorreia/Documentos/Sauron-Consultor-BI-main/src/components/PeopleIntelligenceTab.tsx) e o controller de simulação de reunião [`useExecutiveSessionState.ts`](file:///home/natalicorreia/Documentos/Sauron-Consultor-BI-main/src/components/useExecutiveSessionState.ts) possuem "6. Pessoas e Talentos" hardcoded na agenda e nos capítulos ativos.

---

## 5. Dependências de "Comissão"
- **Consolidação Financeira:** O [`EnterpriseConsolidationService.ts`](file:///home/natalicorreia/Documentos/Sauron-Consultor-BI-main/src/core/enterprise-consolidation/EnterpriseConsolidationService.ts) soma a coluna de comissão incondicionalmente no método `calculateConsolidatedMetrics` (soma `Comissão` ou `comissão` se a coluna existir).
- **Fechamento e Comissões:** Os painéis [`ComissoesTab.tsx`](file:///home/natalicorreia/Documentos/Sauron-Consultor-BI-main/src/components/ComissoesTab.tsx) e [`CommissionClosingPanel.tsx`](file:///home/natalicorreia/Documentos/Sauron-Consultor-BI-main/src/components/CommissionClosingPanel.tsx) presumem que todo projeto financeiro tem a dimensão de comissão a pagar para vendedores.

---

## 6. Formas Atuais de Trocar Empresa
- **dropdown de Contexto:** O [`GlobalContextBar.tsx`](file:///home/natalicorreia/Documentos/Sauron-Consultor-BI-main/src/components/GlobalContextBar.tsx) atualiza o escopo organizativo (`setEnterpriseContext`) definindo `companyId` ou `unitId`.
- **Isolamento de Dados Físicos:** Se um consultor altera a empresa, o `EnterpriseConsolidationService` carrega as fontes vinculadas a ela. No entanto, se o mesmo arquivo de planilha possui dados de múltiplas empresas e está associado ao grupo, o sistema não filtra dinamicamente as linhas por Empresa no cálculo final quando existem bindings, o que pode causar contaminação de dados.
- **Necessidade de Reativação:** Para alternar entre dados isolados de diferentes empresas que possuem planilhas distintas, o consultor precisa voltar à Biblioteca de Planilhas e realizar a ativação/vinculação manual da fonte de dados correspondente.

---

## 7. Regras Atuais de Acesso
- **Políticas Estáticas:** O [`AccessControlEngine.ts`](file:///home/natalicorreia/Documentos/Sauron-Consultor-BI-main/src/core/identity/AccessControlEngine.ts) avalia permissões com base em perfis estáticos (`role === "SUPER_ADMIN"`, `"CONSULTANT"`, etc.) e nas empresas associadas à simulação de usuário (`PlatformUser`).
- **Falta de Persistência Granular:** Não existe uma tabela/repositório de `UserAccessGrant` que defina em tempo de execução quais empresas, unidades, módulos e ações um usuário específico pode acessar e executar no workspace/projeto atual.
