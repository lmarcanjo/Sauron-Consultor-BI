# MVP — Auditoria do Fluxo de Fonte Ativa

Data: 2026-07-23  
Escopo: conexão validada → descoberta → fonte → persistência → vínculo → ativação → Dashboard.  
Restrições respeitadas: nenhuma alteração em VPN, MySQL, importador de planilhas ou Dashboard; nenhuma correção definitiva foi aplicada.

## Evidências

As evidências manuais fornecidas registram autenticação MySQL no banco
`consultoria`, enquanto a interface continua sem fonte ativa e registra:

- `POST /api/db/sync` → `500`;
- `POST /api/vpn/test-db` → `502`;
- `Tipo de banco de dados não suportado`.

Também foi feita uma reprodução técnica local, sem credencial e sem conexão ao
banco, usando o `db_config.json` existente:

```text
executeFetchAndMap(config)
received type: undefined
persisted dbType: mysql
result: Tipo de banco de dados não suportado.
```

O `db_config.json` contém `dbType: "mysql"`, mas não contém `type`.

A validação manual com VPN, senha, seleção de tabela real, reload e confirmação
visual não foi executada nesta sessão. Não há senha persistida disponível para
repeti-la com segurança. Portanto, este documento não declara conexão real,
fonte ativa ou correção concluída.

## 1. Fluxo atual real

### Caminho explícito pela Central de Dados

```text
CentralDadosTab / CentralDadosDrawer
  -> DatabaseConnector
  -> POST /api/db/test-connection
  -> DatabaseConnectionManager.testConnection
  -> POST /api/db/test
  -> DatabaseConnectionManager.getTablesAndColumns
  -> consultor escolhe tabela
  -> POST /api/db/fetch
  -> DatabaseConnectionManager.executeFetchAndMap
  -> App.handleDatabaseDataLoaded
  -> DataSourceManager.syncDatabaseRecords
  -> IndexedDB __database_records__
  -> localStorage sauron_ds_db_data / sauron_ds_versions
  -> activeDataSource = DATABASE_DATA
```

Pontos de código:

- `src/components/DatabaseConnector.tsx:196-267`: teste detalhado e descoberta;
- `src/components/DatabaseConnector.tsx:322-380`: fetch da tabela;
- `src/App.tsx:1281-1316`: callback que recebe as linhas;
- `src/core/data/DataSourceManager.ts:745-788`: persistência legada.

Esse caminho **não** chama `WorkbookRepository`,
`enterpriseRepository.bindSource`, `DataActivation` ou
`activeDatasetStore.setActiveDataset`.

### Caminho automático de sincronização

```text
App.checkServerConfigAndSyncOnMount / botão Atualizar conexão
  -> GET /api/db/config
  -> POST /api/db/sync (sem payload)
  -> readDatabaseConfig/currentDatabaseConfig
  -> DatabaseConnectionManager.executeFetchAndMap(config)
  -> snapshot em reports_history.json
  -> resposta com data/sourceName/snapshotId
  -> App.handle syncDatabaseRecords
```

Pontos de código:

- `src/App.tsx:564-610`;
- `server.ts:421-442` para configuração;
- `server.ts:463-573` para sync;
- `server.ts:507-550` para o snapshot histórico.

O sync atual é um refresh/snapshot de banco, não uma operação de criação,
vínculo ou ativação de uma fonte canônica.

### Caminho VPN

```text
menu VPN e Banco de Dados
  -> VpnGatewayTab
  -> POST /api/vpn/connect      (probe TCP)
  -> botão explícito Testar BD
  -> POST /api/vpn/test-db
  -> DatabaseConnectionManager.testConnection
```

`/api/vpn/test-db` é um diagnóstico separado. Ele não cria fonte, não vincula
empresa/grupo e não ativa dataset.

## 2. Ponto exato de quebra

### Quebra do `POST /api/db/sync`

Arquivo: `src/core/connections/DatabaseConnectionManager.ts`  
Função: `executeFetchAndMap`  
Linha: `2001`  
Condição: nenhum ramo `type === "postgres" | "mysql" | "mssql" | "oracle" | "mongodb"` é selecionado.  
Erro: `Tipo de banco de dados não suportado.`

O contrato persistido e o contrato consumido não têm o mesmo nome:

```text
db_config.json               dbType = "mysql"
POST /api/db/sync            repassa o objeto sem normalização
executeFetchAndMap           lê configPayload.type
configPayload.type           undefined
```

O `DatabaseConnector` explícito não sofre essa condição no primeiro fetch,
porque monta `type: dbType` em `connectionConfig`
(`src/components/DatabaseConnector.tsx:344-352`).

### Por que a tela continua sem fonte ativa

