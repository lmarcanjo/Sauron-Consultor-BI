/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

test('Streamlined Spreadsheet Import, Column Config, and Local Persistence Flow', async ({ page }) => {
  // Catch any window alert automatically to prevent test freeze
  page.on('dialog', async (dialog) => {
    expect(dialog.message()).toContain('Planilha ativada com sucesso');
    await dialog.accept();
  });

  // Go to root page
  await page.goto('/');

  // 1. Open the Conectar Dados tab using its dedicated sidebar button testid
  const openDataBtn = page.locator('[data-testid="btn-open-data-center"]');
  await expect(openDataBtn).toBeVisible();
  await openDataBtn.click();

  // Verify that Central de Dados main content is visible
  await expect(page.locator('text=Gerenciamento Geral de Fontes de Dados')).toBeVisible();

  // Create a realistic mock CSV file with faturamento columns
  const csvContent = [
    "ID,Data,Filial,Receita,Custo,Despesa,Auxiliar,Vendedor",
    "1,2026-01-01,Empresa Alpha,50000,20000,5000,Val A,Lennon Marcanjo",
    "2,2026-02-01,Empresa Beta,60000,25000,6000,Val B,Lennon Marcanjo"
  ].join("\n");

  const csvPath = path.join(__dirname, 'test_simple_import.csv');
  fs.writeFileSync(csvPath, csvContent);

  try {
    // Go to "Importar Planilha" tab
    await page.click('button:has-text("Importar Planilha")');
    await expect(page.locator('text=Arraste seu arquivo de planilha ou clique para selecionar')).toBeVisible();

    // Trigger file chooser and upload the mock CSV file
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('text=Arraste seu arquivo de planilha ou clique para selecionar');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(csvPath);

    // After uploading, we should see the spreadsheet metadata overview
    await expect(page.locator('text=Planilha Carregada')).toBeVisible();
    await expect(page.locator('text=test_simple_import.csv')).toBeVisible();

    // Verify raw preview headers are visible
    await expect(page.locator('th:has-text("Receita")')).toBeVisible();
    await expect(page.locator('th:has-text("Custo")')).toBeVisible();

    // Switch to Optional Columns tab
    await page.click('button:has-text("Configurar Colunas")');

    // Find the input field for column 'Receita' and rename/customize alias
    const aliasInput = page.locator('input[placeholder="Receita"]');
    await expect(aliasInput).toBeVisible();
    await aliasInput.fill('Faturamento Bruto');

    // Click "Usar esta planilha no projeto" button
    const finalizeBtn = page.locator('#btn-finalize-active-spreadsheet-step');
    await expect(finalizeBtn).toBeVisible();
    await finalizeBtn.click();

    // Since finalize saves everything, we should see the active dataset overview card in Tab 0
    await expect(page.locator('#active-spreadsheet-source-card')).toBeVisible();
    await expect(page.locator('text=Fonte de Dados Planilha Ativa')).toBeVisible();
    await expect(page.locator('text=test_simple_import.csv')).toBeVisible();

    // Reload the page and see if reload preserves profile/preview/configuration
    await page.reload();

    // Open "Planilhas" data center panel again
    await page.locator('[data-testid="btn-open-data-center"]').click();

    // Verify active source remains "SPREADSHEET_DATA" and contains our custom metadata
    await expect(page.locator('#active-spreadsheet-source-card')).toBeVisible();
    await expect(page.locator('text=test_simple_import.csv')).toBeVisible();
    await expect(page.locator('text=Faturamento Bruto')).not.toBeVisible(); // unless preview is opened

  } finally {
    // Clean up temporary files
    if (fs.existsSync(csvPath)) {
      fs.unlinkSync(csvPath);
    }
  }
});
