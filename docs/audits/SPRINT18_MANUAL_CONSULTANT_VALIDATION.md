# Sprint 18 Manual Consultant Validation

Data: 2026-07-25  
Planilha: `Teste_Automação_Peças Honda Faberge Mogi~06.26 Veiculo ativou.xlsx`

## Limite da evidência

A execução disponível nesta rodada foi uma jornada de navegador controlada por
Playwright, com a interface real e sem mocks. Ela é evidência funcional de
navegação, mas não substitui a validação manual humana exigida pela Sprint 18.
Por isso o parecer final permanece reprovado até a confirmação manual do
consultor e a execução com MySQL real via VPN.

## Jornada da planilha

| Etapa | Evidência observada |
| --- | --- |
| Sessão | Consultor Sprint 18 autenticado |
| Contexto | Grupo `Grupo Sprint 18` e empresa `Empresa Sprint 18` criados e selecionados |
| Importação | Arquivo real carregado; 3 seletores de contexto disponíveis |
| Ativação | Fonte ativada sem erro de navegador ou HTTP |
| Análise | Profiling concluído; dados originais não foram alterados |
| Volume | 14.995 linhas conhecidas e 500 linhas amostradas |
| Seleção | `Selecionar todas` e `Limpar seleção` executados |
| Visão | Rascunho criado e visão confirmada |
| Resultados | Visão executiva aberta com o contexto criado e 14.995 registros |
| Reload | Análise e fonte permaneceram acessíveis após recarregar |
| Apresentação | Tela aberta após reload |
| Reunião | Snapshot salvo e sessão iniciada para a empresa selecionada |
| Ata | Sessão encerrada e ata visualizada |

Tempo total observado: 18,9 s. Foram registradas 18 etapas, sem `pageerror`,
`console.error`, `console.warn`, resposta HTTP inesperada ou request falho.

## Correção reproduzida

O seletor `btn-open-data-center` existia simultaneamente no botão canônico da
barra lateral e no botão de cabeçalho. Isso tornava a automação e qualquer
integração que esperasse uma ação única ambíguas. O cabeçalho preservou o
contrato original e a barra lateral passou a usar
`btn-sidebar-open-data-center`; nenhuma ação visual foi removida ou duplicada.

## MySQL via VPN

Não foi possível concluir a jornada SQL neste ambiente. O diagnóstico de
25/07/2026 registrou Node e `nc` no mesmo usuário, executável, hostname e
namespace, mas sem `tun0`: a rota saiu por `wlp2s0` (`192.168.1.28` via
`192.168.1.1`) e o TCP para `10.12.22.14:3306` terminou em `ETIMEDOUT`.

Assim, não foram executados autenticação, seleção de tabela, profiling SQL,
sincronização ou teste de falha sem VPN. Nenhuma operação de escrita foi feita.

## Checklist manual pendente

- [ ] repetir a jornada da planilha em navegador operado pelo consultor;
- [ ] trocar empresa e confirmar isolamento;
- [ ] executar a jornada MySQL com VPN ativa;
- [ ] confirmar somente leitura, paginação e snapshot após desligar a VPN.

## Resultado

A jornada real de planilha está funcional sob automação controlada. A
certificação manual completa não pode ser declarada nesta execução.
