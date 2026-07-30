# Legacy Local State Repair

Data: 2026-07-20

`LegacyLocalStateRepairService` audita referências locais antes da jornada
principal e pode ser executado novamente sem efeitos cumulativos.

## Classificação

- `VALID`: metadata atual e entidade de contexto encontradas;
- `MIGRATABLE`: chave de compatibilidade ou referência temporária antiga;
- `ORPHAN`: entidade apontada pelo contexto não existe;
- `CONFLICT`: reservado para referências incompatíveis que exigem revisão.

## Preservação

O serviço chama a migração de compatibilidade já existente, remove somente
referências `up_file_*` e chaves antigas conhecidas e nunca remove linhas,
metadata IndexedDB ou workbooks físicos. Contextos órfãos são reportados para
seleção do consultor, sem criar uma empresa ou projeto silenciosamente.

## Interface

O Centro de Dados oferece `Verificar dados locais`. O retorno informa quantas
referências foram verificadas e quais ainda precisam de revisão, deixando
explícito que nenhuma planilha foi apagada.
