# Legacy State Repair V2

Data: 2026-07-21  
Escopo: recuperação do estado local legado do MVP. F21 não faz parte desta etapa.

## Contrato

`LegacyLocalStateRepairService` usa `sauron_local_state_schema_version` como
marcador de migração. A versão atual é `2`. A migração é idempotente: uma
segunda execução apenas inspeciona o estado já reparado e não recria vínculos,
projetos ou workbooks.

## O Que É Reparado

- remove referências temporárias `up_file_*` de contexto e storage local;
- preserva `sauron_ds_active_dataset` quando a metadata ainda existe;
- normaliza registros incompletos de `sauron_workspace_registry`;
- corrige grupo pai de empresa/unidade quando a relação é comprovável pelo
  cadastro persistido;
- substitui projeto legado por um projeto existente somente quando há uma única
  opção; caso contrário, deixa a escolha explícita;
- remove vínculo órfão quando a fonte não existe na metadata nem na Biblioteca;
- limpa ponteiros órfãos do contexto sem apagar linhas físicas;
- desabilita módulos automáticos sem configuração explícita;
- preserva campos, indicadores, áreas e mapeamentos escolhidos pelo consultor.

## Limites

A rotina não inventa proprietário para fonte sem vínculo, não cria projeto
silenciosamente, não renomeia coluna física e não remove workbook, versão ou
linhas do IndexedDB. Um estado que não pode ser provado é reportado para ação
explícita do consultor.

## Evidência

O fixture `tests/fixtures/legacy-browser-state/manual-validation-2026-07.ts`
reproduz contexto sem grupo, workspace inválido, `up_file_*`, metadata antiga e
módulos automáticos. O teste
`tests/e2e/mvp-manual-failure-recovery.spec.ts` confirma versão `2`, grupo e
empresa recuperados, remoção da referência temporária, ausência de inferências
e persistência após reload.
