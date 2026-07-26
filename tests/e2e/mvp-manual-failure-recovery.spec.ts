import { expect, ensureConsultantSession, navigateSidebar, test } from "./e2eTest";
import * as fs from "node:fs";
import { cloneManualValidationLegacyBrowserState } from "../fixtures/legacy-browser-state/manual-validation-2026-07";

function writeWorkbook(filePath: string, firstValue = "38,073"): void {
  fs.writeFileSync(filePath, [
    "Empresa,Data,Cliente,Produto,Valor,Quantidade,Observação",
    `Consultoria ToDD,2026-07-01,Cliente A,Servico A,"${firstValue}",1,Primeiro registro`,
    'Consultoria ToDD,2026-07-02,Cliente B,Servico B,"1,904",2,Segundo registro',
  ].join("\n"));
}

test.describe("MVP manual failure recovery", () => {
  test("repara storage legado e mantém a jornada data-first confirmada", async ({ page }, testInfo) => {
    test.setTimeout(180000);
    const filePath = testInfo.outputPath("consultoria-todd-recovery.csv");
    const secondFilePath = testInfo.outputPath("consultoria-todd-recovery-2.csv");
    const fixture = cloneManualValidationLegacyBrowserState();
    writeWorkbook(filePath);

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.evaluate(async ({ context, activeDataset, legacyDataset, sourceBinding, workspaceRegistry, oldKeys }) => {
      localStorage.clear();
      sessionStorage.clear();
      await new Promise<void>(resolve => {
        const request = indexedDB.deleteDatabase("SauronSpreadsheetDB");
        request.onsuccess = () => resolve();
        request.onerror = () => resolve();
        request.onblocked = () => resolve();
      });

      localStorage.setItem("sauron_enterprises", JSON.stringify([
        { id: "group_consultoria", name: "Grupo Consultoria", type: "Grupo", companyIds: ["company_consultoria"], workbookIds: [] },
        { id: "company_consultoria", name: "Consultoria ToDD", type: "Empresa", parentId: "group_consultoria", unitIds: ["unit_geral"], workbookIds: [] },
        { id: "unit_geral", name: "Geral", type: "Unidade", parentId: "company_consultoria", workbookIds: [] },
      ]));
      localStorage.setItem("sauron_source_enterprise_bindings_v1", JSON.stringify([sourceBinding]));
      localStorage.setItem("sauron_active_enterprise_context", JSON.stringify(context));
      localStorage.setItem("sauron_ds_active_dataset", JSON.stringify(activeDataset));
      localStorage.setItem(oldKeys.dataset, JSON.stringify(legacyDataset));
      localStorage.setItem(oldKeys.upload, JSON.stringify({ fileName: "consultoria-operacional.xlsx" }));
      localStorage.setItem("sauron_workspace_registry", JSON.stringify(workspaceRegistry));
      localStorage.setItem("sauron_active_consulting_config", JSON.stringify({
        workspaceId: "ws_legacy_project",
        groupId: "group_consultoria",
        companyId: "company_consultoria",
        enabledModules: ["diagnostico", "financeiro", "dre", "comercial", "pessoas"],
        businessAreas: [
          { id: "financeiro", name: "Resultado Financeiro", relatedFields: [], relatedMetrics: [], visible: true },
          { id: "comercial", name: "Comercial", relatedFields: [], relatedMetrics: [], visible: true },
          { id: "pessoas", name: "Pessoas", relatedFields: [], relatedMetrics: [], visible: true },
        ],
        selectedFields: {},
        customMetrics: [],
        displayDictionary: {},
        createdAt: new Date(0).toISOString(),
        updatedAt: new Date(0).toISOString(),
      }));
    }, fixture);

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect.poll(() => page.evaluate(() => localStorage.getItem("sauron_local_state_schema_version")), { timeout: 30000 }).toBe("3");
    const repaired = await page.evaluate(() => ({
      version: localStorage.getItem("sauron_local_state_schema_version"),
      context: JSON.parse(localStorage.getItem("sauron_active_enterprise_context") || "{}"),
      hasTemporaryUpload: Object.keys(localStorage).some(key => key.startsWith("up_file_")),
      activeConfig: JSON.parse(localStorage.getItem("sauron_active_consulting_config") || "null"),
    }));
    expect(repaired.version).toBe("3");
    expect(repaired.context.groupId).toBe("group_consultoria");
    expect(repaired.context.companyId).toBe("company_consultoria");
    expect(repaired.hasTemporaryUpload).toBe(false);
    expect(repaired.activeConfig.enabledModules).toEqual(["diagnostico"]);
    expect(repaired.activeConfig.businessAreas).toEqual([]);

    await ensureConsultantSession(page);
    await navigateSidebar(page, /Conectar Dados/i, /Importar Planilhas/i);
    await page.getByRole("button", { name: /^Importar Planilha$/i }).first().click();
    const importer = page.locator("#simple-spreadsheet-importer");
    await expect(importer).toBeVisible({ timeout: 15000 });
    await importer.locator("input[type='file']").first().setInputFiles(filePath);
    await expect(importer.getByText(/Pronto para (importar|configurar)/i).first()).toBeVisible({ timeout: 30000 });
    await importer.locator("#btn-importar-todos").click();
    await expect(importer).toHaveCount(0, { timeout: 30000 });

    await navigateSidebar(page, /Diagnosticar Negócio/i, /Diagnóstico Executivo/i);
    const panel = page.getByTestId("active-dataset-raw-preview");
    await expect(panel).toBeVisible({ timeout: 30000 });
    await expect(panel).toContainText("38,073");
    await expect(page.locator("body")).not.toContainText(/Grupo Nenhum|Workspace Asterior|Possível Receita|Possível Custo|Possível Despesa|Resultado Líquido|Banco de dados não configurado/i);

    const sidebar = page.locator("aside");
    await expect(sidebar.getByRole("button", { name: "Financeiro", exact: true })).toHaveCount(0);
    await expect(sidebar.getByRole("button", { name: "Comercial", exact: true })).toHaveCount(0);
    await expect(sidebar.getByRole("button", { name: "KPIs & DRE", exact: true })).toHaveCount(0);

    await expect(panel).toContainText("Servico A");

    await navigateSidebar(page, /Centro de Comando/i, /Empresas e Grupos/i);
    await page.getByRole("button", { name: /Nova empresa/i }).first().click();
    const companyForm = page.locator("form").filter({ has: page.locator("input[name='name']") }).last();
    await companyForm.locator("input[name='name']").fill("Consultoria Irma");
    await companyForm.getByRole("button", { name: /^Salvar$/i }).click();
    await expect(page.getByText("Consultoria Irma", { exact: true }).first()).toBeAttached({ timeout: 15000 });

    writeWorkbook(secondFilePath, "42,000");
    await navigateSidebar(page, /Conectar Dados/i, /Importar Planilhas/i);
    await page.getByRole("button", { name: /^Importar Planilha$/i }).first().click();
    const secondImporter = page.locator("#simple-spreadsheet-importer");
    await expect(secondImporter).toBeVisible({ timeout: 15000 });
    await secondImporter.locator("input[type='file']").first().setInputFiles(secondFilePath);
    await expect(secondImporter.getByText(/Pronto para (importar|configurar)/i).first()).toBeVisible({ timeout: 30000 });
    const secondSelects = secondImporter.locator("select");
    await secondSelects.nth(0).selectOption({ label: "Grupo Consultoria" });
    await secondSelects.nth(1).selectOption({ label: "Consultoria Irma" });
    await secondImporter.locator("#btn-importar-todos").click();
    await expect(secondImporter).toHaveCount(0, { timeout: 30000 });

    await navigateSidebar(page, /Fontes/i, /Fontes de Dados/i);
    const sourceRow = page.locator("tr").filter({ hasText: "consultoria-todd-recovery.csv" }).first();
    await expect(sourceRow.getByTitle("Abrir como fonte única")).toBeVisible({ timeout: 30000 });
    await sourceRow.getByTitle("Abrir como fonte única").click();
    await expect(page.getByText(/Fonte ativa|Dados ativos|Dados Reais Ativos/i).first()).toBeVisible({ timeout: 30000 });
    await navigateSidebar(page, /Diagnosticar Negócio/i, /Diagnóstico Executivo/i);
    await expect(page.getByTestId("active-dataset-raw-preview")).toContainText("38,073", { timeout: 30000 });
    await navigateSidebar(page, /Preparar Decisão/i, /Decks|Apresentações/i);
    await expect(page.getByText("Configuração Pendente", { exact: true }).first()).toBeVisible({ timeout: 30000 });

    await navigateSidebar(page, /Conduzir Sessão/i, /Preparação da Reunião/i);
    await expect(page.getByText("Preparação da Reunião", { exact: true })).toBeVisible({ timeout: 30000 });
    await page.getByRole("button", { name: /Iniciar Reunião/i }).click();
    await expect(page.locator("#executive-session-root")).toBeVisible({ timeout: 30000 });
    await expect(page.locator("#executive-session-root")).toContainText("Consultoria ToDD", { timeout: 30000 });
    await expect(page.locator("#executive-session-root")).not.toContainText("Contexto não selecionado");
    await page.getByRole("button", { name: /Encerrar Reunião/i }).click();
    await expect(page.getByText(/RESUMO EXECUTIVO DA REUNIÃO/i)).toBeVisible({ timeout: 30000 });
    await page.getByRole("button", { name: /Visualizar Ata/i }).click();
    await expect(page.locator("#printable-ata-area")).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: /Fechar Impressão/i }).click();

    await page.reload({ waitUntil: "domcontentloaded" });
    await ensureConsultantSession(page);
    await navigateSidebar(page, /Diagnosticar Negócio/i, /Diagnóstico Executivo/i);
    await expect(page.getByTestId("active-dataset-raw-preview")).toContainText("38,073");

    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    if (fs.existsSync(secondFilePath)) fs.unlinkSync(secondFilePath);
  });
});
