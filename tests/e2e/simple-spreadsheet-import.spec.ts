/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { openDataCenter, test, expect } from './e2eTest';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test('Streamlined Spreadsheet Import, Column Config, and Local Persistence Flow', async ({ page }) => {
  // Catch any window alert automatically to prevent test freeze
  page.on('dialog', async (dialog) => {
    expect(dialog.message()).toMatch(/Planilha importada com sucesso|Planilha ativada com sucesso/);
    await dialog.accept();
  });

  await page.goto('/');
  await openDataCenter(page);

  // Create a realistic mock CSV file with faturamento columns
  const csvContent = [
    "ID,Data,Unidade,Receita,Custo,Despesa,Auxiliar,Vendedor",
    "1,2026-01-01,Unidade A,50000,20000,5000,Val A,Consultor A",
    "2,2026-02-01,Unidade B,60000,25000,6000,Val B,Consultor B"
  ].join("\n");

  const csvPath = path.join(__dirname, 'test_simple_import.csv');
  fs.writeFileSync(csvPath, csvContent);

  try {
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByTestId('btn-drawer-import').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(csvPath);

    await expect(page.locator('text=test_simple_import.csv').first()).toBeVisible();
    await expect(page.getByText(/Dados ativos|Dados Reais Ativos|DADOS REAIS/i).first()).toBeVisible();

    // Reload the page and see if reload preserves profile/preview/configuration
    await page.reload();
    await openDataCenter(page);
    await expect(page.locator('text=test_simple_import.csv').first()).toBeVisible();

  } finally {
    // Clean up temporary files
    if (fs.existsSync(csvPath)) {
      fs.unlinkSync(csvPath);
    }
  }
});
