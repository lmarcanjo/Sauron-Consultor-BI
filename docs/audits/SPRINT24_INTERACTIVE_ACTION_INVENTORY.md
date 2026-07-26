# SPRINT 24 — Interactive Action Inventory (Zero Dead Actions)

## Inventário Completo de Ações Interativas

| Action ID | Tela | Rótulo / Elemento | Handler | Efeito Esperado | Estado |
| --- | --- | --- | --- | --- | --- |
| `ACT_01` | Análise da Fonte | `[Confirmar compreensão da fonte]` | `onConfirmSourceUnderstanding` | Confirma a `DatasetView`, persiste a reconciliação e libera a fonte para análises | **OPERACIONAL** |
| `ACT_02` | Análise da Fonte | `[Aprovar reconciliação selecionada]` | `onConfirmReconciliation` | Aplica as criações/associações aprovadas pelo consultor | **OPERACIONAL** |
| `ACT_03` | Análise da Fonte | `[Manter empresa independente]` | `onKeepUnreconciled` | Preserva `groupId = null` sem vínculo forçado a grupo | **OPERACIONAL** |
| `ACT_04` | Análise da Fonte | `[Usar estrutura sugerida]` | `onAcceptSuggestedStructure` | Seleciona os campos de alta confiança e salva o rascunho | **OPERACIONAL** |
| `ACT_05` | Análise da Fonte | `[Continuar com nomes originais]` | `onKeepOriginalNames` | Seleciona todos os campos físicos sem renomeação semântica | **OPERACIONAL** |
