# Sauron VPN Gateway Architecture

## Objetivo
O Sauron VPN Gateway foi criado com o propósito de conectar o sistema Sauron aos bancos de dados internos dos clientes, sem expor as redes de múltiplos clientes umas às outras, e sem exigir que o consultor instale os perfis de VPN (como OpenVPN, WireGuard ou IPSec) na sua própria máquina (evitando route leaking e comprometimento do hardware pessoal do consultor).

## Arquitetura e Fluxo

A arquitetura se baseia em Containers Docker efêmeros para cada cliente.

1. **Client Management / Frontend:** O gateway permite o cadastro de configurações `.ovpn` ou `.conf` juntamente com as credenciais do banco de dados alvo (Host e Porta internos da rede do cliente). 
2. **Isolamento de Redes (Subnets):** Quando um consultor aciona a conexão com a VPN de um cliente, o backend Node.js (via Docker SDK / Docker Compose API) sobe instantaneamente um container `openvpn-client` atrelado a uma rede Docker bridge exclusiva criada on-the-fly (`sauron_client_network_<id>`).
3. **Comunicação Read-Only Limitada:** O sistema de consultas do Sauron acessa o banco do cliente pelo túnel exposto do container VPN. O backend Node.js aplica um strict middleware no driver do banco que bloqueia todas as instruções de mutação (`INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, `CREATE`, `TRUNCATE`), permitindo apenas o comando `SELECT` (ou equivalentes leitura).
4. **Segurança de Credenciais:** Arquivos de VPN, chaves e senhas são encriptados na camada de persistência.
5. **Lifecycle:** Após a extração dos dados (Fechamento Mensal), o container VPN daquele cliente é desligado e descartado automaticamente, fechando o túnel temporário.

## Estrutura Docker-Compose Genérica

Para instanciar o backend Sauron juntamente com o gerenciador Docker de VPNs no ambiente local/servidor do Sauron:

```yaml
version: '3.8'

services:
  sauron-core:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DOCKER_HOST=unix:///var/run/docker.sock # Necessário para Node.js controlar containers VPN on-the-fly
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - ./data:/app/data

  # Os containers abaixo são gerenciados de forma dinâmica pelo sauron-core, 
  # sendo criados pela API rest: /api/vpn/connect
  # Exemplo conceitual do que o backend sobe via Docker SDK:
  #
  # vpn-client-alpha:
  #   image: dperson/openvpn-client
  #   cap_add:
  #     - net_admin
  #   volumes:
  #     - ./data/vpns/alpha_leste.ovpn:/vpn/vpn.conf
  #   networks:
  #     - sauron_client_alpha
  #
  # postgres-client-alpha:
  #   image: alpine/socat
  #   command: tcp-listen:5432,fork tcp:10.0.0.10:5432
  #   network_mode: service:vpn-client-alpha
```

## Como o Failover e Fallback funcionam
- O Sauron foi reconfigurado para diferenciar explicitamente entre "Dados Reais (VPN/Live)" e "Demonstração (Mock / Empresas Fictícias)".
- Diferente de versões anteriores que caiam automaticamente para um mock de dados simulados quando a conexão à VPN falhava, agora o Sauron exibe um status de ERRO explícito se a VPN cair. Ele não fingirá sucesso com dados simulados sob demanda, garantindo integridade e transparência da fonte de dados ao consultor e cliente final.

## Considerações do Ambiente Cloud Limitado (Sandbox):
*No ambiente atual de homologação em nuvem (Cloud Run Sandbox restrito onde a IDE roda), o Sauron não possui montagem de daemon `/var/run/docker.sock` para interagir nativamente com a `docker0`. Consequentemente, o backend simula os Lifecycle hooks dos containers da VPN para permitir a navegação da Interface (UI) e o Teste de Banco.*
