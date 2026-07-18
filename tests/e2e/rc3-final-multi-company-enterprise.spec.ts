import { expect, test, type Page } from "@playwright/test";
import * as fs from "node:fs";

function makeSourceCsv(company: string, unit: string, value: number): string {
  return [
    "Empresa,Unidade,Data,Vendedor,Receita",
    `${company},${unit},2026-01-01,Ana,${value}`,
    `${company},${unit},2026-01-02,Bruno,0`,
  ].join("\n");
}

async function startSession(page: Page): Promise<void> {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const firstAccess = page.locator("text=Inicializar Sauron").first();
  if (await firstAccess.isVisible({ timeout: 3000 }).catch(() => false)) {
    await page.fill("input[placeholder='Nome completo']", "Consultor RC3 Final");
    await page.fill("input[placeholder='E-mail corporativo']", "consultor.rc3.final@sauron.local");
    await page.fill("input[placeholder='Senha secreta (mínimo 6 caracteres)']", "SenhaRC3Final!");
    await page.fill("input[placeholder='Confirmar senha']", "SenhaRC3Final!");
    await page.fill("input[placeholder='Nome da sua consultoria / organização']", "Consultoria RC3 Final");
    await page.getByRole("button", { name: /Inicializar/i }).click();
  } else if (await page.locator("input[placeholder='E-mail']").isVisible({ timeout: 1500 }).catch(() => false)) {
    await page.fill("input[placeholder='E-mail']", "consultor.rc3.final@sauron.local");
    await page.fill("input[placeholder='Senha']", "SenhaRC3Final!");
    await page.getByRole("button", { name: /Entrar no Sauron/i }).click();
  }
  await expect(page.locator("aside").first()).toBeVisible({ timeout: 15000 });
}

async function navigate(page: Page, itemName: RegExp | string): Promise<void> {
  const sidebar = page.locator("aside").first();
  const item = sidebar.getByRole("button", { name: itemName }).last();
  await expect(item).toBeVisible({ timeout: 15000 });
  await item.click({ force: true });
}

async function createEntity(page: Page, trigger: RegExp, name: string): Promise<void> {
  await page.getByRole("button", { name: trigger }).first().click();
  const form = page.locator("form").filter({ has: page.locator("input[name='name']") }).last();
  await form.locator("input[name='name']").fill(name);
  await form.getByRole("button", { name: /^Salvar$/i }).click();
  await expect(page.getByText(name, { exact: true }).first()).toBeAttached({ timeout: 15000 });
}

async function importForCompany(page: Page, filePath: string, company: string, unit: string): Promise<void> {
  await navigate(page, /Importar Planilhas/i);
  await page.getByRole("button", { name: /^Importar Planilha$/i }).first().click();
  const importer = page.locator("#simple-spreadsheet-importer");
  await expect(importer).toBeVisible({ timeout: 15000 });
  await importer.locator("input[type='file']").first().setInputFiles(filePath);
  await expect(importer.getByText(/Pronto para (importar|configurar)/i).first()).toBeVisible({ timeout: 30000 });
  const selects = importer.locator("select");
  await selects.nth(0).selectOption({ label: "Grupo RC3 Final" });
  await selects.nth(1).selectOption({ label: company });
  await selects.nth(2).selectOption({ label: unit });
  await importer.locator("#btn-importar-todos").click();
  await expect(importer).toHaveCount(0, { timeout: 30000 });
  await expect(page.getByText(/Dados Reais Conectados|DADOS REAIS/i).first()).toBeVisible({ timeout: 15000 });
}

async function selectCompanyContext(page: Page, companyLabel: string): Promise<void> {
  const selects = page.locator("main select");
  await expect(selects.nth(1)).toBeVisible({ timeout: 15000 });
  await selects.nth(1).selectOption({ label: companyLabel });
  await page.waitForTimeout(600);
}

async function selectGroupContext(page: Page): Promise<void> {
  const selects = page.locator("main select");
  await expect(selects.nth(1)).toBeVisible({ timeout: 15000 });
  await selects.nth(1).selectOption({ value: "all" });
  await expect(selects.nth(1)).toHaveValue("all", { timeout: 5000 });
  await page.waitForTimeout(1200);
}

async function acceptSuggestionsIfPresent(page: Page): Promise<void> {
  const button = page.getByRole("button", { name: /Aceitar sugestões/i }).first();
  if (await button.isVisible({ timeout: 3000 }).catch(() => false)) {
    await button.click();
    await expect(page.getByText(/Sugestões salvas|área\(s\) configurada/i).first()).toBeVisible({ timeout: 15000 });
  }
}

