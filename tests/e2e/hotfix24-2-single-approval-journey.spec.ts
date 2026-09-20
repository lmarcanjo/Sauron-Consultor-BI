/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { test, expect } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

async function startSession(page: any): Promise<void> {
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

test.describe("Hotfix 24.2 — Single Approval Journey E2E", () => {
  test("renders only one main approval panel, validates observable actions, groups empty fields, and completes confirmation", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", err => pageErrors.push(err.message));

    const tempFile = path.join(os.tmpdir(), `hotfix242-test-${Date.now()}.csv`);
    const csvContent = [
      "Empresa,Unidade,Data_Emissao,Vendedor,Faturamento,CampoVazio1,CampoVazio2",
      "Empresa Alfa,Unidade 1,2026-01-15,Ana Silva,4500.00,,",
      "Empresa Alfa,Unidade 1,2026-01-16,Bruno Souza,3200.00,,",
    ].join("\n");
    fs.writeFileSync(tempFile, csvContent, "utf8");

    try {
      await startSession(page);

      // Navigate to Fontes de Dados
      const sidebar = page.locator("aside").first();
      const importNavBtn = sidebar.getByRole("button", { name: /Fontes de Dados/i }).first();
      await expect(importNavBtn).toBeVisible({ timeout: 15000 });
      await importNavBtn.click({ force: true });

      // Upload file
      const openUploaderBtn = page.getByRole("button", { name: /^Importar Planilha$/i }).first();
      await expect(openUploaderBtn).toBeVisible({ timeout: 15000 });
      await openUploaderBtn.click();

      const importer = page.locator("#simple-spreadsheet-importer");
      await expect(importer).toBeVisible({ timeout: 15000 });
      await importer.locator("input[type='file']").first().setInputFiles(tempFile);
      await expect(importer.getByText(/Pronto para (importar|configurar)/i).first()).toBeVisible({ timeout: 30000 });

      await importer.locator("#btn-importar-todos").click();
      await expect(importer).toHaveCount(0, { timeout: 30000 });

      // Trigger Analysis
      const analyzeBtn = page.getByTestId("chaos-analyze");
      await expect(analyzeBtn).toBeVisible({ timeout: 15000 });
      await analyzeBtn.click();

      // 1. Verify ONLY ONE main discovery panel exists
      const discoveryPanels = page.getByTestId("consultant-discovery-panel");
      await expect(discoveryPanels).toHaveCount(1, { timeout: 20000 });

      // 2. Verify duplicate ZcxProposalPanel is NOT rendered below
      const zcxPanels = page.getByTestId("zcx-proposal-panel");
      await expect(zcxPanels).toHaveCount(0);

      // 3. Verify empty fields grouping
      await expect(page.getByText(/campo\(s\) sem preenchimento/i).first()).toBeVisible();

      // 4. Click Confirm Source Understanding
      const confirmBtn = page.getByTestId("btn-confirm-source-understanding");
      await expect(confirmBtn).toBeVisible();
      await confirmBtn.click();

      // 5. Verify confirmation success
      await expect(page.getByText(/Fonte confirmada para análises/i).first()).toBeVisible({ timeout: 10000 });

      // 6. Verify zero runtime JS errors (excluding dev HMR websocket warnings)
      const jsErrors = pageErrors.filter(e => !e.includes("WebSocket"));
      expect(jsErrors).toHaveLength(0);

    } finally {
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
  });
});
