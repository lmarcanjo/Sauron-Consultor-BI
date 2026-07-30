# MVP Node Network Context Baseline

Data: 2026-07-22  
Escopo: comparação entre o processo Node da API, o probe Node executado no
terminal e o probe `nc` no mesmo contexto de execução.

## Implementação observada

O caminho usado pela aplicação é:

```text
VpnGatewayTab / DatabaseConnector
  -> /api/db/network-context
  -> server.ts
  -> DatabaseConnectionManager.diagnoseNetworkContext
  -> DNS/route + socket TCP do processo Node
```

`server.ts` e `/api/db/network-context` são atendidos pelo mesmo processo. O
endpoint retorna apenas metadados de execução e diagnóstico de rede; não recebe
nem retorna credenciais.

## Evidência do processo da API

Comando executado:

```text
TMPDIR=/tmp/sauron-tsx PORT=3011 VITE_IMPORT_MODE=local npm run dev
```

Resultado observado em `GET /api/db/network-context`:

| Campo | Resultado |
| --- | --- |
| PID | `3122605` |
| início estimado do processo | retornado pelo endpoint como `startedAt` |
| executável | `/usr/bin/node` |
| usuário efetivo | `natalicorreia` / UID `1001` |
| hostname | `natalicorreia-Inspiron-15-3530` |
| container | não detectado |
| namespace de rede | `4026531840` |
| proxy | nenhuma variável detectada |
| interface usada na rota | `wlp2s0` |
| endereço local da rota | `192.168.1.28` |
| gateway | `192.168.1.1` |
| bind da API | `0.0.0.0:3011` |

Não havia interface `tun0` ou outra interface de VPN exposta ao processo Node
nesta execução.

## Probe do alvo MySQL

Alvo: `10.12.22.14:3306`  
Tipo: MySQL

| Etapa | Resultado |
| --- | --- |
| resolução do host | `10.12.22.14` / IPv4 |
| rota | `ip route get 10.12.22.14`, via `wlp2s0` |
| socket TCP | falhou por timeout |
| duração | aproximadamente `4002 ms` |
| código | sem código de erro do socket; erro `TCP timeout` |
| handshake | não executado |
| autenticação | não executada |
| database/schema | não executados |
| `SELECT 1` | não executado |

A API informa “TCP timeout no processo Node”; ela não afirma que a porta esteja
fechada em outro ambiente.

## Comparação com o terminal

O usuário forneceu evidência de `nc` e `telnet` bem-sucedidos em um terminal
Linux com VPN ativa. O probe desta rodada, executado pela API, não alcançou o
mesmo destino e usou `wlp2s0`, sem interface VPN visível. Isso é evidência de
contextos de rede diferentes ou de uma VPN/rota não ativa no runtime da API.

O script executável compara os três pontos quando chamado no terminal que tem a
VPN ativa:

```text
./scripts/diagnose-network-context.mjs \
  --host 10.12.22.14 \
  --port 3306 \
  --api-url http://127.0.0.1:3000/api/db/network-context \
  --run-nc
```

O bloco `localNodeProbe` representa o Node do terminal, `terminalNcProbe`
representa o `nc` iniciado nesse mesmo contexto e `apiProbe` representa o
processo que atende a API.

## Conclusão do baseline

O processo Node da API ainda não está certificado como co-localizado com o
terminal que alcança o MySQL. Não foi aplicada configuração Docker, namespace
de rede ou alteração de rota do sistema. O diagnóstico agora torna a diferença
observável antes de qualquer tentativa de autenticação.
