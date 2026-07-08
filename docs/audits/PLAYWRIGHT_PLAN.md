# PLANO DE TESTES DE PONTA A PONTA (PLAYWRIGHT E2E PLAN) — SAURON PLATFORM
## SPRINT Ω+QA — SUÍTE DE TESTES E AUTOMAÇÃO DE CONFIABILIDADE

---

## 1. INTRODUÇÃO E ESTRATÉGIA DE TESTES

A estabilização do **Sauron Platform** exige automação de testes robusta. Não basta que o código compile com sucesso ou passe no linter; os fluxos operacionais e as jornadas de governança do consultor empresarial devem ser simuladas e validadas automaticamente de ponta a ponta.

Este documento estabelece o plano oficial de testes E2E usando **Playwright**, estruturando cenários críticos de negócio, seletores recomendados, dados de entrada e critérios objetivos de aceitação de engenharia.

---

## 2. ARQUITETURA DA SUÍTE DE TESTES

* **Framework**: Playwright (TypeScript).
* **Escopo**: Testes de fumaça (Smoke Tests) e fluxos funcionais completos (User Journeys).
* **Isolamento de Estado**: Cada arquivo de teste deve rodar sob um contexto limpo do navegador, autenticando via API ou injetando estados pré-configurados no `localStorage`.
* **Identificadores Únicos**: Em conformidade com as diretrizes do Sauron, todos os elementos interativos testados devem conter atributos `id` exclusivos (ex: `<button id="btn-sync-database" ...>`).

---

## 3. MAPEAMENTO DETALHADO DOS CENÁRIOS DE TESTE

### Cenário 1 — Criar Caso de Consultoria
* **Objetivo**: Validar a criação de um novo Workspace de projeto na área do consultor.
* **Passos**:
  1. Acessar a página de Login e escolher o papel de `Super Admin`.
  2. Navegar até a aba de **Projetos de Consultoria** ou **Casos**.
  3. Clicar no botão `id="btn-create-case"`.
  4. Preencher o formulário (Nome: "Indústria Metalúrgica Sul", DNA: "Indústria", Marcas: "SulMetal", Lojas: "Matriz").
  5. Clicar em `id="btn-save-case"`.
* **Critério de Aceite**: O novo caso deve aparecer na lista e estar disponível no dropdown de switch global de casos no topo da tela.

---

### Cenário 2 — Importar Planilha de Excel
* **Objetivo**: Testar o upload de planilhas financeiras com mapeamento de colunas.
* **Passos**:
  1. No painel do caso ativo, navegar até a aba **Conectar Dados** (`id="tab-dados"`).
  2. Acionar a área de upload de arquivos (`id="file-uploader-input"`), anexando a planilha de teste `faturamento_nissan_feira.xlsx`.
  3. Selecionar o mapeamento de colunas sugerido (Mapear cabeçalho "Vendas Brutas" para o esquema "Receita").
  4. Clicar em `id="btn-validate-mappings"`.
  5. Confirmar a importação final (`id="btn-confirm-import"`).
* **Critério de Aceite**: O sistema deve apresentar mensagem de sucesso, gerar um hash de integridade e atualizar a trilha de auditoria para o evento `DB_SYNC_SUCCESS`.

---

### Cenário 3 — Conectar Banco de Dados
* **Objetivo**: Validar a configuração, salvamento e ping de bancos remotos.
* **Passos**:
  1. Na aba **Conectar Dados**, clicar na seção **Conector de Banco** (`id="tab-banco-connector"`).
  2. Preencher credenciais de teste PostgreSQL (Host: `localhost`, Porta: `5432`, Banco: `sauron_faturamento`, Usuário: `postgres`).
  3. Ativar o seletor de simulação de VPN (`id="switch-vpn-tunnel"`).
  4. Clicar em `id="btn-test-connection"`.
  5. Clicar no botão `id="btn-save-db-config"`.
