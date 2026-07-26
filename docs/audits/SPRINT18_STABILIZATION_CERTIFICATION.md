# Sprint 18 Product Stabilization Certification

Data: 2026-07-25

## Escopo

Esta rodada validou a estabilização do fluxo canônico da Sprint 17 sem criar
engines, módulos, importadores, arquitetura ou funcionalidades novas.

## Evidências técnicas

| Verificação | Resultado |
| --- | --- |
| `npm run typecheck` | aprovado |
| `npm run lint` | aprovado |
| `npm run build` | aprovado; alerta não bloqueante de chunk grande |
| Vitest | 87 arquivos, 418 testes aprovados em 104,64 s |
| Playwright smoke em produção | 6/6 aprovados em 4,7 s |
| Playwright completo em produção | 59/59 aprovados em 2,1 min, um worker |
| `git diff --check` | aprovado |
| Jornada Honda no navegador | 18 etapas, zero falhas de browser/HTTP |

## Jornada real de planilha

O arquivo Honda foi importado no contexto `Grupo Sprint 18` / `Empresa Sprint
18`. O profiling usou 500 linhas amostradas e exibiu 14.995 linhas conhecidas.
Selecionar, limpar e confirmar a visão funcionaram. Resultados, reload,
apresentação, snapshot, sessão e ata também funcionaram. O arquivo original
não foi alterado e nenhuma escrita externa foi executada.

## Consistência e desempenho

O fluxo manteve o volume conhecido e o limite de amostra sem carregar a fonte
inteira para a interface. A jornada completa terminou em aproximadamente 18,9
s. O bundle principal permanece em aproximadamente 1,7 MB, com chunk XLSX de
aproximadamente 420 kB e o aviso existente acima de 500 kB.

## Pendências que impedem aprovação

1. A validação manual humana ainda não foi executada; a evidência disponível é
   uma jornada automatizada de navegador.
2. A jornada MySQL real via VPN não foi executada porque o ambiente atual não
   possuía a rota VPN e o TCP terminou em timeout.
3. O modo API do bundle de produção local respondeu 404 no endpoint de upload;
   isso precisa de provisionamento/integração própria e não foi alterado por
   esta Sprint.
4. A troca de empresa e o isolamento SQL permanecem pendentes de validação
   manual nesta rodada; a jornada multiempresa automatizada anterior pertence à
   certificação RC-3.

## Conclusão

Os defeitos da jornada local reproduzidos nesta Sprint foram classificados e o
seletor duplicado foi corrigido. Porém, a Sprint exige planilha real, MySQL real
via VPN e validação manual do consultor. Como essas evidências não estão
completas, não há base para aprovação Enterprise.

## ❌ REPROVADO

Motivo exato: a jornada de planilha passou em navegador automatizado, mas a
validação manual e a jornada MySQL via VPN não foram concluídas; além disso, o
modo API local respondeu 404 no endpoint de importação. Nenhum desses pontos foi
mascarado por alteração fora do escopo.
