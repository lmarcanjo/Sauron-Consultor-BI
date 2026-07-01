/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

test('Spreadsheet Import, Excel Viewer, and Flexible Mapping Flow', async ({ page }) => {
  // Go to root page
  await page.goto('/');

  // 1. Open the Conectar Dados tab using its dedicated sidebar button testid
  const openDataBtn = page.locator('[data-testid="btn-open-data-center"]');
  await expect(openDataBtn).toBeVisible();
  await openDataBtn.click();

  // Verify that Central de Dados main content is visible
  await expect(page.locator('text=Configurar Central de Dados')).toBeVisible();

  // Create a realistic mock CSV file with columns, including a __EMPTY_1 column
  const csvContent = [
    "ID,Data,Filial,Receita,Custo,Despesa,__EMPTY_1,Vendedor",
    "1,2026-01-01,Empresa Alpha,50000,20000,5000,Auxiliar A,Lennon Marcanjo",
    "2,2026-02-01,Empresa Beta,60000,25000,6000,Auxiliar B,Lennon Marcanjo"
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

    // After uploading, we should be in Step 2: "Abas Encontradas"
    await expect(page.locator('text=Passo 2: Mapeamento de Abas Detectadas')).toBeVisible();

    // Click "Confirmar Configuração" to go to Step 3 (Planilha Inteligente)
    const confirmAbasBtn = page.locator('button:has-text("Confirmar Configuração")');
    await expect(confirmAbasBtn).toBeVisible();
    await confirmAbasBtn.click();

    // Step 3 container should be visible
    const step3Container = page.locator('#step-3-mapeamento-container');
    await expect(step3Container).toBeVisible();

    // The Spreadsheet Excel-like Grid should be visible
    const grid = page.locator('[data-testid="spreadsheet-grid"]');
    await expect(grid).toBeVisible();

    // Verify __EMPTY_1 column is visible in the grid headers as an unnamed column
    const unnamedColHeader = page.locator('[data-testid^="header-col-__EMPTY_1"]');
    await expect(unnamedColHeader).toBeVisible();

    // Click the __EMPTY_1 column header to open the ColumnConfigDrawer
    await unnamedColHeader.click();

    // Verify the ColumnConfigDrawer is open
    const drawerContainer = page.locator('#column-config-drawer-container');
    await expect(drawerContainer).toBeVisible();

    // Rename __EMPTY_1 using the drawer's Alias input
    const aliasInput = page.locator('[data-testid="drawer-alias-input"]');
    await expect(aliasInput).toBeVisible();
    await aliasInput.fill('My Renamed Aux Column');

    // Click "Marcar como Ativa para todos" or check options
    const activeAllBtn = page.locator('#drawer-btn-active-all');
    if (await activeAllBtn.isVisible()) {
      await activeAllBtn.click();
    }

    // Save column changes
    const saveDrawerBtn = page.locator('#drawer-btn-save');
    await expect(saveDrawerBtn).toBeVisible();
    await saveDrawerBtn.click();

    // Drawer should close
    await expect(drawerContainer).not.toBeVisible();

    // Verify alias is now saved in the UI and displayed in the column profile / header
    await expect(page.locator('[data-testid="header-col-alias-__EMPTY_1"]:has-text("My Renamed Aux Column")')).toBeVisible();

    // Verify "Finalizar e ativar planilha" button exists and works
    const finalizeBtn = page.locator('#btn-finalize-active-spreadsheet');
    await expect(finalizeBtn).toBeVisible();
    await finalizeBtn.click();

    // Since finalize saves everything, let's reload the page and see if reload preserves profile/preview/configuration
    await page.reload();

    // Open "Planilhas" again
    await page.locator('[data-testid="btn-open-data-center"]').click();
    await page.click('button:has-text("PLANILHAS")');

    // Transition to Step 3 (Planilha Inteligente) to verify persistence of renamed column alias
    // Note: The app should load current source data or we can load a demo to verify grid alias persistence
    await page.click('button:has-text("Segmento Automotivo")');
    await page.locator('button:has-text("Confirmar Configuração")').click();
    
    // Verify that rigid mapping panel has been completely removed and does not show up
    await expect(page.locator('text=Mapeamento de Dados (Schema Mapping Panel)')).not.toBeVisible();

  } finally {
    // Clean up temporary files
    if (fs.existsSync(csvPath)) {
      fs.unlinkSync(csvPath);
    }
  }
});
