# UI Action Inventory — MVP-2

Data: 2026-08-08

O inventário desta entrega cobre a jornada de ativação dos módulos e os CTAs
que podem deixar o consultor sem próximo passo. A guarda automatizada também
varre `src/components` em busca de `onClick` vazio, `onClick` que retorna
`undefined` e `href="#"`.

| Componente | Ação visível | Handler | Resultado | Classificação |
| --- | --- | --- | --- | --- |
| `ChaosProfilingPanel` | Analisar dados | `runProfiling` | Gera e persiste `PreliminaryFinancialAnalysisArtifact` | WORKING |
| `PreliminaryFinancialDashboard` | Revisar campos | `onReviewFields` | Retorna à revisão semântica da fonte | WORKING |
| `PreliminaryFinancialDashboard` | Voltar à análise | `onNavigateToAnalysis` | Abre a análise da fonte | WORKING |
| `FinanceiroTab` | Abrir Financeiro | `ModuleActivationView` | Mostra cards, séries e agrupamentos do artefato preliminar | WORKING |
| `ComercialTab` | Configurar módulo | `ModuleActivationWizard` | Persiste configuração por Engajamento e fonte | WORKING |
| `ComercialTab` | Alterar / adicionar fonte | `onOpenSourceAnalysis` | Abre análise e permite revisar a fonte | WORKING |
| `EstoqueTab` | Alterar / adicionar fonte | `onOpenSourceAnalysis` | Abre análise da fonte para localizar requisitos | WORKING |
| `ItensTab` | Alterar / adicionar fonte | `onOpenSourceAnalysis` | Abre análise da fonte para localizar requisitos | WORKING |
| `PosVendasTab` | Alterar / adicionar fonte | `onOpenSourceAnalysis` | Abre análise da fonte para localizar requisitos | WORKING |
| `ModuleActivationWizard` | Avançar / Voltar | estado interno do wizard | Navega pelas oito etapas | WORKING |
| `ModuleActivationWizard` | Ativar módulo | `ModuleConfigurationService.saveConfiguration` | Salva a configuração e atualiza o módulo | WORKING |
| `ModuleActivationWizard` | Concluir | `onClose` | Fecha após persistência confirmada | WORKING |

Estados sem fonte ou sem artefato usam o CTA de análise/fonte. Quando os
requisitos físicos não existem, o módulo informa os campos ausentes e não
oferece uma configuração que não poderia funcionar. Nenhum botão dos módulos
MVP-2 é deixado visualmente ativo sem handler.

## Guardas

- `src/components/moduleActivationDeadButtonGuard.test.ts`
- `ModuleStatusPanel` centraliza os CTAs e seus estados.
- O Financeiro não fabrica confirmação semântica nem recalcula métricas.
