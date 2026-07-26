# MVP Polish Baseline

Data: 2026-07-20
Escopo: baseline antes da correção incremental de UX data-first, contexto e
comportamentos legados.

## Verificações técnicas

| Verificação | Resultado |
| --- | --- |
| `npm run typecheck` | aprovado |
| `npx vitest run` | 82 arquivos, 410 testes aprovados |
| `npm run build` | aprovado; alerta conhecido de chunk grande |
| `git diff --check` | aprovado |
| Playwright completo | 52 aprovados, 2 flaky |

## Playwright

O primeiro comando completo não iniciou porque a porta 3000 já estava ocupada
fora do namespace observável pelo processo de teste. A configuração passou a
aceitar `E2E_PORT`; a suíte foi então executada isoladamente em 3001.

Os dois cenários flaky foram:

- `tests/e2e/f19-consultant-delight.spec.ts`;
- `tests/e2e/rc3-enterprise-certification.spec.ts`.

Em ambos, `filechooser.setFiles()` concluiu sem erro, mas a asserção pelo nome
exato do CSV não encontrou o texto na janela de importação dentro do timeout.
O impacto é impedir a certificação do fluxo principal mesmo quando a leitura
do arquivo não lança erro. A causa provável é uma corrida entre o fechamento
do modal de importação e a pintura da fila/resultado do arquivo.

## Riscos de produto observados

- `DashboardPage` renderiza `ExecutiveDashboardEngine` mesmo sem configuração
  escolhida pelo consultor, o que pode exibir indicadores pendentes ou
  inferidos.
- A configuração de colunas já preserva `physicalName`, mas ainda não possui
  `consultantLabel` nem uma escolha explícita de uso por coluna.
- A resolução de contexto está espalhada entre stores e consumidores; não há
  um resolvedor único para a UI.
- Não há serviço explícito para diagnosticar e reparar estados locais antigos
  de maneira idempotente.
- A interface VPN existente comunica uma simulação como se fosse infraestrutura
  disponível; isso precisa ser declarado de forma honesta.

## Critério para esta etapa

Os problemas acima serão corrigidos incrementalmente. A certificação final só
será emitida após a suíte completa, o fluxo MVP específico e a inspeção do
diff passarem sem regressão.
