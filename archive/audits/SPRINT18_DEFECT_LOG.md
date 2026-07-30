# Sprint 18 Defect Log

Data: 2026-07-25

## D-18-01 — Seletor de fonte duplicado

- **Severidade:** P2, ação ambígua para automação e integração.
- **Causa:** `src/components/AppSidebar.tsx` e `src/App.tsx` usavam o mesmo
  `data-testid="btn-open-data-center"`.
- **Impacto:** uma busca por ação única retornava dois botões, embora a
  navegação visual continuasse possível.
- **Correção:** o botão do cabeçalho manteve
  `btn-open-data-center`, preservando consumidores existentes; o botão da
  barra lateral passou a usar `btn-sidebar-open-data-center`. Não houve mudança
  de layout ou comportamento.
- **Evidência:** reprodução retornou dois elementos; a jornada posterior
  completou 18 etapas sem erro de navegador.
- **Risco residual:** há dois pontos visuais que abrem a mesma área por decisão
  de layout existente; a ambiguidade técnica do seletor foi removida.

## D-18-02 — Modo API sem endpoint de importação no servidor local

- **Severidade:** P1 de integração/provisionamento.
- **Causa:** em bundle de produção sem `VITE_IMPORT_MODE=local`,
  `resolveImportMode()` escolhe `ApiImportService`, enquanto o servidor local
  usado na validação respondeu `404` para `/api/v1/imports/spreadsheets`.
- **Impacto:** a importação real não inicia nesse ambiente pelo modo API.
- **Correção nesta Sprint:** não aplicada. Alterar importador ou backend está
  fora do escopo explícito da Sprint 18. A jornada local foi validada usando o
  modo local suportado.
- **Evidência:** resposta HTTP `404` e erro de recurso no navegador durante a
  tentativa de produção API.
- **Próxima ação necessária:** disponibilizar o contrato API no ambiente de
  produção ou configurar explicitamente o modo local apenas para execução
  local. Isso exige uma etapa própria, não uma correção silenciosa nesta Sprint.

## D-18-03 — VPN indisponível no ambiente da validação

- **Classificação:** bloqueio externo de validação, não defeito corrigido no
  produto.
- **Evidência:** Node e `nc` foram comparados no mesmo contexto; ambos
  registraram timeout para `10.12.22.14:3306`, sem interface `tun0`.
- **Impacto:** a jornada MySQL, autenticação, sincronização e falha segura sem
  VPN não puderam ser certificadas.
- **Ação:** nenhuma alteração de VPN, driver ou banco foi feita.

## Defeitos não reproduzidos

Não foram reproduzidos tela branca, perda de fonte da planilha, escrita na
origem, erro de contexto na jornada contextual, reload quebrado ou erro de
console no fluxo local validado.
