import { beforeEach, describe, expect, it } from "vitest";
import { ActiveDataset, SheetMetadata } from "../../types/dataSource";
import { classifyBusinessDomain } from "./BusinessDomainClassifier";
import { importDecisionEngine } from "./ImportDecisionEngine";
import { createWorkbookFingerprint } from "./WorkbookFingerprint";
import { workspaceSimilarityEngine } from "./WorkspaceSimilarityEngine";
import { WORKSPACE_REGISTRY_STORAGE_KEY, workspaceIntelligenceEngine } from "./WorkspaceIntelligenceEngine";

function ensureLocalStorage() {
  if (typeof globalThis.localStorage !== "undefined") return;
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (key: string) => store.get(key) || null,
    setItem: (key: string, value: string) => { store.set(key, value); },
    removeItem: (key: string) => { store.delete(key); },
    clear: () => { store.clear(); },
    key: (index: number) => Array.from(store.keys())[index] || null,
    get length() { return store.size; },
  } as Storage;
}

function sheet(sheetName: string, rowCount = 20, columnCount = 6): SheetMetadata {
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

function dataset(input: {
  datasetId: string;
  sourceName: string;
  sheets: SheetMetadata[];
  columns: string[];
}): ActiveDataset {
  return {
    datasetId: input.datasetId,
    sourceType: "SPREADSHEET_DATA",
    sourceName: input.sourceName,
    importedAt: "2026-07-08T00:00:00.000Z",
    rowCount: 100,
    columnCount: input.columns.length,
    sheets: input.sheets,
    activeSheet: input.sheets[0]?.sheetName || "Dados",
    previewRows: [
      {
        raw: Object.fromEntries(input.columns.map(column => [column, `${column} valor`])),
        normalized: Object.fromEntries(input.columns.map(column => [column, `${column} valor`])),
        metadata: {
          rowIndex: 1,
          sheetName: input.sheets[0]?.sheetName || "Dados",
          fileName: input.sourceName,
        },
      },
    ],
    columnProfiles: input.columns.map(column => ({
      name: column,
      originalName: column,
      type: "string",
    })),
    importProfile: null,
    rawStorageRef: input.datasetId,
    status: "ACTIVE",
  };
}

const automotiveDataset = () => dataset({
  datasetId: "auto_1",
  sourceName: "Honda pecas vendedores comissao.xlsx",
  sheets: [sheet("IMP_VENDAS_AT"), sheet("Comissao_Vendedores")],
  columns: ["Produto", "Peça", "Vendedor", "Comissão", "Veículo", "Modelo", "Marca", "Valor"],
});

const agribusinessDataset = () => dataset({
  datasetId: "agro_1",
  sourceName: "Fazenda safra plantio insumos.xlsx",
  sheets: [sheet("Safra_2026"), sheet("Talhoes")],
  columns: ["Fazenda", "Safra", "Talhão", "Cultura", "Insumo", "Hectare", "Colheita"],
});

describe("F10.1 Intelligent Workspace", () => {
  beforeEach(() => {
    ensureLocalStorage();
    localStorage.clear();
    workspaceIntelligenceEngine.clearIntelligentWorkspaceRegistry();
  });

  it("classifies an automotive workbook as automotive", () => {
    const fingerprint = createWorkbookFingerprint({ dataset: automotiveDataset() });
    const classification = classifyBusinessDomain(fingerprint);

    expect(classification.domain).toBe("automotive");
    expect(classification.confidence).toBeGreaterThan(0.5);
    expect(classification.matchedTerms).toContain("pecas");
  });

  it("classifies an agribusiness workbook as agribusiness", () => {
    const fingerprint = createWorkbookFingerprint({ dataset: agribusinessDataset() });
    const classification = classifyBusinessDomain(fingerprint);

    expect(classification.domain).toBe("agribusiness");
    expect(classification.confidence).toBeGreaterThan(0.5);
    expect(classification.matchedTerms).toContain("safra");
  });

  it("scores two automotive workbooks with high similarity", () => {
    const firstFingerprint = createWorkbookFingerprint({ dataset: automotiveDataset(), workbookId: "wb_auto_1" });
    const secondFingerprint = createWorkbookFingerprint({
      dataset: dataset({
        datasetId: "auto_2",
        sourceName: "Honda veiculo vendedor comissao.xlsx",
        sheets: [sheet("IMP_VENDAS_AT"), sheet("Comissao_Vendedores")],
        columns: ["Produto", "Peça", "Vendedor", "Comissão", "Veículo", "Modelo", "Marca", "Valor"],
      }),
      workbookId: "wb_auto_2",
    });
    const workspace = workspaceIntelligenceEngine.createIntelligentWorkspace({
      name: "Automotivo Honda",
      businessDomain: "automotive",
      fingerprint: firstFingerprint,
      workbookId: "wb_auto_1",
    });

    const result = workspaceSimilarityEngine.compareToWorkspace(secondFingerprint, workspace);
    expect(result.score).toBeGreaterThan(0.75);
    expect(result.matchingSignals).toContain("domínio automotive");
  });

  it("recommends a new workspace when an agribusiness workbook is imported into an automotive workspace", () => {
    const autoFingerprint = createWorkbookFingerprint({ dataset: automotiveDataset(), workbookId: "wb_auto" });
    const currentWorkspace = workspaceIntelligenceEngine.createIntelligentWorkspace({
      name: "Automotivo Honda",
      businessDomain: "automotive",
      fingerprint: autoFingerprint,
      workbookId: "wb_auto",
    });
    const agroFingerprint = createWorkbookFingerprint({ dataset: agribusinessDataset(), workbookId: "wb_agro" });

    const decision = importDecisionEngine.buildDecision({
      fingerprint: agroFingerprint,
      currentWorkspace,
      workspaces: [currentWorkspace],
    });

    expect(decision.recommendedAction).toBe("create_new_workspace");
    expect(decision.warnings.join(" ")).toContain("diferente");
  });

  it("asks for a consultant decision when confidence is low", () => {
    const unknownFingerprint = createWorkbookFingerprint({
      dataset: dataset({
        datasetId: "unknown_1",
        sourceName: "arquivo operacional.xlsx",
        sheets: [sheet("Dados")],
        columns: ["Campo A", "Campo B", "Campo C"],
      }),
      workbookId: "wb_unknown_1",
    });
    const currentWorkspace = workspaceIntelligenceEngine.createIntelligentWorkspace({
      name: "Contexto indefinido",
      businessDomain: "unknown",
      fingerprint: unknownFingerprint,
      workbookId: "wb_unknown_1",
    });
    const newUnknownFingerprint = createWorkbookFingerprint({
      dataset: dataset({
        datasetId: "unknown_2",
        sourceName: "controle diverso.xlsx",
        sheets: [sheet("Lancamentos")],
        columns: ["Campo X", "Campo Y"],
      }),
      workbookId: "wb_unknown_2",
    });

    const decision = importDecisionEngine.buildDecision({
      fingerprint: newUnknownFingerprint,
      currentWorkspace,
      workspaces: [currentWorkspace],
    });

    expect(decision.confidence).toBeLessThan(0.55);
    expect(decision.recommendedAction).toBe("open_temporarily");
    expect(decision.options.length).toBeGreaterThan(0);
  });

  it("creates the first workspace automatically through the accepted decision", () => {
    const workbook = automotiveDataset();
    const decision = workspaceIntelligenceEngine.evaluateWorkbookImport(workbook, "wb_first");
    const workspace = workspaceIntelligenceEngine.registerWorkbookDecision({
      dataset: workbook,
      workbookId: "wb_first",
      decisionAction: decision.recommendedAction,
    });

    expect(decision.recommendedAction).toBe("create_new_workspace");
    expect(workspace?.workbookIds).toContain("wb_first");
    expect(workspaceIntelligenceEngine.getCurrentIntelligentWorkspace()?.id).toBe(workspace?.id);
  });

  it("persists the consultant choice for an existing workspace", () => {
    const automotiveWorkspace = workspaceIntelligenceEngine.createIntelligentWorkspace({
      name: "Automotivo Honda",
      businessDomain: "automotive",
      fingerprint: createWorkbookFingerprint({ dataset: automotiveDataset(), workbookId: "wb_auto" }),
      workbookId: "wb_auto",
    });
    workspaceIntelligenceEngine.createIntelligentWorkspace({
      name: "Agro Safra",
      businessDomain: "agribusiness",
      fingerprint: createWorkbookFingerprint({ dataset: agribusinessDataset(), workbookId: "wb_agro" }),
      workbookId: "wb_agro",
    });

    const nextAutoDataset = dataset({
      datasetId: "auto_3",
      sourceName: "Honda oficina veiculo revisao.xlsx",
      sheets: [sheet("IMP_VENDAS_AT"), sheet("Oficina")],
      columns: ["Oficina", "Veículo", "Vendedor", "Peças", "Valor", "Marca"],
    });
    const selectedWorkspace = workspaceIntelligenceEngine.registerWorkbookDecision({
      dataset: nextAutoDataset,
      workbookId: "wb_auto_3",
      decisionAction: "choose_existing_workspace",
      workspaceId: automotiveWorkspace.id,
    });

    const persisted = JSON.parse(localStorage.getItem(WORKSPACE_REGISTRY_STORAGE_KEY) || "{}");
    expect(selectedWorkspace?.id).toBe(automotiveWorkspace.id);
    expect(persisted.currentWorkspaceId).toBe(automotiveWorkspace.id);
    expect(persisted.workspaces[automotiveWorkspace.id].workbookIds).toContain("wb_auto_3");
  });
});
