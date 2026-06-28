# SAURON OBSERVABILITY — SAURON OBSERVATORY™ SPECIFICATION

## 1. INTRODUÇÃO AO SAURON OBSERVATORY™

O **Sauron Observatory™** é o subsistema estratégico focado em coletar, consolidar e emitir alertas sobre a integridade operacional, performance matemática e conformidade de segurança do Sauron OS em tempo real. Ele garante que desvios técnicos sejam detectados e corrigidos antes que impactem os consultores e diretores corporativos.

```
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│  Metrics (App)   │ ───► │  OpenTelemetry   │ ───► │  Prometheus DB   │
│  Logs / Tracing  │      │  Collector       │      │  (Metrics Storage│
└──────────────────┘      └──────────────────┘      └────────┬─────────┘
                                                             │
                                                             ▼
                                                    ┌──────────────────┐
                                                    │ Sauron Dashboard │
                                                    │ (Observatory UI) │
                                                    └──────────────────┘
```

---

## 2. PILARES DE TELEMETRIA ENTERPRISE

A estratégia de observabilidade está construída sobre os três clássicos pilares modernos de telemetria, estendidos para atender o contexto analítico-financeiro.

### 2.1. Métricas Principais (Metrics)
* **API Metrics:** Taxa de requisições por segundo (RPS), Taxas de Erros HTTP (5xx / 4xx) e tempos de resposta p95/p99 por domínio de API.
* **Database Metrics:** Contagem de conexões ativas no pool do pgBouncer, latência média de execução de queries de agregação do DRE e tempo de replicação de dados entre a instância master e as réplicas.
* **Worker & Queue Metrics:** Tamanho de fila ativa no Redis (BullMQ), taxa de processamento de importações contábeis, contagem de falhas de importação de balancetes por inconsistência de layout e latência de processamento de planilhas.
* **Telemetry Core (Performance de Cálculo):** Monitoramento do tempo consumido pelo `AnalyticsEngine` para recalcular projeções de cenários de holdings complexas.

### 2.2. Rastreabilidade Distribuída (Tracing)
* Toda requisição recebida na camada de Apresentação gera um cabeçalho único `X-Correlation-Id`.
* Esse ID é injetado em todas as etapas subsequentes do ciclo de vida: do controller HTTP, passando pela camada de caso de uso, chamadas de domínio das Engines, execução da query SQL de persistência, até a emissão de eventos assíncronos no Event Bus.
* **Benefício:** Permite isolar gargalos específicos de lentidão de relatórios financeiros de um cliente único sem afetar outros usuários.

### 2.3. Logs Estruturados (Structured Logging)
* Todas as saídas de terminal (stdout) serão gravadas em formato JSON padronizado para facilitação de indexação e consultas em ferramentas como Elasticsearch / Kibana ou Google Cloud Logging.

```json
{
  "timestamp": "2026-06-27T19:45:12.304Z",
  "level": "ERROR",
  "correlationId": "corr_abc123xyz",
  "tenantId": "ten_001",
  "userId": "usr_777",
  "component": "AnalyticsEngine",
  "message": "Fórmula matemática violada: Divisão por Zero no cálculo de Margem de Contribuição",
  "context": {
    "projectId": "prj_888",
    "kpiName": "ContributionMargin",
    "accountCode": "3.01.01"
  },
  "exception": {
    "stack": "Error: Division by zero at AnalyticsEngine.calculateContribution..."
  }
}
```

---

## 3. MONITORES DE SEGURANÇA E INTEGRIDADE DE AUDITORIA

O Sauron Observatory™ possui regras automatizadas voltadas especificamente para auditoria de conformidade (Compliance Logs):
* **Auditor de Falha de RLS:** Disparar alerta imediato com nível de severidade CRITICAL caso o PostgreSQL rejeite uma query por violação de regra de Row-Level Security (indício de tentativa de invasão ou bug de vazamento cruzado de dados).
* **Alerta de Inclusão de Decisão sem Snapshot:** Se uma decisão do Board for adicionada fora do fluxo determinístico do `StoryEngine`, um evento de segurança silencioso é registrado para auditoria retroativa.

---

## 4. ENDPOINTS DE HEALTH CHECKS GRADULARES

O backend fornecerá rotas específicas de verificação de integridade operacional, permitindo que orquestradores como Kubernetes ou Cloud Run validem se a aplicação está pronta para receber tráfego:

* **`/api/health/live` (Liveness):** Indica se o processo do Node.js está rodando de forma saudável. Retorna imediatamente `HTTP 200 OK`.
* **`/api/health/ready` (Readiness):** Verifica conexões de rede ativas com dependências físicas críticas do sistema. Retorna `HTTP 200 OK` apenas se:
  1. Conexão física com PostgreSQL master e read-replica estiver ativa.
  2. Conexão física com Redis de filas e cache estiver estabelecida.
  3. Tempo de resposta de ping de rede interno estiver dentro do limite saudável (< 200ms).
* Se alguma dependência falhar, retorna `HTTP 503 Service Unavailable`, instruindo o balanceador de carga a desviar requisições desse container específico.
