import { beforeEach, describe, expect, it, vi } from "vitest";
import { ActiveDataset } from "../../types/dataSource";
import { activeDatasetStore } from "./ActiveDatasetStore";
import { saveModuleMapping } from "./moduleMapping";
import { buildSellerStatement } from "./sellerStatement";

const storageMock = vi.hoisted(() => {
  const sheetRows = new Map<string, any[]>();
  return {
    sheetRows,
    getRowsPaged: vi.fn(async (fileId: string, sheetName: string, offset: number, limit: number) => {
      return (sheetRows.get(`${fileId}::${sheetName}`) || []).slice(offset, offset + limit);
    }),
  };
});

vi.mock("../storage/IndexedSpreadsheetStorage", () => ({
  IndexedSpreadsheetStorage: {
    getRowsPaged: storageMock.getRowsPaged,
  },
}));

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

function createDataset(): ActiveDataset {
  return {
    datasetId: "dataset-1",
    sourceType: "SPREADSHEET_DATA",
    sourceName: "planilha-real.xlsx",
    importedAt: "2026-07-07T00:00:00.000Z",
    rowCount: 4,
    columnCount: 8,
    sheets: [
      {
        sheetName: "Pessoas",
        rowCount: 2,
        columnCount: 5,
        formulaCount: 0,
        storageRef: "dataset-1",
        classification: "Cadastro",
        selectedForImport: true,
      },
      {
        sheetName: "Comissão",
        rowCount: 2,
        columnCount: 4,
        formulaCount: 0,
        storageRef: "dataset-1",
        classification: "Base de dados",
        selectedForImport: true,
      },
    ],
    activeSheet: "Pessoas",
    previewRows: [],
    columnProfiles: [],
    importProfile: null,
    rawStorageRef: "dataset-1",
    status: "ACTIVE",
  };
}

describe("sellerStatement", () => {
  const localStorageMock = createLocalStorageMock();

  beforeEach(() => {
    localStorageMock.clear();
    vi.stubGlobal("localStorage", localStorageMock);
    vi.stubGlobal("indexedDB", {});
    storageMock.sheetRows.clear();
    storageMock.getRowsPaged.mockClear();
    activeDatasetStore.setActiveDataset(createDataset());

    storageMock.sheetRows.set("dataset-1::Pessoas", [
      { Nome: "Maria Souza", CPF: "123", Matricula: "M-1", Setor: "Peças", Loja: "Mogi" },
      { Nome: "Ana Lima", CPF: "456", Matricula: "M-2", Setor: "Oficina", Loja: "Mogi" },
    ]);
    storageMock.sheetRows.set("dataset-1::Comissão", [
      { Vendedor: "Maria Souza", Base: 1000, Comissao: 100, Data: "01/07/2026" },
      { Vendedor: "Maria Souza", Base: 500, Comissao: 50, Data: "05/07/2026" },
    ]);
  });

  it("builds a seller statement from real mapped people and commission rows", async () => {
    saveModuleMapping({
      datasetId: "dataset-1",
      moduleName: "Pessoas",
      sheetName: "Pessoas",
      selectedColumns: ["Nome", "CPF", "Matricula", "Setor", "Loja"],
      semanticRoles: {
        name: "Nome",
        cpf: "CPF",
        registration: "Matricula",
        department: "Setor",
        store: "Loja",
      },
    });
    saveModuleMapping({
      datasetId: "dataset-1",
      moduleName: "Comissão",
      sheetName: "Comissão",
      selectedColumns: ["Vendedor", "Base", "Comissao", "Data"],
      semanticRoles: {
        seller: "Vendedor",
        base: "Base",
        amount: "Comissao",
        date: "Data",
      },
    });

    const statement = await buildSellerStatement({ sellerName: "Maria Souza", managerName: "Gerente Real" });

    expect(statement.sellerName).toBe("Maria Souza");
    expect(statement.cpf).toBe("123");
    expect(statement.registration).toBe("M-1");
    expect(statement.department).toBe("Peças");
    expect(statement.store).toBe("Mogi");
    expect(statement.totalSold).toBe(1500);
    expect(statement.recordCount).toBe(2);
    expect(statement.commission).toMatchObject({ configured: true, value: 150, calculation: "amount_column" });
    expect(statement.source.fileName).toBe("planilha-real.xlsx");
    expect(statement.source.columnsUsed).toEqual(expect.arrayContaining(["Nome", "Base", "Comissao"]));
  });

  it("does not invent commission when commission mapping is missing", async () => {
    saveModuleMapping({
      datasetId: "dataset-1",
      moduleName: "Pessoas",
      sheetName: "Pessoas",
      selectedColumns: ["Nome", "CPF"],
      semanticRoles: {
        name: "Nome",
        cpf: "CPF",
      },
    });

    const statement = await buildSellerStatement({ sellerName: "Maria Souza" });

    expect(statement.commission.configured).toBe(false);
    expect(statement.commission.value).toBeNull();
    expect(statement.commission.message).toBe("Comissão não configurada");
    expect(statement.observations.join(" ")).toContain("Comissão não configurada");
  });
});

