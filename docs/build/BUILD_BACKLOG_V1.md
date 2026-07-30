# ASTERION — Backlog de Construção da Versão 1.0 (`BUILD_BACKLOG_V1.md`)

---

# Visão Geral

Este documento traduz formalmente toda a Constituição do Produto, a Jornada do Consultor (`CONSULTANT_JOURNEY.md`), a Especificação do Workspace (`ENGAGEMENT_WORKSPACE.md`) e os Fluxos de UX (`FLOW_02_CONNECT_DATA.md`) em um backlog de execução estruturado para engenharia de produto.

O desenvolvimento da Versão 1.0 é sequencial e incremental. Cada Épico representa um bloco funcional autônomo e entregável.

---

# Épico 1: Gestão de Carteira e Estrutura Organizacional (Onboarding)

## Objetivo
Permitir que o consultor gerencie sua carteira de clientes, cadastre novos engajamentos e mapeie a estrutura organizacional do cliente (Grupos Econômicos, Empresas e Filiais) antes da recepção dos dados.

## Valor para o ICP
Elimina a bagunça de arquivos e pastas soltas em drives locais, permitindo organizar o perímetro de atuação da consultoria em segundos.

## Dependências
Nenhuma (Épico Fundação).

## Critérios de Aceite Globais do Épico
- O consultor consegue visualizar todos os engajamentos ativos na sua carteira.
- É possível cadastrar um cliente, criar um engajamento e definir suas Empresas e Unidades.
- A empresa é inicializada obrigatoriamente no estado canônico **`NO_SOURCE`**.

## Funcionalidades

### F1.1: Painel da Carteira do Consultor
- **Descrição**: Exibição centralizada de todos os engajamentos sob responsabilidade do profissional com seus respetivos status canônicos e reuniões agendadas.
- **Critérios de Aceite**: Exibir clientes ativos, estado atual de cada conta e destacar prazos e reuniões iminentes.
- **Dependências**: Nenhuma.
- **Prioridade**: P0 (Bloqueante).

### F1.2: Cadastro de Engajamento e Seleção de Modelo
- **Descrição**: Criação de um novo engajamento vinculado a um cliente com escolha do modelo consultivo de referência (Financeiro, Comercial, etc.).
- **Critérios de Aceite**: Criar o engajamento no sistema, vincular à conta e associar o modelo de métricas escolhido.
- **Dependências**: F1.1.
- **Prioridade**: P0 (Bloqueante).

### F1.3: Mapeamento da Árvore Organizacional (Grupo, Empresa e Unidade)
- **Descrição**: Cadastro da arborescência organizacional do cliente para recepção de dados.
- **Critérios de Aceite**: Permitir criar Grupos Econômicos, Empresas e Filiais/Unidades, mantendo o estado em `NO_SOURCE`.
- **Dependências**: F1.2.
- **Prioridade**: P0 (Bloqueante).

---

# Épico 2: Conexão e Recepção Bruta de Dados

## Objetivo
Implementar a infraestrutura de conexão e recepção de arquivos físicos (`.xlsx`, `.csv`, `.ods`) e bancos SQL, garantindo a imutabilidade da fonte de origem e a atribuição ao contêiner organizacional.

## Valor para o ICP
O consultor não precisa abrir o Excel para formatar ou ajustar arquivos antes de importar.

## Dependências
Épico 1 (Estrutura Organizacional existente).

## Critérios de Aceite Globais do Épico
- Suporte completo a planilhas Excel, LibreOffice, CSV e bancos SQL.
- A fonte importada é vinculada a uma Empresa/Grupo e transita o estado para **`SOURCE_CONNECTED`**.
- O arquivo original é mantido intocado e imutável.

## Funcionalidades

### F2.1: Receptor de Arquivos Físicos e Conexão SQL
- **Descrição**: Mecanismo de recepção de arquivos multiformato e validação de credenciais de conexão SQL.
- **Critérios de Aceite**: Aceitar arquivos sem corrupção e validar testes de ping em servidores SQL.
- **Dependências**: Épico 1.
- **Prioridade**: P0 (Bloqueante).

### F2.2: Vinculador Organizacional de Fontes
- **Descrição**: Associação formal da fonte importada a uma Empresa, Grupo ou Filial.
- **Critérios de Aceite**: Atribuir o ID organizacional e transitar o estado da empresa para `SOURCE_CONNECTED`.
- **Dependências**: F2.1.
- **Prioridade**: P0 (Bloqueante).

