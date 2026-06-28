# SAURON DATABASE STRATEGY — PRODUÇÃO RELACIONAL ENTERPRISE

## 1. INFRAESTRUTURA POSTGRESQL & ARQUITETURA DE ESCALA

Para sustentar as demandas corporativas do Sauron Enterprise de forma consistente, a infraestrutura de banco de dados usará uma topologia de **Cluster Relacional Altamente Disponível** gerenciada via Google Cloud SQL.

```
                         ┌─────────────────────────────┐
                         │      Sauron Backend         │
                         └──────────────┬──────────────┘
                                        │ (Conexões ativas de pooling)
                                        ▼
                         ┌─────────────────────────────┐
                         │   pgBouncer (Pool Manager)  │
                         └──────────────┬──────────────┘
                                        │
                         ┌──────────────┴──────────────┐
                         ▼                             ▼
           ┌───────────────────────────┐ ┌───────────────────────────┐
           │      PostgreSQL Main      │ │    PostgreSQL Read-Replica│
           │      (Writes / Updates)   │ │    (Heavy Analytical Rpts)│
           └───────────────────────────┘ └───────────────────────────┘
```

### 1.1. Divisão de Leitura e Escrita (Read-Replicas)
* **Master Instance (Write Path):** Processa todas as mutações de dados, transações financeiras, assinaturas de atas, importações contábeis brutas de balancetes e rituais ativos.
* **Read-Replica Instances (Read Path):** Todas as queries pesadas do `AnalyticsEngine`, renderização de gráficos complexos no `WorkspaceIntelligenceEngine` e consolidação de históricos estratégicos são desviadas para réplicas de leitura isoladas físicas. Isto blinda o processamento transacional primário contra lentidões causadas por relatórios pesados de analistas corporativos.

---

## 2. GERENCIAMENTO DE CONEXÕES & POOLING (pgBouncer)

A conexão direta com o PostgreSQL cria uma nova thread de sistema operacional para cada cliente, o que gera alto consumo de CPU e RAM no servidor de banco de dados quando centenas de contêineres de API iniciam simultaneamente.

* **Solução:** Introdução de um container proxy **pgBouncer** à frente do banco em modo de pool de transação (`pool_mode = transaction`).
* **Sizing Inicial de Conexões:**
  * Máximo de conexões no pgBouncer: **2.500**
  * Máximo de conexões físicas mantidas ativas entre pgBouncer e PostgreSQL master: **150**
  * Isto reduz a latência de handshake de conexão para menos de **1ms** por requisição da API.

---

## 3. POLÍTICAS DE DISASTER RECOVERY & BACKUP

Para conformidade com grandes corporações de capital aberto e auditoria contábil rígida, o plano de Disaster Recovery (DR) implementa as seguintes métricas de compromisso técnico (SLA):
* **RPO (Recovery Point Objective):** Máximo de **5 minutos** de perda teórica de dados (garantido através de replicação contínua de logs de transação Write-Ahead Logging - WAL para buckets frios de segurança).
* **RTO (Recovery Time Objective):** Máximo de **15 minutos** para restauração completa da operação do banco de dados em caso de falha física catastrófica da região principal de nuvem.

### Janela e Tipo de Backups:
* **Backup Físico Completo (Full Snapshot):** Gerado diariamente às 02:00 UTC, retido por 365 dias (atendimento de governança e regulação de relatórios de auditoria anual).
* **Backup de Arquivos de Transação (WAL Archiving):** Gravado a cada 60 segundos no Google Cloud Storage, permitindo recuperação ponto-no-tempo (Point-In-Time Recovery - PITR) para qualquer segundo específico do dia.

---

## 4. ESTRATÉGIA DE CACHE MULTI-CAMADAS (REDIS)

Para garantir respostas na velocidade do pensamento durante rituais estratégicos do Board, utilizaremos uma topologia híbrida de cache:

```
┌─────────────────┐               ┌─────────────────┐               ┌─────────────────┐
│  React Client   │ ──HTTP Get──► │  Redis Cluster  │ ──Hit / Miss─►│  PostgreSQL Db  │
│  (IndexedDB)    │               │  (KPIs / DRE)   │               │  (Active RLS)   │
└─────────────────┘               └─────────────────┘               └─────────────────┘
```

### 4.1. Cache Local de Visualização (IndexedDB)
* O browser do cliente mantém as estruturas agregadas do DRE estáticas em IndexedDB. O cliente só requisita dados à API se o timestamp de revisão do projeto local for menor que a versão mantida no servidor.

### 4.2. Cache Central de Dados Analíticos (Redis Core)
* Métricas e simulações complexas de cenários do `AnalyticsEngine` que exigem segundos de processamento matemático são cacheadas no Redis.
* **Políticas de Invalidação de Cache (Cache Invalidation Rules):**
  * Ao carregar ou atualizar qualquer dado de planilha contábil no `DataEngine`, um evento assíncrono dispara o comando de limpeza de cache direcionado: `DEL tenant:{tenant_id}:project:{project_id}:*`.
  * Tempo de Vida Padrão (TTL): **2 horas** para relatórios comuns e **24 horas** para consolidações anuais de balanços fechados.
