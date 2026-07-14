import { beforeEach, describe, expect, it, vi } from "vitest";
import { WorkbookReadinessService } from "../../src/core/workbook-library/WorkbookReadinessService";
import { spreadsheetStorageAdapter } from "../../src/core/storage/IndexedSpreadsheetStorageAdapter";

vi.mock("../../src/core/storage/IndexedSpreadsheetStorageAdapter", () => ({
  spreadsheetStorageAdapter: {
    hasMetadata: vi.fn(),
    getRowCount: vi.fn(),
    hasRows: vi.fn(),
  },
}));

describe("WorkbookReadinessService", () => {
  const service = new WorkbookReadinessService();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(spreadsheetStorageAdapter.hasMetadata).mockResolvedValue(true);
    vi.mocked(spreadsheetStorageAdapter.getRowCount).mockResolvedValue(12);
    vi.mocked(spreadsheetStorageAdapter.hasRows).mockResolvedValue(true);
  });

  it("bloqueia ativação quando há vínculo e persistência, mas sem módulo habilitado", async () => {
    const vm = await service.evaluate({
      workbook: {
        id: "wb-1",
        projectId: "default",
        name: "Fonte Financeira",
        sourceName: "Fonte Financeira",
        status: "ACTIVE",
        currentVersionId: "v-1",
        versionIds: ["v-1"],
        importedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as any,
      linkedEnterpriseIds: ["company-1"],
      hasMappings: true,
      hasEnabledModules: false,
      hasPresentation: false,
      hasPersistentStorage: true,
      hasSelectedTabs: true,
      hasStorageError: false,
    } as any);

    expect(vm.status).toBe("PENDING_CONFIG");
    expect(vm.canActivate).toBe(false);
  });
});
