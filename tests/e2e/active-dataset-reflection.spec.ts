import { navigateSidebar, openDataCenter, test, expect } from './e2eTest';
import { generateRetailWorkbook } from '../fixtures/generators';

test('Active Dataset Reflection Hotfix Verification Suite › verifies that imported datasets reflect correctly in all modules and persist on reload', async ({ page }, testInfo) => {
  const fixture = await generateRetailWorkbook(testInfo.outputPath('fixture'));
  page.on('dialog', dialog => dialog.accept());

  await page.goto('/');
  await openDataCenter(page);

  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.getByTestId('btn-drawer-import').click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(fixture.filePath);

  await expect(page.getByText(fixture.fileName).first()).toBeVisible({ timeout: 30000 });
  await expect(page.getByText(/FONTE CONECTADA|Dados ativos|Dados Reais Ativos/i).first()).toBeVisible({ timeout: 30000 });
  await page.keyboard.press('Escape');

  await navigateSidebar(page, /Centro de Comando/i, /Centro de Comando/i);
  await expect(page.getByText(/Empresas e Grupos|Fontes de Dados|Fonte ativa/i).first()).toBeVisible();

  await expect(page.locator('aside').getByRole('button', { name: /KPIs & DRE/i })).toHaveCount(0);
  await expect(page.getByText(/Empresas e Grupos|Fontes de Dados|Fonte ativa/i).first()).toBeVisible();

  await page.reload();
  await openDataCenter(page);
  await expect(page.getByText(/FONTE CONECTADA|Dados ativos|Dados Reais Ativos/i).first()).toBeVisible({ timeout: 30000 });
  await expect(page.getByText(fixture.fileName).first()).toBeVisible({ timeout: 30000 });
  await expect(page.getByText(/Demonstração|MOCK DATA/i)).not.toBeVisible();
});
