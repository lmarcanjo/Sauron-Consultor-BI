# ASTERION — Manual de Arquitetura e Guia da Plataforma

Este documento constitui o **Handbook Oficial de Arquitetura da Plataforma ASTERION** (v1.0), consolidado ao término da Sprint 1.5.

---

## 1. Visão Geral da Arquitetura

O ASTERION é projetado sob os princípios de **Domain-Driven Design (DDD)** e **Arquitetura Hexagonal (Ports & Adapters)**.

```
[ Camada de Apresentação / React UI ]
             ↓ (DPE / Hooks)
[ Camada de Aplicação / Services ]
             ↓ (Interfaces / Ports)
[ Camada de Domínio / Aggregates & Value Objects ]
             ↑ (Implementações de Porta)
[ Camada de Infraestrutura / Persistência & Connectors ]
```

### Regras Estritas de Dependência
1. **Domínio Imutável**: O Domínio (`src/core/datasource/`, `src/modules/consultant-workspace/`) nunca importa nada da Infraestrutura ou Apresentação.
2. **Ports & Adapters**: Repositórios e Conectores são acessados exclusivamente por interfaces públicas.
3. **Comunicação por Eventos**: Comunicação assíncrona desacoplada utilizando `PlatformEvents` e `AuditEngine`.

---

## 2. Abstração do Connector SDK

Todos os conectores externos (Planilhas, Bancos SQL, APIs) devem obrigatoriamente derivar de `IAsterionConnector` (`src/core/datasource/sdk/ConnectorContracts.ts`).

### Capacidades Suportadas (`ConnectorCapability`)
- `connect`
- `validate`
- `discover`
- `sample`
- `synchronize`
- `health`
- `metadata`
- `schemaEvolution`

O Core e o agregado `DataSource` **nunca** conhecem drivers, bibliotecas de terceiros ou sockets de rede.
