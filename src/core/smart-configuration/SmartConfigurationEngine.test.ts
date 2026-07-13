import { beforeEach, describe, expect, it, vi } from "vitest";
import { ActiveDataset, ActiveDatasetRow, SheetMetadata } from "../../types/dataSource";
import { activeDatasetStore } from "../data/ActiveDatasetStore";
import { getModuleMapping } from "../data/moduleMapping";
import { listCommissionSellers, validateCommissionMappings } from "../data/commissionClosing";
import { workspaceIntelligenceEngine } from "../workspace-intelligence";
import {
  applySmartConfigurationPlan,
  buildSmartConfigurationPlan,
  ignoreSmartConfigurationPlan,
} from "./SmartConfigurationEngine";
import { suggestColumnRoles } from "./ColumnRoleSuggestionEngine";

function createLocalStorageMock() {
  let storage: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => storage[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      storage[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete storage[key];
    }),
    clear: vi.fn(() => {
      storage = {};
    }),
    key: vi.fn((index: number) => Object.keys(storage)[index] || null),
    get length() {
      return Object.keys(storage).length;
    },
  };
}

function sheet(sheetName: string, rowCount = 2, columnCount = 4): SheetMetadata {
  return {
    sheetName,
    rowCount,
    columnCount,
    formulaCount: 0,
    storageRef: sheetName,
    classification: "Base de dados",
    selectedForImport: true,
  };
}

function rows(sheetName: string, sourceName: string, values: Record<string, unknown>[]): ActiveDatasetRow[] {
  return values.map((raw, index) => ({
    raw,
    metadata: {
      rowIndex: index + 1,
      sheetName,
      fileName: sourceName,
    },
  }));
}

function createHondaDataset(datasetId = "honda-smart-1"): ActiveDataset {
  const sourceName = "Teste_Automacao_Pecas Honda Faberge Mogi.xlsx";
  const previewRows = [
    ...rows("Cadastros_Vendedores", sourceName, [
      { Nome: "AMANDA NIMETH - MDO", Departamento: "Peças", Unidade: "Mogi" },
      { Nome: "BRUNO REAL - MDO", Departamento: "Acessórios", Unidade: "Mogi" },
    ]),
    ...rows("Comissão_Vendedores", sourceName, [
      { Nome: "AMANDA NIMETH - MDO", "Venda Acess.": "38,073", Comissão: "1,904", Objetivo: "40,000", Total: "39,977", Unidade: "Mogi" },
      { Nome: "BRUNO REAL - MDO", "Venda Acess.": "10,000", Comissão: "500", Objetivo: "12,000", Total: "10,500", Unidade: "Mogi" },
    ]),
    ...rows("IMP_VENDAS_AT", sourceName, [
      { Produto: "Filtro", Cliente: "Cliente A", Vendedor: "AMANDA NIMETH - MDO", Valor: "38,073", Código: "P-1" },
      { Produto: "Pneu", Cliente: "Cliente B", Vendedor: "BRUNO REAL - MDO", Valor: "10,000", Código: "P-2" },
    ]),
  ];

  return {
    datasetId,
    sourceType: "SPREADSHEET_DATA",
    sourceName,
    importedAt: "2026-07-08T00:00:00.000Z",
    rowCount: previewRows.length,
    columnCount: 12,
    sheets: [
      sheet("Cadastros_Vendedores", 2, 3),
      sheet("Comissão_Vendedores", 2, 6),
      sheet("IMP_VENDAS_AT", 2, 5),
    ],
    activeSheet: "Cadastros_Vendedores",
    previewRows,
    columnProfiles: [],
    importProfile: null,
    rawStorageRef: datasetId,
    status: "ACTIVE",
  };
}