Mesmo quando o caminho explícito recebe linhas:

1. `DataSourceManager.syncDatabaseRecords` salva registros em armazenamento
   legado e define `DATABASE_DATA`.
2. Ele não publica um `ActiveDataset`.
3. `App` define `dataOrigemReal` como `activeDataset ? activeRecords : []`
   (`src/App.tsx:290-293`).
4. `DashboardPage` retorna `Nenhuma fonte de dados ativa.` quando não há
   `activeDataset` (`src/components/pages/DashboardPage.tsx:71-83`).

Assim, a leitura SQL pode ter ocorrido e ainda assim não existir uma fonte
ativa no contrato que o Dashboard reconhece.

## 3. Respostas obrigatórias

### 1. Endpoint que cria a fonte após o teste

Não existe endpoint de criação de `CorporateSource` após o teste. O endpoint
de teste é `/api/db/test-connection`; o endpoint de descoberta é `/api/db/test`;
o endpoint de leitura é `/api/db/fetch`.

Após o fetch, a criação observada é somente a gravação de uma versão legada
em `DataSourceManager.createNewVersion` (`DataSourceManager.ts:774-789`).

### 2. Endpoint que ativa a fonte

Não existe endpoint de ativação para a fonte SQL. A ativação canônica existente
para planilhas ocorre no frontend por `DataActivation` e
`activeDatasetStore.setActiveDataset`; ela não é chamada pelo fluxo SQL.

### 3. Fonte de verdade

Não há uma única fonte de verdade para o fluxo SQL atual:

| Estrutura | Papel observado | É fonte canônica SQL? |
| --- | --- | --- |
| `ActiveDatasetStore` | Metadata/preview da fonte ativa, principalmente planilhas | Não recebe SQL |
| `ActiveDataset` | Contrato consumido pelo Dashboard e engines | Não é criado pelo SQL |
| `WorkbookRepository` | Biblioteca de workbooks | Não recebe SQL |
| `EnterpriseRepository` | Entidades e bindings canônicos | Não recebe SQL |
| `db_config.json` | Metadados de conexão; segredos ficam apenas em memória | Não é fonte de dados |
| `DataSourceManager` | Estado legado, registros SQL e versões truncadas | É o consumidor/persistidor atual do SQL |
| `IndexedDB:__database_records__` | Linhas SQL persistidas pelo manager | Armazenamento físico legado |
| `reports_history.json` | Snapshots do `/api/db/sync` | Histórico, não fonte ativa |
| `system_db.json` | Configuração interna e auditoria | Não é fonte de dados |

Não foi localizado um modelo ou classe `CorporateSource` no código de produção.

### 4. `POST /api/db/sync`

- Payload HTTP: vazio no uso atual do `App` (`POST` sem body).
- Configuração efetiva: leitura de `db_config.json` + segredos em memória do
  processo Node.
- Serviço chamado: `databaseConnectionManager.executeFetchAndMap(config)`.
- Falha: `DatabaseConnectionManager.ts:2001`, por `type` indefinido.
- Stack: a rota captura o erro em `server.ts:574-590` e retorna `500` com a
  mensagem; o stack completo é registrado pela instrumentação temporária em
  stdout, sem senha.
- Responsabilidade atual: buscar dados e criar snapshot em
  `reports_history.json`; não deveria ser tratado como ativação canônica, pois
  não recebe contexto empresarial nem cria binding.

### 5. Por que `/api/vpn/test-db` ainda é chamado

Porque `vpn_gateway` continua sendo uma rota registrada e `VpnGatewayTab` tem
o botão explícito `Testar BD` (`src/components/VpnGatewayTab.tsx:329-335`).
O único call-site encontrado é `src/components/VpnGatewayTab.tsx:112-132`.
Ele não é chamado pelo `DatabaseConnector` nem pelo importador.

Esse endpoint lê `vpn_configs.json` e monta o teste com `dbType`, host, porta,
usuário e database do perfil (`server.ts:1068-1080`). Como o perfil não guarda
senha, ele é inadequado para provar autenticação MySQL quando a etapa de
configuração exige senha. Um resultado de driver/configuração é devolvido
como HTTP `502`; isso explica a evidência sem significar que a porta esteja
fechada.

### 6. Origem de “Tipo de banco de dados não suportado”

Há duas guardas com essa mensagem:

- `DatabaseConnectionManager.ts:1344`, no final do fluxo de
  `testConnection`, para um tipo desconhecido;
- `DatabaseConnectionManager.ts:2001`, no final de `executeFetchAndMap`, que é
  a origem reproduzida para o `/api/db/sync` atual.

