# Context Invariants

O contexto visível é válido somente quando a organização, a fonte e a seleção
ativa apontam para entidades persistidas e compatíveis.

## Invariantes

1. Uma empresa selecionada deve existir e possuir grupo pai válido. Se o pai não
   existir, o contexto fica bloqueado até o consultor escolher um grupo.
2. Uma fonte ativa deve possuir binding canônico persistido. Fonte sem binding é
   exibida como “Fonte ainda não vinculada” e não é atribuída à empresa atual.
3. Empresa, unidade e grupo só podem resolver fontes permitidas pelo binding.
   Uma empresa não herda a fonte de uma empresa irmã.
4. O workspace persistido precisa existir no registro de identidade. Referência
   órfã é limpa e pede seleção; o sistema não cria projeto silenciosamente.
5. A seleção ativa usa `tenantId + workspaceId + scopeType + scopeId`.
6. A troca de contexto invalida a visão anterior antes da nova leitura assíncrona.
7. Workbook, binding e dataset são deduplicados por seus IDs canônicos antes da
   renderização e consolidação.

## Resultado de Validação

`ApplicationContextResolver.validateAndRepair()` retorna:

```ts
interface ContextInvariantResult {
  valid: boolean;
  issues: string[];
  repaired: string[];
  blocked: boolean;
  recommendedAction: "none" | "select_group" | "bind_source" | "select_project" | "review_source";
}
```

O resultado é informativo e operacional: reparos idempotentes preservam o
workbook e as linhas do IndexedDB; uma inconsistência não é convertida em dado
ou vínculo por inferência.
