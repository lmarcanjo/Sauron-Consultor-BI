# HOTFIX 25.3-R1 — External Type & Password Security Audit Report

## Auditoria de Invocação de Métodos de String sobre Dados Externos

| Arquivo | Linha | Expressão/Propriedade | Risco | Correção Aplicada | Teste de Cobertura |
| --- | --- | --- | --- | --- | --- |
| `EnterpriseConsolidationService.ts` | ~177 | `row.Grupo`, `row.Empresa`, `row.Filial` | `TypeError: .toLowerCase is not a function` se `Grupo` for numérico | Substituído por `normalizeExternalScalar(row.Grupo)` que garante tratamento seguro de `number`, `boolean`, `Date` e previne falhas de runtime | `EnterpriseConsolidationService.test.ts` (Validado com `Grupo: 4629617`) |
| `EnterpriseCenter.tsx` | ~271 | `r.Grupo`, `r.Empresa`, `r.Unidade` | Lançamento de exceção em buscas no preview se o grupo for numérico | Substituído por `normalizeExternalScalar(...)` | Testado no Preview do Enterprise Center |
| `ExecutivePresentationEngine.ts` | ~95 | `r.Grupo`, `r.Grupo Econômico` | Crash em cálculo de nome de alvo para apresentação executiva | Aplicada a sanitização `normalizeExternalScalar(...)` | `ExecutivePresentationEngine.test.ts` |

---

## Varredura Completa de Campos `<input type="password">`

Todos os campos de senha da aplicação foram auditados e confirmados dentro de contêineres `<form>` nativos com atributos `id`, `name`, `autoComplete` e botões com `type="submit"`:

1. `src/components/DatabaseConnector.tsx`: Envolvido em `<form onSubmit={...}>` com `autoComplete="current-password"`.
2. `src/components/EnterpriseCenter.tsx`: Envolvido em `<form onSubmit={...}>` com `autoComplete="current-password"`.
3. `src/components/MarketIntelligencePanel.tsx`: Envolvido em `<form onSubmit={...}>` com `autoComplete="current-password"`.
4. `src/components/LoginScreen.tsx`: Todos os campos de senha integrados em formulários nativos com `autoComplete="new-password"` ou `autoComplete="current-password"`.

Zero campos `type="password"` desprotegidos fora de `<form>` na aplicação.
