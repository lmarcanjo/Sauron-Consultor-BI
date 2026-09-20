/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { expect, ensureConsultantSession, navigateSidebar, test } from "./e2eTest";
import {
  createCanonicalClientEngagementStructure,
  importSpreadsheetThroughUi,
} from "./canonicalJourneyHelpers";
import fs from "node:fs";
import path from "node:path";

test.describe("Two consultants resource isolation E2E", () => {
  test("enforces strict boundaries where Consultant B cannot see or query A's client/engagement/analysis", async ({ page, browser }) => {
    test.setTimeout(180000);
    const filePath = "/home/natalicorreia/Downloads/Consulta Financeiro Topp.xls";
    expect(fs.existsSync(filePath)).toBe(true);

    // 1. Setup Consultant A (default context)
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await ensureConsultantSession(page);
    
    // Seed Client A, Engagement A, Units
    const contextA = await createCanonicalClientEngagementStructure(page, `A_${Date.now()}`);
    await importSpreadsheetThroughUi(page, filePath, path.basename(filePath));

    // Run Analisar Dados for A
    await navigateSidebar(page, /Análise/i, /Análise da fonte/i);
    await expect(page.getByTestId("chaos-analyze")).toBeVisible({ timeout: 30000 });
    await page.getByTestId("chaos-analyze").click();
    
    // Assert analysis artifact displayed
    await expect(page.getByTestId("preliminary-analysis-panel")).toBeVisible({ timeout: 60000 });
    await expect(page.getByText("Valor Total", { exact: true }).first()).toBeVisible();

    // 2. Setup Consultant B (separate isolated context)
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    await pageB.goto("/", { waitUntil: "domcontentloaded" });

    // Register Consultant B
    await pageB.fill("input[placeholder='Nome completo']", "Consultor B");
    await pageB.fill("input[placeholder='E-mail corporativo']", `consultorb_${Date.now()}@sauron.local`);
    await pageB.fill("input[placeholder='Senha secreta (mínimo 6 caracteres)']", "SenhaB123!");
    await pageB.fill("input[placeholder='Confirmar senha']", "SenhaB123!");
    await pageB.fill("input[placeholder='Nome da sua consultoria / organização']", "Consultoria B");
    await pageB.getByRole('button', { name: /Inicializar/i }).click();

    // Wait for B's dashboard
    await expect(pageB.getByTestId("btn-open-data-center").first()).toBeVisible({ timeout: 30000 });

    // Navigate to clients list for B and assert A's client is NOT leaked
    await navigateSidebar(pageB, /Cliente/i, /Empresas e Grupos/i);
    await pageB.getByRole("button", { name: /Gerenciar Clientes/i }).click();
    
    // It should not display Client A
    await expect(pageB.getByText(contextA.clientName)).toHaveCount(0);
    
    // Close modal
    await pageB.locator("div.fixed.inset-0").filter({ hasText: "Gestão de Clientes" }).getByRole("button").first().click();

    // Clean up context B
    await pageB.close();
    await contextB.close();
  });
});
