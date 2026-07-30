# SPRINT 24 — Organizational Reconciliation & Zero Dead Actions Architecture

## Arquitetura de Reconciliação Organizacional Flexível

A Sprint 24 consolida o modelo organizacional flexível do SAURON, no qual:
- Uma empresa pode existir sem grupo (`groupId = null`);
- Um grupo pode existir sem empresas cadastradas (`companies = []`);
- Uma fonte pode conter dados não conciliados (`UNRECONCILED`) ou ser vinculada no nível do grupo (`scope = GROUP`) ou da empresa (`scope = COMPANY`).

### Proposta de Reconciliação (`OrganizationalReconciliationProposal`)
Toda descoberta de empresas ou unidades adicionadas na fonte gera uma proposta não destrutiva que exige aprovação explícita do consultor antes de modificar o repositório de empresas.
