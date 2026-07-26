import { expect, ensureConsultantSession, navigateSidebar, openDataCenter, test } from "./e2eTest";
import * as fs from "node:fs";
import * as path from "node:path";

function makeCsv(label: string): string {
  return [
    "Empresa,Unidade,Data,Vendedor,Cliente,Produto,Receita,Custo,Comissao",
    `${label},Unidade ${label},2026-01-15,Ana Lima,Cliente 1,Item 1,1000,500,50`,
    `${label},Unidade ${label},2026-01-16,Bruno Reis,Cliente 2,Item 2,2000,900,100`,
  ].join("\n");
}

async function createEntity(page: Parameters<typeof navigateSidebar>[0], trigger: RegExp, name: string): Promise<void> {
  await page.getByRole("button", { name: trigger }).click();
  const form = page.locator("form").filter({ has: page.locator('input[name="name"]') }).last();
  await form.locator('input[name="name"]').fill(name);
  await form.getByRole("button", { name: /^Salvar$/i }).click();
  await expect(page.getByText(name, { exact: true }).first()).toBeAttached({ timeout: 15000 });
}

async function importCsv(page: Parameters<typeof openDataCenter>[0], filePath: string, fileName: string): Promise<void> {
  await openDataCenter(page);
  const chooserPromise = page.waitForEvent("filechooser");
  await page.getByTestId("btn-drawer-import").click();
  const chooser = await chooserPromise;
  await chooser.setFiles(filePath);
  const importButton = page.getByRole("button", { name: /^Importar \d+ arquivo/i }).first();
  if (await importButton.isVisible({ timeout: 30000 }).catch(() => false)) {
    await importButton.click();
  }
  await expect(page.locator("#simple-spreadsheet-importer")).toHaveCount(0, { timeout: 60000 });
  await openDataCenter(page);
  await expect(page.getByText(/Dados ativos|Dados Reais Ativos|DADOS REAIS/i).first()).toBeVisible({ timeout: 30000 });
  await expect(page.getByText(new RegExp(fileName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))).last()).toBeVisible({ timeout: 30000 });
  await page.keyboard.press("Escape");
}

async function saveFirstModuleMapping(page: Parameters<typeof navigateSidebar>[0]): Promise<void> {
  const configure = page.getByRole("button", { name: /Revisar campos/i }).first();
  if (await configure.isVisible({ timeout: 1500 }).catch(() => false)) {
    await configure.click();
    const save = page.getByRole("button", { name: /Confirmar seleção/i }).first();
    await expect(save).toBeEnabled({ timeout: 15000 });
    await save.click();
    await expect(page.getByText(/Campos confirmados/i).first()).toBeVisible({ timeout: 15000 });
  }
}

test.describe("F17.1 — jornada executiva do consultor", () => {
  test("percorre cadastro, fontes, configuração, decisão e recuperação somente pela UI", async ({ page }, testInfo) => {
    test.setTimeout(180000);
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(`pageerror: ${error.message}`));
    page.on("console", message => {
      if (message.type() === "error" || message.type() === "warning") errors.push(`${message.type()}: ${message.text()}`);
    });
    page.on("dialog", dialog => dialog.accept());

    const firstPath = testInfo.outputPath("journey-source-a.csv");
    const secondPath = testInfo.outputPath("journey-source-b.csv");
    fs.writeFileSync(firstPath, makeCsv("Empresa Jornada A"));
    fs.writeFileSync(secondPath, makeCsv("Empresa Jornada B"));

    await page.goto("/");
    await ensureConsultantSession(page);

    await navigateSidebar(page, /Centro de Comando/i, /Empresas e Grupos/i);
    if (await page.getByRole("button", { name: /Grupo Empresarial/i }).isVisible({ timeout: 1500 }).catch(() => false)) {
      await createEntity(page, /Grupo Empresarial/i, "Grupo Jornada F17.1");
    }
    await expect(page.getByRole("button", { name: /Nova empresa/i })).toBeVisible({ timeout: 15000 });
    await createEntity(page, /Nova empresa/i, "Empresa Jornada A");
    await createEntity(page, /Nova unidade/i, "Unidade Jornada A");
    await createEntity(page, /Nova empresa/i, "Empresa Jornada B");
    await createEntity(page, /Nova unidade/i, "Unidade Jornada B");

    await importCsv(page, firstPath, "journey-source-a.csv");
    await importCsv(page, secondPath, "journey-source-b.csv");

    await navigateSidebar(page, /Conectar Dados/i, /Biblioteca de Planilhas/i);
    await expect(page.getByText(/Fontes persistidas do projeto/i).first()).toBeVisible();
    await expect(page.getByText("journey-source-a.csv", { exact: true }).first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("journey-source-b.csv", { exact: true }).first()).toBeVisible({ timeout: 15000 });

    await navigateSidebar(page, /Diagnosticar Negócio/i, /Diagnóstico Executivo/i);
    await expect(page.getByText(/Resumo|Workbook|Nenhuma fonte|Dados reais/i).first()).toBeVisible();

    await navigateSidebar(page, /Conectar Dados/i, /Biblioteca de Planilhas/i);
    const archive = page.locator('button[title="Arquivar"]').first();
    if (await archive.isVisible({ timeout: 1500 }).catch(() => false)) {
      await archive.click();
      const restore = page.locator('button[title="Restaurar"]').first();
      await expect(restore).toBeVisible({ timeout: 10000 });
      await restore.click();
      await expect(page.locator('button[title="Arquivar"]').first()).toBeVisible({ timeout: 10000 });
    }

    await page.reload({ waitUntil: "domcontentloaded" });
    await ensureConsultantSession(page);
    await expect(page.getByText(/DADOS REAIS/i).first()).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(750);
    await navigateSidebar(page, /Centro de Comando/i, /Diagnóstico Executivo/i);
    await expect(page.getByText(/Workbook|Dados reais|Nenhuma fonte/i).first()).toBeVisible({ timeout: 15000 });

    const logout = page.getByRole("button", { name: /Sair/i }).first();
    if (await logout.isVisible({ timeout: 1500 }).catch(() => false)) {
      await logout.click();
      await expect(page.locator("input[placeholder='E-mail']")).toBeVisible({ timeout: 10000 });
      await ensureConsultantSession(page);
    }

    expect(errors, errors.join("\n")).toEqual([]);
    const body = await page.locator("body").innerText();
    expect(body).not.toMatch(/Topázio|Grupo Alpha|MOCK DATA|DEMO_DATA/i);
  });
});
