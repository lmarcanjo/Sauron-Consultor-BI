import fs from "node:fs";
import path from "node:path";
import { expect, ensureConsultantSession, navigateSidebar, test } from "./e2eTest";
import { createCanonicalClientEngagementStructure, importSpreadsheetThroughUi } from "./canonicalJourneyHelpers";

test.describe("MVP-4 client delivery", () => {
  test("gera PDF, PowerPoint editável e snapshot com histórico após reload", async ({ page, consoleErrors, consoleWarnings, pageErrors }) => {
    test.setTimeout(240000);
    const filePath = "/home/natalicorreia/Downloads/Consulta Financeiro Topp.xls";
    expect(fs.existsSync(filePath)).toBe(true);

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await ensureConsultantSession(page);
    await createCanonicalClientEngagementStructure(page, `MVP4_${Date.now()}`);
    await importSpreadsheetThroughUi(page, filePath, path.basename(filePath));
    await navigateSidebar(page, /Análise/i, /Análise da fonte/i);
    await page.getByTestId("chaos-analyze").click();
    await expect(page.getByTestId("analysis-completed-panel")).toBeVisible({ timeout: 90000 });
    await page.getByTestId("open-executive-summary").click();
    await expect(page.getByTestId("executive-deliverables-center")).toBeVisible({ timeout: 30000 });

    const pdfDownloadPromise = page.waitForEvent("download");
    await page.getByTestId("export-executive-pdf").click();
    const pdfDownload = await pdfDownloadPromise;
    const pdfPath = `/tmp/${await pdfDownload.suggestedFilename()}`;
    await pdfDownload.saveAs(pdfPath);
    const pdf = fs.readFileSync(pdfPath);
    expect(pdfDownload.suggestedFilename()).toMatch(/^ASTERION_.+_Resumo_Executivo_\d{4}-\d{2}-\d{2}\.pdf$/);
    expect(pdf.length).toBeGreaterThan(0);
    expect(pdf.toString("utf8")).toContain("%PDF-1.4");
    expect(pdf.toString("utf8")).toContain("8.668.993,62");
    expect(pdf.toString("utf8")).toContain("32.479,07");
    expect(pdf.toString("utf8")).toContain("8.636.514,55");

    const pptDownloadPromise = page.waitForEvent("download");
    await page.getByTestId("export-executive-pptx").click();
    const pptDownload = await pptDownloadPromise;
    const pptPath = `/tmp/${await pptDownload.suggestedFilename()}`;
    await pptDownload.saveAs(pptPath);
    const ppt = fs.readFileSync(pptPath);
    expect(pptDownload.suggestedFilename()).toMatch(/^ASTERION_.+_Apresentacao_Executiva_\d{4}-\d{2}-\d{2}\.pptx$/);
    expect(ppt.length).toBeGreaterThan(0);
    expect(ppt.subarray(0, 2).toString()).toBe("PK");
    expect((ppt.toString("utf8").match(/<p:sldId id=/g) || []).length).toBe(8);
    expect(ppt.toString("utf8")).toContain("8.668.993,62");
    await expect(page.getByTestId("deliverables-operation-status")).toContainText(/POWERPOINT GERADO COM SUCESSO/i);

    await navigateSidebar(page, /Decisão/i, /Apresentações/i);
    await expect(page.getByTestId("presentation-editor")).toBeVisible({ timeout: 30000 });
    const editedTitle = `Título editado MVP-4 ${Date.now()}`;
    await page.getByLabel("Título do Slide").fill(editedTitle);
    await page.getByTestId("save-presentation-edits").click();
    await expect(page.getByTestId("presentation-save-status")).toContainText(/Edição salva/i);

    await navigateSidebar(page, /Análise/i, /Visão Executiva/i);
    await expect(page.getByTestId("executive-deliverables-center")).toBeVisible({ timeout: 30000 });
    const editedPptDownloadPromise = page.waitForEvent("download");
    await page.getByTestId("export-executive-pptx").click();
    const editedPptDownload = await editedPptDownloadPromise;
    const editedPptPath = `/tmp/${await editedPptDownload.suggestedFilename()}`;
    await editedPptDownload.saveAs(editedPptPath);
    const editedPpt = fs.readFileSync(editedPptPath);
    expect(editedPpt.toString("utf8")).toContain(editedTitle);

    const snapshotLabel = `Fechamento MVP-4 ${Date.now()}`;
    await page.getByLabel("Nome do snapshot").fill(snapshotLabel);
    await page.getByTestId("save-executive-snapshot").click();
    await expect(page.getByTestId("deliverables-operation-status")).toContainText(/SNAPSHOT SALVO COM SUCESSO/i);
    await expect(page.getByTestId("executive-snapshot-history")).toContainText(snapshotLabel);

    await page.reload({ waitUntil: "domcontentloaded" });
    await ensureConsultantSession(page);
    await navigateSidebar(page, /Análise/i, /Visão Executiva/i);
    await expect(page.getByTestId("executive-deliverables-center")).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId("executive-snapshot-history")).toContainText(snapshotLabel);
    await expect(page.getByTestId("executive-summary-panel")).toBeVisible();
    await expect(page.getByTestId("summary-value-total")).toContainText("8.668.993,62");

    const visibleText = await page.locator("body").innerText();
    expect(visibleText).not.toMatch(/DEMO_DATA|Grupo Alpha|Topázio Demo/i);
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
    expect(consoleWarnings).toEqual([]);
  });
});
