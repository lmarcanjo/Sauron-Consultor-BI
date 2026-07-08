import { beforeEach, describe, expect, it, vi } from "vitest";
import { getModuleMapping, listModuleMappings, saveModuleMapping } from "./moduleMapping";

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
  };
}

describe("moduleMapping", () => {
  const localStorageMock = createLocalStorageMock();

  beforeEach(() => {
    localStorageMock.clear();
    vi.stubGlobal("localStorage", localStorageMock);
  });

  it("persists mappings by dataset, project and module", () => {
    const commercial = saveModuleMapping({
      projectId: "project-1",
      datasetId: "dataset-1",
      moduleName: "Comercial",
      sheetName: "IMP_VENDAS",
      selectedColumns: ["Produto", "Vendedor", "Valor"],
      semanticRoles: {
        product: "Produto",
        seller: "Vendedor",
        value: "Valor",
      },
    });

    saveModuleMapping({
      projectId: "project-1",
      datasetId: "dataset-1",
      moduleName: "Pessoas",
      sheetName: "IMP_VENDEDORES",
      selectedColumns: ["Nome", "CPF"],
      semanticRoles: {
        name: "Nome",
        cpf: "CPF",
      },
    });

    expect(getModuleMapping("Comercial", "dataset-1", "project-1")).toMatchObject({
      moduleName: "Comercial",
      sheetName: "IMP_VENDAS",
      selectedColumns: ["Produto", "Vendedor", "Valor"],
      semanticRoles: { product: "Produto", seller: "Vendedor", value: "Valor" },
    });
    expect(getModuleMapping("Pessoas", "dataset-1", "project-1")?.sheetName).toBe("IMP_VENDEDORES");
    expect(getModuleMapping("Comercial", "dataset-2", "project-1")).toBeNull();
    expect(listModuleMappings("dataset-1", "project-1")).toHaveLength(2);
    expect(commercial.updatedAt).toBeTruthy();
  });
});

