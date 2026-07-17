import { openDataCenter, test, expect } from './e2eTest';
import { generateRetailWorkbook } from '../fixtures/generators';

test.describe('CTO Data Activation Root Cause E2E Verification', () => {
  test('importa planilha, ativa com sucesso, propaga no dashboard e persiste no reload', async ({ page }, testInfo) => {
    const fixture = await generateRetailWorkbook(testInfo.outputPath('fixture'));

    let alertMessage = '';
    page.on('dialog', async dialog => {
      alertMessage = dialog.message();
      await dialog.accept();
    });

    await page.goto('/');
    await openDataCenter(page);
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByTestId('btn-drawer-import').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(fixture.filePath);

    await expect(page.getByText(fixture.fileName).first()).toBeVisible({ timeout: 30000 });
    expect(alertMessage).toMatch(/Planilha importada com sucesso/);

    await page.keyboard.press('Escape');
    await expect(page.getByText(/DADOS REAIS/i).first()).toBeVisible();
    await expect(page.getByText(/Demonstração|MOCK DATA/i)).not.toBeVisible();

    await page.reload();
    await openDataCenter(page);
    await expect(page.getByText(fixture.fileName).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Demonstração|MOCK DATA/i)).not.toBeVisible();
  });
});
