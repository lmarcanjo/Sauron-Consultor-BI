# Formula & Rule Engine F8.3

## Objetivo

F8.3 representa fórmulas e regras de negócio como objetos reutilizáveis do Sauron.

Esta fase não executa fórmulas, não altera dados originais, não substitui fórmulas automaticamente, não cria dashboards e não mexe no importador.

## Localização

- `src/core/rule-engine/FormulaTypes.ts`
- `src/core/rule-engine/FormulaParser.ts`
- `src/core/rule-engine/FormulaClassifier.ts`
- `src/core/rule-engine/FormulaDependencyResolver.ts`
- `src/core/rule-engine/BusinessRuleTypes.ts`
- `src/core/rule-engine/BusinessRuleExtractor.ts`
- `src/core/rule-engine/RuleDiagnostics.ts`
- `src/core/rule-engine/RuleEngine.ts`
- `src/core/rule-engine/index.ts`

## Entradas

F8.3 usa:

- `WorkbookCatalog`;
- `WorkbookReverseEngineeringReport`;
- `EnterpriseKnowledgeGraph`.

## Parser de Fórmulas

`parseFormula(formula)` identifica:

- função principal;
- funções internas;
- referências;
- constantes;
- operadores;
- ranges;
- abas referenciadas;
- tokens;
- diagnósticos textuais.

O parser trabalha apenas com texto.

## Classificação

`classifyFormula(parsedFormula)` classifica como:

- `aggregation`
- `lookup`
- `conditional`
- `arithmetic`
- `reference`
- `errorHandling`
- `text`
- `date`
- `unknown`

## Regras de Negócio

`extractBusinessRules(input)` produz objetos:

```ts
BusinessRule {
  id
  name
  category
  confidence
  source
  formulas
  inputs
  outputs
  dependencies
  impactedModules
  diagnostics
}
```

Categorias detectadas:

- comissão;
- metas;
- vendas;
- margem;
- DRE;
- cadastro;
- validação;
- lookup;
- condicionais;
- agregações.

## Dependências

`buildRuleDependencies(rule, catalog, graph)` conecta a regra a:

- fórmulas;
- abas;
- colunas;
- named ranges;
- módulos;
- conceitos empresariais.

## Explicação

`RuleEngine.explainRule(ruleId)` e `explainRule(ruleId, rules)` explicam:

- de onde a regra veio;
- quais fórmulas usa;
- quais abas/colunas alimentam;
- quais módulos impacta;
- quais riscos existem;
- quais evidências sustentam a regra.

## Limites

- Fórmulas não são executadas.
- Fórmulas não são substituídas.
- Dados originais não são alterados.
- Regras são candidatas até validação humana.
- A engine representa e explica; execução fica para uma fase futura, depois de aprovação explícita.

## Próxima Fase Recomendada

F8.4 deve criar um workflow de validação humana:

- confirmar regras candidatas;
- rejeitar exceções manuais;
- aprovar fórmulas que viram engine;
- versionar regras aprovadas;
- só então permitir execução controlada no backend.
