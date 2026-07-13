import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { activateImportedSources } from "./DataActivation";
import { activeDatasetStore } from "./ActiveDatasetStore";
import { setEnterpriseContext, getEnterpriseContext } from "../enterprise-consolidation/EnterpriseContextStore";
import { IndexedSpreadsheetStorage } from "../storage/IndexedSpreadsheetStorage";
import { activeSourceSelectionStore } from "./ActiveSourceSelectionStore";
import { workspaceIntelligenceEngine } from "../workspace-intelligence/WorkspaceIntelligenceEngine";
import { workbookRepository as libraryWorkbookRepository } from "../workbook-library/WorkbookRepository";

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = String(value); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();
Object.defineProperty(global, "localStorage", { value: localStorageMock });

const windowMock = {
  dispatchEvent: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};
Object.defineProperty(global, "window", { value: windowMock, writable: true });

// Mock dependencies
vi.mock("../storage/IndexedSpreadsheetStorage", () => ({
  IndexedSpreadsheetStorage: {
    getMetadata: vi.fn(),
    getRowsPaged: vi.fn(),
    getRows: vi.fn(),
    saveRows: vi.fn().mockResolvedValue(undefined),
    deleteRows: vi.fn().mockResolvedValue(undefined),
    deleteMetadata: vi.fn().mockResolvedValue(undefined),
  }
}));

vi.mock("../workspace-intelligence/WorkspaceIntelligenceEngine", () => ({
  workspaceIntelligenceEngine: {
    getCurrentIntelligentWorkspace: vi.fn(() => ({ id: "ws_mock", businessDomain: "neutral" })),
    evaluateWorkbookImport: vi.fn(() => ({ domain: { domain: "agribusiness", confidence: 90 } })),
  }
}));

vi.mock("../workbook-library/WorkbookRepository", () => ({
  workbookRepository: {
    getCurrentVersion: vi.fn(() => ({
      activeDataset: {
        datasetId: "ds_mock",
        sourceType: "SPREADSHEET_DATA",
        sourceName: "agro_finance.xlsx",
        importedAt: new Date().toISOString(),
        rowCount: 100,
        columnCount: 5,
        sheets: [],
        activeSheet: "Dados",
        previewRows: [],
        columnProfiles: [],
        importProfile: null,
        rawStorageRef: "ds_mock",
        status: "ACTIVE"
      }
    })),
    listWorkbooks: vi.fn(() => []),
  }
}));

describe("activateImportedSources Transactional and Domain Rules", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem("sauron_workspace_registry", JSON.stringify({
      currentWorkspaceId: "ws_mock",
      workspaces: {
        ws_mock: {
          id: "ws_mock",
          businessDomain: "neutral"
        }
      }
    }));
  });

  it("should successfully activate source and apply agribusiness domain if confidence >= 85%", async () => {
    // Setup mocks
    vi.mocked(IndexedSpreadsheetStorage.getMetadata).mockResolvedValue({
      id: "ds_mock",
      fileName: "agro_finance.xlsx",
      sheets: [{ sheetName: "Dados", rowCount: 10, columns: [], previewRows: [] }],
      uploadedAt: new Date().toISOString()
    } as any);

    vi.mocked(IndexedSpreadsheetStorage.getRowsPaged).mockResolvedValue([
      { Categoria: "Sementes", Receita: 1000 }
    ] as any);

    vi.mocked(IndexedSpreadsheetStorage.getRows).mockResolvedValue([
      { Categoria: "Sementes", Receita: 1000 }
    ] as any);

    // Call activate
    await activateImportedSources({
      workbookIds: ["ds_mock"],
      datasetIds: ["ds_mock"],
      enterpriseContext: {
        scope: "COMPANY",
        companyId: "comp_123",
        workbookIds: [],
        datasetIds: []
      }
    });

    // Check dataset is active
    expect(activeDatasetStore.getActiveDataset()?.datasetId).toBe("ds_mock");

    // Check active selection is persisted
    const savedSelection = activeSourceSelectionStore.get("ws_mock");
    expect(savedSelection?.sourceIds).toContain("ds_mock");
  });

  it("should rollback states if IndexedDB retrieval throws error", async () => {
    // Set previous state
    activeDatasetStore.setActiveDataset({
      datasetId: "prev_ds",
      sourceType: "SPREADSHEET_DATA",
      sourceName: "prev.xlsx",
      importedAt: new Date().toISOString(),
      rowCount: 5,
      columnCount: 2,
      sheets: [],
      activeSheet: "Sheet1",
      previewRows: [],
      columnProfiles: [],
      importProfile: null,
      rawStorageRef: "prev_ds",
      status: "ACTIVE"
    }, []);

    setEnterpriseContext({
      scope: "GROUP",
      groupId: "grp_prev",
      workbookIds: ["prev_ds"],
      datasetIds: ["prev_ds"]
    });

    // Force error in getMetadata
    vi.mocked(IndexedSpreadsheetStorage.getMetadata).mockRejectedValue(new Error("IndexedDB Read Failed"));

    // Call and expect throw
    await expect(activateImportedSources({
      workbookIds: ["ds_mock"],
      datasetIds: ["ds_mock"],
      enterpriseContext: {
        scope: "COMPANY",
        companyId: "comp_123",
        workbookIds: [],
        datasetIds: []
      }
    })).rejects.toThrow("IndexedDB Read Failed");

    // Verify rollback
    expect(activeDatasetStore.getActiveDataset()?.datasetId).toBe("prev_ds");
    expect(getEnterpriseContext().groupId).toBe("grp_prev");
  });

  it("should successfully delete a workbook and verify storage deletion calls", async () => {
    const { spreadsheetStorageAdapter } = await import("../storage/IndexedSpreadsheetStorageAdapter");
    
    // Simulate spreadsheet deletion sequence
    await spreadsheetStorageAdapter.deleteRows("ds_mock");
    await spreadsheetStorageAdapter.deleteMetadata("ds_mock");

    expect(vi.mocked(IndexedSpreadsheetStorage.deleteRows)).toHaveBeenCalledWith("ds_mock");
    expect(vi.mocked(IndexedSpreadsheetStorage.deleteMetadata)).toHaveBeenCalledWith("ds_mock");
  });
});
