# MVP VPN Restore Baseline

Data: 2026-07-20  
Escopo: localizar a implementação anterior antes de restaurar sua visibilidade.

## Implementação anterior localizada

| Camada | Evidência | Estado encontrado |
| --- | --- | --- |
| Interface | `src/components/VpnGatewayTab.tsx` | Ainda existe e usa `/api/vpn/*`. |
| Rota React | `src/App.tsx` | `vpn_gateway` ainda está no render principal. |
| Registro | `src/core/navigation/NavigationRegistry.ts` | Item `VPN Gateway` ainda registrado. |
| Navegação visível | `src/core/navigation/consultingFlowStructure.ts` | Removida: Conectar Dados exibia apenas importar e biblioteca. |
| Banco | `src/components/DatabaseConnector.tsx` e `src/core/connections/DatabaseConnectionManager.ts` | Fluxo separado de conexão e túnel SSH continua existente. |
| Backend | `server.ts` | Endpoints `/api/vpn/list`, `/add`, `/connect`, `/disconnect` e `/test-db` continuam presentes. |
| Testes | `src/core/connections/DatabaseConnectionManager.test.ts` | Há cobertura de conexão/SQL; não havia contrato de visibilidade da VPN. |

## Causa da ausência na interface

O componente e a rota não foram removidos. A simplificação do MVP deixou o item
`vpn_gateway` fora de `getConsultingFlowStructure`, embora o restante do
encadeamento ainda existisse. O consultor não conseguia chegar à tela pela
navegação principal.

## Riscos encontrados na implementação anterior

- O backend identifica seu próprio bloco como SDK Docker simulado.
- `/api/vpn/connect` muda para `connected` após um `setTimeout`, sem comprovar
  processo, interface, rota, host ou porta.
- `/api/vpn/test-db` responde sucesso após outro `setTimeout`, sem executar um
  teste real de banco.
- `/api/vpn/add` persiste `req.body` no arquivo local, incluindo conteúdo de
  configuração e campos de credencial.
- A interface antiga mantém senha e conteúdo completo da configuração em
  estado React enquanto o formulário está aberto.
- `VpnGatewayTab` reporta estados antigos (`connected`, `error`) em vez do
  contrato completo de conexão exigido pelo hotfix.

## Decisão desta restauração

O módulo canônico é `VpnGatewayTab` com a rota `vpn_gateway`; nenhuma segunda
implementação será criada. A primeira correção será somente restaurar sua
entrada de navegação. O backend simulado não será apresentado como conexão
real. A validação real de OpenVPN e banco permanece condicionada a um processo
de servidor suportado e ao checklist manual.
