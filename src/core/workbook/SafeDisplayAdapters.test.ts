/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from "vitest";
import { SafeDisplayAdapters } from "./SafeDisplayAdapters";
import { formatNumberSafe, formatCurrencySafe, formatDateSafe, formatPercentageSafe, safeArray, safeObject } from "../../utils/safeFormatters";

describe("SafeDisplayAdapters and safeFormatters unit tests", () => {
  // 1. safeFormatters
  it("formats numbers safely without crash", () => {
    expect(formatNumberSafe(1234.56)).toBe("1.234,56");
    expect(formatNumberSafe(undefined)).toBe("0");
    expect(formatNumberSafe(null)).toBe("0");
    expect(formatNumberSafe(NaN)).toBe("0");
  });

  it("formats currency safely", () => {
    expect(formatCurrencySafe(1500.5)).toContain("1.500,50");
    expect(formatCurrencySafe(undefined)).toContain("0,00");
  });

  it("formats dates safely with ISO formats", () => {
    expect(formatDateSafe("2026-07-12T18:00:00Z")).toBe("12/07/2026");
    expect(formatDateSafe(undefined)).toBe("Indisponível");
  });

  it("formats percentages safely", () => {
    expect(formatPercentageSafe(0.125)).toBe("12.5%");
    expect(formatPercentageSafe(null)).toBe("0%");
  });

  it("returns safe arrays and objects", () => {
    expect(safeArray(null)).toEqual([]);
    expect(safeArray([1, 2])).toEqual([1, 2]);
    expect(safeObject(null)).toEqual({});
    expect(safeObject({ x: 1 })).toEqual({ x: 1 });
  });

  // 2. SafeDisplayAdapters.toSafeWorkbook
  it("converts corrupted workbook safely with neutral defaults", () => {
    const raw = {
      id: "wb_1",
      fileName: "Comercial.xlsx",
      sheets: [
        { sheetName: "Faturamento", rowCount: 150 }
      ]
    };
    const adapted = SafeDisplayAdapters.toSafeWorkbook(raw);
    expect(adapted.id).toBe("wb_1");
    expect(adapted.name).toBe("Comercial.xlsx");
    expect(adapted.displayRowCount).toBe(150);
    expect(adapted.displayColumnCount).toBe(0);
    expect(adapted.displaySheetCount).toBe(1);
    expect(adapted.displaySize).toBe("0 KB");
  });

  // 3. SafeDisplayAdapters.toSafeDataset
  it("converts corrupted active dataset safely", () => {
    const raw = {
      datasetId: "ds_99",
      sourceName: "Faturamento Nissan",
      sheets: [
        { sheetName: "Nissan", rows: [{}, {}] }
      ]
    };
    const adapted = SafeDisplayAdapters.toSafeDataset(raw);
    expect(adapted.datasetId).toBe("ds_99");
    expect(adapted.sourceName).toBe("Faturamento Nissan");
    expect(adapted.displayRowCount).toBe(2);
    expect(adapted.displayColumnCount).toBe(0);
  });
});