* **Critério de Aceite**: O sistema deve exibir "Ping com sucesso via VPN", salvar a configuração no arquivo `db_config.json` e registrar o log correspondente.

---

### Cenário 4 — Abrir e Auditar DRE Inteligente
* **Objetivo**: Verificar se o demonstrativo de resultados do exercício exibe dados e reage a filtros de simulação.
* **Passos**:
  1. Navegar até a aba **Diagnóstico** e selecionar o sub-item **DRE** (`id="tab-dre-inteligente"`).
  2. Verificar se a tabela exibe valores numéricos consistentes de Receita Líquida e Margem de Contribuição.
  3. Modificar o slider de offset de despesas para `+10%` (`id="slider-offset-despesas"`).
* **Critério de Aceite**: O lucro líquido e os gráficos de quebra de custos Recharts devem reajustar-se em tempo real na viewport.

---

### Cenário 5 — Abrir Diagnóstico Comercial
* **Objetivo**: Certificar o dashboard de performance de vendas e canais comerciais.
* **Passos**:
  1. Navegar até a sub-aba **Comercial** (`id="tab-comercial"`).
  2. Aplicar o filtro de filiais selecionando a marca "SulMetal".
* **Critério de Aceite**: Os KPIs agregados de ticket médio, volume de leads e taxa de conversão devem atualizar de acordo com os filtros aplicados.

---

### Cenário 6 — Abrir People Intelligence (Dossiê)
* **Objetivo**: Verificar a jornada de capital humano e abertura de dossiês individuais.
* **Passos**:
  1. Acessar a aba **Pessoas** e clicar no sub-item **Performance de Vendedores** (`id="tab-comissoes"`).
  2. Na lista de colaboradores, clicar sobre o registro de um vendedor (ex: "Carlos Eduardo").
* **Critério de Aceite**: O painel lateral ou drawer deve exibir o dossiê detalhado contendo a timeline de evolução funcional e vendas acumuladas.

---

### Cenário 7 — Calcular Comissões e Regras de Incentivo
* **Objetivo**: Validar o motor de cálculo matemático de comissão por faturamento ou margem líquida.
* **Passos**:
  1. No dossiê do colaborador, selecionar a regra de cálculo "Cascata Progressiva de Faturamento".
  2. Modificar a meta mínima para R$ 50.000,00 e clicar em `id="btn-recalculate-commissions"`.
* **Critério de Aceite**: O valor de comissão líquida atualizado deve refletir os coeficientes da fórmula matemática sem erros de arredondamento.

---

### Cenário 8 — Gerar PDF de Impressão de Comissões
* **Objetivo**: Certificar a renderização limpa do relatório de folhas para assinatura.
* **Passos**:
  1. No painel de comissões, clicar no botão `id="btn-print-report"`.
  2. O teste deve interceptar o acionamento de `window.print()` e analisar as classes aplicadas no contêiner.
* **Critério de Aceite**: O contêiner de impressão deve ocultar a barra lateral do Sauron (`id="sidebar-nav"`) e exibir as linhas físicas de assinatura do colaborador e do gestor, acompanhados de data e local.

---

### Cenário 9 — Criar e Editar Executive Story
* **Objetivo**: Validar a criação de decks de apresentação de resultados.
* **Passos**:
  1. Navegar até a aba **Preparar Decisão** e clicar em **Narrativa Executiva** (`id="tab-narrativa"`).
  2. Clicar em `id="btn-new-presentation-deck"`.
  3. Adicionar um slide de diagnóstico estratégico e editar o título para "Diretrizes de Turnaround".
  4. Clicar em `id="btn-save-presentation"`.
* **Critério de Aceite**: O deck deve constar na lista de decks ativos com status de "Rascunho".

---

### Cenário 10 — Apresentar Story Decks
* **Objetivo**: Validar o modo imersivo de apresentação de slides.
* **Passos**:
  1. No deck de slides criado no Cenário 9, clicar no botão de apresentar (`id="btn-play-presentation"`).
