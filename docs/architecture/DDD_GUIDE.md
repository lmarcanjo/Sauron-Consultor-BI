# ASTERION — Guia de Domain-Driven Design (DDD)

Este guia especifica o mapa conceitual e os limites de contexto (Bounded Contexts) da plataforma ASTERION.

---

## 1. Mapeamento de Agregados (Aggregate Map)

| Bounded Context | Agregado Raiz | Entidades Internas | Value Objects Principais |
| :--- | :--- | :--- | :--- |
| **Portfolio & Engagement** | `WorkspaceProject` | N/A | `EngagementId`, `CanonicalDataState` |
| **Organization** | `BusinessGroup` | `Company`, `Unit` | `OrganizationalScope`, `CNPJ` |
| **DataSource & Ingestion** | `DataSource` | `SourceSchema`, `QualityProfile` | `DataSourceMetadata`, `SyncPolicy`, `SchemaVersion` |
| **Connector Integration** | `IAsterionConnector` | N/A | `ConnectorMetadata`, `ConnectorCapability` |

---

## 2. Invariantes do Domínio
- **Vínculo de Engajamento**: Um `DataSource` ou `BusinessGroup` deve pertencer obrigatoriamente a um `EngagementId`.
- **Derivação de Estado**: O estado de prontidão (`derivedCanonicalState`) não é mutável por setters genéricos; ele é calculado via evidências.
