import { ActiveDataset } from "../../types/dataSource";

export type WorkbookLifecycleStatus = "ACTIVE" | "ARCHIVED" | "DELETED";

export interface Organization {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessUnit {
  id: string;
  organizationId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Brand {
  id: string;
  organizationId: string;
  businessUnitId?: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Store {
  id: string;
  organizationId: string;
  businessUnitId?: string;
  brandId?: string;
  name: string;
  code?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Workbook {
  id: string;
  projectId: string;
  organizationId?: string;
  businessUnitId?: string;
  brandId?: string;
  storeId?: string;
  name: string;
  sourceName: string;
  status: WorkbookLifecycleStatus;
  currentVersionId: string;
  versionIds: string[];
  importedAt: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
  deletedAt?: string;
}

export interface WorkbookVersion {
  id: string;
  workbookId: string;
  versionNumber: number;
  label: string;
  activeDataset: ActiveDataset;
  sourceName: string;
  importedAt: string;
  createdAt: string;
  rowCount: number;
  columnCount: number;
  sheetCount: number;
  formulaCount: number;
  rawStorageRef: string;
}

export interface WorkbookRepositoryState {
  organizations: Record<string, Organization>;
  businessUnits: Record<string, BusinessUnit>;
  brands: Record<string, Brand>;
  stores: Record<string, Store>;
  workbooks: Record<string, Workbook>;
  versions: Record<string, WorkbookVersion>;
  selectedWorkbookByProject: Record<string, string>;
}

export interface CreateWorkbookInput {
  id?: string;
  projectId?: string;
  name: string;
  sourceName: string;
  currentVersion: Omit<WorkbookVersion, "id" | "workbookId" | "versionNumber" | "label" | "createdAt"> & {
    id?: string;
    label?: string;
  };
  organizationId?: string;
  businessUnitId?: string;
  brandId?: string;
  storeId?: string;
}

export interface WorkbookListOptions {
  projectId?: string;
  includeArchived?: boolean;
  includeDeleted?: boolean;
}

export interface WorkbookComparison {
  left: Workbook;
  right: Workbook;
  leftVersion: WorkbookVersion;
  rightVersion: WorkbookVersion;
  deltas: {
    rows: number;
    columns: number;
    sheets: number;
    formulas: number;
  };
}
