/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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

export class WorkbookDisplayAdapter {
  public static toSafeDisplay(wb: any): SafeWorkbookDisplay {
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

    // Adapt sheets with full safe defaults
    const rawSheets = Array.isArray(wb.sheets) ? wb.sheets : [];
    const safeSheets = rawSheets.map((s: any) => ({
      sheetName: typeof s?.sheetName === "string" ? s.sheetName : "Dados",
      rowCount: typeof s?.rowCount === "number" ? s.rowCount : 0,
      columnCount: typeof s?.columnCount === "number" ? s.columnCount : 0
    }));

    // Row, column and sheet count computation
    const sheetCount = safeSheets.length;
    let rowCount = typeof wb.rowCount === "number" ? wb.rowCount : 0;
    if (rowCount === 0 && safeSheets.length > 0) {
      rowCount = safeSheets[0].rowCount;
    }
    let columnCount = typeof wb.columnCount === "number" ? wb.columnCount : 0;
    if (columnCount === 0 && safeSheets.length > 0) {
      columnCount = safeSheets[0].columnCount;
    }

    // Size formatting
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

    // Date formatting
    const rawImportedAt = wb.importedAt || wb.createdAt || wb.metadata?.importedAt;
    let displayImportedAt = "Indisponível";
    if (rawImportedAt) {
      try {
        const d = new Date(rawImportedAt);
        if (!isNaN(d.getTime())) {
          displayImportedAt = d.toLocaleString("pt-BR");
        }
      } catch {}
    }

    const rawUpdatedAt = wb.updatedAt || wb.metadata?.updatedAt;
    let displayUpdatedAt = "Indisponível";
    if (rawUpdatedAt) {
      try {
        const d = new Date(rawUpdatedAt);
        if (!isNaN(d.getTime())) {
          displayUpdatedAt = d.toLocaleString("pt-BR");
        }
      } catch {}
    }

    // Company and Domain mapping
    const displayCompany = wb.companyName || wb.companyId || "Sem Empresa";
    const displayDomain = wb.domain || "Geral";

    const previewRows = Array.isArray(wb.previewRows) ? wb.previewRows : [];

    return {
      id: typeof wb.id === "string" ? wb.id : "",
      name: typeof wb.name === "string" ? wb.name : (typeof wb.fileName === "string" ? wb.fileName : "Arquivo Sem Nome"),
      sourceName: typeof wb.sourceName === "string" ? wb.sourceName : "Desconhecido",
      status: typeof wb.status === "string" ? wb.status : "ACTIVE",
      displayRowCount: rowCount,
      displayColumnCount: columnCount,
      displaySheetCount: sheetCount,
      displaySize,
      displayImportedAt,
      displayUpdatedAt,
      displayCompany,
      displayDomain,
      previewRows,
      sheets: safeSheets
    };
  }
}
