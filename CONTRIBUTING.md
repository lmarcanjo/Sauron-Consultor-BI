# Contributing

Changes must preserve the canonical flow, keep physical source data immutable,
and include focused tests for behavior that is changed.

## Permanent Architecture Rules

1. > Nenhuma Sprint poderá adicionar uma nova funcionalidade sem identificar explicitamente quais componentes, telas, serviços, rotas, testes e documentos se tornaram obsoletos e deverão ser removidos.

2. > Nenhum controle interativo pode entrar em produção sem ação funcional observável ou estado explicitamente desabilitado.

New code must use the current repository, stores and engines. Compatibility
boundaries require an explicit migration note and may not gain new behavior.
