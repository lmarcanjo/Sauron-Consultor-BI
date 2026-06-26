# SAURON PRODUCT BIBLE
## O Guia Estratégico e de Produto Definitivo da Plataforma Sauron

---

### 1. Visão do Produto
O **Sauron** é o Sistema Operacional definitivo para consultores empresariais e auditores de negócios. Ele transforma a consultoria analítica de uma atividade manual e fragmentada em um ecossistema digital inteligente, onde a ingestão segura de dados brutos gera diagnósticos determinísticos automáticos, planos de ação estratégicos e apresentações executivas com rastreabilidade total de dados (*Data Lineage*).

---

### 2. Missão
Capacitar consultores de negócios com precisão matemática e inteligência consultiva avançada, eliminando o retrabalho de compilação de dados e promovendo a transparência nas decisões estratégicas corporativas.

---

### 3. Valores
- **Confiança Absoluta**: Números não mentem e devem ser auditáveis até a sua origem mais fundamental.
- **Simplicidade Sofisticada**: Design limpo que oculta a extrema complexidade operacional de centenas de fontes de dados.
- **Arquitetura Purista**: Código estruturado onde lógica de negócios e renderização visual nunca se misturam.
- **Orientação a Resultados**: Cada análise ou diagnóstico gerado pelo sistema deve apontar para uma ação corretiva com responsável e prazo nítidos.

---

### 4. Filosofia de Desenvolvimento
A arquitetura do Sauron é fundamentada na integridade, previsibilidade e modularidade. Nós não praticamos "Tech-Larping" (inserção de ruídos estéticos artificiais que simulam inteligência ou tecnologia). Nós construímos motores puramente matemáticos e determinísticos que entregam valor real aos tomadores de decisão de forma limpa e humana.

---

### 5. Personas

#### Persona Principal: O Consultor (Carlos, 45 anos)
- **Perfil**: Sócio-fundador ou consultor sênior de uma empresa de assessoria em controladoria e finanças.
- **Necessidades**: Centralizar informações de múltiplos clientes, importar dados financeiros brutos sem erros de digitação, gerar análises comparativas rápidas entre filiais e preparar slides executivos de fechamento mensal.
- **Frustrações**: Passar finais de semana inteiros cruzando planilhas de clientes no Excel; cometer pequenos erros de cálculo em apresentações que quebram sua credibilidade perante a diretoria do cliente.

#### Persona Secundária: O Cliente Final (Mariana, 38 anos)
- **Perfil**: Diretora Financeira ou CEO de um grupo econômico de varejo ou rede de concessionárias.
- **Necessidades**: Visualizar a saúde global das suas marcas, compreender desvios operacionais rapidamente e validar a origem de cada métrica exibida na mesa de decisões.
- **Frustrações**: Apresentações de consultorias genéricas baseadas em PDF estáticos sem possibilidade de filtros interativos ou auditoria da fonte transacional original.

---

### 6. Jornadas do Usuário

#### Jornada do Consultor
1. **Onboarding**: O consultor cria um `WorkspaceProject` dedicado ao grupo econômico de seu novo cliente.
2. **Conexão**: Configura conexões aos bancos de ERPs locais (read-only) ou monta o `WorkspaceImportProfile` para os relatórios e planilhas enviados pelo cliente.
3. **Ingestão**: Importa os lotes mensais via `DataSourceManager`, registrando as ações no log de auditoria.
4. **Análise**: O `AnalyticsEngine` gera anomalias, benchmarks de filiais, variações de tendências e recomendações.
5. **Apresentação**: O consultor utiliza o `Presentation Studio` para arrastar e ordenar os slides de resultados.
6. **Reunião**: Entra em Modo Reunião, conduz a assembleia, registra observações de ata e desdobra decisões em planos de ação imediatos (`ActionPlans`).

#### Jornada do Cliente Final
1. **Acompanhamento**: Acessa o painel dedicado do projeto para verificar as metas financeiras em tempo real.
2. **Validação**: Clica nas métricas apresentadas e visualiza a linhagem exata da importação que deu origem àquele indicador.
3. **Execução**: Gerencia e atualiza os prazos e ações sob sua responsabilidade direta nos planos de ação traçados em reunião.

