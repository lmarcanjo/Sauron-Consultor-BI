# MVP Network Request Audit

Data: 2026-07-21  
Escopo: fluxo local de planilha no MVP; conexão de banco continua sendo uma
ação separada.

## Resultado

| Fluxo | Requisições esperadas | Resultado automatizado |
| --- | --- | --- |
| Importar planilha em `VITE_IMPORT_MODE=local` | IndexedDB/local, sem API de banco | Aprovado |
| Configurar indicador e gráfico | localStorage + IndexedDB | Aprovado |
| Ativar pela Biblioteca | repositório local, seleção contextual e ActiveDataset | Aprovado |
| Apresentação, reunião e ata | dados selecionados locais | Aprovado |
| Connector de banco | endpoints do fluxo de banco | Fora do fluxo de planilha |

O E2E focado executado em servidor de produção isolado não registrou resposta
falha, `requestfailed`, erro de console ou erro de página. O caminho de
inicialização local não chama `loadSystemDb()` e não exibe alerta de banco para
uma planilha.

## Correção do 404

O antigo POST 404 vinha da inicialização de sincronização de banco no fluxo de
planilha. A inicialização agora é protegida pelo modo de importação: apenas o
modo API consulta o serviço remoto; o modo local permanece no
IndexedDB/WorkbookRepository. A conexão de banco continua explícita no menu
“VPN e Banco de Dados”.

## Limite da Evidência

Esta auditoria cobre o modo local automatizado. A inspeção final no perfil
Firefox Dev com storage histórico ainda precisa ser executada manualmente pelo
consultor antes da certificação do MVP.