* **Critério de Aceite**: A viewport deve entrar em modo tela cheia, ocultando todos os elementos do sistema operacional do Sauron OS (como menus secundários e sidebar), permitindo apenas controles de passar slide (`&rarr;`) e voltar (`&larr;`).

---

### Cenário 11 — Abrir Meeting (Sessão Executiva)
* **Objetivo**: Certificar o painel de condução de conselhos corporativos de alto nível.
* **Passos**:
  1. Navegar até a aba **Sessões** e clicar em **Sessão Executiva** (`id="tab-modo-reuniao"`).
  2. Clicar em `id="btn-start-executive-session"`.
* **Critério de Aceite**: O cronômetro de pauta deve iniciar automaticamente de forma decrescente, e o painel de rituais deve renderizar a pauta correspondente do DNA ativo.

---

### Cenário 12 — Criar Ata de Reunião com Parser de Notas
* **Objetivo**: Validar a captura automática de tarefas e decisões durante o ritual.
* **Passos**:
  1. Na Sessão Executiva ativa, digitar no campo de notas rápidas (`id="input-session-notes"`):
     - *"Discutido turnaround financeiro. [Decisão] Reduzir despesas administrativas em 15%."*
     - *"[Ação: @Carlos] Renegociar contratos de aluguel até dia 15."*
  2. Clicar em `id="btn-save-notes"`.
* **Critério de Aceite**: O parser deve extrair a decisão e a ação de forma estruturada, listando "Reduzir despesas" na ata de decisões e atribuindo a tarefa ao usuário "Carlos" nos planos de ação ativos automaticamente.

---

### Cenário 13 — Gerar Plano de Ação Estratégico
* **Objetivo**: Validar o acompanhamento de metas táticas geradas a partir de rituais.
* **Passos**:
  1. Navegar até a aba **Planos** (`id="tab-planos"`).
  2. Verificar se a tarefa extraída no Cenário 12 ("Renegociar contratos de aluguel") consta no quadro tático.
  3. Modificar o status da tarefa para "Concluído" clicando em `id="checkbox-task-complete"`.
* **Critério de Aceite**: O indicador de progresso global das metas do caso de consultoria deve atualizar-se com o encerramento da tarefa, persistindo o estado.

---

### Cenário 14 — Trocar Usuário (Simulação de Papéis)
* **Objetivo**: Validar a troca dinâmica de escopo de governança usando a barra de identidades.
* **Passos**:
  1. Na barra de simulação superior ou no menu, clicar em trocar perfil.
  2. Selecionar o perfil de `Client Manager`.
* **Critério de Aceite**: O sistema deve invalidar a exibição do menu de "Administração" (Auditoria de logs, permissões de infraestrutura) na sidebar, limitando a visualização apenas a telas setoriais.

---

### Cenário 15 — Trocar Empresa (Multi-Tenant Workspace Context)
* **Objetivo**: Validar o isolamento de dados entre diferentes corporações no SaaS.
* **Passos**:
  1. No dropdown de organizações no topo, selecionar a corporação "Metalúrgica Sul".
* **Critério de Aceite**: Todos os KPIs, gráficos de DRE, colaboradores e atas de reuniões exibidos devem ser readequados imediatamente aos dados exclusivos da "Metalúrgica Sul", assegurando a inexistência de vazamento de contexto.

---

## 4. CRONOGRAMA DE IMPLANTAÇÃO DOS TESTES E2E

* **Fase 1 (Próxima Sprint)**: Implementação de arquivos `.spec.ts` para os Cenários de 1 a 5 (Jornada básica de onboarding de dados e diagnóstico).
* **Fase 2**: Implementação dos Cenários de 6 a 10 (People Intelligence e Executive Story Decks).
* **Fase 3**: Implementação dos Cenários de 11 a 15 (Sessões Executivas, Atas com Parser e isolamento de multi-tenancy).

---
*Plano de automação validado pelo conselho técnico de engenharia e QA do Sauron OS.*
