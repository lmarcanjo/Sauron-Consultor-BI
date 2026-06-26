# SAURON SX — SCREEN SPECIFICATION (v0.7)
## Especificações de Telas e Comportamentos de Interface

Este documento especifica de forma detalhada o layout, comportamento, widgets, interações, tratamentos de erro e estados de carregamento das principais telas que compõem o sistema a partir da **Release v0.7**.

---

### Tela 1: Home Dashboard do Projeto

*   **Objetivo**: Oferecer uma visão aérea consolidada de um projeto de consultoria ativo antes das reuniões estratégicas.
*   **Usuário**: Consultor e Cliente Diretor.
*   **Widgets e Conteúdo**:
    *   *Health Score Card*: Um medidor visual circular (0-100) indicando a aderência financeira do cliente (metas alcançadas vs. anomalias em aberto).
    *   *Meeting Timeline Card*: Cronograma contendo as datas e atas resumidas das últimas 3 reuniões e o agendamento da próxima assembleia.
    *   *Alert Panel*: Desvios críticos de custos identificados nas últimas cargas de dados pendentes de análise.
    *   *Workspace Status Widget*: Indicação de conformidade e lineage dos dados ativos.
*   **Ações e Botões**:
    *   Botão "Ver Detalhes do Health Score" -> Abre modal de diagnóstico de metas.
    *   Botão "Agendar Reunião de Resultados" -> Cria um marcador na agenda de tarefas.
*   **Estados Especiais**:
    *   *Loading*: Skeleton animado simulando a estrutura circular do score e as linhas da timeline.
    *   *Empty State*: Ilustração minimalista cinza indicando "Sem dados ingeridos" com atalho direto "Ir para Central de Ingestão".
    *   *Error*: Alerta vermelho informando: "Falha ao consolidar o health score do projeto. Verifique a consistência dos dados do ERP".

---

### Tela 2: Central de Ingestão de Dados (ETL Central)

*   **Objetivo**: Centralizar e simplificar a carga, validação e auditoria de fontes de dados.
*   **Usuário**: Consultor, Analista Financeiro e Engenheiro de Integração.
*   **Widgets e Conteúdo**:
    *   *Canal Selector*: Toggle superior permitindo alternar entre "Planilhas Excel/CSV" e "Conectores de Banco ERP (PostgreSQL)".
    *   *Drag & Drop Area*: Retângulo pontilhado amplo para upload de arquivos.
    *   *Database Config Form*: Inputs de credenciais e host para conexão de leitura (Read-Only).
    *   *Lote History Table*: Tabela de logs contendo Data da Carga, Nome do Arquivo, Volume de Linhas, Hashing de Segurança (SHA-256) e Status de Integridade.
*   **Ações e Botões**:
    *   Botão "Testar Conexão de Banco" -> Dispara o teste read-only e exibe status síncrono.
    *   Botão "Salvar Perfil de Mapeamento" -> Cria um atalho reutilizável de colunas.
*   **Estados Especiais**:
    *   *Loading*: Spinner circular com texto dinâmico: *"Lendo estrutura de colunas do lote..."*.
    *   *Error*: Mensagem em banner vermelho detalhando as linhas com inconsistência de dados ou DNS não encontrado na tentativa de VPN.

---

### Tela 3: Presentation Studio (Story Builder)

*   **Objetivo**: Permitir a montagem, customização e ordenação ágil de apresentações estratégicas de fechamento.
*   **Usuário**: Consultor de Finanças.
*   **Widgets e Conteúdo**:
    *   *Template Selector*: Carrossel horizontal de temas pré-configurados de reunião.
    *   *Story Grid / Timeline*: Área central onde os slides ativos são arrastados, ordenados e deletados.
    *   *Preview Canvas*: Visualização prévia em miniatura do slide selecionado contendo o gráfico de dados correspondente.
    *   *Custom Notes Editor*: Editor de notas e anotações laterais que serão exibidas como apoio estratégico ao consultor.
*   **Ações e Botões**:
    *   Botão "Adicionar Slide Personalizado" -> Abre catálogo de componentes visuais analíticos.
    *   Botão "Iniciar Modo Reunião (SX)" -> Dispara a visualização em tela cheia do Modo Reunião.
*   **Estados Especiais**:
    *   *Empty State*: Texto informando "Nenhuma apresentação ativa para este período. Escolha um template acima para começar em segundos".

---

### Tela 4: Modo Reunião (Executive Meeting Mode)

*   **Objetivo**: Proporcionar uma visualização imersiva, elegante e de altíssima legibilidade para apresentação e controle de resultados em tempo real.
*   **Usuário**: Consultor e Corpo Diretor do Cliente.
*   **Widgets e Conteúdo**:
    *   *Slide Stage Area*: 100% da área útil dedicada à projeção do slide ativo (KPIs, tabelas limpas de DRE, rankings de benchmark).
    *   *Header de Controle*: Exibição constante e discreta do nome do Projeto, Período Ativo e Seletores de Empresa/Filial.
    *   *Gaveta Lateral de Ata e Ações (Collapsible Drawer)*: Painel ocultável na lateral direita contendo anotações de ata rápidas e o formulário de cadastro de metas imediatas.
*   **Ações e Botões**:
    *   Setas "Próximo Slide" / "Slide Anterior" no rodapé esquerdo.
    *   Botão "Abrir Gaveta de Controle (F2)" -> Expande o painel síncrono de notas.
    *   Botão "Encerrar Reunião" -> Fecha o modo imersivo e dispara a compilação da ata.
*   **Estados Especiais**:
    *   *Responsive Sizing*: O palco de slides (Stage Canvas) se adapta e redimensiona dinamicamente a qualquer monitor ou tela de projeção sem quebrar proporções gráficas.
