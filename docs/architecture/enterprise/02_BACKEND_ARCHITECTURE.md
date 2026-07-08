# SAURON BACKEND ARCHITECTURE — LAYERED ENTERPRISE STYLE

## 1. DESIGN DE CAMADAS LOGICAS (N-TIER PATTERN)

Para assegurar que o Sauron Platform seja um sistema robusto e passível de manutenção por equipes paralelas pelos próximos cinco anos, o backend será organizado sob o clássico padrão de **Arquitetura de Camadas Limpas** (Clean Layers), dividindo as responsabilidades de forma estrita e unidirecional.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      PRESENTATION LAYER (API GATEWAY)                   │
│  - Express Router    - REST Handlers    - WebSockets    - File Handlers │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER (USE CASES)                      │
│  - Transactional Orchestration          - Command / Query Handlers      │
│  - Event Propagation                    - Tenant Context Injection      │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     DOMAIN LAYER (BUSINESS ENGINES)                     │
│  - BusinessEngine    - AnalyticsEngine    - StoryEngine    - Plugins    │
│  - Domain Entities   - Formulas / Rules   - Domain Events               │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE LAYER (ADAPTERS)                      │
│  - SecurityEngine    - AuditEngine        - Event Bus      - Cryptography│
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    PERSISTENCE LAYER (DATA ACCESS)                      │
│  - Drizzle ORM       - Pg Connection Pool - IndexedDB Sync- Handlers     │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. ESPECIFICAÇÃO DAS CAMADAS E RESPONSABILIDADES

### 2.1. Camada de Apresentação (Presentation Layer)
* **Objetivo:** Interface externa com o mundo externo, agindo como o canal de entrada de requisições do frontend, tarefas automatizadas (*cron jobs*) ou webhooks integradores.
* **Componentes Principais:**
  * **Express REST Controllers:** Validação primária de payloads, tratamento sintático de JSON, e envio de respostas estruturadas com códigos HTTP padronizados.
  * **WebSocket Socket.io Manager:** Gerenciamento de conexões abertas bidirecionais de alta velocidade (usadas para sessões de rituais síncronos e notificações em tempo real).
* **Regra Rígida:** É terminantemente proibido injetar código contábil, cálculos tributários, regras de comissão ou queries brutas de banco de dados diretamente nos Controllers da API.

### 2.2. Camada de Aplicação (Application Layer)
* **Objetivo:** Orquestrar o fluxo de dados e coordenar os casos de uso de negócio da plataforma de forma transacional.
* **Componentes Principais:**
  * **Use Case Handlers (Interactors):** Orquestram a sequência lógica do negócio. Por exemplo, ao chamar o caso de uso `ApproveExecutiveStory`, esta camada:
    1. Verifica as permissões do consultor no `SecurityEngine`.
    2. Carrega a história de dados do banco de dados através dos repositórios.
    3. Invoca o método de aprovação da entidade de domínio da história.
    4. Dispara a assinatura criptográfica e log de auditoria via `AuditEngine`.
    5. Persiste as alterações atomicamente.
    6. Emite o evento `StoryApprovedEvent` no Barramento de Eventos.

### 2.3. Camada de Domínio (Domain Layer - Core Engines)
* **Objetivo:** O coração do Sauron. É onde residem as regras de governança, faturamento, inteligência financeira, fórmulas de comissionamento e rituais estratégicos.
* **Componentes Principais:**
  * **BusinessEngine:** Regras fundamentais de contabilidade de gestão, parametrização do DRE e de índices analíticos.
  * **AnalyticsEngine:** Cálculos preditivos de faturamento, simulação de custos fixos/variáveis de vendas, inteligência de ponto de equilíbrio (Break-Even) e diagnósticos.
  * **StoryEngine:** Regras de rituais, geração determinística de capítulos de narrativas, snapshots históricos de governança corporativa e gerenciamento do ciclo de rituais do Board.
  * **PeopleIntelligenceEngine:** Motores de simulação de turnover de equipes, cálculo de incentivos e simulação de comissões.
* **Regra Rígida:** O domínio é totalmente agnóstico em relação à tecnologia. Ele não sabe qual banco de dados é utilizado, se as requisições vêm via HTTP ou gRPC, ou se o framework frontend é React. Toda dependência externa deve ser resolvida por meio de Interfaces / Portas e Adaptadores (Hexagonal Architecture).

### 2.4. Camada de Infraestrutura (Infrastructure Layer)
* **Objetivo:** Fornecer suporte e serviços técnicos transversais (Cross-Cutting Concerns) necessários para sustentar a operação dos motores de domínio.
* **Componentes Principais:**
  * **SecurityEngine:** Gerenciador de contexto do usuário ativo, validação de tokens criptográficos, checagem fina de autorizações de tenants.
  * **AuditEngine:** Barramento inviolável de logs de rituais de governança corporativa (rastreamento de dados, alterações contábeis e aprovação de atas).
  * **Queue Workers:** Gerenciadores de filas assíncronas para processamentos de relatórios pesados e de importações de balancetes massivos em background.

### 2.5. Camada de Persistência (Persistence Layer)
* **Objetivo:** Mapear e gerenciar a leitura e gravação física de dados relacionais e blobs de arquivos.
* **Componentes Principais:**
  * **Drizzle ORM Mapping:** Definição de tabelas, relacionamentos, chaves estrangeiras e índices do PostgreSQL em TypeScript puro de alto desempenho.
  * **Repositories:** Abstrações de acesso ao banco (ex: `ProjectRepository`, `UserRepository`, `FinancialRecordRepository`) que impedem que queries vazem para a camada de domínio.
  * **Connection Pooler:** Gerenciamento eficiente e resiliente das conexões ativas de rede com o banco de dados.

---

## 3. MALEABILIDADE E PRESERVAÇÃO DE CÓDIGO DO CORE
A arquitetura de camadas acima descrita garante que **100%** do código contido nas engines atuais em `/src/core` possa ser movido para a camada de Domínio no backend com esforço de refatoração praticamente nulo, apenas ajustando as assinaturas de imports e os tipos das entidades do domínio, mantendo a propriedade intelectual da plataforma protegida e intacta.
