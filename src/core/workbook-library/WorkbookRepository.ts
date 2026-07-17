import { ActiveDataset, SheetMetadata } from "../../types/dataSource";
import { assertCanonicalSourceId } from "../data/sourceIdentity";
import {
  Brand,
  BusinessUnit,
  CreateWorkbookInput,
  Organization,
  Store,
  Workbook,
  WorkbookComparison,
  WorkbookLifecycleStatus,
  WorkbookListOptions,
  WorkbookRepositoryState,
  WorkbookVersion,
} from "./WorkbookLibraryTypes";

const STORAGE_KEY = "sauron_workbook_repository_v1";
export const DEFAULT_WORKBOOK_PROJECT_ID = "default";

const emptyState = (): WorkbookRepositoryState => ({
  organizations: {},
  businessUnits: {},
  brands: {},
  stores: {},
  workbooks: {},
  versions: {},
  selectedWorkbookByProject: {},
});

const memoryState: WorkbookRepositoryState = emptyState();
const listeners = new Set<() => void>();
let fallbackIdCounter = 0;

function now(): string {
  return new Date().toISOString();
}

function createId(prefix: string): string {
  const unique = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}_${fallbackIdCounter++}`;
  return `${prefix}_${unique}`;
}

function cloneState(state: WorkbookRepositoryState): WorkbookRepositoryState {
  return JSON.parse(JSON.stringify(state));
}

function canUseLocalStorage(): boolean {
  try {
    return typeof localStorage !== "undefined";
  } catch {
    return false;
  }
}

function readState(): WorkbookRepositoryState {
  if (!canUseLocalStorage()) return cloneState(memoryState);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...emptyState(), ...JSON.parse(raw) } : emptyState();
  } catch {
    return emptyState();
  }
}

function replaceMemoryState(state: WorkbookRepositoryState): void {
  const next = cloneState(state);
  memoryState.organizations = next.organizations;
  memoryState.businessUnits = next.businessUnits;
  memoryState.brands = next.brands;
  memoryState.stores = next.stores;
  memoryState.workbooks = next.workbooks;
  memoryState.versions = next.versions;
  memoryState.selectedWorkbookByProject = next.selectedWorkbookByProject;
}

function writeState(state: WorkbookRepositoryState): void {
  replaceMemoryState(state);
  if (canUseLocalStorage()) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.warn("[WorkbookRepository] LocalStorage quota exceeded or storage unavailable. Falling back to session in-memory copy.", err);
    }
  }
  listeners.forEach(listener => listener());
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("SAURON_WORKBOOK_REPOSITORY_UPDATED"));
  }
}

function applyMutation<T>(mutate: (state: WorkbookRepositoryState) => T): T {
  const state = readState();
  const result = mutate(state);
  writeState(state);
  return result;
}

function getSheetCount(dataset: ActiveDataset): number {
  return dataset.sheets.length;
}

function getFormulaCount(dataset: ActiveDataset): number {
  const sheets = dataset.sheets as Array<string | SheetMetadata>;
  return sheets.reduce((sum, sheet) => sum + (typeof sheet === "string" ? 0 : sheet.formulaCount || 0), 0);
}

function normalizeProjectId(projectId?: string): string {
  return projectId?.trim() || DEFAULT_WORKBOOK_PROJECT_ID;
}

function latestVersionNumber(state: WorkbookRepositoryState, workbookId: string): number {
  return Object.values(state.versions)
    .filter(version => version.workbookId === workbookId)
    .reduce((max, version) => Math.max(max, version.versionNumber), 0);
}

export class WorkbookRepository {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  clear(): void {
    writeState(emptyState());
    if (canUseLocalStorage()) localStorage.removeItem(STORAGE_KEY);
  }

  createOrganization(input: { name: string }): Organization {
    return applyMutation(state => {
      const timestamp = now();
      const organization: Organization = {
        id: createId("org"),
        name: input.name,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      state.organizations[organization.id] = organization;
      return organization;
    });
  }

  listOrganizations(): Organization[] {
    return Object.values(readState().organizations).sort((a, b) => a.name.localeCompare(b.name));
  }

  updateOrganization(id: string, patch: Partial<Pick<Organization, "name">>): Organization {
    return applyMutation(state => {
      const current = state.organizations[id];
      if (!current) throw new Error(`Organization not found: ${id}`);
      state.organizations[id] = { ...current, ...patch, updatedAt: now() };
      return state.organizations[id];
    });
  }

  deleteOrganization(id: string): void {
    applyMutation(state => {
      delete state.organizations[id];
    });
  }

  createBusinessUnit(input: { organizationId: string; name: string }): BusinessUnit {
    return applyMutation(state => {
      const timestamp = now();
      const entity: BusinessUnit = { id: createId("bu"), organizationId: input.organizationId, name: input.name, createdAt: timestamp, updatedAt: timestamp };
      state.businessUnits[entity.id] = entity;
      return entity;
    });
  }

  listBusinessUnits(organizationId?: string): BusinessUnit[] {
    return Object.values(readState().businessUnits)
      .filter(unit => !organizationId || unit.organizationId === organizationId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  updateBusinessUnit(id: string, patch: Partial<Pick<BusinessUnit, "name" | "organizationId">>): BusinessUnit {
    return applyMutation(state => {
      const current = state.businessUnits[id];
      if (!current) throw new Error(`BusinessUnit not found: ${id}`);
      state.businessUnits[id] = { ...current, ...patch, updatedAt: now() };
      return state.businessUnits[id];
    });
  }

  deleteBusinessUnit(id: string): void {
    applyMutation(state => {
      delete state.businessUnits[id];
    });
  }

  createBrand(input: { organizationId: string; businessUnitId?: string; name: string }): Brand {
    return applyMutation(state => {
      const timestamp = now();
      const entity: Brand = { id: createId("brand"), organizationId: input.organizationId, businessUnitId: input.businessUnitId, name: input.name, createdAt: timestamp, updatedAt: timestamp };
      state.brands[entity.id] = entity;
      return entity;
    });
  }

  listBrands(organizationId?: string): Brand[] {
    return Object.values(readState().brands)
      .filter(brand => !organizationId || brand.organizationId === organizationId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  updateBrand(id: string, patch: Partial<Pick<Brand, "name" | "organizationId" | "businessUnitId">>): Brand {
    return applyMutation(state => {
      const current = state.brands[id];
      if (!current) throw new Error(`Brand not found: ${id}`);
      state.brands[id] = { ...current, ...patch, updatedAt: now() };
      return state.brands[id];
    });
  }

  deleteBrand(id: string): void {
    applyMutation(state => {
      delete state.brands[id];
    });
  }

  createStore(input: { organizationId: string; businessUnitId?: string; brandId?: string; name: string; code?: string }): Store {
    return applyMutation(state => {
      const timestamp = now();
      const entity: Store = { id: createId("store"), organizationId: input.organizationId, businessUnitId: input.businessUnitId, brandId: input.brandId, name: input.name, code: input.code, createdAt: timestamp, updatedAt: timestamp };
      state.stores[entity.id] = entity;
      return entity;
    });
  }

  listStores(organizationId?: string): Store[] {
    return Object.values(readState().stores)
      .filter(store => !organizationId || store.organizationId === organizationId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  updateStore(id: string, patch: Partial<Pick<Store, "name" | "code" | "organizationId" | "businessUnitId" | "brandId">>): Store {
    return applyMutation(state => {
      const current = state.stores[id];
      if (!current) throw new Error(`Store not found: ${id}`);
      state.stores[id] = { ...current, ...patch, updatedAt: now() };
      return state.stores[id];
    });
  }

  deleteStore(id: string): void {
    applyMutation(state => {
      delete state.stores[id];
    });
  }

  createWorkbook(input: CreateWorkbookInput): { workbook: Workbook; version: WorkbookVersion } {
    return applyMutation(state => {
      const timestamp = now();
      const workbookId = input.id ? assertCanonicalSourceId(input.id) : createId("workbook");
      const versionId = input.currentVersion.id || createId("version");
      const projectId = normalizeProjectId(input.projectId);
      const truncatedDataset = input.currentVersion.activeDataset 
        ? {
            ...input.currentVersion.activeDataset,
            previewRows: input.currentVersion.activeDataset.previewRows 
              ? input.currentVersion.activeDataset.previewRows.slice(0, 5) 
              : []
          }
        : undefined;

      const version: WorkbookVersion = {
        id: versionId,
        workbookId,
        versionNumber: 1,
        label: input.currentVersion.label || "v1",
        activeDataset: truncatedDataset as any,
        sourceName: input.currentVersion.sourceName,
        importedAt: input.currentVersion.importedAt,
        createdAt: timestamp,
        rowCount: input.currentVersion.rowCount,
        columnCount: input.currentVersion.columnCount,
        sheetCount: input.currentVersion.sheetCount,
        formulaCount: input.currentVersion.formulaCount,
        rawStorageRef: input.currentVersion.rawStorageRef,
      };
      const workbook: Workbook = {
        id: workbookId,
        projectId,
        organizationId: input.organizationId,
        businessUnitId: input.businessUnitId,
        brandId: input.brandId,
        storeId: input.storeId,
        name: input.name,
        sourceName: input.sourceName,
        status: "ACTIVE",
        currentVersionId: versionId,
        versionIds: [versionId],
        importedAt: input.currentVersion.importedAt,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      state.versions[versionId] = version;
      state.workbooks[workbookId] = workbook;
      state.selectedWorkbookByProject[projectId] = workbookId;
      return { workbook, version };
    });
  }

  createWorkbookFromActiveDataset(dataset: ActiveDataset, projectId = DEFAULT_WORKBOOK_PROJECT_ID): { workbook: Workbook; version: WorkbookVersion } {
    return this.createWorkbook({
      id: dataset.datasetId,
      projectId,
      name: dataset.sourceName,
      sourceName: dataset.sourceName,
      currentVersion: {
        id: `version_${dataset.datasetId}`,
        activeDataset: dataset,
        sourceName: dataset.sourceName,
        importedAt: dataset.importedAt,
        rowCount: dataset.rowCount,
        columnCount: dataset.columnCount,
        sheetCount: getSheetCount(dataset),
        formulaCount: getFormulaCount(dataset),
        rawStorageRef: dataset.rawStorageRef,
      },
    });
  }

  getWorkbook(id: string): Workbook | null {
    return readState().workbooks[id] || null;
  }

  listWorkbooks(options: WorkbookListOptions = {}): Workbook[] {
    const projectId = options.projectId ? normalizeProjectId(options.projectId) : null;
    return Object.values(readState().workbooks)
      .filter(workbook => !projectId || workbook.projectId === projectId)
      .filter(workbook => options.includeDeleted || workbook.status !== "DELETED")
      .filter(workbook => options.includeArchived || workbook.status !== "ARCHIVED")
      .sort((a, b) => b.importedAt.localeCompare(a.importedAt));
  }

  updateWorkbook(id: string, patch: Partial<Pick<Workbook, "name" | "organizationId" | "businessUnitId" | "brandId" | "storeId">>): Workbook {
    return applyMutation(state => {
      const current = state.workbooks[id];
      if (!current) throw new Error(`Workbook not found: ${id}`);
      state.workbooks[id] = { ...current, ...patch, updatedAt: now() };
      return state.workbooks[id];
    });
  }

  renameWorkbook(id: string, name: string): Workbook {
    return this.updateWorkbook(id, { name });
  }

  setWorkbookStatus(id: string, status: WorkbookLifecycleStatus): Workbook {
    return applyMutation(state => {
      const current = state.workbooks[id];
      if (!current) throw new Error(`Workbook not found: ${id}`);
      const timestamp = now();
      state.workbooks[id] = {
        ...current,
        status,
        updatedAt: timestamp,
        archivedAt: status === "ARCHIVED" ? timestamp : current.archivedAt,
        deletedAt: status === "DELETED" ? timestamp : current.deletedAt,
      };
      if (status === "DELETED" || status === "ARCHIVED") {
        Object.entries(state.selectedWorkbookByProject).forEach(([projectId, selectedId]) => {
          if (selectedId === id) delete state.selectedWorkbookByProject[projectId];
        });
      }
      return state.workbooks[id];
    });
  }

  archiveWorkbook(id: string): Workbook {
    return this.setWorkbookStatus(id, "ARCHIVED");
  }

  restoreWorkbook(id: string): Workbook {
    return this.setWorkbookStatus(id, "ACTIVE");
  }

  deleteWorkbook(id: string): Workbook {
    return this.setWorkbookStatus(id, "DELETED");
  }

  createWorkbookVersion(workbookId: string, dataset: ActiveDataset, label?: string): WorkbookVersion {
    return applyMutation(state => {
      const workbook = state.workbooks[workbookId];
      if (!workbook) throw new Error(`Workbook not found: ${workbookId}`);
      const versionNumber = latestVersionNumber(state, workbookId) + 1;
      const truncatedDataset = {
        ...dataset,
        previewRows: dataset.previewRows ? dataset.previewRows.slice(0, 5) : []
      };

      const version: WorkbookVersion = {
        id: createId("version"),
        workbookId,
        versionNumber,
        label: label || `v${versionNumber}`,
        activeDataset: truncatedDataset,
        sourceName: dataset.sourceName,
        importedAt: dataset.importedAt,
        createdAt: now(),
        rowCount: dataset.rowCount,
        columnCount: dataset.columnCount,
        sheetCount: getSheetCount(dataset),
        formulaCount: getFormulaCount(dataset),
        rawStorageRef: dataset.rawStorageRef,
      };
      state.versions[version.id] = version;
      state.workbooks[workbookId] = {
        ...workbook,
        currentVersionId: version.id,
        versionIds: [...workbook.versionIds, version.id],
        sourceName: dataset.sourceName,
        importedAt: dataset.importedAt,
        updatedAt: now(),
      };
      return version;
    });
  }

  getWorkbookVersion(versionId: string): WorkbookVersion | null {
    return readState().versions[versionId] || null;
  }

  getCurrentVersion(workbookId: string): WorkbookVersion | null {
    const state = readState();
    const workbook = state.workbooks[workbookId];
    return workbook ? state.versions[workbook.currentVersionId] || null : null;
  }

  listWorkbookVersions(workbookId: string): WorkbookVersion[] {
    return Object.values(readState().versions)
      .filter(version => version.workbookId === workbookId)
      .sort((a, b) => b.versionNumber - a.versionNumber);
  }

  selectWorkbook(workbookId: string, projectId?: string): ActiveDataset {
    return applyMutation(state => {
      const workbook = state.workbooks[workbookId];
      if (!workbook || workbook.status === "DELETED") throw new Error(`Workbook not available: ${workbookId}`);
      if (workbook.status === "ARCHIVED") {
        state.workbooks[workbookId] = { ...workbook, status: "ACTIVE", updatedAt: now() };
      }
      const resolvedProjectId = normalizeProjectId(projectId || workbook.projectId);
      state.selectedWorkbookByProject[resolvedProjectId] = workbookId;
      const version = state.versions[state.workbooks[workbookId].currentVersionId];
      if (!version) throw new Error(`Workbook version not found: ${workbook.currentVersionId}`);
      return version.activeDataset;
    });
  }

  getSelectedWorkbook(projectId = DEFAULT_WORKBOOK_PROJECT_ID): Workbook | null {
    const state = readState();
    const selectedId = state.selectedWorkbookByProject[normalizeProjectId(projectId)];
    return selectedId ? state.workbooks[selectedId] || null : null;
  }

  getSelectedActiveDataset(projectId = DEFAULT_WORKBOOK_PROJECT_ID): ActiveDataset | null {
    const state = readState();
    const selectedId = state.selectedWorkbookByProject[normalizeProjectId(projectId)];
    if (!selectedId) return null;
    const workbook = state.workbooks[selectedId];
    if (!workbook || workbook.status === "DELETED") return null;
    return state.versions[workbook.currentVersionId]?.activeDataset || null;
  }

  compareWorkbooks(leftWorkbookId: string, rightWorkbookId: string): WorkbookComparison {
    const state = readState();
    const left = state.workbooks[leftWorkbookId];
    const right = state.workbooks[rightWorkbookId];
    if (!left || !right) throw new Error("Workbooks para comparação não encontrados.");
    const leftVersion = state.versions[left.currentVersionId];
    const rightVersion = state.versions[right.currentVersionId];
    if (!leftVersion || !rightVersion) throw new Error("Versões atuais não encontradas para comparação.");
    return {
      left,
      right,
      leftVersion,
      rightVersion,
      deltas: {
        rows: rightVersion.rowCount - leftVersion.rowCount,
        columns: rightVersion.columnCount - leftVersion.columnCount,
        sheets: rightVersion.sheetCount - leftVersion.sheetCount,
        formulas: rightVersion.formulaCount - leftVersion.formulaCount,
      },
    };
  }
}

export const workbookRepository = new WorkbookRepository();
