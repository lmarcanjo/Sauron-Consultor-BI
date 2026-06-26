# SAURON SX — EXECUTIVE EXPERIENCE (v0.7)
## Especificação da Experiência Executiva do Consultor

Esta especificação define o padrão da **Reunião Perfeita** conduzida através da plataforma Sauron. O objetivo do módulo Sauron SX é elevar a reunião de fechamento estratégico mensal de um amontoado de relatórios frios para um ritual corporativo de alta relevância, focado em tomadas de decisões ágeis baseadas em dados determinísticos.

---

### 1. O Ritual da Reunião Perfeita
Uma reunião de resultados executivos bem-sucedida deve cumprir três metas:
1. **Verdade Única dos Dados**: O cliente e o consultor estão olhando para o mesmo número, sabendo exatamente de onde ele veio (Data Lineage).
2. **Foco Estratégico**: Não há perda de tempo debatendo cálculos ou gerando gráficos em tempo real; a plataforma aponta desvios e anomalias de forma proativa.
3. **Plano Acionável**: Toda decisão importante tomada em conjunto vira um plano de ação imediato com responsável e data-limite.

---

### 2. A Jornada do Consultor (Início, Meio e Fim)

#### O Preparo (Antes da Reunião)
- O consultor acessa o **Story Builder** e seleciona um template recomendado (e.g., "Fechamento Mensal Standard").
- O sistema gera um deck de slides pré-alimentado com os KPIs reais, anomalias e gráficos mensais do cliente.
- O consultor adiciona notas explicativas e observações estratégicas personalizadas diretamente no painel lateral do slide.

#### A Condução (O Início da Reunião)
- O consultor abre o projeto ativo em seu tablet ou laptop projetado na sala de reunião.
- Com um clique simples, ele ativa o **Modo Reunião**, ocultando menus laterais de configuração do sistema e expandindo a tela para projeção imersiva de alta legibilidade.
- O slide 1 exibe a "Síntese Executiva" gerada deterministicamente com as principais oscilações de faturamento e margem do período.

#### A Discussão de Desvios (O Meio da Reunião)
- Ao projetar o slide de custos operacionais, o consultor destaca um alerta crítico gerado pelo `AnomalyEngine`: *"Aumento atípico de 35% em despesas de marketing de concessionária"*.
- O cliente questiona a origem do número. Carlos passa o cursor ou clica no indicador e exibe o **Lineage Badge**: *"Origem: Relatório de Despesas Consolidadas Maio.xlsx, Ingerido em 25/06/2026 por Auditoria"*. A confiança é restabelecida na hora.

#### O Desdobramento e Encerramento (O Fim da Reunião)
- Para cada desvio financeiro debatido, o cliente e o consultor acordam uma ação corretiva.
- Sem sair da projeção, Carlos abre uma gaveta síncrona lateral e adiciona um item de **Ação Recomendada**: *"Revisar contratos de fornecedores de marketing; Responsável: Marcos (Diretor); Prazo: 10 dias"*.
- Ao encerrar a reunião, o sistema grava a **Ata de Reunião** no histórico e dispara e-mails automatizados com os planos de ação consolidados para os respectivos responsáveis.

---

### 3. Telas Percorridas no Processo
1. **Dashboard Home do Workspace**: O hub de partida do projeto do cliente.
2. **Central de Ingestão e Qualidade**: Apenas para validações pontuais caso haja novos dados extras recebidos de última hora.
3. **Story Builder (Presentation Studio)**: Onde os slides são selecionados, customizados e ordenados de forma intuitiva.
4. **Modo Reunião**: Visualização em tela cheia otimizada para projetores com controle síncrono de notas e planos de ação.
5. **Acompanhamento de Ações (Action Plans)**: Tela de fechamento onde as tarefas ativas de reuniões passadas são revisadas com o cliente.

---

### 4. Informações que Nunca Podem Faltar em Exibição
- **Filtro Ativo Visível**: O período, a empresa, o grupo e a bandeira selecionados devem estar sempre legíveis no topo de cada slide projetado.
- **Data Lineage Badge**: Indicativo discreto contendo o status de auditoria e a integridade da carga de dados correspondente.
- **Responsável por Planos Relacionados**: Exibição sutil de quem é o responsável pela entrega da meta do KPI em andamento no slide.
