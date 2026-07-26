# MVP Core Delivery Certification

Data: 2026-07-20  
Teste principal: `tests/e2e/mvp-core-delivery.spec.ts`

## Resultado

`1 passed` em 9,5 segundos, com um worker e sem retry.

## Jornada certificada

- criou grupo e empresa;
- importou uma planilha XLSX pela interface;
- exibiu as seis colunas físicas;
- alterou `Valor` para `Valor recebido` sem alterar o nome físico;
- selecionou `Valor` e `Produto` para a tabela;
- criou o indicador `Total recebido`;
- criou o gráfico `Vendas por cliente`;
- conferiu o total de `R$ 300,00` e dados da tabela;
- recarregou e confirmou a configuração persistida;
- criou uma segunda empresa e importou uma segunda planilha;
- confirmou que a fonte B não exibiu dados da fonte A;
- voltou à fonte A pela Biblioteca;
- abriu Apresentações usando os dados configurados;
- abriu a preparação da reunião;
- registrou uma decisão;
- abriu a prévia imprimível da ata;
- encerrou e sincronizou a sessão;
- recarregou novamente;
- saiu e entrou novamente;
- confirmou o indicador persistido após o novo login.

## Evidências técnicas

- Os dados usados no indicador e no gráfico vieram das linhas da planilha
  ativa.
- A configuração foi indexada pelo `datasetId`.
- A apresentação recebeu os mesmos indicadores, gráficos e colunas de tabela
  configurados no Dashboard.
- Nenhum mock ou demo foi adicionado ao fluxo MVP.
- O erro de finalização da ata não reaparece quando o registro auxiliar de
  histórico local não está disponível.

## Validações complementares

- Typecheck: aprovado.
- Vitest baseline: 82 arquivos e 409 testes aprovados.
- Build baseline: aprovado, com alerta não bloqueante de tamanho de chunk.
- `git diff --check`: aprovado no baseline; será repetido após os relatórios.
- Playwright completo: não foi reexecutado nesta fase; o baseline não iniciou
  por colisão de porta no ambiente.

## Parecer

## ✅ MVP APROVADO PARA VALIDAÇÃO MANUAL DO CONSULTOR

O fluxo automatizado solicitado está concluído. A próxima ação é a validação
manual do consultor. Esta entrega para aqui e não inicia F21 nem qualquer
melhoria futura.
