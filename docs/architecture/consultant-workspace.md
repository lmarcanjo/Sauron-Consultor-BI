# Consultant Workspace Architecture

O módulo Consultant Workspace introduz uma camada de gerenciamento de Projetos de Consultoria no Sauron, centralizando o trabalho do consultor em ciclos de clientes/projetos.

## Conceitos

- **Projeto**: Entidade central que agrega dados, configurações, KPIs, dashboards, plano de ação, reuniões e histórico de um cliente.
- **Ciclo de Trabalho**: Organização de recursos e histórico dentro de um projeto.
- **Modo Reunião**: Infraestrutura para gestão de apresentações, decisões e pendências.

## Persistência

Utiliza a API `localStorage` para persistência local, com versionamento de schema e interfaces preparadas para extensão futura com sincronização em nuvem. O projeto ativo é persistido para permitir restaurar a sessão do consultor.

## Integrações

O workspace integra-se com as engines existentes através de métodos de persistência robustos que atualizam o estado do projeto, garantindo a integridade dos dados:
- **DataEngine**: Gestão de planilhas e conexões de banco.
- **PresentationManager**: Gestão de apresentações e reuniões.
- **PluginEngine**: Extensões.
- **AnalyticsEngine**: KPIs, Dashboards e Filtros.
- **AuditEngine**: Registro de histórico e auditoria de ações.
