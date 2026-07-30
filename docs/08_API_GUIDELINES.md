# ASTERION — Diretrizes de API e Contratos

## Padrões de Código e APIs

1. **Tipagem Estrita com TypeScript**: Interfaces explícitas para todas as entidades de domínio, evitando `any` não tratado.
2. **Defesa contra Escalares Externos**: Uso de `normalizeExternalScalar` para tratar campos físicos sem lançar exceções de runtime (`TypeError`).
3. **Imutabilidade e Assincronismo Seguro**: Promessas tratadas adequadamente com `try/catch/finally` para evitar `Uncaught (in promise)`.
