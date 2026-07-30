# SAURON SX — EXECUTIVE WORKSPACE (Experience 1)
## docs/releases/v0.7/experience-1/EXECUTIVE_WORKSPACE.md

Este documento especifica o escopo, arquitetura, fluxos de uso e critérios de aceitação do **Executive Workspace**, que atua como a nova tela inicial padrão (Home) para o consultor da plataforma Sauron a partir da Release v0.7.

---

### 1. Objetivo
O **Executive Workspace** centraliza o controle operacional e analítico de um projeto de consultoria ativo. Ele substitui a navegação desarticulada baseada em abas por uma visão holística e orientada a ações que responde imediatamente à pergunta do consultor: **"O que eu preciso fazer agora?"**.

---

### 2. Fluxo e Ergonomia Visual
Ao abrir um projeto, o consultor cai nesta tela principal, que exibe de forma hierárquica e limpa:
1.  **Header Dinâmico**: Dados estruturados do cliente, segmento corporativo, período contábil ativo e número de empresas consolidadas.
2.  **Health Score**: Um medidor visual circular ou em barra de progresso (0-100) que calcula dinamicamente a aderência do projeto através de regras claras de pontuação (qualidade de dados, configuração de filtros, presença de planos de ação, etc.).
3.  **Próximos Passos (Smart Checklist)**: Um assistente inteligente que acusa ausências de apresentações criadas, reuniões, metas em aberto ou sincronização de dados pendentes.
4.  **Estado das Fontes de Dados**: Status imediato dos lotes de planilhas locais carregados e conexões com o ERP (PostgreSQL), incluindo as datas de última atualização.
5.  **Histórico de Atividades Recentes**: Uma linha do tempo unificada de auditoria mostrando importações, atualizações, criações de análises, agendamento de reuniões e lavratura de atas.

---

### 3. Responsabilidades e Integrações Técnicas
O componente visual do Executive Workspace atua como uma camada pura de renderização, integrando-se de forma direta e sem duplicação de estados com os motores do Sauron Core:
-   **ConsultantWorkspaceManager**: Recupera informações persistidas de projetos ativos, reuniões agendadas, planos de ação e as atas lavradas pelo conselho executivo.
-   **DataEngine / useDataSourceManager**: Consome o status atual dos dados carregados, se há planilhas ativas e as credenciais de banco ERP configuradas.
-   **AnalyticsEngine**: Fornece as métricas financeiras consolidadas em tempo real e os diagnósticos para cálculo do índice de saúde financeira.
-   **PresentationManager**: Verifica se apresentações foram estruturadas e decks de slides de reunião estão disponíveis para o período de referência selecionado.
-   **AuditEngine**: Puxa os logs de auditoria e atividades operacionais executadas no workspace para alimentar a linha do tempo cronológica.

---

### 4. Regras do Health Score do Projeto (Algoritmo de Qualidade)
Para garantir rigor analítico sem alucinações, o Health Score do projeto é calculado em tempo real sob as seguintes regras determinísticas:
-   **Status de Dados (25%)**: 100% se houver registros carregados e aprovados pelo consultor; 0% caso contrário.
-   **Filtros de Dashboard (20%)**: 100% se o consultor tiver configurado filtros operacionais específicos no projeto; 0% caso contrário.
-   **KPIs Definidos (15%)**: 100% se as colunas financeiras cruciais (Receita, Custos, Despesas) forem mapeadas com sucesso.
-   **Apresentações Estruturadas (20%)**: 100% se houver pelo menos 1 deck de slides ou relatório salvo no Presentation Studio.
-   **Planos de Ação Ativos (20%)**: 100% se houver pelo menos 1 plano de ação cadastrado no Kanban; 0% caso contrário.
-   **Pontuação Geral**: Média ponderada destas 5 dimensões do projeto, oferecendo o status de conformidade do projeto.

---

### 5. Critérios de Aceitação
O Executive Workspace será homologado se, e somente se, atender aos seguintes requisitos:
-   Ao abrir a plataforma, se houver um projeto ativo, o sistema exibe o **Executive Workspace** em vez da tela padrão anterior de gráficos dispersos.
-   O consultor consegue criar novos projetos, alternar entre projetos ativos ou arquivar projetos com persistência garantida no LocalStorage do navegador.
-   Se o projeto não possui dados ou configurações, todos os alertas e o checklist de pendências são mostrados de forma coerente e amigável (Workspace Vazio).
-   Se o projeto possui todos os passos cumpridos, o Health Score de 100% e as atividades recentes aparecem povoadas (Workspace Completo).
-   Toda atualização de dados, criação de reuniões ou adição de tarefas atualiza o Health Score e a timeline de forma síncrona.
-   Os testes unitários e de integração em Vitest cobrem as regras do score de saúde, preenchimento do checklist e persistência local de estados.
