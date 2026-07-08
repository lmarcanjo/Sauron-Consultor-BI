# SAURON SX — INFORMATION ARCHITECTURE (v0.7)
## Arquitetura de Informação e Estrutura de Telas

Este documento define a hierarquia, organização e agrupamento de todas as funcionalidades e visualizações operacionais que constituem a experiência de uso da plataforma Sauron a partir da **Release v0.7**.

---

### 1. Árvore de Arquitetura de Informação

```
Sauron Platform (SaaS Console)
├── Seleção de Projetos (Workspace Selector)
├── Projetos / Workspace
│   ├── Home Dashboard (Resumo Executivo, Health Score, Linha do Tempo)
│   │
│   ├── Central de Ingestão de Dados (ETL Central)
│   │   ├── Banco de Dados (Configuração de Conectores ERP Read-Only)
│   │   ├── Planilhas (Upload de Planilhas e Mapeamento de Colunas)
│   │   └── Linhagem de Dados (Lotes, Hashes e Auditoria de Cargas)
│   │
│   ├── Diagnósticos & Analytics
│   │   ├── Tendências (Variações Históricas por Filtros)
│   │   ├── Anomalias (Desvios Críticos Ordenados por Severidade)
│   │   └── Benchmarks (Comparações e Ranks Internos de Lojas/Marcas)
│   │
│   ├── Presentation Studio (Módulo Executivo)
│   │   ├── Story Builder (Organizador de Decks, Slides e Roteiros)
│   │   └── Modo Reunião (Apresentação Imersiva, Atas e Ações em Tempo Real)
│   │
│   └── Planos de Ação (Acompanhamento e Cobrança de Metas)
│       ├── Kanban / Lista de Pendências
│       └── Histórico de Reuniões e Atas
│
└── Configurações Administrativas
    └── Perfil do Consultor, Tenant Config e Custom Branding
```

---

### 2. Responsabilidades de Cada Módulo

#### Seleção de Projetos (Workspace Selector)
*   **Responsabilidade**: Permitir a transição fluída entre diferentes contas de clientes ativos.
*   **Regra de Governança**: Ao trocar o projeto, todo o cache de estado analítico local deve ser limpo e reiniciado para garantir isolamento absoluto de dados.

#### Home Dashboard
*   **Responsabilidade**: Ser a central de inteligência imediata do projeto.
*   **Elementos Chave**:
    *   *Health Score*: Nota gerada a partir da quantidade de metas batidas e anomalias corrigidas.
    *   *Meeting Timeline*: Um resumo rápido das datas de encontros passados e agendamento da próxima assembleia.

#### Central de Ingestão de Dados (ETL Central)
*   **Responsabilidade**: Unificar todos os canais de alimentação do sistema (planilhas locais ou conexões de bancos).
*   **Regra de Governança**: É expressamente proibida a mistura de dados. Todos os lotes recebem hashes criptográficos e selos de validação de estrutura.

#### Diagnósticos & Analytics
*   **Responsabilidade**: Analisar deterministicamente a base financeira ingerida.
*   **Composição**: Motores especialistas que alimentam os gráficos e análises visuais de tendências operacionais, desvios incomuns e ranks de concorrência.

#### Presentation Studio
*   **Responsabilidade**: Eliminar o PowerPoint da rotina da consultoria, atuando como o motor de criação de histórias e apresentação de slides.
*   **Regras de Negócio**: Slides devem refletir dinamicamente a base de dados em tempo real sob os filtros ativos aplicados.

#### Planos de Ação
*   **Responsabilidade**: Garantir o acompanhamento pós-reunião.
*   **Conexão**: Itens podem ser criados diretamente de dentro do Modo Reunião ou da tela de diagnósticos, centralizando a responsabilidade de execução de cada recomendação proposta.
