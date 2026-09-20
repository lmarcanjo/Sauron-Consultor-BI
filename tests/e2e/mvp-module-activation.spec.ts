import fs from 'node:fs';
import path from 'node:path';
import { expect, ensureConsultantSession, navigateSidebar, test } from './e2eTest';
import { createCanonicalClientEngagementStructure, importSpreadsheetThroughUi } from './canonicalJourneyHelpers';

test.describe('MVP-2 module activation — zero dead ends', () => {
  test('consultor percorre os módulos com estados e próximos passos reais', async ({ page, consoleErrors, consoleWarnings, pageErrors }) => {
    test.setTimeout(180000);
    const filePath = '/home/natalicorreia/Downloads/Consulta Financeiro Topp.xls';
    expect(fs.existsSync(filePath)).toBe(true);

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await ensureConsultantSession(page);
    await createCanonicalClientEngagementStructure(page, `MVP2_${Date.now()}`);
    await importSpreadsheetThroughUi(page, filePath, path.basename(filePath));

    await navigateSidebar(page, /Análise/i, /Análise da fonte/i);
    await page.getByTestId('chaos-analyze').click();
    await expect(page.getByTestId('preliminary-analysis-panel')).toBeVisible({ timeout: 60000 });

    await navigateSidebar(page, /Diagnosticar/i, /Financeiro/i);
    await expect(page.getByTestId('preliminary-financial-dashboard')).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId('kpi-valor-total')).toContainText('8.668.993,62');
    await expect(page.getByTestId('kpi-valor-pago')).toContainText('32.479,07');
    await expect(page.getByTestId('kpi-saldo')).toContainText('8.636.514,55');
    await expect(page.getByTestId('temporal-series-section')).toBeVisible();
    await expect(page.getByTestId('grouping-section')).toBeVisible();

    await navigateSidebar(page, /Diagnosticar/i, /Comercial/i);
    await expect(page.getByTestId('module-status-commercial')).toBeVisible({ timeout: 30000 });
    await expect(page.getByText(/Dados Insuficientes|Configuração Necessária/i).first()).toBeVisible();
    await expect(page.getByText(/Configuração pendente/i)).toHaveCount(0);
    await expect(page.getByTestId('module-status-commercial')).toContainText('Pessoa');
    await expect(page.getByText('Produto', { exact: true }).first()).toBeVisible();
    await page.getByTestId('module-cta-commercial').click();
    await expect(page.getByTestId('chaos-profiling-panel')).toBeVisible({ timeout: 30000 });

    for (const [label, testId] of [['Estoque', 'inventory'], ['Itens', 'items'], ['Pós-vendas', 'after_sales']] as const) {
      await navigateSidebar(page, /Diagnosticar/i, new RegExp(label, 'i'));
      await expect(page.getByTestId(`module-status-${testId}`)).toBeVisible({ timeout: 30000 });
      await expect(page.getByText(/Dados Insuficientes|Configuração Necessária/i).first()).toBeVisible();
      await page.getByTestId(`module-cta-${testId}`).click();
      await expect(page.getByTestId('chaos-profiling-panel')).toBeVisible({ timeout: 30000 });
    }

    await page.reload({ waitUntil: 'domcontentloaded' });
    await ensureConsultantSession(page);
    await navigateSidebar(page, /Diagnosticar/i, /Financeiro/i);
    await expect(page.getByTestId('preliminary-financial-dashboard')).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId('kpi-valor-total')).toContainText('8.668.993,62');

    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
    expect(consoleWarnings).toEqual([]);
    const visibleText = await page.locator('body').innerText();
    expect(visibleText).not.toMatch(/DEMO_DATA|Grupo Alpha|Topázio Demo/i);
  });
});
