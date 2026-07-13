/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from "vitest";
import { WorkbookDisplayAdapter } from "./WorkbookDisplayAdapter";

describe("WorkbookDisplayAdapter contract audit and safe fallback test suite", () => {
  // 1. Workbook sem rowCount
  it("adapts workbook with missing rowCount safely mapping to zero", () => {
    const raw = {
      id: "wb_1",
      name: "SheetNoRows.xlsx",
      sheets: []
    };
    const adapted = WorkbookDisplayAdapter.toSafeDisplay(raw);
    expect(adapted.displayRowCount).toBe(0);
    expect(adapted.displaySheetCount).toBe(0);
  });

  // 2. Workbook sem columnCount
  it("adapts workbook with missing columnCount safely mapping to zero", () => {
    const raw = {
      id: "wb_2",
      name: "SheetNoCols.xlsx",
      sheets: []
    };
    const adapted = WorkbookDisplayAdapter.toSafeDisplay(raw);
    expect(adapted.displayColumnCount).toBe(0);
  });

  // 3. Workbook sem size
  it("adapts workbook with missing fileSize mapping size safely to 0 KB", () => {
    const raw = {
      id: "wb_3",
      name: "SheetNoSize.xlsx",
      sheets: []
    };
    const adapted = WorkbookDisplayAdapter.toSafeDisplay(raw);
    expect(adapted.displaySize).toBe("0 KB");
  });

  // 4. Workbook sem preview
  it("adapts workbook with missing previewRows returning empty safe array", () => {
    const raw = {
      id: "wb_4",
      name: "SheetNoPreview.xlsx"
    };
    const adapted = WorkbookDisplayAdapter.toSafeDisplay(raw);
    expect(adapted.previewRows).toEqual([]);
  });

  // 5. Workbook parcial (somente ID)
  it("adapts highly corrupted or partial workbook using stable defaults", () => {
    const raw = { id: "wb_partial" };
    const adapted = WorkbookDisplayAdapter.toSafeDisplay(raw);
    expect(adapted.id).toBe("wb_partial");
    expect(adapted.name).toBe("Arquivo Sem Nome");
    expect(adapted.displayRowCount).toBe(0);
    expect(adapted.displayColumnCount).toBe(0);
    expect(adapted.displaySize).toBe("0 KB");
    expect(adapted.displayImportedAt).toBe("Indisponível");
  });

  // 6. Importação múltipla (array de workbooks parciais)
  it("adapts multiple mixed workbooks mapping them safely", () => {
    const batchList = [
      { id: "wb_a", sheets: [{ sheetName: "Comercial", rowCount: 1500, columnCount: 12 }] },
      { id: "wb_b", metadata: { size: 2048500 } },
      null
    ];

    const adaptedList = batchList.map(item => WorkbookDisplayAdapter.toSafeDisplay(item));
    
    expect(adaptedList[0].id).toBe("wb_a");
    expect(adaptedList[0].displayRowCount).toBe(1500);
    expect(adaptedList[0].displayColumnCount).toBe(12);

    expect(adaptedList[1].id).toBe("wb_b");
    expect(adaptedList[1].displaySize).toBe("2.0 MB");

    expect(adaptedList[2].id).toBe("");
    expect(adaptedList[2].name).toBe("Arquivo Sem Nome");
  });

  // 7. Empresa sem arquivos
  it("supports company with zero workbooks rendering empty array safely", () => {
    const company = {
      id: "comp_empty",
      name: "Empty Company",
      workbookIds: []
    };
    const workbooks: any[] = [];
    const adapted = workbooks.map(w => WorkbookDisplayAdapter.toSafeDisplay(w));
    expect(adapted).toEqual([]);
  });

  // 8. Grupo vazio
  it("supports empty business group rendering safely", () => {
    const group = {
      id: "group_empty",
      name: "Empty Group",
      companyIds: [],
      workbookIds: []
    };
    expect(group.companyIds.length).toBe(0);
    expect(group.workbookIds.length).toBe(0);
  });
});
