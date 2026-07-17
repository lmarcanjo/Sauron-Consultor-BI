import { expect, ensureConsultantSession, navigateSidebar, openDataCenter, test } from "./e2eTest";
import * as fs from "node:fs";

function makeF19Csv(): string {
  return [
    "Empresa,Unidade,Data,Vendedor,Cliente,Produto,Receita,Custo,Comissao",
    "Empresa F19,Unidade Central,2026-01-15,Ana Lima,Cliente 1,Servico A,1000,500,50",
    "Empresa F19,Unidade Central,2026-01-16,Bruno Reis,Cliente 2,Servico B,2000,900,100",
  ].join("\n");
}

test.describe("F19 - jornada de usabilidade do consultor", () => {
  test("encontra dados, primeira visão, DRE e troca de empresa sem ruído", async ({ page, consoleErrors, consoleWarnings, pageErrors }, testInfo) => {
    const fileName = "f19-consultant-delight.csv";
    const filePath = testInfo.outputPath(fileName);
    fs.writeFileSync(filePath, makeF19Csv());
    const startedAt = Date.now();

    try {
      await page.goto("/");
      await ensureConsultantSession(page);

      await openDataCenter(page);
      const chooserPromise = page.waitForEvent("filechooser");
      await page.getByTestId("btn-drawer-import").click();
      const chooser = await chooserPromise;
      await chooser.setFiles(filePath);
      await expect(page.getByText(fileName, { exact: true }).first()).toBeVisible({ timeout: 30000 });
      await expect(page.getByText(/Dados ativos|Dados Reais Ativos|DADOS REAIS/i).first()).toBeVisible({ timeout: 30000 });

      await page.keyboard.press("Escape");
      const firstInsightStartedAt = Date.now();
      await navigateSidebar(page, /Centro de Comando/i, /Centro de Comando/i);
      await expect(page.getByText(/Próximo passo|Jornada do Consultor|Dados ativos|Preparando/i).first()).toBeVisible({ timeout: 30000 });
      const firstInsightSeconds = (Date.now() - firstInsightStartedAt) / 1000;
      expect(firstInsightSeconds).toBeLessThan(30);

      await navigateSidebar(page, /Diagnosticar Negócio/i, /KPIs & DRE/i);
      await expect(page.getByText(/Resultado financeiro|Configuração pendente|Nenhuma fonte de dados ativa/i).first()).toBeVisible({ timeout: 30000 });
      await expect(page.locator("body")).not.toContainText(/Readiness Score|GROUP SCOPE|Data lineage|Workspace inexistente|binding ausente/i);
      await expect(page.locator("#root")).not.toBeEmpty();
    } finally {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    expect(consoleErrors, "console errors").toEqual([]);
    expect(consoleWarnings, "console warnings").toEqual([]);
    expect(pageErrors, "page errors").toEqual([]);
    expect(Date.now() - startedAt).toBeLessThan(60000);
  });
});
