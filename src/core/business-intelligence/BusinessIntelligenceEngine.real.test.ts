import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { ModuleFieldMapping } from "../data/moduleMapping";
import { buildKnowledgeGraph } from "../knowledge-graph";
import { RuleEngine } from "../rule-engine";
import { WorkbookCatalog, WorkbookEngine } from "../workbook";
import { workbookReverseEngineer } from "../workbook-reverse";
import { BusinessIntelligenceEngine, calculateMetric } from "./index";
import { ActiveDataset } from "../../types/dataSource";

const REAL_WORKBOOK_PATH = "/home/natalicorreia/Downloads/Teste_Automação_Peças Honda Faberge Mogi~06.26 Veiculo ativou.xlsx";
const runWithRealWorkbook = fs.existsSync(REAL_WORKBOOK_PATH) ? it : it.skip;

function activeDatasetFromCatalog(catalog: WorkbookCatalog): ActiveDataset {
  return {
    datasetId: catalog.id,
    sourceType: "SPREADSHEET_DATA",
    sourceName: catalog.metadata.name,
    importedAt: catalog.metadata.importedAt,
    rowCount: catalog.metadata.rowCount,
    columnCount: catalog.metadata.columnCount,
    sheets: catalog.sheets.map(sheet => sheet.name),
    activeSheet: "Comissão_Vendedores",
    previewRows: [],
    columnProfiles: [],
    importProfile: null,
    rawStorageRef: `test:${catalog.id}`,
    status: "ACTIVE",
  };
}

function realMappings(datasetId: string): ModuleFieldMapping[] {
  return [
    {
      projectId: "honda-bi",
      datasetId,
      moduleName: "Comercial",
      sheetName: "Comissão_Vendedores",
      selectedColumns: ["Nome", "Departamento", "Unidade", "Venda Acess."],
      semanticRoles: {
        seller: "Nome",
        product: "Departamento",
        client: "Unidade",
        value: "Venda Acess.",
      },
      updatedAt: "2026-07-08T00:00:00.000Z",
    },
    {
      projectId: "honda-bi",
      datasetId,
      moduleName: "Pessoas",
      sheetName: "Cadastros_Vendedores",
      selectedColumns: ["Nome", "Departamento", "Unidade"],
      semanticRoles: {
        name: "Nome",
        department: "Departamento",
        store: "Unidade",
      },
      updatedAt: "2026-07-08T00:00:00.000Z",
    },
    {
      projectId: "honda-bi",
      datasetId,
      moduleName: "Comissão",
      sheetName: "Comissão_Vendedores",
      selectedColumns: ["Nome", "Venda Acess.", "Comissão"],
      semanticRoles: {
        seller: "Nome",
        base: "Venda Acess.",
        amount: "Comissão",
      },
      updatedAt: "2026-07-08T00:00:00.000Z",
    },
  ];
}

function rowsFromSheet(workbook: XLSX.WorkBook, sheetName: string, headerRowNumber: number, limit: number): Record<string, any>[] {
  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet?.["!ref"]) return [];

  const range = XLSX.utils.decode_range(worksheet["!ref"]);
  const headerRow = headerRowNumber - 1;
  const headers: string[] = [];
  for (let column = range.s.c; column <= range.e.c; column++) {
    const address = XLSX.utils.encode_cell({ r: headerRow, c: column });
    const value = worksheet[address]?.v;
    headers.push(value ? String(value).trim() : XLSX.utils.encode_col(column));
  }

  const rows: Record<string, any>[] = [];
  for (let row = headerRow + 1; row <= range.e.r && rows.length < limit; row++) {
    const output: Record<string, any> = {};
    let hasValue = false;
    for (let column = range.s.c; column <= range.e.c; column++) {
      const address = XLSX.utils.encode_cell({ r: row, c: column });
      const value = worksheet[address]?.v ?? null;
      output[headers[column - range.s.c]] = value;
      if (value !== null && value !== "") hasValue = true;
    }
    if (hasValue) rows.push(output);
  }
  return rows;
}

describe("Business Intelligence Engine with the real Honda workbook", () => {
  runWithRealWorkbook("calculates auditable real metrics from mapped sheets", async () => {
    const buffer = fs.readFileSync(REAL_WORKBOOK_PATH);
    const workbook = XLSX.read(buffer, { type: "buffer", cellFormula: true, cellDates: true });
    const catalog = await new WorkbookEngine().catalogArrayBuffer(buffer, {
      sourceName: path.basename(REAL_WORKBOOK_PATH),
      sourceSizeBytes: buffer.byteLength,
      previewRowsPerSheet: 5,
      profileRowsPerSheetLimit: 500,
    });
    const reverseReport = workbookReverseEngineer.generateReport(catalog);
    const dataset = activeDatasetFromCatalog(catalog);
    const moduleMappings = realMappings(dataset.datasetId);
    const knowledgeGraph = buildKnowledgeGraph({ workbookCatalog: catalog, reverseReport, activeDataset: dataset, moduleMappings });
    const rules = new RuleEngine({ workbookCatalog: catalog, reverseReport, knowledgeGraph }).listRules();
    const context = {
      activeDataset: dataset,
      moduleMappings,
      workbookCatalog: catalog,
      reverseReport,
      knowledgeGraph,
      rules,
      maxRowsPerMetric: 100000,
      rowProvider: async (sheetName: string, limit: number) => {
        if (sheetName === "Comissão_Vendedores") return rowsFromSheet(workbook, sheetName, 13, limit);
        if (sheetName === "Cadastros_Vendedores") return rowsFromSheet(workbook, sheetName, 5, limit);
        return rowsFromSheet(workbook, sheetName, 2, limit);
      },
    };

    const totalVendido = await calculateMetric("totalVendido", context);
    const totalComissao = await calculateMetric("totalComissao", context);
    const quantidadeVendedores = await calculateMetric("quantidadeVendedores", context);
    const ticketMedio = await calculateMetric("ticketMedio", context);
    const receita = await calculateMetric("receitaCandidata", context);
    const engine = new BusinessIntelligenceEngine(context);
    const comercialMetrics = await engine.calculateModuleMetrics("Comercial");
    const explanation = engine.explainMetric(comercialMetrics.find(metric => metric.name === "totalVendido")?.id || "");

    expect(totalVendido.status).toBe("ready");
    expect(totalVendido.value).toBeGreaterThan(0);
    expect(totalVendido.sheetName).toBe("Comissão_Vendedores");
    expect(totalVendido.columnsUsed).toContain("Venda Acess.");
    expect(totalVendido.lineage.inputSheets).toContain("Comissão_Vendedores");

    expect(totalComissao.status).toBe("ready");
    expect(totalComissao.value).toBeGreaterThan(0);
    expect(totalComissao.columnsUsed).toContain("Comissão");

    expect(quantidadeVendedores.status).toBe("ready");
    expect(quantidadeVendedores.value).toBeGreaterThan(0);
    expect(ticketMedio.status).toBe("ready");
    expect(ticketMedio.value).toBeGreaterThan(0);
    expect(receita.status).toBe("ready");
    expect(receita.columnsUsed).toContain("Venda Acess.");

    expect(explanation.evidence.join(" ")).toContain("Aba usada: Comissão_Vendedores");
    expect(explanation.evidence.join(" ")).toContain("Colunas usadas: Venda Acess.");
    expect(JSON.stringify(comercialMetrics)).not.toContain("Grupo Alpha");
    expect(JSON.stringify(comercialMetrics)).not.toContain("Topázio");
  }, 90000);
});
