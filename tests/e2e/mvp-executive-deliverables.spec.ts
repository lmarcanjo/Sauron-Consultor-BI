import fs from "node:fs";
import path from "node:path";
import { expect, ensureConsultantSession, navigateSidebar, test } from "./e2eTest";
import { createCanonicalClientEngagementStructure, importSpreadsheetThroughUi } from "./canonicalJourneyHelpers";

test.describe("MVP-3 executive deliverables", () => {
  test("gera resumo, dashboard e apresentação a partir da análise persistida", async ({ page, consoleErrors, consoleWarnings, pageErrors }) => {
    test.setTimeout(240000);
    const filePath = "/home/natalicorreia/Downloads/Consulta Financeiro Topp.xls";
    expect(fs.existsSync(filePath)).toBe(true);

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await ensureConsultantSession(page);
    await createCanonicalClientEngagementStructure(page, `MVP3_${Date.now()}`);
    await importSpreadsheetThroughUi(page, filePath, path.basename(filePath));

    await navigateSidebar(page, /Análise/i, /Análise da fonte/i);
    await page.getByTestId("chaos-analyze").click();
    await expect(page.getByTestId("analysis-completed-panel")).toBeVisible({ timeout: 90000 });
    await expect(page.getByTestId("open-executive-summary")).toBeVisible();
    await expect(page.getByTestId("generate-executive-presentation")).toBeVisible();

    await page.getByTestId("open-executive-summary").click();
    await expect(page.getByTestId("executive-summary-panel")).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId("summary-value-total")).toContainText("8.668.993,62");
    await expect(page.getByTestId("summary-paid-total")).toContainText("32.479,07");
    await expect(page.getByTestId("summary-balance-total")).toContainText("8.636.514,55");

    await expect(page.getByTestId("executive-dashboard-page")).toBeVisible();
    await expect(page.getByTestId("financial-kpi-cards")).toBeVisible();
    await expect(page.getByTestId("executive-visualization-grid").locator("[data-testid^='executive-visualization-']")).toHaveCount(await page.getByTestId("executive-visualization-grid").locator("[data-testid^='executive-visualization-']").count());
    expect(await page.getByTestId("executive-visualization-grid").locator("[data-testid^='executive-visualization-']").count()).toBeGreaterThanOrEqual(4);
    await expect(page.getByTestId("executive-module-status")).toContainText("Financeiro");
    await expect(page.getByTestId("executive-module-status")).toContainText("Comercial");
    await expect(page.getByTestId("executive-module-status")).toContainText("Estoque");
    await expect(page.getByTestId("executive-module-status")).toContainText("Itens");
    await expect(page.getByTestId("executive-module-status")).toContainText("Pós-vendas");

    await page.getByTestId("open-executive-presentation").click();
    await expect(page.getByTestId("presentation-editor")).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId("presentation-slides").locator("div").first()).toBeVisible();

    await page.reload({ waitUntil: "domcontentloaded" });
    await ensureConsultantSession(page);
    await navigateSidebar(page, /Análise/i, /Visão Executiva/i);
    await expect(page.getByTestId("executive-summary-panel")).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId("summary-value-total")).toContainText("8.668.993,62");
    await navigateSidebar(page, /Decisão/i, /Apresentações/i);
    await expect(page.getByTestId("presentation-editor")).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId("presentation-slides")).toContainText("Resumo Executivo");

    const visibleText = await page.locator("body").innerText();
    expect(visibleText).not.toMatch(/DEMO_DATA|Grupo Alpha|Topázio Demo/i);
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
    expect(consoleWarnings).toEqual([]);
  });
});
