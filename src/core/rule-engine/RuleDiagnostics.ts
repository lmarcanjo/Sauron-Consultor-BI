import { BusinessRule, BusinessRuleDiagnostics, BusinessRuleFormulaRef } from "./BusinessRuleTypes";

function countByClassification(formulas: BusinessRuleFormulaRef[], classification: BusinessRuleFormulaRef["classification"]): number {
  return formulas.filter(formula => formula.classification === classification).length;
}

export function buildRuleDiagnostics(params: {
  category: BusinessRule["category"];
  formulas: BusinessRuleFormulaRef[];
  requiresConsultantReview?: boolean;
  sourceWarnings?: string[];
}): BusinessRuleDiagnostics {
  const lookupFormulaCount = countByClassification(params.formulas, "lookup");
  const conditionalFormulaCount = countByClassification(params.formulas, "conditional");
  const aggregationFormulaCount = countByClassification(params.formulas, "aggregation");
  const dynamicReferenceCount = params.formulas.filter(formula => (
    formula.parsed.mainFunction === "INDIRETO" ||
    formula.parsed.mainFunction === "DESLOC" ||
    formula.parsed.internalFunctions.includes("INDIRETO") ||
    formula.parsed.internalFunctions.includes("DESLOC")
  )).length;
  const warnings = [...(params.sourceWarnings || [])];

  if (params.formulas.length === 0) warnings.push("Regra candidata sem fórmulas diretamente associadas.");
  if (lookupFormulaCount > 0) warnings.push("Contém fórmulas de lookup; validar chaves e cadastros.");
  if (conditionalFormulaCount > 0) warnings.push("Contém condicionais; validar exceções e critérios com o consultor.");
  if (dynamicReferenceCount > 0) warnings.push("Contém referências dinâmicas; dependências podem estar incompletas.");

  const riskLevel: BusinessRuleDiagnostics["riskLevel"] = dynamicReferenceCount > 0 || params.formulas.length > 1000
    ? "high"
    : lookupFormulaCount > 0 || conditionalFormulaCount > 0 || params.requiresConsultantReview
      ? "medium"
      : "low";

  return {
    riskLevel,
    warnings: Array.from(new Set(warnings)),
    formulaCount: params.formulas.length,
    lookupFormulaCount,
    conditionalFormulaCount,
    aggregationFormulaCount,
    dynamicReferenceCount,
    requiresConsultantReview: Boolean(params.requiresConsultantReview),
  };
}
