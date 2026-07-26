# Checklist Manual: VPN e Banco de Dados

Preencher somente em ambiente autorizado, com perfil do cliente e banco de
leitura. Nunca colar senha, chave privada ou conteúdo completo de configuração
no relatório.

## Preparação

- [ ] OpenVPN, WireGuard ou cliente aprovado instalado no servidor responsável.
- [ ] Arquivo de configuração autorizado disponível (`.ovpn` ou `.conf`).
- [ ] Credencial de VPN disponível por canal seguro.
- [ ] Host, porta, banco e schema confirmados pelo cliente.
- [ ] Usuário do banco possui somente leitura.

## Interface e arquivo

- [ ] Abrir `Conectar Dados`.
- [ ] Encontrar `VPN e Banco de Dados`.
- [ ] Confirmar que o estado inicial é `Desconectada`.
- [ ] Selecionar arquivo inválido/atalho e confirmar mensagem clara.
- [ ] Selecionar arquivo de configuração autorizado.
- [ ] Confirmar que senha não aparece na tela, URL, console ou armazenamento do navegador.

## VPN

- [ ] Iniciar conexão.
- [ ] Confirmar `Preparando conexão`.
- [ ] Confirmar `Conectando à rede do cliente`.
- [ ] Confirmar processo real ativo.
- [ ] Confirmar interface de túnel criada, quando aplicável.
- [ ] Confirmar rota para o host do banco.
- [ ] Confirmar `Rede conectada` somente após evidência real.
- [ ] Em falha, confirmar mensagem sem stack trace e opção de tentar novamente.

## Banco

- [ ] Testar DNS/host.
- [ ] Testar porta.
- [ ] Testar autenticação.
- [ ] Validar banco e schema.
- [ ] Executar `SELECT` limitado e somente leitura.
- [ ] Listar tabelas permitidas.
- [ ] Confirmar que INSERT, UPDATE, DELETE, DROP, ALTER, CREATE e TRUNCATE são bloqueados.
- [ ] Confirmar que VPN desconectada impede ou explica o teste do banco.

## Encerramento e recuperação

- [ ] Desconectar a VPN.
- [ ] Confirmar processo encerrado e interface removida.
- [ ] Confirmar banco invalidado após desconexão.
- [ ] Recarregar a página.
- [ ] Confirmar que o perfil aparece configurado, mas o estado começa desconectado
      se o processo real não puder ser comprovado.
- [ ] Fechar e reabrir o servidor.
- [ ] Confirmar ausência de processo VPN órfão.
- [ ] Repetir conexão e cancelar durante `CONNECTING`.
- [ ] Confirmar console limpo e ausência de segredos nos logs.

## Evidências sem segredo

- Data/hora:
- Ambiente/servidor:
- Tipo de VPN:
- Host testado, sem credencial:
- Porta testada:
- Resultado da rota:
- Resultado do host:
- Resultado da porta:
- Resultado da consulta somente leitura:
- Resultado da desconexão:
- Observações:
