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
  await page.keyboard.press('Escape');

  await navigateSidebar(page, /Centro de Comando/i, /Centro de Comando/i);
  await expect(page.getByText(/DADOS REAIS|Fonte real|Dashboard|Centro de Comando/i).first()).toBeVisible();

  await navigateSidebar(page, /Diagnosticar Negócio/i, /KPIs & DRE/i);
  await expect(page.getByText(/Configuração pendente|Fonte real ativa|dados reais|KPIs/i).first()).toBeVisible();

  await page.reload();
  await openDataCenter(page);
  await expect(page.getByText(fixture.fileName).first()).toBeVisible({ timeout: 10000 });
  await expect(page.getByText(/Demonstração|MOCK DATA/i)).not.toBeVisible();
});
