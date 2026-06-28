# SAURON PLATFORM BLUEPRINT — TARGET ARCHITECTURE

## ADR 001: Seleção de Arquitetura Alvo para o Sauron Enterprise

### 1. ARQUITETURA ALVO: MONÓLITO MODULAR INTEGRADO (MODULAR MONOLITH)
Para garantir a transição suave de um modelo de aplicação local-first (desenvolvido em React + Vite) para uma infraestrutura SaaS Enterprise altamente escalável, o Sauron Architecture Review Board (ARB) escolheu o **Monólito Modular** como arquitetura alvo de transição.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          SAURON PLATFORM CLIENT                         │
│                                                                         │
│   ┌────────────────────┐    ┌────────────────────┐   ┌──────────────┐   │
│   │   Sauron SDK UI    │───►│ Executive Story™   │──►│ Contabil Tab │   │
│   └────────────────────┘    └────────────────────┘   └──────────────┘   │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ (REST & Secure WebSocket)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       MODULAR MONOLITH SERVICE                          │
│                                                                         │
│   ┌───────────────────────┐ ┌──────────────────────┐ ┌──────────────┐   │
│   │   Workspace Engine    │ │   Analytics Engine   │ │ Story Engine │   │
│   └───────────────────────┘ └──────────────────────┘ └──────────────┘   │
│   ┌───────────────────────┐ ┌──────────────────────┐ ┌──────────────┐   │
│   │   Audit & Security    │ │   Compensation Mod   │ │ Event Bus    │   │
│   └───────────────────────┘ └──────────────────────┘ └──────────────┘   │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ (Row-Level Security / Pooler)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    ENTERPRISE PERSISTENCE ENGINE                        │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                  PostgreSQL / TimescaleDB                       │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│   ┌────────────────────────────────┐ ┌──────────────────────────────┐   │
│   │       Redis Cache (Shared)     │ │     S3 File Bucket Storage   │   │
│   └────────────────────────────────┘ └──────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Por que Monólito Modular e não Microsserviços puros?
* **Preservação de Ativos Existentes:** O Sauron possui uma base lógica consolidada excelente (`Core Engines`, `Analytics`, `Story Engine`, `People Intelligence`, etc.) escrita em TypeScript. Um monólito modular em TypeScript (Node.js/Express) permite empacotar e executar as mesmas bibliotecas lógicas diretamente no server-side sem alteração de domínio ou latência de rede inter-serviços (network overhead).
* **Consistência de Dados e Transações:** Na análise financeira, a consistência transacional do DRE e dos balancetes é primordial. O Monólito Modular compartilha um único banco de dados relacional PostgreSQL físico, mantendo transações ACID confiáveis, enquanto isola os domínios via esquemas lógicos e escopos de código bem delineados.
* **Complexidade Operacional Reduzida:** Um ecossistema de microsserviços exige infraestrutura de service mesh, tracing distribuído avançado e gerenciamento complexo de transações distribuídas (Saga Pattern). Para a escala de 10.000 usuários e 500 projetos corporativos, o monólito modular operado sob contêineres horizontais no Google Cloud Run entrega a máxima eficiência de custo-benefício e simplicidade de deploys rápidos.

---

### 2. ESTRATÉGIA DE TRANSICIONALIDADE (MIGRAÇÃO GRADUAL)
A migração da plataforma atual "Local-First / LocalStorage" para a plataforma híbrida SaaS ocorrerá de forma assíncrona por meio de um padrão **Strangler Fig (Padrão Figo Estrangulador)**:

1. **Preservação do Local State:** O Core atual do React continua manipulando dados em memória local para manter a reatividade instantânea (sub-milissegundo).
2. **Abstração de Persistência:** A camada `PersistenceManager` será atualizada para trocar o provider do `LocalStorageProvider` para um `HybridCacheProvider` (IndexedDB + API REST).
3. **Migração de Recursos Ativos:** Os recursos de sincronização de dados externos (Cargas de Planilhas e Integrações) serão as primeiras funcionalidades desviadas para rodar no backend Express.

---

### 3. VANTAGENS DO MODELO PROPOSTO
* **Latência de Interface Zero:** O client-side mantém o cache de leitura em IndexedDB, permitindo que as tabelas de dados contábeis e gráficos renderizem de forma sutil e ultra veloz.
* **Isolamento de Domínio Rígido:** Cada submódulo de negócio (Comissionamento, DRE, Rituais) possui uma estrutura de dados explícita que se conecta de forma limpa por meio de um barramento de eventos unificado.
* **Segurança Centralizada:** Toda e qualquer chamada de mutação de dados é verificada no gateway lógico do monólito, eliminando dependências de segurança exclusivas do navegador do cliente.

---

### 4. RISCOS MAIORES E PLANO DE MITIGAÇÃO

| ID | Risco Identificado | Severidade | Plano de Mitigação Técnico |
| :---: | :--- | :---: | :--- |
| **01** | **Degradação de performance do Node.js** sob alta carga de computação financeira ou consolidação de balancetes densos de holdings. | **Alta** | Uso de **Worker Threads** nativas do Node.js ou delegar o processamento pesado a microsserviços em servidores isolados (Serverless Containers). |
| **02** | **Conflito de merges de código** por acoplamento de rotas e dependências. | **Média** | Organização rígida de subdiretórios no backend por escopo de domínio e testes de regressão automatizados em CI/CD. |
| **03** | **Sincronização bidirecional incompleta** entre IndexedDB local e banco PostgreSQL. | **Alta** | Implementação de algoritmos de sincronização idempotente com relógio vetorial ou numeração sequencial de revisões logadas no banco. |

---

### 5. ARQUITETURA DE PLUGINS (Isolamento Setorial)
Regras de negócio específicas — como o cálculo de metas e de margens específico de concessionárias de veículos, ou tributações específicas do setor de varejo — serão encapsuladas sob o padrão de **Plugin Engine** (`PluginEngine`). 
* O Core do Sauron fornece ganchos (*Hooks*) e assinaturas lógicas.
* Os plugins setoriais estendem a interface, interpretam os lançamentos financeiros de forma isolada e injetam métricas customizadas na engine analítica, sem contaminar o núcleo contábil geral da plataforma.
