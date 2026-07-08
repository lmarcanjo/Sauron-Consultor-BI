# SAURON SX — RELEASE BACKLOG (v0.7)
## Mapeamento de Épicos e Histórias de Desenvolvimento da Release v0.7

Este documento consolida o planejamento de engenharia dividindo o escopo total de desenvolvimento do **Sauron Executive Experience (v0.7)** em Épicos bem-definidos, contendo prioridades, complexidades e critérios de aceite detalhados para o time técnico.

---

### Épicos Planejados

```
┌────────────────────────────────────────────────────────┐
│                    Épicos da Release v0.7              │
├────────────────────────────┬───────────────────────────┤
│ Epic 1: Executive Home     │ Epic 2: ETL Central       │
│ Epic 3: Story Builder      │ Epic 4: Executive Meeting │
│ Epic 5: Action Board       │ Epic 6: Data Lineage      │
└────────────────────────────┴───────────────────────────┘
```

---

### Epic 1: Executive Home Dashboard
*   **Objetivo**: Implementar o painel inicial do workspace do projeto do cliente contendo o score de saúde do negócio e linha do tempo de reuniões passadas.
*   **Valor para o Consultor**: Permite sintonizar rapidamente o status do cliente antes de entrar na sala de fechamento de resultados.
*   **Critérios de Aceite**:
    *   Exibir o Health Score de 0 a 100 de forma reativa aos dados reais do cliente.
    *   Exibir a linha do tempo cronológica com atas e decisões passadas.
*   **Complexidade**: Baixa.
*   **Prioridade**: **ALTA**.

### Epic 2: Central de Ingestão de Dados (ETL Central)
*   **Objetivo**: Unificar em uma única tela as configurações de banco (ERP Read-Only) e a área de upload de planilhas.
*   **Valor para o Consultor**: Simplifica a atividade mais burocrática de coleta e saneamento de bases de dados do cliente.
*   **Critérios de Aceite**:
    *   Fornecer toggles claros alternando canais de dados (XLS vs. PostgreSQL).
    *   Garantir integridade, acusando erros estruturais de colunas antes de persistir o lote.
*   **Complexidade**: Média-Alta.
*   **Prioridade**: **ALTA**.

### Epic 3: Story Builder (Presentation Studio)
*   **Objetivo**: Desenvolver o painel de montagem e customização do roteiro de slides de reuniões.
*   **Valor para o Consultor**: Acaba com a necessidade de extrair capturas de tela dos gráficos para colar em slides do PowerPoint externo.
*   **Critérios de Aceite**:
    *   Permitir arrastar, reordenar e excluir blocos de slides representativos de KPIs.
    *   Disponibilizar painel lateral para anotações e comentários personalizados de texto por slide.
*   **Complexidade**: Alta.
*   **Prioridade**: **CRÍTICA**.

### Epic 4: Executive Meeting Mode
*   **Objetivo**: Construir a visualização de apresentação de slides em tela cheia de alta legibilidade para a sala de fechamento.
*   **Valor para o Consultor**: Garante uma apresentação imersiva com bloco de notas integrado para o registro síncrono de metas acordadas.
*   **Critérios de Aceite**:
    *   Executar o modo tela cheia nativo do navegador ao iniciar.
    *   Disponibilizar a gaveta colapsável lateral (Drawer) para ata e cadastro rápido de planos de ação.
*   **Complexidade**: Alta.
*   **Prioridade**: **CRÍTICA**.

### Epic 5: Action Board & Follow-up
*   **Objetivo**: Tela de gerenciamento Kanban de pendências de todas as ações pactuadas com os responsáveis do cliente corporativo.
*   **Valor para o Consultor**: Permite cobrar a entrega dos resultados das metas com base em prazos e donos definidos na assembleia mensal.
*   **Critérios de Aceite**:
    *   Exibir os cartões de ação organizados por status (Pendente, Em Andamento, Concluído).
    *   Possibilitar a filtragem por executor e período de vencimento.
*   **Complexidade**: Baixa-Média.
*   **Prioridade**: **MÉDIA**.

### Epic 6: Data Lineage Integration
*   **Objetivo**: Integrar os badges de auditoria de dados (hash e data de carga) visíveis em cada slide e KPI da apresentação.
*   **Valor para o Consultor**: Entrega confiabilidade absoluta sobre os números exibidos na reunião frente ao conselho executivo.
*   **Critérios de Aceite**:
    *   Disponibilizar badges discretos clicáveis ou com tooltip exibindo a origem exata do dado em cada gráfico de slide.
*   **Complexidade**: Média.
*   **Prioridade**: **MÉDIA**.
