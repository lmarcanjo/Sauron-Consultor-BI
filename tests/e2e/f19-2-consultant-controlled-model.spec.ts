/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { expect, test, type Page } from "@playwright/test";
import * as fs from "node:fs";

function makeSourceCsv(company: string, unit: string, value: number, isC: boolean): string {
  if (isC) {
    return [
      "Empresa,Unidade,Data,Valor,Vendedor",
      `${company},${unit},2026-01-01,${value},Ana`,
      `${company},${unit},2026-01-02,0,Bruno`,
    ].join("\n");
  } else {
    return [
      "Empresa,Unidade,Data,Receita,Vendedor",
      `${company},${unit},2026-01-01,${value},Ana`,
      `${company},${unit},2026-01-02,0,Bruno`,
    ].join("\n");
  }
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
  await expect(page.getByText(/Dados Conectados/i).first()).toBeVisible({ timeout: 15000 });
}

test.describe("F19.2 — Consultant-Controlled Business Model & Switching", () => {
  test("creates organizations, configures companies C and D dynamically, and switches instantly", async ({ page }) => {
    test.setTimeout(180000);

    const files = [
      { company: "Empresa C E2E", unit: "Unidade C E2E", value: 1000, name: "temp-c.csv", isC: true },
      { company: "Empresa D E2E", unit: "Unidade D E2E", value: 2000, name: "temp-d.csv", isC: false },
    ].map(file => {
      const path = `./${file.name}`;
      fs.writeFileSync(path, makeSourceCsv(file.company, file.unit, file.value, file.isC));
      return { ...file, path };
    });

    try {
      await startSession(page);
      await navigate(page, /Empresas e Grupos/i);

      if (await page.getByRole("button", { name: /Grupo Empresarial/i }).isVisible({ timeout: 1500 }).catch(() => false)) {
        await createEntity(page, /Grupo Empresarial/i, "Grupo A E2E");
      }
      await createEntity(page, /Nova empresa/i, files[0].company);
      await createEntity(page, /Nova unidade/i, files[0].unit);
      await createEntity(page, /Nova empresa/i, files[1].company);
      await createEntity(page, /Nova unidade/i, files[1].unit);

      // Import spreadsheets
      for (const file of files) {
        await importForCompany(page, file.path, file.company, file.unit);
      }

      // --- Configure Empresa C ---
      // 1. Switch context to Empresa C
      const companySelect = page.locator("main select").nth(1);
      await expect(companySelect).toBeVisible({ timeout: 15000 });
      await companySelect.selectOption({ label: "Empresa C E2E" });
      await page.waitForTimeout(1000);

      // 2. Navigate to Modelo Consultivo tab
      await navigate(page, /Modelo Consultivo/i);
      await expect(page.locator("#modelo-consultivo-tab")).toBeVisible({ timeout: 15000 });

      // 3. Disable Pessoas/Comissão modules (under Wizard subtab)
      // De-select Pessoas module card
      await page.getByText("Equipe / Pessoas").first().click();
      await page.getByText("Comissão").first().click();

      // 4. Create custom Business Area: "Resultado por Centro de Custo"
      await page.getByRole("button", { name: "Áreas de Análise" }).click();
      await page.fill("input[placeholder='Ex: Resultado por Centro de Custo']", "Resultado por Centro de Custo");
      await page.fill("input[placeholder='Ex: Análise baseada em departamentos...']", "Análise personalizada de centro de custo");
      // Click on fields to relate
      await page.getByRole("button", { name: "Valor" }).click();
      await page.getByRole("button", { name: "Salvar Nova Área" }).click();
      await expect(page.getByText("Resultado por Centro de Custo").first()).toBeVisible({ timeout: 10000 });

      // 5. Create custom indicator: "Faturamento"
      await page.getByRole("button", { name: "Qual pergunta deseja responder?" }).click();
      await page.fill("input[placeholder='Ex: Faturamento Consolidado']", "Faturamento");
      const metricFormSelects = page.locator("#modelo-consultivo-tab select");
      await metricFormSelects.nth(0).selectOption({ label: "Valor" });
      await metricFormSelects.nth(1).selectOption({ label: "Soma (Total)" });
      await page.getByRole("button", { name: "Salvar Indicador" }).click();
      await expect(page.getByText("Faturamento").first()).toBeVisible({ timeout: 10000 });

      // Verify dynamic sidebar options: should show "Resultado por Centro de Custo"
      await expect(page.locator("aside").getByText("Resultado por Centro de Custo").first()).toBeVisible({ timeout: 10000 });
      // should NOT show "People Intelligence" or "Pessoas" since they were disabled
      await expect(page.locator("aside").getByText("People Intelligence").first()).toHaveCount(0);

      // --- Configure Empresa D ---
      // 1. Switch context to Empresa D
      await companySelect.selectOption({ label: "Empresa D E2E" });
      await page.waitForTimeout(1000);

      // 2. Navigate back to Modelo Consultivo
      await navigate(page, /Modelo Consultivo/i);
      await expect(page.locator("#modelo-consultivo-tab")).toBeVisible({ timeout: 15000 });

      // 3. Keep Pessoas but customize name to "Equipe Técnica"
      // Click on Pessoas preset option in wizard to select "Equipe"
      await page.getByRole("button", { name: "Equipe" }).click();
      // Disable DRE
      await page.getByText("DRE Gerencial").first().click();

      // Verify sidebar: should show "Equipe"
      await expect(page.locator("aside").getByText("Equipe").first()).toBeVisible({ timeout: 10000 });
      // should NOT show "DRE Gerencial"
      await expect(page.locator("aside").getByText("DRE Gerencial").first()).toHaveCount(0);

      // --- Validate Rapid Switching ---
      // 1. Switch context to Empresa C
      await companySelect.selectOption({ label: "Empresa C E2E" });
      await page.waitForTimeout(1000);
      // Menu should change back to C config
      await expect(page.locator("aside").getByText("Resultado por Centro de Custo").first()).toBeVisible({ timeout: 10000 });
      await expect(page.locator("aside").getByText("Equipe").first()).toHaveCount(0);

      // 2. Switch context to Empresa D
      await companySelect.selectOption({ label: "Empresa D E2E" });
      await page.waitForTimeout(1000);
      // Menu should change to D config
      await expect(page.locator("aside").getByText("Equipe").first()).toBeVisible({ timeout: 10000 });
      await expect(page.locator("aside").getByText("Resultado por Centro de Custo").first()).toHaveCount(0);

      // --- Persistence Validation ---
      await page.reload({ waitUntil: "domcontentloaded" });
      await startSession(page);
      await expect(page.locator("aside").getByText("Equipe").first()).toBeVisible({ timeout: 10000 });

    } finally {
      // Clean up temp files
      for (const file of files) {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }
    }
  });
});
