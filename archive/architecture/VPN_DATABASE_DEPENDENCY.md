# VPN e Banco de Dados: Dependência Operacional

## Fluxo canônico localizado

```text
Menu Conectar Dados
  -> AppSidebar
  -> activeTab = vpn_gateway
  -> App.tsx
  -> VpnGatewayTab
  -> API /api/vpn/*
```

O acesso ao banco existente segue outro caminho:

```text
Central de Dados
  -> DatabaseConnector
  -> /api/db/test ou /api/db/fetch
  -> DatabaseConnectionManager
```

O `DatabaseConnectionManager` possui túnel SSH e validação de consulta
somente leitura. Ele não resolve, no contrato atual, um perfil `vpn_gateway`
conectado antes do teste do banco.

## Restauração realizada

O item existente `vpn_gateway` foi recolocado no
`getConsultingFlowStructure` com o rótulo `VPN e Banco de Dados`. A rota já
registrada continua sendo usada; nenhum módulo paralelo foi criado.

## Dependência correta a validar

Quando uma conexão de banco exigir rede privada, a ordem executada pelo
diagnóstico deve ser:

1. configurar um perfil autorizado;
2. conectar a VPN por um serviço de servidor;
3. comprovar processo, interface, rota e alcance;
4. testar host e porta do banco;
5. autenticar com perfil somente leitura;
6. executar uma consulta limitada e segura;
7. listar ou importar dados.

VPN conectada não equivale a banco conectado.

## Estado atual e limitação

`/api/vpn/connect` não cria um processo VPN. Ele executa somente um probe TCP
real e marca a rede como alcançável quando o processo Node abre o socket.
`/api/vpn/test-db` usa o `DatabaseConnectionManager` real e devolve a etapa
de falha, sem resposta sintética. A existência de um cliente VPN externo e a
rota do container ainda precisam ser validadas no mesmo ambiente de execução.
