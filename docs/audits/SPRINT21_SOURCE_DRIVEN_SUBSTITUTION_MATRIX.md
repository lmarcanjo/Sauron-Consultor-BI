# SPRINT 21.1 — Source-Driven Substitution Matrix

## Matriz de Substituição da Experiência Orientada pela Fonte

| Componente / Fluxo Antigo | Nova Experiência Source-Driven | Motivo da Substituição | Status |
| --- | --- | --- | --- |
| `ModuleFieldMappingPanel.tsx` (cards por módulo Financeiro, Comercial, Pessoas, DRE, Comissão) | `SourceDrivenInterpretationPanel.tsx` (tela única unificada) | Elimina a abordagem inversa (procurar colunas para conceitos predefinidos) e adota o fluxo `physicalName` → `suggestedInterpretation`. | **Absorvido & Arquivo Removido** |
| Seletores fixos com papéis obrigatórios (`semanticRole`) | Lista dinâmica de campos físicos com nomes originais imutáveis e sugestões | A fonte passa a ser soberana; nenhuma lista fixa de campos do produto orienta a tela. | **Substituído** |
| Mapeamento de escopo global forçado | Interpretação escopada por container/bloco | Permite que a mesma coluna física tenha significados distintos conforme o contexto do bloco. | **Substituído** |
