# Recovery Gate MVP-1.1

Data da validação: 2026-08-04  
Escopo: Cliente -> Engajamento -> Estrutura organizacional -> Fonte -> análise preliminar.

## Estado atual

A jornada canônica local foi implementada de forma incremental. A criação do
cliente, do engajamento, do grupo, da empresa e da unidade acontece pela UI. A
importação passa a resolver o contexto pelo `ImportContextService`, registra a
fonte com `engagementId` e escopo organizacional, persiste o vínculo canônico e
ativa a fonte sem consultar entidades globais no componente importador.

O fluxo validado é:

```text
ClientEntity
  -> WorkspaceProject (Engagement)
  -> BusinessGroup / Company / Unit
  -> DataSource
  -> Workbook / ActiveDataset
  -> análise preliminar da fonte
```

Não foi iniciado o Business Observation Engine, não foi criado motor financeiro
novo e não houve alteração em VPN, banco do cliente ou importador pesado.

## Auditoria dos modelos

| Entidade | Repositório e chave | Criada/consultada por | clientId | engagementId | consultor | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| `ClientEntity` | `WorkspaceRepository`, `asterion_workspace_clients` | `ClientManagementModal` / `ClientService` | identidade própria | não aplicável | `assignedConsultantId` | canônica |
| `WorkspaceProject` / Engajamento | `WorkspaceRepository`, `sauron_workspace_projects` | `EngagementModal` / `EngagementService` | sim | próprio identificador de engajamento | `assignedConsultantId` | canônica |
| `BusinessGroup`, `Company`, `Unit` | `EnterpriseRepository`, `sauron_enterprises` | `PortfolioTab` / `OrganizationService` | não diretamente | sim nas entidades novas | autorização do serviço | canônica F1.3 com registros legados no mesmo storage |
| `DataSource` | `LocalDataSourceRepository`, `asterion_data_sources_v1` | `SimpleSpreadsheetImporter` / `DataSourceService` | não diretamente | obrigatório | `createdByUserId` | canônica |
| `SourceEnterpriseBinding` | `EnterpriseRepository`, `sauron_source_enterprise_bindings_v1` | `DataSourceService.bindImportedSource` | não diretamente | resolvido pela fonte | validação da fonte | vínculo canônico |
| `Workbook` / dataset | `WorkbookRepository` e IndexedDB | serviço de importação e ativação | não diretamente | associado pela fonte/contexto | contexto ativo | canônico para dados físicos |

### Respostas obrigatórias

1. `EngagementService.createEngagement` cria somente o Engajamento. Ele não
   cria empresa, grupo ou unidade implicitamente.
2. `OrganizationService` usa o mesmo modelo organizacional consultado pelo
   contexto de importação. O componente não consulta `EnterpriseRepository`
   para montar as opções.
3. `sauron_enterprises` é o storage oficial do modelo F1.3, mas ainda contém
   registros antigos sem `engagementId`. Eles são detectados, não migrados em
   silêncio.
4. Uma empresa criada pela UI fica disponível ao importador por
   `ImportContextService`, que lista somente estruturas do Engajamento ativo.
5. Um usuário consegue concluir cliente, engajamento, estrutura, importação e
   análise sem escrever entidades no `localStorage`.

## Fonte soberana e correções

### `ImportContextService`

`resolveImportContext(engagementId, currentUser)` valida o acesso ao
Engajamento, carrega o cliente, lista grupos/empresas/unidades pertencentes ao
Engajamento, lista fontes do mesmo Engajamento e retorna bloqueios, avisos e o
estado de legado. `resolveSelectedScope` impede que a seleção de importação
escape da projeção autorizada.

### Importador

`SimpleSpreadsheetImporter` não importa mais `EnterpriseRepository`, não chama
`getAll()` para montar opções e não lê `sauron_enterprises`. O componente recebe
`engagementId`, resolve o contexto e registra o `DataSource` por
`DataSourceService` antes de persistir/ativar o workbook.

### Organização na UI

`PortfolioTab` apresenta a estrutura do Engajamento e cria Grupo, Empresa e
Unidade somente por `OrganizationService`. `CentralDadosTab` carrega a
estrutura e as fontes por Engajamento; após a importação, atualiza a lista
escopada sem reintroduzir uma lista global.

### Legado

`LegacyEnterpriseMigrationService` identifica entidades em
`sauron_enterprises` sem `engagementId`, informa quantidade, IDs não resolvidos
e aviso de associação necessária. Não há migração silenciosa, exclusão física
ou criação de vínculos inventados.

## Guardas e testes adicionados

- `ImportContextService.test.ts`: ausência de Engajamento bloqueia; dois
  Engajamentos não compartilham escopos; consultor não autorizado é bloqueado;
  registros antigos são reportados.
- `RecoveryGateGuards.test.ts`: impede retorno de importação direta de
  `EnterpriseRepository`, `getAll()` ou `sauron_enterprises`; impede DataSource
  sem `engagementId`; impede o seed de entidades no E2E MVP.
