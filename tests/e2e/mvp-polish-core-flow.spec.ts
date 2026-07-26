import { expect, ensureConsultantSession, navigateSidebar, test } from "./e2eTest";
import * as fs from "node:fs";
import * as XLSX from "xlsx";

function writeWorkbook(filePath: string): void {
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet([
    ["Empresa", "Data", "Cliente", "Produto", "Valor", "Quantidade", "Observação"],
    ["Empresa Polish", "2026-02-01", "Cliente A", "Produto A", 120, 1, "Primeiro registro"],
    ["Empresa Polish", "2026-02-02", "Cliente B", "Produto B", 180, 2, "Segundo registro"],
  ]);
  XLSX.utils.book_append_sheet(workbook, sheet, "Dados");
  XLSX.writeFile(workbook, filePath);
}

test.describe("MVP Polish core flow", () => {
  test("mantém o fluxo data-first sem inferência imposta e persiste a escolha", async ({ page }, testInfo) => {
    test.setTimeout(180000);
    const filePath = testInfo.outputPath("mvp-polish.xlsx");
    writeWorkbook(filePath);

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.evaluate(async () => {
      localStorage.clear();
      sessionStorage.clear();
      await new Promise<void>(resolve => {
        const request = indexedDB.deleteDatabase("SauronSpreadsheetDB");
        request.onsuccess = () => resolve();
        request.onerror = () => resolve();
        request.onblocked = () => resolve();
      });
    });
    await page.reload({ waitUntil: "domcontentloaded" });
    await ensureConsultantSession(page);

    await navigateSidebar(page, /Conectar Dados/i, /Importar Planilhas/i);
    await page.getByRole("button", { name: /^Importar Planilha$/i }).first().click();
    const importer = page.locator("#simple-spreadsheet-importer");
    await expect(importer).toBeVisible({ timeout: 15000 });
    await importer.locator("input[type='file']").first().setInputFiles(filePath);
    await expect(importer.getByText(/Pronto para (importar|configurar)/i).first()).toBeVisible({ timeout: 30000 });
    await importer.locator("#btn-importar-todos").click();
    await expect(importer).toHaveCount(0, { timeout: 30000 });

    await navigateSidebar(page, /Diagnosticar Negócio/i, /Diagnóstico Executivo/i);
    const panel = page.getByTestId("active-dataset-raw-preview");
    await expect(panel).toBeVisible({ timeout: 30000 });
    for (const column of ["Empresa", "Data", "Cliente", "Produto", "Valor", "Quantidade", "Observação"]) {
      await expect(panel.getByText(column, { exact: true }).first()).toBeVisible();
    }
    await expect(panel).toContainText("Produto A");
    await expect(panel).toContainText("120");
    await expect(panel).toContainText("180");

    await page.reload({ waitUntil: "domcontentloaded" });
    await ensureConsultantSession(page);
    await navigateSidebar(page, /Diagnosticar Negócio/i, /Diagnóstico Executivo/i);
    const reloadedPanel = page.getByTestId("active-dataset-raw-preview");
    await expect(reloadedPanel).toBeVisible({ timeout: 30000 });
    await expect(reloadedPanel).toContainText("Produto A");
    await expect(reloadedPanel).toContainText("120");
    await expect(reloadedPanel).toContainText("180");
    await expect(page.locator("body")).not.toContainText(/Grupo Alpha|Topázio|DEMO_DATA|MOCK DATA/i);

    fs.unlinkSync(filePath);
  });
});
