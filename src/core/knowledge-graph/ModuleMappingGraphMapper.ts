import { ActiveDataset } from "../../types/dataSource";
import { ModuleFieldMapping } from "../data/moduleMapping";
import { WorkbookCatalog } from "../workbook";
import {
  columnNodeId,
  KnowledgeGraphDraft,
  makeEdge,
  makeNode,
  moduleMappingNodeId,
  semanticNodeId,
  sheetNodeId,
  workbookNodeId,
} from "./EnterpriseKnowledgeGraph";
import { KnowledgeNodeType } from "./KnowledgeGraphTypes";

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function columnKey(columnLetter: string, originalName: string): string {
  return `${columnLetter}:${originalName || "sem_nome"}`;
}

function semanticTypeForRole(moduleName: string, role: string): KnowledgeNodeType | null {
  const normalizedRole = normalize(role);
  const normalizedModule = normalize(moduleName);

  if (/(seller|vendedor|consultor|name|employee|funcionario|colaborador)/.test(normalizedRole)) return "Seller";
  if (/(product|produto|item|peca|codigo|descricao)/.test(normalizedRole)) return "Product";
  if (/(client|cliente|customer|comprador|cpf|cnpj)/.test(normalizedRole)) return "Customer";
  if (/(store|unit|unidade|loja|filial|branch|empresa)/.test(normalizedRole)) return "Branch";
  if (/(department|setor|departamento|category|categoria|grupo|familia|role|cargo)/.test(normalizedRole)) return "Department";
  if (/(revenue|receita|value|valor|base|venda|fatur)/.test(normalizedRole)) return "Revenue";
  if (/(cost|custo|expense|despesa|deduction|imposto)/.test(normalizedRole)) return "Cost";
  if (/(commission|comissao|amount|rate|percentual|goal|meta)/.test(normalizedRole) || normalizedModule === "comissao") return "Commission";
  if (normalizedModule === "dre" || /(account|conta|resultado|dre)/.test(normalizedRole)) return "DRECandidate";
  return null;
}

function semanticLabel(type: KnowledgeNodeType, moduleName: string, role: string): string {
  const labels: Partial<Record<KnowledgeNodeType, string>> = {
    Seller: "Vendedor / pessoa",
    Product: "Produto / item",
    Customer: "Cliente",
    Branch: "Loja / unidade",
    Department: "Setor / departamento",
    Revenue: "Receita / valor",
    Cost: "Custo / despesa",
    Commission: "Comissão",
    DRECandidate: "DRE candidata",
  };
  return `${labels[type] || type} (${moduleName}:${role})`;
}

function findColumns(catalog: WorkbookCatalog, sheetName: string, selectedColumn: string) {
  const normalizedSelected = normalize(selectedColumn);
  return catalog.columns.filter(column => (
    column.sheetName === sheetName &&
    (normalize(column.originalName) === normalizedSelected || normalize(column.columnLetter) === normalizedSelected)
  ));
}

