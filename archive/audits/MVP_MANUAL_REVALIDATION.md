# MVP Manual Revalidation

Data: 2026-07-21  
Evidência de referência: vídeo de homologação de 21-07-2026 e tabela manual
anexada ao pedido de recuperação.

## Evidência Automatizada Nova

`tests/e2e/mvp-manual-failure-recovery.spec.ts` passou em servidor de produção
isolado, com um worker e storage limpo apenas dentro do próprio teste. O teste
primeiro injeta o estado legado reproduzido, executa o reparo, importa a fonte,
configura os campos, ativa pela Biblioteca, abre apresentação, inicia reunião,
gera a ata e recarrega a página.

Resultado final da suíte automatizada: Playwright completo `56/56` aprovado em
2,2 minutos, sem retry. Typecheck e Vitest também foram executados nesta rodada:
`82 arquivos / 410 testes` aprovados. A validação focada da recuperação passou
`1/1`.

| Verificação | Resultado automatizado | Resultado manual Firefox Dev |
| --- | --- | --- |
| Contexto sem contradição | ✅ | Aguardando validação |
| Fonte com vínculo explícito | ✅ | Aguardando validação |
| Storage legado reparado | ✅ | Aguardando validação |
| Indicador sem inferência | ✅ | Aguardando validação |
| Gráfico numérico | ✅ | Aguardando validação |
| Tabela/configuração persistente | ✅ | Aguardando validação |
| Ativação pela Biblioteca | ✅ | Aguardando validação |
| Troca/isolamento de empresa | ✅ | Aguardando validação |
| Apresentação com conteúdo selecionado | ✅ | Aguardando validação |
| Reunião com conteúdo selecionado | ✅ | Aguardando validação |
| Ata e fechamento | ✅ | Aguardando validação |
| Reload | ✅ | Aguardando validação |
| Ausência de mock/demo na jornada | ✅ | Aguardando validação |
| Ausência de erro de rede no fluxo local | ✅ | Aguardando validação |

## Checklist Manual Obrigatório

Executar no Firefox Dev com o perfil histórico usado na homologação:

1. abrir o sistema e confirmar que Grupo, Empresa, Unidade e Projeto são
   compatíveis;
2. confirmar que a fonte informa vínculo ou “Fonte ainda não vinculada”;
3. abrir a Biblioteca, escolher a empresa e usar a planilha;
4. configurar indicador, gráfico e tabela, sem aceitar coluna não numérica;
5. trocar empresa e confirmar que a fonte e o conteúdo não vazam;
6. abrir apresentação e reunião somente após selecionar conteúdo;
7. finalizar e abrir a ata;
8. recarregar, sair e entrar novamente;
9. observar console e rede: nenhum POST 404 no fluxo de planilha;
10. repetir com o storage histórico sem limpar dados antes.

O parecer final não pode ser aprovado enquanto esta coluna manual estiver
pendente.
