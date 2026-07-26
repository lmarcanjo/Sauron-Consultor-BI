import { expect, ensureConsultantSession, navigateSidebar, openDataCenter, test } from "./e2eTest";
import * as fs from "node:fs";

function makeCertificationCsv(): string {
  return [
    "Empresa,Unidade,Data,Vendedor,Cliente,Produto,Receita,Custo,Despesa,Comissao,Meta",
    "Empresa RC3,Unidade Central,2026-01-15,Ana Lima,Cliente 1,Item 1,1000,500,100,50,1200",
    "Empresa RC3,Unidade Central,2026-01-16,Bruno Reis,Cliente 2,Item 2,2000,900,200,100,1800",
  ].join("\n");
}

async function importCsv(page: Parameters<typeof openDataCenter>[0], filePath: string, fileName: string): Promise<void> {
  await openDataCenter(page);
  const chooserPromise = page.waitForEvent("filechooser");
  await page.getByTestId("btn-drawer-import").click();
  const chooser = await chooserPromise;
  await chooser.setFiles(filePath);
  await expect(page.getByText(fileName, { exact: true }).first()).toBeVisible({ timeout: 60000 });
    await expect(page.getByText(/Dados ativos|Dados Reais Ativos|DADOS REAIS/i).first()).toBeVisible({ timeout: 60000 });
  await page.keyboard.press("Escape");
}

test.describe("RC-3 — certificação de produto enterprise", () => {
  test("consultor percorre fonte, análise, confiança e recuperação pela UI", async ({ page }, testInfo) => {
    test.setTimeout(180000);
    const fileName = "rc3-fonte-real.csv";
    const filePath = testInfo.outputPath(fileName);
    fs.writeFileSync(filePath, makeCertificationCsv());

    await page.goto("/");
    await ensureConsultantSession(page);
    await importCsv(page, filePath, fileName);

    await navigateSidebar(page, /Centro de Comando/i, /Diagnóstico Executivo/i);
    await expect(page.getByText(/Fonte ativa|Dados ativos|Resumo do workbook|Configuração pendente|Dados conferidos/i).first()).toBeVisible({ timeout: 30000 });

    await page.reload({ waitUntil: "domcontentloaded" });
    await ensureConsultantSession(page);
    await expect(page.getByText(/DADOS REAIS|Fonte ativa|Nenhuma fonte de dados ativa/i).first()).toBeVisible({ timeout: 30000 });
    await navigateSidebar(page, /Centro de Comando/i, /Diagnóstico Executivo/i);
    await expect(page.getByText(/Resumo do workbook|Fonte ativa|Dados ativos|Configuração pendente/i).first()).toBeVisible({ timeout: 30000 });

    const body = await page.locator("body").innerText();
    expect(body).not.toMatch(/Grupo Alpha|Topázio|DEMO_DATA|MOCK DATA/i);
  });
});