### F2.3: Tratamento de Exceções de Conexão (Multifaixa & Duplicados)
- **Descrição**: Resolução de arquivos duplicados por hash e desmembramento lógico de planilhas contendo múltiplos CNPJs ou empresas.
- **Critérios de Aceite**: Alertar arquivos duplicados sem travar o sistema e permitir split lógico de CNPJs com 1 clique.
- **Dependências**: F2.2.
- **Prioridade**: P1 (Alta).

---

# Épico 3: Descoberta Autônoma e Perfilar do Caos (Profiling)

## Objetivo
Executar a leitura autônoma das fontes de dados, realizando a análise estatística, contagem de registros, sanitização de ruídos e pré-classificação semântica dos campos.

## Valor para o ICP
Substitui o trabalho braçal de conferir colunas e linhas por uma leitura instantânea e explicável gerada pelo sistema.

## Dependências
Épico 2 (Dados conectados em `SOURCE_CONNECTED`).

## Critérios de Aceite Globais do Épico
- Leitura 100% autônoma de abas e colunas.
- Transição dos estados da empresa para **`DISCOVERING`** e posteriormente **`WAITING_CONFIRMATION`**.
- Sanitização de datas e tipos misturados sem destruição dos dados brutos.

## Funcionalidades

### F3.1: Engine do Perfil do Caos (Perfilador Estatístico)
- **Descrição**: Leitura de linhas, colunas, tipos de dados, incidência de nulos e integridade das planilhas/tabelas.
- **Critérios de Aceite**: Gerar a contagem estatística completa e isolar ruídos de digitação em log auditável.
- **Dependências**: Épico 2.
- **Prioridade**: P0 (Bloqueante).

### F3.2: Classificador Semântico de Domínios Financeiros
- **Descrição**: Identificação autônoma de papéis conceituais de colunas (Receita, Custo, Categoria, Data, Unidade).
- **Critérios de Aceite**: Mapear os campos aos conceitos do modelo consultivo e transitar para `WAITING_CONFIRMATION`.
- **Dependências**: F3.1.
- **Prioridade**: P0 (Bloqueante).

### F3.3: Resolutor de Inconsistências de Data e Tipos Híbridos
- **Descrição**: Normalização automática de formatos híbridos de data e conversão segura de moeda/texto.
- **Critérios de Aceite**: Padronizar datas para o calendário fiscal da empresa sem perder a rastreabilidade física.
- **Dependências**: F3.1.
- **Prioridade**: P1 (Alta).

---

# Épico 4: Validação Única do Entendimento pelo Consultor

## Objetivo
Apresentar a síntese explicável da fonte e disponibilizar a ação soberana única de validação pelo consultor, destravando o diagnóstico.

## Valor para o ICP
Garante total controle e segurança ao consultor sem exigir telas complexas de aprovação ou botões duplicados.

## Dependências
Épico 3 (Empresa em `WAITING_CONFIRMATION`).

## Critérios de Aceite Globais do Épico
- Apresentar a narrativa explicável do que a fonte representa.
- Disponibilizar a ação única **`Validar entendimento da empresa`**.
- Transitar o estado da empresa para **`READY`** e liberar todos os diagnósticos.

## Funcionalidades

### F4.1: Painel de Síntese e Dúvidas Agrupadas
- **Descrição**: Exibição da explicação sintética dos dados e agrupamento de dúvidas de classificação para revisão rápida.
- **Critérios de Aceite**: Permitir ao consultor ajustar o papel de qualquer coluna com ambiguidade de nomenclatura.
- **Dependências**: Épico 3.
- **Prioridade**: P0 (Bloqueante).

### F4.2: Portão Canônico de Validação (`Validar Entendimento`)
- **Descrição**: Mecanismo de aceite formal que consolida o entendimento da fonte e destrava o engajamento.
- **Critérios de Aceite**: Acionar a CTA única, gravar o log imutável de aceite e transitar a empresa para `READY`.
- **Dependências**: F4.1.
- **Prioridade**: P0 (Bloqueante).

---

# Épico 5: Workspace de Engajamento e Diagnósticos Executivos

## Objetivo
Disponibilizar o Workspace de Engajamento com suas 11 Áreas Principais, liberando a DRE Inteligente, cálculo de margens, módulos analíticos e rastreabilidade total de dados (*Data Lineage*).

## Valor para o ICP
Entrega o diagnóstico financeiro completo em minutos, com a capacidade de provar a origem de qualquer número direto no dado bruto do cliente.

