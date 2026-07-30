# Sauron VPN Local Startup

## Objetivo

Executar a API no mesmo contexto do terminal Linux que possui a rota VPN para o
MySQL. A aplicação não cria nem simula uma VPN; ela apenas mede a rede do
processo que atende o navegador.

## Inicialização canônica

Abra o terminal depois de confirmar a VPN e inicie uma única API:

```bash
cd /home/natalicorreia/Documentos/Sauron-Consultor-BI-main
TMPDIR=/tmp/sauron-tsx PORT=3000 VITE_IMPORT_MODE=local npm run dev
```

O processo possui um lock em `/tmp/sauron-api-3000.lock`. Uma segunda
inicialização na mesma porta é recusada com o PID do processo existente.

Para verificar processos antigos antes de iniciar:

```bash
fuser -v 3000/tcp
ps -eo pid,user,cmd | rg 'tsx server.ts|dist/server.cjs|npm run dev'
```

Encerre somente o PID confirmado como servidor antigo, de forma graciosa:

```bash
kill <PID>
```

Não use `kill -9` como rotina e não encerre processos que não sejam a API.

## Diagnóstico comparativo

No mesmo terminal onde `nc` funciona:

```bash
./scripts/diagnose-network-context.mjs \
  --host 10.12.22.14 \
  --port 3306 \
  --api-url http://127.0.0.1:3000/api/db/network-context \
  --run-nc
```

O resultado deve mostrar:

- usuário, executável, hostname e namespace do Node do terminal;
- interfaces e rota escolhida;
- endereço local escolhido pelo socket;
- duração e código TCP;
- resultado do `nc` no mesmo terminal;
- PID, usuário, namespace, rota e TCP do processo da API;
- divergências entre Node local e API.

Também é possível abrir o diagnóstico administrativo em **VPN Gateway** e usar
**Diagnosticar servidor** em um alvo cadastrado.

## Etapas do banco

Somente depois de o TCP da API estar aberto, testar pela tela de banco:

1. handshake do driver;
2. autenticação MySQL;
3. database selecionado;
4. schema/tabelas;
5. `SELECT 1` limitado e somente leitura.

Uma etapa posterior não pode ser inferida a partir de uma etapa anterior. A
senha é enviada apenas durante a requisição de teste e não é gravada em
`localStorage`, `db_config.json` ou `vpn_configs.json`.

## Docker e sandboxes

Não usar `network_mode: host` sem comprovar que a API está dentro de um
container. Se o endpoint informar `containerized: false`, o diagnóstico deve
ser corrigido no processo/namespace real do host. Se houver container real,
validar o script dentro dele e só então escolher namespace de host ou uma rota
VPN explícita e segura.

Snap, Flatpak, proxy, usuário, namespace e interface divergentes devem ser
tratados como causa de contexto diferente, não como porta MySQL fechada.
