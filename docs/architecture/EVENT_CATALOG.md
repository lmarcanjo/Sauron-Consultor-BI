# ASTERION — Catálogo Oficial de Eventos da Plataforma

Este catálogo lista todos os eventos de domínio e plataforma registrados no ASTERION.

---

## 1. Eventos do Agregado DataSource

| Evento | Emissor | Momento / Disparo | Responsabilidade / Auditoria |
| :--- | :--- | :--- | :--- |
| `DATA_SOURCE_REGISTERED` | `DataSourceService` | Registro inicial da fonte no Engajamento. | Registra criação do ativo no AuditEngine. |
| `DATA_SOURCE_CONNECTED` | `DataSourceService` | Evidência de upload ou handshake recebida. | Transiciona estado para `SOURCE_CONNECTED`. |
| `DATA_SOURCE_DISCOVERY_STARTED` | `DataSourceService` | Início da leitura estrutural. | Transiciona estado para `DISCOVERING`. |
| `DATA_SOURCE_DISCOVERY_COMPLETED` | `DataSourceService` | Conclusão do schema e perfil. | Transiciona estado para `WAITING_CONFIRMATION`. |
| `DATA_SOURCE_SCHEMA_CONFIRMED` | `DataSourceService` | Aceite do consultor logado. | Liberador do estado `READY`. |
| `DATA_SOURCE_SYNC_COMPLETED` | `DataSourceService` | Registro de sincronização por lote. | Registra volume lido e fingerprint. |
| `DATA_SOURCE_DISABLED` | `DataSourceService` | Desativação temporária pelo consultor. | Atualiza `LifecycleStatus`. |
| `DATA_SOURCE_ENABLED` | `DataSourceService` | Reativação da fonte. | Atualiza `LifecycleStatus`. |
| `DATA_SOURCE_ARCHIVED` | `DataSourceService` | Arquivamento do ativo. | Marca `LifecycleStatus === 'ARCHIVED'`. |

---

## 2. Eventos da Estrutura Organizacional

- `GRUPO_CRIADO`, `GRUPO_ATUALIZADO`
- `EMPRESA_CRIADA`, `EMPRESA_ATUALIZADA`
- `UNIDADE_CRIADA`, `UNIDADE_ATUALIZADA`
- `ENTERPRISE_CONTEXT_CHANGED`
