# VPN e Credenciais de Banco

## Regras obrigatórias

- senha nunca deve ser salva em `localStorage` ou `sessionStorage`;
- senha nunca deve aparecer em URL, console, auditoria ou relatório;
- conteúdo `.ovpn`, `.conf`, chave privada e tokens devem permanecer no
  processo seguro do servidor;
- o frontend deve receber somente metadata sanitizada e estado da conexão;
- a desconexão deve limpar segredos em memória e invalidar o banco dependente;
- arquivos temporários devem ter permissão restrita e remoção garantida;
- consultas de banco devem permanecer somente leitura, limitadas e auditadas.

## Achado da implementação anterior

`VpnGatewayTab` envia `vpnPass` e `ovpnContent` para `/api/vpn/add`. O endpoint
antigo grava o corpo recebido em `vpn_configs.json`. Isso não atende ao
contrato de segurança Enterprise e não deve ser usado para credenciais reais.

O servidor também promovia o estado para `connected` usando `setTimeout`. Esse
estado não era prova de uma VPN ativa. O hotfix removeu esse caminho: o estado
de rede só é atualizado após um socket TCP real aberto pelo processo Node, e o
resultado continua explicitamente limitado a alcance de rede.

## Decisão desta etapa

Credenciais reais permanecem somente na memória do processo Node durante o
teste/sessão. O arquivo VPN, senhas e connection strings não são persistidos.
Alcance TCP, VPN, autenticação e banco continuam estados distintos.

Não há senha, chave, conteúdo de configuração ou endpoint sensível neste
documento.
