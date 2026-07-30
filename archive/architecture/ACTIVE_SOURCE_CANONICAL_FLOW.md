# Active Source Canonical Flow

Status: ACTIVE
Escopo: consolidação moderada do fluxo de fontes SQL no MVP

## Objetivo

Uma tabela SQL selecionada pelo consultor segue o mesmo contrato de ativação
usado pelas planilhas. A configuração semântica é opcional: as colunas físicas
e as linhas retornadas continuam disponíveis para configuração posterior.

## Fluxo

```text
Teste de conexão
  -> descoberta de tabelas e colunas
  -> seleção explícita da tabela
  -> leitura somente leitura
  -> normalizeDatabaseConfig()
  -> sourceId determinístico por tabela e contexto
  -> IndexedDB (metadados + linhas)
  -> WorkbookRepository (workbook/version)
  -> EnterpriseRepository (SourceEnterpriseBinding)
  -> DataActivation.activateDatabaseSource()
  -> ActiveDatasetStore (metadata + preview)
  -> Dashboard e módulos
```

`/api/vpn/test-db` continua sendo diagnóstico de conectividade. Ele não cria,
vincula, sincroniza ou ativa fonte.

## Contratos

`normalizeDatabaseConfig()` aceita temporariamente `type` e `dbType`, rejeita
conflito e produz um único `type`, além de `host`, `port`, `user`, `database`,
`ssl`, `table`, `query` e `mappings`.

O `sourceId` SQL é determinístico a partir de tipo, host, porta, banco, tabela
ou consulta e grupo/empresa. Senhas, strings de conexão e chaves não fazem
parte do identificador, do fingerprint, do `ActiveDataset` ou do armazenamento
persistente.

O vínculo canônico é `SourceEnterpriseBinding`:

- escopo `GROUP`: `groupId` obrigatório e `companyId` ausente;
- escopo `COMPANY`: `groupId` e `companyId` válidos, com a empresa pertencendo ao grupo;
- não há criação automática de empresa;
- remover vínculo não remove o workbook nem as linhas físicas.

## Sincronização

`POST /api/db/sync` é uma atualização explícita. Ele exige `sourceId`, valida
que a configuração persistida pertence à fonte selecionada e retorna as linhas
com o mesmo identificador. Sem `sourceId`, responde erro de configuração e não
cria fonte global. O cliente publica a nova versão pelo mesmo caminho de
ativação e preserva o vínculo.

O carregamento inicial da aplicação não chama mais sincronização automática.
Uma configuração de banco salva não é, por si só, uma fonte ativa.

## Persistência e reload

As linhas completas permanecem no armazenamento existente do dataset. O
`ActiveDatasetStore` persiste somente metadata e preview limitado; após reload,
o `sourceIdentity`, o vínculo, a tabela e as colunas físicas são reidratados
sem materializar todas as linhas no React.

`DataSourceManager` permanece como adapter de compatibilidade para consumidores
antigos. Ele não cria identidade, workbook ou vínculo SQL; esses efeitos são
responsabilidade de `DataActivation` e dos repositórios canônicos.

## Estados de falha

O registro é tratado como transação local: uma falha ao persistir, versionar,
vincular ou ativar restaura o dataset anterior e remove somente os artefatos
criados naquela tentativa. Dados físicos existentes não são apagados por uma
falha de ativação.

## Evidências automatizadas

- normalização de `dbType` e rejeição de conflito;
- identidade estável para o mesmo contexto;
- identidades diferentes para empresas diferentes;
- E2E data-first com tabela SQL sem mapeamento;
- reconhecimento da fonte SQL após reload;
- `git diff --check` e typecheck.

A certificação de conexão real exige ainda execução manual com VPN ativa,
autenticação MySQL, database/schema, consulta somente leitura e confirmação do
consultor.
