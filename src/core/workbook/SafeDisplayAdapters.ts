/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { formatDateTimeSafe } from "../../utils/safeFormatters";

export interface SafeWorkbookDisplay {
  id: string;
  name: string;
  sourceName: string;
  status: string;
  displayRowCount: number;
  displayColumnCount: number;
  displaySheetCount: number;
  displaySize: string;
  displayImportedAt: string;
  displayUpdatedAt: string;
  displayCompany: string;
  displayDomain: string;
  previewRows: any[];
  sheets: {
    sheetName: string;
    rowCount: number;
    columnCount: number;
  }[];
}

export interface SafeDatasetDisplay {
  datasetId: string;
  sourceName: string;
  importedAt: string;
  importedBy: string;
  status: string;
  displayRowCount: number;
  displayColumnCount: number;
  displaySheetCount: number;
  sheets: {
    id: string;
    sheetName: string;
    rowCount: number;
    columnCount: number;
    rows: any[];
  }[];
  previewRows: any[];
  columnProfiles: {
    name: string;
    isDRE: boolean;
    isKPI: boolean;
  }[];
}

export interface SafeCompanyDisplay {
  id: string;
  name: string;
  parentId: string;
  type: string;
  segment: string;
  cnpj: string;
  notes: string;
  unitIds: string[];
  workbookIds: string[];
  contacts: any[];
}

export interface SafeUnitDisplay {
  id: string;
  name: string;
  parentId: string;
  type: string;
  segment: string;
  cnpj: string;
  notes: string;
  workbookIds: string[];
  contacts: any[];
}

export interface SafeWorkspaceDisplay {
  id: string;
  name: string;
  organizationId: string;
  clientId: string;
  companies: string[];
  brands: string[];
  stores: string[];
  costCenters: string[];
  allowedUsers: string[];
  allowedTeams: string[];
  dataSources: any[];
}

export class SafeDisplayAdapters {
  public static toSafeWorkbook(wb: any): SafeWorkbookDisplay {
    if (!wb) {
      return {
        id: "",
        name: "Arquivo Sem Nome",
        sourceName: "Desconhecido",
        status: "INACTIVE",
        displayRowCount: 0,
        displayColumnCount: 0,
        displaySheetCount: 0,
        displaySize: "0 KB",
        displayImportedAt: "Indisponível",
        displayUpdatedAt: "Indisponível",
        displayCompany: "Sem Empresa",
        displayDomain: "Geral",
        previewRows: [],
        sheets: []
      };
    }

    const rawSheets = Array.isArray(wb.sheets) ? wb.sheets : [];
    const safeSheets = rawSheets.map((s: any) => ({
      sheetName: typeof s?.sheetName === "string" ? s.sheetName : "Dados",
      rowCount: typeof s?.rowCount === "number" ? s.rowCount : 0,
      columnCount: typeof s?.columnCount === "number" ? s.columnCount : 0
    }));

    const sheetCount = safeSheets.length;
    let rowCount = typeof wb.rowCount === "number" ? wb.rowCount : 0;
    if (rowCount === 0 && safeSheets.length > 0) {
      rowCount = safeSheets[0].rowCount;
    }
    let columnCount = typeof wb.columnCount === "number" ? wb.columnCount : 0;
    if (columnCount === 0 && safeSheets.length > 0) {
      columnCount = safeSheets[0].columnCount;
    }

    let displaySize = "0 KB";
    const rawSize = wb.metadata?.size || wb.size;
    if (typeof rawSize === "number") {
      if (rawSize >= 1024 * 1024) {
        displaySize = `${(rawSize / (1024 * 1024)).toFixed(1)} MB`;
      } else {
        displaySize = `${(rawSize / 1024).toFixed(1)} KB`;
      }
    } else if (typeof rawSize === "string") {
      displaySize = rawSize;
    }

    const importedAt = wb.importedAt || wb.createdAt || wb.metadata?.importedAt;
    const updatedAt = wb.updatedAt || wb.metadata?.updatedAt;

    return {
      id: typeof wb.id === "string" ? wb.id : "",
      name: typeof wb.name === "string" ? wb.name : (typeof wb.fileName === "string" ? wb.fileName : "Arquivo Sem Nome"),
      sourceName: typeof wb.sourceName === "string" ? wb.sourceName : "Desconhecido",
      status: typeof wb.status === "string" ? wb.status : "ACTIVE",
      displayRowCount: rowCount,
      displayColumnCount: columnCount,
      displaySheetCount: sheetCount,
      displaySize,
      displayImportedAt: formatDateTimeSafe(importedAt),
      displayUpdatedAt: formatDateTimeSafe(updatedAt),
      displayCompany: wb.companyName || wb.companyId || "Sem Empresa",
      displayDomain: wb.domain || "Geral",
      previewRows: Array.isArray(wb.previewRows) ? wb.previewRows : [],
      sheets: safeSheets
    };
  }

