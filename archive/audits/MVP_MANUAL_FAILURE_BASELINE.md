# MVP Manual Failure Baseline

Data: 2026-07-21  
Fonte principal: gravação de homologação de 21-07-2026 e tabela manual anexada.  
Escopo: recuperação do MVP; F21 não faz parte desta etapa.

## Estado Manual Observado

| Área | Observação da homologação | Risco |
| --- | --- | --- |
| Contexto | Grupo aparecia como inexistente enquanto Empresa, Unidade e Projeto antigo permaneciam selecionados. | O consultor pode interpretar uma fonte de uma empresa como parte de outra. |
| Vínculo | A biblioteca mostrava a fonte ativa, mas também “sem vínculo definido”. | Ativação podia depender de inferência do contexto ou de arrays antigos. |
| Storage | A sessão antiga continha referências `up_file_*`, seleção de projeto incompatível e contexto sem grupo. | Reload recuperava estado contraditório e IDs que não existem no repositório canônico. |
| Ativação | Usar a fonte pela biblioteca não garantia vínculo canônico, seleção contextual e atualização do ActiveDataset no mesmo fluxo. | A fonte permanecia visível sem realmente trocar o contexto da análise. |
| Troca de empresa | A troca podia manter a fonte e a configuração anteriores durante o carregamento. | Vazamento visual de dados entre empresas. |
| Interpretação | Apareciam Possível Receita/Custo/Despesa/Margem, DRE e áreas derivadas antes da confirmação do consultor. | Valores inferidos pareciam oficiais. |
| Menu | Havia itens financeiros/comerciais/pessoas repetidos ou derivados de configuração antiga. | O fluxo ficava ambíguo e mais longo. |
| Edição | Editar informações não limpava as inferências antigas nem reconstruía a visão somente pela escolha do consultor. | A alteração parecia não surtir efeito. |
| Gráfico/tabela | A configuração podia aceitar coluna não numérica ou persistir seleção incompleta. | Falha silenciosa ou visão vazia. |
| Apresentação/reunião/ata | Conteúdo executivo podia ser criado com capítulos e métricas não selecionados. | Artefato sem origem confirmada. |
| Rede | Foi observado POST 404 no cenário de planilha. | Ruído e falsa indicação de falha de banco no fluxo local. |

## Baseline Técnico Antes da Correção

- `npm run typecheck`: aprovado.
- `npx vitest run`: 82 arquivos, 410 testes aprovados.
- `VITE_IMPORT_MODE=local npm run build`: aprovado; alerta não bloqueante de chunk grande.
- `git diff --check`: aprovado.
- Playwright em servidor de produção isolado: 54 aprovados e 1 flakey. O caso flakey foi a fonte `varejo_teste.xlsx` não reaparecer após reload em execução compartilhada; não foi tratado como aprovação.
- Primeira tentativa Playwright em servidor de desenvolvimento: invalidada por conflito externo no WebSocket `24678`, causado por servidor anterior ocupando a porta.

## Causas Raiz Confirmadas no Código

1. `WorkbookLibraryTab` consultava `getSourceBinding(workbookId)`, mas o repositório só procurava `sourceId`; workbookId e datasetId diferentes podiam parecer sem vínculo.
2. A biblioteca tinha fallback para `entity.workbookIds`, permitindo inferência quando o binding canônico não existia.
3. `ApplicationContextResolver` compunha IDs de arrays antigos e do ActiveDataset sem validar a relação organizacional.
4. `EnterpriseConsolidationService` atualizava a fonte depois da troca, mas a tela conservava o ActiveDataset anterior enquanto a operação assíncrona estava pendente.
5. A seleção contextual mantinha um ponteiro de compatibilidade por workspace, além das chaves por escopo.
6. `MeetingModePage` e `ExecutivePresentationEngine` usavam `inferPresentationMappings` quando não havia configuração salva.
7. A configuração consultiva padrão habilitava módulos derivados mesmo sem campos escolhidos.

## Ordem de Correção

1. Reparar contexto, vínculo canônico e storage legado.
2. Impedir inferência e deduplicar fontes/configurações.
3. Ajustar gráfico, tabela e edição data-first.
4. Restringir apresentação, reunião e ata ao conteúdo confirmado.
5. Executar a nova validação automatizada e deixar a validação manual do consultor como gate final.
