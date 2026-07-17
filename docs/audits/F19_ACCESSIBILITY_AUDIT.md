# F19 Accessibility Audit

Data: 2026-07-17

## Escopo

Revisão incremental das áreas alteradas: Home, barra de visão, importação,
confirmação de informações, Dashboard e resultado financeiro.

## Correções aplicadas

- seletores de Grupo, Empresa, Unidade, Projeto, Período e Área de atuação
  receberam `aria-label`;
- atualização de visão comunica estado com `role="status"` e `aria-live`;
- ação principal da Home tem texto direto e foco no próximo passo;
- estados sem fonte orientam o consultor a adicionar uma planilha;
- nomes técnicos foram removidos dos estados principais;
- ações existentes continuam usando botões nativos e controles de formulário.

## Verificações pendentes

- execução formal de axe nas telas principais;
- contraste AA em todos os estados e zoom de 200%;
- ciclo completo de foco em modais com teclado;
- sessão humana sem ajuda.

O E2E F19 não registrou erro de console, tela branca ou falha de teclado no
percurso coberto. Ainda não há evidência suficiente para declarar zero
violações críticas ou sérias em todas as telas; o parecer final F19 permanece
reprovado até a execução formal.