---

### 7. Casos de Uso Críticos
- **Consolidação de Grupos Econômicos**: Unificar a DRE e KPIs de dezenas de filiais que usam diferentes CNPJs ou marcas em um único dashboard consolidado.
- **Auditoria Preventiva de Custos**: Rodar o `AnomalyEngine` em centros de custos específicos para detectar gastos não mapeados ou desvios absurdos de despesas administrativas de forma autônoma.
- **Benchmark Competitivo Interno**: Ranquear filiais ou departamentos com base em KPIs de margem de contribuição ajustada.

---

### 8. Problemas que o Sauron Resolve
- **O gargalo do cruzamento de dados**: Automatiza tarefas repetitivas de ETL e digitação manual de relatórios.
- **A falta de rastreabilidade do BI tradicional**: Mostra de onde os dados vieram, evitando o cenário comum em que diretores debatem se os dados exibidos no dashboard são confiáveis ou incorretos.
- **A perda de histórico e planos de ação órfãos**: Conecta reuniões passadas diretamente aos planos de ação ativos, impedindo que decisões caiam no esquecimento.

---

### 9. Diferenciais Competitivos
- **Desacoplamento por Segmentos**: Motor de plugins que permite customizar a experiência analítica por indústria (concessionárias, agro, franquias) sem inchar ou quebrar o core financeiro transversal.
- **Foco Executivo em Negócios**: Em vez de fornecer planilhas gigantes de BI que demandam interpretação, o Sauron fornece narrativas em português explicativas com recomendações prescritivas claras.

---

### 10. Funcionalidades Premium Futuras
- **Sincronização Avançada de VPNs Corporativas**: Conexão otimizada e agendada em background a ERPs locais de forma totalmente criptografada.
- **Plataforma Multiusuário Síncrona**: Tela compartilhada ativa onde consultores em diferentes escritórios podem estruturar decks de fechamento juntos em tempo real.

---

### 11. Direcionamentos Estratégicos

#### Estratégia SaaS (Software as a Service)
Migração segura de armazenamento local para um modelo multi-tenant com segurança de dados blindada e cobrança baseada no número de projetos de consultoria ativos e volume de dados processados mensalmente.

#### Estratégia Cloud
Implantação via contêineres independentes no Cloud Run e bancos transacionais PostgreSQL (Cloud SQL) protegidos por isolamento de tenants, com logs centralizados de auditoria no Google Cloud Logging.

#### Estratégia Mobile
Interface de visualização responsiva e ágil desenvolvida especificamente para tablets e dispositivos móveis, permitindo ao consultor revisar métricas ou monitorar reuniões em deslocamento de forma integrada.

#### Estratégia AI Advisor
Introdução assistida de modelos generativos (via Gemini API) para enriquecer o `NarrativeEngine` e propor análises preditivas inovadoras, desde que nenhum número ou cálculo dependa diretamente da IA para ser processado (preservando o core matemático 100% determinístico e auditável).

#### Estratégia Plugin Marketplace
Abertura de APIs para que terceiros ou especialistas de mercado possam criar e rentabilizar novos plugins contendo regras de segmentos específicas diretamente na plataforma.

#### Estratégia SDK
Oferecer bibliotecas de código (`@sauron/sdk`) que permitam a desenvolvedores de ERPs integrar e ler dados processados ou diagnósticos do Sauron diretamente em seus softwares nativos.

---

### 12. Metas e Objetivos de 5 Anos (Visão 2031)
- **Ano 1**: Consolidar o Core operacional, conquistar os primeiros 10 consultores de fechamentos piloto e lançar o módulo de apresentações integrado.
- **Ano 2**: Lançar a base multi-tenant de nuvem (SaaS completo), expandindo a capacidade de múltiplos usuários e históricos infinitos de auditoria.
- **Ano 3**: Criar o marketplace inicial de plugins setoriais, convidando consultores de nicho para validar e empacotar KPIs customizados.
- **Ano 5**: Consolidar o Sauron como a principal plataforma de software de governança e controladoria consultiva para médias consultorias do Brasil, processando relatórios financeiros auditados de mais de 10.000 empresas integradas.