test.describe("RC-3 Final multiempresa e confiança", () => {
  test("isola C, D e E, consolida o grupo e recupera o contexto pela UI", async ({ page }, testInfo) => {
    test.setTimeout(180000);
    const browserMessages: string[] = [];
    page.on("pageerror", error => browserMessages.push(`pageerror: ${error.message}`));
    page.on("console", message => {
      if (message.type() === "error" || message.type() === "warning") browserMessages.push(`${message.type()}: ${message.text()}`);
    });

    const files = [
      { company: "Empresa C RC3", unit: "Unidade C RC3", value: 100, name: "rc3-C.csv" },
      { company: "Empresa D RC3", unit: "Unidade D RC3", value: 200, name: "rc3-D.csv" },
      { company: "Empresa E RC3", unit: "Unidade E RC3", value: 300, name: "rc3-E.csv" },
    ].map(file => {
      const path = testInfo.outputPath(file.name);
      fs.writeFileSync(path, makeSourceCsv(file.company, file.unit, file.value));
      return { ...file, path };
    });

    await startSession(page);
    await navigate(page, /Empresas e Grupos/i);
    if (await page.getByRole("button", { name: /Grupo Empresarial/i }).isVisible({ timeout: 1500 }).catch(() => false)) {
      await createEntity(page, /Grupo Empresarial/i, "Grupo RC3 Final");
    }
    await createEntity(page, /Nova empresa/i, files[0].company);
    await createEntity(page, /Nova unidade/i, files[0].unit);
    await createEntity(page, /Nova empresa/i, files[1].company);
    await createEntity(page, /Nova unidade/i, files[1].unit);
    await createEntity(page, /Nova empresa/i, files[2].company);
    await createEntity(page, /Nova unidade/i, files[2].unit);

    for (const file of files) {
      await importForCompany(page, file.path, file.company, file.unit);
    }

    await navigate(page, /Diagnóstico Executivo/i);
    await selectGroupContext(page);
    await acceptSuggestionsIfPresent(page);
    await expect(page.getByText(/Visão consolidada/i).first()).toBeVisible({ timeout: 30000 });
    await expect(page.getByText(/R\$\s*600,00|600/).first()).toBeVisible({ timeout: 30000 });

    for (const file of files) {
      await selectCompanyContext(page, file.company);
      await acceptSuggestionsIfPresent(page);
      await expect(page.getByRole("heading", { name: new RegExp(`Visão da empresa - ${file.company}`) }).first()).toBeVisible({ timeout: 15000 });
      await expect(page.getByText(new RegExp(`R\\$\\s*${file.value},00|${file.value}`)).first()).toBeVisible({ timeout: 30000 });
      await navigate(page, /KPIs & DRE/i);
      await expect(page.getByText(new RegExp(`R\\$\\s*${file.value},00|${file.value}`)).first()).toBeVisible({ timeout: 30000 });
      await navigate(page, /Diagnóstico Executivo/i);
    }

    await page.reload({ waitUntil: "domcontentloaded" });
    await startSession(page);
    await navigate(page, /Diagnóstico Executivo/i);
    await expect(page.getByText(/Visão da empresa/i).first()).toBeVisible({ timeout: 30000 });
    await expect(page.getByText(/R\$\s*300,00|300/).first()).toBeVisible({ timeout: 30000 });

    await navigate(page, /Biblioteca de Planilhas/i);
    const dCard = page.getByRole("heading", { name: files[1].name, exact: true }).locator("xpath=../..");
    await expect(dCard.getByTitle("Arquivar")).toBeVisible({ timeout: 15000 });
    await dCard.getByTitle("Arquivar").click();
    await expect(dCard.getByTitle("Restaurar")).toBeVisible({ timeout: 15000 });
    await navigate(page, /Diagnóstico Executivo/i);
    await selectGroupContext(page);
    await acceptSuggestionsIfPresent(page);
    await expect(page.getByText(/R\$\s*400,00|400/).first()).toBeVisible({ timeout: 30000 });

    await navigate(page, /Biblioteca de Planilhas/i);
    const archivedD = page.getByRole("heading", { name: files[1].name, exact: true }).locator("xpath=../..");
    await expect(archivedD.getByTitle("Restaurar")).toBeVisible({ timeout: 15000 });
    await archivedD.getByTitle("Restaurar").click();
    await expect(archivedD.getByTitle("Arquivar")).toBeVisible({ timeout: 15000 });
    await navigate(page, /Diagnóstico Executivo/i);
    await selectGroupContext(page);
    await acceptSuggestionsIfPresent(page);
    await expect(page.getByText(/R\$\s*600,00|600/).first()).toBeVisible({ timeout: 30000 });

    await navigate(page, /Biblioteca de Planilhas/i);
    await expect(page.locator("h4").filter({ hasText: /rc3-[CDE]\.csv/ })).toHaveCount(3);
    await expect(page.locator("body")).not.toContainText("up_file_");
    expect(browserMessages, browserMessages.join("\n")).toEqual([]);
  });
});
