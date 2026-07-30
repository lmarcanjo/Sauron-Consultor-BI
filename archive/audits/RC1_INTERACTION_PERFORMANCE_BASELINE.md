# RC-1 Interaction Performance & Render Stabilization Baseline

## 1. Mapeamento de Funções Pesadas Identificadas no Flamegraph / Profiler

| Handler / Operação | Origem | Causa da Lentidão | Ação de Otimização Aplicada |
| --- | --- | --- | --- |
| **Recálculo do Summary Cognitivo** | `ChaosProfilingPanel.tsx` -> `buildConsultantUnderstandingSummary` | Invocado sem memoização a cada renderização da tela | Envolvido em `useMemo` com dependências restritas a `[profile, zcxProposalState]` |
| **Enterprise Discovery Engine** | `ChaosProfilingPanel.tsx` -> `enterpriseDiscoveryEngine.discoverOrganization` | Recalculado 2x a cada ciclo de re-render do React | Envolvido em `useMemo` com dependência restrita a `[profile]` |
| **Reconciliation Proposal Engine** | `ChaosProfilingPanel.tsx` -> `generateReconciliationProposal` | Invocado inline no JSX de `ReconciliationPanel` | Envolvido em `useMemo` dependendo de `[profile, enterpriseModel, context]` |
| **Filtragem de Colunas no VirtualScroll** | `ChaosProfilingPanel.tsx` -> `searchPhysicalColumns` | Recalculado em todo render de scroll | Envolvido em `useMemo` desacoplado dos handlers de clique |
| **Mudanças de Checkbox/Input Local** | `SourceDrivenInterpretationPanel.tsx` | Disparava profiling/saveDraft integral síncrono a cada checkbox | Desacoplado para atualização de estado local rascunho com persistência sob demanda |

---

## 2. Orçamento de Performance (Performance Budget)

- **Mudança de Checkbox/Input**: `< 50 ms` (Trabalho síncrono no React)
- **Abertura de Seção / Modal**: `< 100 ms`
- **Validação do Entendimento**: Resposta imediata na UI (`< 30 ms`), persistência assíncrona
- **Trabalho Síncrono Bloqueante**: ZERO chamadas sobre dataset integral na thread principal
