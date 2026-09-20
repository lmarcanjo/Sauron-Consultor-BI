## A. O QUE O CONSULTOR CONSEGUE ENTREGAR AO CLIENTE AGORA?

Após importar e analisar a fonte, o consultor consegue:

- abrir o resumo e o dashboard executivo persistidos;
- exportar um PDF executivo real;
- exportar um PowerPoint real com oito slides;
- editar um título no PresentationBuilderPage, salvar e reexportar a versão editada;
- salvar um snapshot executivo nomeado;
- consultar o histórico de snapshots após reload;
- trabalhar somente com materiais derivados da análise autorizada, sem exportar registros individuais completos.

## B. QUAIS ARQUIVOS REAIS FORAM GERADOS?

Na jornada E2E com `/home/natalicorreia/Downloads/Consulta Financeiro Topp.xls` foram gerados:

- `ASTERION_Cliente_Recovery_MVP4_<timestamp>_Resumo_Executivo_2026-08-12.pdf`, 8.835 bytes;
- `ASTERION_Cliente_Recovery_MVP4_<timestamp>_Apresentacao_Executiva_2026-08-12.pptx`, aproximadamente 23,4 KB.

O PDF começa com `%PDF-1.4`, contém oito páginas e os valores certificados da análise. O PPTX começa com `PK`, passa no teste `unzip -t` e contém oito entradas `p:sldId`.

Os nomes são produzidos por `ExportFileName.ts`, com sanitização de acentos, barras, caracteres inválidos e espaços.

## C. O PDF CONTÉM O QUÊ?

`ExecutivePdfExportService` projeta o `PreliminaryFinancialAnalysisArtifact` persistido em oito páginas determinísticas:

1. capa, cliente, engajamento, fonte e modo `PRELIMINARY`;
2. resumo, registros, campos, período, moeda e valores certificados;
3. visão financeira e série temporal;
4. distribuições de situação e centro de resultado;
5. contas e pessoas disponíveis nas agregações do artefato;
6. qualidade dos dados, linhas, campos, findings e limitações;
7. inventário da fonte, workbook, container, schema e fingerprints;
8. módulos, limitações e aviso `PRELIMINARY`.

Os totais observados na jornada foram:

- Valor Total: `R$ 8.668.993,62`;
- Valor Pago: `R$ 32.479,07`;
- Saldo: `R$ 8.636.514,55`.

Quando a unidade monetária não é declarada, o exportador informa que a moeda não foi confirmada e não aplica `R$` silenciosamente.

## D. O POWERPOINT CONTÉM O QUÊ?

`ExecutivePresentationExportService` revalida autorização, fingerprint e apresentação persistida antes de criar o pacote OOXML. A fonte é a apresentação salva, e não uma nova rotina de cálculo.

O arquivo contém oito slides correspondentes ao deck executivo: capa, resumo, visão financeira, distribuição, contas e pessoas, qualidade, módulos e limitações. A jornada alterou o título do primeiro slide, salvou a edição e confirmou que a segunda exportação continha o título editado.

As propriedades do pacote registram a proveniência: engajamento, cliente, fonte, artefato preliminar, fingerprints, apresentação, versão, usuário e versão do exportador.

## E. O QUE SOBREVIVE AO RELOAD?

Sobrevivem:

- o artefato preliminar persistido;
- a apresentação executiva salva;
- a edição feita no slide;
- snapshots nomeados e seus estados `CURRENT`/`OUTDATED`;
- histórico do engajamento;
- os valores do resumo executivo.

O E2E recarregou a página, reabriu a Visão Executiva e encontrou o snapshot e o total `8.668.993,62` sem erro de página, erro de console, warning ou tela branca.

## F. ARQUITETURA E SEGURANÇA

O fluxo implementado é:

```text
PreliminaryFinancialAnalysisArtifact
  -> ExecutiveDeliverablesService
  -> apresentação executiva persistida
  -> ExecutivePdfExportService / ExecutivePresentationExportService
  -> arquivo baixável
```

Os componentes React apenas acionam serviços, exibem estado de progresso e iniciam o download. Os serviços revalidam o usuário, o projeto ativo, o artefato e o fingerprint antes de exportar ou salvar snapshot. O snapshot guarda referências e projeções, sem copiar linhas físicas completas.

Módulos sem dados suficientes permanecem com status factual e motivo. Nenhum valor zero demonstrativo ou dado de pessoa linha a linha foi criado pelo exportador.

## G. TESTES E COMANDOS

| Verificação | Resultado |
| --- | --- |
| `npm run typecheck` | Exit Code 0 |
| `npm run lint` | Exit Code 0 |
| testes focados de exportação | 2 arquivos, 8 testes aprovados |
| `npx vitest run` | 131 arquivos, 686 testes aprovados |
| `npm run quality:domain-vocabulary:check` | Exit Code 0; 267 findings baseline, 0 novos, 0 removidos |
| `npm run build` com `VITE_IMPORT_MODE=local` | Exit Code 0 |
| `git diff --check` | Exit Code 0 |
| E2E MVP-4 focado | 1/1 aprovado |
| E2E combinado MVP-4/MVP-3/MVP-2 | 5/5 aprovados em 16,1 s |
| validação estrutural do PPTX | `unzip -t` aprovado |

O build mantém o alerta conhecido de bundle principal acima de 500 kB. Ele não bloqueou a entrega nem foi ampliado por uma nova engine.

## H. REGRESSÕES E ITENS NÃO CONCLUÍDOS

Não houve regressão nas cinco jornadas exigidas. O primeiro E2E de produção foi corretamente bloqueado quando o build estava sem `VITE_IMPORT_MODE=local` e tentou um endpoint de API inexistente; o build foi refeito explicitamente no modo local, e a mesma jornada passou sem alterar o teste ou mascarar o erro.

Não foi iniciado nenhum trabalho de F21, backend de exportação ou nova engine de negócio.

## VEREDITO

# MVP-4 CLIENT DELIVERY APROVADO
