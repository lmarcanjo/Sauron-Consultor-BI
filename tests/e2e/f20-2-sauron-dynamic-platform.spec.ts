/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { expect, test, type Page } from "@playwright/test";
import * as fs from "node:fs";

function makeSourceCsv(company: string, unit: string, value: number): string {
  return [
    "Empresa,Unidade,Data,Vendedor,Receita",
    `${company},${unit},2026-01-01,Ana,${value}`,
    `${company},${unit},2026-01-02,Bruno,150`,
  ].join("\n");
}

async function startSession(page: Page): Promise<void> {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const firstAccess = page.locator("text=Inicializar Sauron").first();
  if (await firstAccess.isVisible({ timeout: 3000 }).catch(() => false)) {
    await page.fill("input[placeholder='Nome completo']", "Consultor E2E P0");
    await page.fill("input[placeholder='E-mail corporativo']", "consultor.e2ep0@sauron.local");
    await page.fill("input[placeholder='Senha secreta (mínimo 6 caracteres)']", "SenhaE2EP0!");
    await page.fill("input[placeholder='Confirmar senha']", "SenhaE2EP0!");
    await page.fill("input[placeholder='Nome da sua consultoria / organização']", "Consultoria E2E");
    await page.getByRole("button", { name: /Inicializar/i }).click();
  } else if (await page.locator("input[placeholder='E-mail']").isVisible({ timeout: 1500 }).catch(() => false)) {
    await page.fill("input[placeholder='E-mail']", "consultor.e2ep0@sauron.local");
    await page.fill("input[placeholder='Senha']", "SenhaE2EP0!");
    await page.getByRole("button", { name: /Entrar no Sauron/i }).click();
  }
  await expect(page.locator("aside").first()).toBeVisible({ timeout: 15000 });
}

async function navigate(page: Page, itemName: RegExp | string): Promise<void> {
  const sidebar = page.locator("aside").first();
  const item = sidebar.getByRole("button", { name: itemName }).last();
  await expect(item).toBeVisible({ timeout: 15000 });
  await item.click({ force: true });
}

async function createEntity(page: Page, trigger: RegExp, name: string): Promise<void> {
  await page.getByRole("button", { name: trigger }).first().click();
  const form = page.locator("form").filter({ has: page.locator("input[name='name']") }).last();
  await form.locator("input[name='name']").fill(name);
  await form.getByRole("button", { name: /^Salvar$/i }).click();
  await expect(page.getByText(name, { exact: true }).first()).toBeAttached({ timeout: 15000 });
}

async function importForCompany(page: Page, filePath: string, company: string, unit: string): Promise<void> {
  await navigate(page, /Importar Planilhas/i);
  await page.getByRole("button", { name: /^Importar Planilha$/i }).first().click();
  const importer = page.locator("#simple-spreadsheet-importer");
  await expect(importer).toBeVisible({ timeout: 15000 });
  await importer.locator("input[type='file']").first().setInputFiles(filePath);
  await expect(importer.getByText(/Pronto para (importar|configurar)/i).first()).toBeVisible({ timeout: 30000 });
  
  const selects = importer.locator("select");
  await selects.nth(0).selectOption({ label: "Grupo A E2E" });
  await selects.nth(1).selectOption({ label: company });
  await selects.nth(2).selectOption({ label: unit });
  await importer.locator("#btn-importar-todos").click();
  
  await expect(importer).toHaveCount(0, { timeout: 30000 });
}

async function acceptSuggestionsIfPresent(page: Page): Promise<void> {
  const button = page.getByRole("button", { name: /Aceitar sugestões/i }).first();
  await expect(button).toBeVisible({ timeout: 20000 });
  await button.click();
  await expect(page.getByText(/Sugestões salvas|área\(s\) configurada/i).first()).toBeVisible({ timeout: 15000 });
}

