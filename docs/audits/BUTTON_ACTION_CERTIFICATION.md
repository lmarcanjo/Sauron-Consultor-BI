# Button Action Certification

Data: 2026-07-20

| Área | Ação | Resultado observado |
| --- | --- | --- |
| Importação | Importar Planilha | abre o importador e recebe o arquivo |
| Importação | Importar | persiste, vincula e ativa a fonte |
| Dashboard | Editar informações | abre a edição de colunas físicas |
| Dashboard | Salvar configuração | persiste label, uso e tabela e atualiza a visão |
| Dashboard | Criar indicador | cria indicador somente após coluna/operação/formato |
| Dashboard | Criar gráfico | cria gráfico somente após categoria/valor/operação |
| Tabela | Escolher informações | abre a seleção de colunas da tabela |
| Centro de Dados | Verificar dados locais | executa reparo idempotente e mostra resultado |
| Biblioteca | Usar esta planilha | troca a fonte ativa pela operação existente |
| VPN | Testar BD | mostra que o retorno é simulação local, não conexão certificada |

Os fluxos E2E MVP, F19 e RC3 cobrem clique, feedback visual, reload e
ausência de tela branca. A auditoria não considera um botão pronto apenas por
ter um `onClick`: a ação precisa produzir mudança observável ou informar
claramente que ainda está pendente.
