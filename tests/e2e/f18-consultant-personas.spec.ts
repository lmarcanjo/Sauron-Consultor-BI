import { expect, ensureConsultantSession, navigateSidebar, openDataCenter, test } from "./e2eTest";
import * as fs from "node:fs";
import * as path from "node:path";

function makeConsultantCsv(): string {
  return [
    "Empresa,Unidade,Data,Vendedor,Cliente,Produto,Receita,Custo,Comissao",
    "Empresa Persona,Unidade Central,2026-01-15,Ana Lima,Cliente 1,Servico A,1000,500,50",
    "Empresa Persona,Unidade Central,2026-01-16,Bruno Reis,Cliente 2,Servico B,2000,900,100",
  ].join("\n");
}

async function importCsv(page: Parameters<typeof openDataCenter>[0], filePath: string, fileName: string): Promise<void> {
  await openDataCenter(page);
  const chooserPromise = page.waitForEvent("filechooser");
  await page.getByTestId("btn-drawer-import").click();
  const chooser = await chooserPromise;
  await chooser.setFiles(filePath);
  // The shared import flow can activate and close the modal before the queue
  // row is painted. The durable acceptance signal is the active source state.
  const fileInQueue = page.getByText(fileName, { exact: true }).first();
  const activeSource = page.getByText(/Dados ativos|Dados Reais Ativos|DADOS REAIS/i).first();
  await expect.poll(
    async () => (await fileInQueue.count()) > 0 || (await activeSource.count()) > 0,
    { timeout: 30000 }
  ).toBe(true);
  await expect(activeSource).toBeVisible({ timeout: 30000 });
  await page.keyboard.press("Escape");
}

test.describe("F18 - personas de consultor", () => {
  test("consultor iniciante encontra o primeiro passo sem linguagem tecnica", async ({ page }) => {
    await page.goto("/");
    await ensureConsultantSession(page);

    await navigateSidebar(page, /Centro de Comando/i, /Empresas e Grupos/i);
    await expect(page.getByRole("button", { name: /Grupo Empresarial|Nova empresa/i }).first()).toBeVisible();
    await expect(page.getByText(/Jornada do Consultor|Primeiros passos|Importar Planilhas/i).first()).toBeVisible();
    await page.screenshot({ path: "docs/audits/evidence/F18-01-primeiro-passo.png", fullPage: true });

    const body = await page.locator("body").innerText();
    expect(body).not.toMatch(/Readiness Score|Lineage:|GROUP SCOPE|Central de Dados Sauron/i);
  });

  test("consultor tradicional importa uma fonte real e confirma apenas o necessario", async ({ page }, testInfo) => {
    const fileName = "dados-consultoria.csv";
    const filePath = testInfo.outputPath(fileName);
    fs.writeFileSync(filePath, makeConsultantCsv());

    try {
      await page.goto("/");
      await ensureConsultantSession(page);
      await openDataCenter(page);
      await page.screenshot({ path: "docs/audits/evidence/F18-02-biblioteca-fontes.png", fullPage: true });
      await page.keyboard.press("Escape");
      await importCsv(page, filePath, fileName);

      await navigateSidebar(page, /Centro de Comando/i, /Centro de Comando/i);
      await expect(page.getByText(/Fonte real ativa|Dados Reais|Encontramos estas informações|Sugestões encontradas|Sua visão executiva/i).first()).toBeVisible({ timeout: 30000 });
      await expect(page.getByText(/Configuração inteligente encontrada|Readiness Score|Lineage:/i)).toHaveCount(0);
    } finally {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
  });

  test("consultor senior navega, recarrega e retorna ao mesmo contexto", async ({ page }, testInfo) => {
    const fileName = "fonte-senior.csv";
    const filePath = testInfo.outputPath(fileName);
    fs.writeFileSync(filePath, makeConsultantCsv());

    try {
      await page.goto("/");
      await ensureConsultantSession(page);
      await importCsv(page, filePath, fileName);
      await navigateSidebar(page, /Conectar Dados/i, /Biblioteca de Planilhas/i);
      await expect(page.getByText(/Fontes persistidas do projeto/i).first()).toBeVisible();
      await expect(page.getByText(fileName, { exact: true }).first()).toBeVisible();

      await navigateSidebar(page, /Diagnosticar Negócio/i, /Diagnóstico Executivo/i);
      await expect(page.getByText(/Resumo|Dados reais|Fonte real/i).first()).toBeVisible();
      await page.reload({ waitUntil: "domcontentloaded" });
      await ensureConsultantSession(page);
      await expect(page.getByText(/DADOS REAIS|Fontes persistidas do projeto|Fonte real/i).first()).toBeVisible({ timeout: 15000 });
    } finally {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
  });

  test("persona cliente encontra uma entrada clara quando ainda nao ha fonte", async ({ page }) => {
    await page.goto("/");
    await ensureConsultantSession(page);
    await navigateSidebar(page, /Centro de Comando/i, /Centro de Comando/i);

    await expect(page.getByText(/Nenhuma fonte de dados ativa|Importe uma planilha real|Fontes e Importações/i).first()).toBeVisible();
    const body = await page.locator("body").innerText();
    expect(body).not.toMatch(/DEMO_DATA|Grupo Alpha|Topázio|mock/i);
  });

  test("persona diretor consulta indicadores reais ou pendencias claras", async ({ page }, testInfo) => {
    const fileName = "fonte-diretor.csv";
    const filePath = testInfo.outputPath(fileName);
    fs.writeFileSync(filePath, makeConsultantCsv());

    try {
      await page.goto("/");
      await ensureConsultantSession(page);
      await importCsv(page, filePath, fileName);
      await expect(page.locator("aside").getByRole("button", { name: /KPIs & DRE/i })).toHaveCount(0);
      await expect(page.getByText(/Dados ativos|Fonte real ativa|DADOS REAIS/i).first()).toBeVisible({ timeout: 30000 });
    } finally {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
  });

  test("persona CEO abre a apresentação sem valores demonstrativos", async ({ page }, testInfo) => {
    const fileName = "fonte-ceo.csv";
    const filePath = testInfo.outputPath(fileName);
    fs.writeFileSync(filePath, makeConsultantCsv());

    try {
      await page.goto("/");
      await ensureConsultantSession(page);
      await importCsv(page, filePath, fileName);
      await expect(page.getByText(/Dados ativos|Fonte real ativa|DADOS REAIS/i).first()).toBeVisible({ timeout: 30000 });
      const body = await page.locator("body").innerText();
      expect(body).not.toMatch(/Grupo Alpha|Topázio|DEMO_DATA|mock/i);
    } finally {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
  });
});