- `mvp-canonical-client-engagement-import.spec.ts`: jornada principal somente
  pela UI, sem `page.evaluate` ou `localStorage.setItem` para preparar
  Cliente, Engajamento, Empresa, Unidade ou DataSource.
- A jornada verifica reload, estrutura persistida, fonte visível, ausência de
  `DEMO_DATA`, `Grupo Alpha`, `Topázio Demo`, `pageerror`, `console.error` e
  `console.warn`.

## Evidência da planilha real

O arquivo disponível no host foi:

```text
/home/natalicorreia/Downloads/Consulta Financeiro Topp.xls
```

O caminho solicitado com o nome `Consulta Financeiro Topp(1).xls` não existe;
por isso não foi criada uma cópia com nome artificial. A validação usou o
arquivo real disponível.

Observado na análise preliminar:

- modo: `PRELIMINARY`;
- aba: `Consultoa Financeiro Topp`;
- estrutura retornada: 207 linhas e 18 colunas;
- dados exibidos: 205 linhas de dados, respeitando a linha de cabeçalho;
- campos físicos observados: `Emissão`, `Vencimento`, `Pagamento`, `Situação`,
  `Tipo Documento`, `Nº Documento`, `Pessoa`, `Forma de Pagamento`, `Moeda`,
  `Unidade de Negócio`, `Centro de Resultado`, `Código Conta`, `Conta Contábil`,
  `Valor`, `Valor Pago`, `Saldo`, `Histórico` e uma coluna final sem nome;
- a análise exibiu `Valor` e `Conta Contábil` e preservou os nomes físicos;
- a fonte permaneceu visível após reload junto da estrutura organizacional.

IDs internos da execução não foram fabricados no relatório: os E2Es atuais
validam persistência e isolamento por nomes únicos gerados pela UI, mas não
exportam para um artefato permanente os IDs runtime de cada entidade.

## Validação executada

| Verificação | Resultado |
| --- | --- |
| `npx tsc --noEmit --pretty false` | aprovado |
| `npm run typecheck` | aprovado |
| `npm run lint` | aprovado; script executa o typecheck |
| `npx vitest run` | **125 arquivos / 665 testes aprovados** |
| `mvp-canonical-client-engagement-import.spec.ts` | aprovado, 1/1 |
| `mvp-real-financial-spreadsheet.spec.ts` | aprovado, 1/1 |
| `sprint2-5-semantic-confirmation.spec.ts` | aprovado, 1/1 |
| `mvp-core-delivery.spec.ts` | aprovado, 1/1 após o build final |
| `npm run quality:domain-vocabulary:check` | aprovado; 0 novas violações |
| `npm run build` com `VITE_IMPORT_MODE=local` | aprovado |
| `git diff --check` | aprovado |

## Correção incidental necessária

Durante a suíte completa foi encontrado um contrato existente inconsistente em
`SemanticConfirmationService.confirmSourceUnderstanding`: a política de
materialidade era calculada, mas ignorada, permitindo confirmar campos
pendentes. A guarda foi restaurada usando `MaterialConfirmationBlockedError`.
Os testes focados passaram 10/10 e a suíte completa passou 665/665.

## Limitações que mantêm a gate bloqueada

1. O critério pede obrigatoriamente `Consulta Financeiro Topp(1).xls`, mas esse
   arquivo não está disponível no host; a evidência usa
   `Consulta Financeiro Topp.xls`.
2. O isolamento de um segundo consultor foi comprovado por autorização e testes
   de serviço, mas ainda não por uma jornada Playwright com login de dois
   consultores distintos.
3. A aplicação executa a análise preliminar real pelo CTA `Analisar estrutura`.
   O CTA `ANALISAR DADOS` pertence à etapa posterior, condicionada à
   confirmação semântica, e não foi acionado nesta gate preliminar.
4. O relatório de teste registra nomes, modo e campos observados; não há ainda
   um artefato de runtime que materialize `ClientEntity ID`, `Engagement ID`,
   `DataSource ID` e totais financeiros calculados da execução.
5. O serviço detecta legado, mas o fluxo visual de associação assistida dos
   registros antigos ainda não foi certificado nesta etapa.

## Parecer final

## RECOVERY GATE MVP-1.1 AINDA BLOQUEADO

Motivo exato: o fluxo principal foi corrigido e comprovado pela UI com a
planilha real disponível, porém quatro critérios formais da gate não possuem
evidência completa: o arquivo com sufixo `(1)` não está presente, o isolamento
do segundo consultor não foi executado como E2E de UI, o CTA posterior
`ANALISAR DADOS` não faz parte da etapa preliminar exercitada e os IDs/totais
runtime não foram materializados em evidência persistente. Não é seguro
declarar aprovação Enterprise enquanto esses pontos permanecerem sem prova.
