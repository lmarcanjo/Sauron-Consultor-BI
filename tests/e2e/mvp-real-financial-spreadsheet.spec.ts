/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from "node:fs";
import path from "node:path";
import { expect, ensureConsultantSession, navigateSidebar, test } from "./e2eTest";
import {
  createCanonicalClientEngagementStructure,
  importSpreadsheetThroughUi,
} from "./canonicalJourneyHelpers";

test.describe("MVP real financial spreadsheet", () => {
  test("exibe a planilha financeira real em modo preliminar com totais corretos e persiste no reload", async ({ page, consoleErrors, pageErrors }, testInfo) => {
    test.setTimeout(180000);
    const filePath = "/home/natalicorreia/Downloads/Consulta Financeiro Topp.xls";
    expect(fs.existsSync(filePath)).toBe(true);

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await ensureConsultantSession(page);
    await createCanonicalClientEngagementStructure(page, `FinanceiroReal_${Date.now()}`);
    await importSpreadsheetThroughUi(page, filePath, path.basename(filePath));

    await navigateSidebar(page, /Análise/i, /Análise da fonte/i);
    await expect(page.getByTestId("chaos-analyze")).toBeVisible({ timeout: 30000 });
    
    // Run Analisar Dados
    await page.getByTestId("chaos-analyze").click();
    
    // Assert visual panel is mounted
    await expect(page.getByTestId("preliminary-analysis-panel")).toBeVisible({ timeout: 60000 });

    // Assert exact totals from independent oracle
    // VALUE_TOTAL: 8.668.993,62
    await expect(page.getByText("8.668.993,62").first()).toBeVisible({ timeout: 15000 });
    // PAID_VALUE_TOTAL: 32.479,07
    await expect(page.getByText("32.479,07").first()).toBeVisible({ timeout: 15000 });
    // BALANCE_TOTAL: 8.636.514,55
    await expect(page.getByText("8.636.514,55").first()).toBeVisible({ timeout: 15000 });

    // Assert row count (data rows = 205)
    await expect(page.locator("strong").filter({ hasText: "205" }).first()).toBeVisible();

    // Reload page to test persistence recovery
    await page.reload({ waitUntil: "domcontentloaded" });

    // Ensure we are logged in and navigate back
    await ensureConsultantSession(page);
    await navigateSidebar(page, /Análise/i, /Análise da fonte/i);

    // Assert that the panel is immediately visible without clicking "ANALISAR DADOS" again
    await expect(page.getByTestId("preliminary-analysis-panel")).toBeVisible({ timeout: 30000 });
    await expect(page.getByText("8.668.993,62").first()).toBeVisible();

    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);

    await testInfo.attach("real-financial-source-metrics", {
      body: JSON.stringify({
        fileName: path.basename(filePath),
        valueTotal: 8668993.62,
        paidValueTotal: 32479.07,
        balanceTotal: 8636514.55,
        rowCount: 205,
      }, null, 2),
      contentType: "application/json",
    });
  });
});
