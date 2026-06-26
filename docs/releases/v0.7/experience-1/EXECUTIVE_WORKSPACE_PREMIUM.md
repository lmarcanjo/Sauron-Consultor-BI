# SAURON SX — EXECUTIVE WORKSPACE PREMIUM (Experience 1.1)
## docs/releases/v0.7/experience-1/EXECUTIVE_WORKSPACE_PREMIUM.md

Este documento estabelece as decisões de arquitetura de software, design de experiência do usuário (UX/UI) e critérios de aceite técnico para a **Experience 1.1 — Executive Workspace Premium**.

---

### 1. Filosofia de Design: O "Cockpit do Consultor"

O **Executive Workspace Premium** redefine a interface padrão (Home) do Sauron. O objetivo central é eliminar a sobrecarga cognitiva dos sistemas legados de ERP e substituí-la por um centro de controle unificado que responda à pergunta crítica de um parceiro de consultoria em menos de 10 segundos: **"Qual é a situação real deste cliente hoje, e o que deve ser feito a seguir?"**.

#### Pilares Estéticos e Funcionais:
1. **Densidade Estética Premium**: Utilização de espaçamento equilibrado, tons profundos de ardósia (Slate-900 para áreas estruturais) combinados com cartões de conteúdo limpos, tipografia em display e sinalização cromática consistente (esverdeado para saúde ideal, amarelado para atenção preventiva, avermelhado para desvios operacionais).
2. **Redução Maciça de Cliques (-50%)**: Fluxos críticos de carregamento de dados, agendamento de reuniões, criação de planos de ação e análise de saúde foram unificados em uma única interface reativa por meio de gavetas colapsáveis e formulários de ação rápida.
3. **Visão Não-Linear**: Substituição da clássica estrutura tabular sequencial por um painel de cockpit focado no *Daily Brief* automatizado e nos layouts dinâmicos de projeto.

---

### 2. Especificação Técnica dos Módulos

#### 2.1. Hero Section (Cabeçalho de Leitura Rápida)
Exibe metadados de alto nível de forma unificada:
- **Identificação**: Nome do Cliente, Grupo Econômico, Segmento.
- **Contexto Temporal**: Período Contábil Ativo selecionado.
- **Rastreabilidade**: Nome do Consultor Líder do projeto, data/hora da última atualização (auditada pelo `AuditEngine`) e Status Geral ("Em Conformidade" vs. "Atenção Requerida").

#### 2.2. Executive Overview (Os Quatro Grandes Pilares)
Logo abaixo do cabeçalho, quatro cartões imponentes formam o coração do cockpit:
1. **Health Score Geral**: Um gauge circular dinâmico que reflete a média ponderada das cinco dimensões de qualidade do projeto.
2. **Status de Dados**: Conectores e planilhas ativos, com data de faturamento de referência.
3. **Próxima Reunião**: Ritual executivo agendado, pauta e responsável.
4. **Planos de Ação**: Razão volumétrica de pendências vs. metas de caixa concluídas no Kanban.

#### 2.3. Daily Brief Automático (Painel Operacional)
Substitui relatórios complexos por uma saudação inteligente e resumos baseados em regras rígidas estruturadas:
- **Algoritmo de Triagem**: Analisa as coleções de dados, planos de ação, apresentações estruturadas e datas de rituais do `ConsultantWorkspaceManager`.
- **Tradução de Regras**:
  - Se houver planilhas importadas ou conexões de banco ativas: `✓ Dados de faturamento integrados`.
  - Se houver colunas mapeadas e `filteredData` ativo: `✓ KPIs validados`.
  - Se houver ações pendentes ou atrasadas no Kanban: `⚠ X ações pendentes/atrasadas`.
  - Se houver rituais registrados: `✓ Reunião estratégica agendada`.

#### 2.4. Filtros Dinâmicos Colapsáveis
Reduz a poluição visual condensando o formulário em um contêiner colapsável:
- **Estado Contraído**: Exibe apenas o número de filtros ativos (Ex: `"Filtros ativos: Marcas (Jeep), Filiais (Norte Veículos)"`).
- **Estado Expandido**: Renderiza seletores limpos de filial, marca, CNPJ e período, integrando-se diretamente com o motor reativo de filtragem do Sauron.

#### 2.5. Conexões Rápidas (Pequenos Cards de Status)
Exibe o estado de integridade do ambiente com micro-indicadores luminosos (🟢 Ativo, 🟡 Pendente, 🔴 Desconectado):
- **PostgreSQL ERP**: Estado da conexão transacional segura.
- **Planilhas**: Estado da importação local temporária.
- **VPN Gateway**: Status de proteção de rede.
- **APIs Governamentais**: Verificação de disponibilidade de layouts de prefeituras.

#### 2.6. Health Score Multidimensional
Transforma o indicador de saúde em um componente visual rico, subdividido em 5 barras de progresso reativas:
- **Qualidade dos Dados (25%)**: Integração ativa e homologada.
- **Mapeamento de KPIs (15%)**: Validação das colunas financeiras estruturais.
- **Filtros Ativos (20%)**: Parametrização da abrangência corporativa.
- **Apresentações Executivas (20%)**: Existência de slides prontos no Presentation Studio.
- **Plano de Caixa (20%)**: Existência de metas operacionais ativas.

#### 2.7. Conceito Inovador: Layouts de Workspace
O consultor pode alternar instantaneamente o layout da Home do Workspace para focar em rituais específicos. Cada layout pré-configurado oculta ou reorganiza os painéis visíveis:
- **Fechamento Mensal**: Foco no preenchimento do checklist operacional, conexões rápidas e ingestão de dados.
- **Diretoria**: Prioriza o gauge de Health Score, o Daily Brief e a linha do tempo cronológica.
- **Comercial**: Traz à frente o Kanban de Planos de Ação e o painel de KPIs comerciais.
- **Financeiro**: Destaca conexões com o banco real ERP e a auditoria do caixa.
- **Auditoria**: Evidencia a timeline cronológica do `AuditEngine` e o log de integridade de dados reais.
- **Personalizado**: Exibe todos os cartões e widgets ativos simultaneamente para controle total.

---

### 3. Garantias de Arquitetura e Engenharia

1. **Relação Unidirecional de Estado (Sem Duplicação)**: O componente `ExecutiveWorkspace` consome dados de forma puramente consultiva dos singletons `consultantWorkspaceManager`, `analyticsEngine` e `auditEngine`.
2. **Modo Somente Leitura Respeitado**: Nenhuma ação do cockpit gera comandos destrutivos (DCL/DDL) no banco PostgreSQL do cliente.
3. **Persistência de Layout Local**: A escolha do layout do cockpit pelo consultor é mantida no LocalStorage do projeto ativo para garantir continuidade operacional.
