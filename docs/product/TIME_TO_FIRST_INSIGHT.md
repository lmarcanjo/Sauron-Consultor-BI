# Time To First Insight

## Definição

Tempo entre a confirmação da primeira planilha e a primeira visão que mostra
um resultado ou uma pendência acionável. A métrica não considera números que
não tenham origem na planilha.

## Instrumentação planejada

1. Marcar o instante em que a fonte é ativada.
2. Marcar a primeira abertura de `Diagnóstico Executivo` ou `KPIs & DRE`.
3. Registrar cliques, tempo de espera, retorno e mensagem exibida.
4. Repetir com as seis personas sem ajuda técnica.

## Referência F19

| Medição | Resultado |
| --- | --- |
| Baseline de código/E2E | Fluxo existente com 5+ ações após importação, sem sessão humana |
| Meta | primeiro insight em até 30 segundos |
| Feedback após 500 ms | deve existir estado de preparação |
| Feedback após 2 s | deve explicar o que está sendo lido |
| Feedback após 5 s | deve mostrar progresso real |
| Resultado automatizado F19 | 12,2 s até a primeira visão no cenário focado |
| Resultado desta rodada | Ainda não certificado humanamente |

O E2E F19 registra os tempos observados e falha em tela vazia, loading sem
saída, erro de console ou termos técnicos proibidos. Ele não substitui a
observação humana.
