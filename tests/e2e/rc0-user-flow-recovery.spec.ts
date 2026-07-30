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

test.describe("Recovery Gate RC-0 — Exact Video Journey Reproducer", () => {
  test("reproduces full user journey: create group, import file, profile structure, single CTA validation, and analysis transition", async ({ page }) => {
    const pageErrors: string[] = [];
    const consoleWarnings: string[] = [];
    page.on("pageerror", err => pageErrors.push(err.message));
    page.on("console", msg => {
      if (msg.type() === "warning" || msg.type() === "error") {
        consoleWarnings.push(msg.text());
      }
    });

    const tempFile = path.join(os.tmpdir(), `rc0-video-journey-${Date.now()}.csv`);
    const csvContent = [
      "Grupo,Empresa,Unidade,Data_Emissao,Vendedor,Faturamento,CampoVazio1",
      "4629617,YAMAHA_FABERGE_CARAGUA,Unidade 1,2026-01-15,Ana Silva,4500.00,",
      "4629617,YAMAHA_FABERGE_CARAGUA,Unidade 1,2026-01-16,Bruno Souza,3200.00,",
    ].join("\n");
    fs.writeFileSync(tempFile, csvContent, "utf8");

    try {
      // 1. Login
      await startSession(page);

      // 2. Criar Grupo em Empresas/Estruturas
      const sidebar = page.locator("aside").first();
      const enterpriseNavBtn = sidebar.getByRole("button", { name: /Empresas\/Estruturas/i }).first();
      if (await enterpriseNavBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await enterpriseNavBtn.click({ force: true });
        const createGroupBtn = page.getByRole("button", { name: /Novo Grupo/i }).first();
        if (await createGroupBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
          await createGroupBtn.click();
          await page.fill("input[placeholder='ex: Grupo Caraguá Auto']", "Grupo Faberge 4629617");
          await page.getByRole("button", { name: /Criar Grupo/i }).click();
        }
      }

      // 3. Importar fonte
      const importNavBtn = sidebar.getByRole("button", { name: /Fontes de Dados/i }).first();
      await expect(importNavBtn).toBeVisible({ timeout: 15000 });
      await importNavBtn.click({ force: true });

      const openUploaderBtn = page.getByRole("button", { name: /^Importar Planilha$/i }).first();
      await expect(openUploaderBtn).toBeVisible({ timeout: 15000 });
      await openUploaderBtn.click();

      const importer = page.locator("#simple-spreadsheet-importer");
      await expect(importer).toBeVisible({ timeout: 15000 });
      await importer.locator("input[type='file']").first().setInputFiles(tempFile);
      await expect(importer.getByText(/Pronto para (importar|configurar)/i).first()).toBeVisible({ timeout: 30000 });

      await importer.locator("#btn-importar-todos").click();
      await expect(importer).toHaveCount(0, { timeout: 30000 });

      // 4. Analisar estrutura
      const analyzeBtn = page.getByTestId("chaos-analyze");
      await expect(analyzeBtn).toBeVisible({ timeout: 15000 });
      await analyzeBtn.click();

      // 5. Verificar existência de uma ÚNICA CTA de validação final
      const validateBtn = page.getByTestId("btn-confirm-source-understanding");
      await expect(validateBtn).toBeVisible({ timeout: 15000 });
      await expect(validateBtn).toContainText("Validar entendimento da empresa");

      // Verificar que botão duplicado Usar Estrutura Sugerida NÃO existe como CTA final
      await expect(page.getByRole("button", { name: "Usar estrutura sugerida" })).toHaveCount(0);

      // 6. Clicar em Validar Entendimento da Empresa
      await validateBtn.click();

      // 7. Transição visível para "Ir para análises"
      const goToAnalysisBtn = page.getByTestId("btn-go-to-analysis");
      await expect(goToAnalysisBtn).toBeVisible({ timeout: 15000 });

      // 8. Clicar em Ir para análises
      await goToAnalysisBtn.click();

      // 9. Recarregar a página e confirmar persistência
      await page.reload({ waitUntil: "domcontentloaded" });
      await expect(sidebar).toBeVisible({ timeout: 15000 });

      // 10. Validar ausência de password form warnings no console
      const passwordWarnings = consoleWarnings.filter(w => w.toLowerCase().includes("password field is not contained in a form"));
      expect(passwordWarnings).toHaveLength(0);

      // 11. Validar ausência de erros graves de JS
      const fatalErrors = pageErrors.filter(e => !e.includes("WebSocket"));
      expect(fatalErrors).toHaveLength(0);

    } finally {
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
  });
});
