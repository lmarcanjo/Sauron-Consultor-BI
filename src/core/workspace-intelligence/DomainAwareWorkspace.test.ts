import { beforeEach, describe, expect, it } from "vitest";
import { ActiveDataset, SheetMetadata } from "../../types/dataSource";
import { workspaceIntelligenceEngine } from "./WorkspaceIntelligenceEngine";
import { businessDomainEngine } from "../business-domains";
import { suggestColumnRoles } from "../smart-configuration/ColumnRoleSuggestionEngine";

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

const agribusinessDataset = () => dataset({
  datasetId: "agro_1",
  sourceName: "Fazenda safra plantio insumos.xlsx",
  sheets: [sheet("Safra_2026"), sheet("Talhoes")],
  columns: ["Fazenda", "Safra", "Talhão", "Cultura", "Insumo", "Hectare", "Colheita"],
});

describe("F11.1 Domain-Aware Workspace & Dashboard tests", () => {
  beforeEach(() => {
    ensureLocalStorage();
    localStorage.clear();
    workspaceIntelligenceEngine.clearIntelligentWorkspaceRegistry();
  });

  it("saves domain metadata to the workspace on registration", () => {
    const data = agribusinessDataset();
    const workspace = workspaceIntelligenceEngine.registerWorkbookDecision({
      dataset: data,
      workbookId: "wb_agro_1",
      decisionAction: "create_new_workspace",
      workspaceName: "Agro Test Workspace"
    });

    expect(workspace).not.toBeNull();
    if (workspace) {
      expect(workspace.detectedDomain).toBe("agribusiness");
      expect(workspace.domainPackId).toBe("agribusiness");
      expect(workspace.domainConfidence).toBeGreaterThan(0.5);
    }
  });

  it("persists manual domain selection and updates the active context", () => {
    const data = agribusinessDataset();
    const workspace = workspaceIntelligenceEngine.registerWorkbookDecision({
      dataset: data,
      workbookId: "wb_agro_1",
      decisionAction: "create_new_workspace",
      workspaceName: "Agro Test Workspace"
    });

    expect(workspace).not.toBeNull();
    if (workspace) {
      // Force current active workspace selection
      workspaceIntelligenceEngine.selectIntelligentWorkspace(workspace.id);

      // Perform manual override selection
      const updated = workspaceIntelligenceEngine.updateWorkspaceDomain(workspace.id, "automotive");
      expect(updated.manualDomain).toBe("automotive");

      const currentRegistry = workspaceIntelligenceEngine.getWorkspaceRegistry();
      expect(currentRegistry.workspaces[workspace.id]?.manualDomain).toBe("automotive");
    }
  });

  it("adapts smart configurations suggestions dynamic labels and patterns based on active domain", () => {
    const data = agribusinessDataset();
    const workspace = workspaceIntelligenceEngine.registerWorkbookDecision({
      dataset: data,
      workbookId: "wb_agro_1",
      decisionAction: "create_new_workspace"
    });

    if (workspace) {
      workspaceIntelligenceEngine.selectIntelligentWorkspace(workspace.id);

      // Test Agribusiness active domain suggestions
      // In Pessoas module, "store" role should map to "Fazenda" and suggestion patterns should match "Fazenda"
      const suggestions = suggestColumnRoles("Pessoas", ["Fazenda", "Produtor", "Talhão"]);
      
      const storeSuggestion = suggestions.find(s => s.semanticRole === "store");
      expect(storeSuggestion).toBeDefined();
      expect(storeSuggestion?.label).toBe("Fazenda");
      expect(storeSuggestion?.column).toBe("Fazenda");

      const sellerSuggestion = suggestions.find(s => s.semanticRole === "seller");
      expect(sellerSuggestion).toBeDefined();
      expect(sellerSuggestion?.label).toBe("Produtor");
      expect(sellerSuggestion?.column).toBe("Produtor");
    }
  });

  it("translates generic dashboard titles and metrics to segment-specific terms", () => {
    const data = agribusinessDataset();
    const workspace = workspaceIntelligenceEngine.registerWorkbookDecision({
      dataset: data,
      workbookId: "wb_agro_1",
      decisionAction: "create_new_workspace"
    });

    if (workspace) {
      workspaceIntelligenceEngine.selectIntelligentWorkspace(workspace.id);

      const translatedVendedores = businessDomainEngine.translateToDomain("Quantidade de vendedores");
      expect(translatedVendedores).toBe("Quantidade de produtores");

      const translatedLojas = businessDomainEngine.translateToDomain("Lista de lojas e filiais");
      expect(translatedLojas).toBe("Lista de fazendas e fazendas");
    }
  });
});
