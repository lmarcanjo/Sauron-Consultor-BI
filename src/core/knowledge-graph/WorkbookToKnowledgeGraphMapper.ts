import { WorkbookCatalog } from "../workbook";
import {
  columnNodeId,
  formulaNodeId,
  KnowledgeGraphDraft,
  makeEdge,
  makeNode,
  namedRangeNodeId,
  safeGraphIdPart,
  sheetNodeId,
  workbookNodeId,
} from "./EnterpriseKnowledgeGraph";

function extractSheetName(reference: string): string | null {
  const bang = reference.indexOf("!");
  if (bang === -1) return null;
  return reference.slice(0, bang).replace(/^'/, "").replace(/'$/, "").trim();
}

function extractFirstColumn(reference: string): string | null {
  const target = reference.includes("!") ? reference.slice(reference.indexOf("!") + 1) : reference;
  const match = target.replace(/\$/g, "").match(/^([A-Z]{1,3})/);
  return match?.[1] || null;
}

function columnKey(columnLetter: string, originalName: string): string {
  return `${columnLetter}:${originalName || "sem_nome"}`;
}

function findColumnNodeForReference(catalog: WorkbookCatalog, sheetName: string, reference: string): string | null {
  const letter = extractFirstColumn(reference);
  if (!letter) return null;
  const column = catalog.columns.find(item => item.sheetName === sheetName && item.columnLetter === letter);
  return column ? columnNodeId(catalog.id, sheetName, columnKey(column.columnLetter, column.originalName)) : null;
}

