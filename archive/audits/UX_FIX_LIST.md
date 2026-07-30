# LISTA DE REFINAMENTOS DE UX (UX FIX LIST) — SAURON PLATFORM
## SPRINT Ω+QA — DIRETRICES DE USABILIDADE ENTERPRISE

---

## 1. INTRODUÇÃO E FILOSOFIA DE DESIGN

O **Sauron Platform** é uma plataforma operacional voltada para consultores corporativos de elite. Interfaces para o C-Suite exigem extrema clareza, alta legibilidade, minimalismo elegante e facilidade na tomada de decisão. 

Este documento audita as falhas heurísticas atuais da plataforma (como excesso de informação, campos confusos, botões ocultos, ausência de estados vazios amigáveis e scrolls desnecessários) e especifica as correções necessárias para alinhar o produto aos padrões globais de SaaS de alta performance.

---

## 2. MAPA DE REFINAMENTOS DE USABILIDADE (UX)

### Item 1 — Sobrecarga de Informação nas Tabelas de Dados Brutos
* **Diagnóstico**: Na aba **Central de Dados** e **DRE**, há tabelas massivas contendo dezenas de colunas horizontais (ex: CNPJs de filiais, UUIDs de faturamento, hashes de integridade) exibidos sem paginação ou possibilidade de colapsamento de colunas secundárias.
* **Impacto**: Sobrecarga cognitiva severa. O consultor perde o foco das anomalias críticas no meio de dados redundantes de infraestrutura técnica.
* **Ação Corretiva**: 
  1. Implementar o padrão de design **Exibição Progressiva (Progressive Disclosure)**.
  2. Mostrar por padrão apenas 4 colunas financeiras core (Faturamento, Custo, Margem %, Lucro).
  3. Ocultar dados secundários de auditoria em um Drawer lateral de detalhes, acessado ao clicar em uma linha da tabela.
  4. Implementar paginação de no máximo 10 registros por exibição.
* **Impacto no Negócio**: Transmite clareza analítica instantânea nas apresentações com clientes.
* **Prioridade**: **Crítico**

---

### Item 2 — Estados Vazios (Empty States) sem Onboarding Ativo
* **Diagnóstico**: Ao criar um novo **Caso** ou excluir fontes de dados existentes, os gráficos do Recharts e tabelas somem ou quebram visualmente, mostrando retângulos cinzas vazios ou telas em branco sem instruções sobre a próxima ação do usuário.
* **Impacto**: Sensação de instabilidade do sistema no primeiro contato pós-onboarding (Time-To-Value muito longo).
* **Ação Corretiva**: 
  1. Adicionar condicionais de renderização nos gráficos e tabelas para exibir ilustrações minimalistas ou mensagens informativas quando não houver dados.
  2. Texto sugerido: *"Nenhum dado financeiro importado para esta unidade. Importe uma planilha de faturamento ou conecte seu banco de dados para ativar este dashboard. [Importar Planilha agora]"*, contendo um link/botão discreto de redirecionamento para a aba correspondente.
* **Prioridade**: **Alta**

---

### Item 3 — Inputs Flutuantes e Controles Financeiros Soltos
* **Diagnóstico**: Os seletores de offset de receitas, offsets de despesas e simulação de margens de contribuição estão soltos nos cabeçalhos das telas financeiras, competindo por atenção com os KPIs agregados de topo de funil.
* **Impacto**: Risco do consultor alterar um offset por engano e conduzir rituais com o conselho exibindo dados distorcidos sem perceber que está em "modo de simulação".
* **Ação Corretiva**:
  1. Agrupar todos os controles de parâmetros financeiros em um painel colapsável lateral direito dedicado ("Painel de Simulação de Cenários").
  2. Aplicar um fundo de destaque visual sutil (ex: âmbar muito suave ou azul profundo) e um selo luminoso visível *"MODO SIMULAÇÃO ATIVO"* no cabeçalho global quando qualquer offset for diferente de zero.
* **Prioridade**: **Média**

---

### Item 4 — Botões Escondidos no Construtor de Apresentações
* **Diagnóstico**: No **ApresentacoesTab.tsx**, as ações de duplicar deck, excluir versão de rascunho e aprovar ata para a diretoria corporativa estão escondidas sob cliques duplos ou pequenos ícones no canto dos slides sem rótulo textual de descrição.
* **Impacto**: Recursos vitais de governança não são encontrados pelo consultor sem treinamento prévio exaustivo.
* **Ação Corretiva**:
  1. Substituir os botões baseados apenas em ícones pequenos por botões estruturados contendo ícone e texto explicativo (ex: *"Aprovar Deck"* ou *"Exportar Slide"*).
  2. Implementar dicas de contexto (tooltips) ao pairar o mouse sobre botões secundários de controle.
* **Prioridade**: **Alta**

---

### Item 5 — Scrolls Horizontais e Verticais Desnecessários (ERP Layouts)
* **Diagnóstico**: Em resoluções de tela padrão (1920x1080 ou inferiores), o layout principal força rolagem vertical excessiva para ler dados simples, e rolagem horizontal em tabelas pequenas devido ao excesso de espaçamentos (paddings) redundantes aplicados nos contêineres de cards.
* **Impacto**: Interface com sensação de "sistemas antigos de ERP", cansativa de navegar.
* **Ação Corretiva**:
  1. Otimizar os paddings utilizando escalas fluidas do Tailwind CSS (reduzir de `p-8` para `p-5` ou `p-6` em grades de dashboards).
  2. Adotar a estrutura de **Bento Grid** com proporções estéticas fixas e respiros inteligentes (negative space), impedindo o empilhamento linear infinito de componentes.
* **Prioridade**: **Média**

---

### Item 6 — Fluxo de Login Multifásico Sem Atalho para Demonstração
* **Diagnóstico**: O login multifásico do `LoginScreen.tsx` (Wizard) é espetacular para simular governança, mas exige 4 cliques exaustivos toda vez que o consultor precisa demonstrar a plataforma rapidamente em chamadas de vendas de 5 minutos.
* **Impacto**: Fricção desnecessária no momento crítico de demonstração de produto para potenciais clientes corporativos (pitch de vendas).
* **Ação Corretiva**:
  1. Adicionar um botão discreto de *"Acesso Rápido (Modo Demo)"* na primeira tela do portal de login.
  2. Ao ser clicado, este botão executa automaticamente a escolha do perfil de Consultor Administrador, da Organização Nissan Feira e do Caso Ativo, entrando instantaneamente no Centro de Comando Executivo com zero fricção.
* **Prioridade**: **Alta**

---

## 3. CHECKLIST HEURÍSTICA DE UX ENTERPRISE

- [ ] **Visibilidade do Estado do Sistema**: Garantir spinners de carregamento e botões desabilitados com texto "Processando..." em todas as operações de sincronização de banco de dados e upload de planilhas.
- [ ] **Prevenção de Erros**: Implementar diálogos de confirmação (AlertDialog) com o usuário antes de excluir permanentemente Casos de Consultoria, Versões de Apresentação ou Fontes de Dados.
- [ ] **Consistência e Padrões**: Garantir que todos os modais e painéis colapsáveis sigam o mesmo padrão dimensional e de animações do Framer Motion.
- [ ] **Estética e Minimalismo**: Manter apenas dados essenciais nas telas de negócios principais e delegar relatórios exaustivos para abas de download ou drawers de detalhamento.

---
*Documento heurístico aprovado pelo comitê de usabilidade e engenharia de interface do Sauron OS.*
