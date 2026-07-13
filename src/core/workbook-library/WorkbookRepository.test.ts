import { beforeEach, describe, expect, it } from "vitest";
import { ActiveDataset } from "../../types/dataSource";
import { DEFAULT_WORKBOOK_PROJECT_ID, WorkbookRepository } from "./WorkbookRepository";

const makeDataset = (index: number, sourceName = `Workbook ${index}.xlsx`): ActiveDataset => ({
  datasetId: `dataset_${index}`,
  sourceType: "SPREADSHEET_DATA",
  sourceName,
  importedAt: `2026-01-${String(index + 1).padStart(2, "0")}T00:00:00.000Z`,
  rowCount: 100 + index,
  columnCount: 10 + index,
  sheets: [
    {
      sheetName: "IMP_VENDAS",
      rowCount: 100 + index,
      columnCount: 10 + index,
      formulaCount: index,
      storageRef: `dataset_${index}`,
      classification: "Base de dados",
      selectedForImport: true,
    },
  ],
  activeSheet: "IMP_VENDAS",
  previewRows: [
    {
      raw: { Produto: `Item ${index}`, Valor: index * 10 },
      normalized: { Produto: `Item ${index}`, Valor: index * 10 },
      metadata: {
        rowIndex: 1,
        sheetName: "IMP_VENDAS",
        fileName: sourceName,
      },
    },
  ],
  columnProfiles: [],
  importProfile: null,
  rawStorageRef: `dataset_${index}`,
  status: "ACTIVE",
});

describe("WorkbookRepository", () => {
  let repository: WorkbookRepository;

  beforeEach(() => {
    repository = new WorkbookRepository();
    repository.clear();
  });

  it("persists every import as a new workbook without replacing previous workbooks", () => {
    const created = Array.from({ length: 10 }, (_, index) =>
      repository.createWorkbookFromActiveDataset(makeDataset(index, "Honda.xlsx"))
    );

    const workbooks = repository.listWorkbooks({ includeArchived: true, includeDeleted: true });
    const versions = workbooks.flatMap(workbook => repository.listWorkbookVersions(workbook.id));

    expect(workbooks).toHaveLength(10);
    expect(new Set(workbooks.map(workbook => workbook.id)).size).toBe(10);
    expect(new Set(created.map(entry => entry.version.id)).size).toBe(10);
    expect(versions).toHaveLength(10);
    expect(workbooks.every(workbook => workbook.sourceName === "Honda.xlsx")).toBe(true);
    expect(repository.getSelectedActiveDataset()?.datasetId).toBe("dataset_9");
  });

  it("supports selecting, renaming, archiving, restoring, deleting and comparing workbooks", () => {
    const first = repository.createWorkbookFromActiveDataset(makeDataset(1, "Jan.xlsx")).workbook;
    const second = repository.createWorkbookFromActiveDataset(makeDataset(2, "Fev.xlsx")).workbook;

    repository.renameWorkbook(first.id, "Janeiro Honda");
    expect(repository.getWorkbook(first.id)?.name).toBe("Janeiro Honda");

    const selectedDataset = repository.selectWorkbook(first.id, DEFAULT_WORKBOOK_PROJECT_ID);
    expect(selectedDataset.sourceName).toBe("Jan.xlsx");
    expect(repository.getSelectedWorkbook()?.id).toBe(first.id);

    const comparison = repository.compareWorkbooks(first.id, second.id);
    expect(comparison.deltas.rows).toBe(1);
    expect(comparison.deltas.columns).toBe(1);

    repository.archiveWorkbook(first.id);
    expect(repository.getWorkbook(first.id)?.status).toBe("ARCHIVED");
    expect(repository.getSelectedWorkbook()).toBeNull();
    expect(repository.listWorkbooks().map(workbook => workbook.id)).not.toContain(first.id);

    repository.restoreWorkbook(first.id);
    expect(repository.getWorkbook(first.id)?.status).toBe("ACTIVE");

    repository.deleteWorkbook(second.id);
    expect(repository.getWorkbook(second.id)?.status).toBe("DELETED");
    expect(repository.listWorkbooks({ includeArchived: true }).map(workbook => workbook.id)).not.toContain(second.id);
  });

  it("keeps organization, business unit, brand and store CRUD independent from workbook selection", () => {
    const organization = repository.createOrganization({ name: "Honda" });
    const businessUnit = repository.createBusinessUnit({ organizationId: organization.id, name: "Peças" });
    const brand = repository.createBrand({ organizationId: organization.id, businessUnitId: businessUnit.id, name: "Honda Faberge" });
    const store = repository.createStore({ organizationId: organization.id, businessUnitId: businessUnit.id, brandId: brand.id, name: "Mogi" });
    const workbook = repository.createWorkbook({
      projectId: "project_1",
      organizationId: organization.id,
      businessUnitId: businessUnit.id,
      brandId: brand.id,
      storeId: store.id,
      name: "Workbook associado",
      sourceName: "associado.xlsx",
      currentVersion: {
        activeDataset: makeDataset(3, "associado.xlsx"),
        sourceName: "associado.xlsx",
        importedAt: "2026-01-04T00:00:00.000Z",
        rowCount: 103,
        columnCount: 13,
        sheetCount: 1,
        formulaCount: 3,
        rawStorageRef: "dataset_3",
      },
    }).workbook;

    expect(repository.listOrganizations()).toHaveLength(1);
    expect(repository.listBusinessUnits(organization.id)).toHaveLength(1);
    expect(repository.listBrands(organization.id)).toHaveLength(1);
    expect(repository.listStores(organization.id)).toHaveLength(1);
    expect(workbook.organizationId).toBe(organization.id);

    repository.updateOrganization(organization.id, { name: "Honda Atualizada" });
    repository.updateBusinessUnit(businessUnit.id, { name: "Pós-venda" });
    repository.updateBrand(brand.id, { name: "Honda Peças" });
    repository.updateStore(store.id, { code: "MDO" });

    expect(repository.listOrganizations()[0].name).toBe("Honda Atualizada");
    expect(repository.listBusinessUnits(organization.id)[0].name).toBe("Pós-venda");
    expect(repository.listBrands(organization.id)[0].name).toBe("Honda Peças");
    expect(repository.listStores(organization.id)[0].code).toBe("MDO");
    expect(repository.getSelectedWorkbook("project_1")?.id).toBe(workbook.id);
  });
});
