import { expect, ensureConsultantSession, navigateSidebar, test } from "./e2eTest";
import * as fs from "node:fs";
import * as XLSX from "xlsx";
import {
  createCanonicalClientEngagementStructure,
  importSpreadsheetThroughUi,
} from "./canonicalJourneyHelpers";

function writeWorkbook(filePath: string, company: string, value: number): void {
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet([
    ["Empresa", "Data", "Cliente", "Produto", "Valor", "Quantidade"],
    [company, "2026-01-01", "Cliente Um", "Produto A", value / 2, 1],
    [company, "2026-01-02", "Cliente Dois", "Produto B", value / 2, 2],
  ]);
  XLSX.utils.book_append_sheet(workbook, sheet, "Dados");
  XLSX.writeFile(workbook, filePath);
}

async function openDashboard(page: Parameters<typeof navigateSidebar>[0]): Promise<void> {
  await navigateSidebar(page, /Análise/i, /Visão Executiva/i);
  await expect(page.getByTestId("active-dataset-raw-preview")).toBeVisible({ timeout: 30000 });
}

test.describe("MVP core delivery", () => {
  test("entrega dados, configuração simples e artefatos executivos pela UI", async ({ page }, testInfo) => {
    test.setTimeout(180000);
    const firstFile = testInfo.outputPath("mvp-empresa-a.xlsx");
    const secondFile = testInfo.outputPath("mvp-empresa-b.xlsx");
    writeWorkbook(firstFile, "Empresa MVP A", 300);
    writeWorkbook(secondFile, "Empresa MVP B", 900);

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await ensureConsultantSession(page);

    await createCanonicalClientEngagementStructure(page, `Core ${Date.now()}`);
    await importSpreadsheetThroughUi(page, firstFile, "mvp-empresa-a.xlsx");
    await openDashboard(page);
    const preview = page.getByTestId("active-dataset-raw-preview");
    for (const column of ["Empresa", "Data", "Cliente", "Produto", "Valor", "Quantidade"]) {
      await expect(preview.getByText(column, { exact: true }).first()).toBeVisible();
    }
    await expect(preview).toContainText("Produto A");
    await expect(preview).toContainText("150");

    await page.reload({ waitUntil: "domcontentloaded" });
    await ensureConsultantSession(page);
    await openDashboard(page);
    const reloadedPreview = page.getByTestId("active-dataset-raw-preview");
    await expect(reloadedPreview).toContainText("Produto A");
    await expect(reloadedPreview).toContainText("150");

    await importSpreadsheetThroughUi(page, secondFile, "mvp-empresa-b.xlsx");
    await openDashboard(page);
    const secondPreview = page.getByTestId("active-dataset-raw-preview");
    await expect(secondPreview).toContainText("mvp-empresa-b.xlsx");
    await expect(secondPreview).toContainText("Empresa MVP A");

    await navigateSidebar(page, /Fontes/i, /Fontes de Dados/i);
    const firstRow = page.locator("tr").filter({ hasText: "mvp-empresa-a.xlsx" }).first();
    await expect(firstRow.getByTitle("Abrir como fonte única")).toBeVisible({ timeout: 15000 });
    await firstRow.getByTitle("Abrir como fonte única").click();
    await openDashboard(page);
    const firstPreview = page.getByTestId("active-dataset-raw-preview");
    await expect(firstPreview).toContainText("mvp-empresa-a.xlsx");
    await expect(firstPreview).not.toContainText("Empresa MVP B");

    await navigateSidebar(page, /Preparar Decisão/i, /Apresentações/i);
    await expect(page.getByText("Configuração Pendente", { exact: true }).first()).toBeVisible({ timeout: 30000 });

    await navigateSidebar(page, /Conduzir Sessão/i, /Preparação da Reunião/i);
    await expect(page.getByText("Preparação da Reunião", { exact: true })).toBeVisible({ timeout: 30000 });
    await page.getByRole("button", { name: /Iniciar Reunião/i }).click();
    await expect(page.locator("#executive-session-root")).toBeVisible({ timeout: 30000 });
    const notes = page.locator("textarea").first();
    if (await notes.isVisible({ timeout: 5000 }).catch(() => false)) {
      await notes.fill("Decisão: acompanhar o valor recebido na próxima reunião.");
      const decisionButton = page
        .locator("#executive-session-root button")
        .filter({ hasText: "Decisão" })
        .first();
      if (await decisionButton.isVisible({ timeout: 5000 }).catch(() => false)) await decisionButton.click();
    }
    await page.getByRole("button", { name: /Encerrar Reunião/i }).click();
    await expect(page.getByText(/RESUMO EXECUTIVO DA REUNIÃO/i)).toBeVisible({ timeout: 30000 });
    await page.getByRole("button", { name: /Visualizar Ata/i }).click();
    await expect(page.locator("#printable-ata-area")).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: /Fechar Impressão/i }).click();
    const toastCloseButtons = page.locator('[role="status"] button[aria-label="Fechar aviso"]');
    for (let index = 0; index < 3; index += 1) {
      const visibleToast = toastCloseButtons.last();
      if (!(await visibleToast.isVisible({ timeout: 500 }).catch(() => false))) break;
      await visibleToast.click({ force: true });
    }
    // A stacked toast can cover the modal action; dispatch to the uniquely
    // identified action after the UI state has been validated above.
    await page.getByRole("button", { name: /Sincronizar e Concluir/i }).dispatchEvent("click");
    await expect(page.locator("#executive-session-root")).not.toBeVisible({ timeout: 30000 });

    await page.reload({ waitUntil: "domcontentloaded" });
    await ensureConsultantSession(page);
    await openDashboard(page);
    await expect(page.getByTestId("active-dataset-raw-preview")).toBeVisible({ timeout: 30000 });

    await page.getByRole("button", { name: /Sair|Logout/i }).first().click().catch(() => undefined);
    const emailInput = page.locator("input[placeholder='E-mail']");
    if (await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await emailInput.fill("consultor.rc1@sauron.local");
      await page.locator("input[placeholder='Senha']").fill("SenhaRC1!");
      await page.getByRole("button", { name: /Entrar no Sauron/i }).click();
    }
    await ensureConsultantSession(page);
    await openDashboard(page);
    await expect(page.getByTestId("active-dataset-raw-preview")).toBeVisible({ timeout: 30000 });

    fs.unlinkSync(firstFile);
    fs.unlinkSync(secondFile);
  });
});
