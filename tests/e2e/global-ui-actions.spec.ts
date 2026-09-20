import fs from "node:fs";
import path from "node:path";
import { expect, ensureConsultantSession, navigateSidebar, test } from "./e2eTest";
import { createCanonicalClientEngagementStructure, importSpreadsheetThroughUi } from "./canonicalJourneyHelpers";

test.describe("Product Completion Gate 1.0 — Global UI Actions", () => {
  test("percorre todas as telas principais e valida ausência de botões e links mortos", async ({ page, consoleErrors, consoleWarnings, pageErrors }) => {
    test.setTimeout(240000);
    const filePath = "/home/natalicorreia/Downloads/Consulta Financeiro Topp.xls";
    expect(fs.existsSync(filePath)).toBe(true);

    // 1. Login e inicialização da sessão
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await ensureConsultantSession(page);

    // 2. Criação canônica de Cliente + Engajamento + Estrutura
    const suffix = `GATE1_${Date.now()}`;
    const context = await createCanonicalClientEngagementStructure(page, suffix);

    // 3. Validação da Carteira e Painel Organizacional
    await navigateSidebar(page, /Cliente/i, /Empresas e Grupos/i);
    await expect(page.getByTestId("engagement-organization-panel")).toBeVisible();
    await page.getByTestId("open-consulting-home-btn").click();
    await expect(page.getByTestId("consulting-home-page")).toBeVisible({ timeout: 30000 });

    // 4. Validação dos botões da Consulting Home
    await expect(page.getByTestId("consulting-next-action-cta")).toBeVisible();
    await page.getByTestId("consulting-next-action-cta").click();

    // 5. Central de Dados e Importação Real
    await importSpreadsheetThroughUi(page, filePath, path.basename(filePath));

    // 6. Análise da Fonte
    await navigateSidebar(page, /Análise/i, /Análise da fonte/i);
    await expect(page.getByTestId("chaos-analyze")).toBeVisible({ timeout: 30000 });
    await page.getByTestId("chaos-analyze").click();
    await expect(page.getByTestId("analysis-completed-panel")).toBeVisible({ timeout: 90000 });

    // 7. Visão Executiva & Centro de Entregáveis
    await page.getByTestId("open-executive-summary").click();
    await expect(page.getByTestId("executive-summary-panel")).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId("executive-deliverables-center")).toBeVisible({ timeout: 30000 });

    // 8. Teste de Ações de Exportação
    const pdfDownloadPromise = page.waitForEvent("download");
    await page.getByTestId("export-executive-pdf").click();
    const pdfDownload = await pdfDownloadPromise;
    expect(pdfDownload.suggestedFilename()).toContain(".pdf");

    const pptDownloadPromise = page.waitForEvent("download");
    await page.getByTestId("export-executive-pptx").click();
    const pptDownload = await pptDownloadPromise;
    expect(pptDownload.suggestedFilename()).toContain(".pptx");

    const snapshotLabel = `Snapshot Gate1 ${Date.now()}`;
    await page.getByLabel("Nome do snapshot").fill(snapshotLabel);
    await page.getByTestId("save-executive-snapshot").click();
    await expect(page.getByTestId("deliverables-operation-status")).toContainText(/SNAPSHOT SALVO COM SUCESSO/i);

    // 9. Editor de Apresentações (Presentation Builder)
    await navigateSidebar(page, /Decisão/i, /Apresentações/i);
    await expect(page.getByTestId("presentation-editor")).toBeVisible({ timeout: 30000 });
    const newSlideTitle = `Lâmina Executiva Gate 1 ${Date.now()}`;
    await page.getByLabel("Título do Slide").fill(newSlideTitle);
    await page.getByTestId("save-presentation-edits").click();
    await expect(page.getByTestId("presentation-save-status")).toContainText(/Edição salva/i);

    // 10. Navegação pelos 5 Módulos Analíticos
    await navigateSidebar(page, /Diagnosticar/i, /Financeiro/i);
    await expect(page.getByTestId("preliminary-financial-dashboard")).toBeVisible({ timeout: 30000 });

    await navigateSidebar(page, /Diagnosticar/i, /Comercial/i);
    await expect(page.getByTestId("module-status-commercial")).toBeVisible({ timeout: 30000 });

    // 11. Meeting Mode: entrada, navegação, notas e finalização
    await navigateSidebar(page, /Cliente/i, /Empresas e Grupos/i);
    await page.getByTestId("open-consulting-home-btn").click();
    await expect(page.getByTestId("consulting-home-page")).toBeVisible({ timeout: 30000 });
    await page.getByTestId("consulting-start-meeting-btn").click();
    await expect(page.locator("#executive-session-root")).toBeVisible({ timeout: 30000 });

    const acceptLgpd = page.getByRole("button", { name: /Aceitar Todos/i });
    if (await acceptLgpd.isVisible({ timeout: 1000 }).catch(() => false)) {
      await acceptLgpd.click().catch(() => undefined);
    }

    await page.getByTestId("meeting-next-chapter-btn").click();
    await page.getByTestId("meeting-prev-chapter-btn").click();

    const decision = `Decisão Certificada ${Date.now()}`;
    const pending = `Pendência Auditada ${Date.now()}`;
    await page.getByTestId("meeting-quick-notes-textarea").fill(`${decision}\n${pending}`);
    await expect(page.getByTestId("parsed-notes-list")).toBeVisible({ timeout: 15000 });

    await page.getByTestId("convert-note-decision").first().click();
    await page.getByTestId("convert-note-pending").first().click();

    await page.getByTestId("end-meeting-btn").click();
    await expect(page.getByTestId("finalize-meeting-session-btn")).toBeVisible({ timeout: 15000 });
    await page.getByTestId("finalize-meeting-session-btn").click();

    // 12. Retorno à Home e persistência pós-reload
    await expect(page.getByTestId("consulting-home-page")).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId("last-meeting-decisions")).toContainText(decision);
    await expect(page.getByTestId("last-meeting-pending-list")).toContainText(pending);

    await page.reload({ waitUntil: "domcontentloaded" });
    await ensureConsultantSession(page);
    await navigateSidebar(page, /Cliente/i, /Empresas e Grupos/i);
    await page.getByTestId("open-consulting-home-btn").click();
    await expect(page.getByTestId("consulting-home-page")).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId("last-meeting-decisions")).toContainText(decision);
    await expect(page.getByTestId("last-meeting-pending-list")).toContainText(pending);

    // 13. Verificação de ausência de erros e conformidade estrita
    const visibleText = await page.locator("body").innerText();
    expect(visibleText).not.toMatch(/DEMO_DATA|Grupo Alpha|Topázio Demo/i);
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
    expect(consoleWarnings).toEqual([]);
  });
});