No caso observado, a camada é o `DatabaseConnectionManager`, acionado pelo
handler `/api/db/sync`.

### 7. A fonte é criada e não ativada, ou nem chega a ser criada?

Para SQL, a fonte canônica não chega a ser criada. No caminho explícito, as
linhas chegam ao `DataSourceManager` e são persistidas como registros/version
legados, mas não há `Workbook`, binding ou `ActiveDataset`. No `/api/db/sync`,
com a configuração atual, nem as linhas são obtidas: a falha ocorre antes do
snapshot.

### 8. Grupo e empresa chegam ao backend?

Não. O payload construído por `DatabaseConnector` contém conexão, tabela,
query e mappings (`DatabaseConnector.ts:344-352`), mas não `groupId` ou
`companyId`. O botão `/api/db/sync` não envia payload. O contexto fica somente
no frontend, em `EnterpriseContextStore`.

### 9. Modelos duplicados

Existem representações paralelas da ideia de fonte:

- `ActiveDataset`/`ActiveDatasetStore`;
- `Workbook`/`WorkbookVersion` na biblioteca;
- `SourceEnterpriseBinding` no `EnterpriseRepository`;
- `DataSourceManager.state` + `databaseRecords` + `DataVersion`;
- `db_config.json` para conexão;
- `reports_history.json` para snapshot SQL;
- `IndexedDB:__database_records__` para linhas SQL.

Não são todos o mesmo modelo, mas o fluxo SQL usa os quatro últimos sem
produzir o contrato canônico de fonte. `CorporateSource` não existe como
implementação localizada.

### 10. Dashboard lê do mesmo repositório?

Não. O Dashboard consulta `ActiveDatasetStore`/`ActiveDataset` e dados
expostos pelo hook `useDataSourceManager`. O SQL é salvo em
`DataSourceManager`/`IndexedDB:__database_records__`; esses registros podem
alimentar `activeRecords`, mas não criam o `ActiveDataset` exigido pela tela.
Portanto os caminhos não compartilham a mesma fonte canônica de metadata,
binding e ativação.

## 4. Instrumentação adicionada

Foi adicionada somente instrumentação temporária e sanitizada:

- `server.ts:73-117`: correlationId, payload resumido, duração, erro original,
  código e stack; segredos são removidos;
- `server.ts:146-175`: `test-connection`;
- `server.ts:208-233`: descoberta de tabelas;
- `server.ts:257-283`: fetch;
- `server.ts:463-590`: sync, configuração carregada, persistência histórica e
  falha;
- `src/core/data/DataSourceManager.ts:745-788`: persistência SQL legada,
  stores atualizados e ausência de ativação canônica.

Os registros indicam explicitamente `sourceId`, `datasetId`, `groupId` e
`companyId` como nulos quando o caminho não os recebe. Nenhuma senha,
connection string, conteúdo VPN ou chave é persistido por essa instrumentação.

## 5. Correção mínima possível

Sem implementar nesta etapa, a menor sequência para o fluxo funcionar seria:

1. corrigir o contrato localizado do sync para que a configuração persistida
   `dbType` seja entregue como o `type` esperado pelo manager;
2. depois do fetch, usar o fluxo canônico já existente para registrar a fonte
   com identidade persistida, contexto explícito, binding único e
   `ActiveDataset` metadata/preview;
3. fazer o Dashboard ler esse resultado canônico, mantendo as linhas sob
   demanda no armazenamento existente.

O item 1 é uma correção localizada. Os itens 2 e 3 atravessam API, frontend,
repositório, binding e ativação; não devem ser feitos por tentativa nesta
auditoria.

## 6. Necessidade de refatoração

### Parecer técnico

`CONSOLIDAÇÃO MODERADA RECOMENDADA`

Justificativa:

- o `500` possui causa localizada e verificável (`dbType` versus `type`);
- porém corrigir somente esse nome não faria a fonte SQL aparecer como
  `ActiveDataset` nem vincularia grupo/empresa;
- a solução completa precisa conectar o fluxo de banco aos contratos canônicos
  que já existem para planilhas, sem criar outro repositório ou outro store;
- `/api/vpn/test-db` deve permanecer diagnóstico separado até uma decisão
  posterior, pois não é a origem do vínculo/ativação SQL;
- `DataSourceManager` deve permanecer compatível durante a consolidação, não
  ser apagado nesta etapa.

## Validação executada

- Reprodução técnica do erro de tipo: aprovada, sem conexão real.
- `npm run typecheck`: aprovado.
- `git diff --check`: aprovado.
- Validação manual VPN/MySQL/tabela/reload: pendente, não executada nesta
  sessão e não substituída por simulação.

Nenhuma correção definitiva foi implementada.
