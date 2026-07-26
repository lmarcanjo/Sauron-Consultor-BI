import { expect, ensureConsultantSession, navigateSidebar, test } from "./e2eTest";
import * as fs from "node:fs";

function writePhysicalCsv(filePath: string): void {
  fs.writeFileSync(filePath, [
    "A001,B002,C003",
    "linha 1,42,2026-07-22",
    "linha 2,7,2026-07-23",
  ].join("\n"));
}

async function createEntity(page: Parameters<typeof navigateSidebar>[0], trigger: RegExp, name: string): Promise<void> {
  await page.getByRole("button", { name: trigger }).first().click();
  const form = page.locator("form").filter({ has: page.locator("input[name='name']") }).last();
  await form.locator("input[name='name']").fill(name);
  await form.getByRole("button", { name: /^Salvar$/i }).click();
  await expect(page.getByText(name, { exact: true }).first()).toBeAttached({ timeout: 15000 });
}

test.describe("MVP data-first sem mapeamento", () => {
  test("planilha ativa abre o Dashboard com colunas físicas e sem indicadores automáticos", async ({ page }, testInfo) => {
    test.setTimeout(180000);
    const filePath = testInfo.outputPath("mvp-data-first.csv");
    writePhysicalCsv(filePath);

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
    for (const column of ["A001", "B002", "C003"]) {
      await expect(panel.getByText(column, { exact: true }).first()).toBeVisible();
    }
    await expect(page.locator("body")).not.toContainText(/Defina o mapeamento para os campos/i);
    await expect(panel).toContainText("linha 1");
    await expect(panel).toContainText("42");

    await page.reload({ waitUntil: "domcontentloaded" });
    await ensureConsultantSession(page);
    await navigateSidebar(page, /Diagnosticar Negócio/i, /Diagnóstico Executivo/i);
    const reloadedPanel = page.getByTestId("active-dataset-raw-preview");
    await expect(reloadedPanel).toBeVisible({ timeout: 30000 });
    await expect(reloadedPanel).toContainText("linha 1");
    await expect(reloadedPanel).toContainText("42");

    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  });

  test("banco carregado por tabela mantém colunas físicas sem mapeamento", async ({ page }) => {
    test.setTimeout(120000);
    await page.route("**/api/db/config", route => route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, config: null }),
    }));
    await page.route("**/api/db/test-connection", route => route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        stage: "readonly",
        diagnostics: { stages: [] },
      }),
    }));
    await page.route("**/api/db/test", route => route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        tables: ["dados"],
        tableColumns: { dados: [
          { name: "A001", type: "varchar" },
          { name: "B002", type: "number" },
        ] },
      }),
    }));
    await page.route("**/api/db/fetch", route => route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        count: 1,
        data: [{ A001: "linha", B002: 42 }],
      }),
    }));

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload({ waitUntil: "domcontentloaded" });
    await ensureConsultantSession(page);
    await navigateSidebar(page, /Centro de Comando/i, /Empresas e Grupos/i);
    if (await page.getByRole("button", { name: /Grupo Empresarial|Novo grupo/i }).first().isVisible({ timeout: 1500 }).catch(() => false)) {
      await createEntity(page, /Grupo Empresarial|Novo grupo/i, "Grupo SQL Data First");
    }
    await navigateSidebar(page, /Conectar Dados/i, /Importar Planilhas/i);

    await page.getByRole("button", { name: /Conectar Banco \(ERP\)/i }).click();
    const modal = page.locator("div.fixed.inset-0").last();
    await modal.getByRole("button", { name: /Conexão com Banco de Dados/i }).click();
    await modal.getByRole("button", { name: "MySQL 🐬", exact: true }).click();
    const textInputs = modal.locator("input[type='text']");
    await textInputs.nth(0).fill("10.12.22.14");
    await textInputs.nth(1).fill("3306");
    await textInputs.nth(2).fill("consultoria");
    await textInputs.nth(3).fill("consultoria");
    await modal.locator("input[type='password']").fill("test-only");
    await modal.getByRole("button", { name: /Testar e Descobrir Tabelas/i }).click();
    await expect(modal).toContainText(/Conectado! 1 tabelas encontradas/i, { timeout: 30000 });
    await expect(modal).toContainText("OPCIONAL");
    await expect(modal.getByRole("button", { name: /Continuar com os dados da tabela/i })).toBeVisible();
    const fetchResponse = page.waitForResponse(response => response.url().includes("/api/db/fetch"));
    await modal.getByRole("button", { name: /Continuar com os dados da tabela/i }).dispatchEvent("click");
    await expect((await fetchResponse).ok()).toBeTruthy();
    await expect(modal).toBeHidden({ timeout: 30000 });

    const sqlSourceRow = page.locator("tr").filter({ hasText: "Banco SQL" }).first();
    await expect(sqlSourceRow).toBeVisible({ timeout: 30000 });
    await expect(sqlSourceRow.getByText("2", { exact: true })).toBeVisible();
    await expect(page.locator("body")).toContainText(/Banco SQL/i);
    const persistedState = await page.evaluate(() => ({
      activeSql: JSON.parse(localStorage.getItem("sauron_ds_active_dataset") || "null"),
      context: JSON.parse(localStorage.getItem("sauron_active_enterprise_context") || "null"),
      workbooks: JSON.parse(localStorage.getItem("sauron_workbook_repository_v1") || "null"),
    }));
    const activeSql = persistedState.activeSql;
    expect(activeSql.sourceType).toBe("DATABASE_DATA");
    expect(activeSql.sourceIdentity.sourceId).toMatch(/^sql_source_/);
    expect(activeSql.physicalColumns).toEqual(expect.arrayContaining(["A001", "B002"]));
    await navigateSidebar(page, /Diagnosticar Negócio/i, /Diagnóstico Executivo/i);
    await expect(page.locator("body")).not.toContainText(/Defina o mapeamento para os campos/i);

    await page.reload({ waitUntil: "domcontentloaded" });
    await ensureConsultantSession(page);
    await navigateSidebar(page, /Diagnosticar Negócio/i, /Diagnóstico Executivo/i);
    await expect(page.locator("body")).toContainText(/Banco SQL/i);
    const reloadedSql = await page.evaluate(() => JSON.parse(localStorage.getItem("sauron_ds_active_dataset") || "null"));
    expect(reloadedSql.sourceIdentity.sourceId).toBe(activeSql.sourceIdentity.sourceId);
  });
});
