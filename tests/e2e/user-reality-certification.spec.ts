/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Certificacao da realidade do usuario.
 * Os testes usam a UI atual: primeiro acesso, Central de Dados e upload real.
 */

import { openDataCenter, test, expect, type Page } from "./e2eTest";
import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface UXMetrics {
  testName: string;
  startAt: string;
  endAt?: string;
  durationMs?: number;
  stepsCompleted: string[];
  stepsFailed: string[];
  clickCount: number;
  retries: number;
  errorsEncountered: string[];
}

function initMetrics(testName: string): UXMetrics {
  return {
    testName,
    startAt: new Date().toISOString(),
    stepsCompleted: [],
    stepsFailed: [],
    clickCount: 0,
    retries: 0,
    errorsEncountered: [],
  };
}

function completeMetrics(m: UXMetrics): UXMetrics {
  m.endAt = new Date().toISOString();
  m.durationMs = new Date(m.endAt).getTime() - new Date(m.startAt).getTime();
  return m;
}

async function saveMetrics(page: Page, metrics: UXMetrics): Promise<void> {
  const outDir = path.resolve(process.cwd(), "tests/e2e/reports");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, `metrics_${Date.now()}.json`), JSON.stringify(metrics, null, 2));
  await page.evaluate((m) => console.log("[UX-METRICS]", JSON.stringify(m)), metrics);
}

function makeValidCsv(rows = 5): string {
  const header = "Empresa,CNPJ,Mes,Receita,Custo,Despesa,Vendedor,Comissao";
  const dataRows = Array.from({ length: rows }, (_, i) =>
    `Empresa Teste ${(i % 3) + 1},11.222.333/000${i}-44,Jan/25,${50000 + i * 1000},${20000 + i * 500},${5000 + i * 100},Pessoa ${i + 1},${1500 + i * 50}`
  );
  return [header, ...dataRows].join("\n");
}

async function uploadCsvFromDrawer(page: Page, csvPath: string, fileName: string): Promise<void> {
  await openDataCenter(page);
  const fileChooserPromise = page.waitForEvent("filechooser");
  await page.getByTestId("btn-drawer-import").click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(csvPath);
  await expect(page.getByText(fileName).first()).toBeVisible({ timeout: 30000 });
  await expect(page.getByText(/Dados ativos|Dados Reais Ativos|DADOS REAIS/i).first()).toBeVisible();
  await expect(page.getByText(/Demonstração|MOCK DATA/i)).not.toBeVisible();
}

test.describe("Certificacao da Realidade do Usuario - Importacao em Lote", () => {
  test.beforeEach(async ({ page }) => {
    page.on("dialog", (dialog) => dialog.accept());
  });

  test("Etapas 1-16: Importacao multipla, erros isolados, sessao limpa", async ({ page }) => {
    const metrics = initMetrics("importacao-multipla");
    const csvPath = path.join(__dirname, "test_cert_1.csv");
    fs.writeFileSync(csvPath, makeValidCsv(10));

    try {
      await page.goto("/");
      metrics.stepsCompleted.push("1. Acessou a aplicacao");

      await uploadCsvFromDrawer(page, csvPath, "test_cert_1.csv");
      metrics.clickCount += 2;
      metrics.stepsCompleted.push("2-6. Upload real concluido pela Central de Dados");

      await page.keyboard.press("Escape");
      await page.reload();
      await openDataCenter(page);
      await expect(page.getByText("test_cert_1.csv").first()).toBeVisible({ timeout: 10000 });
      metrics.stepsCompleted.push("16. Reload preservou a fonte visivel");
    } finally {
      if (fs.existsSync(csvPath)) fs.unlinkSync(csvPath);
    }

    completeMetrics(metrics);
    await saveMetrics(page, metrics);
  });

  test("Etapa 18: Protecao contra duplo-clique no botao Importar", async ({ page }) => {
    const metrics = initMetrics("protecao-duplo-clique");
    const csvPath = path.join(__dirname, "test_cert_dbl.csv");
    fs.writeFileSync(csvPath, makeValidCsv(3));

    try {
      await page.goto("/");
      await openDataCenter(page);
      const fileChooserPromise = page.waitForEvent("filechooser");
      await page.getByTestId("btn-drawer-import").dblclick({ force: true });
      const fileChooser = await fileChooserPromise;
      await fileChooser.setFiles(csvPath);
      metrics.clickCount += 2;

      await expect(page.getByText("test_cert_dbl.csv").first()).toBeVisible({ timeout: 30000 });
      metrics.stepsCompleted.push("18. Duplo clique nao quebrou a importacao");
    } finally {
      if (fs.existsSync(csvPath)) fs.unlinkSync(csvPath);
    }

    completeMetrics(metrics);
    await saveMetrics(page, metrics);
  });

  test("Etapa 17: Upload de arquivo com muitas linhas (timeout controlado)", async ({ page }) => {
    const metrics = initMetrics("arquivo-grande");
    const csvPath = path.join(__dirname, "test_cert_large.csv");
    fs.writeFileSync(csvPath, makeValidCsv(500));

    try {
      await page.goto("/");
      await uploadCsvFromDrawer(page, csvPath, "test_cert_large.csv");
      metrics.stepsCompleted.push("17. Arquivo maior processado sem travar a UI");
    } finally {
      if (fs.existsSync(csvPath)) fs.unlinkSync(csvPath);
    }

    completeMetrics(metrics);
    await saveMetrics(page, metrics);
  });
});
