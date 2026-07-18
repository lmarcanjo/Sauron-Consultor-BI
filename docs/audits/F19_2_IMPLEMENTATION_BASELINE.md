# F19.2 — Implementation Baseline Report

**Data:** 2026-07-18  
**Autor:** Antigravity (AI Coding Assistant)  
**Status:** Mapeamento de Linha de Base de Implementação Concluído  

---

## 1. Escopo de Mudanças para F19.2

O objetivo principal é reverter a imposição estrutural do sistema e permitir controle total pelo consultor sobre os seguintes aspectos:

- **Módulos analíticos:** Tornar People, Comissão, Comercial, Financeiro, DRE e Estoque opcionais.
- **Campos e Colunas:** Expor todas as colunas da planilha (sem omitir nada silenciosamente) e permitir que o consultor as confirme, renomeie (com `consultantLabel`) ou ignore.
- **Nomenclaturas:** Expurgar referências a termos como "Receita candidata", "Despesa candidata" e "Pessoas Reais" da UI executiva.
- **Troca Rápida de Empresa:** Alterar a empresa ativa no cabeçalho sem forçar retorno à biblioteca e sem vazamento de dados entre CNPJs.
- **Acesso Governamental:** Controlar permissões por usuário usando a estrutura de `UserAccessGrant`.

---

## 2. Posição das Expressões e KPI Impositivos Atuais

### Expressões "Candidatas"
- No [`ColumnRoleSuggestionEngine.ts`](file:///home/natalicorreia/Documentos/Sauron-Consultor-BI-main/src/core/smart-configuration/ColumnRoleSuggestionEngine.ts): `revenue: "Receita candidata"`, `expense: "Despesa candidata"`.
- No [`BusinessMetricBuilder.ts`](file:///home/natalicorreia/Documentos/Sauron-Consultor-BI-main/src/core/business-intelligence/BusinessMetricBuilder.ts): `despesaCandidata`, `margemCandidata`, `receitaCandidata`.

### Visualizações de Pessoas e Comissão Impositivas
- A sidebar e as abas (`CaseContextTabs.tsx`, `CaseTabs.tsx`) assumem a aba `pessoas` e `comissao` de forma fixa.
- O [`ConsultingReadinessService.ts`](file:///home/natalicorreia/Documentos/Sauron-Consultor-BI-main/src/core/business-intelligence/ConsultingReadinessService.ts) penaliza a prontidão de fontes sem mapeamento de KPI ou DRE.

---

## 3. Estratégia de Isolamento de Dados

Para garantir o isolamento estrito de dados multiempresa na troca rápida:
- O [`EnterpriseConsolidationService.ts`](file:///home/natalicorreia/Documentos/Sauron-Consultor-BI-main/src/core/enterprise-consolidation/EnterpriseConsolidationService.ts) será alterado para sempre filtrar as linhas brutas baseando-se no nome ou identificador da empresa selecionada, evitando a exibição de linhas de outras empresas do mesmo grupo que estejam na mesma planilha.
