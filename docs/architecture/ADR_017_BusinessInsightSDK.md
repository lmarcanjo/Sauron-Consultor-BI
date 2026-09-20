# ADR 017: Business Insight SDK and Trust-Governed Business Analysis

## Context & Problem Statement
Na evolução da inteligência consultiva da plataforma ASTERION, a construção de futuras análises empresariais (análises descritivas, variações, tendências, riscos e oportunidades) exige uma infraestrutura comum extensível que impeça o acoplamento direto com a camada física de dados e garanta que nenhuma conclusão empresarial seja gerada ignorando o estado de governança do `TrustArtifact`.

## Decision Drivers
1. **Trust como Pré-condição Inviolável**: Motores de negócio não podem ser executados com um `TrustArtifact` em estado `BLOCKED` ou `INVALIDATED`.
2. **Propagação Transparente de Limitações**: Toda limitação de governança (baixa amostragem, confirmação parcial, sincronização desatualizada) deve ser obrigatoriamente propagada para o `BusinessArtifact`.
3. **Separação de Papéis na Linguagem**:
   - `OBSERVATION`: Fato observado/calculado.
   - `FINDING`: Interpretação consultiva sustentada.
   - `RISK` / `OPPORTUNITY`: Impactos potenciais.
   - `ACTION_HYPOTHESIS`: Sugestão para deliberação exclusiva do consultor (zero automação/execução automática).
4. **Ausência de Motores Concretos ou Fórmulas Contábeis na Sprint 3.0**: A infraestrutura do SDK define apenas os contratos e guardas de políticas, sem calcular KPIs (Receita, Margem, EBITDA) ou DREs fictícios nesta etapa.

## Decisão Técnica
Implementar a suíte **Business Insight SDK** em `src/core/business-insight/`:
1. `BusinessArtifactContracts.ts`: Contrato imutável `BusinessArtifact`.
2. `BusinessInsightSDK.ts`: Interfaces `IAsterionBusinessInsightEngine`, `BusinessInsightExecutionContext`, `BusinessInsightExecutionResult` e exceções `BusinessInsightError`.
3. `BusinessInsightPolicyGuard.ts`: Guarda determinístico que valida `TrustArtifact`, `UsageAssessment`, `overallState` e compatibilidade de engajamento antes da execução.
4. `BusinessInsightRegistry.ts` e `BusinessInsightFactory.ts`: Registro extensível de motores por capacidade sem singletons globais.

## Consequências e Fronteira com o Presentation Engine
O `BusinessArtifact` consolida conclusões de negócio governadas. Ele não realiza renderizações visuais (UI), que permanecem como responsabilidade exclusiva da futura camada de apresentação (`Presentation Engine`).
