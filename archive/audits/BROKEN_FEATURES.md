# RELATÓRIO DE DEFEITOS E FUNCIONALIDADES INCOMPLETAS (BROKEN FEATURES)
## SPRINT Ω+QA — MAPEAMENTO REAL DE DÉBITO TÉCNICO E ESTABILIZAÇÃO

---

## 1. DIRETRIZ E POSTURA DE ENGENHARIA

O Sauron OS não tolera simulações de infraestrutura disfarçadas de prontas em ambientes produtivos. Para que o produto mude oficialmente de fase, toda funcionalidade anunciada deve ser real e operável. 

Este relatório detalha as funcionalidades que estão atualmente quebradas, parcialmente implementadas ou operando de forma limitada, especificando sua prioridade, impacto de negócios, causa provável e plano real de correção técnica.

---

## 2. LISTA DE FALHAS E DEFEITOS MAPEADOS

### Falha 1 — Mecanismo de Rollback de Planilhas via Banco de Dados Real
* **Status**: ⚠ Funciona Parcialmente (Simulado Localmente)
* **Impacto**: **Crítico** (Pode causar inconsistências de dados se o consultor interromper uma importação na metade)
* **Causa Provável**: O processo de importação e mapeamento de planilhas na aba **Central de Dados** salva os snapshots históricos de forma atômica no arquivo local `reports_history.json`. Se ocorrer um erro no meio de uma importação massiva, não há uma transação SQL real sendo iniciada e abortada no banco de dados do cliente, deixando dados parcialmente inseridos em caso de conexões diretas.
* **Plano de Correção**:
  1. Integrar o motor de transações do Prisma (`prisma.$transaction`) no backend de importação.
  2. Implementar uma fila de processamento no BullMQ (`apps/worker`) com isolamento transacional estrito por lote de inserção (batching).
  3. No caso de falha de qualquer bloco de faturamento da filial, reverter automaticamente o estado de inserção para o snapshot anterior antes de atualizar o status do trabalho para `FAILED`.

---

### Falha 2 — Exportação de PDF da Narrativa Executiva / Story Decks
* **Status**: ❌ Não Funciona de Forma Nativa (Usa Gambiarra do Browser)
* **Impacto**: **Alto** (Apresentações de conselho de administração exigem PDFs elegantes para distribuição prévia por e-mail, e o padrão atual corta gráficos)
* **Causa Provável**: A exportação de slides na aba **Executive Story** aciona a função nativa `window.print()` do navegador do cliente. Embora o CSS use diretrizes `@media print` para ocultar barras laterais e cabeçalhos, os gráficos baseados em SVG do Recharts sofrem cortes visuais bruscos de margem de página, além do navegador forçar quebras de linha que quebram o design C-Suite.
* **Plano de Correção**:
  1. Desenvolver uma rota de backend dedicada no NestJS (`/api/v1/story/:id/export-pdf`) usando a biblioteca **Puppeteer**.
  2. O servidor deve instanciar um navegador Chromium headless em segundo plano, carregar a visualização de apresentação específica do Story, aplicar a folha de estilo de impressão exata sem margens e exportar em um arquivo PDF nativo de alta fidelidade.
  3. Disponibilizar o link seguro de download do arquivo armazenado de forma temporária no bucket do Cloud Storage.

---

### Falha 3 — Fluxo de Login Real e Sincronização de Sessão com Banco de Dados
* **Status**: ⚠ Funciona Parcialmente (Simulado via Identidades Estáticas)
* **Impacto**: **Crítico** (Segurança da informação de múltiplos tenants corporativos e conformidade com a LGPD)
* **Causa Provável**: Atualmente, a autenticação e troca de papéis operam com base em usuários e organizações declarados em memória pelo `LoginScreen.tsx` e persistidos localmente. O backend NestJS (`apps/api`) e o banco de dados do sistema não realizam validação criptográfica (salting) de senhas nem emitem tokens JWT estruturados para validação de requisições subsequentes.
* **Plano de Correção**:
  1. Implementar autenticação baseada em JWT (Json Web Token) no NestJS com integração ao Prisma PostgreSQL.
  2. Migrar o gerenciamento de estados de login do frontend para ler e gravar dados via endpoints reais `/api/v1/auth/login` e `/api/v1/auth/profile`.
  3. Adicionar validação estrita do hash do cabeçalho `x-tenant-id` para garantir que um usuário de um cliente nunca consiga ler ou inferir a existência de dados de outra organização no banco global.

---

### Falha 4 — Importação Parcial de Dados com Erros de Tipo (Type Validation)
* **Status**: ⚠ Funciona Parcialmente (Exibe Erro Mas Aborta Tudo)
* **Impacto**: **Médio** (Onboarding lento em planilhas volumosas de filiais contendo pequenas anomalias de formatação)
* **Causa Provável**: Se o consultor importar uma planilha contendo 10.000 registros e apenas 3 deles apresentarem anomalias de tipo (ex: strings em colunas de faturamento numérico), o validador da aba **Central de Dados** aborta sumariamente toda a transação com um alerta de erro genérico.
* **Plano de Correção**:
  1. Introduzir a funcionalidade de **Importação Assistida de Quarentena**.
  2. Ao identificar registros inconsistentes, o sistema deve ignorá-los temporariamente para processar as linhas válidas, isolando as linhas corrompidas em um relatório visual pós-importação.
  3. Fornecer ao usuário um painel interno discreto para corrigir manualmente os 3 valores inválidos diretamente no Sauron OS, concluindo a integração com sucesso.

---

### Falha 5 — Sincronização em Lote de Bancos de Dados via VPN desligada
* **Status**: ✅ Funciona (Com Alerta de Segurança e Logs de Auditoria)
* **Impacto**: **Alto** (Pode travar o painel de dados com erros de timeout se não for gerenciado discretamente)
* **Causa Provável**: Se a simulação de conexão VPN estiver desligada na aba de infraestrutura e o usuário tentar forçar uma sincronização de dados via `/api/db/sync`, o processo falhará. Recentemente, estabilizamos a causa raiz alterando o status de erro de `Falha` para `Info` para não alarmar os usuários sobre desconfigurações normais de rede do cliente, mas falta implementar uma fila assíncrona tolerante a falhas (Fault-Tolerant Queue) no BullMQ.
* **Plano de Correção**:
  1. Mover toda a lógica de fetch remoto de banco de dados para ser executada como um Job assíncrono na fila `data.sync` do Worker.
  2. Se a conexão falhar por timeout ou VPN offline, o Worker deve tentar reestabelecer a VPN automaticamente por 3 tentativas com backoff linear.
  3. Caso permaneça indisponível, enviar uma notificação de erro silenciosa no centro de comando e salvar o estado de offline-first, mantendo os dados do último snapshot funcional ativos.

---

## 3. RESUMO DO ESFORÇO DE ENGENHARIA PARA ESTABILIZAÇÃO

* **Complexidade Crítica**: Transição de autenticação manual para NestJS JWT + Prisma PostgreSQL multi-tenant.
* **Esforço de Interface**: Refinamento do exportador de PDF nativo por Puppeteer e melhoria no validador de importação de quarentena.
* **Tempo Estimado de Saneamento**: 2 Sprints focadas de engenharia (sem adição de novas features de negócio).

---
*Relatório técnico assinado pelo arquiteto-chefe de software da Sauron Platform.*
