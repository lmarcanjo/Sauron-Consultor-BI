# ASTERION — Guia de Arquitetura Hexagonal

O ecossistema ASTERION utiliza Arquitetura Hexagonal rigorosa para garantir testabilidade isolada e substituição transparente de adaptadores.

---

## 1. Portas Primárias (Driver Ports / Inbound)
- **`DataSourceService`**: Serviço de aplicação consumido pela interface React ou APIs externas.
- **`OrganizationService`**: Serviço de aplicação para gerenciamento da árvore corporativa.

## 2. Portas Secundárias (Driven Ports / Outbound)
- **`DataSourceRepository`**: Interface de persistência consumida pelo núcleo do domínio.
- **`IAsterionConnector`**: Interface de integração com origens físicas consumida pelo ecossistema de ingestão.

## 3. Adaptadores Concretos (Infrastructure / Adapters)
- **`LocalDataSourceRepository`**: Adaptador de armazenamento sobre `PersistenceManager`.
- **`SpreadsheetConnector`**: Adaptador concreto para leitura de planilhas XLSX e CSV.
