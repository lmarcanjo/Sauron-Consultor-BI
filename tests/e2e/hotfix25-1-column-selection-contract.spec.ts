/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { test, expect } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

test.describe("Hotfix 25.1 — Column Selection Contract E2E", () => {
  test("saveDraft handles clicks without TypeError: columnsToSave.includes is not a function", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", err => pageErrors.push(err.message));

    const tempFile = path.join(os.tmpdir(), `hotfix251-test-${Date.now()}.csv`);
    const csvContent = [
      "Empresa,Unidade,Data_Emissao,Vendedor,Faturamento",
      "Empresa Alfa,Unidade 1,2026-01-15,Ana Silva,4500.00",
      "Empresa Alfa,Unidade 1,2026-01-16,Bruno Souza,3200.00",
    ].join("\n");
    fs.writeFileSync(tempFile, csvContent, "utf8");

    try {
      await page.goto("/", { waitUntil: "domcontentloaded" });
      const firstAccess = page.locator("input[placeholder='Nome completo']").first();
      if (await firstAccess.isVisible({ timeout: 5000 }).catch(() => false)) {
        await page.fill("input[placeholder='Nome completo']", "Consultor E2E P0");
        await page.fill("input[placeholder='E-mail corporativo']", "consultor.e2ep0@sauron.local");
        await page.fill("input[placeholder='Senha secreta (mínimo 6 caracteres)']", "SenhaE2EP0!");
        await page.fill("input[placeholder='Confirmar senha']", "SenhaE2EP0!");
        await page.fill("input[placeholder='Nome da sua consultoria / organização']", "Consultoria E2E");
        await page.getByRole("button", { name: /Inicializar/i }).click();
      }

      // Navigate to Fontes de Dados
      const sidebar = page.locator("aside").first();
      const importNavBtn = sidebar.getByRole("button", { name: /Fontes de Dados/i }).first();
      await expect(importNavBtn).toBeVisible({ timeout: 15000 });
      await importNavBtn.click({ force: true });

      // Upload file directly using SimpleSpreadsheetImporter if visible or open uploader
      const openUploaderBtn = page.getByRole("button", { name: /^Importar Planilha$/i }).first();
      if (await openUploaderBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await openUploaderBtn.click();
      }

      const importer = page.locator("#simple-spreadsheet-importer");
      await expect(importer).toBeVisible({ timeout: 20000 });
      await importer.locator("input[type='file']").first().setInputFiles(tempFile);
      await expect(importer.getByText(/Pronto para (importar|configurar)/i).first()).toBeVisible({ timeout: 30000 });

      await importer.locator("#btn-importar-todos").click();
      await expect(importer).toHaveCount(0, { timeout: 30000 });

      // Trigger Analysis
      const analyzeBtn = page.getByTestId("chaos-analyze");
      await expect(analyzeBtn).toBeVisible({ timeout: 15000 });
      await analyzeBtn.click();

      // Verify ConsultantDiscoveryPanel renders
      await expect(page.getByTestId("consultant-discovery-panel")).toBeVisible({ timeout: 20000 });

      // Click "Revisar dúvidas detalhadas" to open detail panel if available, or click "Ver detalhes técnicos"
      const reviewBtn = page.getByRole("button", { name: /Revisar dúvidas detalhadas/i });
      if (await reviewBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await reviewBtn.click();
      } else {
        const toggleDetailsBtn = page.getByRole("button", { name: /Ver detalhes técnicos/i });
        await expect(toggleDetailsBtn).toBeVisible({ timeout: 20000 });
        await toggleDetailsBtn.click();
      }

      // Click "Salvar revisão" button directly
      const saveDraftBtn = page.getByRole("button", { name: /Salvar revisão/i });
      await expect(saveDraftBtn).toBeVisible();
      await saveDraftBtn.click({ force: true });

      // Verify zero TypeError: columnsToSave.includes is not a function
      const contractErrors = pageErrors.filter(e => e.includes("columnsToSave.includes"));
      expect(contractErrors).toHaveLength(0);

    } finally {
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
  });
});
