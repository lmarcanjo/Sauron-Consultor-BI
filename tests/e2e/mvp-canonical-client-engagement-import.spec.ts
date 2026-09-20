import fs from "node:fs";
import path from "node:path";
import { expect, ensureConsultantSession, navigateSidebar, test } from "./e2eTest";
import {
  createCanonicalClientEngagementStructure,
  importSpreadsheetThroughUi,
  openPreliminaryAnalysis,
} from "./canonicalJourneyHelpers";

test.describe("Recovery Gate MVP-1.1 — jornada canônica", () => {
  test("Cliente -> Engajamento -> Estrutura -> fonte -> análise preliminar", async ({ page, consoleErrors, consoleWarnings, pageErrors }, testInfo) => {
    test.setTimeout(180000);
    const filePath = "/home/natalicorreia/Downloads/Consulta Financeiro Topp.xls";
    expect(fs.existsSync(filePath)).toBe(true);

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await ensureConsultantSession(page);
    const context = await createCanonicalClientEngagementStructure(page, `${Date.now()}`);
    await importSpreadsheetThroughUi(page, filePath, path.basename(filePath));
    await openPreliminaryAnalysis(page);

    await navigateSidebar(page, /Análise/i, /Visão Executiva/i);
    const preview = page.getByTestId("active-dataset-raw-preview");
    await expect(preview).toBeVisible({ timeout: 30000 });
    await expect(preview).toContainText(path.basename(filePath));
    await expect(page.getByText(/linhas|colunas/i).first()).toBeVisible();

    await page.reload({ waitUntil: "domcontentloaded" });
    await ensureConsultantSession(page);
    await navigateSidebar(page, /Cliente/i, /Empresas e Grupos/i);
    await expect(page.getByTestId("engagement-organization-panel")).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId("organizational-scope-list")).toContainText(context.groupName);
    await expect(page.getByTestId("organizational-scope-list")).toContainText(context.companyName);
    await expect(page.getByTestId("organizational-scope-list")).toContainText(context.unitName);

    await navigateSidebar(page, /Fontes/i, /Fontes de Dados/i);
    await expect(page.getByText(path.basename(filePath), { exact: true }).first()).toBeVisible({ timeout: 30000 });

    const visibleText = await page.locator("body").innerText();
    expect(visibleText).not.toMatch(/DEMO_DATA|Grupo Alpha|Topázio Demo/i);
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
    expect(consoleWarnings).toEqual([]);

    await testInfo.attach("recovery-gate-context", {
      body: JSON.stringify({
        clientName: context.clientName,
        engagementName: context.engagementName,
        sourceName: path.basename(filePath),
        mode: "PRELIMINARY",
      }, null, 2),
      contentType: "application/json",
    });
  });
});
