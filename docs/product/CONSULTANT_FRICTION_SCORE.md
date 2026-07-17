# Consultant Friction Score

Modelo interno para comparar a jornada antes e depois da F19. Não é exibido
ao cliente e não altera decisões de negócio.

## Modelo

```text
ConsultantFrictionScore {
  taskId
  clicks
  timeSeconds
  hesitations
  backtracks
  errors
  unclearMessages
  technicalTerms
  score
}
```

O score é uma régua operacional de 0 a 100. Quanto maior, maior o atrito:

- cliques: 25 pontos;
- tempo acima do objetivo: 20 pontos;
- retornos e hesitações: 15 pontos;
- erros recuperáveis: 15 pontos;
- mensagens sem próxima ação: 15 pontos;
- termos técnicos visíveis: 10 pontos.

## Baseline e meta

| Tarefa | Baseline observado/estimado | Meta F19 | Situação |
| --- | ---: | ---: | --- |
| Primeiro insight após fonte | 5+ cliques, sem medição humana | até 3 cliques após importação | Automatizado em 11,4 s |
| Trocar empresa | 1 seleção, atualização assíncrona | até 20 s, sem visão anterior | Em validação |
| Abrir DRE | 2-3 cliques | até 3 cliques | Em validação |
| Confirmar informações | 2 cliques para sugestão | até 3 cliques | Melhorado |
| Preparar reunião | 2-4 cliques | até 3 cliques | Em validação |
| Arquivar/restaurar | 3-5 cliques | até 3 cliques | Em validação |

## Evidência atual

A Home agora oferece uma próxima ação contextual: adicionar dados, confirmar
informações ou abrir a análise/preparação. A importação e a configuração usam
linguagem de tarefa. A medição definitiva de hesitações e tempo depende de uma
sessão observacional com consultor, ainda não executada neste ambiente.

Evidência automatizada: F19 passou 1/1 em 12,2 s; F18 + F19 passou 7/7 em
37,8 s; a suíte completa passou 27/27 em 3,0 min.
