import { EnterpriseKnowledgeGraph, KnowledgeGraphNode } from "../knowledge-graph";
import { WorkbookCatalog, WorkbookFormulaCatalogItem } from "../workbook";
import {
  BusinessRuleCandidate,
  KpiCandidate,
  WorkbookReverseEngineeringReport,
} from "../workbook-reverse";
import { buildRuleDependencies, deriveRuleInputsFromDependencies } from "./FormulaDependencyResolver";
import { classifyFormula } from "./FormulaClassifier";
import { parseFormula } from "./FormulaParser";
import {
  BusinessRule,
  BusinessRuleCategory,
  BusinessRuleFormulaRef,
  BusinessRuleIO,
  BusinessRuleSource,
  ExtractBusinessRulesInput,
} from "./BusinessRuleTypes";
import { buildRuleDiagnostics } from "./RuleDiagnostics";

const MAX_FORMULAS_PER_RULE = 2000;

function safeId(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 160) || "rule";
}

function unique(values: string[]): string[] {
  return values.filter((value, index, all) => value && all.indexOf(value) === index);
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function reverseCategoryToRuleCategory(category: BusinessRuleCandidate["category"]): BusinessRuleCategory {
  if (category === "commission") return "commission";
  if (category === "dre") return "dre";
  if (category === "validation") return "validation";
  if (category === "lookup") return "lookup";
  if (category === "conditional") return "conditional";
  if (category === "aggregation") return "aggregation";
  return "unknown";
}

function kpiCategoryToRuleCategory(category: KpiCandidate["category"]): BusinessRuleCategory {
  if (category === "commission") return "commission";
  if (category === "sales") return "sales";
  if (category === "margin") return "margin";
  if (category === "dre") return "dre";
  if (category === "people") return "registry";
  if (category === "financial") return "sales";
  return "unknown";
}

function moduleForCategory(category: BusinessRuleCategory): string[] {
  if (category === "commission") return ["Comissão", "Pessoas"];
  if (category === "sales" || category === "aggregation" || category === "margin") return ["Comercial"];
  if (category === "dre") return ["DRE", "Financeiro"];
  if (category === "registry") return ["Pessoas"];
  if (category === "validation") return ["Central de Dados"];
  if (category === "lookup" || category === "conditional") return [];
  return [];
}

function makeFormulaRef(formula: WorkbookFormulaCatalogItem, cache: Map<string, BusinessRuleFormulaRef>): BusinessRuleFormulaRef {
  const existing = cache.get(formula.id);
  if (existing) return existing;

  const parsed = parseFormula(formula.formula);
  const classification = classifyFormula(parsed).classification;
  const ref: BusinessRuleFormulaRef = {
    id: formula.id,
    sheetName: formula.sheetName,
    cell: formula.cell,
    formula: formula.formula,
    workbookFormulaType: formula.type,
    classification,
    parsed,
  };
  cache.set(formula.id, ref);
  return ref;
}

function formulasForCandidate(params: {
  catalog: WorkbookCatalog;
  sheetNames: string[];
  formulaTypes: string[];
  category: BusinessRuleCategory;
  cache: Map<string, BusinessRuleFormulaRef>;
}): BusinessRuleFormulaRef[] {
  const sheets = new Set(params.sheetNames);
  const formulaTypes = new Set(params.formulaTypes);
  const categoryClassifications: Partial<Record<BusinessRuleCategory, string[]>> = {
    commission: ["aggregation", "conditional", "arithmetic", "lookup", "errorHandling"],
    sales: ["aggregation", "arithmetic", "lookup"],
    margin: ["arithmetic", "aggregation", "conditional"],
    dre: ["aggregation", "arithmetic", "reference", "conditional"],
    lookup: ["lookup", "errorHandling"],
    conditional: ["conditional", "errorHandling"],
    aggregation: ["aggregation"],
    validation: ["conditional", "lookup", "reference"],
  };
  const wantedClassifications = new Set(categoryClassifications[params.category] || []);
  const selected: BusinessRuleFormulaRef[] = [];

  for (const formula of params.catalog.formulas) {
    if (selected.length >= MAX_FORMULAS_PER_RULE) break;
    if (sheets.size > 0 && !sheets.has(formula.sheetName)) continue;
    if (formulaTypes.size > 0 && !formulaTypes.has(formula.type)) continue;

    const ref = makeFormulaRef(formula, params.cache);
    if (wantedClassifications.size > 0 && !wantedClassifications.has(ref.classification) && !formulaTypes.has(ref.workbookFormulaType)) {
      continue;
    }
    selected.push(ref);
  }

  return selected;
}

function sheetInput(sheetName: string): BusinessRuleIO {
  return {
    id: `sheet:${sheetName}`,
    type: "sheet",
    label: sheetName,
    evidence: [`Aba ${sheetName} indicada como fonte da regra.`],
  };
}

function columnInput(catalog: WorkbookCatalog, columnName: string): BusinessRuleIO[] {
  const normalized = normalize(columnName);
  return catalog.columns
    .filter(column => normalize(column.originalName) === normalized)
    .map(column => ({
      id: `column:${column.sheetName}:${column.columnLetter}:${column.originalName}`,
      type: "column" as const,
      label: column.originalName || `${column.sheetName}!${column.columnLetter}`,
      evidence: [`Coluna ${column.originalName} em ${column.sheetName} indicada pela regra.`],
    }));
}

function graphModulesForEvidence(graph: EnterpriseKnowledgeGraph, labels: string[]): string[] {
  const normalizedLabels = new Set(labels.map(normalize));
  const candidateNodes = graph.nodes.filter(node => (
    normalizedLabels.has(normalize(node.label)) ||
    normalizedLabels.has(normalize(String(node.properties.moduleName || ""))) ||
    normalizedLabels.has(normalize(String(node.properties.category || "")))
  ));
  const candidateIds = new Set(candidateNodes.map(node => node.id));
  const moduleIds = new Set<string>();

  graph.edges.forEach(edge => {
    if (edge.type !== "FEEDS_MODULE") return;
    if (candidateIds.has(edge.from)) moduleIds.add(edge.to);
    if (candidateIds.has(edge.to)) moduleIds.add(edge.from);
  });

  return graph.nodes
    .filter(node => node.type === "ModuleMapping" && moduleIds.has(node.id))
    .map(node => String(node.properties.moduleName || node.label.replace(/^Mapeamento\s+/, "").replace(/^Módulo\s+/, "").replace(/\s+\(inferido\)$/, "")))
    .filter((value, index, all) => value && all.indexOf(value) === index);
}

function conceptOutputsFromGraph(graph: EnterpriseKnowledgeGraph, relatedLabels: string[]): BusinessRuleIO[] {
  const normalizedLabels = new Set(relatedLabels.map(normalize));
  return graph.nodes
    .filter((node: KnowledgeGraphNode) => [
      "Seller",
      "Product",
      "Customer",
      "Branch",
      "Department",
      "Revenue",
      "Cost",
      "Commission",
      "DRECandidate",
    ].includes(node.type))
    .filter(node => (
      normalizedLabels.size === 0 ||
      normalizedLabels.has(normalize(node.label)) ||
      normalizedLabels.has(normalize(String(node.properties.moduleName || ""))) ||
      Array.from(normalizedLabels).some(label => normalize(node.label).includes(label) || label.includes(normalize(node.label)))
    ))
    .map(node => ({
      id: `concept:${node.id}`,
      type: "concept" as const,
      label: node.label,
      sourceId: node.id,
      evidence: node.evidence,
    }))
    .slice(0, 12);
}

function buildRule(params: {
  id: string;
  name: string;
  category: BusinessRuleCategory;
  confidence: number;
  source: BusinessRuleSource;
  formulas: BusinessRuleFormulaRef[];
  inputs: BusinessRuleIO[];
  outputs: BusinessRuleIO[];
  impactedModules: string[];
  catalog: WorkbookCatalog;
  graph: EnterpriseKnowledgeGraph;
  requiresConsultantReview?: boolean;
  warnings?: string[];
}): BusinessRule {
  const diagnostics = buildRuleDiagnostics({
    category: params.category,
    formulas: params.formulas,
    requiresConsultantReview: params.requiresConsultantReview,
    sourceWarnings: params.warnings,
  });
  const initial: BusinessRule = {
    id: params.id,
    name: params.name,
    category: params.category,
    confidence: params.confidence,
    source: params.source,
    formulas: params.formulas,
    inputs: params.inputs,
    outputs: params.outputs,
    dependencies: [],
    impactedModules: unique(params.impactedModules),
    diagnostics,
  };
  const dependencies = buildRuleDependencies(initial, params.catalog, params.graph);
  const derivedInputs = deriveRuleInputsFromDependencies(dependencies);

  return {
    ...initial,
    inputs: [...params.inputs, ...derivedInputs].filter((input, index, all) => all.findIndex(item => item.id === input.id) === index),
    dependencies,
  };
}

function rulesFromReverseCandidates(params: {
  catalog: WorkbookCatalog;
  reverseReport: WorkbookReverseEngineeringReport;
  graph: EnterpriseKnowledgeGraph;
  cache: Map<string, BusinessRuleFormulaRef>;
}): BusinessRule[] {
  return params.reverseReport.businessRuleCandidates.map(candidate => {
    const category = reverseCategoryToRuleCategory(candidate.category);
    const formulas = formulasForCandidate({
      catalog: params.catalog,
      sheetNames: candidate.sheetNames,
      formulaTypes: candidate.formulaTypes,
      category,
      cache: params.cache,
    });
    const inputs = [
      ...candidate.sheetNames.map(sheetInput),
      ...candidate.relatedColumns.flatMap(column => columnInput(params.catalog, column)),
    ];
    const impactedModules = unique([
      ...moduleForCategory(category),
      ...graphModulesForEvidence(params.graph, [candidate.title, candidate.category]),
    ]);
    const outputs = conceptOutputsFromGraph(params.graph, [candidate.title, candidate.category, ...impactedModules]);

    return buildRule({
      id: `rule:reverse:${safeId(candidate.id)}`,
      name: candidate.title,
      category,
      confidence: candidate.confidence,
      source: {
        type: "reverseReport",
        id: candidate.id,
        label: candidate.title,
        evidence: candidate.evidence,
      },
      formulas,
      inputs,
      outputs,
      impactedModules,
      catalog: params.catalog,
      graph: params.graph,
      requiresConsultantReview: candidate.requiresConsultantReview,
    });
  });
}

function rulesFromKpiCandidates(params: {
  catalog: WorkbookCatalog;
  reverseReport: WorkbookReverseEngineeringReport;
  graph: EnterpriseKnowledgeGraph;
  cache: Map<string, BusinessRuleFormulaRef>;
}): BusinessRule[] {
  return params.reverseReport.kpiCandidates.map(candidate => {
    const category = kpiCategoryToRuleCategory(candidate.category);
    const formulas = formulasForCandidate({
      catalog: params.catalog,
      sheetNames: candidate.sheetNames,
      formulaTypes: [],
      category,
      cache: params.cache,
    });
    const inputs = [
      ...candidate.sheetNames.map(sheetInput),
      ...candidate.relatedColumns.flatMap(column => columnInput(params.catalog, column)),
    ];
    const impactedModules = unique([
      ...moduleForCategory(category),
      ...graphModulesForEvidence(params.graph, [candidate.name, candidate.category]),
    ]);
    const outputs = conceptOutputsFromGraph(params.graph, [candidate.name, candidate.category, ...impactedModules]);

    return buildRule({
      id: `rule:kpi:${safeId(candidate.id)}`,
      name: candidate.name,
      category,
      confidence: candidate.confidence,
      source: {
        type: "reverseReport",
        id: candidate.id,
        label: candidate.name,
        evidence: candidate.evidence,
      },
      formulas,
      inputs,
      outputs,
      impactedModules,
      catalog: params.catalog,
      graph: params.graph,
      requiresConsultantReview: true,
    });
  });
}

function registryRulesFromSheets(params: {
  catalog: WorkbookCatalog;
  reverseReport: WorkbookReverseEngineeringReport;
  graph: EnterpriseKnowledgeGraph;
}): BusinessRule[] {
  return params.reverseReport.sheetRoles
    .filter(sheet => sheet.roles.some(role => role.role === "cadastro" && role.confidence >= 0.45))
    .map(sheet => buildRule({
      id: `rule:registry:${safeId(sheet.sheetName)}`,
      name: `Cadastro em ${sheet.sheetName}`,
      category: "registry",
      confidence: sheet.roles.find(role => role.role === "cadastro")?.confidence || 0.5,
      source: {
        type: "reverseReport",
        id: sheet.sheetName,
        label: sheet.sheetName,
        evidence: sheet.roles.flatMap(role => role.evidence),
      },
      formulas: [],
      inputs: [sheetInput(sheet.sheetName)],
      outputs: conceptOutputsFromGraph(params.graph, [sheet.sheetName, "Pessoas", "Seller"]),
      impactedModules: unique(["Pessoas", ...graphModulesForEvidence(params.graph, [sheet.sheetName, "Pessoas"])]),
      catalog: params.catalog,
      graph: params.graph,
      requiresConsultantReview: true,
    }));
}

export function extractBusinessRules(input: ExtractBusinessRulesInput): BusinessRule[] {
  const cache = new Map<string, BusinessRuleFormulaRef>();
  const rules = [
    ...rulesFromReverseCandidates({
      catalog: input.workbookCatalog,
      reverseReport: input.reverseReport,
      graph: input.knowledgeGraph,
      cache,
    }),
    ...rulesFromKpiCandidates({
      catalog: input.workbookCatalog,
      reverseReport: input.reverseReport,
      graph: input.knowledgeGraph,
      cache,
    }),
    ...registryRulesFromSheets({
      catalog: input.workbookCatalog,
      reverseReport: input.reverseReport,
      graph: input.knowledgeGraph,
    }),
  ];

  return rules
    .filter((rule, index, all) => all.findIndex(item => item.id === rule.id) === index)
    .sort((a, b) => {
      const riskScore = { high: 2, medium: 1, low: 0 };
      return riskScore[b.diagnostics.riskLevel] - riskScore[a.diagnostics.riskLevel] || b.confidence - a.confidence;
    });
}
