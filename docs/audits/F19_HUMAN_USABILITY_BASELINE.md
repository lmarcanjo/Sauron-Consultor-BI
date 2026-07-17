# F19 Human Usability Baseline

Data: 2026-07-17  
Escopo: jornada local do consultor, antes dos ajustes F19.

## Evidência disponível

O baseline combina inspeção da jornada visível, o fluxo E2E executivo e os
cenários multiempresa já certificados. Os números abaixo são estimativas de
cliques da interface atual, não observação humana; uma sessão com consultor
real ainda precisa ser realizada antes de qualquer parecer de aprovação F19.

Baseline técnico anterior: `npm run typecheck` aprovado, 369/369 testes
Vitest aprovados, build aprovado com alerta conhecido de bundle grande. Após
os ajustes F19, a suíte Playwright completa passou 27/27 em 3,0 minutos,
com um worker e sem retries.

## Jornada observada

| Etapa | Cliques estimados | Dúvida provável | Risco | Prioridade |
| --- | ---: | --- | --- | --- |
| Primeiro acesso | 1 ação principal após ler a tela | Onde cadastro o primeiro cliente? | Médio | P1 |
| Criar grupo | 2-3 | “Grupo” e “Empresa” parecem equivalentes | Médio | P1 |
| Criar empresa/unidade | 3-5 por entidade | Qual entidade deve ser escolhida como pai? | Alto | P0 |
| Importar arquivos | 4-6 | Preciso escolher todas as abas? | Alto | P0 |
| Vincular fonte | 3 seleções + importar | Termo “vínculo” é técnico | Alto | P0 |
| Confirmar campos | 2 para aceitar sugestão; 4+ para revisar | O que é um campo semântico? | Médio | P1 |
| Ativar e abrir análise | 2-4 | A análise está pronta ou falta algo? | Médio | P1 |
| Trocar empresa | 1 seleção + espera de atualização | A visão anterior foi descartada? | Alto | P0 |
| Abrir DRE | 2-3 pela navegação atual | Onde está o resultado financeiro? | Médio | P1 |
| Preparar reunião/apresentação | 2-4 | Qual das telas de preparação devo abrir? | Médio | P1 |
| Sessão, ata e plano | 3-6 | O que encerra a sessão e salva o resultado? | Médio | P2 |
| Arquivar/restaurar | 3-5 | O que deixa de aparecer e como desfazer? | Alto | P0 |
| Excluir | 3-6 + confirmação | O impacto alcança outras empresas? | Alto | P0 |
| Reload e login | 1-3 | Meu projeto e minha visão continuam iguais? | Alto | P0 |

## Atritos P0

- Ações essenciais competem com muitos módulos na Home.
- A importação pede decisões técnicas antes de explicar o resultado da ação.
- Troca de contexto precisa comunicar claramente qual empresa está sendo
  atualizada, sem deixar a visão anterior parecer válida durante o carregamento.
- Exclusão/arquivamento exige confiança explícita e uma saída recuperável.

## Atritos P1

- “Biblioteca de Planilhas” é compreensível, mas a instrução para continuar
  após importar fica separada do botão principal.
- “Workspace”, “Dataset”, “Mapeamento” e “Prontidão” ainda aparecem em áreas
  visíveis ou são usados como linguagem mental da jornada.
- Estados pendentes existem, mas nem sempre dizem qual ação libera a análise.

## Medição a repetir depois da implementação

Foi executada automaticamente com a mesma jornada e arquivos sintéticos de
entrada; a medição humana ainda precisa ser repetida com consultor:

- tempo até primeiro insight;
- tempo até DRE;
- tempo de troca de empresa;
- tempo até apresentação;
- cliques, retornos, hesitações e mensagens técnicas;
- erros de console, tela branca e loading sem saída.

Resultado automatizado F19: 1/1 em 12,2 s na execução final; F18 + F19
focado: 7/7 em 37,8 s; suíte completa: 27/27 em 3,0 min.

## Limitação de certificação

Este documento é o registro do baseline. Ele não substitui a sessão
observacional prevista na F19 e, isoladamente, não autoriza o parecer
`APROVADO PARA TESTE HUMANO AMPLIADO`.
