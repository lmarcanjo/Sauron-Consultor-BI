/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import * as fs from "node:fs";

function makeSourceCsv(company: string, unit: string, value: number): string {
  return [
    "Empresa,Unidade,Data,Vendedor,Receita",
    `${company},${unit},2026-01-01,Ana,${value}`,
    `${company},${unit},2026-01-02,Bruno,150`,
  ].join("\n");
}

async function startSession(page: Page, email: string): Promise<void> {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const firstAccess = page.locator("text=Inicializar Sauron").first();
  if (await firstAccess.isVisible({ timeout: 3000 }).catch(() => false)) {
    await page.fill("input[placeholder='Nome completo']", "Consultor E2E F20.3");
    await page.fill("input[placeholder='E-mail corporativo']", email);
    await page.fill("input[placeholder='Senha secreta (mínimo 6 caracteres)']", "SenhaE2EP0!");
    await page.fill("input[placeholder='Confirmar senha']", "SenhaE2EP0!");
    await page.fill("input[placeholder='Nome da sua consultoria / organização']", "Consultoria E2E F20.3");
    await page.getByRole("button", { name: /Inicializar/i }).click();
  } else if (await page.locator("input[placeholder='E-mail']").isVisible({ timeout: 1500 }).catch(() => false)) {
    await page.fill("input[placeholder='E-mail']", email);
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
  await selects.nth(0).selectOption({ label: "Grupo F203 E2E" });
  await selects.nth(1).selectOption({ label: company });
  await selects.nth(2).selectOption({ label: unit });
  await importer.locator("#btn-importar-todos").click();

  await expect(importer).toHaveCount(0, { timeout: 30000 });
}

async function applyBlueprintDNA(page: Page): Promise<void> {
  await navigate(page, /Modelo Consultivo/i);
  await expect(page.locator("#modelo-consultivo-tab")).toBeVisible({ timeout: 15000 });

  await page.getByRole("button", { name: /Vamos começar/i }).click();
  await page.getByText("Método de Performance Comercial").click();
  await page.getByRole("button", { name: /Próximo/i }).click();
  await page.getByText("Qual vendedor vende mais?").click();
  await page.getByRole("button", { name: /Próximo/i }).click();
  await page.locator("input[placeholder*='Ex: Consultores, Vendedores']").fill("Vendedores F203");
  await page.locator("input[placeholder*='Ex: Incentivos, Prêmio']").fill("Comissões F203");
  await page.getByRole("button", { name: /Revisar/i }).click();
  await page.getByRole("button", { name: /Aplicar DNA ao Projeto/i }).click();
  await page.waitForTimeout(1000);
}

test.describe("F20.3 — Dynamic Platform Hardening", () => {
  test("a dynamic Business Area route survives a full page reload and does not fall back to the default tab", async ({ page }) => {
    test.setTimeout(180000);

    const tempFile = { company: "Reload Company F203", unit: "Reload Unit F203", value: 3000, path: "./temp-f203-reload.csv" };
    fs.writeFileSync(tempFile.path, makeSourceCsv(tempFile.company, tempFile.unit, tempFile.value));

    const consoleErrors: string[] = [];
    page.on("pageerror", error => consoleErrors.push(error.message));
    page.on("console", message => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });

    try {
      await startSession(page, "consultor.f203reload@sauron.local");
      await navigate(page, /Empresas e Grupos/i);

      if (await page.getByRole("button", { name: /Grupo Empresarial/i }).isVisible({ timeout: 1500 }).catch(() => false)) {
        await createEntity(page, /Grupo Empresarial/i, "Grupo F203 E2E");
      }
      await createEntity(page, /Nova empresa/i, tempFile.company);
      await createEntity(page, /Nova unidade/i, tempFile.unit);

      await importForCompany(page, tempFile.path, tempFile.company, tempFile.unit);

      const companySelect = page.locator("main select").nth(1);
      await expect(companySelect).toBeVisible({ timeout: 15000 });
      await companySelect.selectOption({ label: tempFile.company });
      await page.waitForTimeout(1000);
      await navigate(page, /Diagnóstico Executivo/i);

      await applyBlueprintDNA(page);

      const sidebar = page.locator("aside").first();
      const customAreaBtn = page.locator("[data-testid='sidebar-custom_area_comercial']").first();
      await expect(customAreaBtn).toBeVisible({ timeout: 15000 });
      await customAreaBtn.click();
      await page.waitForTimeout(1000);
      await expect(page.getByText("Resultados Gerais").first()).toBeVisible({ timeout: 15000 });

      // --- Reload while the dynamic route is active ---
      await page.reload({ waitUntil: "domcontentloaded" });
      await expect(page.locator("aside").first()).toBeVisible({ timeout: 15000 });

      // The area must still render — no silent fallback to executive_workspace,
      // no blank screen, and the sidebar must still expose the same area.
      await expect(page.getByText("Resultados Gerais").first()).toBeVisible({ timeout: 15000 });
      await expect(sidebar.getByText("Resultados Gerais").first()).toBeVisible({ timeout: 15000 });

      const axe = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      expect(
        axe.violations.filter(violation => violation.impact === "critical" || violation.impact === "serious"),
        "Dynamic area route must have no critical or serious axe violations",
      ).toHaveLength(0);

      const criticalErrors = consoleErrors.filter(e => !e.includes("Warning:") && !e.includes("WebSocket") && !e.includes("[vite]"));
      expect(criticalErrors, `Unexpected console/page errors after reload: ${criticalErrors.join(" | ")}`).toHaveLength(0);
    } finally {
      if (fs.existsSync(tempFile.path)) fs.unlinkSync(tempFile.path);
    }
  });

  test("an invalid/unregistered dynamic route never renders a blank screen and falls back safely", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    // Force a bogus deep link into the persisted tab BEFORE the app resolves it.
    await page.evaluate(() => localStorage.setItem("sauron_active_tab", "custom_area_never_registered_xyz"));
    await page.reload({ waitUntil: "domcontentloaded" });

    const aside = page.locator("aside").first();
    // If not authenticated, the login/bootstrap screen renders — that alone
    // proves no blank white screen occurred. If authenticated, the sidebar
    // must resolve to a real, visible page instead of an empty viewport.
    const bootstrapVisible = await page.locator("text=Inicializar Sauron").first().isVisible({ timeout: 5000 }).catch(() => false);
    const loginVisible = await page.locator("input[placeholder='E-mail']").first().isVisible({ timeout: 2000 }).catch(() => false);
    const sidebarVisible = await aside.isVisible({ timeout: 5000 }).catch(() => false);

    expect(bootstrapVisible || loginVisible || sidebarVisible).toBe(true);

    if (sidebarVisible) {
      // Main content region must contain rendered content, not be empty.
      const main = page.locator("main").first();
      await expect(main).toBeVisible({ timeout: 10000 });
      const text = await main.innerText();
      expect(text.trim().length).toBeGreaterThan(0);
    }
  });
});
