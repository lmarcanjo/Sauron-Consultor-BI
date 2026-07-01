import { test, expect } from '@playwright/test';

test('Spreadsheet Import and Excel-like Viewer Elements Check', async ({ page }) => {
  await page.goto('/');
  
  // Go to Central de Dados
  await page.click('button:has-text("Central de Dados")');
  await expect(page.locator('text=Importação de Planilhas')).toBeVisible();

  // Switch to the 'Planilha Inteligente' or step check
  // Since we might not have uploaded a file yet, let's verify that the tab button for "Salvar Perfil" or other steps exists.
  await expect(page.locator('button:has-text("Planilha Inteligente")')).toBeVisible();
  await expect(page.locator('button:has-text("Avanço Flexível")')).toBeVisible();
  await expect(page.locator('button:has-text("Salvar Perfil")')).toBeVisible();
});
