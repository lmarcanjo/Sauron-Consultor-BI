# ADR 016: Trust Engine and Usage-Specific Trust Assessment

## Context & Problem Statement
No ASTERION, a transição de um `DataSource` para o estado de domínio `READY` representa exclusivamente a conclusão do fluxo operacional de confirmação semântica humana sobre a estrutura observada da fonte de dados. No entanto, `READY` não implica confiança absoluta para qualquer finalidade corporativa ou analítica. Uma fonte homologada e pronta pode possuir alta confiabilidade para análises exploratórias locais, porém apresentar severas limitações ou bloqueios para relatórios financeiros externos ou tomada de decisão automatizada.

## Decision Drivers
1. **Separação Rigorosa de Responsabilidades**: O `CanonicalDataState` (`READY`) é um marco operacional. O `TrustArtifact` é uma avaliação de aptidão condicional por uso.
2. **Avaliação Determinística Sem IA/LLM**: O Trust Engine deve ser 100% determinístico, reproduzível, auditável e imutável.
3. **Prevalência de Condição Crítica sobre Média Numérica**: Nenhuma média aritmética de qualidade ou score pode mascarar um bloqueio crítico de integridade ou confirmação semântica.
4. **Soberania da Fonte Preservada**: O Trust Engine avalia governança e confiabilidade sem alterar fisicamente a fonte de dados, sem renomear colunas e sem calcular métricas de negócio (KPIs, DRE).

## Decisão Técnica
Implementar o **Trust Engine** como um motor puro determinístico (`TrustEngine.ts`) consumindo `DataSource`, `DiscoveryArtifact`, `QualityArtifact`, `EvidenceArtifact`, `SemanticArtifact` e `SemanticConfirmationArtifact`, produzindo o contrato imutável `TrustArtifact`.

1. **Estados de Confiabilidade**:
   - `NOT_ASSESSED`, `INSUFFICIENT_EVIDENCE`, `BLOCKED`, `LIMITED`, `CONDITIONALLY_TRUSTED`, `TRUSTED`, `INVALIDATED`.
2. **Dimensões Avaliadas**:
   - `STRUCTURAL_INTEGRITY`, `DATA_QUALITY`, `SEMANTIC_COVERAGE`, `HUMAN_CONFIRMATION`, `EVIDENCE_COVERAGE`, `SCHEMA_STABILITY`, `SYNCHRONIZATION_RECENCY`, `LINEAGE_READINESS`, `OPERATIONAL_HEALTH`.
3. **Usos Certificáveis**:
   - `EXPLORATORY_ANALYSIS`, `INTERNAL_MONITORING`, `EXECUTIVE_PRESENTATION`, `FINANCIAL_ANALYSIS`, `OPERATIONAL_DIAGNOSIS`, `EXTERNAL_REPORTING`, `AUTOMATED_DECISION_SUPPORT`.
4. **Regras de Bloqueio Crítico**:
   - Fontes não `READY` ou com confirmação semântica `INVALIDATED` são bloqueadas para análises financeiras e apresentações executivas.
   - Presença de alertas físicos de qualidade de severidade `CRITICAL` bloqueiam o uso em `AUTOMATED_DECISION_SUPPORT`.

## Consequências e Fronteira com o Business Engine
- O `TrustEngine` avalia a **aptidão e governança da fonte**. Ele não realiza inferências semânticas, não altera a fonte física, não calcula DRE nem gera diagnóstico empresarial (responsabilidades exclusivas do futuro Business Engine).
