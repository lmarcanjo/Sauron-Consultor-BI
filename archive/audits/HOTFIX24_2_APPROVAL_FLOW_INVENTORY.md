# HOTFIX 24.2 — Approval Flow & Action Inventory

## Inventário da Jornada Única de Aprovação

Para eliminar painéis visuais concorrentes e múltiplos botões repetidos, a interface de Análise da Fonte foi unificada no `ConsultantDiscoveryPanel`.

| Elemento / Botão | Componente Original | Componente Unificado | Handler Canônico | Efeito Observável & Persistido | Status |
| --- | --- | --- | --- | --- | --- |
| `[Usar estrutura sugerida]` | ZcxProposalPanel | ConsultantDiscoveryPanel | `onAcceptSuggestedStructure` | Seleciona propostas de alta confiança no rascunho sem confirmar a DatasetView | **UNIFICADO** |
| `[Revisar interpretações]` | ZcxProposalPanel / ChaosProfilingPanel | ConsultantDiscoveryPanel | `onReviewInterpretations` | Expande o painel detalhado de edição por campo e dúvidas agrupadas | **UNIFICADO** |
| `[Continuar com nomes originais]` | ZcxProposalPanel | ConsultantDiscoveryPanel | `onKeepOriginalNames` | Mantém os `physicalName` imutáveis sem aplicar títulos sugeridos | **UNIFICADO** |
| `[Confirmar compreensão da fonte]` | ZcxProposalPanel | ConsultantDiscoveryPanel | `onConfirmSourceUnderstanding` | ÚNICA CTA PRINCIPAL: confirma `DatasetView`, persiste reconciliação e libera módulos | **ÚNICA CTA PRINCIPAL** |
| `[Ir para análises]` | Vários | ConsultantDiscoveryPanel | `onGoToAnalysis` | Habilitado apenas após a confirmação para navegar para os resultados | **OPERACIONAL** |
