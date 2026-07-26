# MVP MySQL Runtime Certification

Data: 2026-07-22  
Alvo: `10.12.22.14:3306`

## Contrato certificado

Para aprovação, todos os itens abaixo precisam ser comprovados pelo processo
Node que atende a API:

1. socket TCP aberto;
2. handshake MySQL concluído;
3. autenticação aceita;
4. database selecionado;
5. schema/tabelas acessíveis;
6. `SELECT 1` executado com sucesso em modo somente leitura.

## Resultado desta rodada

| Etapa | Resultado |
| --- | --- |
| processo Node da API | identificado, PID `3122605` |
| usuário/namespace | `natalicorreia`, UID `1001`, namespace `4026531840` |
| rota | `wlp2s0`, origem `192.168.1.28`, gateway `192.168.1.1` |
| TCP `10.12.22.14:3306` | timeout de aproximadamente 4 segundos |
| handshake | pendente |
| autenticação | pendente |
| database | pendente |
| schema | pendente |
| `SELECT 1` | pendente |

## Segurança

O diagnóstico não retorna senha, chave, conteúdo VPN ou connection string. A
configuração persistida contém apenas metadados. Os endpoints de diagnóstico
usam `Cache-Control: no-store`.

## Parecer

## ❌ REPROVADO

O processo Node da API ainda não abriu o socket TCP no runtime validado. Como o
TCP falhou, não há evidência válida de handshake, autenticação, database,
schema ou `SELECT 1`. A evidência anterior de `nc`/`telnet` no terminal VPN
continua válida para aquele terminal, mas não certifica este processo Node.

Não foi aplicada configuração Docker ou alteração de rota sem comprovação de
container/namespace. A certificação poderá ser reexecutada após o comando
canônico ser iniciado no mesmo contexto que apresenta o `nc` bem-sucedido.