describe("F10.2 Smart Configuration Wizard", () => {
  const localStorageMock = createLocalStorageMock();

  beforeEach(() => {
    vi.stubGlobal("localStorage", localStorageMock);
    localStorage.clear();
    workspaceIntelligenceEngine.clearIntelligentWorkspaceRegistry();
    activeDatasetStore.clearActiveDataset();
  });

  it("suggests Pessoas, Comissão and Comercial mappings from real Honda workbook columns", async () => {
    const dataset = createHondaDataset();
    activeDatasetStore.setActiveDataset(dataset);
    const fingerprint = workspaceIntelligenceEngine.createWorkbookFingerprint(dataset, "wb_honda");
    const workspace = workspaceIntelligenceEngine.createIntelligentWorkspace({
      name: "Honda Mogi",
      businessDomain: "automotive",
      fingerprint,
      workbookId: "wb_honda",
    });

    const plan = await buildSmartConfigurationPlan({ activeDataset: dataset, workbookId: "wb_honda", workspaceId: workspace.id });
    const people = plan.suggestions.find(suggestion => suggestion.moduleName === "Pessoas");
    const commission = plan.suggestions.find(suggestion => suggestion.moduleName === "Comissão");
    const commercial = plan.suggestions.find(suggestion => suggestion.moduleName === "Comercial");

    expect(people?.sheetName).toBe("Cadastros_Vendedores");
    expect(people?.semanticRoles).toMatchObject({
      name: "Nome",
      department: "Departamento",
      store: "Unidade",
    });
    expect(commission?.sheetName).toBe("Comissão_Vendedores");
    expect(commission?.semanticRoles).toMatchObject({
      seller: "Nome",
      base: "Venda Acess.",
      amount: "Comissão",
      goal: "Objetivo",
    });
    expect(commercial?.sheetName).toBe("IMP_VENDAS_AT");
    expect(commercial?.semanticRoles).toMatchObject({
      product: "Produto",
      seller: "Vendedor",
      client: "Cliente",
      value: "Valor",
    });
  });

  it("accepts suggestions, persists module mappings and enables commission closing without manual mapping", async () => {
    const dataset = createHondaDataset();
    activeDatasetStore.setActiveDataset(dataset);
    const fingerprint = workspaceIntelligenceEngine.createWorkbookFingerprint(dataset, "wb_honda");
    const workspace = workspaceIntelligenceEngine.createIntelligentWorkspace({
      name: "Honda Mogi",
      businessDomain: "automotive",
      fingerprint,
      workbookId: "wb_honda",
    });
    const plan = await buildSmartConfigurationPlan({ activeDataset: dataset, workbookId: "wb_honda", workspaceId: workspace.id });

    const result = applySmartConfigurationPlan(plan);
    const peopleMapping = getModuleMapping("Pessoas", dataset.datasetId);
    const commissionMapping = getModuleMapping("Comissão", dataset.datasetId);

    expect(result.appliedMappings.map(mapping => mapping.moduleName)).toEqual(expect.arrayContaining(["Pessoas", "Comissão", "Comercial"]));
    expect(peopleMapping?.semanticRoles.name).toBe("Nome");
    expect(commissionMapping?.semanticRoles.base).toBe("Venda Acess.");
    expect(validateCommissionMappings().isReady).toBe(true);

    const sellers = await listCommissionSellers();
    expect(sellers.map(seller => seller.name)).toContain("AMANDA NIMETH - MDO");
    expect(sellers.find(seller => seller.name === "AMANDA NIMETH - MDO")?.totalSold).toBe(38073);
  });

  it("prefers richer people columns when the cadastro sheet only has basic names", async () => {
    const dataset = createHondaDataset("honda-smart-people-richness");
    dataset.sheets = [
      sheet("IMP_VENDEDORES", 2, 2),
      sheet("Comissão_Vendedores", 2, 6),
    ];
    dataset.previewRows = [
      ...rows("IMP_VENDEDORES", dataset.sourceName, [
        { VENDEDOR: "1", NOME: "AMANDA NIMETH - MDO" },
        { VENDEDOR: "2", NOME: "BRUNO REAL - MDO" },
      ]),
      ...rows("Comissão_Vendedores", dataset.sourceName, [
        { Nome: "AMANDA NIMETH - MDO", Departamento: "Peças", Unidade: "Mogi", "Venda Acess.": "38,073", Comissão: "1,904", Objetivo: "40,000" },
        { Nome: "BRUNO REAL - MDO", Departamento: "Acessórios", Unidade: "Mogi", "Venda Acess.": "10,000", Comissão: "500", Objetivo: "12,000" },
      ]),
    ];
    activeDatasetStore.setActiveDataset(dataset);
    const fingerprint = workspaceIntelligenceEngine.createWorkbookFingerprint(dataset, "wb_honda");
    const workspace = workspaceIntelligenceEngine.createIntelligentWorkspace({
      name: "Honda Mogi",
      businessDomain: "automotive",
      fingerprint,
      workbookId: "wb_honda",
    });

    const plan = await buildSmartConfigurationPlan({ activeDataset: dataset, workbookId: "wb_honda", workspaceId: workspace.id });
    const people = plan.suggestions.find(suggestion => suggestion.moduleName === "Pessoas");

    expect(people?.sheetName).toBe("Comissão_Vendedores");
    expect(people?.semanticRoles).toMatchObject({
      name: "Nome",
      department: "Departamento",
      store: "Unidade",
    });
  });

  it("uses accepted workspace memory when a later workbook has similar columns", async () => {
    const firstDataset = createHondaDataset("honda-smart-1");
    activeDatasetStore.setActiveDataset(firstDataset);
    const fingerprint = workspaceIntelligenceEngine.createWorkbookFingerprint(firstDataset, "wb_honda_1");
    const workspace = workspaceIntelligenceEngine.createIntelligentWorkspace({
      name: "Honda Mogi",
      businessDomain: "automotive",
      fingerprint,
      workbookId: "wb_honda_1",
    });
    applySmartConfigurationPlan(await buildSmartConfigurationPlan({
      activeDataset: firstDataset,
      workbookId: "wb_honda_1",
      workspaceId: workspace.id,
    }));

    const nextDataset = createHondaDataset("honda-smart-2");
    nextDataset.previewRows = nextDataset.previewRows.map(row => {
      if (row.metadata.sheetName !== "Comissão_Vendedores") return row;
      return {
        ...row,
        raw: {
          "Nome Vendedor": row.raw.Nome,
          "Venda Acessorios": row.raw["Venda Acess."],
          Comissao: row.raw.Comissão,
          Objetivo: row.raw.Objetivo,
          Unidade: row.raw.Unidade,
        },
      };
    });
    activeDatasetStore.setActiveDataset(nextDataset);

    const nextPlan = await buildSmartConfigurationPlan({
      activeDataset: nextDataset,
      workbookId: "wb_honda_2",
      workspaceId: workspace.id,
    });
    const commission = nextPlan.suggestions.find(suggestion => suggestion.moduleName === "Comissão");

    expect(commission?.source).not.toBe("heuristic");
    expect(commission?.semanticRoles).toMatchObject({
      seller: "Nome Vendedor",
      base: "Venda Acessorios",
      amount: "Comissao",
      goal: "Objetivo",
    });
  });

  it("records ignored suggestions and does not insist on the same suggestion", async () => {
    const dataset = createHondaDataset();
    activeDatasetStore.setActiveDataset(dataset);
    const fingerprint = workspaceIntelligenceEngine.createWorkbookFingerprint(dataset, "wb_honda");
    const workspace = workspaceIntelligenceEngine.createIntelligentWorkspace({
      name: "Honda Mogi",
      businessDomain: "automotive",
      fingerprint,
      workbookId: "wb_honda",
    });

    const plan = await buildSmartConfigurationPlan({ activeDataset: dataset, workbookId: "wb_honda", workspaceId: workspace.id });
    ignoreSmartConfigurationPlan(plan);
    const nextPlan = await buildSmartConfigurationPlan({ activeDataset: dataset, workbookId: "wb_honda", workspaceId: workspace.id });

    expect(nextPlan.suggestions.map(suggestion => suggestion.id)).not.toEqual(expect.arrayContaining(plan.suggestions.map(suggestion => suggestion.id)));
  });

  it("does not classify financial value columns as commercial products", () => {
    const suggestions = suggestColumnRoles("Comercial", ["VLR_PEÇAS", "VLR_CUSTO", "DEPARTAMENTO"]);
    const roles = Object.fromEntries(suggestions.map(suggestion => [suggestion.semanticRole, suggestion.column]));

    expect(roles.product).toBeUndefined();
    expect(roles.value).toBe("VLR_PEÇAS");
    expect(roles.category).toBe("DEPARTAMENTO");
  });
});
