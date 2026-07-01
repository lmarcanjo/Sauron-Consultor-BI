/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

test('Spreadsheet Import, Excel Viewer, and Flexible Mapping', async ({ page }) => {
  // Go to root page
  await page.goto('/');

  // 1. Open the Conectar Dados tab using its dedicated sidebar button testid
  const openDataBtn = page.locator('[data-testid="btn-open-data-center"]');
  await expect(openDataBtn).toBeVisible();
  await openDataBtn.click();

  // Verify that Central de Dados main content is visible
  await expect(page.locator('text=Configurar Central de Dados')).toBeVisible();

  // Create a realistic mock CSV file with more than 10 columns (real-life business data)
  const csvContent = [
    "ID,Data,Filial,Receita,Custo,Despesa,Grupo,CNPJ,Marca,Status,Observacao,Auxiliar",
    "1,2026-01-01,Empresa Alpha,50000,20000,5000,Sauron Group,12345678000199,Nike,Ativo,Lancamento de teste,Auxiliar A",
    "2,2026-02-01,Empresa Beta,60000,25000,6000,Sauron Group,12345678000199,Nike,Ativo,Lancamento regular,Auxiliar B",
    "3,2026-03-01,Empresa Gama,70000,30000,7000,Sauron Group,12345678000199,Adidas,Inativo,Revisar contabil,Auxiliar C"
  ].join("\n");

  const csvPath = path.join(__dirname, 'test_business_import.csv');
  fs.writeFileSync(csvPath, csvContent);

  try {
    // Go to "Planilhas" tab to access file upload
    await page.click('button:has-text("PLANILHAS")');
    await expect(page.locator('text=Arraste seus arquivos de planilhas')).toBeVisible();

    // Trigger file chooser and upload the mock CSV file
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('text=Arraste seus arquivos de planilhas');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(csvPath);

    // Verify that the Excel-like Spreadsheet Viewer element renders
    const viewer = page.locator('[data-testid="spreadsheet-viewer"]');
    await expect(viewer).toBeVisible();

    const grid = page.locator('[data-testid="spreadsheet-grid"]');
    await expect(grid).toBeVisible();

    // Verify all columns are present (even extra columns like "Observacao", "Auxiliar")
    await expect(page.locator('[data-testid="spreadsheet-column-header"]:has-text("Observacao")')).toBeVisible();
    await expect(page.locator('[data-testid="spreadsheet-column-header"]:has-text("Auxiliar")')).toBeVisible();

    // Verify cells display data accurately
    await expect(page.locator('[data-testid="spreadsheet-cell"]:has-text("Empresa Alpha")')).toBeVisible();
    await expect(page.locator('[data-testid="spreadsheet-cell"]:has-text("Nike")')).toBeVisible();

    // Click on a column header (e.g. "Receita") to configure it in the drawer
    await page.click('[data-testid="spreadsheet-column-header"]:has-text("Receita")');

    // Drawer should show up
    await expect(page.locator('text=Configurar Coluna')).toBeVisible();
    await expect(page.locator('input[placeholder="Receita"]')).toBeVisible();

    // Close the column drawer
    await page.click('button:has-text("Cancelar")');
    await expect(page.locator('text=Configurar Coluna')).not.toBeVisible();

    // Go to "Mapeamento" tab
    await page.click('button:has-text("MAPEAMENTO")');

    // Verify the Field Selection Panel is visible
    await expect(page.locator('text=Configuração de Atributos e Campos')).toBeVisible();

    // Trigger the "Sugerir Atributos" suggestion engine
    await page.click('button:has-text("Sugerir Atributos")');

    // Click "Salvar Mapeamento" to ensure the configuration profiles are persisted
    await page.click('button:has-text("Salvar Mapeamento")');
    await expect(page.locator('text=Configurações de campos salvas')).toBeVisible();
    
  } finally {
    // Clean up temporary files
    if (fs.existsSync(csvPath)) {
      fs.unlinkSync(csvPath);
    }
  }
});
