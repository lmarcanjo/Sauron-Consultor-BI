# SPRINT 20 — ZCX Substitution Matrix

## Matriz de Substituição de Fluxos de Configuração

| Componente / Fluxo Antigo | Nova Experiência ZCX | Motivo da Absorção / Substituição | Status |
| --- | --- | --- | --- |
| Mapeamento manual individual de colunas como etapa obrigatória inicial | Proposta ZCX automática (`ZcxProposalPanel`) com 4 escolhas principais | O consultor não precisa interpretar do zero 80+ colunas; alta confiança (≥85%) vem pré-selecionada | Absorvido como proposta inicial (configuração manual mantida no modo avançado) |
| Painéis técnicos expostos por padrão (`ChaosProfilingPanel` cru) | Card ZCX explicável com 4 botões claros de ação | O consultor precisa saber o que foi encontrado, não navegar em estruturas internas da engine | Substituído na visualização primária |
| Questionários longos não direcionados | Seção de "Revisar dúvidas" focada em perguntas materiais | Pergunta apenas o que altera os cálculos e agregações de negócio | Focado e simplificado |
| Bloqueio do fluxo caso o consultor não defina papéis semânticos | Botão `[Continuar com nomes originais]` | Nenhuma configuração é obrigatória para exploração básica da fonte | Adicionado fluxo não-bloqueante |