test.describe("F20.2 — SAURON Dynamic Consulting Platform", () => {
  test("creates DNA with SAURON Architect wizard and updates sidebar custom areas dynamically", async ({ page }) => {
    test.setTimeout(180000);

    const tempFile = { company: "Dynamic Company E2E", unit: "Dynamic Unit E2E", value: 3000, name: "temp-dynamic.csv", path: "./temp-dynamic.csv" };
    fs.writeFileSync(tempFile.path, makeSourceCsv(tempFile.company, tempFile.unit, tempFile.value));

    page.on("pageerror", error => {
      console.error("BROWSER PAGEERROR:", error.message, error.stack);
    });
    page.on("console", message => {
      if (message.type() === "error" || message.type() === "warning") {
        console.log(`BROWSER CONSOLE ${message.type().toUpperCase()}:`, message.text());
      }
    });

    try {
      await startSession(page);
      await navigate(page, /Empresas e Grupos/i);

      if (await page.getByRole("button", { name: /Grupo Empresarial/i }).isVisible({ timeout: 1500 }).catch(() => false)) {
        await createEntity(page, /Grupo Empresarial/i, "Grupo A E2E");
      }
      await createEntity(page, /Nova empresa/i, tempFile.company);
      await createEntity(page, /Nova unidade/i, tempFile.unit);

      // Import spreadsheet
      await importForCompany(page, tempFile.path, tempFile.company, tempFile.unit);

      // Switch context to Dynamic Company E2E
      const companySelect = page.locator("main select").nth(1);
      await expect(companySelect).toBeVisible({ timeout: 15000 });
      await companySelect.selectOption({ label: tempFile.company });
      await page.waitForTimeout(1000);
      await navigate(page, /Diagnóstico Executivo/i);
      await acceptSuggestionsIfPresent(page);

      // Navigate to Modelo Consultivo (DNA) tab
      await navigate(page, /Modelo Consultivo/i);
      await expect(page.locator("#modelo-consultivo-tab")).toBeVisible({ timeout: 15000 });

      // --- Sauron Architect Wizard Flow ---
      // 1. Welcome step
      await page.getByRole("button", { name: /Vamos começar/i }).click();

      // 2. Select Blueprint "Método de Performance Comercial"
      await page.getByText("Método de Performance Comercial").click();
      await page.getByRole("button", { name: /Próximo/i }).click();

      // 3. Question step
      await page.getByText("Qual vendedor vende mais?").click();
      await page.getByRole("button", { name: /Próximo/i }).click();

      // 4. Terminology step: Change names to Vendedores E2E and Comissões E2E
      await page.locator("input[placeholder*='Ex: Consultores, Vendedores']").fill("Vendedores E2E");
      await page.locator("input[placeholder*='Ex: Incentivos, Prêmio']").fill("Comissões E2E");
      await page.getByRole("button", { name: /Revisar/i }).click();

      // 5. Apply DNA
      await page.getByRole("button", { name: /Aplicar DNA ao Projeto/i }).click();
      await page.waitForTimeout(1000);

      // Verify dynamic sidebar navigation options
      const sidebar = page.locator("aside").first();
      // Should show the custom areas from the Comercial Blueprint: "Resultados Gerais" and "Remunerações"
      await expect(sidebar.getByText("Resultados Gerais").first()).toBeVisible({ timeout: 15000 });
      await expect(sidebar.getByText("Remunerações").first()).toBeVisible({ timeout: 15000 });

      // Click on "Resultados Gerais" custom area tab using testid for precision
      const customAreaBtn = page.locator("[data-testid='sidebar-custom_area_comercial']").first();
      await expect(customAreaBtn).toBeVisible({ timeout: 15000 });
      await customAreaBtn.click();
      // Wait for custom area navigation to settle
      await page.waitForTimeout(1000);
      // Asserts that the custom dashboard renders successfully
      await expect(page.getByText("Resultados Gerais").first()).toBeVisible({ timeout: 15000 });
      await expect(page.getByText("registros ativos").first()).toBeVisible({ timeout: 10000 });

    } finally {
      if (fs.existsSync(tempFile.path)) {
        fs.unlinkSync(tempFile.path);
      }
    }
  });
});
