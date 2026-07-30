# SAURON EVENT ARCHITECTURE — BARRAMENTO E EVENT-DRIVEN DESIGN

## 1. DESIGN DO BARRAMENTO DE EVENTOS DO CORE (Sauron Event Bus™)

Para garantir desacoplamento total entre as Engines do Core e sistemas secundários, o Sauron implementará um padrão de **Arquitetura Orientada a Eventos (EDA)**.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           SAURON DOMAIN ENGINE                          │
│                                                                         │
│      ┌─────────────────────┐               ┌────────────────────┐       │
│      │  Executive Story™   │ ────────────► │    CoreEventBus    │       │
│      │  (Approve Action)   │ (Dispatch)    │    (In-Memory)     │       │
│      └─────────────────────┘               └─────────┬──────────┘       │
└──────────────────────────────────────────────────────┼──────────────────┘
                                                       │
                                                       ▼ (Publish Event)
┌─────────────────────────────────────────────────────────────────────────┐
│                      MESSAGING INFRASTRUCTURE LAYER                     │
│                                                                         │
│   ┌───────────────────────┐ ┌──────────────────────┐ ┌──────────────┐   │
│   │   Redis Pub/Sub       │ │   Transactional      │ │ RabbitMQ /   │   │
│   │   (Real-Time Sync)    │ │   Outbox (Postgres)  │ │ Kafka (Road) │   │
│   └───────────────────────┘ └──────────────────────┘ └──────────────┘   │
└──────────────────────────────────────────────────────┬──────────────────┘
                                                       │
                                                       ▼ (Consume & Notify)
┌─────────────────────────────────────────────────────────────────────────┐
│                            EVENT CONSUMERS                              │
│                                                                         │
│   ┌───────────────────────┐ ┌──────────────────────┐ ┌──────────────┐   │
│   │   Audit Logger        │ │   Notification Eng   │ │ CRM / Slack  │   │
│   │   (Append-Only Db)    │ │   (WebSockets / SMS) │ │ Webhooks     │   │
│   └───────────────────────┘ └──────────────────────┘ └──────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. TAXONOMIA E ESQUEMAS DOS EVENTOS DO DOMÍNIO

Os eventos de domínio representam fatos consumados de negócios que já aconteceram e não podem ser revogados ou modificados (imutabilidade de fatos).

### 2.1. Catálogo de Eventos Enterprise

* **`StoryApprovedEvent`:** Disparado no instante em que o conselho de administração aprova uma narrativa estratégica, gerando o hash hash e fechando o capítulo contábil.
* **`MeetingClosedEvent`:** Publicado quando um ritual estratégico de fechamento mensal de governança é concluído e assinado pelos consultores seniores.
* **`DatabaseSyncedEvent`:** Emitido após a conclusão do ETL e validação de consistência e integridade de dados importados de ERPs contábeis externos.
* **`PlanCreatedEvent`:** Disparado ao desenhar um novo plano de responsabilidades, prazos e planos de ação corretivos associados a um desvio no DRE.
* **`CompensationGeneratedEvent`:** Gerado quando a simulação de comissões variáveis de equipes de vendas é validada e aprovada pelo consultor.

### 2.2. Exemplo de Schema JSON Padrão (Event Schema)

Todos os eventos contêm metadados de rastreabilidade globais (`metadata`) e os dados específicos do domínio (`payload`).

```json
{
  "eventId": "evt_f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "eventType": "Sauron.Story.Approved",
  "aggregateId": "story_98765",
  "timestamp": "2026-06-27T19:30:00Z",
  "metadata": {
    "tenantId": "ten_001",
    "userId": "usr_777",
    "clientIp": "192.168.1.55",
    "correlationId": "corr_abc123xyz"
  },
  "payload": {
    "storyId": "story_98765",
    "title": "Narrativa Trimestral Concessionárias Ford Q2",
    "approvedChapters": [0, 1, 2],
    "cryptographicHash": "a8f3b207567e891cde4582fbc9081e23",
    "boardDecisionsCount": 4,
    "financialDeltaDetected": -15000.00
  }
}
```

---

## 3. GARANTIAS DE ENTREGA E RESILIÊNCIA (OUTBOX PATTERN)

Para assegurar que nenhum evento estratégico de auditoria contábil ou decisão do conselho seja perdido caso ocorra uma queda temporária da rede ou do broker de mensageria, o Sauron implementará o padrão **Transactional Outbox**.

1. **Escrita Atômica:** Quando um caso de uso executa uma ação de gravação, o registro de negócio e o registro do evento correspondente são gravados na tabela `outbox` dentro da **mesma transação do PostgreSQL**.
2. **Poller de Outbox:** Um worker em segundo plano lê periodicamente a tabela de outbox, publica os eventos no Redis/RabbitMQ e marca-os como processados.
3. **Entrega Garantida (At-Least-Once Delivery):** Isso assegura que mesmo se o servidor do Redis falhar no momento do salvamento do registro contábil, o evento correspondente será reenviado assim que a conexão se restabelecer.
4. **Idempotência no Consumidor:** Todos os microsserviços ou módulos consumidores de eventos devem obrigatoriamente validar o campo `eventId` recebido, descartando processamentos repetidos para garantir idempotência.
