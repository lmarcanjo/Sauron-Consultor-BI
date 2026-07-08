# Workbook Reverse Engineering F8.1.5

## Objetivo

F8.1.5 usa o `WorkbookCatalog` da F8.1 para produzir um relatório técnico de engenharia reversa da planilha. A saída é uma lista de hipóteses auditáveis sobre papéis das abas, padrões de fórmula, dependências, regras implícitas, KPIs prováveis e riscos estruturais.

Esta fase não executa fórmulas, não calcula indicadores, não cria dashboards, não altera dados e não mexe no importador.

## Localização

- `src/core/workbook-reverse/WorkbookReverseTypes.ts`
- `src/core/workbook-reverse/WorkbookReverseEngineer.ts`
- `src/core/workbook-reverse/SheetRoleClassifier.ts`
- `src/core/workbook-reverse/FormulaPatternAnalyzer.ts`
- `src/core/workbook-reverse/BusinessRuleCandidateDetector.ts`
- `src/core/workbook-reverse/KpiCandidateDetector.ts`
- `src/core/workbook-reverse/WorkbookRiskAnalyzer.ts`
- `src/core/workbook-reverse/index.ts`

## Entrada

O módulo recebe apenas um `WorkbookCatalog`.

Ele não recebe linhas brutas, não usa `ActiveDataset`, não acessa importador e não depende de módulos como Comercial, Pessoas, Financeiro, DRE ou Comissão.

## Saída

`WorkbookReverseEngineeringReport`:

- `workbookId`
- `generatedAt`
- `sheetRoles`
- `formulaPatterns`
- `businessRuleCandidates`
- `kpiCandidates`
- `dependencySummary`
- `structuralRisks`
- `recommendations`

## Classificação de Abas

`SheetRoleClassifier` usa sinais de:

- nome da aba;
- densidade de fórmulas;
- volume de linhas/colunas;
- colunas perfiladas;
- presença de gráficos, pivôs, formatação condicional e objetos estruturais.

Papéis possíveis:

- `entrada`
- `calculo`
- `relatorio`
- `cadastro`
- `comissao`
- `dre`
- `suporte`
- `desconhecida`

Cada classificação contém confiança e evidências.

## Padrões de Fórmula

`FormulaPatternAnalyzer` agrupa fórmulas por estrutura textual normalizada:

- substitui referências de células/ranges por marcadores;
- preserva tipo de fórmula;
- conta ocorrências;
- lista abas e células de exemplo;
- separa fórmulas repetidas;
- destaca fórmulas únicas críticas.

Fórmulas nunca são executadas.

## Dependências

`WorkbookReverseEngineer` agrega dependências entre abas usando referências textuais de fórmulas e named ranges já catalogados pela F8.1.

Cada dependência resume:

- aba origem;
- aba destino;
- quantidade de referências;
- tipos de fórmula envolvidos;
- evidências de exemplo;
- importância.

## Regras de Negócio Candidatas

`BusinessRuleCandidateDetector` identifica hipóteses como:

- consultas entre abas/cadastros;
- regras condicionais;
- agregações;
- comissão;
- DRE/resultado;
- validações;
- referências dinâmicas;
- parâmetros por named ranges.

Todas exigem revisão do consultor antes de virarem engine.

## KPIs Prováveis

`KpiCandidateDetector` aponta possíveis indicadores com base em nomes de colunas e abas:

- vendas;
- margem/lucro/rentabilidade;
- comissão;
- pessoas/vendedores;
- financeiro;
- operação/pendências;
- DRE/resultado.

Esses KPIs são candidatos sem cálculo.

## Riscos Estruturais

`WorkbookRiskAnalyzer` aponta riscos como:

- volume alto de fórmulas;
- referências dinâmicas por `INDIRETO`/`DESLOC`;
- dependências concentradas;
- muitos named ranges;
- abas ocultas;
- tipos mistos;
- cabeçalhos duplicados;
- workbook grande para navegador;
- fórmulas únicas críticas;
- abas sem papel claro.

## Uso Esperado

```ts
import { workbookReverseEngineer } from "@/src/core/workbook-reverse";

const report = workbookReverseEngineer.generateReport(workbookCatalog);
```

## Limites

- A saída é inferencial, não definitiva.
- O módulo não substitui validação humana do consultor.
- F8.1.5 não gera mapeamentos de módulo automaticamente.
- F8.1.5 não cria regra executável.

## Próxima Fase Recomendada

F8.2 deve usar o relatório para guiar uma tela de “Mapa da Planilha”, onde o consultor confirma:

- fontes oficiais;
- cadastros válidos;
- fórmulas que viram regras;
- KPIs que viram módulos;
- abas legado/removíveis;
- dependências críticas que precisam de engine no backend.
