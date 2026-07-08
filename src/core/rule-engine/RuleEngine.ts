import { extractBusinessRules } from "./BusinessRuleExtractor";
import {
  BusinessRule,
  ExtractBusinessRulesInput,
  RuleExplanation,
} from "./BusinessRuleTypes";

export function explainRule(ruleId: string, rules: BusinessRule[]): RuleExplanation {
  const rule = rules.find(item => item.id === ruleId) || null;
  if (!rule) {
    return {
      rule: null,
      summary: `Regra ${ruleId} não encontrada.`,
      source: null,
      formulas: [],
      inputs: [],
      outputs: [],
      dependencies: [],
      impactedModules: [],
      diagnostics: null,
      evidence: [],
    };
  }

  const evidence = Array.from(new Set([
    ...rule.source.evidence,
    ...rule.inputs.flatMap(input => input.evidence),
    ...rule.outputs.flatMap(output => output.evidence),
    ...rule.dependencies.flatMap(dependency => dependency.evidence),
    ...rule.diagnostics.warnings,
  ]));

  return {
    rule,
    summary: `${rule.name} é uma regra ${rule.category} com ${rule.formulas.length} fórmula(s), ${rule.inputs.length} entrada(s) e impacto em ${rule.impactedModules.length} módulo(s).`,
    source: rule.source,
    formulas: rule.formulas,
    inputs: rule.inputs,
    outputs: rule.outputs,
    dependencies: rule.dependencies,
    impactedModules: rule.impactedModules,
    diagnostics: rule.diagnostics,
    evidence,
  };
}

export class RuleEngine {
  private readonly rules: BusinessRule[];

  constructor(input: ExtractBusinessRulesInput) {
    this.rules = extractBusinessRules(input);
  }

  listRules(): BusinessRule[] {
    return this.rules;
  }

  getRule(ruleId: string): BusinessRule | null {
    return this.rules.find(rule => rule.id === ruleId) || null;
  }

  explainRule(ruleId: string): RuleExplanation {
    return explainRule(ruleId, this.rules);
  }
}
