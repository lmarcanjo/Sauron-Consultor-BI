# SAURON SX DESIGN FREEZE — COMPONENT PATTERNS (03/10)
## docs/releases/v0.7/design-freeze/03_COMPONENT_PATTERNS.md

Este documento define e especifica as regras de construção visual e arquitetura de componentes da plataforma Sauron a partir da Release v0.7. Ele estabelece diretrizes para garantir que todo elemento de tela siga o mesmo padrão rigoroso de acabamento.

---

### 1. Padrão de KPI Cards (Indicadores Chave)
- **Cabeçalho**: Título curto em letra maiúscula discreta (`text-xs font-medium text-slate-400 tracking-wider`), acompanhado de um ícone minimalista de apoio no canto superior direito.
- **Conteúdo**: O valor numérico principal deve ser exibido com destaque tipográfico (`text-3xl font-semibold text-slate-900` ou `text-slate-100`).
- **Rodapé**: Uma linha fina informando a tendência de forma numérica e visual (e.g., "+12.4% vs mês anterior" com seta discreta e cor condicional), seguida do **Data Lineage Badge** em micro-texto mono.

---

### 2. Padrão de Gráficos (Charts Container)
- Os gráficos devem estar sempre contidos em um card estruturado com título de seção claro e seletor de granularidade de tempo (e.g., Mensal, Trimestral) no cabeçalho do card.
- **Pureza Visual**: Gráficos devem omitir grades excessivas em segundo plano, rótulos repetitivos de eixos ou paletas de cores arco-íris. Use tons degradês suaves da cor Royal Blue ou cinzas executivos.
- **Interatividade**: Tooltips de passagem de mouse devem ser customizados para apresentar os valores formatados em moeda (R$), percentuais (%) ou unidades brutas de forma polida, sem quebrar os limites da tela.

---

### 3. Padrão de Tabelas (Data Tables)
- **Cabeçalhos de Tabela**: Fundo suave cinza ou slate com texto em negrito discreto e alinhamento consistente com os dados (e.g., textos alinhados à esquerda, números financeiros alinhados à direita).
- **Linhas**: Devem possuir efeito sutil de hover (`hover:bg-slate-50` ou `hover:bg-slate-800/50`) para facilitar o acompanhamento visual do consultor em tabelas de auditoria densas.
- **Paginação / Limitação**: Exibir no máximo 10 linhas por página, permitindo carregar o restante via paginação fluída ou expandir a tela em modal de tamanho grande.

---

### 4. Padrão de Filtros e Seletores (Filters & Selectors)
- Filtros globais (Empresa, Filial, Marca, Período) devem residir de forma estática no cabeçalho do projeto ativo ou em uma barra de controle flutuante fixa no topo.
- Os seletores devem possuir busca integrada em tempo real (search inline) para permitir encontrar filiais ou contas específicas em planos de contas com centenas de registros.

---

### 5. Padrão de Gavetas e Modais (Drawer & Dialogs)
- **Gaveta Lateral (Drawer)**: Ocupa `380px` de largura na lateral direita, deslizando com animação de entrada suave. É usada exclusivamente para o registro síncrono de notas de reuniões, atas rápidas ou cadastro dinâmico de planos de ação.
- **Modal Central (Dialog)**: Utilizado para configurações pesadas de conexões de banco de dados ERP, mapeamento completo de colunas ou visualização detalhada do hash de linhagem de dados brutos. Deve apresentar sobreposição cinza desfocada (`backdrop-blur-sm`) sobre o resto da tela para focar a atenção do usuário no processo.
