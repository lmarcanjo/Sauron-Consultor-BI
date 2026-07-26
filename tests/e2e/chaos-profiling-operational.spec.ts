import { createHash } from "node:crypto";
import * as fs from "node:fs";
import { expect, ensureConsultantSession, navigateSidebar, test } from "./e2eTest";

function excelColumnNames(lastColumn: string): string[] {
  const result: string[] = [];
  let value = 1;
  while (true) {
    let current = value;
    let name = "";
    while (current > 0) {
      const remainder = (current - 1) % 26;
      name = String.fromCharCode(65 + remainder) + name;
      current = Math.floor((current - 1) / 26);
    }
    result.push(name);
    if (name === lastColumn) return result;
    value += 1;
  }
}

function writeWideCsv(filePath: string): void {
  const columns = excelColumnNames("BR");
  const rows = [
    columns.join(","),
    columns.map((column, index) => index === 0 ? "Linha 1" : index === 1 ? "42" : index === 2 ? "2026-07-23" : `${column}-1`).join(","),
    columns.map((column, index) => index === 0 ? "Linha 2" : index === 1 ? "7" : index === 2 ? "2026-07-24" : `${column}-2`).join(","),
  ];
  fs.writeFileSync(filePath, rows.join("\n"));
}

function sha256(filePath: string): string {
  return createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

test.describe("Chaos profiling operacional", () => {
  test("analisa, seleciona A..BR, salva e confirma uma visão, preservando a fonte no reload", async ({ page }, testInfo) => {
    test.setTimeout(180000);
    const filePath = testInfo.outputPath("chaos-wide-source.csv");
    writeWideCsv(filePath);
    const beforeHash = sha256(filePath);

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
    const panel = page.getByTestId("chaos-profiling-panel").first();
    await expect(panel).toBeVisible({ timeout: 30000 });
    await expect(panel.getByTestId("chaos-column-selector")).toHaveCount(0);

    await panel.getByTestId("chaos-analyze").click();
    await expect(panel.getByTestId("chaos-column-selector")).toBeVisible({ timeout: 30000 });
    await expect(panel).toContainText("Estrutura analisada");
    await expect(panel).toContainText("Colunas encontradas");

    await panel.getByRole("button", { name: "Selecionar todas" }).click();
    await expect(panel).toContainText("70 selecionada(s) de 70 visíveis");
    await expect(panel.getByText(/Ex:/).first()).toBeVisible();

    await panel.getByRole("button", { name: "Salvar rascunho" }).click();
    await expect(panel).toContainText("Rascunho aguardando confirmação");
    await expect(panel).toContainText(/Cabeçalho:/i);
    await panel.getByRole("button", { name: "Confirmar visão" }).click();
    await expect(panel).toContainText("Visão confirmada", { timeout: 15000 });
    await expect(panel.locator("table").last()).toContainText("Linha 1");

    expect(sha256(filePath)).toBe(beforeHash);
    const storedBeforeReload = await page.evaluate(() => JSON.parse(localStorage.getItem("sauron_chaos_profiling_repository_v1") || "null"));
    expect(Object.keys(storedBeforeReload?.profiles || {})).toHaveLength(1);
    expect(Object.values(storedBeforeReload?.views || {}).some((view: unknown) => (view as { status: string }).status === "CONFIRMED")).toBe(true);

    await page.reload({ waitUntil: "domcontentloaded" });
    await ensureConsultantSession(page);
    await navigateSidebar(page, /Diagnosticar Negócio/i, /Diagnóstico Executivo/i);
    const reloadedPanel = page.getByTestId("chaos-profiling-panel").first();
    await expect(reloadedPanel).toBeVisible({ timeout: 30000 });
    await reloadedPanel.getByRole("button", { name: "Abrir resultados da análise" }).click();
    await expect(reloadedPanel).toContainText("Visão confirmada", { timeout: 30000 });
    await expect(reloadedPanel.getByTestId("chaos-column-selector")).toBeVisible();
    await expect(reloadedPanel.locator("table").last()).toContainText("Linha 2");
    await expect(reloadedPanel).toContainText("chaos-wide-source.csv");
    expect(sha256(filePath)).toBe(beforeHash);

    const storedAfterReload = await page.evaluate(() => JSON.parse(localStorage.getItem("sauron_chaos_profiling_repository_v1") || "null"));
    expect(Object.keys(storedAfterReload?.profiles || {})).toHaveLength(Object.keys(storedBeforeReload.profiles).length);
    const confirmedAfterReload = Object.values(storedAfterReload?.views || {}).find((view: unknown) => (view as { status: string }).status === "CONFIRMED") as { datasetViewId?: string } | undefined;
    const confirmedBeforeReload = Object.values(storedBeforeReload.views || {}).find((view: unknown) => (view as { status: string }).status === "CONFIRMED") as { datasetViewId?: string } | undefined;
    expect(confirmedAfterReload?.datasetViewId).toBe(confirmedBeforeReload?.datasetViewId);
  });
});