export function mapModuleMappingsToKnowledgeGraph(params: {
  catalog: WorkbookCatalog;
  activeDataset?: ActiveDataset | null;
  moduleMappings: ModuleFieldMapping[];
  draft: KnowledgeGraphDraft;
}): void {
  const { catalog, activeDataset, moduleMappings, draft } = params;
  const workbookId = workbookNodeId(catalog.id);

  moduleMappings.forEach(mapping => {
    const mappingId = moduleMappingNodeId(mapping.datasetId, mapping.projectId, mapping.moduleName);
    const mappedSheetId = sheetNodeId(catalog.id, mapping.sheetName);

    draft.addNode(makeNode({
      id: mappingId,
      type: "ModuleMapping",
      label: `Mapeamento ${mapping.moduleName}`,
      properties: {
        moduleName: mapping.moduleName,
        projectId: mapping.projectId,
        datasetId: mapping.datasetId,
        activeDatasetId: activeDataset?.datasetId || null,
        sheetName: mapping.sheetName,
        selectedColumns: mapping.selectedColumns,
        semanticRoles: mapping.semanticRoles,
        updatedAt: mapping.updatedAt,
      },
      evidence: [`Mapeamento salvo para módulo ${mapping.moduleName}.`],
      riskLevel: mapping.selectedColumns.length === 0 ? "medium" : undefined,
    }));

    draft.addEdge(makeEdge({
      type: "CONTAINS",
      from: workbookId,
      to: mappingId,
      label: "contém mapeamento",
      evidence: [`Workbook possui mapeamento do módulo ${mapping.moduleName}.`],
    }));

    if (draft.hasNode(mappedSheetId)) {
      draft.addEdge(makeEdge({
        type: "MAPS_TO",
        from: mappingId,
        to: mappedSheetId,
        label: "mapeia aba",
        evidence: [`${mapping.moduleName} usa a aba ${mapping.sheetName}.`],
      }));
      draft.addEdge(makeEdge({
        type: "FEEDS_MODULE",
        from: mappedSheetId,
        to: mappingId,
        label: "alimenta módulo",
        evidence: [`Aba ${mapping.sheetName} alimenta ${mapping.moduleName}.`],
      }));
    } else {
      draft.addNode(makeNode({
        id: mappedSheetId,
        type: "Sheet",
        label: mapping.sheetName,
        properties: { sheetName: mapping.sheetName, missingFromCatalog: true },
        evidence: [`Mapeamento referencia aba ${mapping.sheetName}, mas ela não foi encontrada no catálogo.`],
        riskLevel: "high",
      }));
    }

    mapping.selectedColumns.forEach(selectedColumn => {
      const foundColumns = findColumns(catalog, mapping.sheetName, selectedColumn);
      const columnNodes = foundColumns.length > 0
        ? foundColumns.map(column => columnNodeId(catalog.id, mapping.sheetName, columnKey(column.columnLetter, column.originalName)))
        : [columnNodeId(catalog.id, mapping.sheetName, `missing:${selectedColumn}`)];

      if (foundColumns.length === 0) {
        draft.addNode(makeNode({
          id: columnNodes[0],
          type: "Column",
          label: selectedColumn,
          properties: {
            sheetName: mapping.sheetName,
            originalName: selectedColumn,
            missingFromCatalog: true,
          },
          evidence: [`Mapeamento referencia coluna ${selectedColumn}, mas ela não foi encontrada no catálogo.`],
          riskLevel: "high",
        }));
      }

      columnNodes.forEach(columnId => {
        draft.addEdge(makeEdge({
          type: "MAPS_TO",
          from: mappingId,
          to: columnId,
          label: "mapeia coluna",
          evidence: [`${mapping.moduleName} usa coluna ${selectedColumn}.`],
        }));
        draft.addEdge(makeEdge({
          type: "FEEDS_MODULE",
          from: columnId,
          to: mappingId,
          label: "alimenta módulo",
          evidence: [`Coluna ${selectedColumn} alimenta ${mapping.moduleName}.`],
        }));
      });
    });

    Object.entries(mapping.semanticRoles).forEach(([role, columnName]) => {
      const type = semanticTypeForRole(mapping.moduleName, role);
      if (!type) return;

      const semanticId = semanticNodeId(catalog.id, type, `${mapping.moduleName}:${role}`);
      draft.addNode(makeNode({
        id: semanticId,
        type,
        label: semanticLabel(type, mapping.moduleName, role),
        properties: {
          moduleName: mapping.moduleName,
          semanticRole: role,
          mappedColumn: columnName,
          sheetName: mapping.sheetName,
        },
        evidence: [`Papel semântico ${role} do módulo ${mapping.moduleName} usa ${columnName}.`],
      }));

      draft.addEdge(makeEdge({
        type: "CANDIDATE_FOR",
        from: mappingId,
        to: semanticId,
        label: "candidato para conceito",
        evidence: [`Mapeamento ${mapping.moduleName}:${role} sugere ${type}.`],
      }));
      draft.addEdge(makeEdge({
        type: "FEEDS_MODULE",
        from: semanticId,
        to: mappingId,
        label: "conceito alimenta módulo",
        evidence: [`Conceito ${type} alimenta ${mapping.moduleName}.`],
      }));

      findColumns(catalog, mapping.sheetName, columnName).forEach(column => {
        const id = columnNodeId(catalog.id, mapping.sheetName, columnKey(column.columnLetter, column.originalName));
        draft.addEdge(makeEdge({
          type: "CANDIDATE_FOR",
          from: id,
          to: semanticId,
          label: "coluna candidata para conceito",
          evidence: [`Coluna ${column.originalName} mapeada como ${role}.`],
        }));
      });
    });
  });
}
