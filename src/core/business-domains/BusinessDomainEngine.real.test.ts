import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { workbookEngine } from "../workbook/WorkbookEngine";
import { businessDomainEngine } from "./BusinessDomainEngine";
import "./index";

function createMockAgroWorkbook(): ArrayBuffer {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet([
    ["Fazenda", "Talhão", "Safra", "Produtividade", "Receita"],
    ["Fazenda Estrela", "Talhão A", "Safra 2026", 80, 50000],
    ["Fazenda Estrela", "Talhão B", "Safra 2026", 90, 60000]
  ]);
  worksheet["!ref"] = "A1:E3";
  XLSX.utils.book_append_sheet(workbook, worksheet, "Dados Safra");
  return XLSX.write(workbook, { type: "array", bookType: "xlsx" });
}

function createMockRetailWorkbook(): ArrayBuffer {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet([
    ["Loja", "PDV", "Caixa", "SKU", "Ticket"],
    ["Loja Centro", "PDV 1", "Operador A", "SKU-999", 150],
    ["Loja Centro", "PDV 2", "Operador B", "SKU-888", 220]
  ]);
  worksheet["!ref"] = "A1:E3";
  XLSX.utils.book_append_sheet(workbook, worksheet, "Dados Vendas");
  return XLSX.write(workbook, { type: "array", bookType: "xlsx" });
}

describe("BusinessDomainEngine Real Integration Tests", () => {
  it("detects agribusiness from an actual cataloged workbook structure", async () => {
    const buffer = createMockAgroWorkbook();
    const catalog = await workbookEngine.catalogArrayBuffer(buffer, {
      sourceName: "safra_milho.xlsx"
    });

    const domain = businessDomainEngine.detectDomain(catalog);
    expect(domain).toBe("agribusiness");

    const subdomain = businessDomainEngine.detectSubDomain(catalog);
    expect(subdomain).toBe("safra");
  });

  it("detects retail from an actual cataloged workbook structure", async () => {
    const buffer = createMockRetailWorkbook();
    const catalog = await workbookEngine.catalogArrayBuffer(buffer, {
      sourceName: "relatorio_varejo.xlsx"
    });

    const domain = businessDomainEngine.detectDomain(catalog);
    expect(domain).toBe("retail");
  });
});