  public static toSafeDataset(ds: any): SafeDatasetDisplay {
    if (!ds) {
      return {
        datasetId: "",
        sourceName: "Nenhum Dataset Ativo",
        importedAt: "Indisponível",
        importedBy: "Sistema",
        status: "INACTIVE",
        displayRowCount: 0,
        displayColumnCount: 0,
        displaySheetCount: 0,
        sheets: [],
        previewRows: [],
        columnProfiles: []
      };
    }

    const rawSheets = Array.isArray(ds.sheets) ? ds.sheets : [];
    const safeSheets = rawSheets.map((s: any) => ({
      id: typeof s?.id === "string" ? s.id : "s_default",
      sheetName: typeof s?.sheetName === "string" ? s.sheetName : "Dados",
      rowCount: typeof s?.rowCount === "number" ? s.rowCount : (Array.isArray(s?.rows) ? s.rows.length : 0),
      columnCount: typeof s?.columnCount === "number" ? s.columnCount : (Array.isArray(s?.columns) ? s.columns.length : 0),
      rows: Array.isArray(s?.rows) ? s.rows : []
    }));

    let totalRows = typeof ds.rowCount === "number" ? ds.rowCount : 0;
    if (totalRows === 0) {
      totalRows = safeSheets.reduce((sum, s) => sum + s.rowCount, 0);
    }
    let totalCols = typeof ds.columnCount === "number" ? ds.columnCount : 0;
    if (totalCols === 0 && safeSheets.length > 0) {
      totalCols = safeSheets[0].columnCount;
    }

    const rawProfiles = Array.isArray(ds.columnProfiles) ? ds.columnProfiles : [];
    const safeProfiles = rawProfiles.map((p: any) => ({
      name: typeof p?.name === "string" ? p.name : "",
      isDRE: !!p?.isDRE,
      isKPI: !!p?.isKPI
    }));

    return {
      datasetId: typeof ds.datasetId === "string" ? ds.datasetId : "",
      sourceName: typeof ds.sourceName === "string" ? ds.sourceName : "Desconhecido",
      importedAt: formatDateTimeSafe(ds.importedAt),
      importedBy: typeof ds.importedBy === "string" ? ds.importedBy : "Desconhecido",
      status: typeof ds.status === "string" ? ds.status : "ACTIVE",
      displayRowCount: totalRows,
      displayColumnCount: totalCols,
      displaySheetCount: safeSheets.length,
      sheets: safeSheets,
      previewRows: Array.isArray(ds.previewRows) ? ds.previewRows : [],
      columnProfiles: safeProfiles
    };
  }

  public static toSafeCompany(comp: any): SafeCompanyDisplay {
    if (!comp) {
      return {
        id: "",
        name: "Empresa Sem Nome",
        parentId: "group_default",
        type: "Empresa",
        segment: "Geral",
        cnpj: "",
        notes: "",
        unitIds: [],
        workbookIds: [],
        contacts: []
      };
    }
    return {
      id: typeof comp.id === "string" ? comp.id : "",
      name: typeof comp.name === "string" ? comp.name : "Empresa Sem Nome",
      parentId: typeof comp.parentId === "string" ? comp.parentId : "group_default",
      type: typeof comp.type === "string" ? comp.type : "Empresa",
      segment: typeof comp.segment === "string" ? comp.segment : "Geral",
      cnpj: typeof comp.cnpj === "string" ? comp.cnpj : "",
      notes: typeof comp.notes === "string" ? comp.notes : "",
      unitIds: Array.isArray(comp.unitIds) ? comp.unitIds : [],
      workbookIds: Array.isArray(comp.workbookIds) ? comp.workbookIds : [],
      contacts: Array.isArray(comp.contacts) ? comp.contacts : []
    };
  }

  public static toSafeUnit(unit: any): SafeUnitDisplay {
    if (!unit) {
      return {
        id: "",
        name: "Unidade Sem Nome",
        parentId: "",
        type: "Unidade",
        segment: "Geral",
        cnpj: "",
        notes: "",
        workbookIds: [],
        contacts: []
      };
    }
    return {
      id: typeof unit.id === "string" ? unit.id : "",
      name: typeof unit.name === "string" ? unit.name : "Unidade Sem Nome",
      parentId: typeof unit.parentId === "string" ? unit.parentId : "",
      type: typeof unit.type === "string" ? unit.type : "Unidade",
      segment: typeof unit.segment === "string" ? unit.segment : "Geral",
      cnpj: typeof unit.cnpj === "string" ? unit.cnpj : "",
      notes: typeof unit.notes === "string" ? unit.notes : "",
      workbookIds: Array.isArray(unit.workbookIds) ? unit.workbookIds : [],
      contacts: Array.isArray(unit.contacts) ? unit.contacts : []
    };
  }

  public static toSafeWorkspace(ws: any): SafeWorkspaceDisplay {
    if (!ws) {
      return {
        id: "",
        name: "Workspace Sem Nome",
        organizationId: "org_default",
        clientId: "",
        companies: [],
        brands: [],
        stores: [],
        costCenters: [],
        allowedUsers: [],
        allowedTeams: [],
        dataSources: []
      };
    }
    return {
      id: typeof ws.id === "string" ? ws.id : "",
      name: typeof ws.name === "string" ? ws.name : "Workspace Sem Nome",
      organizationId: typeof ws.organizationId === "string" ? ws.organizationId : "org_default",
      clientId: typeof ws.clientId === "string" ? ws.clientId : "",
      companies: Array.isArray(ws.companies) ? ws.companies : [],
      brands: Array.isArray(ws.brands) ? ws.brands : [],
      stores: Array.isArray(ws.stores) ? ws.stores : [],
      costCenters: Array.isArray(ws.costCenters) ? ws.costCenters : [],
      allowedUsers: Array.isArray(ws.allowedUsers) ? ws.allowedUsers : [],
      allowedTeams: Array.isArray(ws.allowedTeams) ? ws.allowedTeams : [],
      dataSources: Array.isArray(ws.dataSources) ? ws.dataSources : []
    };
  }
}
