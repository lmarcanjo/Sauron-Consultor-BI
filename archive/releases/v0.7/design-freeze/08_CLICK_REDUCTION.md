# SAURON SX DESIGN FREEZE — CLICK REDUCTION (08/10)
## docs/releases/v0.7/design-freeze/08_CLICK_REDUCTION.md

Este documento especifica a estratégia de usabilidade e ergonomia de interface focada em reduzir drasticamente o esforço de navegação e o número de cliques que o consultor (Carlos) realiza para executar suas tarefas fundamentais na plataforma Sauron a partir da Release v0.7.

---

### 1. Diretriz de Redução de Fricção (Zero Friction)
Para tornar o preparo e a condução de reuniões de resultados ágeis, o Sauron SX adota a meta de reduzir em **pelo menos 50%** o tempo físico gasto pelo consultor no manuseio de arquivos, parametrização de filtros e configuração de exibições gráficas.

---

### 2. Tabela de Otimização de Cliques e Fluxo de Tarefas

Abaixo, detalhamos o mapeamento comparativo do fluxo operacional do consultor no modelo atual (antes da v0.7) versus a nova arquitetura do ecossistema unificado do Sauron SX:

| Atividade e Fluxo de Trabalho | Processo Atual (Cliques / Etapas) | Processo Proposto SX (Cliques / Etapas) | Economia de Tempo e Ganho Operacional |
| :--- | :--- | :--- | :--- |
| **Ingerir e Validar Planilha** | **6 Cliques**<br>1. Ir para Importar<br>2. Escolher arquivo<br>3. Mapear colunas<br>4. Clicar validar<br>5. Confirmar lote<br>6. Ir para Dashboard | **2 Cliques / Drag & Drop**<br>1. Arrastar arquivo para ETL<br>2. Confirmar com Perfil automático | **Economia de ~3 minutos**<br>O sistema memoriza o layout anterior da planilha com o perfil de importação inteligente (`WorkspaceImportProfile`). |
| **Criar Análise de Desvios** | **5 Cliques**<br>1. Ir para Anomalias<br>2. Filtrar empresa<br>3. Filtrar período<br>4. Clicar em detalhar<br>5. Extrair capturas para PPT | **1 Clique (Home Widget)**<br>1. Clicar no Alerta de Anomalia na Home do Workspace | **Economia de ~10 minutos**<br>A anomalia com maior impacto financeiro de caixa é destacada automaticamente no painel principal. |
| **Preparar Slides de Resultados**| **Mais de 15 Cliques**<br>1. Capturar gráficos<br>2. Abrir software PPT externo<br>3. Criar slides<br>4. Copiar e colar dados<br>5. Escrever notas manuais | **3 Cliques (Story Builder)**<br>1. Ir para Presentation Studio<br>2. Selecionar template mensal<br>3. Clicar em Gerar Deck | **Economia de ~45 minutos**<br>O deck de slides é montado automaticamente pré-alimentado com os KPIs reais e análises do período. |
| **Iniciar Reunião Executiva** | **4 Cliques**<br>1. Abrir arquivo PPT<br>2. Ir para Modo Tela Cheia<br>3. Abrir bloco de notas separado<br>4. Abrir janela do browser | **1 Clique (F5)**<br>1. Clicar em "Iniciar Reunião" | **Economia de ~5 minutos**<br>A plataforma assume o controle de tela cheia nativo, abrindo o palco e a gaveta síncrona. |
| **Gerar Ata e Planos de Ação** | **Mais de 10 Cliques**<br>1. Anotar em caderno<br>2. Abrir editor de texto<br>3. Escrever ata<br>4. Enviar por e-mail<br>5. Cadastrar tarefas | **Zero Cliques Extras**<br>1. Cadastrados na gaveta de controle durante a reunião | **Economia de ~20 minutos**<br>O SauronSX compila a ata e envia os planos de ação consolidados automaticamente aos executores. |

---

### 3. Mecanismos Técnicos para Redução de Navegação
- **Filtro Persistente Global**: Selecionar um período ou uma empresa no topo de qualquer página do sistema atualiza o contexto dinamicamente de forma integrada. O consultor nunca precisará re-filtrar informações ao navegar pelas abas.
- **Teclas de Atalho de Alta Performance**: Implementação de escutas de teclado nativas para acelerar a transição de visualizações sem exigir cliques em menus secundários suspensos (e.g., atalho `F5` para iniciar reunião, `F2` para abrir notas, `ESC` para sair).
- **Widgets de Acesso Rápido (Deep Links)**: Alertas e relatórios de anomalias exibidos na home do workspace possuem redirecionamento imediato direto com os filtros exatos pré-configurados para a área de detalhamento daquela transação específica.