## Dependências
Épico 4 (Empresa no estado `READY`).

## Critérios de Aceite Globais do Épico
- Exibição de todas as áreas do Workspace configuradas na especificação de UX.
- Cálculo correto de DRE, EBITDA e Margens.
- Rastreabilidade ponta a ponta (*Data Lineage*) ativa em qualquer métrica exibida.

## Funcionalidades

### F5.1: Motor de Direcionamento Ativo (Próximas Decisões)
- **Descrição**: Componente do Workspace que projeta ostensivamente a próxima ação recomendada, pendências e riscos.
- **Critérios de Aceite**: Atualizar dinamicamente a recomendação prioritária a cada mudança no engajamento.
- **Dependências**: Épico 4.
- **Prioridade**: P0 (Bloqueante).

### F5.2: DRE Inteligente e Calculadora de Margens Certificadas
- **Descrição**: Consolidação da Demonstração do Resultado do Exercício e indicadores de EBITDA e Margem de Contribuição.
- **Critérios de Aceite**: Exibir DRE estruturada com linhagem auditável até o registro físico original.
- **Dependências**: Épico 4.
- **Prioridade**: P0 (Bloqueante).

### F5.3: Inspecionador de Linhagem de Dados (Data Lineage)
- **Descrição**: Recurso que permite ao consultor clicar em qualquer valor do diagnóstico e visualizar o arquivo, aba, linha e coluna originais.
- **Critérios de Aceite**: Exibir a trilha de auditoria completa da métrica sem alterar o dado de origem.
- **Dependências**: F5.2.
- **Prioridade**: P1 (Alta).

---

# Épico 6: Apresentação Executiva, Reuniões e Planos de Ação

## Objetivo
Permitir a geração autônoma do deck de slides executivos, condução interativa de Sessões Executivas, registro de atas e desdobramento em Planos de Ação com acompanhamento continuado.

## Valor para o ICP
Elimina a necessidade de criar apresentações manuais no PowerPoint e garante que as decisões aprovadas na reunião se transformem em tarefas executadas no cliente.

## Dependências
Épico 5 (Diagnósticos calculados em `READY`).

## Critérios de Aceite Globais do Épico
- Geração automática da Apresentação Executiva conectada aos números certificados.
- Registro de atas e deliberações ao vivo na Sessão Executiva.
- Atribuição e acompanhamento de Planos de Ação com responsáveis e prazos.

## Funcionalidades

### F6.1: Gerador de Apresentações Executivas Rastreáveis
- **Descrição**: Motor de compilação de slides executivos baseados no diagnóstico certificado da empresa.
- **Critérios de Aceite**: Gerar deck narrativo com resumo, indicadores, pontos de atenção e recomendações rastreáveis.
- **Dependências**: Épico 5.
- **Prioridade**: P0 (Bloqueante).

### F6.2: Modo de Sessão Executiva e Coletor de Ata Ao Vivo
- **Descrição**: Ambiente de condução da reunião com diretoria contendo cronômetro, pauta e registro instantâneo de deliberações.
- **Critérios de Aceite**: Permitir anotar decisões ao vivo vinculadas aos slides e encerrar a reunião com ata gravada.
- **Dependências**: F6.1.
- **Prioridade**: P1 (Alta).

### F6.3: Gestor e Acompanhador de Planos de Ação
- **Descrição**: Matriz de tarefas estratégicas derivadas do diagnóstico com atribuição de responsáveis no cliente, prazos e controle de status.
- **Critérios de Aceite**: Criar tarefas, vincular às anomalias financeiras e calcular o percentual de execução do plano.
- **Dependências**: F6.2.
- **Prioridade**: P0 (Bloqueante).

---

# Sequência de Entrega da Versão 1.0 (Roadmap de Engenharia)

```
┌──────────────────────────────────────────────────────────┐
│  Épico 1: Gestão de Carteira e Estrutura (Onboarding)     │
└────────────────────────────┬─────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────┐
│  Épico 2: Conexão e Recepção Bruta de Dados               │
└────────────────────────────┬─────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────┐
│  Épico 3: Descoberta Autônoma e Perfilar do Caos         │
└────────────────────────────┬─────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────┐
│  Épico 4: Validação Única do Entendimento                │
└────────────────────────────┬─────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────┐
│  Épico 5: Workspace de Engajamento e Diagnósticos         │
└────────────────────────────┬─────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────┐
│  Épico 6: Apresentação Executiva, Reuniões e Ações        │
└──────────────────────────────────────────────────────────┘
```
