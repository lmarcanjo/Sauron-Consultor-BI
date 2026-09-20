# ADR 018: Financial Structure Observation Engine

## Context & Problem Statement
Após a homologação do **Business Insight SDK** (Sprint 3.0/3.0.1), a plataforma ASTERION exige a implementação do seu primeiro motor de inteligência corporativa concreto. Este motor deve analisar estruturas financeiras em fontes governadas sem impor planos de contas universais, classificações arbitrárias ou premissas contábeis rígidas (DRE/EBITDA/Lucro).

## Decision Drivers
1. **Abordagem Source-Driven e Linguagem Financeira Neutra**: A fonte e as decisões semânticas confirmadas pelo consultor (`FieldSemanticDecision`) definem a elegibilidade dos campos. Nenhuma coluna monetária é convertida automaticamente em Receita, Custo ou Despesa sem confirmação explícita.
2. **Trust Engine Obrigatório**: O motor valida rigorosamente o `TrustArtifact` e o `UsageAssessment` específico (ex: `FINANCIAL_ANALYSIS` ou `EXPLORATORY_ANALYSIS`) via `BusinessInsightPolicyGuard`. Fontes `BLOCKED` ou `INVALIDATED` impedem a execução.
3. **Imutabilidade e Pureza**: O motor (`FinancialStructureObservationEngine`) é uma função pura sem dependências de UI, DOM, banco de dados ou chamadas externas. A orquestração é realizada pelo serviço de aplicação (`FinancialObservationService`).
4. **Ausência de Riscos/Oportunidades/Ações Automatizadas**: O motor produz exclusivamente `BusinessObservation`, `CalculatedMetric` estrutural e `UnresolvedBusinessQuestion`. As coleções `risks`, `opportunities` e `actionHypotheses` permanecem vazias nesta fase para evitar falsas automações ou conjecturas não sustentadas.

## Decisão Técnica
Implementar em `src/core/financial-structure/`:
- `FinancialStructureObservationEngine.ts`: Motor puro cadastrado com engineId `financial_structure_observation_engine_v1`.
- `FinancialObservationService.ts`: Serviço de aplicação com autorização de usuário, guarda de política e emissão de eventos factuais (`BUSINESS_ANALYSIS_STARTED`, `BUSINESS_ARTIFACT_GENERATED`, `BUSINESS_ANALYSIS_BLOCKED`).
- `FinancialStructureContracts.ts`: DTOs neutros de entrada (`FinancialObservationInput`, `FinancialRecordInput`).

## Consequências
O `BusinessArtifact` gerado representa a primeira observação matemática neutra da estrutura financeira. Motores futuros de Análise Financeira (Sprint subsequente) consumião estes artefatos para derivar diagnósticos consultivos.