export function mapWorkbookToKnowledgeGraph(catalog: WorkbookCatalog, draft: KnowledgeGraphDraft): void {
  const workbookId = workbookNodeId(catalog.id);
  draft.addNode(makeNode({
    id: workbookId,
    type: "Workbook",
    label: catalog.metadata.name,
    properties: {
      workbookId: catalog.id,
      hash: catalog.metadata.hash,
      sourceName: catalog.metadata.name,
      sheetCount: catalog.metadata.sheetCount,
      rowCount: catalog.metadata.rowCount,
      columnCount: catalog.metadata.columnCount,
      formulaCount: catalog.formulas.length,
      namedRangeCount: catalog.namedRanges.length,
      importedAt: catalog.metadata.importedAt,
    },
    evidence: [`WorkbookCatalog ${catalog.id}`],
    riskLevel: catalog.metadata.cellCount >= 1000000 ? "high" : undefined,
  }));

  catalog.sheets.forEach(sheet => {
    const sheetId = sheetNodeId(catalog.id, sheet.name);
    draft.addNode(makeNode({
      id: sheetId,
      type: "Sheet",
      label: sheet.name,
      properties: {
        sheetName: sheet.name,
        index: sheet.index,
        visibility: sheet.visibility,
        rowCount: sheet.rowCount,
        columnCount: sheet.columnCount,
        hasFormulas: sheet.hasFormulas,
        hasTables: sheet.hasTables,
        hasNamedRanges: sheet.hasNamedRanges,
      },
      evidence: [`Aba catalogada no workbook: ${sheet.name}`],
      riskLevel: sheet.visibility !== "visible" ? "medium" : undefined,
    }));
    draft.addEdge(makeEdge({
      type: "CONTAINS",
      from: workbookId,
      to: sheetId,
      label: "contém aba",
      evidence: [`Workbook contém aba ${sheet.name}.`],
    }));
  });

  catalog.tables.forEach(table => {
    const tableId = `table:${safeGraphIdPart(catalog.id)}:${safeGraphIdPart(table.id)}`;
    const parentSheetId = sheetNodeId(catalog.id, table.sheetName);
    draft.addNode(makeNode({
      id: tableId,
      type: "Table",
      label: `${table.sheetName} ${table.range.address}`,
      properties: {
        tableId: table.id,
        sheetName: table.sheetName,
        type: table.type,
        range: table.range.address,
        rowCount: table.rowCount,
        columnCount: table.columnCount,
        headers: table.headers,
      },
      evidence: [`Tabela/região detectada em ${table.sheetName}!${table.range.address}.`],
    }));
    if (draft.hasNode(parentSheetId)) {
      draft.addEdge(makeEdge({
        type: "CONTAINS",
        from: parentSheetId,
        to: tableId,
        label: "contém tabela/região",
        evidence: [`${table.sheetName} contém região ${table.range.address}.`],
      }));
    }
  });

  catalog.columns.forEach(column => {
    const id = columnNodeId(catalog.id, column.sheetName, columnKey(column.columnLetter, column.originalName));
    const parentSheetId = sheetNodeId(catalog.id, column.sheetName);
    draft.addNode(makeNode({
      id,
      type: "Column",
      label: column.originalName || `${column.sheetName}!${column.columnLetter}`,
      properties: {
        sheetName: column.sheetName,
        columnIndex: column.columnIndex,
        columnLetter: column.columnLetter,
        originalName: column.originalName,
        inferredType: column.inferredType,
        valueCount: column.valueCount,
        fillRate: column.fillRate,
        possibleDates: column.possibleDates,
        possibleCpfs: column.possibleCpfs,
        possibleCnpjs: column.possibleCnpjs,
      },
      evidence: [`Coluna ${column.columnLetter} catalogada em ${column.sheetName}.`],
      riskLevel: column.inferredType === "mixed" ? "medium" : undefined,
    }));
    if (draft.hasNode(parentSheetId)) {
      draft.addEdge(makeEdge({
        type: "CONTAINS",
        from: parentSheetId,
        to: id,
        label: "contém coluna",
        evidence: [`${column.sheetName} contém coluna ${column.columnLetter}.`],
      }));
    }
  });

  catalog.formulas.forEach(formula => {
    const id = formulaNodeId(catalog.id, formula.id);
    const parentSheetId = sheetNodeId(catalog.id, formula.sheetName);
    draft.addNode(makeNode({
      id,
      type: "Formula",
      label: `${formula.sheetName}!${formula.cell}`,
      properties: {
        formulaId: formula.id,
        sheetName: formula.sheetName,
        cell: formula.cell,
        formulaType: formula.type,
        formula: formula.formula,
        dependencies: formula.dependencies,
      },
      evidence: [`Fórmula catalogada em ${formula.sheetName}!${formula.cell}.`],
      riskLevel: ["INDIRETO", "DESLOC", "PROCV", "XLOOKUP"].includes(formula.type) ? "medium" : undefined,
    }));
    if (draft.hasNode(parentSheetId)) {
      draft.addEdge(makeEdge({
        type: "CONTAINS",
        from: parentSheetId,
        to: id,
        label: "contém fórmula",
        evidence: [`${formula.sheetName} contém fórmula ${formula.cell}.`],
      }));
    }

    const calculatedColumnId = findColumnNodeForReference(catalog, formula.sheetName, formula.cell);
    if (calculatedColumnId) {
      draft.addEdge(makeEdge({
        type: "CALCULATED_BY",
        from: calculatedColumnId,
        to: id,
        label: "calculada por",
        evidence: [`A célula ${formula.cell} pertence à coluna calculada por esta fórmula.`],
      }));
    }

    formula.dependencies.forEach(dependency => {
      const dependencySheetName = extractSheetName(dependency) || formula.sheetName;
      const dependencySheetId = sheetNodeId(catalog.id, dependencySheetName);
      if (draft.hasNode(dependencySheetId)) {
        draft.addEdge(makeEdge({
          type: "DEPENDS_ON",
          from: id,
          to: dependencySheetId,
          label: "depende da aba",
          evidence: [`${formula.sheetName}!${formula.cell} referencia ${dependency}.`],
        }));
      }

      const dependencyColumnId = findColumnNodeForReference(catalog, dependencySheetName, dependency);
      if (dependencyColumnId) {
        draft.addEdge(makeEdge({
          type: "DEPENDS_ON",
          from: id,
          to: dependencyColumnId,
          label: "depende da coluna",
          evidence: [`${formula.sheetName}!${formula.cell} referencia coluna via ${dependency}.`],
        }));
      }
    });
  });

  catalog.namedRanges.forEach(namedRange => {
    const id = namedRangeNodeId(catalog.id, namedRange.name);
    const parentId = namedRange.sheetName ? sheetNodeId(catalog.id, namedRange.sheetName) : workbookId;
    draft.addNode(makeNode({
      id,
      type: "NamedRange",
      label: namedRange.name,
      properties: {
        name: namedRange.name,
        refersTo: namedRange.refersTo,
        sheetName: namedRange.sheetName,
        hidden: namedRange.hidden,
      },
      evidence: [`Named range ${namedRange.name} aponta para ${namedRange.refersTo}.`],
      riskLevel: namedRange.hidden ? "medium" : undefined,
    }));
    if (draft.hasNode(parentId)) {
      draft.addEdge(makeEdge({
        type: "CONTAINS",
        from: parentId,
        to: id,
        label: "contém named range",
        evidence: [`${namedRange.sheetName || "Workbook"} contém named range ${namedRange.name}.`],
      }));
    }

    const dependencySheetName = extractSheetName(namedRange.refersTo);
    if (dependencySheetName) {
      const dependencySheetId = sheetNodeId(catalog.id, dependencySheetName);
      if (draft.hasNode(dependencySheetId)) {
        draft.addEdge(makeEdge({
          type: "DEPENDS_ON",
          from: id,
          to: dependencySheetId,
          label: "depende da aba",
          evidence: [`${namedRange.name} referencia ${namedRange.refersTo}.`],
        }));
      }
    }
  });
}
