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

    // Click "Continuar para Configurar Colunas" to go to Step 3 (Mapeamento)
    const confirmAbasBtn = page.locator('button:has-text("Continuar para Configurar Colunas")');
    await expect(confirmAbasBtn).toBeVisible();
    await confirmAbasBtn.click();

    // Step 3 container should be visible
    const step3Container = page.locator('#step-3-mapeamento-container');
    await expect(step3Container).toBeVisible();

    // The Spreadsheet Excel-like Grid should be visible
    const grid = page.locator('[data-testid="spreadsheet-grid"]');
    await expect(grid).toBeVisible();

    // Ensure no pre-populated corporate defaults are in the raw grid for unmapped columns
    const gridHtml = await grid.innerHTML();
    expect(gridHtml).not.toContain("00.000.000/0001-00");
    expect(gridHtml).not.toContain("N/D");
    expect(gridHtml).not.toContain("Outros");
    expect(gridHtml).not.toContain("Sem Categoria");
    expect(gridHtml).not.toContain("Padrão");

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

    // Go to Step 4 "Ativar fonte"
    const nextStepBtn = page.locator('button:has-text("Ir para Ativar Fonte")');
    await expect(nextStepBtn).toBeVisible();
    await nextStepBtn.click();

    // Verify Step 4 "Ativar fonte" content is shown
    await expect(page.locator('text=Pronto para Ativar Fonte de Dados')).toBeVisible();

    // Verify "Finalizar e ativar fonte" button exists and works in step 4
    const finalizeBtn = page.locator('#btn-finalize-active-spreadsheet-step');
    await expect(finalizeBtn).toBeVisible();
    await finalizeBtn.click();

    // Since finalize saves everything, let's reload the page and see if reload preserves profile/preview/configuration
    await page.reload();

    // Open "Planilhas" again
    await page.locator('[data-testid="btn-open-data-center"]').click();
    await page.click('button:has-text("PLANILHAS")');

    // Verify that the active source is SPREADSHEET_DATA
    await expect(page.locator('text=SPREADSHEET_DATA')).toBeVisible();

  } finally {
    // Clean up temporary files
    if (fs.existsSync(csvPath)) {
      fs.unlinkSync(csvPath);
    }
  }
});
