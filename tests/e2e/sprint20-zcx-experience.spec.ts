/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { test, expect } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

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

test.describe("Sprint 20 — Zero Configuration Experience (ZCX)", () => {
  test("generates automatic explainable proposal, allows accepting high confidence and continuing with original names", async ({ page }) => {
    // Create temporary CSV file for testing
    const tempFile = path.join(os.tmpdir(), `zcx-test-${Date.now()}.csv`);
    const csvContent = [
      "Empresa,Unidade,Data_Emissao,Vendedor,Faturamento",
      "Dynamic Group E2E,Unidade Alfa,2026-01-15,Ana Silva,4500.00",
      "Dynamic Group E2E,Unidade Alfa,2026-01-16,Bruno Souza,3200.00",
    ].join("\n");
    fs.writeFileSync(tempFile, csvContent, "utf8");

    try {
      await startSession(page);

      // 1. Navigate to Data Import tab (Fontes de Dados)
      const sidebar = page.locator("aside").first();
      const importNavBtn = sidebar.getByRole("button", { name: /Fontes de Dados/i }).first();
      await expect(importNavBtn).toBeVisible({ timeout: 15000 });
      await importNavBtn.click({ force: true });

      // 2. Click main Import Spreadsheet button to open drawer
      const openUploaderBtn = page.getByRole("button", { name: /^Importar Planilha$/i }).first();
      await expect(openUploaderBtn).toBeVisible({ timeout: 15000 });
      await openUploaderBtn.click();

      // 3. Upload file via importer drawer
      const importer = page.locator("#simple-spreadsheet-importer");
      await expect(importer).toBeVisible({ timeout: 15000 });
      await importer.locator("input[type='file']").first().setInputFiles(tempFile);
      await expect(importer.getByText(/Pronto para (importar|configurar)/i).first()).toBeVisible({ timeout: 30000 });

      // 4. Confirm import
      await importer.locator("#btn-importar-todos").click();
      await expect(importer).toHaveCount(0, { timeout: 30000 });

      // 4. Trigger Analysis
      const analyzeBtn = page.getByTestId("chaos-analyze");
      await expect(analyzeBtn).toBeVisible({ timeout: 15000 });
      await analyzeBtn.click();

      // 5. Verify ZCX Proposal Panel appears
      const zcxPanel = page.getByTestId("zcx-proposal-panel");
      await expect(zcxPanel).toBeVisible({ timeout: 20000 });
      await expect(page.getByText("Estrutura inicial proposta pelo SAURON")).toBeVisible();

      // 6. Verify main ZCX buttons exist and are non-blocking
      const acceptBtn = page.getByTestId("zcx-btn-accept-suggested");
      const reviewBtn = page.getByTestId("zcx-btn-review-questions");
      const keepOrigBtn = page.getByTestId("zcx-btn-keep-original");
      const advancedBtn = page.getByTestId("zcx-btn-advanced-config");

      await expect(acceptBtn).toBeVisible();
      await expect(reviewBtn).toBeVisible();
      await expect(keepOrigBtn).toBeVisible();
      await expect(advancedBtn).toBeVisible();

      // 7. Test 'Usar estrutura sugerida' action
      await acceptBtn.click();
      await expect(page.getByText("Rascunho aguardando confirmação").or(page.getByText("Revisão aguardando confirmação"))).toBeVisible({ timeout: 10000 });

      // 8. Confirm vision to release structured view
      const confirmVisionBtn = page.getByRole("button", { name: /Confirmar visão/i }).first();
      await expect(confirmVisionBtn).toBeVisible();
      await confirmVisionBtn.click();

      // 9. Verify confirmed view state
      await expect(page.getByText("Estrutura confirmada", { exact: true }).first()).toBeVisible({ timeout: 10000 });

    } finally {
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
  });
});
