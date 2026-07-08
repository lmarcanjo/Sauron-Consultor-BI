import { EnterpriseKnowledgeGraph } from "../knowledge-graph";
import { WorkbookCatalog } from "../workbook";
import { BusinessRule, BusinessRuleDependency, BusinessRuleIO } from "./BusinessRuleTypes";

function uniqueById<T extends { id: string; evidence: string[] }>(items: T[]): T[] {
  const map = new Map<string, T>();
  items.forEach(item => {
    const existing = map.get(item.id);
    if (existing) {
      existing.evidence = Array.from(new Set([...existing.evidence, ...item.evidence]));
    } else {
      map.set(item.id, item);
    }
  });
  return Array.from(map.values());
}

function dependency(id: string, type: BusinessRuleDependency["type"], label: string, evidence: string[], sourceId?: string): BusinessRuleDependency {
  return { id, type, label, sourceId, evidence };
}

function io(id: string, type: BusinessRuleIO["type"], label: string, evidence: string[], sourceId?: string): BusinessRuleIO {
  return { id, type, label, sourceId, evidence };
}

function findColumnByReference(catalog: WorkbookCatalog, sheetName: string, address: string) {
  const columnLetter = address.replace(/\$/g, "").match(/^([A-Z]{1,3})/i)?.[1];
  if (!columnLetter) return null;
  return catalog.columns.find(column => column.sheetName === sheetName && column.columnLetter.toUpperCase() === columnLetter.toUpperCase()) || null;
}

function findImpactedModulesFromGraph(graph: EnterpriseKnowledgeGraph, sourceLabels: string[]): string[] {
  const labels = new Set(sourceLabels.map(label => label.toLowerCase()));
  const sourceNodeIds = new Set(graph.nodes
    .filter(node => labels.has(node.label.toLowerCase()) || labels.has(String(node.properties.sheetName || "").toLowerCase()) || labels.has(String(node.properties.originalName || "").toLowerCase()))
    .map(node => node.id));

  const moduleIds = new Set<string>();
  graph.edges.forEach(edge => {
    if (edge.type !== "FEEDS_MODULE") return;
    if (sourceNodeIds.has(edge.from) || sourceNodeIds.has(edge.to)) {
      moduleIds.add(edge.from);
      moduleIds.add(edge.to);
    }
  });

  return graph.nodes
    .filter(node => moduleIds.has(node.id) && node.type === "ModuleMapping")
    .map(node => String(node.properties.moduleName || node.label.replace(/^Mapeamento\s+/, "").replace(/^Módulo\s+/, "").replace(/\s+\(inferido\)$/, "")))
    .filter((value, index, all) => value && all.indexOf(value) === index);
}

export function buildRuleDependencies(rule: BusinessRule, catalog?: WorkbookCatalog, graph?: EnterpriseKnowledgeGraph): BusinessRuleDependency[] {
  const dependencies: BusinessRuleDependency[] = [...rule.dependencies];

  rule.formulas.forEach(formula => {
    dependencies.push(dependency(
      `formula:${formula.id}`,
      "formula",
      `${formula.sheetName}!${formula.cell}`,
      [`Regra usa fórmula ${formula.sheetName}!${formula.cell}.`],
      formula.id,
    ));

    formula.parsed.references.forEach(reference => {
      const sheetName = reference.sheetName || formula.sheetName;
      dependencies.push(dependency(
        `sheet:${sheetName}`,
        "sheet",
        sheetName,
        [`Fórmula ${formula.sheetName}!${formula.cell} referencia ${reference.raw}.`],
      ));

      if (catalog) {
        const column = findColumnByReference(catalog, sheetName, reference.address);
        if (column) {
          dependencies.push(dependency(
            `column:${column.sheetName}:${column.columnLetter}:${column.originalName}`,
            "column",
            column.originalName || `${column.sheetName}!${column.columnLetter}`,
            [`Referência ${reference.raw} aponta para coluna ${column.columnLetter} em ${column.sheetName}.`],
          ));
        }
      }
    });
  });

  rule.inputs.forEach(input => dependencies.push(dependency(input.id, input.type as BusinessRuleDependency["type"], input.label, input.evidence, input.sourceId)));
  rule.outputs.forEach(output => dependencies.push(dependency(output.id, output.type as BusinessRuleDependency["type"], output.label, output.evidence, output.sourceId)));

  if (graph) {
    findImpactedModulesFromGraph(graph, [
      ...rule.inputs.map(input => input.label),
      ...rule.outputs.map(output => output.label),
      ...rule.formulas.map(formula => formula.sheetName),
    ]).forEach(moduleName => {
      dependencies.push(dependency(`module:${moduleName}`, "module", moduleName, [`Grafo indica impacto no módulo ${moduleName}.`]));
    });
  }

  return uniqueById(dependencies);
}

export function deriveRuleInputsFromDependencies(dependencies: BusinessRuleDependency[]): BusinessRuleIO[] {
  return uniqueById(dependencies
    .filter(item => item.type === "sheet" || item.type === "column" || item.type === "namedRange")
    .map(item => io(item.id, item.type, item.label, item.evidence, item.sourceId)));
}
