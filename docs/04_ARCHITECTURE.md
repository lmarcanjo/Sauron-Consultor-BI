# ASTERION — Arquitetura do Sistema

## Visão Geral da Arquitetura

O ASTERION é estruturado em quatro camadas fundamentais de desacoplamento:

```
┌─────────────────────────────────────────────────────────┐
│                    UI / React Shell                     │
└────────────────────────────┬────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────┐
│         Business Intelligence & Domain Engines          │
└────────────────────────────┬────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────┐
│         Chaos Data Profiling & Discovery Layer          │
└────────────────────────────┬────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────┐
│          Storage & Persistence (IndexedDB/SQL)          │
└─────────────────────────────────────────────────────────┘
```

---

## Componentes Principais

* **ActiveDatasetStore**: Gerenciador do estado da fonte de dados atualmente ativa.
* **ChaosProfilingRepository**: Repositório de perfis estruturais e visões de dados.
* **EnterpriseConsolidationService**: Serviço de filtragem e consolidação por escopo de empresa.
* **ExecutivePresentationEngine**: Motor autônomo de geração de apresentações executivas.
* **FinancialConsistencyOrchestrator**: Garantidor de consistência matemática dos indicadores.
