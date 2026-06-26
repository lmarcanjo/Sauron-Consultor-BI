# Consultant Workspace Architecture

O módulo Consultant Workspace introduz uma camada de gerenciamento de Projetos de Consultoria no Sauron, centralizando o trabalho do consultor em ciclos de clientes/projetos.

## Conceitos

- **Projeto**: Entidade central que agrega dados, configurações, KPIs, dashboards e plano de ação de um cliente.
- **Ciclo de Trabalho**: Organização de recursos e histórico dentro de um projeto.

## Persistência

Utiliza a API `localStorage` para persistência local, com interfaces preparadas para extensão futura com sincronização em nuvem.

## Integrações

O workspace integra-se com as engines existentes:
- **DataEngine**: Importação de fontes.
- **PresentationManager**: Gestão de apresentações.
- **PluginEngine**: Extensões.
- **AnalyticsEngine**: KPIs e Dashboards.
- **AuditEngine**: Registro de ações do consultor.
