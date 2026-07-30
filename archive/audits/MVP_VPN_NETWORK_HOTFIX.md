# MVP VPN/MySQL Network Hotfix

Data: 2026-07-21  
Escopo: diagnosticar a divergência entre a conectividade observada no host e a
mensagem exibida pelo SAURON. F21 não foi iniciado.

## Caminho Real

```text
DatabaseConnector
  -> POST /api/db/test-connection
  -> server.ts no processo Node
  -> DatabaseConnectionManager.testConnection
  -> DNS -> rota/socket TCP -> driver MySQL -> autenticação -> banco/schema -> SELECT -> leitura
```

`POST /api/vpn/test-db` não é mais uma prova independente. Ele agora chama o
mesmo `DatabaseConnectionManager` com os dados do perfil e devolve a etapa real
que falhou. O antigo retorno por `setTimeout` foi removido.

## Comparação de Execução

| Ambiente | Evidência | Resultado |
| --- | --- | --- |
| Host Linux informado na homologação | `nc -vz 10.12.22.14 3306` e telnet com handshake MySQL 5.7.18-log | Socket aberto e handshake confirmado |
| Processo Node desta execução | Probe `node:net` para `10.12.22.14:3306` | Timeout; este processo não está usando a mesma rota/namespace da evidência do host |
| Docker desta execução | `docker ps`/`docker info` | Não foi possível inspecionar: acesso negado ao socket Docker |

O SAURON não transforma o resultado de um ambiente em resultado de outro. A
API agora devolve `runtime`, host, porta e todas as etapas, permitindo provar
onde a divergência ocorre. Um timeout do Node é descrito como falha de alcance
do processo Node, não como prova de que a porta está fechada no host.

## Etapas Separadas

1. VPN/túnel: somente `useSshTunnel` comprovado pelo processo é marcado.
2. Rota: alcançada pelo socket do processo Node.
3. Host: resolução DNS feita pelo processo Node.
4. Porta: socket TCP aberto ou erro com código/timeout.
5. Handshake: negociado pelo driver, quando aplicável.
6. Autenticação: credencial aceita ou rejeitada pelo banco.
7. Banco: database/catalog selecionado.
8. Schema: catálogo/tabelas acessíveis.
9. SELECT: consulta limitada somente leitura.

O endpoint `GET /api/db/network-context` expõe somente processo, PID, hostname
e evidência de containerização; não expõe segredos.

## Segurança e Cache

- Resultado de diagnóstico usa `Cache-Control: no-store` e a tela limpa o
  resultado antes de cada teste.
- `password`, `sshPassword`, `sshPrivateKey` e `connectionString` não entram no
  `localStorage`, `db_config.json` ou resposta de configuração.
- Credenciais recebidas pelo backend ficam apenas na memória do processo Node
  durante a sessão atual.
- Perfis VPN antigos com estado `connected` sem evidência TCP são invalidados
  na leitura. O servidor não grava conteúdo `.ovpn` ou senha.
- Planilhas, IndexedDB e ActiveDataset não foram alterados.

## Teste de Contrato

`DatabaseConnectionManager.createForTesting` aceita um `TcpProbe` injetável.
Os testes comprovam que:

- socket aberto avança para a etapa de autenticação e nunca retorna erro de
  porta fechada;
- falha real do probe retorna etapa `port` com código e contexto do processo.

Arquivo: `src/core/connections/DatabaseConnectionManager.test.ts`.

## Validação desta Rodada

- `npm run typecheck`: aprovado;
- Vitest: `82 arquivos / 412 testes` aprovados;
- E2E `mvp-manual-failure-recovery.spec.ts`: `1/1` aprovado após o hotfix;
- build local: aprovado, com o alerta conhecido de bundle principal grande;
- `git diff --check`: aprovado;
- API em execução: `GET /api/db/network-context` confirmou processo Node fora
  de container; o diagnóstico TCP retornou `stage=port` e deixou explícito que
  o timeout pertence à rota deste processo, não prova porta fechada no host.

## Rota de Produção Local

Não existe `docker-compose.yml` ou `Dockerfile` operacional neste repositório,
e o daemon Docker não estava acessível nesta execução. Portanto, nenhuma rota
de container foi declarada como corrigida sem evidência.

Quando o backend for executado em container Linux, ele deve compartilhar a
namespace de rede do agente VPN (`network_mode: host`) ou receber uma rota
explícita para a interface VPN. A configuração deve ser validada novamente
com `GET /api/db/network-context` e um probe TCP executado dentro do próprio
container antes de marcar a rede como alcançável.
