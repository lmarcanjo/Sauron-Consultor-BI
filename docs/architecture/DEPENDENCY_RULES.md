# ASTERION — Regras de Dependência e Código

## 1. Diretrizes de Inport / Export
- Componentes React (`src/components/`) **NUNCA** devem importar repositórios de persistência (`WorkspaceRepository`, `EnterpriseRepository`, `LocalDataSourceRepository`). Toda interação DEVE ocorrer via Serviços (`ClientService`, `EngagementService`, `PortfolioService`, `OrganizationService`, `DataSourceService`).
- O Domínio (`src/core/datasource/`, `src/modules/consultant-workspace/`) **NUNCA** importa pacotes de UI ou bibliotecas específicas de conectores (`xlsx`).

## 2. Padrões de Teste
- Cada nova funcionalidade de domínio deve incluir uma suíte de teste isolada em Vitest (`src/**/*.test.ts`).
