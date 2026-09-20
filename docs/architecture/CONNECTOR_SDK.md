# ASTERION — Guia do SDK de Conectores

Este documento orienta o desenvolvimento de novos conectores para a plataforma ASTERION.

---

## 1. Estrutura de um Conector Oficial

Qualquer conector deve ser criado em `src/connectors/<categoria>/` e implementar a interface `IAsterionConnector`:

```typescript
export interface IAsterionConnector {
  readonly metadata: ConnectorMetadata;
  supportsCapability(capability: ConnectorCapability): boolean;
  connect(ctx: ConnectorExecutionContext): Promise<boolean>;
  disconnect(ctx: ConnectorExecutionContext): Promise<void>;
  checkHealth(ctx: ConnectorExecutionContext): Promise<ConnectorHealthResult>;
  validate(ctx: ConnectorExecutionContext): Promise<ConnectorValidationResult>;
  discover(ctx: ConnectorExecutionContext): Promise<ConnectorDiscoveryResult>;
  sample?(ctx: ConnectorExecutionContext, limit?: number): Promise<Record<string, any>[]>;
  synchronize?(ctx: ConnectorExecutionContext, params: ConnectorSyncParams): AsyncIterable<ConnectorSyncBatch>;
}
```

---

## 2. Registro no `ConnectorRegistry`

Todo conector deve ser registrado na inicialização através de sua fábrica:

```typescript
connectorRegistry.register(() => new SpreadsheetConnector());
```
