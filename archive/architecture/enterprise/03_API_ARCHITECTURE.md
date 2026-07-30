# SAURON API ARCHITECTURE — DESIGN DE PROTOCOLOS E PROCESSAMENTO

## 1. REST API PROTOCOLO & ESPECIFICAÇÃO

A API REST do Sauron Enterprise atuará como o principal duto transacional de dados lógicos entre a interface React e o Monólito Modular Backend.

```
┌──────────────────┐               ┌────────────────────┐               ┌──────────────────┐
│  Sauron Client   │ ──REST API──► │ Express API Router │ ──JSON Payl──► │ Service Interact │
│  (React UI / F12)│ ◄─JSON Resp── │ (Auth & Rate Limit)│ ◄─DB Aggregate │ (Use Cases / DOM)│
└──────────────────┘               └────────────────────┘               └──────────────────┘
```

### 1.1. Versionamento de Rotas
* **Estratégia:** Versionamento explícito na URI do endpoint.
* **Format:** `/api/v1/{domínio}/{recurso}`
* **Exemplo de Rotas do Core:**
  * `GET /api/v1/workspaces`: Listagem de projetos consultivos ativos do consultor.
  * `POST /api/v1/workspaces/:id/stories`: Criação de uma narrativa executiva.
  * `GET /api/v1/stories/:id/chapters/:index`: Leitura de capítulo contábil isolado.

### 1.2. Estratégia de Paginação Padrão Enterprise
Para evitar sobrecarga de memória (Out-of-Memory) no frontend, todas as listagens de balancetes, históricos de auditoria ou lançamentos contábeis analíticos implementarão **Paginação baseada em Cursor** por padrão, substituindo paginações de offset lentas que degradam a performance do banco à medida que o volume cresce.

```json
// GET /api/v1/projects/123/financial-records?limit=10&cursor=ZXN0YWRvXzEwMA
{
  "data": [
    {
      "id": "rec_01",
      "accountCode": "1.01.01",
      "label": "Caixa Geral",
      "value": 150000.00,
      "date": "2026-06-01"
    }
  ],
  "pagination": {
    "limit": 10,
    "hasMore": true,
    "nextCursor": "ZXN0YWRvXzEwOQ"
  }
}
```

### 1.3. Filtros Lógicos e Agregações Dinâmicas
Os filtros analíticos serão processados diretamente no banco de dados através de sintaxes padronizadas na query string:
* `GET /api/v1/financial-records?filter[account]=1.01&filter[date_from]=2026-01-01&filter[date_to]=2026-06-30`
* O backend lê os parâmetros e converte-os deterministicamente em queries parametrizadas seguras no PostgreSQL.

---

## 2. WEBSOCKETS PARA RITUAIS SÍNCRONOS E NOTIFICAÇÕES

Sessões do **Sauron Executive Story™** em modo de apresentação ao vivo (Presenter Mode) dependem de sincronismo instantâneo de telas entre o consultor estrategista e a diretoria do cliente.

* **Protocolo:** Socket.io / WebSocket nativo sobre TLS.
* **namespaces de Isolamento:** `/stories/{storyId}`
* **Eventos Padronizados:**

| Evento | Direção | Descrição | Payload |
| :--- | :---: | :--- | :--- |
| `ritual:joined` | Client -> Server | Usuário entra na sala de apresentação. | `{ userId: "usr_01", role: "client" }` |
| `chapter:changed`| Client -> Server | Consultor avança o capítulo estratégico. | `{ targetChapterIndex: 2 }` |
| `chapter:sync` | Server -> Client | Sincroniza a tela dos conselheiros com a do apresentador. | `{ currentChapterIndex: 2, presenterNotes: "..." }` |
| `decision:added` | Client -> Server | Registro de decisão acordada no board ao vivo. | `{ text: "Aprovação de CAPEX para Q3" }` |
| `action:logged` | Client -> Server | Plano de ação acordado na reunião em tempo real. | `{ desc: "Rever planilha de custos", resp: "CEO" }` |

---

## 3. SISTEMA DE BACKGROUND TASKS & JOB WORKERS

Operações de longa duração não podem bloquear o ciclo de Event Loop da API Express principal.

```
┌────────────────────┐      ┌──────────────┐      ┌────────────────────┐
│ Express API Route  │ ───► │  Redis Queue │ ───► │  Background Worker │
│ (File Upload Init) │      │  (BullMQ)    │      │  (DRE Parsing Job) │
└────────────────────┘      └──────────────┘      └─────────┬──────────┘
                                                            │ (Consolidar e Gravar)
                                                            ▼
                                                  ┌────────────────────┐
                                                  │ PostgreSQL (Audit) │
                                                  └────────────────────┘
```

### 3.1. Arquitetura de Filas e Jobs
* **Engine Recomenda:** **BullMQ** (orientado a Redis) devido ao alto suporte transacional e controle refinado de concorrência e tentativas (Retries).
* **Workers Dedicados:** Processos de Node.js rodando em contêineres de segundo plano isolados, garantindo isolamento total de recursos (CPU/RAM).

### 3.2. Lifecycle de Jobs de Importação Contábil
1. **Upload do Arquivo:** O usuário faz upload de um arquivo de balancete de 200MB. O arquivo é gravado diretamente em um bucket privado de armazenamento (Google Cloud Storage) via assinatura temporária (*Pre-signed URL*), liberando a API REST.
2. **Registro do Job:** A API registra uma tarefa de parsing e enfileira o Job no Redis:
   * `job_type: "BALANCETE_IMPORT_AND_PARSE"`
   * `payload: { fileUrl: "s3://...", tenantId: "ten_01", projectId: "prj_02" }`
3. **Execução pelo Worker:** O Worker capta o Job, lê o arquivo em formato streaming, processa e extrai a estrutura contábil, e realiza um bulk insert das transações diretamente no PostgreSQL.
4. **Notificação de Sucesso:** Ao terminar, o Worker atualiza o status do Job e dispara uma mensagem via WebSocket para o navegador do consultor: `"Balancete carregado com sucesso. DRE recalculado."`
