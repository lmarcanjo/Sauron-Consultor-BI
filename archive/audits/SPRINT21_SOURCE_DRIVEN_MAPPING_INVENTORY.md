# SPRINT 21.1 — Source-Driven Interpretation Inventory

## Inventário da Interface de Mapeamento Antiga

Este documento audita todas as ocorrências de listas fixas de papéis semânticos e formulários orientados por papéis predefinidos ("Qual coluna representa X?"), para classificação de remoção, absorção ou uso interno.

| Arquivo / Componente | Elemento Encontrado | Classificação | Destino na Sprint 21.1 |
| --- | --- | --- | --- |
| `src/components/ModuleFieldMappingPanel.tsx` | Cards repetidos de "Configuração da fonte" com dropdowns por módulo (Financeiro, Comercial, Pessoas, DRE, Comissão) | `REMOVE` | O componente e seus seletores fixos foram removidos da interface de "Análise da Fonte". |
| `src/components/CentralDadosTab.tsx` (Linhas ~775-780) | Renderização de 5 instâncias de `ModuleFieldMappingPanel` | `REMOVE` | Substituído por uma única tela unificada orientada pela fonte (`SourceDrivenInterpretationPanel.tsx`). |
| `src/core/data/moduleMapping.ts` | `MODULE_ROLE_DEFINITIONS` com rótulos estáticos (`Valor`, `Custo`, `Pessoa`, etc.) | `INTERNAL_ONLY` / `ABSORB` | Mantido apenas internamente como heurística de fallback no `SourceDrivenInterpretationEngine.ts` para converter mappings legados. |
| `src/components/ChaosProfilingPanel.tsx` | Seção legada de sugestões semânticas com inputs de texto ad-hoc por sugestão | `ABSORB` | Absorvido no novo painel único `SourceDrivenInterpretationPanel.tsx`. |
