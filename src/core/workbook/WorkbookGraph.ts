import { WorkbookDependencyGraph, WorkbookFormulaCatalogItem, WorkbookNamedRangeCatalog } from "./WorkbookTypes";

function extractSheetName(reference: string): string | null {
  const bang = reference.indexOf("!");
  if (bang === -1) return null;
  return reference.slice(0, bang).replace(/^'/, "").replace(/'$/, "");
}

export function buildDependencyGraph(params: {
  sheetNames: string[];
  formulas: WorkbookFormulaCatalogItem[];
  namedRanges: WorkbookNamedRangeCatalog[];
}): WorkbookDependencyGraph {
  const nodes = new Set(params.sheetNames);
  const edges: WorkbookDependencyGraph["edges"] = [];
  const edgeKeys = new Set<string>();

  function addEdge(edge: WorkbookDependencyGraph["edges"][number]): void {
    const key = `${edge.from}::${edge.to}::${edge.type}::${edge.evidence}`;
    if (edgeKeys.has(key)) return;
    edgeKeys.add(key);
    edges.push(edge);
  }

  params.formulas.forEach(formula => {
    nodes.add(formula.sheetName);
    formula.dependencies.forEach(dep => {
      const dependencySheet = extractSheetName(dep);
      if (dependencySheet) {
        nodes.add(dependencySheet);
        addEdge({
          from: formula.sheetName,
          to: dependencySheet,
          type: "formula",
          evidence: `${formula.cell}: ${formula.formula}`,
        });
      }
    });
  });

  params.namedRanges.forEach(namedRange => {
    const dependencySheet = extractSheetName(namedRange.refersTo);
    if (dependencySheet && namedRange.sheetName) {
      nodes.add(namedRange.sheetName);
      nodes.add(dependencySheet);
      addEdge({
        from: namedRange.sheetName,
        to: dependencySheet,
        type: "namedRange",
        evidence: `${namedRange.name}: ${namedRange.refersTo}`,
      });
    }
  });

  return {
    nodes: Array.from(nodes),
    edges,
  };
}
