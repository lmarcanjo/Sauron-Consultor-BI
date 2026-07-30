# SAURON PRODUCT GLOSSARY
## O Glossário de Negócios e Técnico Unificado da Plataforma

Este documento define e uniformiza a terminologia conceitual de negócios e termos técnicos utilizados em toda a plataforma **Sauron**. Qualquer desenvolvedor, consultor ou inteligência artificial trabalhando no Sauron deve seguir esta taxonomia unificada de termos.

---

### Termos Estruturais e Organizacionais

#### Tenant
A entidade de segurança máxima do SaaS. Representa uma empresa de consultoria licenciada contratante do Sauron. Um Tenant possui seus próprios consultores e seus próprios dados, sendo totalmente isolado dos demais de forma física ou lógica no banco de dados.

#### Cliente
O cliente de Carlos (o consultor). Trata-se de uma corporação, empresa individual ou holding sob acompanhamento do escritório de consultoria ativa.

#### Grupo / Grupo Econômico
A estrutura agregadora que congrega múltiplas empresas, filiais ou marcas sob o mesmo controle societário do cliente final da consultoria.

#### Empresa / Filial
Uma unidade corporativa autônoma detentora de um CNPJ individual dentro do grupo econômico de um cliente.

#### Loja
A designação física e comercial de um ponto de venda associado a um CNPJ. Usado principalmente em plugins específicos de varejo ou concessionárias.

#### Marca / Bandeira
A fabricante ou representação comercial associada à empresa (e.g., uma filial de concessionária pode ter a bandeira "Fiat" e outra a bandeira "Toyota").

#### Centro de Custo
A subdivisão interna de controle financeiro de uma filial, responsável por registrar gastos de despesas específicas (e.g., Centro de Custo Comercial, Centro de Custo de Oficina, Centro de Custo Administrativo).

#### Conta / Conta Contábil
A classificação de receitas e despesas que compõem o plano de contas e estruturam a DRE (e.g., Receita Bruta, Custo de Peças, Despesa de Pessoal).

---

### Termos de Workspace e Apresentação

#### Workspace
O console digital de controle do consultor contendo todas as ferramentas de trabalho agregadas sob a ótica ativa de sua consultoria.

#### Projeto / WorkspaceProject
O contêiner virtual unificado que reúne de forma centralizada os filtros, credenciais seguras, planilhas importadas, diagnósticos analíticos, reuniões estruturadas, atas e planos de ação de um determinado cliente do consultor.

#### Story / Story Builder
O processo e módulo interativo em que o consultor seleciona, arrasta, ordena e configura o deck visual de slides contendo as análises determinísticas consolidadas para uma reunião estratégica de fechamento mensal.

#### Slide
O bloco de conteúdo visual e analítico estruturado projetado de forma dinâmica em Modo Reunião para consolidar um KPI, DRE ou diagnóstico de anomalia específico.

#### Insight
Uma inferência técnica de negócio ou detecção matemática valiosa e inesperada identificada automaticamente pelos motores da plataforma.

#### Data Lineage (Linhagem de Dados)
A capacidade do Sauron de demonstrar a trilha de integridade completa de qualquer número ou gráfico analítico na tela, demonstrando a data da carga, o volume de linhas do snapshot ativo e o hashing de segurança do arquivo de origem bruno original.

---

### Termos de Inteligência e Engines

#### Analytics Engine
A entidade orquestradora que unifica e executa os motores especialistas determinísticos de inteligência analítica de negócios.

#### Engine
Uma classe ou módulo computacional puramente funcional e matemático encarregado de processar regras específicas e isoladas do ecossistema técnico.

#### Manager
O gerenciador e coordenador de estados dinâmicos, rotinas complexas e persistências locais ou em nuvem no Sauron.

#### Trend (Tendência)
Análise de variações financeiras e operacionais ao longo de séries de períodos históricos (mensais, trimestrais ou anuais), determinando estabilidades, trajetórias e severidades de oscilação.

#### Recommendation (Recomendação Prescritiva)
Uma sugestão de conduta corporativa preventiva ou corretiva, estruturada com evidência, causa raiz, responsável e prazo estimados para sanar desvios.

#### Benchmark
A análise comparativa e ranqueamento interno de indicadores entre diferentes filiais, vendedores ou marcas pertencentes ao mesmo grupo societário sob assessoria do consultor.

#### Anomaly (Anomalia)
Uma quebra drástica de comportamento operacional ou financeiro que foge do comportamento histórico estável e demanda investigação pontual e auditoria imediata.

#### Plugin
Módulo autônomo e opcional que adiciona KPIs específicos de setores de indústria sem impactar ou alterar o código core central do software.
