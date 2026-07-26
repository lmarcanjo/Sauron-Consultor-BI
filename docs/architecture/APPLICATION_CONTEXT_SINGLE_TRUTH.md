# Application Context Single Truth

Data: 2026-07-20

## Contrato

`ApplicationContextResolver` é o ponto de composição somente leitura para a
interface. Ele reúne o contexto empresarial persistido no
`EnterpriseContextStore` e a fonte/metadata publicados pelo
`ActiveDatasetStore`.

```text
Identity -> EnterpriseContextStore -> ApplicationContextResolver
                                      + ActiveDatasetStore
                                      -> UI snapshot
```

O snapshot contém usuário/contexto por meio do contrato de identidade,
`groupId`, `companyId`, `unitId`, `workspaceId`, fontes ativas, dataset ativo e
uma chave estável de contexto. O resolver não persiste, cria IDs nem carrega
linhas; stores e IndexedDB continuam sendo as fronteiras oficiais.

## Uso

Dashboard já assina o resolver. Os demais módulos continuam recebendo o
`activeDataset` pelo caminho existente enquanto a migração incremental dos
consumidores prossegue. Trocas de contexto continuam passando por
`setEnterpriseContext` e pelo resolvedor oficial da consolidação.

## Regras de segurança

- não usar nome do arquivo como identidade;
- não misturar contexto anterior durante uma troca;
- não publicar linhas completas no React;
- mostrar estado sem fonte ou pendente em vez de assumir vínculo;
- usar a mesma chave de contexto para invalidar a visão.
