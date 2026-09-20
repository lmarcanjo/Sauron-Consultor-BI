import fs from "node:fs";
import path from "node:path";
import { expect, ensureConsultantSession, navigateSidebar, test } from "./e2eTest";
import { createCanonicalClientEngagementStructure, importSpreadsheetThroughUi } from "./canonicalJourneyHelpers";

test.describe("MVP-5 Guided Consulting Experience", () => {
  test("executa a jornada completa guiada com próxima ação, apresentações, entregáveis, reunião e persistência pós-reload", async ({ page, consoleErrors, consoleWarnings, pageErrors }) => {
    test.setTimeout(240000);
    const filePath = "/home/natalicorreia/Downloads/Consulta Financeiro Topp.xls";
    expect(fs.existsSync(filePath)).toBe(true);

    // 1. Abrir aplicação e login
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await ensureConsultantSession(page);

    // 2. Novo Cliente + Engajamento + Estrutura
    const suffix = `MVP5_${Date.now()}`;
    const context = await createCanonicalClientEngagementStructure(page, suffix);

    // 3. Abrir Consulting Home via botão dedicado ou card
    await page.getByTestId("open-consulting-home-btn").click();
    await expect(page.getByTestId("consulting-home-page")).toBeVisible({ timeout: 30000 });

    // 4. Validar Consulting Home e Próxima Ação
    await expect(page.getByTestId("consulting-client-name")).toContainText(context.clientName);
    await expect(page.getByTestId("consulting-engagement-name")).toContainText(context.engagementName);
    // Como a estrutura já foi criada pelo helper, a próxima ação é ADICIONAR DADOS
    await expect(page.getByTestId("consulting-next-action-banner")).toContainText(/ADICIONAR DADOS/i);

    // 5. Adicionar fonte real
    await importSpreadsheetThroughUi(page, filePath, path.basename(filePath));

    // 6. Retornar à Consulting Home e validar próxima ação = ANALISAR DADOS
    await navigateSidebar(page, /Cliente/i, /Empresas e Grupos/i);
    await page.getByTestId("open-consulting-home-btn").click();
    await expect(page.getByTestId("consulting-home-page")).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId("consulting-next-action-banner")).toContainText(/ANALISAR DADOS/i);

    // 7. Clicar na CTA de próxima ação ou navegar para Análise
    await page.getByTestId("consulting-next-action-cta").click();
    await expect(page.getByTestId("chaos-analyze")).toBeVisible({ timeout: 30000 });
    await page.getByTestId("chaos-analyze").click();
    await expect(page.getByTestId("analysis-completed-panel")).toBeVisible({ timeout: 90000 });

    // 8. Abrir Resumo Executivo e validar valores
    await page.getByTestId("open-executive-summary").click();
    await expect(page.getByTestId("executive-summary-panel")).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId("summary-value-total")).toContainText("8.668.993,62");
    await expect(page.getByTestId("summary-paid-total")).toContainText("32.479,07");
    await expect(page.getByTestId("summary-balance-total")).toContainText("8.636.514,55");

    // 9. Gerar Entregáveis (PDF, PPTX, Snapshot)
    await expect(page.getByTestId("executive-deliverables-center")).toBeVisible();

    const pdfDownloadPromise = page.waitForEvent("download");
    await page.getByTestId("export-executive-pdf").click();
    const pdfDownload = await pdfDownloadPromise;
    const pdfPath = `/tmp/${await pdfDownload.suggestedFilename()}`;
    await pdfDownload.saveAs(pdfPath);
    const pdf = fs.readFileSync(pdfPath);
    expect(pdf.length).toBeGreaterThan(0);
    expect(pdf.toString("utf8")).toContain("%PDF-1.4");

    const pptDownloadPromise = page.waitForEvent("download");
    await page.getByTestId("export-executive-pptx").click();
    const pptDownload = await pptDownloadPromise;
    const pptPath = `/tmp/${await pptDownload.suggestedFilename()}`;
    await pptDownload.saveAs(pptPath);
    const ppt = fs.readFileSync(pptPath);
    expect(ppt.length).toBeGreaterThan(0);
    expect(ppt.subarray(0, 2).toString()).toBe("PK");
    expect((ppt.toString("utf8").match(/<p:sldId id=/g) || []).length).toBe(8);

    const snapshotLabel = `Snapshot MVP-5 ${Date.now()}`;
    await page.getByLabel("Nome do snapshot").fill(snapshotLabel);
    await page.getByTestId("save-executive-snapshot").click();
    await expect(page.getByTestId("deliverables-operation-status")).toContainText(/SNAPSHOT SALVO COM SUCESSO/i);

    // 10. Voltar à Consulting Home e validar Meeting Readiness
    await navigateSidebar(page, /Cliente/i, /Empresas e Grupos/i);
    await page.getByTestId("open-consulting-home-btn").click();
    await expect(page.getByTestId("consulting-home-page")).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId("consulting-readiness-panel")).toBeVisible();
    await expect(page.getByTestId("consulting-readiness-panel")).toContainText(/REUNIÃO PRONTA/i);

    // 11. Iniciar Reunião (Meeting Mode)
    await page.getByTestId("consulting-start-meeting-btn").click();
    await expect(page.locator("#executive-session-root")).toBeVisible({ timeout: 30000 });

    const acceptLgpd = page.getByRole("button", { name: /Aceitar Todos/i });
    if (await acceptLgpd.isVisible({ timeout: 1000 }).catch(() => false)) {
      await acceptLgpd.click().catch(() => undefined);
    }

    // 12. Navegar por slides / capítulos
    await expect(page.getByTestId("meeting-next-chapter-btn")).toBeVisible();
    await page.getByTestId("meeting-next-chapter-btn").click();
    await page.getByTestId("meeting-next-chapter-btn").click();

    // 13. Registrar uma Decisão e uma Pendência
    const decisionText = `Decisão Estratégica MVP-5 ${Date.now()}`;
    const pendingText = `Pendência Operacional MVP-5 ${Date.now()}`;
    await page.getByTestId("meeting-quick-notes-textarea").fill(`${decisionText}\n${pendingText}`);
    await expect(page.getByTestId("parsed-notes-list")).toBeVisible({ timeout: 15000 });

    await page.getByTestId("convert-note-decision").first().click();
    await page.getByTestId("convert-note-pending").first().click();

    // 14. Encerrar Reunião
    await page.getByTestId("end-meeting-btn").click();
    await expect(page.getByTestId("finalize-meeting-session-btn")).toBeVisible({ timeout: 15000 });
    await page.getByTestId("finalize-meeting-session-btn").click();

    // 15. Validar retorno à Consulting Home e exibição da última reunião
    await expect(page.getByTestId("consulting-home-page")).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId("last-meeting-decisions")).toContainText(decisionText);
    await expect(page.getByTestId("last-meeting-pending-list")).toContainText(pendingText);

    // 16. Reload e validação de persistência
    await page.reload({ waitUntil: "domcontentloaded" });
    await ensureConsultantSession(page);
    await navigateSidebar(page, /Cliente/i, /Empresas e Grupos/i);
    await page.getByTestId("open-consulting-home-btn").click();
    await expect(page.getByTestId("consulting-home-page")).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId("last-meeting-decisions")).toContainText(decisionText);
    await expect(page.getByTestId("last-meeting-pending-list")).toContainText(pendingText);

    // 17. Validar ausência de erros e demo data
    const visibleText = await page.locator("body").innerText();
    expect(visibleText).not.toMatch(/DEMO_DATA|Grupo Alpha|Topázio Demo/i);
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
    expect(consoleWarnings).toEqual([]);
  });
});
