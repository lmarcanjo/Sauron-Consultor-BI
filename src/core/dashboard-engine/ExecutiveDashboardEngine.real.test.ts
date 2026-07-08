import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { ModuleFieldMapping } from "../data/moduleMapping";
import { buildKnowledgeGraph } from "../knowledge-graph";
import { RuleEngine } from "../rule-engine";
import { WorkbookCatalog, WorkbookEngine } from "../workbook";
import { workbookReverseEngineer } from "../workbook-reverse";
import { ActiveDataset } from "../../types/dataSource";
import { buildExecutiveDashboard, buildModuleDashboard } from "./index";

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
      projectId: "honda-dashboard",
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
      projectId: "honda-dashboard",
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
      projectId: "honda-dashboard",
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

describe("Executive Dashboard Engine with the real Honda workbook", () => {
  runWithRealWorkbook("builds executive and module blocks from mapped real sheets", async () => {
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

    const executive = await buildExecutiveDashboard(context);
    const commercial = await buildModuleDashboard("Comercial", context);
    const financial = await buildModuleDashboard("Financeiro", context);
    const people = await buildModuleDashboard("Pessoas", context);

    const cardValue = (metricName: string) => {
      const block = executive.blocks.find(item => item.type === "MetricCard" && (item.data as any).metricName === metricName);
      return { status: block?.status, value: (block?.data as any)?.value, block };
    };

    expect(cardValue("totalVendido").status).toBe("ready");
    expect(cardValue("totalVendido").value).toBeGreaterThan(0);
    expect(cardValue("totalComissao").status).toBe("ready");
    expect(cardValue("totalComissao").value).toBeGreaterThan(0);
    expect(cardValue("quantidadeVendedores").status).toBe("ready");
    expect(cardValue("quantidadeVendedores").value).toBeGreaterThan(0);
    expect(cardValue("ticketMedio").status).toBe("ready");
    expect(cardValue("ticketMedio").value).toBeGreaterThan(0);
    expect(cardValue("totalVendido").block?.lineage.inputSheets).toContain("Comissão_Vendedores");
    expect(cardValue("totalVendido").block?.lineage.inputColumns).toContain("Venda Acess.");

    const sellerRanking = commercial.blocks.find(block => block.type === "RankingBlock" && block.title === "Top vendedores");
    expect(sellerRanking?.status).toBe("ready");
    expect(((sellerRanking?.data as any).items || []).length).toBeGreaterThan(0);

    expect(financial.blocks.some(block => block.type === "MetricCard" || block.type === "PendingConfigBlock")).toBe(true);
    expect(people.blocks.some(block => block.type === "MetricCard" && (block.data as any).metricName === "quantidadeVendedores")).toBe(true);
    expect(people.blocks.some(block => block.type === "RankingBlock" && block.status === "ready")).toBe(true);
    expect(executive.blocks.every(block => block.lineage.datasetId === dataset.datasetId)).toBe(true);
  }, 90000);
});
